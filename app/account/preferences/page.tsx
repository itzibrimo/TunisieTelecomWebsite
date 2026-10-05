"use client";

/* =============================================================================
 * app/account/preferences/page.tsx — Appearance + language preferences
 * (expanded from /settings/appearance)
 * ============================================================================= */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { RevealOnScroll } from "@/components/effects/Animations";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useUser } from "@/lib/hooks/useUser";
import { getSessionExpiryDays, setSessionExpiryDays, type SessionExpiryDays } from "@/lib/services/session.service";
import { showToast } from "@/components/ui/Toast";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
];

const SESSION_EXPIRY_OPTIONS: { value: SessionExpiryDays; label: string; description: string }[] = [
  { value: 7, label: "7 jours", description: "Sessions expirées après une semaine d'inactivité" },
  { value: 30, label: "30 jours", description: "Nettoyage mensuel — recommandé" },
  { value: 90, label: "90 jours", description: "Sessions conservées pendant 3 mois" },
];

export default function AccountPreferencesPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState("fr");
  const [sessionExpiry, setSessionExpiryState] = useState<SessionExpiryDays>(30);
  const [savingExpiry, setSavingExpiry] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { queueMicrotask(() => setMounted(true)); }, []);

  // Load session expiry preference
  useEffect(() => {
    if (!user) return;
    getSessionExpiryDays(user.uid).then(setSessionExpiryState);
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  async function handleSessionExpiryChange(days: SessionExpiryDays) {
    if (!user || days === sessionExpiry) return;
    setSavingExpiry(true);
    try {
      await setSessionExpiryDays(user.uid, days);
      setSessionExpiryState(days);
      showToast(`Durée de session mise à jour : ${days} jours`);
    } catch (err) {
      console.error("[Preferences] Error saving session expiry:", err);
      showToast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setSavingExpiry(false);
    }
  }

  if (!user || !user.emailVerified) return null;
  const currentTheme = mounted ? theme : "light";

  return (
    <div className="max-w-2xl space-y-8">
      {/* Theme */}
      <RevealOnScroll>
        <Card className="p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">Thème</h2>
          <p className="text-muted text-sm mb-6">Choisissez l&apos;apparence de l&apos;application.</p>
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${currentTheme === "light" ? "border-primary bg-primary-50 dark:border-accent dark:bg-accent/5" : "border-border hover:border-primary/40"}`}>
              <input type="radio" name="theme" value="light" checked={currentTheme === "light"} onChange={() => setTheme("light")} className="sr-only" />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${currentTheme === "light" ? "border-primary" : "border-muted-foreground"}`}>
                {currentTheme === "light" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-warning"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                </div>
                <div><p className="font-semibold text-foreground text-sm">Clair</p><p className="text-muted text-xs">Thème lumineux par défaut</p></div>
              </div>
            </label>
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${currentTheme === "dark" ? "border-primary bg-primary-50 dark:border-accent dark:bg-accent/5" : "border-border hover:border-primary/40"}`}>
              <input type="radio" name="theme" value="dark" checked={currentTheme === "dark"} onChange={() => setTheme("dark")} className="sr-only" />
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${currentTheme === "dark" ? "border-primary" : "border-muted-foreground"}`}>
                {currentTheme === "dark" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info-light flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-info"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                </div>
                <div><p className="font-semibold text-foreground text-sm">Sombre</p><p className="text-muted text-xs">Thème sombre pour les yeux</p></div>
              </div>
            </label>
          </div>
          <p className="text-xs text-muted mt-4">Thème actuel : <span className="font-medium text-primary">{currentTheme === "dark" ? "Sombre" : "Clair"}</span></p>
        </Card>
      </RevealOnScroll>

      {/* Language */}
      <RevealOnScroll delay={0.1}>
        <Card className="p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">Langue</h2>
          <p className="text-muted text-sm mb-6">Choisissez la langue de l&apos;application.</p>
          <div className="space-y-3">
            {LANGUAGES.map((lang) => (
              <label key={lang.code} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${language === lang.code ? "border-primary bg-primary-50 dark:border-accent dark:bg-accent/5" : "border-border hover:border-primary/40"}`}>
                <input type="radio" name="language" value={lang.code} checked={language === lang.code} onChange={() => setLanguage(lang.code)} className="sr-only" />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${language === lang.code ? "border-primary" : "border-muted-foreground"}`}>
                  {language === lang.code && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <p className="font-semibold text-foreground text-sm">{lang.label}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      </RevealOnScroll>

      {/* Session Expiry */}
      <RevealOnScroll delay={0.2}>
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground">Durée de session</h2>
            <Badge variant="info" className="text-[10px]">
              {sessionExpiry} jours
            </Badge>
          </div>
          <p className="text-muted text-sm mb-6">
            Les sessions inactives au-delà de cette durée seront automatiquement supprimées.
          </p>
          <div className="space-y-3">
            {SESSION_EXPIRY_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  sessionExpiry === option.value
                    ? "border-primary bg-primary-50 dark:border-accent dark:bg-accent/5"
                    : "border-border hover:border-primary/40"
                } ${savingExpiry ? "opacity-60 pointer-events-none" : ""}`}
              >
                <input
                  type="radio"
                  name="sessionExpiry"
                  value={option.value}
                  checked={sessionExpiry === option.value}
                  onChange={() => handleSessionExpiryChange(option.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  sessionExpiry === option.value ? "border-primary" : "border-muted-foreground"
                }`}>
                  {sessionExpiry === option.value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{option.label}</p>
                    <p className="text-muted text-xs">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted mt-4">
            Configuration actuelle : <span className="font-medium text-primary">{sessionExpiry} jours</span>
          </p>
        </Card>
      </RevealOnScroll>
    </div>
  );
}
