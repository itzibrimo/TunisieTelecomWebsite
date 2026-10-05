"use client";

/* =============================================================================
 * app/factures/page.tsx — Gestion des Factures (Paiement en ligne)
 * Wizard 3 étapes : Saisie → Consultation → Paiement
 * Utilise billSchema (react-hook-form + zod)
 * ============================================================================= */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import { showToast } from "@/components/ui/Toast";
import Badge from "@/components/ui/Badge";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { billSchema, type BillFormData } from "@/lib/validations";
import { useUser } from "@/lib/hooks/useUser";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type Step = 1 | 2 | 3;

const IDENTIFIER_OPTIONS = [
  { value: "phone" as const, label: "Numéro de téléphone" },
  { value: "client" as const, label: "Code client" },
  { value: "invoice" as const, label: "Numéro de facture" },
];

const PAYMENT_METHODS = [
  { id: "ttcash", label: "TT Cash", icon: "wallet" },
  { id: "card", label: "Carte bancaire", icon: "credit-card" },
  { id: "d17", label: "D17", icon: "smartphone" },
  { id: "flouci", label: "Flouci", icon: "bank" },
];

const PLACEHOLDER_INVOICE = {
  reference: "FAC-2026-07142",
  period: "Juillet 2026",
  amount: 45.80,
  status: "Impayée",
};

