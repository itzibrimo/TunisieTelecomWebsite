"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Container from "@/components/ui/Container";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import RevealOnScroll from "@/components/effects/RevealOnScroll";
import { TT_OFFERS } from "@/lib/constants";
import { useUser } from "@/lib/hooks/useUser";

/* =============================================================================
 * app/checkout/page.tsx — Page de paiement / checkout
 * Lit l'offre depuis ?offer=, affiche les détails, paiement simulé
 * Redirige vers /login si non authentifié
 * ============================================================================= */

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [toast, setToast] = useState("");

  const offerId = searchParams.get("offer");
  const offer = TT_OFFERS.find((o) => o.id === offerId);

  /* Rediriger vers /login si non connecté */
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  /* Écran de chargement pendant la vérification auth */
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  /* Non connecté — pas encore redirigé */
  if (!user) return null;

  /* Offre introuvable */
  if (!offer) {
    return (
      <>
        <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
          <Container className="relative z-10">
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold text-white leading-tight">
              Paiement
            </h1>
          </Container>
        </section>
        <section className="py-24">
          <Container>
            <Card className="max-w-xl mx-auto p-8 md:p-10 text-center">
              <p className="text-muted text-lg mb-6">
                Offre introuvable ou paramètre invalide.
              </p>
              <Button asLink href="/offres" size="md">
                Retour aux offres
              </Button>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  /** Simuler le paiement → toast de succès */
  function handlePayment() {
    setToast("Paiement confirmé ! Offre souscrite avec succès.");
    setTimeout(() => setToast(""), 4000);
  }

  return (
    <>
      {/* ===== Hero — gradient-brand ===== */}
      <section className="pt-16 pb-20 gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -bottom-20 left-1/4 w-[400px] h-[400px] rounded-full bg-white/20 blur-3xl" />
        </div>
        <Container className="relative z-10">
          <RevealOnScroll>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
              Paiement
            </h1>
            <p className="text-white/80 text-lg mt-6 max-w-xl">
              Finalisez la souscription de votre offre TT.
            </p>
          </RevealOnScroll>
        </Container>
      </section>

      {/* ===== Contenu checkout ===== */}
      <section className="py-24 md:py-32">
        <Container>
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Détails de l'offre sélectionnée */}
            <RevealOnScroll>
              <Card className="p-8 md:p-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Badge variant="brand">Offre sélectionnée</Badge>
                    <h2 className="font-[family-name:var(--font-display)] font-bold text-2xl text-foreground mt-3">
                      {offer.title}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="font-[family-name:var(--font-display)] font-extrabold text-4xl text-primary">
                      {offer.price}
                    </span>
                    <span className="text-muted text-sm block">{offer.unit}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-2">
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Données : <strong className="ml-1">{offer.data}</strong>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Appels : <strong className="ml-1">{offer.calls}</strong>
                  </li>
                  <li className="flex items-center gap-3 text-sm text-foreground">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-success">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    SMS : <strong className="ml-1">{offer.sms}</strong>
                  </li>
                </ul>
              </Card>
            </RevealOnScroll>

            {/* Zone de paiement */}
            <RevealOnScroll delay={0.1}>
              <Card className="p-8 md:p-10">
                <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-4">
                  Moyen de paiement
                </h3>

                <div className="p-4 rounded-xl bg-surface border border-dashed border-border text-center mb-6">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-2 text-muted"
                  >
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  <p className="text-muted text-sm font-medium">
                    Paiement simulé — Intégration future avec la passerelle TT
                  </p>
                </div>

                {/* Récapitulatif */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-surface mb-6">
                  <span className="text-muted text-sm">Total à payer</span>
                  <span className="font-[family-name:var(--font-display)] font-extrabold text-xl text-primary">
                    {offer.price} {offer.unit.replace("/mois", "")}
                  </span>
                </div>

                <Button size="lg" className="w-full" onClick={handlePayment}>
                  Confirmer le paiement
                </Button>

                <p className="text-center text-xs text-muted mt-4">
                  En confirmant, vous acceptez les{" "}
                  <span className="text-primary font-semibold cursor-pointer hover:underline">
                    conditions générales
                  </span>{" "}
                  de TT Digital.
                </p>
              </Card>
            </RevealOnScroll>

            {/* Lien retour */}
            <div className="text-center">
              <Button variant="ghost" size="sm" asLink href="/offres">
                ← Retour aux offres
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ===== Toast succès ===== */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fade-in_0.3s_ease-out]">
          <div className="px-6 py-3 rounded-full bg-success text-white text-sm font-semibold shadow-float">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}

/* Suspense wrapper nécessaire pour useSearchParams */
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
      <div className="flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
