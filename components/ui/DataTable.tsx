"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============================================================================
 * DataTable — Enterprise data grid component
 * Features: sorting, search, filters, pagination, bulk actions, export,
 *           column visibility, responsive, empty/loading/error states
 * ============================================================================= */

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface Filter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface BulkAction {
  label: string;
  icon?: ReactNode;
  onClick: (selected: string[]) => void;
  variant?: "primary" | "danger" | "ghost";
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchKeys?: string[];
  filters?: Filter[];
  bulkActions?: BulkAction[];
  pageSize?: number;
  enableInfiniteScroll?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  filename?: string;
  title?: string;
  headerExtra?: ReactNode;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  searchPlaceholder = "Rechercher...",
  searchKeys = [],
  filters = [],
  bulkActions = [],
  pageSize = 10,
  enableInfiniteScroll = false,
  onLoadMore,
  hasMore = false,
  emptyTitle = "Aucune donnée",
  emptyDescription = "Aucun résultat ne correspond à vos critères.",
  emptyAction,
  filename = "export",
  title,
  headerExtra,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [visibleCount] = useState(pageSize);
  const tableRef = useRef<HTMLDivElement>(null);

  // Reset page when filters/search change
  const queryRef = useRef(query);
  const filterRef = useRef(JSON.stringify(activeFilters));
  useEffect(() => {
    const qChanged = queryRef.current !== query;
    const fChanged = filterRef.current !== JSON.stringify(activeFilters);
    if ((qChanged || fChanged) && currentPage !== 1) {
      setCurrentPage(1);
    }
    queryRef.current = query;
    filterRef.current = JSON.stringify(activeFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // ── Filtering ──
  const filtered = useMemo(() => {
    let result = [...data];

    // Text search
    if (query) {
      const q = query.toLowerCase();
      const keys = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key);
      result = result.filter(row =>
        keys.some(k => String((row as Record<string, unknown>)[k] ?? "").toLowerCase().includes(q))
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        result = result.filter(row => String((row as Record<string, unknown>)[key]) === value);
      }
    });

    return result;
  }, [data, query, activeFilters, searchKeys, columns]);

  // ── Sorting ──
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey] ?? "";
      const bVal = (b as Record<string, unknown>)[sortKey] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), "fr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // ── Pagination ──
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = useMemo(() => {
    if (enableInfiniteScroll) return sorted.slice(0, visibleCount);
    return sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [sorted, currentPage, pageSize, enableInfiniteScroll, visibleCount]);

  // ── Infinite scroll ──
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore) return;
    const el = tableRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) onLoadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enableInfiniteScroll, onLoadMore, hasMore, loading]);

  // ── Sort handler ──
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  // ── Selection ──
  const allPageSelected = paginated.length > 0 && paginated.every(r => selected.has(r.id));
  const toggleAll = useCallback(() => {
    if (allPageSelected) {
      setSelected(prev => { const next = new Set(prev); paginated.forEach(r => next.delete(r.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); paginated.forEach(r => next.add(r.id)); return next; });
    }
  }, [allPageSelected, paginated]);

  const toggleOne = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // ── Visible columns ──
  const visibleColumns = columns.filter(c => !hiddenColumns.has(c.key));

  // ── Export ──
  const handleExport = useCallback(async (type: "csv" | "excel" | "pdf" | "copy") => {
    const { exportCSV, exportExcel, exportPDF, copyToClipboard } = await import("@/lib/utils/export");
    const exportData = selected.size > 0
      ? sorted.filter(r => selected.has(r.id))
      : sorted;
    const cols = visibleColumns.map(c => ({ key: c.key, label: c.label }));
    switch (type) {
      case "csv": exportCSV(exportData, cols, `${filename}.csv`); break;
      case "excel": exportExcel(exportData, cols, `${filename}.xls`); break;
      case "pdf": exportPDF(exportData, cols, title || filename, `${filename}.html`); break;
      case "copy": {
        const ok = await copyToClipboard(exportData, cols);
        if (ok) alert("Copié dans le presse-papiers !");
        break;
      }
    }
  }, [selected, sorted, visibleColumns, filename, title]);

  // ── Skeleton rows ──
  const skeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <tr key={`sk-${i}`} className="border-b border-border">
      {visibleColumns.map((c, ci) => (
        <td key={ci} className="px-4 py-3"><div className="h-4 bg-surface-2 rounded animate-pulse" style={{ width: ci === 0 ? "60%" : "40%" }} /></td>
      ))}
    </tr>
  ));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="datatable-search"
            name="datatable-search"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-9 pl-9 pr-3 text-sm bg-bg-elevated border border-border rounded-lg text-foreground placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        {/* Filters */}
        {filters.map(f => (
          <select
            key={f.key}
            id={`filter-${f.key}`}
            name={`filter-${f.key}`}
            value={activeFilters[f.key] || "all"}
            onChange={e => setActiveFilters(prev => ({ ...prev, [f.key]: e.target.value }))}
            className="h-9 px-3 text-sm bg-bg-elevated border border-border rounded-lg text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          >
            <option value="all">{f.label}</option>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          {headerExtra}

          {/* Bulk actions */}
          {selected.size > 0 && bulkActions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.onClick(Array.from(selected))}
              className={`h-9 px-3 text-xs font-medium rounded-lg transition-colors ${
                action.variant === "danger"
                  ? "bg-error/10 text-error hover:bg-error/20"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              }`}
            >
              {action.icon && <span className="mr-1.5 inline-flex">{action.icon}</span>}
              {action.label} ({selected.size})
            </button>
          ))}

          {/* Export dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="h-9 px-3 text-xs font-medium bg-bg-elevated border border-border rounded-lg text-foreground hover:bg-surface-2 transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Exporter
            </button>
            <AnimatePresence>
              {showColumnMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-bg-elevated border border-border rounded-xl shadow-xl z-50 py-1 overflow-hidden"
                  >
                    <button onClick={() => { handleExport("csv"); setShowColumnMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                      CSV
                    </button>
                    <button onClick={() => { handleExport("excel"); setShowColumnMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
                      Excel
                    </button>
                    <button onClick={() => { handleExport("pdf"); setShowColumnMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                      PDF
                    </button>
                    <button onClick={() => { handleExport("copy"); setShowColumnMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-surface-2 flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                      Copier
                    </button>
                    <hr className="my-1 border-border" />
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider">Colonnes</div>
                    {columns.map(c => (
                      <label key={c.key} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.has(c.key)}
                          onChange={() => setHiddenColumns(prev => { const n = new Set(prev); if (n.has(c.key)) n.delete(c.key); else n.add(c.key); return n; })}
                          className="accent-primary rounded"
                        />
                        {c.label}
                      </label>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Selection info */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 text-xs text-primary font-medium">
          <span>{selected.size} élément{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}</span>
          <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground underline">Désélectionner</button>
        </div>
      )}

      {/* Table */}
      <div ref={tableRef} className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                {visibleColumns.map(c => (
                  <th key={c.key} className={`text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider ${c.className || ""}`} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>{skeletonRows}</tbody>
          </table>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-error" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Erreur de chargement</p>
            <p className="text-xs text-muted mb-4">{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="text-xs font-medium text-primary hover:text-primary-light transition-colors">
                Réessayer
              </button>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-3 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{emptyTitle}</p>
            <p className="text-xs text-muted mb-4">{emptyDescription}</p>
            {emptyAction && (
              <button onClick={emptyAction.onClick} className="text-xs font-medium text-primary hover:text-primary-light transition-colors">
                {emptyAction.label}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50 sticky top-0 z-10">
                  {bulkActions.length > 0 && (
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleAll}
                        className="accent-primary rounded"
                        aria-label="Sélectionner tout"
                      />
                    </th>
                  )}
                  {visibleColumns.map(c => (
                    <th
                      key={c.key}
                      className={`text-left px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider ${c.sortable ? "cursor-pointer select-none hover:text-foreground" : ""} ${c.className || ""}`}
                      style={c.width ? { width: c.width } : undefined}
                      onClick={c.sortable ? () => handleSort(c.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {c.sortable && sortKey === c.key && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={sortDir === "desc" ? "rotate-180" : ""}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-border transition-colors ${
                      selected.has(row.id)
                        ? "bg-primary/[0.03]"
                        : "hover:bg-surface-2/30"
                    } ${i % 2 === 0 ? "" : "bg-surface-2/10"}`}
                  >
                    {bulkActions.length > 0 && (
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleOne(row.id)}
                          className="accent-primary rounded"
                        />
                      </td>
                    )}
                    {visibleColumns.map(c => (
                      <td key={c.key} className={`px-4 py-3 text-foreground ${c.className || ""}`}>
                        {c.render ? c.render(row, i) : String((row as Record<string, unknown>)[c.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && sorted.length > 0 && !enableInfiniteScroll && (
        <div className="flex items-center justify-between text-xs text-muted">
          <span>{sorted.length} résultat{sorted.length > 1 ? "s" : ""}{selected.size > 0 ? ` · ${selected.size} sélectionné${selected.size > 1 ? "s" : ""}` : ""}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded border border-border text-foreground hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ←
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  page === currentPage ? "bg-primary text-white" : "text-foreground hover:bg-surface-2"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded border border-border text-foreground hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Infinite scroll load more */}
      {!loading && enableInfiniteScroll && hasMore && (
        <div className="text-center py-4">
          <button onClick={onLoadMore} className="text-xs font-medium text-primary hover:text-primary-light transition-colors">
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
}
