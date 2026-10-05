import Link from "next/link";
import { type Variants, motion } from "framer-motion";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function ErrorState({
  title = "Quelque chose s'est mal passé",
  description = "Une erreur est survenue. Veuillez réessayer ou contacter le support.",
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-5">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg-elevated transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Réessayer
          </button>
        )}
        <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-3 hover:bg-surface-3 text-foreground-2 hover:text-foreground text-sm font-medium border border-border hover:border-border-2 transition-all duration-200">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Retour à l&apos;accueil
        </Link>
      </div>
    </motion.div>
  );
}
