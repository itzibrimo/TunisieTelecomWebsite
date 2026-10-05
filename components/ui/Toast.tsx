"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  action?: { label: string; onClick: () => void };
  duration?: number;
}

let listeners: ((toast: Toast) => void)[] = [];

export function showToast(
  message: string,
  type: Toast["type"] = "success",
  options?: { action?: Toast["action"]; duration?: number }
) {
  const toast: Toast = {
    id: Math.random().toString(36).slice(2),
    message,
    type,
    ...options,
  };
  listeners.forEach((l) => l(toast));
}

const icons: Record<Toast["type"], React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

const bgColors: Record<Toast["type"], string> = {
  success: "bg-surface border border-success/30 shadow-lg shadow-success/10",
  error: "bg-surface border border-error/30 shadow-lg shadow-error/10",
  info: "bg-surface border border-primary/30 shadow-lg shadow-primary/10",
  warning: "bg-surface border border-warning/30 shadow-lg shadow-warning/10",
};

const iconColors: Record<Toast["type"], string> = {
  success: "text-success",
  error: "text-error",
  info: "text-primary",
  warning: "text-warning",
};

const textColors: Record<Toast["type"], string> = {
  success: "text-foreground",
  error: "text-foreground",
  info: "text-foreground",
  warning: "text-foreground",
};

const closeBtnColors: Record<Toast["type"], string> = {
  success: "text-success/60 hover:text-success",
  error: "text-error/60 hover:text-error",
  info: "text-primary/60 hover:text-primary",
  warning: "text-warning/60 hover:text-warning",
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      const dur = toast.duration || 4000;
      setTimeout(() => removeToast(toast.id), dur);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, [removeToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl pointer-events-auto backdrop-blur-xl ${bgColors[t.type]}`}
          >
            <span className={`flex-shrink-0 mt-0.5 ${iconColors[t.type]}`}>{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${textColors[t.type]}`}>{t.message}</p>
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.onClick();
                    removeToast(t.id);
                  }}
                  className="mt-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className={`flex-shrink-0 p-0.5 rounded-md transition-colors ${closeBtnColors[t.type]}`}
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
