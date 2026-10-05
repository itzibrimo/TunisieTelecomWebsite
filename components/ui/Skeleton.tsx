"use client";

import { memo } from "react";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = memo(function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-surface-2 ${className}`} style={style}>
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background: "linear-gradient(90deg, transparent 0%, var(--color-surface-3, rgba(128,128,128,0.06)) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
});

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 space-y-4 shadow-lg shadow-surface">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-surface">
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-lg shadow-surface">
      <div className="px-6 py-4 border-b border-border bg-bg-elevated">
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-lg shadow-surface">
      <Skeleton className="h-5 w-48 mb-6" />
      <div className="flex items-end gap-2 h-48">
        {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 45, 65].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
