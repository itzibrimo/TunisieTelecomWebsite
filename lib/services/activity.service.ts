import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, limit } from "firebase/firestore";
import { getFirebaseDb } from "../firebase";
import type { ActivityEntry } from "../types";

export async function logActivity(
  uid: string,
  type: ActivityEntry["type"],
  title: string,
  description: string,
  relatedId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = getFirebaseDb();
  await addDoc(collection(db, "users", uid, "activity"), {
    type,
    title,
    description,
    timestamp: serverTimestamp(),
    relatedId: relatedId || null,
    metadata: metadata || null,
  });
}

export async function getUserActivity(uid: string, count: number = 50): Promise<ActivityEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "users", uid, "activity"),
    orderBy("timestamp", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry));
}

export async function searchActivity(uid: string, searchTerm: string): Promise<ActivityEntry[]> {
  const db = getFirebaseDb();
  const q = query(
    collection(db, "users", uid, "activity"),
    orderBy("timestamp", "desc"),
    limit(100)
  );
  const snap = await getDocs(q);
  const lower = searchTerm.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as ActivityEntry))
    .filter(a => a.title.toLowerCase().includes(lower) || a.description.toLowerCase().includes(lower));
}

export const ACTIVITY_LABELS: Record<ActivityEntry["type"], { label: string; icon: string; color: string }> = {
  reclamation_created: { label: "Réclamation créée", icon: "📝", color: "bg-primary/10 text-primary" },
  reclamation_assigned: { label: "Réclamation assignée", icon: "👤", color: "bg-accent-cyan/10 text-accent-cyan" },
  reclamation_updated: { label: "Réclamation mise à jour", icon: "🔄", color: "bg-info/10 text-info" },
  reclamation_resolved: { label: "Réclamation résolue", icon: "✅", color: "bg-success/10 text-success" },
  invoice_created: { label: "Facture créée", icon: "📄", color: "bg-warning/10 text-warning" },
  invoice_paid: { label: "Facture payée", icon: "💰", color: "bg-success/10 text-success" },
  service_activated: { label: "Service activé", icon: "⚡", color: "bg-accent-cyan/10 text-accent-cyan" },
  offer_subscribed: { label: "Offre souscrite", icon: "📦", color: "bg-primary/10 text-primary" },
};
