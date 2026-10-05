/**
 * =============================================================================
 * FONCTIONS D'AUDIT
 * =============================================================================
 *
 * API pour consulter les logs d'audit
 * Accessible uniquement aux admins
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { hasPermission, UserRole } from "../utils/rbac";

const db = admin.firestore();

// =============================================================================
// Récupérer les logs d'audit (avec pagination et filtres)
// =============================================================================

export const getAuditLogs = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;

    try {
      // Vérifier les permissions (admin seulement)
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userRole = (userData?.role as UserRole) || "customer";

      if (!hasPermission(userRole, "view_audit_logs")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Paramètres de pagination et filtres
      const {
        limit = 50,
        startAfter,
        filterUserId,
        filterAction,
        filterResource,
        filterSuccess,
      } = data as {
        limit?: number;
        startAfter?: string;
        filterUserId?: string;
        filterAction?: string;
        filterResource?: string;
        filterSuccess?: boolean;
      };

      // Construire la requête
      let query: admin.firestore.Query = db
        .collection("auditLogs")
        .orderBy("timestamp", "desc")
        .limit(Math.min(limit, 100)); // Max 100 par requête

      // Appliquer les filtres
      if (filterUserId) {
        query = query.where("userId", "==", filterUserId);
      }
      if (filterAction) {
        query = query.where("action", "==", filterAction);
      }
      if (filterResource) {
        query = query.where("resource", "==", filterResource);
      }
      if (filterSuccess !== undefined) {
        query = query.where("success", "==", filterSuccess);
      }

      // Pagination
      if (startAfter) {
        const startDoc = await db.collection("auditLogs").doc(startAfter).get();
        if (startDoc.exists) {
          query = query.startAfter(startDoc);
        }
      }

      // Exécuter la requête
      const snapshot = await query.get();

      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      logger.info(`${logs.length} audit logs récupérés par ${userId}`);

      return {
        success: true,
        logs: logs,
        hasMore: logs.length === limit,
      };
    } catch (error) {
      logger.error("Erreur récupération audit logs:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la récupération des logs");
    }
  }
);

// =============================================================================
// Nettoyage automatique des vieux logs (scheduled function)
// =============================================================================

export const cleanupOldAuditLogs = onSchedule(
  {
    schedule: "0 3 * * 0", // Tous les dimanches à 3h du matin
    timeZone: "Africa/Tunis",
    region: "europe-west1",
  },
  async () => {
    try {
      logger.info("Démarrage du nettoyage des vieux audit logs");

      // Supprimer les logs de plus de 90 jours
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const snapshot = await db
        .collection("auditLogs")
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(500) // Batch de 500
        .get();

      if (snapshot.empty) {
        logger.info("Aucun vieux log à supprimer");
        return;
      }

      // Supprimer en batch
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`${snapshot.size} vieux audit logs supprimés`);
    } catch (error) {
      logger.error("Erreur nettoyage audit logs:", error);
    }
  }
);
