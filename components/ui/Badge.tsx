import { memo, type HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "brand";
type BadgeSize = "sm" | "md";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  removable?: boolean;
  onRemove?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-muted dark:bg-surface-3 dark:text-muted-foreground",
  success: "bg-success-light text-success-700 dark:bg-success/15 dark:text-success",
  warning: "bg-warning-light text-warning-700 dark:bg-warning/15 dark:text-warning",
  danger: "bg-error-light text-error-700 dark:bg-error/15 dark:text-error",
  info: "bg-info-light text-info-700 dark:bg-info/15 dark:text-info",
  brand: "bg-primary-50 text-primary dark:bg-primary/15 dark:text-primary-light",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-muted",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  info: "bg-info",
  brand: "bg-primary",
};

export default memo(function Badge({
  children,
  variant = "default",
  size = "sm",
  dot,
  removable,
  onRemove,
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-0.5 -mr-1 p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
          aria-label="Retirer"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
});
