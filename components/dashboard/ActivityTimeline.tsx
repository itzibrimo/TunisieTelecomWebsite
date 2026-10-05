"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { ActivityEntry } from "@/lib/types";
import { ACTIVITY_LABELS } from "@/lib/services/activity.service";

function fmtDate(d: unknown): string {
  if (!d) return "";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function ActivityTimeline({ activities, loading }: { activities: ActivityEntry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface-3 rounded w-3/4" />
              <div className="h-2.5 bg-surface-2 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-placeholder" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <p className="text-sm text-muted">Aucune activité récente</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
      <div className="space-y-1">
        {activities.map((entry, i) => {
          const meta = ACTIVITY_LABELS[entry.type] || { label: entry.type, icon: "⚡", color: "bg-surface-3 text-muted" };
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="relative flex items-start gap-3 pl-1 py-2"
            >
              <div className={`relative z-10 w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-medium text-foreground truncate">{entry.title}</p>
                <p className="text-[11px] text-muted truncate mt-0.5">{entry.description}</p>
                <p className="text-[10px] text-placeholder mt-1">{fmtDate(entry.timestamp)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ActivityTimeline);
