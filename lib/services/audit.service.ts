import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from "firebase/firestore";
import { getFirebaseDb } from "../firebase";

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.login_failed"
  | "user.password_change"
  | "user.email_change"
  | "user.2fa_enable"
  | "user.2fa_disable"
  | "user.profile_update"
  | "user.role_change"
  | "reclamation.create"
  | "reclamation.status_change"
  | "reclamation.assign"
  | "invoice.pay"
  | "invoice.view"
  | "admin.user_update"
  | "admin.role_change"
  | "admin.reclamation_action"
  | "security.unauthorized_access"
  | "security.rate_limit"
  | "system.error";

export interface AuditEntry {
  id: string;
  uid: string;
  action: AuditAction;
  details: string;
  ip?: string;
  userAgent?: string;
  timestamp: unknown;
  metadata?: Record<string, unknown>;
}

export async function logAudit(
  uid: string,
  action: AuditAction,
  details: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getFirebaseDb();
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    await addDoc(collection(db, "audit_logs"), {
      uid,
      action,
      details,
      ip: "client",
      userAgent: ua,
      timestamp: serverTimestamp(),
      metadata: metadata || null,
    });
  } catch (err) {
    console.error("[Audit] Failed to log:", err);
  }
}

export async function getAuditLogs(count: number = 50): Promise<AuditEntry[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditEntry));
}

export async function getUserAuditLogs(uid: string, count: number = 50): Promise<AuditEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "audit_logs"),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as AuditEntry))
    .filter(e => e.uid === uid);
}
