import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "../firebase";
import type { UserProfile } from "../types";

export async function signupUser(name: string, email: string, phone: string, password: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await sendEmailVerification(cred.user, { url: `${window.location.origin}/dashboard`, handleCodeInApp: true });
  await setDoc(doc(db, "users", cred.user.uid), {
    uid: cred.user.uid, name, email, phone, photoURL: null,
    twoFactorEnabled: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email: string, password: string): Promise<FirebaseUser> {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Record session for device tracking
  try {
    const { recordSession } = await import("./session.service");
    await recordSession(cred.user.uid);
  } catch (err) {
    console.error("[Auth] Failed to record session:", err);
    // Non-critical — don't block login
  }
  return cred.user;
}

export async function logoutUser(): Promise<void> {
  // Clear session tracking from sessionStorage
  try {
    const { clearCurrentSessionId } = await import("./session.service");
    clearCurrentSessionId();
  } catch {
    // Non-critical — don't block logout
  }
  await signOut(getFirebaseAuth());
}

export async function getUserData(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserData(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function resendVerification(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Aucun utilisateur connecté.");
  await sendEmailVerification(user, { url: `${window.location.origin}/dashboard`, handleCodeInApp: true });
}

export async function reloadUser(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  await user.reload();
  return user.emailVerified;
}

export async function sendForgotPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email, {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
  });
}

export async function resetPassword(oobCode: string, newPassword: string): Promise<void> {
  await confirmPasswordReset(getFirebaseAuth(), oobCode, newPassword);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("Utilisateur non connecté.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function changeEmail(currentPassword: string, newEmail: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("Utilisateur non connecté.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updateEmail(user, newEmail);
}

export async function reauthenticateUser(password: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("Utilisateur non connecté.");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
}

export async function deleteUserAccount(password: string): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user || !user.email) throw new Error("Utilisateur non connecté.");
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  await user.delete();
}
