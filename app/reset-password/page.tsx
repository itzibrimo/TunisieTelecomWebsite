"use client";

import { useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/validations";
import { resetPassword } from "@/lib/services/auth.service";
import { PASSWORD_RULES, getPasswordStrength } from "@/lib/utils/password";
import { showToast } from "@/components/ui/Toast";

function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-action-code": return "Le lien de réinitialisation est invalide ou a expiré.";
      case "auth/weak-password": return "Le mot de passe est trop faible.";
      case "auth/network-request-failed": return "Erreur réseau. Vérifiez votre connexion.";
      case "auth/configuration-not-found": return "Firebase Auth n&apos;est pas configuré.";
      default: return `[${error.code}] ${error.message}`;
    }
  }
  return String(error);
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const watchPassword = watch("password", "");
  const strength = useMemo(() => getPasswordStrength(watchPassword), [watchPassword]);

  if (!oobCode) {
    return (
      <AuthLayout title="Lien invalide" subtitle="Ce lien de réinitialisation est invalide ou a expiré.">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-20 h-20 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-6"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-error">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </motion.div>
          <Button asLink href="/forgot-password" size="lg" className="w-full bg-primary hover:bg-primary/90 text-foreground shadow-lg shadow-primary/25">
            Demander un nouveau lien
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  async function onSubmit(data: ResetPasswordFormData) {
    setLoading(true);
    setError("");
    try {
      await resetPassword(oobCode!, data.password);
      setSuccess(true);
      showToast("Mot de passe réinitialisé avec succès !", "success");
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé pour votre compte.">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }} className="text-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-6"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-success">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </motion.div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground mb-2">Mot de passe réinitialisé</h2>
              <p className="text-muted text-sm mb-6">Votre mot de passe a été modifié avec succès.</p>
              <Button asLink href="/login" size="lg" className="w-full bg-primary hover:bg-primary/90 text-foreground shadow-lg shadow-primary/25">
                Se connecter
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium">
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <FormInput
                  label="Nouveau mot de passe"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("password")}
                  error={errors.password?.message}
                />

                {watchPassword.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Force :</span>
                      <span style={{ color: strength.color }} className="font-semibold">{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${strength.percent}%`, backgroundColor: strength.color }} />
                    </div>
                    <ul className="space-y-1 mt-2">
                      {PASSWORD_RULES.map((rule) => {
                        const passed = rule.test(watchPassword);
                        return (
                          <li key={rule.label} className="flex items-center gap-2 text-sm">
                            {passed ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50 shrink-0"><circle cx="12" cy="12" r="10" /></svg>
                            )}
                            <span className={passed ? "text-success" : "text-muted-foreground"}>{rule.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <FormInput
                  label="Confirmer le mot de passe"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />

                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90 text-foreground shadow-lg shadow-primary/25 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200" disabled={loading} loading={loading}>
                  Réinitialiser le mot de passe
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
