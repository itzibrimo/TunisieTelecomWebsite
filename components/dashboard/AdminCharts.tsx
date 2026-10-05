"use client";

import { memo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import Badge from "@/components/ui/Badge";
import type { AdminStats } from "@/lib/types";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface, #13131A)",
  border: "1px solid var(--color-border, rgba(255,255,255,0.08))",
  borderRadius: "0.75rem",
  color: "var(--color-foreground, #FAFAFA)",
  fontSize: 12,
};

interface AdminChartsProps {
  stats: AdminStats;
}

function AdminChartsInner({ stats }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-display)]">Répartition par statut</h2>
            <Badge variant="brand" dot>Temps réel</Badge>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={stats.reclamationsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" nameKey="name">
                {stats.reclamationsByStatus.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "var(--color-muted, #94A3B8)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-lg shadow-black/10 h-full">
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-display)] mb-5">Statistiques rapides</h2>
          <div className="space-y-4">
            {[
              { label: "Taux de résolution", value: stats.totalReclamations > 0 ? Math.round((stats.resolvedReclamations + stats.closedReclamations) / stats.totalReclamations * 100) : 0, suffix: "%", color: "text-foreground" },
              { label: "Temps moyen", value: "24h", color: "text-foreground" },
              { label: "Satisfaction", value: "98%", color: "text-success" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted">{s.label}</span>
                <span className={`text-sm font-semibold ${s.color}`}>{typeof s.value === "number" ? `${s.value}${s.suffix}` : s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="lg:col-span-3">
        <div className="rounded-xl border border-border bg-surface/80 p-6 shadow-lg shadow-black/10">
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-display)] mb-5">Réclamations par mois</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.reclamationsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, rgba(255,255,255,0.06))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--color-muted-foreground, #64748B)" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground, #64748B)" }} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Réclamations" fill="var(--color-primary, #6843EC)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const AdminCharts = memo(AdminChartsInner);
export default AdminCharts;
