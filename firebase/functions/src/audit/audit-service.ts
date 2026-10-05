/**
 * =============================================================================
 * SERVICE D'AUDIT - Logs immutables
 * =============================================================================
 *
 * Système de journalisation pour tracer toutes les actions critiques
 * Les logs d'audit sont immutables et ne peuvent pas être modifiés
 *
 * Utilisé pour: conformité, sécurité, débug, analytics
 * =============================================================================
 */

import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

const db = admin.firestore();

export interface AuditLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Créer un log d'audit immutable
 * @param {AuditLogData} data - Les données du log d'audit
 */
export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await db.collection("auditLogs").add({
      userId: data.userId,
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId || null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: data.success,
      ip: data.ip || "Unknown",
      userAgent: data.userAgent || "Unknown",
      errorMessage: data.errorMessage || null,
      metadata: data.metadata || {},
    });
  } catch (error) {
    // Ne jamais échouer à cause d'un problème de log
    logger.error("Erreur création audit log:", error);
  }
}

/**
 * Actions d'audit communes
 */
export const AuditActions = {
  // Authentification
  SIGNUP: "signup",
  LOGIN: "login",
  LOGOUT: "logout",
  PASSWORD_RESET: "password_reset",
  EMAIL_VERIFICATION: "email_verification",

  // Utilisateurs
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  USER_SUSPENDED: "user_suspended",
  USER_REACTIVATED: "user_reactivated",
  ROLE_CHANGED: "role_changed",

  // Réclamations
  RECLAMATION_CREATED: "reclamation_created",
  RECLAMATION_UPDATED: "reclamation_updated",
  RECLAMATION_STATUS_UPDATED: "reclamation_status_updated",
  RECLAMATION_ASSIGNED: "reclamation_assigned",

  // Admin
  SETTINGS_UPDATED: "settings_updated",
  BROADCAST_SENT: "broadcast_sent",

  // Système
  BACKUP_CREATED: "backup_created",
  MAINTENANCE_MODE_ENABLED: "maintenance_mode_enabled",
  MAINTENANCE_MODE_DISABLED: "maintenance_mode_disabled",
} as const;
