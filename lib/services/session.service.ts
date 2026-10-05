import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "../firebase";

/* =============================================================================
 * Session Service — Custom device/session tracking via Firestore
 *
 * Firebase Auth doesn't provide built-in session management for web.
 * This service tracks active sessions in Firestore under users/{uid}/sessions.
 * ============================================================================= */

export interface DeviceSession {
  id: string;
  sessionId: string;
  os: string;
  browser: string;
  device: string;
  ip: string;
  location: string;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  isCurrent: boolean;
}

function parseUserAgent(ua: string): { os: string; browser: string; device: string } {
  let os = "Inconnu";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  let browser = "Inconnu";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";

  let device = "Desktop";
  if (ua.includes("Mobile") || ua.includes("Android")) device = "Mobile";
  else if (ua.includes("iPad") || ua.includes("Tablet")) device = "Tablet";

  return { os, browser, device };
}

const CURRENT_SESSION_KEY = "tt_current_session_id";
const CLEANUP_KEY = "tt_last_session_cleanup";

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fetch IP address and approximate location from freeipapi.com (free, HTTPS, no key).
 * Single API call — returns both IP and formatted location.
 */
async function fetchIPAndLocation(): Promise<{ ip: string | null; location: string | null }> {
  try {
    const res = await fetch("https://freeipapi.com/api/json");
    if (!res.ok) return { ip: null, location: null };
    const data = await res.json();
    const ip = data.ipAddress || null;
    const location = data.city && data.countryName
      ? `${data.city}, ${data.countryName}`
      : data.countryName || null;
    return { ip, location };
  } catch {
    return { ip: null, location: null };
  }
}

/**
 * Get the current session document ID from sessionStorage (tab-scoped).
 */
export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(CURRENT_SESSION_KEY);
}

/**
 * Store the current session document ID in sessionStorage (tab-scoped).
 */
function setCurrentSessionId(docId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(CURRENT_SESSION_KEY, docId);
}

/**
 * Clear the current session ID from sessionStorage.
 * Called on logout to prevent stale IDs.
 */
export function clearCurrentSessionId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CURRENT_SESSION_KEY);
}

/**
 * Record a new session when user logs in.
 * Returns the session ID for later revocation.
 */
export async function recordSession(uid: string): Promise<string> {
  const db = getFirebaseDb();
  const sessionId = generateSessionId();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  const { os, browser, device } = parseUserAgent(ua);

  // Fetch IP and location in a single API call
  const { ip, location } = await fetchIPAndLocation();

  const docRef = await addDoc(collection(db, "users", uid, "sessions"), {
    sessionId,
    os,
    browser,
    device,
    ip: ip || "—",
    location: location || "—",
    createdAt: serverTimestamp(),
    lastActiveAt: serverTimestamp(),
  });

  // Store the Firestore document ID in localStorage for reliable current-session detection
  setCurrentSessionId(docRef.id);

  return sessionId;
}

/**
 * List all active sessions for a user, sorted by creation date (newest first).
 */
export async function listSessions(uid: string): Promise<DeviceSession[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "users", uid, "sessions"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as DeviceSession[];
}

/**
 * Revoke a specific session by its Firestore document ID.
 */
export async function revokeSession(uid: string, sessionId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, "users", uid, "sessions", sessionId));
}

/**
 * Revoke all sessions except the current one.
 * The currentSessionId parameter should be the document ID of the current session.
 */
export async function revokeAllSessions(uid: string, keepSessionId: string): Promise<void> {
  const db = getFirebaseDb();
  const sessions = await listSessions(uid);

  const revokePromises = sessions
    .filter((s) => s.id !== keepSessionId)
    .map((s) => deleteDoc(doc(db, "users", uid, "sessions", s.id)));

  await Promise.all(revokePromises);
}

export type SessionExpiryDays = 7 | 30 | 90;
const SESSION_EXPIRY_KEY = "tt_session_expiry_days";

