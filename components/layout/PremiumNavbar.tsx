"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useUser } from "@/lib/hooks/useUser";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import NotificationBell from "@/components/notifications/NotificationBell";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { NAV_LINKS } from "@/lib/constants";

const CommandPalette = lazy(() => import("@/components/ui/CommandPalette"));

/* =============================================================================
 * PremiumNavbar — Enterprise-grade navigation bar
 * Features: theme switcher, command palette, user menu, notifications, search
 * ============================================================================= */

const ease = [0.16, 1, 0.3, 1] as const;

export default function PremiumNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, profile, loading, logout } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Track scroll for glass effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut for command palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-nav-menu]")) {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Build command palette items
  const commandItems = [
    { id: "dashboard", label: "Tableau de bord", description: "Vue d'ensemble de votre compte", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, action: () => router.push("/dashboard") },
    { id: "reclamations", label: "Mes réclamations", description: "Voir et gérer vos réclamations", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, action: () => router.push("/reclamations") },
    { id: "factures", label: "Factures", description: "Consulter et payer vos factures", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, action: () => router.push("/factures") },
    { id: "offres", label: "Offres", description: "Découvrir nos offres mobile et internet", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, action: () => router.push("/offres") },
    { id: "tt-cash", label: "TT Cash", description: "Recharger et transférer", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, action: () => router.push("/tt-cash") },
    { id: "support", label: "Support", description: "Contacter le service client", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, action: () => router.push("/support") },
    { id: "settings", label: "Mon compte", description: "Gérer votre profil et préférences", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>, action: () => router.push("/account") },
    { id: "logout", label: "Déconnexion", description: "Quitter votre session", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>, action: () => logout(), danger: true },
  ];

  return (
    <>
      {/* Command Palette (lazy loaded — only fetched when user presses ⌘K) */}
      {commandOpen && (
        <Suspense fallback={null}>
          <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} items={commandItems} />
        </Suspense>
      )}

      {/* Navbar */}
      <header
        data-nav-menu
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-bg/80 backdrop-blur-xl border-b border-border/50 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8" aria-label="Navigation principale">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2" aria-label="TT Digital - Accueil">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-primary/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72" />
                </svg>
              </motion.div>
              <span className="hidden sm:inline font-[family-name:var(--font-display)] text-xl font-bold text-foreground">TT Digital</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                      ? "text-primary bg-primary-50 dark:text-primary-light dark:bg-primary/10"
                      : "text-muted hover:text-foreground hover:bg-surface-2"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Theme Switcher */}
              <ThemeToggle />

              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
                aria-label="Ouvrir la palette de commandes (⌘K)"
              >
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-2 rounded border border-border">⌘K</kbd>
              </button>
            </div>

            {/* Desktop Auth / User Menu */}
            <div className="hidden lg:flex lg:items-center lg:gap-2" data-nav-menu>
              {loading ? (
                <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-3" />
              ) : user ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <Avatar src={profile?.photoURL || null} name={profile?.name || user.email || "Utilisateur"} size="sm" status="online" />
                    <span className="hidden md:inline truncate max-w-[120px]">{profile?.name || user.email?.split("@")[0] || "Utilisateur"}</span>
                    <svg className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease }}
                        className="absolute right-0 mt-2 w-56 rounded-xl bg-bg-elevated border border-border shadow-xl overflow-hidden py-1"
                      >
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground">{profile?.name || user.email}</p>
                          <p className="text-xs text-muted">{profile?.email || user.email}</p>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          Tableau de bord
                        </Link>
                        <Link
                          href="/reclamations"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          Mes réclamations
                        </Link>
                        <Link
                          href="/account"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Paramètres
                        </Link>
                        <button
                          onClick={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-2 transition-colors"
                        >
                          {resolvedTheme === "dark" ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                          )}
                          {resolvedTheme === "dark" ? "Mode clair" : "Mode sombre"}
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-error hover:bg-error-light dark:hover:bg-error/10 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-2 rounded-lg transition-colors">
                    Connexion
                  </Link>
                  <Button asLink href="/signup" size="sm">S&apos;inscrire</Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu — uses CSS grid for GPU-accelerated collapse */}
        {mobileMenuOpen && (
          <div
            id="mobile-menu"
            className="lg:hidden border-t border-border bg-bg-elevated/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    pathname === link.href
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3 border-border" />
              {user ? (
                <div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    href="/reclamations"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Mes réclamations
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Paramètres
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-error hover:bg-error-light dark:hover:bg-error/10 transition-colors"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-surface-2 transition-colors"
                  >
                    Connexion
                  </Link>
                  <Button asLink href="/signup" className="w-full justify-center" size="md">S&apos;inscrire</Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
