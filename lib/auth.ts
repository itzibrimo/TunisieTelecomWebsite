import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./firebase";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  createdAt?: unknown;
}

/**
 * Inscription : crée le compte Auth + envoie l'email de vérification
 * + crée le profil Firestore.
 */
export async function signupUser(
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Mettre à jour le displayName de Firebase Auth
  await updateProfile(cred.user, { displayName: name });

  // Envoyer l'email de vérification
  await sendEmailVerification(cred.user, {
    url: `${window.location.origin}/dashboard`,
    handleCodeInApp: true,
  });

  // Créer le profil dans Firestore
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    phone,
    createdAt: serverTimestamp(),
  });

  return cred.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await signOut(auth);
}

export async function getUserData(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

/**
 * Renvoie un nouvel email de vérification à l'utilisateur.
 */
export async function resendVerification(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) throw new Error("Aucun utilisateur connecté.");
  await sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/dashboard`,
    handleCodeInApp: true,
  });
}

/**
 * Recharge l'objet User depuis Firebase pour obtenir
 * la valeur à jour de emailVerified après vérification.
 */
export async function reloadUser(): Promise<boolean> {
  const auth = getFirebaseAuth();
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  return auth.currentUser.emailVerified;
}
