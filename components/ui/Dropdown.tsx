"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============================================================================
 * DropdownMenu — Floating action menu triggered by click
 * ============================================================================= */

interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export default function DropdownMenu({ trigger, items, align = "right", className = "" }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 mt-1 min-w-[180px] rounded-xl bg-bg-elevated border border-border shadow-xl overflow-hidden py-1 ${
              align === "right" ? "right-0" : "left-0"
            }`}
          >
            {items.map((item, i) => {
              if (item.divider) {
                return <div key={i} className="my-1 border-t border-border" />;
              }
              return (
                <button
                  key={i}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                    item.danger
                      ? "text-error hover:bg-error-light dark:hover:bg-error/10"
                      : "text-foreground hover:bg-surface-2"
                  } ${item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {item.icon && <span className="shrink-0 text-muted-foreground">{item.icon}</span>}
                  {item.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
