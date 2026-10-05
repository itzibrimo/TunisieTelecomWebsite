/**
 * =============================================================================
 * FONCTIONS DE GESTION DES UTILISATEURS
 * =============================================================================
 *
 * Gestion des profils utilisateurs et opérations administratives:
 * - Récupération de profil
 * - Mise à jour de profil
 * - Gestion des rôles (admin seulement)
 * - Suspension/réactivation de comptes
 * - Suppression de comptes
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import Joi from "joi";
import { logAuditEvent } from "../audit/audit-service";
import { hasPermission, UserRole, getRoleLevel } from "../utils/rbac";

const db = admin.firestore();
const auth = admin.auth();

// =============================================================================
// Récupérer le profil utilisateur
// =============================================================================

export const getUserProfile = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;
    const targetUserId = (data.userId as string) || requesterId;

    try {
      // Vérifier les permissions
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      // Seul l'utilisateur lui-même ou un admin peut voir un profil complet
      if (targetUserId !== requesterId && !hasPermission(requesterRole, "view_all_users")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Récupérer le profil
      const userDoc = await db.collection("users").doc(targetUserId).get();

      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Utilisateur introuvable");
      }

      const userData = userDoc.data()!;

      // Récupérer les statistiques de réclamations
      const reclamationsSnapshot = await db
        .collection("reclamations")
        .where("clientId", "==", targetUserId)
        .get();

      const stats = {
        totalReclamations: reclamationsSnapshot.size,
        enAttente: reclamationsSnapshot.docs.filter((doc) => doc.data().statut === "en_attente").length,
        enCours: reclamationsSnapshot.docs.filter((doc) => doc.data().statut === "en_cours").length,
        resolues: reclamationsSnapshot.docs.filter((doc) => doc.data().statut === "resolue").length,
      };

      return {
        success: true,
        profile: {
          id: targetUserId,
          ...userData,
          stats: stats,
        },
      };
    } catch (error) {
      logger.error(`Erreur récupération profil ${targetUserId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la récupération du profil");
    }
  }
);

// =============================================================================
// Mettre à jour le profil utilisateur
// =============================================================================

const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional(),
  phoneNumber: Joi.string().pattern(/^[0-9+\s-()]+$/).optional(),
  photoURL: Joi.string().uri().optional(),
});

export const updateUserProfile = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;

    // Validation
    const { error, value } = updateProfileSchema.validate(data);
    if (error) {
      throw new HttpsError("invalid-argument", `Données invalides: ${error.message}`);
    }

    try {
      // Préparer les données de mise à jour
      const updateData: Record<string, unknown> = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (value.displayName) updateData.displayName = value.displayName;
      if (value.phoneNumber) updateData.phoneNumber = value.phoneNumber;
      if (value.photoURL) updateData.photoURL = value.photoURL;

      // Mettre à jour Firestore
      await db.collection("users").doc(userId).update(updateData);

      // Mettre à jour Firebase Auth si nécessaire
      if (value.displayName || value.photoURL) {
        const authUpdateData: { displayName?: string; photoURL?: string } = {};
        if (value.displayName) authUpdateData.displayName = value.displayName;
        if (value.photoURL) authUpdateData.photoURL = value.photoURL;

        await auth.updateUser(userId, authUpdateData);
      }

      // Logger l'audit
      await logAuditEvent({
        userId: userId,
        action: "user_updated",
        resource: "users",
        resourceId: userId,
        success: true,
        metadata: {
          fields: Object.keys(value),
        },
      });

      logger.info(`Profil mis à jour pour ${userId}`);

      return {
        success: true,
        message: "Profil mis à jour avec succès",
      };
    } catch (error) {
      logger.error(`Erreur mise à jour profil ${userId}:`, error);
      throw new HttpsError("internal", "Erreur lors de la mise à jour du profil");
    }
  }
);

// =============================================================================
// Changer le rôle d'un utilisateur (superadmin seulement)
// =============================================================================

export const changeUserRole = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;
    const { userId: targetUserId, newRole } = data as {
      userId?: string;
      newRole?: string;
    };

    if (!targetUserId || !newRole) {
      throw new HttpsError("invalid-argument", "userId et newRole requis");
    }

    // Valider le rôle
    const validRoles: UserRole[] = [
      "customer", "support", "moderator",
      "admin", "superadmin",
    ];
    if (!validRoles.includes(newRole as UserRole)) {
      throw new HttpsError("invalid-argument", "Rôle invalide");
    }

    try {
      // Vérifier les permissions
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      if (!hasPermission(requesterRole, "change_roles")) {
        throw new HttpsError("permission-denied", "Seuls les superadmins peuvent changer les rôles");
      }

      // Récupérer l'utilisateur cible
      const targetDoc = await db.collection("users").doc(targetUserId).get();
      if (!targetDoc.exists) {
        throw new HttpsError("not-found", "Utilisateur introuvable");
      }

      const targetData = targetDoc.data()!;
      const currentRole = targetData.role as UserRole;

      // Empêcher de changer le rôle d'un utilisateur de niveau supérieur ou égal
      if (getRoleLevel(currentRole) >= getRoleLevel(requesterRole)) {
        throw new HttpsError(
          "permission-denied",
          "Vous ne pouvez pas changer le rôle d'un utilisateur de niveau égal ou supérieur"
        );
      }

      // Mettre à jour le rôle dans Firestore
      await db.collection("users").doc(targetUserId!).update({
        role: newRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Mettre à jour les Custom Claims
      await auth.setCustomUserClaims(targetUserId!, {
        role: newRole,
      });

      // Créer une notification
      await db.collection("notifications").add({
        userId: targetUserId,
        type: "role_changed",
        title: "Rôle modifié",
        message: `Votre rôle a été changé vers "${newRole}".`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          oldRole: currentRole,
          newRole: newRole,
          changedBy: requesterId,
        },
      });

      // Logger l'audit
      await logAuditEvent({
        userId: requesterId,
        action: "role_changed",
        resource: "users",
        resourceId: targetUserId,
        success: true,
        metadata: {
          oldRole: currentRole,
          newRole: newRole,
          targetUser: targetUserId,
        },
      });

      logger.info(`Rôle de ${targetUserId} changé de ${currentRole} vers ${newRole} par ${requesterId}`);

      return {
        success: true,
        message: "Rôle mis à jour avec succès",
        oldRole: currentRole,
        newRole: newRole,
      };
    } catch (error) {
      logger.error(`Erreur changement de rôle pour ${targetUserId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors du changement de rôle");
    }
  }
);

// =============================================================================
// Suspendre un compte utilisateur
// =============================================================================

export const suspendUser = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;
    const { userId: targetUserId, reason } = data as {
      userId?: string;
      reason?: string;
    };

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "userId requis");
    }

    try {
      // Vérifier les permissions
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      if (!hasPermission(requesterRole, "manage_users")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Suspendre dans Firebase Auth
      await auth.updateUser(targetUserId, {
        disabled: true,
      });

      // Mettre à jour Firestore
      await db.collection("users").doc(targetUserId).update({
        accountStatus: "suspended",
        suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
        suspendedBy: requesterId,
        suspensionReason: reason || "Non spécifiée",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Logger l'audit
      await logAuditEvent({
        userId: requesterId,
        action: "user_suspended",
        resource: "users",
        resourceId: targetUserId,
        success: true,
        metadata: {
          reason: reason || "Non spécifiée",
          suspendedBy: requesterId,
        },
      });

      logger.info(`Utilisateur ${targetUserId} suspendu par ${requesterId}`);

      return {
        success: true,
        message: "Utilisateur suspendu avec succès",
      };
    } catch (error) {
      logger.error(`Erreur suspension utilisateur ${targetUserId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la suspension");
    }
  }
);

// =============================================================================
// Réactiver un compte utilisateur suspendu
// =============================================================================

export const reactivateUser = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;
    const { userId: targetUserId } = data as {
      userId?: string;
    };

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "userId requis");
    }

    try {
      // Vérifier les permissions
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      if (!hasPermission(requesterRole, "manage_users")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Réactiver dans Firebase Auth
      await auth.updateUser(targetUserId, {
        disabled: false,
      });

      // Mettre à jour Firestore
      await db.collection("users").doc(targetUserId).update({
        accountStatus: "active",
        reactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        reactivatedBy: requesterId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Créer une notification
      await db.collection("notifications").add({
        userId: targetUserId,
        type: "account_reactivated",
        title: "Compte réactivé",
        message: "Votre compte a été réactivé. Vous pouvez maintenant vous connecter.",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reactivatedBy: requesterId,
        },
      });

      // Logger l'audit
      await logAuditEvent({
        userId: requesterId,
        action: "user_reactivated",
        resource: "users",
        resourceId: targetUserId,
        success: true,
        metadata: {
          reactivatedBy: requesterId,
        },
      });

      logger.info(`Utilisateur ${targetUserId} réactivé par ${requesterId}`);

      return {
        success: true,
        message: "Utilisateur réactivé avec succès",
      };
    } catch (error) {
      logger.error(`Erreur réactivation utilisateur ${targetUserId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la réactivation");
    }
  }
);

// =============================================================================
// Lister tous les utilisateurs (admin seulement)
// =============================================================================

export const listUsers = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;

    try {
      // Vérifier les permissions
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      if (!hasPermission(requesterRole, "view_all_users")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Paramètres de pagination et filtres
      const {
        limit = 50,
        startAfter,
        filterRole,
        filterStatus,
      } = data as {
        limit?: number;
        startAfter?: string;
        filterRole?: string;
        filterStatus?: string;
      };

      // Construire la requête
      let query: admin.firestore.Query = db
        .collection("users")
        .orderBy("createdAt", "desc")
        .limit(Math.min(limit, 100));

      if (filterRole) {
        query = query.where("role", "==", filterRole);
      }
      if (filterStatus) {
        query = query.where("accountStatus", "==", filterStatus);
      }

      // Pagination
      if (startAfter) {
        const startDoc = await db.collection("users").doc(startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      // Exécuter la requête
      const snapshot = await query.get();

      const users = snapshot.docs.map((userDoc) => ({
        id: userDoc.id,
        ...userDoc.data(),
      }));

      logger.info(`${users.length} utilisateurs récupérés par ${requesterId}`);

      return {
        success: true,
        users: users,
        hasMore: users.length === limit,
      };
    } catch (error) {
      logger.error("Erreur récupération liste utilisateurs:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la récupération des utilisateurs");
    }
  }
);
