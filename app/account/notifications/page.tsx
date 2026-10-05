"use client";

/* =============================================================================
 * app/account/notifications/page.tsx — Notifications center (moved from /settings/notifications)
 * ============================================================================= */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { staggerContainer, staggerItem } from "@/components/effects/Animations";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useUser } from "@/lib/hooks/useUser";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/services/firestore.service";
import type { NotificationEntry } from "@/lib/types";

function NotificationIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    info: { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>, color: "bg-info/10 text-info" },
    success: { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, color: "bg-success/10 text-success" },
    warning: { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>, color: "bg-warning/10 text-warning" },
    error: { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>, color: "bg-error/10 text-error" },
  };
  const { icon, color } = iconMap[type] || iconMap.info;
  return <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>;
}

function formatRelativeTime(timestamp: unknown): string {
  if (!timestamp) return "";
  const date = typeof timestamp === "object" && timestamp !== null && "toDate" in timestamp ? (timestamp as { toDate: () => Date }).toDate() : new Date(timestamp as number | string);
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

export default function AccountNotificationsPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoadingNotifs(true);
    try { const data = await getNotifications(user.uid); setNotifications(data); }
    catch (err) { console.error("[Account Notifications] Erreur fetch:", err); }
    finally { setLoadingNotifs(false); }
  }, [user]);

  useEffect(() => { queueMicrotask(() => fetchNotifications()); }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function handleMarkRead(notifId: string) {
    if (!user) return;
    try { await markNotificationRead(user.uid, notifId); setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))); }
    catch (err) { console.error("[Account Notifications] Erreur markRead:", err); }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    try { await markAllNotificationsRead(user.uid); setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))); }
    catch (err) { console.error("[Account Notifications] Erreur markAllRead:", err); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[40vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user || !user.emailVerified) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground">Notifications</h2>
          {unreadCount > 0 && <Badge variant="brand" dot>{unreadCount}</Badge>}
        </div>
        {unreadCount > 0 && <Button onClick={handleMarkAllRead} variant="ghost" size="sm">Tout marquer comme lu</Button>}
      </div>

      {loadingNotifs ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </div>
          <h3 className="font-[family-name:var(--font-display)] font-bold text-lg text-foreground mb-2">Aucune notification</h3>
          <p className="text-muted text-sm">Vous n&apos;avez aucune notification pour le moment.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible">
            {notifications.map((notif) => (
              <motion.div key={notif.id} variants={staggerItem}>
                <button onClick={() => handleMarkRead(notif.id)} className={`w-full text-left p-4 md:p-5 flex items-start gap-4 transition-colors cursor-pointer ${notif.read ? "hover:bg-surface-2" : "bg-primary/5 hover:bg-primary/10"}`}>
                  <NotificationIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${notif.read ? "text-muted" : "text-foreground"}`}>{notif.title}</p>
                      {!notif.read && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary mt-1" />}
                    </div>
                    <p className="text-sm text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{formatRelativeTime(notif.createdAt)}</p>
                  </div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        </Card>
      )}
    </div>
  );
}
