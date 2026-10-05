import { collection, addDoc, doc, serverTimestamp, query, orderBy, limit, where, getDocs, updateDoc, writeBatch, getDoc } from "firebase/firestore";
import { getFirebaseDb } from "../firebase";
import type { LoginHistoryEntry, NotificationEntry, Reclamation } from "../types";
import { detectDevice } from "../utils/device";

// --- Login History ---

export async function logLoginHistory(uid: string, success: boolean, type: LoginHistoryEntry["type"] = "login"): Promise<void> {
  const db = getFirebaseDb();
  const { browser, os } = detectDevice();
  const entry: Omit<LoginHistoryEntry, "id"> = {
    timestamp: serverTimestamp(),
    browser, os, ip: "127.0.0.1", location: "Tunis, Tunisie",
    success, type,
  };
  await addDoc(collection(db, "users", uid, "loginHistory"), entry);
}

export async function getLoginHistory(uid: string, count: number = 20): Promise<LoginHistoryEntry[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "users", uid, "loginHistory"), orderBy("timestamp", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LoginHistoryEntry));
}

// --- Notifications ---

export async function addNotification(uid: string, type: string, title: string, message: string): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, "users", uid, "notifications"), {
    type, title, message, read: false, createdAt: serverTimestamp(),
  });
}

export async function getNotifications(uid: string, count: number = 50): Promise<NotificationEntry[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as NotificationEntry));
}

export async function markNotificationRead(uid: string, notifId: string): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", uid, "notifications", notifId), { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const db = getFirebaseDb();
  const q = query(collection(db, "users", uid, "notifications"));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function getUnreadCount(uid: string): Promise<number> {
  const db = getFirebaseDb();
  const q = query(collection(db, "users", uid, "notifications"));
  const snap = await getDocs(q);
  return snap.docs.filter(d => !d.data().read).length;
}

// --- Profile Updates with Notifications ---

export async function updateUserProfile(uid: string, data: Record<string, unknown>): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function saveReclamation(data: Record<string, unknown>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, "reclamations"), { ...data, createdAt: serverTimestamp() });
}

export async function saveEfacture(data: Record<string, unknown>): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, "efacture_subscriptions"), { ...data, createdAt: serverTimestamp() });
}

// --- Réclamations ---

export async function createReclamation(data: Omit<Reclamation, "id" | "createdAt" | "updatedAt" | "status">): Promise<string> {
  const db = getFirebaseDb();
  const docRef = await addDoc(collection(db, "reclamations"), {
    ...data,
    status: "new",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getUserReclamations(uid: string): Promise<Reclamation[]> {
  const db = getFirebaseDb();
  const q = query(collection(db, "reclamations"), where("userId", "==", uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Reclamation));
}

export async function getReclamationById(id: string): Promise<Reclamation | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "reclamations", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Reclamation) : null;
}
