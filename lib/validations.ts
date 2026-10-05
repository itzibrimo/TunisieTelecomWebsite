import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  rememberMe: z.boolean().optional(),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });
export type SignupFormData = z.infer<typeof signupSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Veuillez entrer votre nom"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Veuillez entrer un sujet"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});
export type ContactFormData = z.infer<typeof contactSchema>;

export const rechargeSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  amount: z.number().min(1, "Montant minimum : 1 DT").max(100, "Montant maximum : 100 DT"),
});
export type RechargeFormData = z.infer<typeof rechargeSchema>;

export const billSchema = z.object({
  identifier: z.string().min(3, "Veuillez entrer un identifiant valide"),
  identifierType: z.enum(["phone", "client", "invoice"]),
  acceptTerms: z.literal(true, { error: "Vous devez accepter les conditions" }),
});
export type BillFormData = z.infer<typeof billSchema>;

// Step-specific schemas for multi-step e-Facture form
export const efactureStep1Schema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
});
export type EFactureStep1Data = z.infer<typeof efactureStep1Schema>;

export const efactureStep3Schema = z.object({
  email: z.string().email("Adresse email invalide"),
});
export type EFactureStep3Data = z.infer<typeof efactureStep3Schema>;

// Legacy combined schema (kept for compatibility)
export const efactureSchema = z.object({
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  email: z.string().email("Adresse email invalide"),
});
export type EFactureFormData = z.infer<typeof efactureSchema>;

export const reclamSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  subject: z.string().min(3, "Sujet requis"),
  concernedNumber: z.string().min(8, "Numéro concerné requis"),
  message: z.string().min(10, "Message trop court").max(2000, "Maximum 2000 caractères"),
});
export type ReclamFormData = z.infer<typeof reclamSchema>;

export const trackingSchema = z.object({ code: z.string().min(3, "Code de suivi invalide") });
export type TrackingFormData = z.infer<typeof trackingSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().email("Adresse email invalide") });
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmPassword"] });
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis"),
  newPassword: z.string().min(8, "Minimum 8 caractères"),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, { message: "Les mots de passe ne correspondent pas", path: ["confirmNewPassword"] });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const deleteAccountSchema = z.object({ password: z.string().min(1, "Mot de passe requis") });
export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
