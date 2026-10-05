"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import DataTable, { type Column, type BulkAction } from "@/components/ui/DataTable";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { getAllUsers, updateUserRole } from "@/lib/services/admin.service";
import type { UserProfile } from "@/lib/types";
import type { DocumentSnapshot } from "firebase/firestore";

function formatDate(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users: data, lastDoc: newLast } = await getAllUsers(50);
        if (!cancelled) { setUsers(data); setLastDoc(newLast); setHasMore(data.length >= 50); }
      } catch (err) { if (!cancelled) setError(String(err)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const { users: more, lastDoc: newLast } = await getAllUsers(50, lastDoc);
      setUsers(prev => [...prev, ...more]);
      setLastDoc(newLast);
      setHasMore(more.length >= 50);
    } catch (err) { console.error(err); }
    finally { setLoadingMore(false); }
  }, [lastDoc, loadingMore]);

  const handleBulkPromote = useCallback(async (ids: string[]) => {
    for (const uid of ids) {
      await updateUserRole(uid, "admin");
    }
    setUsers(prev => prev.map(u => ids.includes(u.uid) ? { ...u, role: "admin" } : u));
  }, []);

  const handleBulkDemote = useCallback(async (ids: string[]) => {
    for (const uid of ids) {
      await updateUserRole(uid, "user");
    }
    setUsers(prev => prev.map(u => ids.includes(u.uid) ? { ...u, role: "user" } : u));
  }, []);

  type MappedUser = UserProfile & { id: string };

  const columns: Column<MappedUser>[] = [
    {
      key: "name",
      label: "Nom",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
            {(row.name || row.email || "?")[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name || "—"}</p>
            <p className="text-xs text-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: "phone", label: "Téléphone", sortable: true, render: (row) => <span className="text-muted-foreground">{row.phone || "—"}</span> },
    {
      key: "role",
      label: "Rôle",
      sortable: true,
      render: (row) => <Badge variant={row.role === "admin" ? "brand" : "default"} dot>{row.role}</Badge>,
    },
    {
      key: "createdAt",
      label: "Inscrit le",
      sortable: true,
      render: (row) => <span className="text-muted-foreground text-xs">{formatDate(row.createdAt)}</span>,
    },
    {
      key: "_actions",
      label: "Actions",
      width: "120px",
      render: (row) => (
        <Button
          variant={row.role === "admin" ? "outline" : "primary"}
          size="xs"
          onClick={async () => {
            const newRole = row.role === "admin" ? "user" : "admin";
            await updateUserRole(row.id, newRole as "admin" | "user");
            setUsers(prev => prev.map(u => u.uid === row.id ? { ...u, role: newRole as "admin" | "user" } : u));
          }}
        >
          {row.role === "admin" ? "Retirer" : "Promouvoir"}
        </Button>
      ),
    },
  ];

  const bulkActions: BulkAction[] = [
    { label: "Promouvoir admin", onClick: handleBulkPromote },
    { label: "Retirer admin", onClick: handleBulkDemote, variant: "danger" },
  ];

  return (
    <Container size="xl" className="py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">Gestion des utilisateurs</h1>
            <p className="text-sm text-muted mt-1">{users.length} utilisateur{users.length !== 1 ? "s" : ""} au total</p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={users.map(u => ({ ...u, id: u.uid }) as MappedUser)}
          loading={loading}
          error={error}
          onRetry={() => { setLoading(true); setError(null); window.location.reload(); }}
          searchPlaceholder="Rechercher par nom, email ou téléphone…"
          searchKeys={["name", "email", "phone"]}
          bulkActions={bulkActions}
          pageSize={15}
          enableInfiniteScroll
          onLoadMore={loadMore}
          hasMore={hasMore}
          emptyTitle="Aucun utilisateur trouvé"
          emptyDescription="Aucun résultat ne correspond à votre recherche."
          filename="utilisateurs"
        />
      </motion.div>
    </Container>
  );
}
