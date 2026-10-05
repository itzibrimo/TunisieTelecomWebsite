"use client";

import { useEffect, useState, useMemo, useCallback, memo, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useUser } from "@/lib/hooks/useUser";
import { useRealtimeReclamations, useRealtimeInvoices, useRealtimeNotifications, useRealtimeActivity, useOnlineStatus } from "@/lib/hooks/useRealtime";
import AdvancedFilters, { type FilterState } from "@/components/dashboard/AdvancedFilters";
import GlobalSearch from "@/components/search/GlobalSearch";
import type { Reclamation, Invoice, NotificationEntry, ActivityEntry } from "@/lib/types";

const ActivityTimeline = lazy(() => import("@/components/dashboard/ActivityTimeline"));
const DashboardCharts = lazy(() => import("@/components/dashboard/DashboardCharts"));

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Counter = memo(function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    const s = performance.now();
    const isF = value % 1 !== 0;
    function t(n: number) {
      const p = Math.min((n - s) / 1500, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setD(isF ? parseFloat((e * value).toFixed(1)) : Math.floor(e * value));
      if (p < 1) requestAnimationFrame(t);
    }
    requestAnimationFrame(t);
  }, [value]);
  return <span className="font-[family-name:var(--font-display)] font-bold text-2xl md:text-3xl bg-gradient-to-r from-primary to-accent-cyan bg-clip-text text-transparent tabular-nums">{d}{suffix}</span>;
});

const statusColors: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  new: { label: "Nouvelle", variant: "brand" },
  in_progress: { label: "En cours", variant: "info" },
  resolved: { label: "Résolue", variant: "success" },
  closed: { label: "Fermée", variant: "default" },
};

const invoiceStatusColors: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  pending: { label: "En attente", variant: "brand" },
  paid: { label: "Payée", variant: "success" },
  overdue: { label: "En retard", variant: "default" },
  cancelled: { label: "Annulée", variant: "default" },
};

const typeIcons: Record<string, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