/** Get the user's configured session expiry duration (from Firestore user doc or localStorage fallback). */
export async function getSessionExpiryDays(uid: string): Promise<SessionExpiryDays> {
  try {
    const db = getFirebaseDb();
    const userDoc = await getDoc(doc(db, "users", uid));
    const data = userDoc.data();
    const val = data?.sessionExpiryDays;
    if (val === 7 || val === 30 || val === 90) return val;
  } catch {
    // Fall through to localStorage fallback
  }
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (raw === "7" || raw === "30" || raw === "90") return Number(raw) as SessionExpiryDays;
  }
  return 30;
}

export interface CleanupStats {
  date: string; // YYYY-MM-DD
  totalDeleted: number;
  usersScanned: number;
}

/** Fetch daily cleanup stats for the last N days. */
export async function getSessionCleanupStats(days: number = 30): Promise<CleanupStats[]> {
  const db = getFirebaseDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  const q = query(
    collection(db, "analytics", "sessionCleanup", "daily"),
    orderBy("date", "desc"),
    where("date", ">=", cutoffTimestamp),
  );
  const snapshot = await getDocs(q);

  // Aggregate by day
  const dailyMap = new Map<string, { totalDeleted: number; usersScanned: number }>();

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const date = data.date?.toDate?.() ?? new Date(data.date);

    const dayKey = date.toISOString().slice(0, 10);
    const existing = dailyMap.get(dayKey);
    if (existing) {
      existing.totalDeleted += data.totalDeleted || 0;
      existing.usersScanned = Math.max(existing.usersScanned, data.usersScanned || 0);
    } else {
      dailyMap.set(dayKey, {
        totalDeleted: data.totalDeleted || 0,
        usersScanned: data.usersScanned || 0,
      });
    }
  }

  // Convert to sorted array
  return Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Set the user's configured session expiry duration. */
export async function setSessionExpiryDays(uid: string, days: SessionExpiryDays): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", uid), { sessionExpiryDays: days });
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_EXPIRY_KEY, String(days));
  }
}

export interface CleanupResult {
  timestamp: Date;
  removedCount: number;
}

/** Get the last cleanup result from localStorage. */
export function getLastCleanupResult(): CleanupResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CLEANUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { timestamp: new Date(parsed.timestamp), removedCount: parsed.removedCount };
  } catch {
    return null;
  }
}

/** 
 * Clean up expired sessions older than the specified number of days.
 * Returns the number of sessions removed and stores the result in localStorage.
 */
export async function cleanupExpiredSessions(uid: string, maxAgeDays: number = 30): Promise<number> {
  const db = getFirebaseDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

  const q = query(
    collection(db, "users", uid, "sessions"),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);

  const expiredSessions = snapshot.docs.filter((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toDate?.() ?? new Date(data.createdAt);
    return createdAt < cutoffDate;
  });

  const removedCount = expiredSessions.length;
  if (removedCount === 0) return 0;

  const deletePromises = expiredSessions.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  // Store cleanup result in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(CLEANUP_KEY, JSON.stringify({
      timestamp: new Date().toISOString(),
      removedCount,
    }));
  }

  console.log(`[SessionService] Cleaned up ${removedCount} expired session(s) older than ${maxAgeDays} days`);
  return removedCount;
}

/**
 * Update the lastActiveAt timestamp for a session.
 * Called periodically to show real-time "Last seen" updates.
 */
export async function touchSession(uid: string, sessionDocId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", uid, "sessions", sessionDocId), {
    lastActiveAt: serverTimestamp(),
  });
}

/**
 * Subscribe to real-time session updates.
 * Returns an unsubscribe function and calls onUpdate with the current sessions.
 */
export function subscribeToSessions(
  uid: string,
  onUpdate: (sessions: DeviceSession[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "users", uid, "sessions"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as DeviceSession[];
      onUpdate(sessions);
    },
    (err) => {
      console.error("[SessionService] Real-time subscription error:", err);
      onError?.(err);
    }
  );
}
