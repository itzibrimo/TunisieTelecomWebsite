"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import RevealOnScroll from "@/components/effects/RevealOnScroll";

const ease = [0.16, 1, 0.3, 1] as const;

const VALUES = [
  { title: "Innovation", description: "Nous investissons continuellement dans les technologies de pointe.", icon: "💡" },
  { title: "Confiance", description: "La transparence et l'intégrité au cœur de chaque interaction.", icon: "🤝" },
  { title: "Excellence", description: "L'excellence dans chaque service, du réseau à l'assistance.", icon: "⭐" },
  { title: "Proximité", description: "50+ agences à travers la Tunisie pour être toujours proches.", icon: "📍" },
];

const TIMELINE = [
  { year: "1995", title: "Création", desc: "Fondation de Tunisie Telecom, opérateur historique." },
  { year: "2002", title: "ADSL", desc: "Lancement de l'Internet haut débit ADSL en Tunisie." },
  { year: "2012", title: "3G/4G", desc: "Déploiement des réseaux mobiles 3G puis 4G nationalement." },
  { year: "2016", title: "Rebranding", desc: "Nouvelle identité multicolore — La vie est émotions." },
  { year: "2020", title: "Fibre", desc: "Lancement de la fibre optique FTTH pour les particuliers." },
  { year: "2024", title: "TT Digital", desc: "Transformation numérique complète, services cloud et IoT." },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              À propos de<br />TT Digital
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Depuis 1995, nous connectons la Tunisie. Notre mission reste la même : rapprocher les gens.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* Mission */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <RevealOnScroll>
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-wider">Notre mission</span>
                <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-foreground mt-3 mb-6">
                  Connecter chaque Tunisien au monde numérique
                </h2>
                <p className="text-muted leading-relaxed mb-4">
                  TT Digital s&apos;engage à fournir des services télécom accessibles, fiables et innovants.
                  Notre objectif est de démocratiser l&apos;accès à Internet haut débit et aux services numériques.
                </p>
                <p className="text-muted leading-relaxed">
                  Avec plus de 6 millions de clients et 50 agences, nous sommes le premier opérateur du pays.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.2}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4, ease }}
                className="rounded-3xl overflow-hidden shadow-card h-80 lg:h-96 bg-surface-2 relative"
              >
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80"
                  alt="Bureau TT Digital"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* Valeurs */}
      <section className="py-24 md:py-32 bg-surface">
        <Container>
          <RevealOnScroll>
            <SectionHeading title="Nos valeurs" subtitle="Les principes qui guident chaque décision." />
          </RevealOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, i) => (
              <RevealOnScroll key={value.title} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Card className="p-8 text-center h-full">
                    <div className="text-4xl mb-4">{value.icon}</div>
                    <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mb-2">
                      {value.title}
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">{value.description}</p>
                  </Card>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <RevealOnScroll>
            <SectionHeading title="Notre histoire" subtitle="Un quart de siècle d'innovation et de service." />
          </RevealOnScroll>
          <div className="max-w-3xl mx-auto">
            {TIMELINE.map((item, i) => (
              <RevealOnScroll key={item.year} delay={i * 0.08}>
                <div className="flex gap-6 mb-12 last:mb-0">
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                      className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm font-[family-name:var(--font-display)] flex-shrink-0 shadow-md shadow-primary/20"
                    >
                      {item.year.slice(2)}
                    </motion.div>
                    {i < TIMELINE.length - 1 && (
                      <motion.div
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                        className="w-0.5 flex-1 bg-border-2 mt-2 origin-top"
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <span className="text-primary font-bold text-sm">{item.year}</span>
                    <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mt-1">
                      {item.title}
                    </h3>
                    <p className="text-muted text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
