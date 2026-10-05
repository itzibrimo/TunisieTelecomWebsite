"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "tt_pwa_install_dismissed";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches || (window as unknown as { navigator?: { standalone?: boolean } }).navigator?.standalone) {
      const id = requestAnimationFrame(() => setIsInstalled(true));
      return () => cancelAnimationFrame(id);
    }

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      requestAnimationFrame(() => {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setTimeout(() => setShowPrompt(true), 3000);
      });
    };

    const timer = setTimeout(() => requestAnimationFrame(() => setShowPrompt(true)), 3000);
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowPrompt(false);
    try { localStorage.setItem(DISMISSED_KEY, "true"); } catch {}
  }, []);

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-bg-elevated border border-border rounded-2xl shadow-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Installer TT Digital</p>
              <p className="text-xs text-muted mt-0.5">Accédez plus rapidement depuis votre écran d&apos;accueil</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Installer
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-2 transition-colors"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
