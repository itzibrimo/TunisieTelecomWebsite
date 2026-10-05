"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import { showToast } from "@/components/ui/Toast";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { efactureStep1Schema, efactureStep3Schema, type EFactureStep1Data, type EFactureStep3Data } from "@/lib/validations";
import { useUser } from "@/lib/hooks/useUser";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type Step = 1 | 2 | 3;

function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
            step === s ? "bg-primary text-white shadow-lg"
            : step > s ? "bg-success text-white"
            : "bg-surface-3 text-muted dark:text-muted-foreground"
          }`}>
            {step > s ? "✓" : s}
          </div>
          {s < 3 && <div className={`w-16 h-1 rounded-full transition-all duration-500 ${step > s ? "bg-success" : "bg-surface-3"}`} />}
        </div>
      ))}
    </div>
  );
}

export default function EFacturePage() {
  const { user } = useUser();
  const [step, setStep] = useState<Step>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const step1Form = useForm<EFactureStep1Data>({
    resolver: zodResolver(efactureStep1Schema),
  });

  const step3Form = useForm<EFactureStep3Data>({
    resolver: zodResolver(efactureStep3Schema),
  });

  function handleStep1Submit(data: EFactureStep1Data) {
    setStep(2);
  }

  async function handleFinalSubmit(data: EFactureStep3Data) {
    if (!user) {
      showToast("Veuillez vous connecter pour vous inscrire à e-Facture.", "warning");
      return;
    }
    setIsProcessing(true);
    try {
      const db = getFirebaseDb();
      const phone = step1Form.getValues("phone");
      const subId = `efacture_${user.uid}_${crypto.randomUUID().slice(0, 8)}`;
      await setDoc(doc(db, "efacture_subscriptions", subId), {
        phone,
        email: data.email,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("[e-Facture] Erreur:", err);
      showToast("Une erreur est survenue. Veuillez réessayer.", "error");
    } finally { setIsProcessing(false); }
  }

  if (isSuccess) {
    return (
      <>
        <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
          <Container className="relative z-10"><h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold text-white">e-Facture</h1></Container>
        </section>
        <section className="py-24 md:py-32">
          <Container>
            <RevealOnScroll>
              <Card className="p-10 md:p-14 max-w-lg mx-auto text-center">
                <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-success"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mb-3">Inscription confirmée !</h2>
                <p className="text-muted mb-8">Vous recevrez vos factures par email.</p>
                <Button asLink href="/" size="lg" className="w-full">Retour à l&apos;accueil</Button>
              </Card>
            </RevealOnScroll>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute bottom-10 left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" /></div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white">e-Facture</h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">Recevez vos factures par email.</p>
          </RevealOnScroll>
        </Container>
      </section>
      <section className="py-24 md:py-32">
        <Container>
          <RevealOnScroll>
            <Card className="p-8 md:p-12 max-w-2xl mx-auto">
              <StepIndicator step={step} />
              {!user && (
                <div className="mb-6 p-4 rounded-xl bg-warning/10 text-warning font-medium text-sm border border-warning/20 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Vous devez être connecté pour vous inscrire à e-Facture.
                  </span>
                  <Link href="/login" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-warning text-white text-xs font-semibold hover:bg-warning/90 transition-colors">
                    Se connecter
                  </Link>
                </div>
              )}
              <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-2">Votre numéro</h2>
                  <p className="text-muted text-sm mb-8">Numéro associé à votre compte TT.</p>
                  <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                    <FormInput label="Numéro de téléphone" type="tel" placeholder="20 123 456" error={step1Form.formState.errors.phone?.message} {...step1Form.register("phone")} />
                    <Button type="submit" size="lg" className="w-full sm:w-auto">Continuer</Button>
                  </form>
                </motion.div>
              )}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-2">Confirmer l&apos;inscription</h2>
                  <p className="text-muted text-sm mb-6">Vous recevrez vos factures par email. Fini les factures papier !</p>
                  <p className="text-muted text-sm mb-6">Numéro : <strong className="text-foreground">{step1Form.getValues("phone")}</strong></p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Retour</Button>
                    <Button size="lg" onClick={() => setStep(3)} className="flex-1">Confirmer</Button>
                  </div>
                </motion.div>
              )}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-2">Adresse email</h2>
                  <p className="text-muted text-sm mb-8">Où recevoir vos factures ?</p>
                  <form onSubmit={step3Form.handleSubmit(handleFinalSubmit)} className="space-y-6">
                    <FormInput label="Adresse email" type="email" placeholder="votre@email.com" error={step3Form.formState.errors.email?.message} {...step3Form.register("email")} />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="button" variant="ghost" onClick={() => setStep(2)} className="flex-1" disabled={isProcessing}>← Retour</Button>
                      <Button type="submit" size="lg" disabled={isProcessing} className="flex-1">
                        {isProcessing ? <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Inscription...</span> : "S'inscrire à e-Facture"}
                      </Button>
                    </div>
                  </form>
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
