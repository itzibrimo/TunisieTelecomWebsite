"use client";

/* =============================================================================
 * app/reclamations/[id]/page.tsx — Détail + suivi d'une réclamation
 *
 * Affiche les informations complètes de la réclamation.
 * Timeline de statut : Nouvelle → En cours → Résolue
 * Détails : sujet, message, numéro, dates
 * ============================================================================= */

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useUser } from "@/lib/hooks/useUser";
import { getReclamationById } from "@/lib/services/firestore.service";
import type { Reclamation } from "@/lib/types";

const STATUS_STEPS = [
  { key: "new", label: "Réceptionnée", desc: "Votre réclamation a été enregistrée", icon: "✉️", color: "brand" as const },
  { key: "in_progress", label: "En cours de traitement", desc: "Un technicien examine votre dossier", icon: "🔧", color: "info" as const },
  { key: "resolved", label: "Résolue", desc: "Le problème a été traité", icon: "✅", color: "success" as const },
];

const STATUS_INDEX: Record<string, number> = { new: 0, in_progress: 1, resolved: 2, closed: 2 };

function formatDate(date: unknown): string {
  if (!date) return "—";
  const d = (date as { toDate?: () => Date })?.toDate?.() ?? new Date(date as string | number);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ReclamationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user, loading: authLoading } = useUser();
  const [rec, setRec] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && id) {
      getReclamationById(id)
        .then(setRec)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, id]);

  if (authLoading || !user) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (loading) {
    return (
      <div className="pt-8 pb-20 bg-surface">
        <Container>
          <div className="max-w-2xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-bg-elevated p-6 animate-pulse">
                <div className="h-4 w-1/3 bg-surface-3 rounded mb-4" />
                <div className="h-3 w-full bg-surface-3 rounded mb-2" />
                <div className="h-3 w-2/3 bg-surface-3 rounded" />
              </div>
            ))}
          </div>
        </Container>
      </div>
    );
  }

  if (!rec) {
    return (
      <div className="pt-8 pb-20 bg-surface">
        <Container>
          <Card className="p-12 text-center max-w-md mx-auto">
            <h2 className="font-[family-name:var(--font-display)] font-semibold text-lg text-foreground mb-2">Réclamation introuvable</h2>
            <p className="text-sm text-muted mb-6">Cette réclamation n&apos;existe pas ou vous n&apos;avez pas les droits d&apos;accès.</p>
            <Button asLink href="/reclamations" size="sm">Retour à la liste</Button>
          </Card>
        </Container>
      </div>
    );
  }

  const currentStep = STATUS_INDEX[rec.status] ?? 0;

  return (
    <div className="pt-8 pb-20 bg-surface">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <Link href="/reclamations" className="text-muted hover:text-foreground transition-colors" aria-label="Retour à la liste des réclamations">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </Link>
            <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-foreground truncate">
              {rec.subject}
            </h1>
          </div>
          <p className="text-sm text-muted ml-8">
            Référence : <span className="font-mono text-foreground">{rec.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl">
          {/* Timeline — gauche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="lg:col-span-2"
          >
            <Card className="p-6 md:p-8">
              <h2 className="font-[family-name:var(--font-display)] font-semibold text-lg text-foreground mb-6">
                Suivi de la réclamation
              </h2>

              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const isCompleted = i <= currentStep;
                  const isCurrent = i === currentStep;

                  return (
                    <div key={step.key} className="flex gap-4">
                      {/* Indicateur vertical */}
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.15 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 transition-all duration-500 ${
                            isCompleted
                              ? "bg-primary text-white shadow-lg shadow-primary/25"
                              : "bg-surface-3 text-muted-foreground"
                          }`}
                        >
                          {step.icon}
                        </motion.div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[40px] mt-2 rounded-full transition-colors duration-500 ${
                            isCompleted && i < currentStep ? "bg-primary" : "bg-surface-3"
                          }`} />
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="pb-8 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-sm ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                            {step.label}
                          </h3>
                          {isCurrent && <Badge variant="brand" dot>Actuel</Badge>}
                        </div>
                        <p className={`text-xs mt-0.5 ${isCompleted ? "text-muted" : "text-muted-foreground"}`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Détails — droite */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="space-y-4"
          >
            {/* Message */}
            <Card className="p-6">
              <h3 className="font-semibold text-sm text-foreground mb-3">Description</h3>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{rec.message}</p>
            </Card>

            {/* Informations */}
            <Card className="p-6">
              <h3 className="font-semibold text-sm text-foreground mb-3">Détails</h3>
              <div className="space-y-3">
                {[
                  { label: "Nom", value: rec.name },
                  { label: "Téléphone", value: rec.phone },
                  { label: "Email", value: rec.email },
                  { label: "Numéro concerné", value: rec.concernedNumber },
                  { label: "Créée le", value: formatDate(rec.createdAt) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start gap-3">
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.label}</span>
                    <span className="text-sm text-foreground text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Actions */}
            <Button variant="outline" size="sm" className="w-full" asLink href="/reclamations">
              ← Retour à la liste
            </Button>
          </motion.div>
        </div>
      </Container>
    </div>
  );
}
