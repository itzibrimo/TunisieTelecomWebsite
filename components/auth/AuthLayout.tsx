"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg via-surface to-bg px-4 py-24 relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-20 right-[10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[120px]" />
      <div className="absolute bottom-20 left-[5%] w-[400px] h-[400px] rounded-full bg-accent-cyan/[0.04] blur-[100px]" />
      <div className="absolute top-[50%] left-[40%] w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[80px]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.06) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold font-[family-name:var(--font-display)] text-foreground group-hover:text-primary transition-colors">
              TT Digital
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-surface/90 backdrop-blur-xl shadow-2xl shadow-black/10 p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground mb-1.5">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-muted leading-relaxed">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
