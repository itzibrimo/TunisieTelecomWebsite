"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import DataTable, { type Column, type Filter, type BulkAction } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAllReclamations, updateReclamationStatus } from "@/lib/services/admin.service";
import type { Reclamation } from "@/lib/types";
import type { DocumentSnapshot } from "firebase/firestore";

const STATUS_OPTIONS = [
  { value: "new", label: "Nouvelle" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolue" },
  { value: "closed", label: "Fermée" },
];

const STATUS_BADGE: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  new: { label: "Nouvelle", variant: "brand" },
  in_progress: { label: "En cours", variant: "info" },
  resolved: { label: "Résolue", variant: "success" },
  closed: { label: "Fermée", variant: "default" },
};

const NEXT_STATUS: Record<Reclamation["status"], Reclamation["status"]> = {
  new: "in_progress",
  in_progress: "resolved",
  resolved: "closed",
  closed: "new",
};

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function shortId(id: string): string {
  return id.length > 10 ? id.slice(0, 8) + "…" : id;
}

export default function AdminReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { reclamations: data, lastDoc } = await getAllReclamations(20);
        if (!cancelled) { setReclamations(data); lastDocRef.current = lastDoc; setHasMore(data.length >= 20); }
      } catch (err) { if (!cancelled) setError(String(err)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const { reclamations: more, lastDoc: newLast } = await getAllReclamations(20, lastDocRef.current);
      setReclamations(prev => [...prev, ...more]);
      lastDocRef.current = newLast;
      setHasMore(more.length >= 20);
    } catch (err) { console.error(err); }
    finally { setLoadingMore(false); }
  }, [loadingMore]);

  const advanceStatus = useCallback(async (r: Reclamation) => {
    const next = NEXT_STATUS[r.status];
    setUpdatingId(r.id);
    try {
      await updateReclamationStatus(r.id, next);
      setReclamations(prev => prev.map(x => x.id === r.id ? { ...x, status: next } : x));
    } catch (err) { console.error(err); }
    finally { setUpdatingId(null); }
  }, []);

  const columns: Column<Reclamation>[] = [
    {
      key: "id",
      label: "Réf.",
      sortable: true,
      width: "100px",
      render: (row) => <span className="font-mono text-xs text-muted" title={row.id}>#{shortId(row.id)}</span>,
    },
    {
      key: "subject",
      label: "Sujet",
      sortable: true,
      render: (row) => <span className="font-medium text-foreground truncate block max-w-[200px]">{row.subject}</span>,
    },
    { key: "name", label: "Client", sortable: true, render: (row) => <span className="text-muted-foreground">{row.name}</span> },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (row) => {
        const s = STATUS_BADGE[row.status] ?? STATUS_BADGE.new;
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row) => <span className="text-muted-foreground text-xs">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "_action",
      label: "Action",
      width: "140px",
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          loading={updatingId === row.id}
          onClick={() => advanceStatus(row)}
        >
          → {STATUS_BADGE[NEXT_STATUS[row.status]]?.label ?? NEXT_STATUS[row.status]}
        </Button>
      ),
    },
  ];

  const filters: Filter[] = [
    { key: "status", label: "Statut", options: STATUS_OPTIONS },
  ];

  const bulkActions: BulkAction[] = [
    {
      label: "Marquer résolues",
      onClick: async (ids) => {
        for (const id of ids) { await updateReclamationStatus(id, "resolved"); }
        setReclamations(prev => prev.map(r => ids.includes(r.id) ? { ...r, status: "resolved" as const } : r));
      },
    },
  ];

  return (
    <Container size="xl" className="py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">Gestion des réclamations</h1>
          <p className="text-sm text-muted mt-1">{reclamations.length} réclamation{reclamations.length !== 1 ? "s" : ""} au total</p>
        </div>

        <DataTable
          columns={columns}
          data={reclamations}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); setError(null); window.location.reload(); }}
          searchPlaceholder="Rechercher par sujet, nom ou ID…"
          searchKeys={["subject", "name", "id"]}
          filters={filters}
          bulkActions={bulkActions}
          pageSize={15}
          enableInfiniteScroll
          onLoadMore={loadMore}
          hasMore={hasMore}
          emptyTitle="Aucune réclamation trouvée"
          emptyDescription="Aucun résultat ne correspond à vos critères."
          filename="reclamations"
        />
      </motion.div>
    </Container>
  );
}
