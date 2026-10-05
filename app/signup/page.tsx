"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FirebaseError } from "firebase/app";
import AuthLayout from "@/components/auth/AuthLayout";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { signupSchema, type SignupFormData } from "@/lib/validations";
import { signupUser } from "@/lib/services/auth.service";
import { useUser } from "@/lib/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "@/components/ui/Toast";
import { getPasswordStrength, PASSWORD_RULES } from "@/lib/utils/password";

function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    const map: Record<string, string> = {
      "auth/email-already-in-use": "Cet email est déjà utilisé.",
      "auth/invalid-email": "Adresse email invalide.",
      "auth/weak-password": "Le mot de passe doit contenir au moins 8 caractères.",
      "auth/configuration-not-found": "Firebase Auth non configuré.",
      "auth/network-request-failed": "Erreur réseau.",
    };
    return map[error.code] || `[${error.code}] ${error.message}`;
  }
  return String(error);
}

export default function SignupPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (!authLoading && user) router.push("/dashboard");
  }, [user, authLoading, router]);

  const passwordValue = watch("password", "");
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  async function onSubmit(data: SignupFormData) {
    setLoading(true);
    setError("");
    try {
      await signupUser(data.name, data.email, data.phone, data.password);
      showToast("Compte créé ! Vérifiez votre email.");
      router.push("/verify-email");
    } catch (err) { setError(getFirebaseErrorMessage(err)); }
    finally { setLoading(false); }
  }

  if (authLoading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-bg"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return null;

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez TT Digital et accédez à nos services.">
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
            label="Nom complet"
            autoComplete="name"
            placeholder="Ahmed Ben Ali"
            {...register("name")}
            error={errors.name?.message}
          />
          <FormInput
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="ahmed@example.com"
            {...register("email")}
            error={errors.email?.message}
          />
          <FormInput
            label="Téléphone"
            autoComplete="tel"
            placeholder="+216 71 234 567"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <div className="space-y-2">
            <FormInput
              label="Mot de passe"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("password")}
              error={errors.password?.message}
              hint="Minimum 8 caractères"
            />
            {passwordValue.length > 0 && (
              <div className="space-y-2 px-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Force :</span>
                  <span style={{ color: strength.color }} className="font-semibold">
                    {strength.label}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
                  />
                </div>
                <ul className="space-y-1 mt-2">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = rule.test(passwordValue);
                    return (
                      <li key={rule.label} className="flex items-center gap-2 text-sm">
                        {passed ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-success shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50 shrink-0">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        )}
                        <span className={passed ? "text-success" : "text-muted-foreground"}>
                          {rule.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          <FormInput
            label="Confirmer le mot de passe"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-foreground shadow-lg shadow-primary/25 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200" size="lg" loading={loading}>
            Créer mon compte
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}
