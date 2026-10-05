"use client";

/* =============================================================================
 * app/verify-email/page.tsx — Vérification d'email
 *
 * Lit l'état auth depuis useUser.
 * Redirige vers /dashboard si emailVerified via useEffect.
 * Boutons : "J'ai vérifié mon email" + "Renvoyer l'email".
 * Utilise les tokens du design system premium.
 * ============================================================================= */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useUser } from "@/lib/hooks/useUser";
import { sendEmailVerification, reload } from "firebase/auth";
import { showToast } from "@/components/ui/Toast";

const ease = [0.16, 1, 0.3, 1] as const;

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  // Rediriger si déjà vérifié — JAMAIS pendant le render
  useEffect(() => {
    if (!authLoading && user && user.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Rediriger si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  /** Vérifier si l'email a été vérifié (recharge le token Firebase) */
  const handleCheckVerified = useCallback(async () => {
    if (!user) {
      showToast("Erreur: utilisateur non connecté", "error");
      return;
    }
    setChecking(true);
    try {
      await reload(user);
      await user.getIdToken(true);
      if (user.emailVerified) {
        showToast("Email vérifié avec succès !", "success");
        router.push("/dashboard");
      } else {
        showToast("Votre email n'est pas encore vérifié. Vérifiez votre boîte de réception.", "error");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Erreur: ${message}`, "error");
    } finally {
      setChecking(false);
    }
  }, [user, router]);

  /** Renvoyer l'email de vérification */
  const handleResend = useCallback(async () => {
    if (!user) {
      showToast("Erreur: utilisateur non connecté", "error");
      return;
    }
    setResending(true);
    try {
      await sendEmailVerification(user, { url: `${window.location.origin}/dashboard`, handleCodeInApp: true });
      showToast("Email de vérification renvoyé ! Vérifiez votre boîte de réception.", "success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      showToast(`Erreur lors de l'envoi: ${message}`, "error");
    } finally {
      setResending(false);
    }
  }, [user]);

  // Écran de chargement
  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center bg-surface">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AuthLayout title="Vérifiez votre email" subtitle="Un email de vérification a été envoyé.">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="text-center"
      >
        {/* Icône enveloppe */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6"
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease }}
          className="text-muted text-sm mb-1"
        >
          Un email de vérification a été envoyé à :
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4, ease }}
          className="text-foreground font-semibold text-sm mb-4 break-all"
        >
          {user.email}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4, ease }}
          className="text-muted text-sm mb-8 leading-relaxed"
        >
          Ouvrez votre boîte de réception et cliquez sur le lien de vérification,
          puis revenez cliquer ci-dessous.
        </motion.p>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4, ease }}
          className="space-y-3"
        >
          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckVerified}
            disabled={checking || resending}
            loading={checking}
          >
            J&apos;ai vérifié mon email
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleResend}
            disabled={checking || resending}
            loading={resending}
          >
            Renvoyer l&apos;email de vérification
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4, ease }}
          className="mt-6"
        >
          <Link
            href="/login"
            className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
          >
            Retour à la connexion
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
