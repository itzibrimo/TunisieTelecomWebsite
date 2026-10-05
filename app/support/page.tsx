"use client";

/* =============================================================================
 * app/support/page.tsx — Page Support avec 3 formulaires
 *
 * Onglets : Réclamation, Renseignement, Suivi
 * - Réclamation : enregistre dans Firestore "reclamations"
 * - Renseignement : enregistre dans Firestore "renseignements"
 * - Suivi : recherche par code de suivi (mock)
 * ============================================================================= */

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import FormInput from "@/components/ui/FormInput";
import FormTextarea from "@/components/ui/FormTextarea";
import Button from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import SectionHeading from "@/components/ui/SectionHeading";
import { reclamSchema, trackingSchema } from "@/lib/validations";
import type { ReclamFormData, TrackingFormData } from "@/lib/validations";
import { getFirebaseDb } from "@/lib/firebase";
import { useUser } from "@/lib/hooks/useUser";

/* Schema local pour le formulaire Renseignement (même champs que réclamation,
   mais sans la limite max 2000 caractères sur le message) */
const renseignementSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().min(8, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  subject: z.string().min(3, "Sujet requis"),
  concernedNumber: z.string().min(8, "Numéro concerné requis"),
  message: z.string().min(10, "Message trop court"),
});
type RenseignementFormData = z.infer<typeof renseignementSchema>;

type Tab = "reclamation" | "renseignement" | "suivi";

const TABS: { key: Tab; label: string }[] = [
  { key: "reclamation", label: "Réclamation" },
  { key: "renseignement", label: "Renseignement" },
  { key: "suivi", label: "Suivi" },
];

