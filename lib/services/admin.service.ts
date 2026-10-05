import { collection, getDocs, getDoc, query, orderBy, limit, doc, updateDoc, serverTimestamp, startAfter, type DocumentSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "../firebase";
import type { UserProfile, Reclamation, AdminStats } from "../types";

// --- Admin RBAC ---

export async function isAdmin(uid: string): Promise<boolean> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return (snap.data() as UserProfile).role === "admin";
}

// --- All Users (admin) ---

export async function getAllUsers(count: number = 50, lastDoc?: DocumentSnapshot): Promise<{ users: UserProfile[]; lastDoc: DocumentSnapshot | null }> {
  const db = getFirebaseDb();
  let q;
  if (lastDoc) {
    q = query(collection(db, "users"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(count));
  } else {
    q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(count));
  }
  const snap = await getDocs(q);
  const users = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { users, lastDoc: newLastDoc };
}

export async function searchUsers(searchTerm: string): Promise<UserProfile[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
    .filter(u => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.phone?.includes(term));
}

export async function updateUserRole(uid: string, role: "user" | "admin"): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
}

// --- All Reclamations (admin) ---

export async function getAllReclamations(count: number = 50, lastDoc?: DocumentSnapshot): Promise<{ reclamations: Reclamation[]; lastDoc: DocumentSnapshot | null }> {
  const db = getFirebaseDb();
  let q;
  if (lastDoc) {
    q = query(collection(db, "reclamations"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(count));
  } else {
    q = query(collection(db, "reclamations"), orderBy("createdAt", "desc"), limit(count));
  }
  const snap = await getDocs(q);
  const reclamations = snap.docs.map(d => ({ id: d.id, ...d.data() } as Reclamation));
  const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
  return { reclamations, lastDoc: newLastDoc };
}

export async function searchReclamations(searchTerm: string): Promise<Reclamation[]> {
  const db = getFirebaseDb();
  const snap = await getDocs(query(collection(db, "reclamations"), orderBy("createdAt", "desc")));
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Reclamation))
    .filter(r => r.subject?.toLowerCase().includes(term) || r.name?.toLowerCase().includes(term) || r.email?.toLowerCase().includes(term) || r.id.toLowerCase().includes(term));
}

export async function updateReclamationStatus(id: string, status: Reclamation["status"]): Promise<void> {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "reclamations", id), { status, updatedAt: serverTimestamp() });
}

// --- Admin Dashboard Stats ---

export async function getAdminStats(): Promise<AdminStats> {
  const db = getFirebaseDb();

  // Fetch all users
  const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  const users = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));

  // Fetch all reclamations
  const recsSnap = await getDocs(query(collection(db, "reclamations"), orderBy("createdAt", "desc")));
  const reclamations = recsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Reclamation));

  // Compute stats
  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => {
    const authUser = usersSnap.docs.find(d => d.id === u.uid);
    return (authUser?.data() as Record<string, unknown>)?.emailVerified === true;
  }).length;

  const totalReclamations = reclamations.length;
  const newReclamations = reclamations.filter(r => r.status === "new").length;
  const inProgressReclamations = reclamations.filter(r => r.status === "in_progress").length;
  const resolvedReclamations = reclamations.filter(r => r.status === "resolved").length;
  const closedReclamations = reclamations.filter(r => r.status === "closed").length;
  const openReclamations = newReclamations + inProgressReclamations;

  // Status breakdown for charts
  const reclamationsByStatus = [
    { name: "Nouvelle", value: newReclamations, color: "#001e8c" },
    { name: "En cours", value: inProgressReclamations, color: "#3b82f6" },
    { name: "Résolue", value: resolvedReclamations, color: "#10b981" },
    { name: "Fermée", value: closedReclamations, color: "#64748b" },
  ];

  // Monthly breakdown (last 6 months)
  const now = new Date();
  const reclamationsByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const month = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const count = reclamations.filter(r => {
      if (!r.createdAt) return false;
      const rd = (r.createdAt as { toDate?: () => Date })?.toDate?.();
      if (!rd) return false;
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
    }).length;
    return { month, count };
  });

  return {
    totalUsers, verifiedUsers, totalReclamations, openReclamations,
    resolvedReclamations, closedReclamations, inProgressReclamations, newReclamations,
    reclamationsByStatus, reclamationsByMonth,
    recentUsers: users.slice(0, 5),
    recentReclamations: reclamations.slice(0, 5),
  };
}
