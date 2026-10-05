/**
 * =============================================================================
 * FONCTIONS D'AUTHENTIFICATION
 * =============================================================================
 *
 * Gestion du cycle de vie des utilisateurs:
 * - Création automatique du profil utilisateur après inscription
 * - Envoi d'email de bienvenue
 * - Enregistrement de l'historique de connexion
 * - Nettoyage des données lors de la suppression du compte
 *
 * Sécurité: Utilise Firebase Authentication et Custom Claims pour les rôles
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { logAuditEvent } from "../audit/audit-service";
import { parseUserAgent } from "../utils/user-agent";

const db = admin.firestore();
const auth = admin.auth();

// =============================================================================
// onCreate User - Créer le profil utilisateur dans Firestore
// =============================================================================

export const onUserCreated = onDocumentCreated(
  {
    document: "users/{userId}",
    region: "europe-west1",
  },
  async (event: { params: { userId: string }; data?: { data: () => Record<string, unknown> } }) => {
    const userId = event.params.userId;
    const userData = event.data?.data();

    if (!userData) {
      logger.error(`No data for user ${userId}`);
      return;
    }

    try {
      logger.info(`Creating profile for user ${userId}`);

      // Définir le rôle par défaut (customer)
      await auth.setCustomUserClaims(userId, {
        role: "customer",
      });

      // Créer une notification de bienvenue
      await db.collection("notifications").add({
        userId: userId,
        type: "welcome",
        title: "Bienvenue sur Tunisie Telecom",
        message: `Bonjour ${userData.displayName}, votre compte a été créé avec succès!`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          source: "system",
        },
      });

      // Logger l'événement d'audit
      await logAuditEvent({
        userId: userId,
        action: "user_created",
        resource: "users",
        resourceId: userId,
        success: true,
        metadata: {
          email: userData.email,
          displayName: userData.displayName,
        },
      });

      logger.info(`Profile created successfully for user ${userId}`);
    } catch (error) {
      logger.error(`Error creating profile for user ${userId}:`, error);
    }
  }
);

// =============================================================================
// Enregistrer l'historique de connexion
// =============================================================================

export const recordLoginHistory = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    const { auth: authContext, rawRequest } = request;

    // Vérifier que l'utilisateur est authentifié
    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;
    const userAgent = rawRequest.headers["user-agent"] || "Unknown";
    const ip = rawRequest.headers["x-forwarded-for"] || rawRequest.socket.remoteAddress || "Unknown";

    try {
      // Parser le User-Agent
      const deviceInfo = parseUserAgent(userAgent);

      // Enregistrer dans la sous-collection loginHistory
      await db.collection(`users/${userId}/loginHistory`).add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ip: ip,
        userAgent: userAgent,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        success: true,
      });

      // Mettre à jour lastLoginAt dans le profil utilisateur
      await db.collection("users").doc(userId).update({
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Logger l'audit
      await logAuditEvent({
        userId: userId,
        action: "login",
        resource: "auth",
        success: true,
        ip: ip as string,
        userAgent: userAgent,
        metadata: deviceInfo as unknown as Record<string, unknown>,
      });

      logger.info(`Login history recorded for user ${userId}`);

      return {
        success: true,
        message: "Login history recorded",
      };
    } catch (error) {
      logger.error(`Error recording login history for user ${userId}:`, error);
      throw new HttpsError("internal", "Erreur lors de l'enregistrement de l'historique");
    }
  }
);

// =============================================================================
// Vérifier et envoyer un rappel de vérification d'email
// =============================================================================

export const sendEmailVerificationReminder = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string } }) => {
    const { auth: authContext } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;

    try {
      // Récupérer l'utilisateur depuis Firebase Auth
      const userRecord = await auth.getUser(userId);

      if (userRecord.emailVerified) {
        return {
          success: false,
          message: "Email already verified",
        };
      }

      // Créer une notification de rappel
      await db.collection("notifications").add({
        userId: userId,
        type: "email_verification_reminder",
        title: "Vérifiez votre adresse email",
        message: "N'oubliez pas de vérifier votre adresse email pour profiter de toutes les fonctionnalités.",
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          source: "system",
        },
      });

      logger.info(`Email verification reminder sent to user ${userId}`);

      return {
        success: true,
        message: "Reminder notification created",
      };
    } catch (error) {
      logger.error(`Error sending email verification reminder to user ${userId}:`, error);
      throw new HttpsError("internal", "Erreur lors de l'envoi du rappel");
    }
  }
);

// =============================================================================
// Supprimer un compte utilisateur (cascade delete)
// =============================================================================

export const deleteUserAccount = onCall(
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
      // Vérifier les permissions (seul l'utilisateur lui-même ou un admin peut supprimer)
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = requesterData?.role || "customer";

      const isAdmin = ["admin", "superadmin"].includes(requesterRole);
      const isSelf = requesterId === targetUserId;

      if (!isSelf && !isAdmin) {
        throw new HttpsError("permission-denied", "Vous n'avez pas la permission de supprimer ce compte");
      }

      // Supprimer l'utilisateur de Firebase Auth
      await auth.deleteUser(targetUserId);

      // Supprimer le document utilisateur et toutes les sous-collections
      const userRef = db.collection("users").doc(targetUserId);

      // Supprimer loginHistory
      const loginHistorySnapshot = await userRef.collection("loginHistory").get();
      const loginHistoryBatch = db.batch();
      loginHistorySnapshot.docs.forEach((doc) => {
        loginHistoryBatch.delete(doc.ref);
      });
      await loginHistoryBatch.commit();

      // Anonymiser les réclamations plutôt que de les supprimer
      const reclamationsSnapshot = await db.collection("reclamations")
        .where("clientId", "==", targetUserId)
        .get();

      const reclamationsBatch = db.batch();
      reclamationsSnapshot.docs.forEach((doc) => {
        reclamationsBatch.update(doc.ref, {
          clientNom: "[Compte supprimé]",
          clientEmail: "[supprimé]",
          clientId: "[deleted]",
        });
      });
      await reclamationsBatch.commit();

      // Supprimer les notifications
      const notificationsSnapshot = await db.collection("notifications")
        .where("userId", "==", targetUserId)
        .get();

      const notificationsBatch = db.batch();
      notificationsSnapshot.docs.forEach((doc) => {
        notificationsBatch.delete(doc.ref);
      });
      await notificationsBatch.commit();

      // Finalement, supprimer le document utilisateur
      await userRef.delete();

      // Logger l'audit
      await logAuditEvent({
        userId: requesterId,
        action: "user_deleted",
        resource: "users",
        resourceId: targetUserId,
        success: true,
        metadata: {
          deletedBy: requesterId,
          targetUser: targetUserId,
        },
      });

      logger.info(`User account ${targetUserId} deleted successfully by ${requesterId}`);

      return {
        success: true,
        message: "Account deleted successfully",
      };
    } catch (error) {
      logger.error(`Error deleting user account ${targetUserId}:`, error);
      throw new HttpsError("internal", "Erreur lors de la suppression du compte");
    }
  }
);
