"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import Badge from "@/components/ui/Badge";
import { getSessionCleanupStats, type CleanupStats } from "@/lib/services/session.service";

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface, #141B2D)",
  border: "1px solid rgba(128,128,128,0.08)",
  borderRadius: "0.75rem",
  color: "var(--color-foreground, #FAFAFA)",
  fontSize: 12,
};

interface SessionCleanupChartProps {
  days?: number;
}

export default function SessionCleanupChart({ days = 30 }: SessionCleanupChartProps) {
  const [data, setData] = useState<CleanupStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSessionCleanupStats(days)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const totalCleaned = data.reduce((sum, d) => sum + d.totalDeleted, 0);
  const avgPerDay = data.length > 0 ? Math.round(totalCleaned / data.length) : 0;
  const lastRun = data.length > 0 ? data[data.length - 1] : null;

  // Format dates for display (DD/MM)
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Nettoyage des sessions</h2>
        <Badge variant="info" className="text-[10px]">{totalCleaned} supprimées</Badge>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-surface">
          <p className="text-lg font-bold text-foreground">{totalCleaned}</p>
          <p className="text-[10px] text-muted">Total supprimées</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface">
          <p className="text-lg font-bold text-foreground">{avgPerDay}</p>
          <p className="text-[10px] text-muted">Moy/jour</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-surface">
          <p className="text-lg font-bold text-foreground">{lastRun?.totalDeleted ?? "—"}</p>
          <p className="text-[10px] text-muted">Dernier run</p>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-[200px] flex items-center justify-center">
          <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #64748B)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #64748B)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="totalDeleted" fill="var(--color-success, #22C55E)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted">
          Aucune donnée de nettoyage disponible
        </div>
      )}
    </div>
  );
}
