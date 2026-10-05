/**
 * =============================================================================
 * FONCTIONS DE NOTIFICATIONS
 * =============================================================================
 *
 * Gestion du système de notifications push et in-app:
 * - Récupération des notifications utilisateur
 * - Marquer comme lu
 * - Broadcast admin (envoyer à tous)
 * - Nettoyage automatique des vieilles notifications
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { hasPermission, UserRole } from "../utils/rbac";
import { logAuditEvent } from "../audit/audit-service";

const db = admin.firestore();

// =============================================================================
// Récupérer les notifications d'un utilisateur
// =============================================================================

export const getUserNotifications = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;
    const { limit = 20, unreadOnly = false } = data as { limit?: number; unreadOnly?: boolean };

    try {
      let query: admin.firestore.Query = db
        .collection("notifications")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(Math.min(limit, 100));

      if (unreadOnly) {
        query = query.where("read", "==", false);
      }

      const snapshot = await query.get();

      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let unreadCount: number;
      if (unreadOnly) {
        unreadCount = notifications.length;
      } else {
        const countSnap = await db
          .collection("notifications")
          .where("userId", "==", userId)
          .where("read", "==", false)
          .count()
          .get();
        unreadCount = countSnap.data().count;
      }

      return {
        success: true,
        notifications: notifications,
        unreadCount: unreadCount,
      };
    } catch (error) {
      logger.error(`Erreur récupération notifications pour ${userId}:`, error);
      throw new HttpsError("internal", "Erreur lors de la récupération des notifications");
    }
  }
);

// =============================================================================
// Marquer une notification comme lue
// =============================================================================

export const markNotificationAsRead = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;
    const { notificationId } = data as { notificationId?: string };

    if (!notificationId) {
      throw new HttpsError("invalid-argument", "notificationId requis");
    }

    try {
      const notifRef = db.collection("notifications").doc(notificationId);
      const notifDoc = await notifRef.get();

      if (!notifDoc.exists) {
        throw new HttpsError("not-found", "Notification introuvable");
      }

      const notifData = notifDoc.data()!;

      // Vérifier que la notification appartient à l'utilisateur
      if (notifData.userId !== userId) {
        throw new HttpsError("permission-denied", "Cette notification ne vous appartient pas");
      }

      // Marquer comme lue
      await notifRef.update({
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        message: "Notification marquée comme lue",
      };
    } catch (error) {
      logger.error(`Erreur marquage notification ${notificationId}:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors du marquage de la notification");
    }
  }
);

// =============================================================================
// Marquer toutes les notifications comme lues
// =============================================================================

export const markAllNotificationsAsRead = onCall(
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
      const snapshot = await db
        .collection("notifications")
        .where("userId", "==", userId)
        .where("read", "==", false)
        .get();

      if (snapshot.empty) {
        return {
          success: true,
          message: "Aucune notification à marquer",
          count: 0,
        };
      }

      // Mettre à jour en batch
      const batch = db.batch();
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      snapshot.docs.forEach((notifDoc) => {
        batch.update(notifDoc.ref, {
          read: true,
          readAt: timestamp,
        });
      });

      await batch.commit();

      logger.info(`${snapshot.size} notifications marquées comme lues pour ${userId}`);

      return {
        success: true,
        message: "Toutes les notifications ont été marquées comme lues",
        count: snapshot.size,
      };
    } catch (error) {
      logger.error(`Erreur marquage toutes notifications pour ${userId}:`, error);
      throw new HttpsError("internal", "Erreur lors du marquage des notifications");
    }
  }
);

// =============================================================================
// Broadcast: Envoyer une notification à tous les utilisateurs (admin seulement)
// =============================================================================

export const broadcastNotification = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const requesterId = authContext.uid;
    const { title, message, targetRole } = data as { title?: string; message?: string; targetRole?: string };

    if (!title || !message) {
      throw new HttpsError("invalid-argument", "title et message requis");
    }

    try {
      // Vérifier les permissions (admin seulement)
      const requesterDoc = await db.collection("users").doc(requesterId).get();
      const requesterData = requesterDoc.data();
      const requesterRole = (requesterData?.role as UserRole) || "customer";

      if (!hasPermission(requesterRole, "manage_users")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Récupérer les utilisateurs cibles
      let usersQuery: admin.firestore.Query = db.collection("users");

      if (targetRole && targetRole !== "all") {
        usersQuery = usersQuery.where("role", "==", targetRole);
      }

      const usersSnapshot = await usersQuery.get();

      if (usersSnapshot.empty) {
        return {
          success: true,
          message: "Aucun utilisateur cible trouvé",
          count: 0,
        };
      }

      // Créer les notifications en batch
      const batch = db.batch();
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      usersSnapshot.docs.forEach((userDoc) => {
        const notifRef = db.collection("notifications").doc();
        batch.set(notifRef, {
          userId: userDoc.id,
          type: "broadcast",
          title: title,
          message: message,
          read: false,
          createdAt: timestamp,
          metadata: {
            source: "admin_broadcast",
            sentBy: requesterId,
          },
        });
      });

      await batch.commit();

      // Logger l'audit
      await logAuditEvent({
        userId: requesterId,
        action: "broadcast_sent",
        resource: "notifications",
        success: true,
        metadata: {
          title: title,
          targetRole: targetRole || "all",
          recipientsCount: usersSnapshot.size,
        },
      });

      logger.info(`Broadcast envoyé à ${usersSnapshot.size} utilisateurs par ${requesterId}`);

      return {
        success: true,
        message: "Notification broadcast envoyée",
        count: usersSnapshot.size,
      };
    } catch (error) {
      logger.error("Erreur broadcast notification:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de l'envoi du broadcast");
    }
  }
);

// =============================================================================
// Nettoyage automatique des vieilles notifications (scheduled)
// =============================================================================

export const cleanupOldNotifications = onSchedule(
  {
    schedule: "0 2 * * *", // Tous les jours à 2h du matin
    timeZone: "Africa/Tunis",
    region: "europe-west1",
  },
  async () => {
    try {
      logger.info("Démarrage du nettoyage des vieilles notifications");

      // Supprimer les notifications lues de plus de 30 jours
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);

      const snapshot = await db
        .collection("notifications")
        .where("read", "==", true)
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(cutoffDate))
        .limit(500)
        .get();

      if (snapshot.empty) {
        logger.info("Aucune vieille notification à supprimer");
        return;
      }

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      logger.info(`${snapshot.size} vieilles notifications supprimées`);
    } catch (error) {
      logger.error("Erreur nettoyage notifications:", error);
    }
  }
);
