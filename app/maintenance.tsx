import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maintenance programmée",
  description: "TT Digital est actuellement en maintenance. Nous serons de retour très bientôt.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-8 shadow-lg shadow-primary/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3 font-[family-name:var(--font-display)]">
          Maintenance programmée
        </h1>
        <p className="text-muted mb-6">
          Nous améliorons nos systèmes pour vous offrir un meilleur service.
          La disponibilité est prévue très rapidement.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Estimation : 30 minutes
        </div>
        <p className="text-xs text-placeholder mt-8">
          Pour toute urgence, contactez le support au 80 100 010
        </p>
      </div>
    </div>
  );
}
