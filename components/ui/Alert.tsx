"use client";

import { type ReactNode } from "react";

/* =============================================================================
 * Alert — Informational/alert banners
 * ============================================================================= */

interface AlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles = {
  info: "bg-info-light text-info-700 border-info/20 dark:bg-info/10 dark:text-info dark:border-info/20",
  success: "bg-success-light text-success-700 border-success/20 dark:bg-success/10 dark:text-success dark:border-success/20",
  warning: "bg-warning-light text-warning-700 border-warning/20 dark:bg-warning/10 dark:text-warning dark:border-warning/20",
  danger: "bg-error-light text-error-700 border-error/20 dark:bg-error/10 dark:text-error dark:border-error/20",
};

const iconMap = {
  info: (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  danger: (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function Alert({
  variant = "info",
  title,
  children,
  icon,
  action,
  dismissible = false,
  onDismiss,
  className = "",
}: AlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${variantStyles[variant]} ${className}`}
    >
      <span className="mt-0.5">{icon || iconMap[variant]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
      {dismissible && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
