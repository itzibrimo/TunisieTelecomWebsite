/**
 * Évaluation de la force d'un mot de passe.
 * Retourne un score de 0 à 4 avec un label et une couleur.
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  percent: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normaliser à 4 max
  score = Math.min(score, 4);

  const levels = [
    { label: "Très faible", color: "#ef4444", percent: 10 },
    { label: "Faible", color: "#f97316", percent: 30 },
    { label: "Moyen", color: "#eab308", percent: 55 },
    { label: "Fort", color: "#22c55e", percent: 80 },
    { label: "Très fort", color: "#16a34a", percent: 100 },
  ];

  return { score, ...levels[score] };
}

/** Exigences de mot de passe */
export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "Au moins 8 caractères" },
  { test: (p: string) => /[A-Z]/.test(p), label: "Une majuscule" },
  { test: (p: string) => /[a-z]/.test(p), label: "Une minuscule" },
  { test: (p: string) => /[0-9]/.test(p), label: "Un chiffre" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "Un caractère spécial" },
];
