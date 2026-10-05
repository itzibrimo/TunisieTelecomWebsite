"use client";

/* =============================================================================
 * app/account/devices/page.tsx — Connected devices management
 * Uses custom session tracking via Firestore (session.service.ts)
 * ============================================================================= */

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { RevealOnScroll } from "@/components/effects/Animations";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import FormInput from "@/components/ui/FormInput";
import { useUser } from "@/lib/hooks/useUser";
import {
  subscribeToSessions,
  revokeSession,
  revokeAllSessions,
  cleanupExpiredSessions,
  getCurrentSessionId,
  touchSession,
  getLastCleanupResult,
  getSessionExpiryDays,
  type DeviceSession,
} from "@/lib/services/session.service";
import { reauthenticateUser } from "@/lib/services/auth.service";
import { showToast } from "@/components/ui/Toast";
import { exportCSV } from "@/lib/utils/export";
import SessionCleanupChart from "@/components/charts/SessionCleanupChart";

/* Device icons by type */
function DeviceIcon({ device, className = "" }: { device: string; className?: string }) {
  if (device === "Mobile") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  if (device === "Tablet") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

/* Check if session was active in the last 5 minutes */
function isOnline(timestamp: unknown): boolean {
  if (!timestamp) return false;
  const date =
    typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as number | string);
  return Date.now() - date.getTime() < 5 * 60 * 1000;
}

