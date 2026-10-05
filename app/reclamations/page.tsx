"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import DataTable, { type Column } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/useUser";
import { getUserReclamations } from "@/lib/services/firestore.service";
import type { Reclamation } from "@/lib/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  new: { label: "Nouvelle", variant: "brand" },
  in_progress: { label: "En cours", variant: "info" },
  resolved: { label: "Résolue", variant: "success" },
  closed: { label: "Fermée", variant: "default" },
};

function formatDate(date: unknown): string {
  if (!date) return "—";
  const d = (date as { toDate?: () => Date })?.toDate?.() ?? new Date(date as string | number);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReclamationsListPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getUserReclamations(user.uid)
        .then(setReclamations)
        .catch((err) => setError(String(err)))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const columns: Column<Reclamation>[] = [
    {
      key: "subject",
      label: "Sujet",
      sortable: true,
      render: (row) => (
        <Link href={`/reclamations/${row.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
          {row.subject}
        </Link>
      ),
    },
    { key: "message", label: "Description", render: (row) => <span className="text-muted truncate block max-w-[250px]">{row.message}</span> },
    {
      key: "status",
      label: "Statut",
      sortable: true,
      render: (row) => {
        const s = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.new;
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
      key: "_view",
      label: "",
      width: "40px",
      render: (row) => (
        <Link href={`/reclamations/${row.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      ),
    },
  ];

  const filters = [
    {
      key: "status",
      label: "Statut",
      options: [
        { value: "new", label: "Nouvelle" },
        { value: "in_progress", label: "En cours" },
        { value: "resolved", label: "Résolue" },
        { value: "closed", label: "Fermée" },
      ],
    },
  ];

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-bg">
      <Container>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-foreground">
                Mes Réclamations
              </h1>
              <p className="text-sm text-muted mt-1">
                {loading ? "Chargement..." : `${reclamations.length} réclamation${reclamations.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <Button asLink href="/reclamations/new" icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}>
              Nouvelle réclamation
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={reclamations}
            loading={loading}
            error={error}
            onRetry={() => { setLoading(true); setError(null); window.location.reload(); }}
            searchPlaceholder="Rechercher par sujet ou description…"
            searchKeys={["subject", "message"]}
            filters={filters}
            pageSize={10}
            emptyTitle="Aucune réclamation"
            emptyDescription="Vous n'avez pas encore soumis de réclamation."
            emptyAction={{ label: "Créer une réclamation", onClick: () => router.push("/reclamations/new") }}
            filename="mes-reclamations"
          />
        </motion.div>
      </Container>
    </div>
  );
}
