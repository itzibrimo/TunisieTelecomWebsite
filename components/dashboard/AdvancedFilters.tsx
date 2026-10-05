"use client";

import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface FilterState {
  status: string[];
  dateRange: "all" | "today" | "week" | "month" | "year";
  sortBy: "date" | "status" | "name";
  sortDir: "asc" | "desc";
}

const STATUS_OPTIONS = [
  { value: "new", label: "Nouvelle" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolue" },
  { value: "closed", label: "Fermée" },
];

const DATE_OPTIONS = [
  { value: "all", label: "Tout" },
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "status", label: "Statut" },
  { value: "name", label: "Nom" },
];

const STORAGE_KEY = "tt_saved_filters";

function getSavedFilters(): Record<string, FilterState> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveFilter(name: string, filters: FilterState) {
  const all = getSavedFilters();
  all[name] = filters;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function deleteSavedFilter(name: string) {
  const all = getSavedFilters();
  delete all[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function AdvancedFiltersInner({ filters, onChange }: { filters: FilterState; onChange: (f: FilterState) => void }) {
  const [open, setOpen] = useState(false);
  const [savedName, setSavedName] = useState("");
  const [savedFilters, setSavedFilters] = useState<Record<string, FilterState>>(getSavedFilters());
  const [showSaved, setShowSaved] = useState(false);

  const toggleStatus = useCallback((val: string) => {
    onChange({
      ...filters,
      status: filters.status.includes(val)
        ? filters.status.filter(s => s !== val)
        : [...filters.status, val],
    });
  }, [filters, onChange]);

  const activeCount = (filters.status.length > 0 ? 1 : 0) + (filters.dateRange !== "all" ? 1 : 0);

  const handleSave = () => {
    if (!savedName.trim()) return;
    saveFilter(savedName.trim(), filters);
    setSavedFilters(getSavedFilters());
    setSavedName("");
  };

  const handleDelete = (name: string) => {
    deleteSavedFilter(name);
    setSavedFilters(getSavedFilters());
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
          activeCount > 0
            ? "border-primary/30 bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:bg-surface-2"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filtres
        {activeCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-primary text-[10px] text-white flex items-center justify-center">{activeCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-bg-elevated shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Filtres avancés</h3>
                  {activeCount > 0 && (
                    <button onClick={() => onChange({ status: [], dateRange: "all", sortBy: "date", sortDir: "desc" })} className="text-[11px] text-primary hover:text-primary-light">Réinitialiser</button>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Statut</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => toggleStatus(opt.value)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                          filters.status.includes(opt.value) ? "bg-primary text-white" : "bg-surface-2 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Période</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DATE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => onChange({ ...filters, dateRange: opt.value as FilterState["dateRange"] })}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                          filters.dateRange === opt.value ? "bg-primary text-white" : "bg-surface-2 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tri</p>
                  <div className="flex gap-2">
                    <select
                      value={filters.sortBy}
                      onChange={e => onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })}
                      className="flex-1 h-8 px-2 text-xs bg-surface rounded-lg border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                      onClick={() => onChange({ ...filters, sortDir: filters.sortDir === "asc" ? "desc" : "asc" })}
                      className="px-2 h-8 rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground text-xs"
                    >
                      {filters.sortDir === "asc" ? "↑" : "↓"}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <button onClick={() => setShowSaved(!showSaved)} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    {showSaved ? "Masquer" : "Filtres sauvegardés"}
                  </button>
                  {showSaved && (
                    <div className="mt-2 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={savedName}
                          onChange={e => setSavedName(e.target.value)}
                          placeholder="Nom du filtre"
                          className="flex-1 h-8 px-2 text-xs bg-surface rounded-lg border border-border text-foreground placeholder:text-placeholder focus:outline-none focus:ring-1 focus:ring-ring"
                          onKeyDown={e => e.key === "Enter" && handleSave()}
                        />
                        <button onClick={handleSave} className="px-3 h-8 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
                          Sauver
                        </button>
                      </div>
                      {Object.entries(savedFilters).map(([name, f]) => (
                        <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-surface">
                          <button onClick={() => { onChange(f); setOpen(false); }} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
                            {name}
                          </button>
                          <button onClick={() => handleDelete(name)} className="text-[10px] text-error hover:text-error/80">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const AdvancedFilters = memo(AdvancedFiltersInner);
export default AdvancedFilters;
