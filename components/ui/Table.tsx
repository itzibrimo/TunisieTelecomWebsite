"use client";

import { type ReactNode } from "react";

/* =============================================================================
 * Table — Data table with header, rows, and responsive support
 * ============================================================================= */

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
  className?: string;
}

export default function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "Aucune donnée",
  emptyIcon,
  loading = false,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-border ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider ${
                  col.sortable ? "cursor-pointer select-none hover:text-foreground transition-colors" : ""
                } ${col.className || ""}`}
              >
                <span className="flex items-center gap-1.5">
                  {col.header}
                  {col.sortable && (
                    <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={`skeleton-${i}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 rounded bg-surface-2 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="empty-state">
                  <div className="empty-state-icon">
                    {emptyIcon || (
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    )}
                  </div>
                  <p className="empty-state-title">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                onClick={() => onRowClick?.(item)}
                className={`transition-colors hover:bg-surface-hover ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-foreground ${col.className || ""}`}>
                    {col.render
                      ? col.render(item, index)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}