export default function SupportPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("reclamation");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  /* ─── Formulaire Réclamation ─── */
  const reclamationForm = useForm<ReclamFormData>({
    resolver: zodResolver(reclamSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      concernedNumber: "",
      message: "",
    },
  });

  /* ─── Formulaire Renseignement ─── */
  const renseignementForm = useForm<RenseignementFormData>({
    resolver: zodResolver(renseignementSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      concernedNumber: "",
      message: "",
    },
  });

  /* ─── Formulaire Suivi ─── */
  const trackingForm = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
    defaultValues: { code: "" },
  });

  /* Soumission Réclamation → Firestore */
  async function onSubmitReclamation(data: ReclamFormData) {
    if (!user) {
      showToast("Veuillez vous connecter pour envoyer une réclamation.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, "reclamations"), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: "new",
      });
      setSubmitted(true);
      reclamationForm.reset();
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error("[Support] Erreur envoi réclamation:", err);
      showToast("Erreur lors de l'envoi. Veuillez réessayer.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  /* Soumission Renseignement → Firestore */
  async function onSubmitRenseignement(data: RenseignementFormData) {
    if (!user) {
      showToast("Veuillez vous connecter pour envoyer une demande de renseignement.", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const db = getFirebaseDb();
      await addDoc(collection(db, "renseignements"), {
        ...data,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: "new",
      });
      setSubmitted(true);
      renseignementForm.reset();
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      console.error("[Support] Erreur envoi renseignement:", err);
      showToast("Erreur lors de l'envoi. Veuillez réessayer.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  /* Recherche de suivi (mock) */
  function onSubmitTracking(_: TrackingFormData) {
    setTrackingResult("Statut: En cours de traitement");
  }

  return (
    <>
      {/* Hero — blanc sur dégradé */}
      <section className="pt-16 pb-16 gradient-brand relative overflow-hidden">
        <Container className="relative z-10">
          <SectionHeading
            title="Support & Assistance"
            subtitle="Nous sommes là pour vous aider. Choisissez le formulaire adapté à votre besoin."
          />
        </Container>
      </section>

      {/* Onglets + Formulaire */}
      <section className="py-16 md:py-24 gradient-subtle">
        <Container>
          <Card className="p-6 md:p-10 max-w-3xl mx-auto">
            {/* Barre d'onglets */}
            <div className="flex border-b border-border mb-8" role="tablist" aria-label="Type de demande">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`tabpanel-${tab.key}`}
                  id={`tab-${tab.key}`}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSubmitted(false);
                    setTrackingResult(null);
                  }}
                  className={`
                    flex-1 py-3 text-sm font-semibold text-center transition-colors cursor-pointer
                    border-b-2 -mb-[2px]
                    ${
                      activeTab === tab.key
                        ? "border-primary text-primary dark:text-primary-light"
                        : "border-transparent text-muted hover:text-foreground"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Banner: Login required for Réclamation & Renseignement tabs */}
            <AnimatePresence>
              {!user && activeTab !== "suivi" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 rounded-xl bg-warning/10 text-warning font-medium text-sm border border-warning/20 flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Vous devez être connecté pour envoyer une demande.
                  </span>
                  <Link href="/login" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-warning text-white text-xs font-semibold hover:bg-warning/90 transition-colors">
                    Se connecter
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message de succès */}
            <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }} className="mb-6 p-4 rounded-xl bg-success/10 text-success font-medium text-sm">
                Votre demande a été envoyée avec succès !
              </motion.div>
            )}
            </AnimatePresence>

            {/* ── Onglet Réclamation ── */}
            <AnimatePresence mode="wait">
            {activeTab === "reclamation" && (
              <motion.form
                key="reclamation"
                role="tabpanel"
                id="tabpanel-reclamation"
                aria-labelledby="tab-reclamation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
                onSubmit={reclamationForm.handleSubmit(onSubmitReclamation)}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Nom complet"
                    placeholder="Ahmed Ben Ali"
                    {...reclamationForm.register("name")}
                    error={reclamationForm.formState.errors.name?.message}
                  />
                  <FormInput
                    label="Téléphone"
                    placeholder="+216 71 234 567"
                    {...reclamationForm.register("phone")}
                    error={reclamationForm.formState.errors.phone?.message}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="ahmed@example.com"
                    {...reclamationForm.register("email")}
                    error={reclamationForm.formState.errors.email?.message}
                  />
                  <FormInput
                    label="Numéro concerné"
                    placeholder="216 XX XXX XXX"
                    {...reclamationForm.register("concernedNumber")}
                    error={reclamationForm.formState.errors.concernedNumber?.message}
                  />
                </div>
                <FormInput
                  label="Sujet"
                  placeholder="Objet de la réclamation"
                  {...reclamationForm.register("subject")}
                  error={reclamationForm.formState.errors.subject?.message}
                />
                <FormTextarea
                  label="Message"
                  required
                  maxLength={2000}
                  showCounter
                  rows={5}
                  placeholder="Décrivez votre réclamation en détail..."
                  className="resize-none"
                  {...reclamationForm.register("message")}
                  error={reclamationForm.formState.errors.message?.message}
                />
                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => reclamationForm.reset()}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" size="md" disabled={submitting}>
                    {submitting ? "Envoi en cours..." : "Envoyer la réclamation"}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ── Onglet Renseignement ── */}
            {activeTab === "renseignement" && (
              <motion.form
                key="renseignement"
                role="tabpanel"
                id="tabpanel-renseignement"
                aria-labelledby="tab-renseignement"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
                onSubmit={renseignementForm.handleSubmit(onSubmitRenseignement)}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Nom complet"
                    placeholder="Ahmed Ben Ali"
                    {...renseignementForm.register("name")}
                    error={renseignementForm.formState.errors.name?.message}
                  />
                  <FormInput
                    label="Téléphone"
                    placeholder="+216 71 234 567"
                    {...renseignementForm.register("phone")}
                    error={renseignementForm.formState.errors.phone?.message}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormInput
                    label="Email"
                    type="email"
                    placeholder="ahmed@example.com"
                    {...renseignementForm.register("email")}
                    error={renseignementForm.formState.errors.email?.message}
                  />
                  <FormInput
                    label="Numéro concerné"
                    placeholder="216 XX XXX XXX"
                    {...renseignementForm.register("concernedNumber")}
                    error={renseignementForm.formState.errors.concernedNumber?.message}
                  />
                </div>
                <FormInput
                  label="Sujet"
                  placeholder="Objet du renseignement"
                  {...renseignementForm.register("subject")}
                  error={renseignementForm.formState.errors.subject?.message}
                />
                <FormTextarea
                  label="Message"
                  required
                  maxLength={2000}
                  showCounter
                  rows={5}
                  placeholder="Décrivez votre demande de renseignement..."
                  className="resize-none"
                  {...renseignementForm.register("message")}
                  error={renseignementForm.formState.errors.message?.message}
                />
                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => renseignementForm.reset()}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" size="md" disabled={submitting}>
                    {submitting ? "Envoi en cours..." : "Envoyer le renseignement"}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* ── Onglet Suivi ── */}
            {activeTab === "suivi" && (
              <motion.form
                key="suivi"
                role="tabpanel"
                id="tabpanel-suivi"
                aria-labelledby="tab-suivi"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
                onSubmit={trackingForm.handleSubmit(onSubmitTracking)}
                className="space-y-6"
              >
                <p className="text-muted text-sm">
                  Entrez votre code de suivi pour connaître l&apos;état de votre demande.
                </p>
                <FormInput
                  label="Code de suivi"
                  placeholder="1-O64F5DJ"
                  {...trackingForm.register("code")}
                  error={trackingForm.formState.errors.code?.message}
                />
                <Button type="submit" size="md">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Rechercher
                </Button>

                {/* Résultat mock */}
                {trackingResult && (
                  <Card className="p-6 border-l-4 border-success">
                    <div className="flex items-center gap-3">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-success"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="16 8 10.5 14 8 11.5" />
                      </svg>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          Code : {trackingForm.getValues("code")}
                        </p>
                        <p className="text-success font-medium mt-0.5">
                          {trackingResult}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.form>
            )}
            </AnimatePresence>
          </Card>
        </Container>
      </section>
    </>
  );
}
