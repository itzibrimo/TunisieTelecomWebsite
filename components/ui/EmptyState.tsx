import { memo } from "react";
import { type Variants, motion } from "framer-motion";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryAction?: { label: string; href?: string; onClick?: () => void };
  secondaryAction?: { label: string; href?: string; onClick?: () => void };
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function EmptyState({ title, description, icon, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
          {icon}
        </div>
      )}

      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      <div className="flex flex-wrap gap-3">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-foreground text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg-elevated transition-all duration-200"
          >
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-3 hover:bg-surface-3 text-foreground-2 hover:text-foreground text-sm font-medium border border-border hover:border-border-2 transition-all duration-200"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default memo(EmptyState);
