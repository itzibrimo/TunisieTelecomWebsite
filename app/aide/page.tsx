"use client";

/* =============================================================================
 * app/aide/page.tsx — Aide & Assistant TT
 * 3 services avec mini-formulaires extensibles : Couverture Internet, Roaming, IPv6
 * Utilise FormInput, Card, Button, COUNTRIES
 * ============================================================================= */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Combobox from "@/components/ui/Combobox";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { TUNISIAN_GOVERNORATES } from "@/lib/constants";

type ServiceId = "internet" | "roaming" | "ipv6";

const SERVICES: {
  id: ServiceId;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    id: "internet",
    title: "Couverture Internet",
    description: "Vérifiez la disponibilité de la connexion Internet à votre adresse.",
    icon: "wifi",
  },
  {
    id: "roaming",
    title: "Couverture Roaming",
    description: "Consultez la couverture roaming TT disponible dans les gouvernorats tunisiens pour vos déplacements.",
    icon: "globe",
  },
  {
    id: "ipv6",
    title: "Activation IPv6",
    description: "Activez l'adresse IPv6 sur votre ligne pour un accès optimisé.",
    icon: "shield",
  },
];

export default function AidePage() {
  // Service actuellement ouvert (null = aucun)
  const [openService, setOpenService] = useState<ServiceId | null>(null);

  // États locaux pour chaque formulaire
  const [internetPhone, setInternetPhone] = useState("");
  const [internetLoading, setInternetLoading] = useState(false);
  const [internetResult, setInternetResult] = useState<string | null>(null);

  const [roamingGovernorate, setRoamingGovernorate] = useState("");
  const [roamingLoading, setRoamingLoading] = useState(false);
  const [roamingResult, setRoamingResult] = useState<string | null>(null);

  const [ipv6Phone, setIpv6Phone] = useState("");
  const [ipv6Cin, setIpv6Cin] = useState("");
  const [ipv6Loading, setIpv6Loading] = useState(false);
  const [ipv6Result, setIpv6Result] = useState<string | null>(null);

  function toggleService(id: ServiceId) {
    setOpenService((prev) => (prev === id ? null : id));
    // Réinitialiser les résultats quand on ferme
    setInternetResult(null);
    setRoamingResult(null);
    setIpv6Result(null);
  }

  // --- Handlers fictifs (placeholder) ---

  function handleInternetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!internetPhone.trim()) return;
    setInternetLoading(true);
    setInternetResult(null);
    setTimeout(() => {
      setInternetLoading(false);
      setInternetResult(
        `Vérification en cours pour le numéro ${internetPhone}. Vous recevrez un SMS de confirmation.`
      );
    }, 1500);
  }

  function handleRoamingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roamingGovernorate) return;
    setRoamingLoading(true);
    setRoamingResult(null);
    setTimeout(() => {
      setRoamingLoading(false);
      setRoamingResult(
        `La couverture roaming TT est disponible dans le gouvernorat de ${roamingGovernorate}. Activez le roaming depuis votre espace client ou en composant *222#.`
      );
    }, 1500);
  }

  function handleIpv6Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ipv6Phone.trim() || !ipv6Cin.trim()) return;
    setIpv6Loading(true);
    setIpv6Result(null);
    setTimeout(() => {
      setIpv6Loading(false);
      setIpv6Result(
        `Demande d'activation IPv6 enregistrée pour le numéro ${ipv6Phone} (CIN: ${ipv6Cin}). Vous serez notifié sous 48h.`
      );
    }, 1500);
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
              Aide & Assistant
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Vérifiez la couverture, activez des services et obtenez de l&apos;aide en quelques clics.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* Grille de services */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SERVICES.map((service, i) => (
              <RevealOnScroll key={service.id} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                <Card
                  className={`p-8 cursor-pointer transition-all duration-300 ${
                    openService === service.id
                      ? "ring-2 ring-primary dark:ring-primary-light shadow-lg"
                      : ""
                  }`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary/10 flex items-center justify-center mb-5">
                    <ServiceIcon name={service.icon} />
                  </div>
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted text-sm leading-relaxed">
                    {service.description}
                  </p>
                  <div className="mt-4 text-primary dark:text-primary-light text-sm font-semibold flex items-center gap-1">
                    {openService === service.id ? "Fermer" : "Vérifier"}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-300 ${
                        openService === service.id ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </Card>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>

          {/* ==================== Formulaire Couverture Internet ==================== */}
          <AnimatePresence>
          {openService === "internet" && (
            <RevealOnScroll>
              <div className="max-w-2xl mx-auto mt-10">
                <Card className="p-8 md:p-10">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-6">
                    Vérifier la couverture Internet
                  </h3>

                  <form onSubmit={handleInternetSubmit} className="space-y-5">
                    <FormInput
                      label="Numéro de téléphone"
                      type="tel"
                      placeholder="20 123 456"
                      value={internetPhone}
                      onChange={(e) => setInternetPhone(e.target.value)}
                    />

                    <Button type="submit" disabled={internetLoading || !internetPhone.trim()} className="w-full sm:w-auto">
                      {internetLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Vérification en cours...
                        </span>
                      ) : (
                        "Vérifier la couverture"
                      )}
                    </Button>
                  </form>

                  {internetResult && (
                    <div className="mt-6 p-4 rounded-xl bg-success/10 text-success text-sm font-medium">
                      {internetResult}
                    </div>
                  )}
                </Card>
              </div>
            </RevealOnScroll>
          )}

          {/* ==================== Formulaire Couverture Roaming ==================== */}
          {openService === "roaming" && (
            <RevealOnScroll>
              <div className="max-w-2xl mx-auto mt-10">
                <Card className="p-8 md:p-10">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-6">
                    Couverture Roaming
                  </h3>

                  <form onSubmit={handleRoamingSubmit} className="space-y-5">
                    <Combobox
                      label="Gouvernorat de destination"
                      options={TUNISIAN_GOVERNORATES}
                      value={roamingGovernorate}
                      onChange={setRoamingGovernorate}
                      placeholder="Rechercher un gouvernorat..."
                      emptyHint="Aucun gouvernorat trouvé"
                      hint="Sélectionnez le gouvernorat où vous souhaitez vérifier la couverture roaming"
                    />

                    <Button type="submit" disabled={roamingLoading || !roamingGovernorate} className="w-full sm:w-auto">
                      {roamingLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Vérification en cours...
                        </span>
                      ) : (
                        "Vérifier la disponibilité"
                      )}
                    </Button>
                  </form>

                  {roamingResult && (
                    <div className="mt-6 p-4 rounded-xl bg-success/10 text-success text-sm font-medium">
                      {roamingResult}
                    </div>
                  )}
                </Card>
              </div>
            </RevealOnScroll>
          )}

          {/* ==================== Formulaire Activation IPv6 ==================== */}
          {openService === "ipv6" && (
            <RevealOnScroll>
              <div className="max-w-2xl mx-auto mt-10">
                <Card className="p-8 md:p-10">
                  <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-6">
                    Activation IPv6
                  </h3>

                  <form onSubmit={handleIpv6Submit} className="space-y-5">
                    <FormInput
                      label="Numéro de téléphone"
                      type="tel"
                      placeholder="20 123 456"
                      value={ipv6Phone}
                      onChange={(e) => setIpv6Phone(e.target.value)}
                    />
                    <FormInput
                      label="Numéro CIN"
                      placeholder="12345678"
                      value={ipv6Cin}
                      onChange={(e) => setIpv6Cin(e.target.value)}
                    />

                    <Button
                      type="submit"
                      disabled={ipv6Loading || !ipv6Phone.trim() || !ipv6Cin.trim()}
                      className="w-full sm:w-auto"
                    >
                      {ipv6Loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Traitement en cours...
                        </span>
                      ) : (
                        "Demander l'activation"
                      )}
                    </Button>
                  </form>

                  {ipv6Result && (
                    <div className="mt-6 p-4 rounded-xl bg-success/10 text-success text-sm font-medium">
                      {ipv6Result}
                    </div>
                  )}
                </Card>
              </div>
            </RevealOnScroll>
          )}
          </AnimatePresence>
        </Container>
      </section>
    </>
  );
}

/* Icônes pour les 3 services */
function ServiceIcon({ name }: { name: string }) {
  const cls = "w-7 h-7 text-primary dark:text-primary-light";
  switch (name) {
    case "wifi":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      );
    case "globe":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
}
