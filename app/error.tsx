"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 font-[family-name:var(--font-display)]">
        500
      </h1>
      <p className="text-lg text-muted mb-2 font-medium">Erreur interne</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Quelque chose s&apos;est mal passé de notre côté. Nos équipes ont été notifiées.
      </p>
      {error.digest && (
        <p className="text-xs text-placeholder mb-4 font-mono bg-surface-2 px-3 py-1.5 rounded-lg">
          ID d&apos;erreur : {error.digest}
        </p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-surface-2 transition-colors focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-bg"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