export default function FacturesPage() {
  const { user } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [identifierType, setIdentifierType] = useState<"phone" | "client" | "invoice">("phone");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: { identifierType: "phone" },
  });

  const acceptedTerms = watch("acceptTerms");

  // Étape 1 → 2 : validation de l'identifiant
  function handleStep1Submit(_data: BillFormData) {
    setStep(2);
  }

  // Étape 3 : traitement du paiement
  async function handlePayment() {
    if (!selectedPayment) return;
    setIsProcessing(true);

    try {
      const db = getFirebaseDb();
      const paymentId = `payment_${Date.now()}`;
      await setDoc(doc(db, "bill_payments", paymentId), {
        identifier: watch("identifier"),
        identifierType,
        invoiceRef: PLACEHOLDER_INVOICE.reference,
        amount: PLACEHOLDER_INVOICE.amount,
        paymentMethod: selectedPayment,
        uid: user?.uid ?? null,
        status: "completed",
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("[Factures] Erreur paiement:", err);
      showToast("Une erreur est survenue. Veuillez réessayer.", "error");
    } finally {
      setIsProcessing(false);
    }
  }

  // Indicateur d'étapes
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${step === s
                ? "bg-primary text-white shadow-lg"
                : step > s
                  ? "bg-success text-white"
                  : "bg-surface-3 text-muted dark:text-muted-foreground"
              }
            `}
          >
            {step > s ? "✓" : s}
          </div>
          {s < 3 && (
            <div
              className={`w-16 h-1 rounded-full transition-all duration-500 ${
                step > s ? "bg-success" : "bg-surface-3"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Écran de succès
  if (isSuccess) {
    return (
      <>
        <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-80 h-80 rounded-full bg-white/20 blur-3xl" />
          </div>
          <Container className="relative z-10">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Paiement Facture
            </h1>
          </Container>
        </section>

        <section className="py-24 md:py-32">
          <Container>
            <RevealOnScroll>
              <Card className="p-10 md:p-14 max-w-lg mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6 text-success">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl md:text-3xl text-foreground mb-3">
                  Paiement confirmé !
                </h2>
                <p className="text-muted mb-2">
                  Votre facture <strong className="text-foreground">{PLACEHOLDER_INVOICE.reference}</strong> a été payée avec succès.
                </p>
                <p className="text-muted text-sm mb-8">
                  Montant : <strong className="text-success">{PLACEHOLDER_INVOICE.amount.toFixed(2)} TND</strong> — Méthode : {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.label}
                </p>
                <Button asLink href="/" variant="primary" size="lg" className="w-full">
                  Retour à l&apos;accueil
                </Button>
              </Card>
            </RevealOnScroll>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      {/* Hero — gradient TT */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Paiement Facture
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Consultez et payez vos factures Tunisie Telecom en toute sécurité.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* Wizard — dark text on light bg */}
      <section className="py-24 md:py-32">
        <Container>
          <RevealOnScroll>
            <Card className="p-8 md:p-12 max-w-3xl mx-auto">
              <StepIndicator />

              <AnimatePresence mode="wait">
              {/* ==================== ÉTAPE 1 : Saisie identifiant ==================== */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl md:text-2xl text-foreground mb-2">
                    Identifiez votre compte
                  </h2>
                  <p className="text-muted text-sm mb-8">
                    Choisissez le type d&apos;identifiant et saisissez la valeur correspondante.
                  </p>

                  <form onSubmit={handleSubmit(handleStep1Submit)} className="space-y-6">
                    {/* Radio buttons type d'identifiant */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-foreground">
                        Type d&apos;identifiant
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {IDENTIFIER_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            className={`
                              flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                              ${identifierType === opt.value
                                ? "border-primary bg-primary/5"
                                : "border-border dark:border-border-2 hover:border-primary/30"
                              }
                            `}
                          >
                            <input
                              type="radio"
                              value={opt.value}
                              checked={identifierType === opt.value}
                              onChange={(e) => {
                                setIdentifierType(e.target.value as typeof identifierType);
                                register("identifierType").onChange(e);
                              }}
                              className="accent-primary dark:accent-primary-light w-4 h-4"
                            />
                            <span className="text-sm font-medium text-foreground-2">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.identifierType && (
                        <p className="text-sm text-error">{errors.identifierType.message}</p>
                      )}
                    </div>

                    {/* Champ identifiant */}
                    <FormInput
                      label={
                        identifierType === "phone"
                          ? "Numéro de téléphone"
                          : identifierType === "client"
                            ? "Code client"
                            : "Numéro de facture"
                      }
                      placeholder={
                        identifierType === "phone"
                          ? "20 123 456"
                          : identifierType === "client"
                            ? "CL-001234"
                            : "FAC-2026-XXXXX"
                      }
                      error={errors.identifier?.message}
                      {...register("identifier")}
                    />

                    {/* Case à cocher certification */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        {...register("acceptTerms")}
                        className="mt-0.5 accent-primary dark:accent-primary-light w-5 h-5 rounded"
                      />
                      <span className="text-sm text-muted group-hover:text-foreground transition-colors">
                        Je certifie être le titulaire du compte et autoriser la consultation de ma facture.
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-sm text-error">{errors.acceptTerms.message}</p>
                    )}

                    <Button type="submit" size="lg" disabled={!acceptedTerms} className="w-full sm:w-auto mt-4">
                      Continuer
                    </Button>
                  </form>
                </div>
                </motion.div>
              )}

              {/* ==================== ÉTAPE 2 : Consultation facture ==================== */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl md:text-2xl text-foreground mb-2">
                    Votre facture
                  </h2>
                  <p className="text-muted text-sm mb-8">
                    Vérifiez les détails de votre facture avant de procéder au paiement.
                  </p>

                  <div className="overflow-x-auto mb-8">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-3 text-sm font-semibold text-muted">Référence</th>
                          <th className="pb-3 text-sm font-semibold text-muted">Période</th>
                          <th className="pb-3 text-sm font-semibold text-muted text-right">Montant</th>
                          <th className="pb-3 text-sm font-semibold text-muted text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/50">
                          <td className="py-4 text-sm font-medium text-foreground">
                            {PLACEHOLDER_INVOICE.reference}
                          </td>
                          <td className="py-4 text-sm text-muted">
                            {PLACEHOLDER_INVOICE.period}
                          </td>
                          <td className="py-4 text-sm font-bold text-foreground text-right">
                            {PLACEHOLDER_INVOICE.amount.toFixed(2)} TND
                          </td>
                          <td className="py-4 text-right">
                            <Badge variant="brand">{PLACEHOLDER_INVOICE.status}</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                      ← Retour
                    </Button>
                    <Button size="lg" onClick={() => setStep(3)} className="flex-1">
                      Procéder au paiement
                    </Button>
                  </div>
                </div>
                </motion.div>
              )}

              {/* ==================== ÉTAPE 3 : Paiement ==================== */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                <div>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl md:text-2xl text-foreground mb-2">
                    Mode de paiement
                  </h2>
                  <p className="text-muted text-sm mb-8">
                    Montant à payer : <strong className="text-primary dark:text-primary-light">{PLACEHOLDER_INVOICE.amount.toFixed(2)} TND</strong>
                  </p>

                  {/* Grille des méthodes de paiement */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                    {PAYMENT_METHODS.map((method) => (
                      <motion.button
                        key={method.id}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
                        onClick={() => setSelectedPayment(method.id)}
                        className={`
                          p-5 rounded-xl border-2 text-center transition-all duration-200 cursor-pointer
                          ${selectedPayment === method.id
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border dark:border-border-2 hover:border-primary/30"
                          }
                        `}
                      >
                        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-3">
                          <MethodIcon name={method.icon} />
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {method.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => setStep(2)} className="flex-1" disabled={isProcessing}>
                      ← Retour
                    </Button>
                    <Button
                      size="lg"
                      onClick={handlePayment}
                      disabled={!selectedPayment || isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Traitement...
                        </span>
                      ) : (
                        "Confirmer le paiement"
                      )}
                    </Button>
                  </div>
                </div>
                </motion.div>
              )}
              </AnimatePresence>
            </Card>
          </RevealOnScroll>
        </Container>
      </section>
    </>
  );
}

/* Icônes simples pour les méthodes de paiement */
function MethodIcon({ name }: { name: string }) {
  const cls = "w-6 h-6 text-primary dark:text-primary-light";
  switch (name) {
    case "wallet":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M2 10h20" />
          <path d="M16 14h2" />
        </svg>
      );
    case "credit-card":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      );
    case "smartphone":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
      );
    case "bank":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 22 7" />
          <rect x="4" y="7" width="16" height="13" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      );
    default:
      return null;
  }
}
