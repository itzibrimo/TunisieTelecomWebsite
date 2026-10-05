"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* =============================================================================
 * Select — Custom dropdown select with search, groups, keyboard navigation
 * ============================================================================= */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

interface SelectProps {
  options: (SelectOption | SelectGroup)[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

function isGroup(opt: SelectOption | SelectGroup): opt is SelectGroup {
  return "options" in opt;
}

export default function Select({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  label,
  error,
  hint,
  disabled = false,
  searchable = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Flatten options for keyboard navigation
  const flatOptions: SelectOption[] = options.flatMap((o) => (isGroup(o) ? o.options : [o]));
  const filtered = searchable
    ? flatOptions.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : flatOptions;

  const selected = flatOptions.find((o) => o.value === value);
  // Derived clamping — keeps highlightedIndex in valid range without effect
  const effectiveHighlighted = Math.min(highlightedIndex, Math.max(-1, filtered.length - 1));

  function handleSelect(opt: SelectOption) {
    if (opt.disabled) return;
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (effectiveHighlighted >= 0) handleSelect(filtered[effectiveHighlighted]);
        break;
      case "Escape":
        setOpen(false);
        triggerRef.current?.focus();
        break;
    }
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        listRef.current && !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, searchable]);

  // Reset highlighted on query change — handle in onChange instead of effect
  // (derived clamping below ensures highlightedIndex stays in bounds)

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      )}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        className={`input-base w-full flex items-center justify-between text-left ${error ? "input-error" : ""} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className={selected ? "text-foreground" : "text-placeholder"}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <svg className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={listRef}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute z-50 mt-1 w-full rounded-xl bg-bg-elevated border border-border shadow-xl overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-border">
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(-1); }}
                  placeholder="Rechercher..."
                  className="w-full h-8 px-3 text-sm bg-surface rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-placeholder"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1" role="listbox">
              {options.map((group, gi) => {
                if (isGroup(group)) {
                  const groupFiltered = searchable
                    ? group.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
                    : group.options;
                  if (groupFiltered.length === 0) return null;
                  return (
                    <div key={gi}>
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                        {group.label}
                      </div>
                      {groupFiltered.map((opt) => {
                        const idx = filtered.indexOf(opt);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={opt.value === value}
                            disabled={opt.disabled}
                            onClick={() => handleSelect(opt)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                              opt.value === value
                                ? "bg-primary/10 text-primary"
                                : idx === effectiveHighlighted
                                ? "bg-surface-2"
                                : "hover:bg-surface-2"
                            } ${opt.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                            <span className="flex-1 truncate">{opt.label}</span>
                            {opt.value === value && (
                              <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
                // Single option (not in a group)
                const idx = filtered.indexOf(group);
                return (
                  <button
                    key={group.value}
                    type="button"
                    role="option"
                    aria-selected={group.value === value}
                    disabled={group.disabled}
                    onClick={() => handleSelect(group)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                      group.value === value
                        ? "bg-primary/10 text-primary"
                        : idx === effectiveHighlighted
                        ? "bg-surface-2"
                        : "hover:bg-surface-2"
                    } ${group.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {group.icon && <span className="shrink-0">{group.icon}</span>}
                    <span className="flex-1 truncate">{group.label}</span>
                    {group.value === value && (
                      <svg className="h-4 w-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-sm text-muted text-center">Aucun résultat</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-error font-medium mt-1">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