function fmtDate(d: unknown): string {
  if (!d) return "—";
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

const KpiCard = memo(function KpiCard({ label, value, suffix, icon, delay, pulse }: {
  label: string; value: number; suffix?: string; icon: React.ReactNode; delay: number; pulse?: boolean;
}) {
  return (
    <motion.div variants={fadeUp} transition={{ delay }} whileHover={{ y: -4 }}>
      <div className="relative rounded-xl border border-primary/15 bg-bg-elevated p-5 overflow-hidden group hover:border-primary/30 transition-all duration-300">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-accent-cyan/5" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</span>
            {pulse && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
          </div>
          <Counter value={value} suffix={suffix} />
          <p className="text-xs text-muted mt-1.5 font-medium">{label}</p>
        </div>
      </div>
    </motion.div>
  );
});

/* KPI icon elements — defined outside component so refs stay stable for memo */
const kpiIcons = {
  total: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  pending: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  resolved: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>,
  invoice: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useUser();
  const isOnline = useOnlineStatus();
  const [filters, setFilters] = useState<FilterState>({ status: [], dateRange: "all", sortBy: "date", sortDir: "desc" });
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: reclamations, loading: recLoading } = useRealtimeReclamations(user?.uid);
  const { data: invoices, loading: invLoading } = useRealtimeInvoices(user?.uid);
  const { data: notifications, loading: notifLoading } = useRealtimeNotifications(user?.uid);
  const { data: activityFeed, loading: actLoading } = useRealtimeActivity(user?.uid);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !user.emailVerified) router.push("/verify-email");
  }, [user, loading, router]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const filteredReclamations = useMemo(() => {
    let result = [...reclamations];
    if (filters.status.length > 0) {
      result = result.filter(r => filters.status.includes(r.status));
    }
    if (filters.dateRange !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (filters.dateRange) {
        case "today": cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
        case "week": cutoff = new Date(now.getTime() - 7 * 86400000); break;
        case "month": cutoff = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case "year": cutoff = new Date(now.getFullYear(), 0, 1); break;
        default: cutoff = new Date(0);
      }
      result = result.filter(r => {
        const d = (r.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(r.createdAt as string | number);
        return d >= cutoff;
      });
    }
    result.sort((a, b) => {
      let cmp = 0;
      if (filters.sortBy === "date") {
        const da = (a.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(a.createdAt as string | number);
        const db = (b.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(b.createdAt as string | number);
        cmp = da.getTime() - db.getTime();
      } else if (filters.sortBy === "name") {
        cmp = (a.subject || "").localeCompare(b.subject || "");
      } else if (filters.sortBy === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return filters.sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [reclamations, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative w-10 h-10 mx-auto">
            <motion.div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-accent-cyan" animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} />
          </div>
          <p className="text-sm text-muted">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const name = profile?.name || user.displayName || "Client";
  const email = profile?.email || user.email || "";
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const openRec = reclamations.filter(r => r.status === "new" || r.status === "in_progress").length;
  const resolvedRec = reclamations.filter(r => r.status === "resolved" || r.status === "closed").length;
  const unpaidInvoices = invoices.filter(i => i.status === "pending" || i.status === "overdue");
  const totalInvoiceAmount = unpaidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  const quickActions = [
    { title: "TT Cash", subtitle: "Rechargez votre portefeuille", href: "/tt-cash", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v12m-4-8h8m-8 4h8" /></svg>, color: "text-warning" },
    { title: "Offres", subtitle: "Découvrez nos forfaits", href: "/offres", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, color: "text-primary" },
    { title: "Factures", subtitle: "Consultez et payez", href: "/factures", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>, color: "text-accent-cyan" },
    { title: "Réclamations", subtitle: "Suivez vos demandes", href: "/reclamations", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, color: "text-info" },
  ];

  return (
    <div className="bg-bg">
      <GlobalSearch uid={user.uid} open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Container>
        <motion.div initial="hidden" animate="visible" variants={stagger} className="py-6 md:py-8 space-y-6">

          {/* Welcome + Online Status + Search Trigger */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-bg-elevated to-accent-cyan/5 p-6 md:p-8">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} />
                <motion.div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-accent-cyan/10 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 5, repeat: Infinity, delay: 0.5 }} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-accent-cyan">Bienvenue de retour,</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isOnline ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"} ${isOnline ? "animate-pulse" : ""}`} />
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </span>
                  </div>
                  <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-foreground">{name}</h1>
                  <p className="text-sm text-muted mt-0.5">{email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-surface-2 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    Rechercher...
                    <kbd className="hidden sm:inline px-1 py-0.5 text-[10px] font-mono bg-surface-2 rounded border border-border">⌘K</kbd>
                  </button>
                  <Button size="sm" variant="outline" asLink href="/reclamations/new" className="text-xs">Nouvelle réclamation</Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Réclamations totales" value={reclamations.length} icon={kpiIcons.total} delay={0} pulse={!recLoading} />
            <KpiCard label="En attente" value={openRec} icon={kpiIcons.pending} delay={0.05} />
            <KpiCard label="Résolues" value={resolvedRec} icon={kpiIcons.resolved} delay={0.1} />
            <KpiCard label="Factures en attente" value={unpaidInvoices.length} suffix={totalInvoiceAmount > 0 ? ` (${totalInvoiceAmount} TND)` : undefined} icon={kpiIcons.invoice} delay={0.15} />
            <KpiCard label="Notifications non lues" value={unreadNotifs} icon={kpiIcons.bell} delay={0.2} />
          </motion.div>

          {/* Charts */}
          <Suspense fallback={<div className="h-[300px] rounded-xl bg-surface-2 animate-pulse" />}>
            <DashboardCharts reclamations={reclamations} />
          </Suspense>

          {/* Quick Actions + Activity Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <motion.div variants={fadeUp} className="lg:col-span-2">
              <div className="rounded-xl border border-border bg-bg-elevated p-5 h-full">
                <h2 className="text-sm font-semibold text-foreground mb-4">Accès rapide</h2>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map(a => (
                    <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group">
                      <span className={`${a.color} group-hover:scale-110 transition-transform`}>{a.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{a.title}</p>
                        <p className="text-[10px] text-muted">{a.subtitle}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="lg:col-span-3">
              <div className="rounded-xl border border-border bg-bg-elevated p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Activité récente</h2>
                  <Badge variant="success" className="text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                    Temps réel
                  </Badge>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  <Suspense fallback={<div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="flex gap-3 animate-pulse"><div className="w-8 h-8 rounded-lg bg-surface-3"/><div className="flex-1 space-y-1.5"><div className="h-3 bg-surface-3 rounded w-3/4"/><div className="h-2.5 bg-surface-2 rounded w-1/2"/></div></div>)}</div>}>
                    <ActivityTimeline activities={activityFeed} loading={actLoading} />
                  </Suspense>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Reclamations with Filters + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Reclamations */}
            <motion.div variants={fadeUp}>
              <div className="rounded-xl border border-border bg-bg-elevated p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Réclamations récentes</h2>
                  <div className="flex items-center gap-2">
                    <AdvancedFilters filters={filters} onChange={setFilters} />
                    <Button variant="ghost" size="xs" asLink href="/reclamations">Voir tout</Button>
                  </div>
                </div>
                {filteredReclamations.length > 0 ? (
                  <div className="space-y-2">
                    {filteredReclamations.slice(0, 5).map(r => (
                      <Link key={r.id} href={`/reclamations/${r.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-2 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.subject}</p>
                          <p className="text-[10px] text-muted truncate">{r.message}</p>
                        </div>
                        <Badge variant={statusColors[r.status]?.variant ?? "default"} className="text-[10px]">{statusColors[r.status]?.label ?? r.status}</Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted">
                    <p>{filters.status.length > 0 || filters.dateRange !== "all" ? "Aucun résultat pour ces filtres" : "Aucune réclamation"}</p>
                    <Button variant="ghost" size="xs" asLink href="/reclamations/new" className="mt-2 text-primary">Créer une réclamation</Button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Notification Summary */}
            <motion.div variants={fadeUp}>
              <div className="rounded-xl border border-border bg-bg-elevated p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
                  <div className="flex items-center gap-2">
                    {unreadNotifs > 0 && <Badge variant="brand" className="text-[10px]">{unreadNotifs} non lues</Badge>}
                    <Badge variant="success" className="text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                      Live
                    </Badge>
                  </div>
                </div>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.slice(0, 6).map(n => (
                      <div key={n.id} className={`flex items-center gap-3 p-3 rounded-lg ${!n.read ? "bg-primary/[0.03] border border-primary/10" : ""} hover:bg-surface-2 transition-colors`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeIcons[n.type] || typeIcons.info}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${!n.read ? "text-foreground" : "text-foreground-2"}`}>{n.title}</p>
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                          </div>
                          <p className="text-[10px] text-muted truncate mt-0.5">{n.message}</p>
                        </div>
                        <span className="text-[10px] text-placeholder flex-shrink-0">{fmtDate(n.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted">Aucune notification</div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Invoices Section */}
          <motion.div variants={fadeUp}>
            <div className="rounded-xl border border-border bg-bg-elevated p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Factures récentes</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                    Live
                  </Badge>
                  <Button variant="ghost" size="xs" asLink href="/factures">Voir tout</Button>
                </div>
              </div>
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Montant</th>
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Statut</th>
                        <th className="text-left py-2 px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.slice(0, 5).map(inv => (
                        <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-surface-2 transition-colors">
                          <td className="py-3 px-3 text-xs font-medium text-foreground truncate max-w-[200px]">{inv.description}</td>
                          <td className="py-3 px-3 text-xs font-semibold text-foreground">{inv.amount} TND</td>
                          <td className="py-3 px-3">
                            <Badge variant={invoiceStatusColors[inv.status]?.variant ?? "default"} className="text-[10px]">
                              {invoiceStatusColors[inv.status]?.label ?? inv.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-muted">{fmtDate(inv.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted">Aucune facture</div>
              )}
            </div>
          </motion.div>

        </motion.div>
      </Container>
    </div>
  );
}
