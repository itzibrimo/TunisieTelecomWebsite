/**
 * Firebase error message mapping — single source of truth
 */

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "Adresse email invalide.",
  "auth/user-disabled": "Ce compte a été désactivé.",
  "auth/user-not-found": "Aucun compte trouvé avec cette adresse email.",
  "auth/wrong-password": "Mot de passe incorrect.",
  "auth/email-already-in-use": "Un compte existe déjà avec cette adresse email.",
  "auth/operation-not-allowed": "Cette opération n'est pas autorisée.",
  "auth/weak-password": "Le mot de passe doit contenir au moins 8 caractères.",
  "auth/too-many-requests": "Trop de tentatives. Veuillez réessayer plus tard.",
  "auth/network-request-failed": "Erreur réseau. Vérifiez votre connexion.",
  "auth/popup-closed-by-user": "Connexion annulée.",
  "auth/requires-recent-login": "Veuillez vous reconnecter pour effectuer cette action.",
  "auth/invalid-credential": "Identifiants invalides. Vérifiez votre email et mot de passe.",
  "auth/invalid-action-code": "Lien invalide ou expiré. Veuillez demander un nouveau lien.",
  "storage/unauthorized": "Vous n'avez pas les permissions pour cette action.",
  "storage/object-not-found": "Fichier non trouvé.",
  "storage/quota-exceeded": "Espace de stockage insuffisant.",
  "permission-denied": "Vous n'avez pas les permissions nécessaires.",
  "not-found": "Document non trouvé.",
  "already-exists": "Ce document existe déjà.",
  "unauthenticated": "Veuillez vous connecter.",
  "resource-exhausted": "Limite de requêtes atteinte. Veuillez réessayer plus tard.",
  "internal": "Erreur interne. Veuillez réessayer.",
  "unavailable": "Service temporairement indisponible.",
};

export function getFirebaseErrorMessage(error: unknown): string {
  if (!error) return "Une erreur inconnue s'est produite.";

  const code = (error as { code?: string })?.code;
  if (code && FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }

  const message = (error as { message?: string })?.message;
  if (message) {
    if (message.includes("network")) return "Erreur réseau. Vérifiez votre connexion.";
    if (message.includes("timeout")) return "La requête a expiré. Veuillez réessayer.";
    return "Une erreur s'est produite. Veuillez réessayer.";
  }

  return "Une erreur inconnue s'est produite.";
}
