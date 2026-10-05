"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import type { NotificationEntry } from "@/lib/types";

function fmtDate(d: unknown): string {
  if (!d) return "";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

const typeIcons: Record<string, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

const TYPE_FILTERS = [
  { value: "all", label: "Toutes" },
  { value: "unread", label: "Non lues" },
  { value: "info", label: "Information" },
  { value: "success", label: "Succès" },
  { value: "warning", label: "Avertissement" },
  { value: "error", label: "Erreur" },
];

export default function NotificationBell() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })) as NotificationEntry[]);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const filtered = useMemo(() => {
    let result = notifications;
    if (filter === "unread") result = result.filter(n => !n.read);
    else if (filter !== "all") result = result.filter(n => n.type === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    return result;
  }, [notifications, filter, search]);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, "users", user.uid, "notifications", id), { read: true });
    } catch (err) {
      console.error("[NotificationBell] markAsRead failed:", err);
    }
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirebaseDb();
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error("[NotificationBell] markAllRead failed:", err);
    }
  }, [user, notifications]);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1 shadow-md shadow-primary/30">
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border bg-bg-elevated shadow-2xl overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[11px] font-medium text-primary hover:text-primary-light transition-colors">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-placeholder" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full h-8 pl-8 pr-3 text-xs bg-surface rounded-lg border border-border text-foreground placeholder:text-placeholder focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                {/* Filters */}
                <div className="flex gap-1 mt-2 flex-wrap">
                  {TYPE_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-colors ${filter === f.value ? "bg-primary text-white" : "bg-surface-2 text-muted-foreground hover:text-foreground"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-surface-3 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5"><div className="h-3 bg-surface-3 rounded w-3/4" /><div className="h-2.5 bg-surface-2 rounded w-1/2" /></div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-xl bg-surface-3 flex items-center justify-center mx-auto mb-3">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-placeholder" strokeLinecap="round">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  filtered.map(n => (
                    <motion.button
                      key={n.id}
                      layout
                      onClick={() => { if (!n.read) markAsRead(n.id); }}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-2 transition-colors border-b border-border last:border-0 ${!n.read ? "bg-primary/[0.03]" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeIcons[n.type] || typeIcons.info}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium truncate ${!n.read ? "text-foreground" : "text-foreground-2"}`}>{n.title}</p>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-placeholder mt-1">{fmtDate(n.createdAt)}</p>
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
