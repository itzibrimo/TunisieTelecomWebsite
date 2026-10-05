/**
 * =============================================================================
 * FONCTIONS DE GESTION DES RÉCLAMATIONS
 * =============================================================================
 *
 * Gestion complète du cycle de vie des réclamations:
 * - Création avec validation côté serveur
 * - Mise à jour du statut avec contrôle des permissions
 * - Assignment aux techniciens
 * - Notifications automatiques aux clients
 *
 * Sécurité: Validation stricte des données et vérification des permissions RBAC
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import Joi from "joi";
import { logAuditEvent } from "../audit/audit-service";
import { hasPermission, UserRole } from "../utils/rbac";

const db = admin.firestore();

// =============================================================================
// Schémas de validation Joi
// =============================================================================

const createReclamationSchema = Joi.object({
  type: Joi.string().valid(
    "panne_internet",
    "panne_ligne_fixe",
    "facturation",
    "autre"
  ).required(),
  description: Joi.string().min(10).max(2000).required(),
  priority: Joi.string().valid("basse", "normale", "haute", "critique").default("normale"),
});

const updateStatusSchema = Joi.object({
  reclamationId: Joi.string().required(),
  newStatus: Joi.string().valid(
    "en_attente",
    "en_cours",
    "resolue",
    "fermee"
  ).required(),
  notes: Joi.string().max(1000).optional(),
});

// =============================================================================
// Créer une nouvelle réclamation
// =============================================================================

export const createReclamation = onCall(
  {
    region: "europe-west1",
    maxInstances: 10,
  },
  async (request: {
    auth?: { uid: string };
    data: Record<string, unknown>;
    rawRequest: {
      headers: Record<string, string | string[] | undefined>;
    };
  }) => {
    const { auth: authContext, data, rawRequest } = request;

    // Vérification authentification
    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;

    // Validation des données
    const { error, value } = createReclamationSchema.validate(data);
    if (error) {
      throw new HttpsError("invalid-argument", `Données invalides: ${error.message}`);
    }

    try {
      // Récupérer les informations utilisateur
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "Profil utilisateur introuvable");
      }

      const userData = userDoc.data()!;

      // Vérifier que le compte n'est pas suspendu
      if (userData.accountStatus === "suspended") {
        throw new HttpsError("permission-denied", "Votre compte est suspendu");
      }

      // Créer la réclamation
      const reclamationData = {
        clientId: userId,
        clientNom: userData.displayName || "Utilisateur",
        clientEmail: userData.email || "",
        type: value.type,
        description: value.description,
        statut: "en_attente",
        priority: value.priority || "normale",
        assignedTo: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedAt: null,
        attachments: [],
        metadata: {
          source: "mobile_app",
          userAgent: rawRequest.headers["user-agent"] || "Unknown",
        },
      };

      const reclamationRef = await db.collection("reclamations").add(reclamationData);

      // Créer une notification pour l'utilisateur
      await db.collection("notifications").add({
        userId: userId,
        type: "reclamation_created",
        title: "Réclamation créée",
        message: `Votre réclamation #${reclamationRef.id.substring(0, 8)} a été créée avec succès.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reclamationId: reclamationRef.id,
          type: value.type,
        },
      });

      // Logger l'audit
      await logAuditEvent({
        userId: userId,
        action: "reclamation_created",
        resource: "reclamations",
        resourceId: reclamationRef.id,
        success: true,
        metadata: {
          type: value.type,
          priority: value.priority,
        },
      });

      // Incrémenter les statistiques du jour
      await incrementDailyStats("reclamationsCreated");

      logger.info(`Réclamation ${reclamationRef.id} créée par ${userId}`);

      return {
        success: true,
        reclamationId: reclamationRef.id,
        message: "Réclamation créée avec succès",
      };
    } catch (error) {
      logger.error(`Erreur création réclamation pour ${userId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la création de la réclamation");
    }
  }
);

// =============================================================================
// Mettre à jour le statut d'une réclamation
// =============================================================================

export const updateReclamationStatus = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;

    // Validation des données
    const { error, value } = updateStatusSchema.validate(data);
    if (error) {
      throw new HttpsError("invalid-argument", `Données invalides: ${error.message}`);
    }

    const { reclamationId, newStatus, notes } = value as { reclamationId: string; newStatus: string; notes?: string };

    try {
      // Récupérer le profil utilisateur pour vérifier les permissions
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userRole = (userData?.role as UserRole) || "customer";

      // Récupérer la réclamation
      const reclamationRef = db.collection("reclamations").doc(reclamationId);
      const reclamationDoc = await reclamationRef.get();

      if (!reclamationDoc.exists) {
        throw new HttpsError("not-found", "Réclamation introuvable");
      }

      const reclamationData = reclamationDoc.data()!;

      // Vérifier les permissions
      // Les clients ne peuvent pas changer le statut
      // Support/Moderator/Admin peuvent changer le statut
      if (!hasPermission(userRole, "manage_reclamations")) {
        // Exception: le client peut marquer sa propre réclamation comme fermée
        if (reclamationData.clientId === userId && newStatus === "fermee") {
          // Autorisé
        } else {
          throw new HttpsError(
            "permission-denied",
            "Vous n'avez pas la permission de modifier le statut"
          );
        }
      }

      // Préparer la mise à jour
      const updateData: Record<string, unknown> = {
        statut: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Si le statut est "résolue", enregistrer le timestamp
      if (newStatus === "resolue" && reclamationData.statut !== "resolue") {
        updateData.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
        await incrementDailyStats("reclamationsResolved");
      }

      // Si assignation automatique pour "en_cours"
      if (newStatus === "en_cours" && !reclamationData.assignedTo) {
        updateData.assignedTo = userId;
      }

      // Mettre à jour la réclamation
      await reclamationRef.update(updateData);

      // Créer une notification pour le client
      await db.collection("notifications").add({
        userId: reclamationData.clientId,
        type: "status_changed",
        title: "Statut mis à jour",
        message: `Votre réclamation #${reclamationId.substring(0, 8)} est maintenant "${newStatus}".`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reclamationId: reclamationId,
          oldStatus: reclamationData.statut,
          newStatus: newStatus,
          notes: notes || null,
        },
      });

      // Logger l'audit
      await logAuditEvent({
        userId: userId,
        action: "reclamation_status_updated",
        resource: "reclamations",
        resourceId: reclamationId,
        success: true,
        metadata: {
          oldStatus: reclamationData.statut,
          newStatus: newStatus,
          updatedBy: userId,
          notes: notes || null,
        },
      });

      logger.info(`Réclamation ${reclamationId} statut changé vers ${newStatus} par ${userId}`);

      return {
        success: true,
        message: "Statut mis à jour avec succès",
        newStatus: newStatus,
      };
    } catch (error) {
      logger.error(`Erreur mise à jour statut réclamation ${reclamationId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la mise à jour du statut");
    }
  }
);

// =============================================================================
// Assigner une réclamation à un technicien
// =============================================================================

export const assignReclamation = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;
    const { reclamationId, technicianId } = data as { reclamationId?: string; technicianId?: string };

    if (!reclamationId || !technicianId) {
      throw new HttpsError("invalid-argument", "reclamationId et technicianId requis");
    }

    try {
      // Vérifier les permissions (seulement moderator et admin)
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userRole = (userData?.role as UserRole) || "customer";

      if (!hasPermission(userRole, "assign_reclamations")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Vérifier que le technicien existe et a le bon rôle
      const technicianDoc = await db.collection("users").doc(technicianId).get();
      if (!technicianDoc.exists) {
        throw new HttpsError("not-found", "Technicien introuvable");
      }

      const technicianData = technicianDoc.data()!;
      const technicianRole = technicianData.role;

      if (!["support", "moderator", "admin", "superadmin"].includes(technicianRole)) {
        throw new HttpsError("invalid-argument", "L'utilisateur sélectionné n'est pas un technicien");
      }

      // Assigner la réclamation
      await db.collection("reclamations").doc(reclamationId).update({
        assignedTo: technicianId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notifier le technicien
      await db.collection("notifications").add({
        userId: technicianId,
        type: "reclamation_assigned",
        title: "Nouvelle réclamation assignée",
        message: `La réclamation #${reclamationId.substring(0, 8)} vous a été assignée.`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          reclamationId: reclamationId,
          assignedBy: userId,
        },
      });

      // Logger l'audit
      await logAuditEvent({
        userId: userId,
        action: "reclamation_assigned",
        resource: "reclamations",
        resourceId: reclamationId,
        success: true,
        metadata: {
          technicianId: technicianId,
          assignedBy: userId,
        },
      });

      logger.info(`Réclamation ${reclamationId} assignée à ${technicianId}`);

      return {
        success: true,
        message: "Réclamation assignée avec succès",
      };
    } catch (error) {
      logger.error(`Erreur assignation réclamation ${reclamationId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de l'assignation");
    }
  }
);

// =============================================================================
// Trigger: Notification automatique lors de mise à jour de statut
// =============================================================================

export const onReclamationUpdated = onDocumentUpdated(
  {
    document: "reclamations/{reclamationId}",
    region: "europe-west1",
  },
  async (event) => {
    const before = event.data?.before.data() as Record<string, unknown> | undefined;
    const after = event.data?.after.data() as Record<string, unknown> | undefined;

    if (!before || !after) {
      return;
    }

    // Vérifier si le statut a changé
    if (before.statut !== after.statut) {
      logger.info(
        `Réclamation ${event.params.reclamationId} statut changé: ${before.statut} → ${after.statut}`
      );

      // La notification est déjà créée dans updateReclamationStatus
      // On pourrait ajouter ici d'autres actions comme l'envoi d'emails
    }
  }
);

// =============================================================================
// Fonction utilitaire pour incrémenter les stats quotidiennes
// =============================================================================

async function incrementDailyStats(field: string) {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const statsRef = db.collection("analytics").doc(`daily_${today}`);

    await statsRef.set(
      {
        date: today,
        [field]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    logger.error(`Erreur incrémentation stats ${field}:`, error);
  }
}
