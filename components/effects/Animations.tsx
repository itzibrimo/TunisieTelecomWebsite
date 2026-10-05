"use client";

import { useMotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";

/* ── Re-export canonical standalone components ── */
export { default as RevealOnScroll } from "./RevealOnScroll";

/* ── Re-export motion variant presets from lib/animations ── */
export { staggerContainer, staggerItem, fadeUp } from "@/lib/animations";

/* ── MagneticButton ── */
export function MagneticButton({ children, className = "", strength = 0.3 }: {
  children: ReactNode; className?: string; strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  function handleMouse(e: React.MouseEvent) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }

  return (
    <motion.div ref={ref} style={{ x, y }} onMouseMove={handleMouse} onMouseLeave={() => { x.set(0); y.set(0); }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

/* ── HoverCard ── */
import { motion } from "framer-motion";
export function HoverCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(79,70,229,0.08)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >{children}</motion.div>
  );
}
