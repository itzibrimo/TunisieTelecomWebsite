"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import FormInput from "@/components/ui/FormInput";
import FormTextarea from "@/components/ui/FormTextarea";
import Button from "@/components/ui/Button";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { contactSchema, type ContactFormData } from "@/lib/validations";
import { showToast } from "@/components/ui/Toast";

const OFFICES = [
  { city: "Tunis", address: "15 Avenue Habib Bourguiba", phone: "+216 71 234 567" },
  { city: "Sfax", address: "8 Rue de la République", phone: "+216 74 234 567" },
  { city: "Sousse", address: "22 Avenue Habib Bourguiba", phone: "+216 73 234 567" },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  function onSubmit(_data: ContactFormData) {
    setSubmitted(true);
    showToast("Message envoyé avec succès ! Nous vous répondrons sous 24h.", "success");
    reset();
    setTimeout(() => setSubmitted(false), 4000);
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Contactez-nous
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Une question ? Un besoin ? Notre équipe est à votre disposition.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* Formulaire + Infos */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              <RevealOnScroll>
                <Card className="p-8 md:p-10">
                  <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mb-6">
                    Envoyez-nous un message
                  </h2>

                  <AnimatePresence>
                    {submitted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 rounded-xl bg-success-light dark:bg-success/10 text-success font-medium text-sm flex items-center gap-3 overflow-hidden"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Message envoyé avec succès ! Nous vous répondrons sous 24h.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormInput label="Nom complet" placeholder="Ahmed Ben Ali" {...register("name")} error={errors.name?.message} />
                      <FormInput label="Email" type="email" placeholder="ahmed@example.com" {...register("email")} error={errors.email?.message} />
                    </div>
                    <FormInput label="Téléphone (optionnel)" placeholder="+216 71 234 567" {...register("phone")} />
                    <FormInput label="Sujet" placeholder="Demande de renseignement" {...register("subject")} error={errors.subject?.message} />
                    <FormTextarea
                      label="Message"
                      required
                      maxLength={1000}
                      showCounter
                      placeholder="Décrivez votre demande..."
                      {...register("message")}
                      error={errors.message?.message}
                    />
                    <Button type="submit" size="lg" className="w-full sm:w-auto">Envoyer le message</Button>
                  </form>
                </Card>
              </RevealOnScroll>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <RevealOnScroll delay={0.1}>
                <Card className="p-8">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-4">Coordonnées</h3>
                  <ul className="space-y-3 text-sm text-muted">
                    <li className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      15 Avenue Habib Bourguiba, Tunis 1000
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary flex-shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/></svg>
                      +216 71 234 567
                    </li>
                    <li className="flex items-center gap-3">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      contact@ttdigital.tn
                    </li>
                  </ul>
                </Card>
              </RevealOnScroll>

              <RevealOnScroll delay={0.2}>
                <Card className="p-8">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-4">Nos agences</h3>
                  <div className="space-y-4">
                    {OFFICES.map((office) => (
                      <motion.div
                        key={office.city}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                        className="border-b border-border last:border-0 pb-3 last:pb-0"
                      >
                        <p className="font-semibold text-foreground text-sm">{office.city}</p>
                        <p className="text-muted text-xs mt-0.5">{office.address}</p>
                        <p className="text-primary text-xs mt-0.5">{office.phone}</p>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </RevealOnScroll>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
