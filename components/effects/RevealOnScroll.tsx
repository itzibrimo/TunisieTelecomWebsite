"use client";

/* =============================================================================
 * components/effects/RevealOnScroll.tsx — Animation d'apparition au scroll
 * Utilise Framer Motion + IntersectionObserver (whileInView)
 * ============================================================================= */

import { motion } from "framer-motion";

interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

export default function RevealOnScroll({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: RevealOnScrollProps) {
  const offsets = {
    up: { y: 50, x: 0 },
    left: { y: 0, x: -50 },
    right: { y: 0, x: 50 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
