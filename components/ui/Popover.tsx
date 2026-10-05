"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============================================================================
 * Popover — Hover/focus-triggered floating content panel
 * ============================================================================= */

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  triggerType?: "hover" | "click";
  className?: string;
}

export default function Popover({
  trigger,
  children,
  side = "bottom",
  align = "center",
  triggerType = "click",
  className = "",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function show() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }
  function hide() {
    if (triggerType === "hover") {
      timeoutRef.current = setTimeout(() => setOpen(false), 150);
    } else {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open || triggerType !== "click") return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, triggerType]);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const posMap = {
    top: { vertical: "bottom-full", margin: "mb-2", origin: "origin-bottom" },
    bottom: { vertical: "top-full", margin: "mt-2", origin: "origin-top" },
    left: { vertical: "right-full", margin: "mr-2", origin: "origin-right" },
    right: { vertical: "left-full", margin: "ml-2", origin: "origin-left" },
  };

  const alignMap = {
    start: (side === "top" || side === "bottom") ? "left-0" : "top-0",
    center: (side === "top" || side === "bottom") ? "left-1/2 -translate-x-1/2" : "top-1/2 -translate-y-1/2",
    end: (side === "top" || side === "bottom") ? "right-0" : "bottom-0",
  };

  const pos = posMap[side];

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${className}`}
      onMouseEnter={triggerType === "hover" ? show : undefined}
      onMouseLeave={triggerType === "hover" ? hide : undefined}
    >
      <div onClick={triggerType === "click" ? () => setOpen(!open) : undefined}>
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 ${pos.vertical} ${pos.margin} ${alignMap[align]} ${pos.origin} min-w-[200px] rounded-xl bg-bg-elevated border border-border shadow-xl p-2`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
