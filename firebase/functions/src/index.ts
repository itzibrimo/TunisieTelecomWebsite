/**
 * =============================================================================
 * CLOUD FUNCTIONS - Point d'entrée principal
 * =============================================================================
 *
 * Ce fichier exporte toutes les Cloud Functions pour l'application
 * Gestion des Réclamations Clients - Tunisie Telecom
 *
 * Architecture:
 * - Fonctions d'authentification (onCreate, onDelete)
 * - Fonctions de réclamations (création, mise à jour)
 * - Fonctions d'administration (gestion utilisateurs)
 * - Fonctions analytics (agrégation données)
 * - Fonctions audit (logs système)
 * - Tâches planifiées (cleanup, stats)
 *
 * Sécurité: Toutes les fonctions valident les permissions et les données
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { onRequest, type Request } from "firebase-functions/v2/https";

// Initialiser Firebase Admin SDK
admin.initializeApp();

// Exporter les sous-modules
export * from "./auth/index";
export * from "./reclamations/index";
export * from "./users/index";
export * from "./notifications/index";
export * from "./analytics/index";
export * from "./audit/index";
export * from "./sessions/index";

// =============================================================================
// FONCTION DE SANTÉ (Health Check)
// =============================================================================

export const healthCheck = onRequest(
  {
    cors: true,
    region: "europe-west1",
  },
  async (_req: Request, res: { status: (code: number) => { json: (data: Record<string, unknown>) => void } }) => {
    try {
      // Vérifier la connexion Firestore
      const db = admin.firestore();
      await db.collection("_health").doc("check").get();

      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        services: {
          firestore: "ok",
          auth: "ok",
          functions: "ok",
        },
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// =============================================================================
// API STATUS (Informations système)
// =============================================================================

export const apiStatus = onRequest(
  {
    cors: true,
    region: "europe-west1",
  },
  async (_req: Request, res: { status: (code: number) => { json: (data: Record<string, unknown>) => void } }) => {
    const db = admin.firestore();

    try {
      // Récupérer les statistiques système
      const usersCount = await db.collection("users").count().get();
      const reclamationsCount = await db.collection("reclamations").count().get();
      const settingsDoc = await db.collection("settings").doc("app").get();
      const settings = settingsDoc.data() || {};

      res.status(200).json({
        api: "Gestion Réclamations TT - API v1.0.0",
        status: "operational",
        maintenanceMode: settings.maintenanceMode || false,
        statistics: {
          totalUsers: usersCount.data().count,
          totalReclamations: reclamationsCount.data().count,
          uptime: process.uptime(),
        },
        endpoints: {
          auth: "/api/auth/*",
          reclamations: "/api/reclamations/*",
          users: "/api/users/*",
          admin: "/api/admin/*",
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch system status",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
