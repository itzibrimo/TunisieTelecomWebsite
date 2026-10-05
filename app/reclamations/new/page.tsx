"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import FormInput from "@/components/ui/FormInput";
import FormTextarea from "@/components/ui/FormTextarea";
import Button from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/useUser";
import { createReclamation, addNotification } from "@/lib/services/firestore.service";
import { reclamSchema, type ReclamFormData } from "@/lib/validations";
import { showToast } from "@/components/ui/Toast";

export default function NewReclamationPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useUser();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ReclamFormData>({
    resolver: zodResolver(reclamSchema),
    defaultValues: {
      name: profile?.name || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
      subject: "",
      concernedNumber: "",
      message: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  async function onSubmit(data: ReclamFormData) {
    if (!user) return;
    setSubmitting(true);
    try {
      await createReclamation({
        userId: user.uid,
        name: data.name,
        phone: data.phone,
        email: data.email,
        subject: data.subject,
        concernedNumber: data.concernedNumber,
        message: data.message,
      });
      await addNotification(user.uid, "reclamation", "Réclamation envoyée", `Votre réclamation "${data.subject}" a été enregistrée.`);
      showToast("Réclamation envoyée avec succès !");
      router.push("/reclamations");
    } catch (err) {
      console.error("[Réclamation] Erreur:", err);
      showToast("Erreur lors de l'envoi. Réessayez.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted">Chargement...</p>
        </div>
      </div>
    );
  }

  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <div className="pt-8 pb-20 bg-surface">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/reclamations"
              className="p-2 -ml-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-foreground">
              Nouvelle réclamation
            </h1>
          </div>
          <p className="text-sm text-muted ml-11">Décrivez votre problème et nous vous répondrons dans les plus brefs délais.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease }}
        >
          <Card className="p-6 md:p-8 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Nom complet"
                  placeholder="Ahmed Ben Ali"
                  {...register("name")}
                  error={errors.name?.message}
                />
                <FormInput
                  label="Téléphone"
                  placeholder="+216 71 234 567"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>

              {/* Email + Concerned Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput
                  label="Email"
                  type="email"
                  placeholder="ahmed@example.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <FormInput
                  label="Numéro concerné"
                  placeholder="216 XX XXX XXX"
                  {...register("concernedNumber")}
                  error={errors.concernedNumber?.message}
                  hint="Numéro de téléphone ou de ligne associé"
                />
              </div>

              {/* Subject */}
              <FormInput
                label="Sujet"
                placeholder="Ex: Problème de connexion Internet"
                {...register("subject")}
                error={errors.subject?.message}
              />

              <FormTextarea
                label="Message"
                required
                maxLength={2000}
                showCounter
                placeholder="Décrivez votre réclamation en détail..."
                className="resize-none"
                {...register("message")}
                error={errors.message?.message}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" size="md" onClick={() => history.back()}>
                  Annuler
                </Button>
                <Button type="submit" size="md" loading={submitting}>
                  Envoyer la réclamation
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
}