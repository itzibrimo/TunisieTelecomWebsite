"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseDb } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import type { Reclamation, Invoice, ActivityEntry } from "@/lib/types";

interface SearchResult {
  id: string;
  type: "reclamation" | "invoice" | "activity";
  title: string;
  description: string;
  status?: string;
  timestamp?: unknown;
  href: string;
}

function fmtDate(d: unknown): string {
  if (!d) return "";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  reclamation: { label: "Réclamation", icon: "📝", color: "text-primary" },
  invoice: { label: "Facture", icon: "📄", color: "text-warning" },
  activity: { label: "Activité", icon: "⚡", color: "text-accent-cyan" },
};

export default function GlobalSearch({ uid, open, onClose }: { uid: string | null; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query_, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tt_global_search_recent");
      if (stored) {
        const id = requestAnimationFrame(() => setRecentSearches(JSON.parse(stored)));
        return () => cancelAnimationFrame(id);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) {
      const id = requestAnimationFrame(() => { setQuery(""); setResults([]); });
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const saveRecent = useCallback((q: string) => {
    const updated = [q, ...recentSearches.filter(r => r !== q)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem("tt_global_search_recent", JSON.stringify(updated)); } catch {}
  }, [recentSearches]);

  useEffect(() => {
    if (!uid || !query_.trim()) {
      const id = requestAnimationFrame(() => setResults([]));
      return () => cancelAnimationFrame(id);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const db = getFirebaseDb();
      const lower = query_.toLowerCase();
      const all: SearchResult[] = [];

      try {
        const recSnap = await getDocs(query(
          collection(db, "reclamations"),
          where("userId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(20)
        ));
        recSnap.docs.forEach(d => {
          const data = d.data() as Reclamation;
          if (data.subject?.toLowerCase().includes(lower) || data.message?.toLowerCase().includes(lower) || data.concernedNumber?.includes(query_)) {
            all.push({
              id: d.id, type: "reclamation",
              title: data.subject,
              description: data.message?.substring(0, 80),
              status: data.status,
              timestamp: data.createdAt,
              href: `/reclamations/${d.id}`,
            });
          }
        });

        const invSnap = await getDocs(query(
          collection(db, "users", uid, "invoices"),
          orderBy("createdAt", "desc"),
          limit(20)
        ));
        invSnap.docs.forEach(d => {
          const data = d.data() as Invoice;
          if (data.description?.toLowerCase().includes(lower) || data.status?.includes(query_) || String(data.amount)?.includes(query_)) {
            all.push({
              id: d.id, type: "invoice",
              title: `Facture ${data.amount} TND`,
              description: data.description,
              status: data.status,
              timestamp: data.createdAt,
              href: `/factures`,
            });
          }
        });

        const actSnap = await getDocs(query(
          collection(db, "users", uid, "activity"),
          orderBy("timestamp", "desc"),
          limit(30)
        ));
        actSnap.docs.forEach(d => {
          const data = d.data() as ActivityEntry;
          if (data.title?.toLowerCase().includes(lower) || data.description?.toLowerCase().includes(lower)) {
            all.push({
              id: d.id, type: "activity",
              title: data.title,
              description: data.description,
              timestamp: data.timestamp,
              href: `/dashboard`,
            });
          }
        });
      } catch (e) {
        console.error("[GlobalSearch]", e);
      }

      requestAnimationFrame(() => {
        setResults(all);
        setLoading(false);
        setSelectedIdx(0);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [uid, query_]);

  const handleSelect = useCallback((item: SearchResult) => {
    saveRecent(query_.trim());
    onClose();
    router.push(item.href);
  }, [query_, router, onClose, saveRecent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) handleSelect(results[selectedIdx]);
  };

  if (!uid) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4" onKeyDown={handleKeyDown}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-2xl bg-bg-elevated rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <svg className="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query_}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher réclamations, factures, activité..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-placeholder focus:outline-none"
              />
              {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-2 rounded border border-border">ESC</kbd>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {!query_ && recentSearches.length > 0 && (
                <div className="p-3">
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-2">Recherches récentes</p>
                  {recentSearches.map(q => (
                    <button key={q} onClick={() => setQuery(q)} className="w-full px-3 py-2 text-sm text-left flex items-center gap-3 hover:bg-surface-2 rounded-lg transition-colors">
                      <svg className="h-4 w-4 text-placeholder shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="text-foreground-2">{q}</span>
                    </button>
                  ))}
                </div>
              )}

              {query_ && results.length > 0 && (
                <div className="p-2">
                  {results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`w-full px-3 py-2.5 text-sm text-left flex items-center gap-3 rounded-lg transition-colors ${i === selectedIdx ? "bg-surface-2" : "hover:bg-surface-2"}`}
                    >
                      <span className="text-lg shrink-0">{typeConfig[item.type]?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground truncate">{item.title}</span>
                          {item.status && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-3 text-muted-foreground">{item.status}</span>}
                        </div>
                        <p className="text-xs text-muted truncate mt-0.5">{item.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-medium ${typeConfig[item.type]?.color}`}>{typeConfig[item.type]?.label}</span>
                        {!!item.timestamp && <p className="text-[10px] text-placeholder mt-0.5">{fmtDate(item.timestamp)}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query_ && !loading && results.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted">Aucun résultat pour &ldquo;{query_}&rdquo;</p>
                </div>
              )}

              {!query_ && recentSearches.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted">Tapez pour rechercher dans toutes vos données</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-placeholder">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">↑↓</kbd> naviguer</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">↵</kbd> ouvrir</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">esc</kbd> fermer</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