/* Format relative time */
function formatRelativeTime(timestamp: unknown): string {
  if (!timestamp) return "";
  const date =
    typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp
      ? (timestamp as { toDate: () => Date }).toDate()
      : new Date(timestamp as number | string);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffHour < 24) return `Il y a ${diffHour}h`;
  if (diffDay < 7) return `Il y a ${diffDay}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function AccountDevicesPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Export
  function handleExportCSV() {
    const rows = sessions.map((s) => ({
      os: s.os,
      browser: s.browser,
      device: s.device,
      ip: s.ip || "",
      location: s.location || "",
      isCurrent: s.id === currentSessionId ? "Oui" : "Non",
      isOnline: isOnline(s.lastActiveAt) ? "En ligne" : "Hors ligne",
      createdAt: s.createdAt?.toDate?.().toLocaleString("fr-FR") ?? "",
      lastActiveAt: s.lastActiveAt?.toDate?.().toLocaleString("fr-FR") ?? "",
    }));
    exportCSV(
      rows,
      [
        { key: "os", label: "Système" },
        { key: "browser", label: "Navigateur" },
        { key: "device", label: "Type" },
        { key: "ip", label: "Adresse IP" },
        { key: "location", label: "Emplacement" },
        { key: "isCurrent", label: "Appareil actuel" },
        { key: "isOnline", label: "Statut" },
        { key: "createdAt", label: "Créé le" },
        { key: "lastActiveAt", label: "Dernière activité" },
      ],
      `sessions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    showToast("Export CSV téléchargé.");
  }

  // Revoke dialog state
  const [revokeTarget, setRevokeTarget] = useState<DeviceSession | null>(null);
  const [revokePassword, setRevokePassword] = useState("");
  const [revoking, setRevoking] = useState(false);

  // Revoke all dialog state
  const [showRevokeAll, setShowRevokeAll] = useState(false);
  const [revokeAllPassword, setRevokeAllPassword] = useState("");
  const [revokingAll, setRevokingAll] = useState(false);

  // Cleanup status
  const [lastCleanup, setLastCleanup] = useState<{ timestamp: Date; removedCount: number } | null>(null);
  const [sessionExpiryDays, setSessionExpiryDays] = useState(30);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Load last cleanup result from localStorage on mount
  useEffect(() => {
    queueMicrotask(() => setLastCleanup(getLastCleanupResult()));
  }, []);

  // Load user's session expiry preference and clean up expired sessions
  useEffect(() => {
    if (!user) return;
    getSessionExpiryDays(user.uid).then((days) => {
      setSessionExpiryDays(days);
      return cleanupExpiredSessions(user.uid, days);
    }).then((removedCount) => {
      if (removedCount && removedCount > 0) {
        setLastCleanup({ timestamp: new Date(), removedCount });
      }
    }).catch((err) => {
      console.error("[Devices] Session cleanup error:", err);
    });
  }, [user]);

  // Periodically touch the current session to update "Last seen" (every 5 minutes)
  useEffect(() => {
    if (!user || !currentSessionId) return;

    // Touch immediately on mount
    touchSession(user.uid, currentSessionId).catch(() => {});

    // Then every 5 minutes
    const interval = setInterval(() => {
      touchSession(user.uid, currentSessionId).catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, currentSessionId]);

  // Track known session IDs for new-device detection
  const knownSessionIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Subscribe to real-time session updates
  useEffect(() => {
    if (!user) return;

    queueMicrotask(() => setLoadingSessions(true));
    const unsubscribe = subscribeToSessions(
      user.uid,
      (sessions) => {
        setSessions(sessions);
        setLoadingSessions(false);

        // Identify current session from sessionStorage (set on login)
        const storedId = getCurrentSessionId();
        if (storedId && sessions.some((s) => s.id === storedId)) {
          setCurrentSessionId(storedId);
        } else if (sessions.length > 0) {
          setCurrentSessionId(sessions[0].id);
        }

        // Detect new devices (skip first load)
        if (initialLoadDoneRef.current) {
          const currentIds = new Set(sessions.map((s) => s.id));
          for (const session of sessions) {
            if (!knownSessionIdsRef.current.has(session.id) && session.id !== storedId) {
              // New device detected — show toast
              showToast(
                `Nouvel appareil détecté : ${session.os} — ${session.browser}`,
                "warning"
              );
            }
          }
          knownSessionIdsRef.current = currentIds;
        } else {
          // First load — just record known sessions
          knownSessionIdsRef.current = new Set(sessions.map((s) => s.id));
          initialLoadDoneRef.current = true;
        }
      },
      (err) => {
        console.error("[Devices] Real-time error:", err);
        setLoadingSessions(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Revoke a single session
  async function handleRevoke() {
    if (!user || !revokeTarget) return;
    setRevoking(true);
    try {
      await reauthenticateUser(revokePassword);
      await revokeSession(user.uid, revokeTarget.id);
      setSessions((prev) => prev.filter((s) => s.id !== revokeTarget.id));
      setRevokeTarget(null);
      setRevokePassword("");
      showToast("Session révoquée avec succès.");
    } catch (err) {
      console.error("[Devices] Error revoking session:", err);
      showToast("Mot de passe incorrect ou erreur lors de la révocation.", "error");
    } finally {
      setRevoking(false);
    }
  }

  // Revoke all sessions except current
  async function handleRevokeAll() {
    if (!user || !currentSessionId) return;
    setRevokingAll(true);
    try {
      await reauthenticateUser(revokeAllPassword);
      await revokeAllSessions(user.uid, currentSessionId);
      setSessions((prev) => prev.filter((s) => s.id === currentSessionId));
      setShowRevokeAll(false);
      setRevokeAllPassword("");
      showToast("Toutes les autres sessions ont été révoquées.");
    } catch (err) {
      console.error("[Devices] Error revoking all sessions:", err);
      showToast("Mot de passe incorrect ou erreur lors de la révocation.", "error");
    } finally {
      setRevokingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user) return null;

  if (!user.emailVerified) {
    return (
      <div className="max-w-2xl space-y-8">
        <RevealOnScroll>
          <Card className="p-6 md:p-8">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-warning/5 border border-warning/20">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-warning"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Vérification requise</p>
                <p className="text-muted text-xs">Veuillez vérifier votre adresse email pour accéder à la gestion des appareils.</p>
              </div>
            </div>
          </Card>
        </RevealOnScroll>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Active Sessions */}
      <RevealOnScroll>
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground">
                Appareils connectés
              </h2>
              <p className="text-muted text-sm mt-1">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""} active{sessions.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {sessions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mr-1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Exporter CSV
                </Button>
              )}
              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-error border-error/30 hover:bg-error/5"
                  onClick={() => setShowRevokeAll(true)}
                >
                  Révoquer les autres
                </Button>
              )}
            </div>
          </div>

          {/* Cleanup status indicator */}
          {lastCleanup && (
            <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-info/5 border border-info/10">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-info shrink-0">
                <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9" />
              </svg>
              <p className="text-xs text-info">
                Dernier nettoyage : {lastCleanup.timestamp.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {lastCleanup.removedCount > 0 && (
                  <span> — {lastCleanup.removedCount} session{lastCleanup.removedCount !== 1 ? "s" : ""} expirée{lastCleanup.removedCount !== 1 ? "s" : ""} supprimée{lastCleanup.removedCount !== 1 ? "s" : ""}</span>
                )}
                <span className="ml-1 text-muted-foreground">(après {sessionExpiryDays}j)</span>
              </p>
            </div>
          )}

          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">Aucune session enregistrée.</p>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
              className="space-y-3"
            >
              {sessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                return (
                  <motion.div
                    key={session.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isCurrent
                        ? "border-success/30 bg-success/5"
                        : "border-border hover:border-border-2"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCurrent ? "bg-success/10" : "bg-primary/10"
                      }`}>
                        <DeviceIcon
                          device={session.device}
                          className={isCurrent ? "text-success" : "text-primary"}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          {isOnline(session.lastActiveAt) && (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-pulse-online absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                            </span>
                          )}
                          <p className="text-sm font-medium text-foreground">
                            {session.os} — {session.browser}
                          </p>
                          {isCurrent && (
                            <Badge variant="success" dot className="text-[10px]">
                              Appareil actuel
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted">
                          {session.device} · {session.location && session.location !== "—" ? session.location : "Emplacement inconnu"} · Dernière activité : {formatRelativeTime(session.lastActiveAt)}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-error hover:text-error/80 hover:bg-error/5"
                        onClick={() => setRevokeTarget(session)}
                      >
                        Révoquer
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </Card>
      </RevealOnScroll>

      {/* Cleanup Monitoring */}
      <RevealOnScroll delay={0.1}>
        <SessionCleanupChart days={30} />
      </RevealOnScroll>

      {/* Security Actions */}
      <RevealOnScroll delay={0.1}>
        <Card className="p-6 md:p-8">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">
            Sécurité du compte
          </h2>
          <p className="text-muted text-sm mb-6">
            Actions de sécurité pour protéger votre compte.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Changer le mot de passe</p>
                <p className="text-xs text-muted">Modifiez votre mot de passe régulièrement</p>
              </div>
              <Button variant="outline" size="sm" asLink href="/account/security">
                Modifier
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Authentification à deux facteurs</p>
                <p className="text-xs text-muted">Ajoutez une couche de sécurité supplémentaire</p>
              </div>
              <Button variant="outline" size="sm" asLink href="/account/security">
                Configurer
              </Button>
            </div>
          </div>
        </Card>
      </RevealOnScroll>

      {/* Revoke Single Session Dialog */}
      <Dialog open={!!revokeTarget} onClose={() => { setRevokeTarget(null); setRevokePassword(""); }}>
        <div className="p-6">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">
            Révoquer cette session ?
          </h3>
          <p className="text-sm text-muted mb-4">
            L&apos;appareil <strong>{revokeTarget?.os} — {revokeTarget?.browser}</strong> sera déconnecté.
            Entrez votre mot de passe pour confirmer.
          </p>
          <FormInput
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={revokePassword}
            onChange={(e) => setRevokePassword(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => { setRevokeTarget(null); setRevokePassword(""); }}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!revokePassword || revoking}
              loading={revoking}
              onClick={handleRevoke}
            >
              Révoquer
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Revoke All Sessions Dialog */}
      <Dialog open={showRevokeAll} onClose={() => { setShowRevokeAll(false); setRevokeAllPassword(""); }}>
        <div className="p-6">
          <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">
            Révoquer toutes les sessions ?
          </h3>
          <p className="text-sm text-muted mb-4">
            Tous les appareils seront déconnectés sauf celui-ci.
            Entrez votre mot de passe pour confirmer.
          </p>
          <FormInput
            label="Mot de passe"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={revokeAllPassword}
            onChange={(e) => setRevokeAllPassword(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="ghost" size="sm" onClick={() => { setShowRevokeAll(false); setRevokeAllPassword(""); }}>
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!revokeAllPassword || revokingAll}
              loading={revokingAll}
              onClick={handleRevokeAll}
            >
              Tout révoquer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
