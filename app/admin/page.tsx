"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { motion, type Variants } from "framer-motion";
import Container from "@/components/ui/Container";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAdminStats } from "@/lib/services/admin.service";
import type { AdminStats } from "@/lib/types";

const AdminCharts = lazy(() => import("@/components/dashboard/AdminCharts"));

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5, ease: "easeOut" } }),
};

const STATUS_BADGE: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  new: { label: "Nouvelle", variant: "brand" },
  in_progress: { label: "En cours", variant: "info" },
  resolved: { label: "Résolue", variant: "success" },
  closed: { label: "Fermée", variant: "default" },
};

const kpiColors: Record<string, { bg: string; text: string }> = {
  brand: { bg: "bg-primary/10", text: "text-primary" },
  info: { bg: "bg-accent-cyan/10", text: "text-accent-cyan" },
  success: { bg: "bg-success/10", text: "text-success" },
  warning: { bg: "bg-warning/10", text: "text-warning" },
};

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAdminStats()
      .then(data => { if (!cancelled) setStats(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-bg via-surface to-bg">
        <Container size="xl" className="py-8 space-y-8">
          <Skeleton className="h-8 w-64 bg-surface-2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-surface-2/50" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl bg-surface-2/50" />
            <Skeleton className="h-80 rounded-xl bg-surface-2/50" />
          </div>
          <Skeleton className="h-64 rounded-xl bg-surface-2/50" />
        </Container>
      </div>
    );
  }

  if (!stats) return null;

  const kpiCards = [
    { label: "Utilisateurs", value: stats.totalUsers, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>, variant: "brand" as const, trend: `${stats.totalUsers}` },
    { label: "Réclamations", value: stats.totalReclamations, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>, variant: "info" as const, trend: `${stats.openReclamations} ouvertes` },
    { label: "Résolues", value: stats.resolvedReclamations + stats.closedReclamations, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>, variant: "success" as const, trend: `${stats.resolvedReclamations} cette semaine` },
    { label: "En attente", value: stats.newReclamations, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, variant: "warning" as const, trend: "Priorité" },
  ];

  return (
    <div className="bg-gradient-to-br from-bg via-surface to-bg">
      <Container size="xl" className="py-8 space-y-8">
        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">Tableau de bord admin</h1>
          <p className="text-sm text-muted-foreground">Vue d&apos;ensemble des performances et statistiques en temps réel</p>
        </motion.div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => {
            const c = kpiColors[card.variant];
            return (
              <motion.div key={card.label} variants={fadeUp} initial="hidden" animate="visible" custom={i + 1}>
                <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-lg shadow-black/10 group hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text}`}>
                      {card.icon}
                    </div>
                    <Badge variant={card.variant} className="text-[10px]">{card.trend}</Badge>
                  </div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Charts Row (lazy loaded — recharts only fetched when visible) */}
        <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="lg:col-span-2 h-80 rounded-xl bg-surface-2 animate-pulse" /><div className="h-80 rounded-xl bg-surface-2 animate-pulse" /></div>}>
          <AdminCharts stats={stats} />
        </Suspense>

        {/* Recent Users Table */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}>
          <div className="rounded-xl border border-border bg-surface/80 overflow-hidden shadow-lg shadow-black/10">
            <div className="px-6 pt-6 pb-0 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-display)]">Derniers utilisateurs</h2>
              <Button variant="outline" size="sm" asLink href="/admin/users" className="border-border text-muted hover:text-foreground hover:border-border">Voir tout</Button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg/60">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Rôle</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u) => (
                    <tr key={u.uid} className="border-b border-border/50 transition-colors hover:bg-surface-2/30 last:border-0">
                      <td className="px-6 py-3.5 text-foreground-2 font-medium">{u.name || "—"}</td>
                      <td className="px-6 py-3.5 text-muted">{u.email}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={u.role === "admin" ? "brand" : "default"} dot>{u.role}</Badge>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{formatDate(u.createdAt)}</td>
                    </tr>
                  ))}
                  {stats.recentUsers.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Aucun utilisateur</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Recent Reclamations Table */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={9}>
          <div className="rounded-xl border border-border bg-surface/80 overflow-hidden shadow-lg shadow-black/10">
            <div className="px-6 pt-6 pb-0 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-display)]">Dernières réclamations</h2>
              <Button variant="outline" size="sm" asLink href="/admin/reclamations" className="border-border text-muted hover:text-foreground hover:border-border">Voir tout</Button>
            </div>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg/60">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Sujet</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Nom</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentReclamations.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 transition-colors hover:bg-surface-2/30 last:border-0">
                      <td className="px-6 py-3.5 text-foreground-2 font-medium">{r.subject}</td>
                      <td className="px-6 py-3.5 text-muted">{r.name}</td>
                      <td className="px-6 py-3.5">
                        <Badge variant={STATUS_BADGE[r.status]?.variant ?? "default"} dot>
                          {STATUS_BADGE[r.status]?.label ?? r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 text-muted-foreground text-xs">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                  {stats.recentReclamations.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Aucune réclamation</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
