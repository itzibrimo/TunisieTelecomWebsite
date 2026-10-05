import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="text-7xl mb-6">🔍</div>
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 font-[family-name:var(--font-display)]">
        404
      </h1>
      <p className="text-lg text-muted mb-2 font-medium">Page introuvable</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        La page que vous recherchez n&apos;existe pas, a été déplacée ou n&apos;est pas disponible pour le moment.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors shadow-md shadow-primary/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-surface-2 transition-colors"
        >
          Nous contacter
        </Link>
      </div>
    </div>
  );
}
