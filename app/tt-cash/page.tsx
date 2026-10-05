"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { rechargeSchema, type RechargeFormData } from "@/lib/validations";

/* =============================================================================
 * app/tt-cash/page.tsx — Page de recharge TT Cash
 * Wizard 3 étapes : Saisie → Paiement → Confirmation
 * Montant reçu = montant saisi × 0.877 (commission 12.3 %)
 * ============================================================================= */

const STEPS = ["Saisie", "Paiement", "Confirmation"] as const;

const PAYMENT_METHODS = [
  { id: "card", label: "Carte Bancaire", sub: "Visa / Mastercard", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
  { id: "laposte", label: "Carte La Poste", sub: "Débit direct", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 10h20" /><path d="M16 14h2" /></svg> },
  { id: "flouci", label: "Flouci", sub: "Paiement mobile", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
  { id: "d17", label: "D17", sub: "Paiement mobile", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
] as const;

const COMMISSION_RATE = 0.877; // 100 % − 12.3 % de commission

export default function TtCashPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [toast, setToast] = useState("");

  const { register, watch, formState: { errors }, trigger } = useForm<RechargeFormData>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { phone: "", amount: 20 },
  });

  const amount = watch("amount") ?? 20;
  const phone = watch("phone") ?? "";

  /* Montant reçu après commission — calcul live */
  const received = useMemo(() => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return isNaN(value) ? 0 : +(value * COMMISSION_RATE).toFixed(3);
  }, [amount]);

  /* Générer une référence aléatoire */
  function generateRef(): string {
    return "TT" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  /* Étape 1 → valider puis passer à l'étape 2 */
  async function handleStep1() {
    const valid = await trigger(["phone", "amount"]);
    if (valid) setStep(2);
  }

  /* Étape 2 → sélection du moyen de paiement */
  function handleSelectMethod(methodId: string) {
    setSelectedMethod(methodId);
    setToast("Bientôt disponible");
    setTimeout(() => setToast(""), 2500);
  }

  /* Confirmer le paiement → passer à l'étape 3 */
  function handleConfirm() {
    setReference(generateRef());
    setStep(3);
  }

  /* Recommencer */
  function handleRestart() {
    setStep(1);
    setSelectedMethod(null);
    setReference("");
  }

  return (
    <>
      {/* ===== Hero — gradient-brand ===== */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] rounded-full bg-white/20 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Recharge TT Cash
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Rechargez votre compte TT Cash en toute sécurité. Simple, rapide et instantané.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ===== Wizard ===== */}
      <section className="py-24 md:py-32">
        <Container>
          {/* Indicateur d'étapes */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {STEPS.map((label, i) => {
              const num = (i + 1) as 1 | 2 | 3;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                      ${isDone ? "bg-success text-white" : isActive ? "gradient-brand text-white shadow-lg" : "bg-surface-3 text-muted"}
                    `}
                  >
                    {isDone ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : num}
                  </div>
                  <span className={`text-sm font-semibold hidden sm:block ${isActive ? "text-primary" : "text-muted"}`}>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 ${isDone ? "bg-success" : "bg-surface-3"}`} />
                  )}
                </div>
              );
            })}
          </div>

          <RevealOnScroll>
            <AnimatePresence mode="wait">
            {/* ===== Étape 1 : Saisie ===== */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
              <Card className="max-w-xl mx-auto p-8 md:p-10">
                <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mb-2">
                  Informations de recharge
                </h2>
                <p className="text-muted text-sm mb-8">
                  Entrez votre numéro et le montant souhaité.
                </p>

                <div className="space-y-6">
                  <FormInput
                    label="Numéro de téléphone"
                    placeholder="20 123 456"
                    {...register("phone")}
                    error={errors.phone?.message}
                  />

                  {/* Montant */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-foreground">
                      Montant (DT)
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      step={1}
                      className="w-full accent-primary dark:accent-primary-light h-2 rounded-full cursor-pointer"
                      value={typeof amount === "string" ? parseInt(amount) || 1 : amount}
                      {...register("amount", { valueAsNumber: true })}
                    />
                    <div className="flex items-center gap-3">
                      <FormInput
                        label=""
                        type="number"
                        min={1}
                        max={100}
                        placeholder="20"
                        className="text-center text-lg font-bold"
                        {...register("amount", { valueAsNumber: true })}
                        error={errors.amount?.message}
                      />
                      <span className="text-muted font-medium pt-1">DT</span>
                    </div>
                  </div>

                  {/* Calcul live du montant reçu */}
                  <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                    <p className="text-sm text-muted">
                      Montant à payer
                    </p>
                    <p className="text-2xl font-[family-name:var(--font-display)] font-extrabold text-foreground">
                      {typeof amount === "string" ? parseFloat(amount) || 0 : amount} DT
                    </p>
                    <div className="mt-2 pt-2 border-t border-success/20">
                      <p className="text-sm text-muted">
                        Vous recevez
                      </p>
                      <p className="text-3xl font-[family-name:var(--font-display)] font-extrabold text-success">
                        {received} DT
                      </p>
                    </div>
                    <p className="text-xs text-muted mt-2">
                      * Commission de 12.3 % appliquée
                    </p>
                  </div>

                  <Button size="lg" className="w-full" onClick={handleStep1}>
                    Continuer vers le paiement
                  </Button>
                </div>
              </Card>
              </motion.div>
            )}

            {/* ===== Étape 2 : Paiement ===== */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
              <Card className="max-w-xl mx-auto p-8 md:p-10">
                <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mb-2">
                  Choisir le moyen de paiement
                </h2>
                <p className="text-muted text-sm mb-8">
                  Recharge de <strong>{phone}</strong> —{" "}
                  <strong>{received} DT</strong> reçus.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => handleSelectMethod(method.id)}
                      className={`
                        p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                        hover:border-primary hover:shadow-md
                        ${selectedMethod === method.id
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border bg-bg-elevated"
                        }
                      `}
                    >
                      <span className="text-primary dark:text-primary-light mb-3 block">{method.icon}</span>
                      <p className="font-semibold text-foreground text-sm">
                        {method.label}
                      </p>
                      <p className="text-muted text-xs mt-0.5">{method.sub}</p>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 mt-8">
                  <Button variant="ghost" size="md" onClick={() => setStep(1)}>
                    ← Retour
                  </Button>
                  <Button size="md" className="flex-1" onClick={handleConfirm} disabled={!selectedMethod}>
                    Confirmer le paiement
                  </Button>
                </div>
              </Card>
              </motion.div>
            )}

            {/* ===== Étape 3 : Confirmation ===== */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}>
              <Card className="max-w-xl mx-auto p-8 md:p-10 text-center">
                {/* Checkmark animé */}
                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-[bounce-in_0.6s_ease-out]"
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.2" />
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>

                <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mb-2">
                  Recharge effectuée !
                </h2>
                <p className="text-muted text-sm mb-8">
                  Votre compte TT Cash a été rechargé avec succès.
                </p>

                <div className="space-y-4 text-left max-w-sm mx-auto mb-8">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-surface">
                    <span className="text-muted text-sm">Numéro</span>
                    <span className="font-semibold text-foreground text-sm">{phone}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-surface">
                    <span className="text-muted text-sm">Montant reçu</span>
                    <span className="font-bold text-success text-lg">{received} DT</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-surface">
                    <span className="text-muted text-sm">Référence</span>
                    <span className="font-mono font-semibold text-primary text-sm">{reference}</span>
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={handleRestart}>
                  Nouvelle recharge
                </Button>
              </Card>
              </motion.div>
            )}
            </AnimatePresence>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ===== Toast notification ===== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fade-in_0.3s_ease-out]">
          <div className="px-6 py-3 rounded-full bg-foreground dark:bg-bg text-white dark:text-foreground text-sm font-semibold shadow-float">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
