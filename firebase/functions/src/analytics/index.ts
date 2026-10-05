/**
 * =============================================================================
 * FONCTIONS D'ANALYTICS
 * =============================================================================
 *
 * Agrégation et analyse des données:
 * - Statistiques quotidiennes (scheduled)
 * - Statistiques mensuelles (scheduled)
 * - Dashboard admin avec métriques clés
 * - Rapports d'utilisation
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { hasPermission, UserRole } from "../utils/rbac";

const db = admin.firestore();

// =============================================================================
// Récupérer les statistiques du dashboard admin
// =============================================================================

export const getDashboardStats = onCall(
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
      // Vérifier les permissions
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userRole = (userData?.role as UserRole) || "customer";

      if (!hasPermission(userRole, "view_analytics")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      // Statistiques en temps réel
      const [usersCount, reclamationsCount, reclamationsEnAttente, reclamationsEnCours] =
        await Promise.all([
          db.collection("users").count().get(),
          db.collection("reclamations").count().get(),
          db.collection("reclamations").where("statut", "==", "en_attente").count().get(),
          db.collection("reclamations").where("statut", "==", "en_cours").count().get(),
        ]);

      // Réclamations récentes (7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentReclamations = await db
        .collection("reclamations")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .count()
        .get();

      // Nouveaux utilisateurs (7 derniers jours)
      const newUsers = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(sevenDaysAgo))
        .count()
        .get();

      // Statistiques par type de réclamation
      const reclamationsSnapshot = await db.collection("reclamations").get();

      const statsByType: Record<string, number> = {};
      const statsByStatus: Record<string, number> = {};

      reclamationsSnapshot.docs.forEach((doc) => {
        const recData = doc.data();
        statsByType[recData.type as string] = (statsByType[recData.type as string] || 0) + 1;
        statsByStatus[recData.statut as string] = (statsByStatus[recData.statut as string] || 0) + 1;
      });

      // Calculer le taux de résolution
      const totalReclamations = reclamationsCount.data().count;
      const resolvedCount = statsByStatus["resolue"] || 0;
      const resolutionRate =
        totalReclamations > 0 ? ((resolvedCount / totalReclamations) * 100).toFixed(1) : "0.0";

      return {
        success: true,
        stats: {
          totalUsers: usersCount.data().count,
          totalReclamations: totalReclamations,
          reclamationsEnAttente: reclamationsEnAttente.data().count,
          reclamationsEnCours: reclamationsEnCours.data().count,
          reclamationsResolues: resolvedCount,
          newUsersLast7Days: newUsers.data().count,
          newReclamationsLast7Days: recentReclamations.data().count,
          resolutionRate: parseFloat(resolutionRate),
          statsByType: statsByType,
          statsByStatus: statsByStatus,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Erreur récupération statistiques dashboard:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la récupération des statistiques");
    }
  }
);

// =============================================================================
// Agrégation quotidienne des statistiques (scheduled)
// =============================================================================

export const aggregateDailyStats = onSchedule(
  {
    schedule: "0 1 * * *", // Tous les jours à 1h du matin
    timeZone: "Africa/Tunis",
    region: "europe-west1",
  },
  async () => {
    try {
      logger.info("Démarrage de l'agrégation quotidienne des statistiques");

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date(yesterday);
      today.setDate(today.getDate() + 1);

      const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

      // Compter les nouveaux utilisateurs
      const newUsersSnapshot = await db
        .collection("users")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(today))
        .count()
        .get();

      // Compter les nouvelles réclamations
      const newReclamationsSnapshot = await db
        .collection("reclamations")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(today))
        .count()
        .get();

      // Compter les réclamations résolues
      const resolvedReclamationsSnapshot = await db
        .collection("reclamations")
        .where("resolvedAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("resolvedAt", "<", admin.firestore.Timestamp.fromDate(today))
        .count()
        .get();

      // Compter les logins
      const loginsSnapshot = await db
        .collectionGroup("loginHistory")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(today))
        .count()
        .get();

      // Total des utilisateurs actifs (ont une action ce jour-là)
      const activeUsersSnapshot = await db
        .collection("auditLogs")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(today))
        .get();

      const uniqueActiveUsers = new Set(activeUsersSnapshot.docs.map((doc) => doc.data().userId));

      // Enregistrer les statistiques
      await db
        .collection("analytics")
        .doc(`daily_${dateStr}`)
        .set({
          date: dateStr,
          newUsers: newUsersSnapshot.data().count,
          activeUsers: uniqueActiveUsers.size,
          totalLogins: loginsSnapshot.data().count,
          reclamationsCreated: newReclamationsSnapshot.data().count,
          reclamationsResolved: resolvedReclamationsSnapshot.data().count,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info(`Statistiques quotidiennes agrégées pour ${dateStr}`);
      logger.info(`- Nouveaux utilisateurs: ${newUsersSnapshot.data().count}`);
      logger.info(`- Utilisateurs actifs: ${uniqueActiveUsers.size}`);
      logger.info(`- Réclamations créées: ${newReclamationsSnapshot.data().count}`);
      logger.info(`- Réclamations résolues: ${resolvedReclamationsSnapshot.data().count}`);
    } catch (error) {
      logger.error("Erreur agrégation statistiques quotidiennes:", error);
    }
  }
);

// =============================================================================
// Agrégation mensuelle des statistiques (scheduled)
// =============================================================================

export const aggregateMonthlyStats = onSchedule(
  {
    schedule: "0 2 1 * *", // Le 1er de chaque mois à 2h du matin
    timeZone: "Africa/Tunis",
    region: "europe-west1",
  },
  async () => {
    try {
      logger.info("Démarrage de l'agrégation mensuelle des statistiques");

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const monthStr = lastMonth.toISOString().substring(0, 7); // YYYY-MM

      const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
      const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1);

      // Total utilisateurs à la fin du mois
      const totalUsersSnapshot = await db
        .collection("users")
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(monthEnd))
        .count()
        .get();

      // Réclamations créées durant le mois
      const reclamationsCreatedSnapshot = await db
        .collection("reclamations")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(monthStart))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(monthEnd))
        .get();

      // Réclamations résolues durant le mois
      const reclamationsResolvedSnapshot = await db
        .collection("reclamations")
        .where("resolvedAt", ">=", admin.firestore.Timestamp.fromDate(monthStart))
        .where("resolvedAt", "<", admin.firestore.Timestamp.fromDate(monthEnd))
        .get();

      // Calculer le temps moyen de résolution
      let totalResolutionTime = 0;
      let resolvedCount = 0;

      reclamationsResolvedSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.createdAt && data.resolvedAt) {
          const created = data.createdAt.toDate();
          const resolved = data.resolvedAt.toDate();
          const diffHours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          totalResolutionTime += diffHours;
          resolvedCount++;
        }
      });

      const avgResolutionTimeHours =
        resolvedCount > 0 ? totalResolutionTime / resolvedCount : 0;

      // Utilisateurs actifs du mois
      const activeUsersSnapshot = await db
        .collection("auditLogs")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(monthStart))
        .where("timestamp", "<", admin.firestore.Timestamp.fromDate(monthEnd))
        .get();

      const uniqueActiveUsers = new Set(activeUsersSnapshot.docs.map((doc) => doc.data().userId));

      // Enregistrer les statistiques mensuelles
      await db
        .collection("analytics")
        .doc(`monthly_${monthStr}`)
        .set({
          month: monthStr,
          totalUsers: totalUsersSnapshot.data().count,
          activeUsers: uniqueActiveUsers.size,
          reclamationsCreated: reclamationsCreatedSnapshot.size,
          reclamationsResolved: reclamationsResolvedSnapshot.size,
          avgResolutionTimeHours: Math.round(avgResolutionTimeHours * 10) / 10,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info(`Statistiques mensuelles agrégées pour ${monthStr}`);
      logger.info(`- Total utilisateurs: ${totalUsersSnapshot.data().count}`);
      logger.info(`- Utilisateurs actifs: ${uniqueActiveUsers.size}`);
      logger.info(`- Réclamations créées: ${reclamationsCreatedSnapshot.size}`);
      logger.info(`- Réclamations résolues: ${reclamationsResolvedSnapshot.size}`);
      logger.info(`- Temps moyen résolution: ${avgResolutionTimeHours.toFixed(1)}h`);
    } catch (error) {
      logger.error("Erreur agrégation statistiques mensuelles:", error);
    }
  }
);

// =============================================================================
// Récupérer les statistiques historiques
// =============================================================================

export const getHistoricalStats = onCall(
  {
    region: "europe-west1",
  },
  async (request: { auth?: { uid: string }; data: Record<string, unknown> }) => {
    const { auth: authContext, data } = request;

    if (!authContext) {
      throw new HttpsError("unauthenticated", "Utilisateur non authentifié");
    }

    const userId = authContext.uid;
    const { period = "daily", limit = 30 } = data as { period?: string; limit?: number }; // daily ou monthly

    try {
      // Vérifier les permissions
      const userDoc = await db.collection("users").doc(userId).get();
      const userData = userDoc.data();
      const userRole = (userData?.role as UserRole) || "customer";

      if (!hasPermission(userRole, "view_analytics")) {
        throw new HttpsError("permission-denied", "Permission insuffisante");
      }

      const prefix = period === "monthly" ? "monthly_" : "daily_";

      const snapshot = await db
        .collection("analytics")
        .where(admin.firestore.FieldPath.documentId(), ">=", prefix)
        .where(admin.firestore.FieldPath.documentId(), "<=", `${prefix}\uf8ff`)
        .orderBy(admin.firestore.FieldPath.documentId(), "desc")
        .limit(Math.min(limit, 90))
        .get();

      const stats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        period: period,
        stats: stats,
      };
    } catch (error) {
      logger.error("Erreur récupération statistiques historiques:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Erreur lors de la récupération des statistiques");
    }
  }
);
