"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import { loginUser } from "@/lib/services/auth.service";
import { useUser } from "@/lib/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/ui/Toast";

function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const map: Record<string, string> = {
      "auth/user-not-found": "Aucun compte trouvé avec cet email.",
      "auth/wrong-password": "Mot de passe incorrect.",
      "auth/invalid-credential": "Email ou mot de passe incorrect.",
      "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
      "auth/invalid-email": "Adresse email invalide.",
      "auth/configuration-not-found": "Firebase Auth non configuré.",
      "auth/network-request-failed": "Erreur réseau.",
      "auth/user-disabled": "Ce compte a été désactivé.",
    };
    return map[error.code] || `[${error.code}] ${error.message}`;
  }
  return String(error);
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.push(user.emailVerified ? "/dashboard" : "/verify-email");
    }
  }, [user, authLoading, router]);

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setError("");
    try {
      const u = await loginUser(data.email, data.password);
      await u.reload();
      showToast("Connexion réussie !");
      router.push(u.emailVerified ? "/dashboard" : "/verify-email");
    } catch (err) {
      setError(getFirebaseErrorMessage(err));
    } finally { setLoading(false); }
  }

  if (authLoading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return null;

  return (
    <AuthLayout title="Connexion" subtitle="Accédez à votre espace client TT Digital.">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="mb-5 p-4 rounded-lg bg-error/10 text-error text-sm font-medium border border-error/20"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="client@tt.tn"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
            {...register("email")}
            error={errors.email?.message}
          />
          <FormInput
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            placeholder="••••••"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
            {...register("password")}
            error={errors.password?.message}
          />

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-foreground shadow-lg shadow-primary/25 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200" size="lg" loading={loading}>
            Se connecter
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
