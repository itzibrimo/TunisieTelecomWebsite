"use client";

import { memo, useMemo } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Badge from "@/components/ui/Badge";
import type { Reclamation } from "@/lib/types";

const TT = {
  contentStyle: {
    backgroundColor: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "0.75rem",
    color: "var(--color-foreground)",
    fontSize: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
};

interface DashboardChartsProps {
  reclamations: Reclamation[];
}

function DashboardChartsInner({ reclamations }: DashboardChartsProps) {
  const statusData = useMemo(() => {
    const resolvedRec = reclamations.filter(r => r.status === "resolved" || r.status === "closed").length;
    return [
      { name: "Nouvelles", value: reclamations.filter(r => r.status === "new").length, color: "var(--color-primary)" },
      { name: "En cours", value: reclamations.filter(r => r.status === "in_progress").length, color: "var(--color-info)" },
      { name: "Résolues", value: resolvedRec, color: "var(--color-success)" },
    ].filter(d => d.value > 0);
  }, [reclamations]);

  const monthData = useMemo(() => {
    const counts: Record<string, number> = {};
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    reclamations.forEach(r => {
      const d = (r.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(r.createdAt as string | number);
      const key = months[d.getMonth()];
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count }));
  }, [reclamations]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-border bg-bg-elevated p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Réclamations par mois</h2>
            <Badge variant="brand" className="text-[10px]">{reclamations.length} total</Badge>
          </div>
          {monthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4, stroke: "var(--color-primary)", strokeWidth: 2, fill: "var(--color-bg-elevated)" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      <div>
        <div className="rounded-xl border border-border bg-bg-elevated p-5 h-full">
          <h2 className="text-sm font-semibold text-foreground mb-4">Répartition</h2>
          {statusData.length > 0 ? (
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                    {statusData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...TT} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-foreground">{reclamations.length}</span>
                <span className="text-[10px] text-muted">Total</span>
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-muted">Aucune donnée</div>
          )}
          <div className="mt-3 space-y-2">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DashboardCharts = memo(DashboardChartsInner);
export default DashboardCharts;
