"use client";

import { motion } from "framer-motion";

/* =============================================================================
 * Progress — Animated progress bar with labels and variants
 * ============================================================================= */

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorMap = {
  default: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-error",
  brand: "bg-gradient-to-r from-primary to-accent-cyan",
};

export default function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  label,
  className = "",
  animated = true,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-foreground">{label || ""}</span>
          {showLabel && (
            <span className="text-xs text-muted tabular-nums">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`w-full ${sizeMap[size]} bg-surface-2 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${Math.round(percentage)}%`}
      >
        <motion.div
          className={`h-full rounded-full origin-left ${colorMap[variant]}`}
          initial={animated ? { scaleX: 0 } : false}
          animate={{ scaleX: percentage / 100 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

/* =============================================================================
 * ProgressCircle — Circular progress indicator
 * ============================================================================= */

interface ProgressCircleProps {
  value: number; // 0-100
  size?: number; // px
  strokeWidth?: number;
  variant?: "default" | "success" | "warning" | "danger" | "brand";
  showLabel?: boolean;
  className?: string;
}

const strokeColorMap = {
  default: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-error)",
  brand: "var(--color-primary)",
};

export function ProgressCircle({
  value,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  showLabel = false,
  className = "",
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColorMap[variant]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-semibold text-foreground tabular-nums">
          {Math.round(value)}
        </span>
      )}
    </div>
  );
}
