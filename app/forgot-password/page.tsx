"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations";
import { sendForgotPassword } from "@/lib/services/auth.service";
import { showToast } from "@/components/ui/Toast";
import Link from "next/link";

function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/user-not-found": return "Aucun compte trouvé avec cet email.";
      case "auth/invalid-email": return "Adresse email invalide.";
      case "auth/too-many-requests": return "Trop de tentatives. Réessayez plus tard.";
      case "auth/network-request-failed": return "Erreur réseau. Vérifiez votre connexion.";
      case "auth/configuration-not-found": return "Firebase Auth n&apos;est pas configuré.";
      default: return `[${error.code}] ${error.message}`;
    }
  }
  return String(error);
}

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      await sendForgotPassword(data.email);
      setSuccess(true);
      showToast("Email de réinitialisation envoyé !", "success");
    } catch (err) {
      const msg = getFirebaseErrorMessage(err);
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Mot de passe oublié" subtitle="Entrez votre adresse email pour recevoir un lien de réinitialisation.">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm font-medium flex items-center gap-3"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Email de réinitialisation envoyé. Vérifiez votre boîte de réception.
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Adresse email"
            type="email"
            autoComplete="email"
            placeholder="client@tt.tn"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
            {...register("email")}
            error={errors.email?.message}
          />
          <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/80 text-foreground shadow-lg shadow-primary/25 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200" disabled={loading} loading={loading}>
            Envoyer le lien
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-primary hover:text-primary transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
