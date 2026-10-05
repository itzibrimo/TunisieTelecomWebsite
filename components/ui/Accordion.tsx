"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";

/* =============================================================================
 * Accordion — Collapsible content sections
 * ============================================================================= */

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpen?: string | null;
  multiple?: boolean;
  className?: string;
}

export default function Accordion({ items, defaultOpen = null, multiple = false, className = "" }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (defaultOpen) s.add(defaultOpen);
    return s;
  });

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className={`divide-y divide-border rounded-xl border border-border bg-bg-elevated ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-surface-hover ${
                item.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
              } ${isOpen ? "text-foreground" : "text-foreground-2"}`}
              aria-expanded={isOpen}
            >
              {item.icon && <span className="shrink-0 text-muted-foreground">{item.icon}</span>}
              <span className="flex-1">{item.title}</span>
              <motion.svg
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="h-4 w-4 shrink-0 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </motion.svg>
            </button>
            <div
              className="grid transition-all duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-4 text-sm text-foreground-2 leading-relaxed">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
