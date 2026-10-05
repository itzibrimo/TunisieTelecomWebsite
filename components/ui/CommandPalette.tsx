"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============================================================================
 * CommandPalette — Enterprise command palette with fuzzy search
 * ============================================================================= */

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  group?: string;
  action?: () => void;
  keywords?: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

/* ── Fuzzy match ── */
function fuzzyMatch(text: string, query: string): boolean {
  if (!query) return true;
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

/* ── Recent searches (localStorage) ── */
const RECENT_KEY = "tt_cmd_recent";
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function addRecent(q: string) {
  const recent = getRecent().filter(r => r !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
}

/* ── Keyboard shortcuts ── */
const SHORTCUTS = [
  { id: "sc-dashboard", label: "Tableau de bord", keys: ["G", "D"] },
  { id: "sc-search", label: "Rechercher", keys: ["/"] },
  { id: "sc-theme", label: "Basculer le thème", keys: ["G", "T"] },
  { id: "sc-shortcuts", label: "Raccourcis clavier", keys: ["?"] },
];

export default function CommandPalette({ open, onClose, items, placeholder = "Rechercher ou taper une commande..." }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Defer to avoid cascading render
      const id = setTimeout(() => setRecentSearches(getRecent()), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  const filtered = items.filter(item => {
    const q = query.toLowerCase();
    return fuzzyMatch(item.label, q) || item.description?.toLowerCase().includes(q) || item.keywords?.some(k => k.toLowerCase().includes(q));
  });

  const effectiveIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    const g = item.group || "Résultats";
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev || ""; };
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(p => Math.min(p + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(p => Math.max(p - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[effectiveIndex]) {
          if (query.trim()) addRecent(query.trim());
          filtered[effectiveIndex].action?.();
          onClose();
        }
        break;
    }
  };

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-bg-elevated rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <svg className="h-5 w-5 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-placeholder focus:outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-2 rounded border border-border">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto py-2">
              {/* Recent searches */}
              {!query && recentSearches.length > 0 && (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">Recherches récentes</div>
                  {recentSearches.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { setQuery(q); addRecent(q); }}
                      className="w-full px-4 py-2 text-sm text-left flex items-center gap-3 hover:bg-surface-2 transition-colors"
                    >
                      <svg className="h-4 w-4 text-placeholder shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      <span className="text-foreground-2">{q}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Keyboard shortcuts */}
              {!query && (
                <div className="mb-2">
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">Raccourcis clavier</div>
                  {SHORTCUTS.map(s => (
                    <div key={s.id} className="px-4 py-2 text-sm flex items-center justify-between">
                      <span className="text-foreground-2">{s.label}</span>
                      <div className="flex gap-1">
                        {s.keys.map(k => (
                          <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-2 rounded border border-border">{k}</kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Command groups */}
              {Object.entries(grouped).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">{group}</div>
                  {groupItems.map(item => {
                    flatIndex++;
                    const idx = flatIndex;
                    const isSelected = idx === effectiveIndex;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { if (query.trim()) addRecent(query.trim()); item.action?.(); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full px-4 py-2.5 text-sm text-left flex items-center gap-3 transition-colors ${isSelected ? "bg-surface-2" : "hover:bg-surface-2"}`}
                      >
                        {item.icon && <span className="shrink-0 text-muted-foreground">{item.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">{item.label}</div>
                          {item.description && <div className="text-xs text-muted truncate">{item.description}</div>}
                        </div>
                        {item.shortcut && (
                          <div className="flex gap-1 shrink-0">
                            {item.shortcut.split("+").map(k => (
                              <kbd key={k} className="px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-surface-2 rounded border border-border">{k}</kbd>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {filtered.length === 0 && query && (
                <div className="px-4 py-8 text-sm text-muted text-center">
                  Aucun résultat pour &ldquo;{query}&rdquo;
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[10px] text-placeholder">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">↑↓</kbd> naviguer</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">↵</kbd> sélectionner</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-surface-2 rounded border border-border font-mono">esc</kbd> fermer</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
