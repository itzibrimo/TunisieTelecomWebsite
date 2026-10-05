"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex items-center justify-center min-h-screen m-0 bg-bg text-foreground font-sans">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-2xl font-bold mb-2">Erreur critique</h1>
          <p className="text-muted-foreground mb-6">
            Une erreur inattendue s&apos;est produite. Veuillez recharger la page.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4 font-mono">
              ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary text-on-primary border-none rounded-lg font-semibold text-sm cursor-pointer hover:bg-primary-hover transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
