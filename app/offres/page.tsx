"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import SectionHeading from "@/components/ui/SectionHeading";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { TT_OFFERS } from "@/lib/constants";
import { useUser } from "@/lib/hooks/useUser";

/* =============================================================================
 * app/offres/page.tsx — Page des offres TT
 * Grille de 6 offres avec badges, prix, données, appels, SMS
 * Bouton : connecté → /checkout?offer={id}, sinon → /login
 * ============================================================================= */

/** Mapper le label du badge vers la variante du composant Badge */
function badgeVariant(badge: string): "brand" | "success" | "info" | "default" {
  const lower = badge.toLowerCase();
  if (lower.includes("populaire") || lower.includes("meilleur")) return "brand";
  if (lower.includes("premium") || lower.includes("fibre")) return "info";
  if (lower.includes("économique")) return "success";
  return "default";
}

export default function OffresPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  /** Rediriger vers checkout ou login selon l'état d'authentification */
  function handleChoose(offerId: string) {
    if (user) {
      router.push(`/checkout?offer=${offerId}`);
    } else {
      router.push("/login");
    }
  }

  return (
    <>
      {/* ===== Hero — gradient-brand, texte blanc ===== */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Nos Offres
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Trouvez le forfait qui vous correspond. Mobile, fibre ou internet — TT Digital a la solution idéale.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ===== Grille d'offres ===== */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeading
            title="Choisissez votre forfait"
            subtitle="Des offres pensées pour chaque profil, avec la meilleure couverture en Tunisie."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {TT_OFFERS.map((offer, i) => (
              <RevealOnScroll key={offer.id} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}>
                <Card className="p-8 h-full flex flex-col">
                  {/* Badge + titre */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Badge variant={badgeVariant(offer.badge)}>{offer.badge}</Badge>
                      <h3 className="font-[family-name:var(--font-display)] font-bold text-xl text-foreground mt-3">
                        {offer.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-display)] font-extrabold text-3xl text-primary dark:text-primary-light">
                        {offer.price}
                      </span>
                      <span className="text-muted text-xs block">{offer.unit}</span>
                    </div>
                  </div>

                  {/* Détails : données, appels, SMS */}
                  <ul className="space-y-3 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-sm text-foreground dark:text-foreground-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span><strong>{offer.data}</strong> de données</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground dark:text-foreground-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Appels <strong>{offer.calls}</strong></span>
                    </li>
                    <li className="flex items-center gap-3 text-sm text-foreground dark:text-foreground-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>SMS <strong>{offer.sms}</strong></span>
                    </li>
                  </ul>

                  {/* Bouton d'action */}
                  <Button
                    size="md"
                    className="w-full"
                    onClick={() => handleChoose(offer.id)}
                    disabled={loading}
                  >
                    Choisir cette offre
                  </Button>
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
