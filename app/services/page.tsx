"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RevealOnScroll from "@/components/effects/RevealOnScroll";

const OFFERS = [
  { title: "Internet Fibre", price: "29.9", unit: "TND/mois", description: "Connexion haute vitesse jusqu'à 1 Gbit/s.", features: ["Débit up to 1 Gbit/s", "Sans frais d'installation", "Support 24/7", "Modem WiFi inclus"], badge: "brand" as const },
  { title: "Mobile", price: "19.9", unit: "TND/mois", description: "Forfaits mobiles flexibles avec couverture nationale.", features: ["50 Go de données", "Appels illimités", "SMS illimités", "Roaming inclus"], badge: "info" as const },
  { title: "TV & Streaming", price: "14.9", unit: "TND/mois", description: "Plus de 200 chaînes et plateformes en qualité 4K.", features: ["200+ chaînes", "Qualité 4K", "Replay 7 jours", "Multi-écrans"], badge: "success" as const },
  { title: "Entreprise", price: "Sur devis", unit: "", description: "Solutions sur mesure : lignes fixes, VPN, cloud.", features: ["Lignes dédiées", "VPN sécurisé", "SLA garanti", "Account manager"], badge: "warning" as const },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Nos Offres
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Des solutions adaptées à chaque besoin : particulier, famille ou entreprise.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {OFFERS.map((offer, i) => (
              <RevealOnScroll key={offer.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Card className="p-8 md:p-10 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <Badge variant={offer.badge}>Offre</Badge>
                        <h3 className="font-[family-name:var(--font-display)] font-bold text-2xl md:text-3xl text-foreground mt-4">
                          {offer.title}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl md:text-4xl gradient-text">
                          {offer.price}
                        </span>
                        {offer.unit && <span className="text-muted text-sm block">{offer.unit}</span>}
                      </div>
                    </div>
                    <p className="text-muted leading-relaxed mb-6">{offer.description}</p>
                    <ul className="space-y-3 mb-8 flex-1">
                      {offer.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0"><polyline points="20 6 9 17 4 12" /></svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asLink href="/signup" className="w-full">Choisir cette offre</Button>
                  </Card>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
