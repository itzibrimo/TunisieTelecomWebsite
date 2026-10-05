import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accès refusé",
  description: "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
  robots: { index: false, follow: false },
};

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="text-7xl mb-6">🔒</div>
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 font-[family-name:var(--font-display)]">
        403
      </h1>
      <p className="text-lg text-muted mb-2 font-medium">Accès refusé</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
        Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez l&apos;administrateur.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
        >
          Tableau de bord
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-surface-2 transition-colors"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
