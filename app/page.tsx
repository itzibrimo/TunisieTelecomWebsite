"use client";

import { useRef, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { RevealOnScroll, MagneticButton } from "@/components/effects/Animations";
import { STATS, SERVICES, TESTIMONIALS } from "@/lib/constants";

/* =============================================================================
 * Landing Page — Enterprise SaaS
 * Color system: purple #6843EC, cyan #22D3EE, dark #0A0A0F/#13131A
 * ============================================================================= */

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const iconMap: Record<string, React.ReactNode> = {
  smartphone: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>,
  wifi: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>,
  tv: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="17 2 12 7 7 2" /></svg>,
  headphones: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /></svg>,
  user: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  building: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9.01" y2="6" /></svg>,
};

const features = [
  { title: "Réseau 5G & Fibre", desc: "Couverture nationale avec les dernières technologies de transmission haute vitesse.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>, accent: "indigo" },
  { title: "Application MyTT", desc: "Gérez votre compte, factures et services directement depuis votre smartphone.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>, accent: "cyan" },
  { title: "Support 24/7", desc: "Une équipe dédiée pour répondre à vos questions à tout moment.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" /></svg>, accent: "cyan" },
  { title: "Services Entreprise", desc: "Solutions VPN, cloud et téléphonie d'entreprise sur mesure.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="6" x2="9.01" y2="6" /></svg>, accent: "amber" },
];

const featureAccents: Record<string, { iconBg: string; iconText: string; hoverBorder: string }> = {
  indigo: { iconBg: "bg-primary-500/10", iconText: "text-primary-400", hoverBorder: "hover:border-primary-500/30" },
  cyan: { iconBg: "bg-accent-cyan/10", iconText: "text-accent-cyan", hoverBorder: "hover:border-accent-cyan/30" },
  violet: { iconBg: "bg-accent-cyan/10", iconText: "text-accent-cyan", hoverBorder: "hover:border-accent-cyan/30" },
  amber: { iconBg: "bg-warning/10", iconText: "text-warning", hoverBorder: "hover:border-warning/30" },
};

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const isFloat = value % 1 !== 0;
        function tick(now: number) {
          const progress = Math.min((now - start) / 2000, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(isFloat ? parseFloat((eased * value).toFixed(1)) : Math.floor(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <div ref={ref} className="tabular-nums">{display}{suffix}</div>;
}

export default function HomePage() {
  return (
    <div className="bg-bg">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-bg via-surface to-bg">
        {/* Animated grid */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
            animate={{ x: [0, 48], y: [0, 48] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Gradient orbs */}
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-10 right-[10%] w-[500px] h-[500px] rounded-full bg-primary-600/[0.08] blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -25, 20, 0], y: [0, 20, -15, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: -8 }}
          className="absolute bottom-10 left-[5%] w-[450px] h-[450px] rounded-full bg-accent-cyan/[0.06] blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, 15, -10, 0], y: [0, -10, 20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: -15 }}
          className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-primary-400/[0.04] blur-[80px]"
        />

        <Container className="relative z-10 pt-24 pb-20">
          <div className="max-w-3xl">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-400 text-xs font-semibold mb-6 border border-primary-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                  La vie est émotions
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                className="font-[family-name:var(--font-display)] font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.92] tracking-tight text-foreground mb-6"
              >
                Connecter
                <br />
                <span className="bg-gradient-to-r from-primary via-primary-light to-accent-cyan bg-clip-text text-transparent">la Tunisie</span>
                <br />
                au futur
              </motion.h1>

              <motion.p variants={staggerItem} className="text-lg md:text-xl text-muted max-w-lg leading-relaxed mb-10">
                Fibre optique, mobile, TV et solutions entreprise. Une expérience télécom nouvelle génération.
              </motion.p>

              <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
                <MagneticButton>
                  <Button size="lg" asLink href="/offres" className="bg-primary-600 hover:bg-primary-500 text-foreground shadow-lg shadow-primary/25 hover:shadow-primary/30 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200">
                    Découvrir nos offres
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="ml-2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Button>
                </MagneticButton>
                <Button size="lg" asLink href="/contact" className="bg-transparent text-foreground-2 border border-border hover:bg-surface-2 hover:text-foreground hover:border-border focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200">
                  Nous contacter
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </Container>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 0.8 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="w-5 h-8 rounded-full border-2 border-border/50 flex justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-muted-foreground/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="py-24 md:py-32 bg-surface">
        <Container>
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-accent-cyan/10 text-accent-cyan text-xs font-semibold mb-4 border border-accent-cyan/20">Services</span>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-4">Tout ce dont vous avez besoin</h2>
              <p className="text-lg text-muted max-w-2xl mx-auto">Accédez rapidement à toutes nos offres et services.</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
              {SERVICES.map((service) => (
                <motion.div key={service.id} whileHover={{ y: -6, scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 20 }} style={{ willChange: "transform" }}>
                  <Link href={service.href} className="group block">
                    <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-bg/80 border border-border shadow-lg shadow-black/10 hover:border-primary-500/30 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300">
                      <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400 mb-3 group-hover:bg-primary-600 group-hover:text-foreground transition-all duration-300">
                        {iconMap[service.icon]}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-0.5 group-hover:text-foreground transition-colors">{service.title}</h3>
                      <p className="text-[11px] text-muted-foreground">{service.subtitle}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 text-xs font-semibold mb-4 border border-primary-500/20">Pourquoi TT Digital</span>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-4">Une expérience conçue pour vous</h2>
              <p className="text-lg text-muted max-w-2xl mx-auto">Nous combinons technologie de pointe et service client exceptionnel.</p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {features.map((f, i) => {
              const accent = featureAccents[f.accent];
              return (
                <RevealOnScroll key={f.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ willChange: "transform" }}
                  >
                    <div className={`h-full p-6 rounded-2xl bg-surface/80 border border-border shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-primary/15 ${accent.hoverBorder} transition-all duration-300`}>
                      <div className={`w-12 h-12 rounded-xl ${accent.iconBg} flex items-center justify-center ${accent.iconText} mb-4`}>
                        {f.icon}
                      </div>
                      <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">{f.title}</h3>
                      <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                </RevealOnScroll>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary-950/50 via-surface to-accent-cyan/30 relative overflow-hidden border-y border-primary-500/10">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ x: [0, 40, -30, 0], y: [0, -25, 20, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary-600/10 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -30, 25, 0], y: [0, 15, -20, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: -5 }}
            className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-accent-cyan/10 blur-2xl"
          />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {STATS.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                  className="text-center"
                >
                  <div className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-primary-400 to-accent-cyan bg-clip-text text-transparent mb-2">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-muted text-sm font-medium">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <RevealOnScroll>
            <div className="text-center mb-12">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-semibold mb-4 border border-warning/20">Témoignages</span>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-3xl md:text-4xl lg:text-5xl text-foreground tracking-tight mb-4">Ce que disent nos clients</h2>
              <p className="text-lg text-muted max-w-2xl mx-auto">La confiance de millions de Tunisiens.</p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <RevealOnScroll key={t.name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3 }} className="h-full">
                  <div className="h-full flex flex-col p-6 rounded-2xl bg-surface/80 border border-border shadow-lg shadow-black/10 hover:border-primary-500/20 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-foreground-2 leading-relaxed flex-1 mb-6 text-sm">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="w-10 h-10 rounded-full bg-surface-2 overflow-hidden flex-shrink-0 relative">
                        <Image
                          src={t.image}
                          alt={t.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ LOGO MARQUEE ═══ */}
      <section className="py-16 border-y border-border bg-surface">
        <RevealOnScroll>
          <p className="text-center text-xs font-semibold text-muted-foreground mb-8 uppercase tracking-widest">Nos partenaires technologiques</p>
        </RevealOnScroll>
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-surface to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-surface to-transparent z-10" />
          <div className="animate-marquee flex gap-16 items-center w-max hover:[animation-play-state:paused]">
            {[...["OPPO", "Huawei", "Samsung", "Nokia", "ZTE", "FiberStar", "Cisco", "Ericsson"], ...["OPPO", "Huawei", "Samsung", "Nokia", "ZTE", "FiberStar", "Cisco", "Ericsson"]].map((name, i) => (
              <span key={`${name}-${i}`} className="flex-shrink-0 text-xl font-[family-name:var(--font-display)] font-bold text-muted-foreground select-none">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-24 md:py-32 bg-bg">
        <Container>
          <RevealOnScroll>
            <motion.div
              className="relative rounded-3xl overflow-hidden p-12 md:p-20 text-center border border-primary-500/20"
              style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, var(--color-surface, #13131A) 40%, var(--color-bg, #0A0A0F) 60%, rgba(34,211,238,0.08) 100%)" }}
            >
              <motion.div
                animate={{ x: [0, 20, -15, 0], y: [0, -15, 10, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-600/10 blur-3xl -translate-y-1/2 translate-x-1/2"
              />
              <motion.div
                animate={{ x: [0, -15, 20, 0], y: [0, 10, -15, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: -4 }}
                className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-accent-cyan/5 blur-2xl translate-y-1/2 -translate-x-1/2"
              />

              <div className="relative z-10">
                <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl font-bold text-foreground mb-4">Prêt à passer au niveau supérieur ?</h2>
                <p className="text-muted text-lg max-w-xl mx-auto mb-8">Rejoignez les millions de Tunisiens qui font confiance à TT Digital.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <MagneticButton>
                    <Button size="lg" asLink href="/signup" className="bg-primary-600 hover:bg-primary-500 text-foreground shadow-lg shadow-primary/25 hover:shadow-primary/30 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200">
                      Créer un compte
                    </Button>
                  </MagneticButton>
                  <Button size="lg" asLink href="/contact" className="bg-transparent text-foreground-2 border border-border hover:bg-surface-2 hover:text-foreground hover:border-border focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg transition-all duration-200">
                    Parler à un conseiller
                  </Button>
                </div>
              </div>
            </motion.div>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  );
}
