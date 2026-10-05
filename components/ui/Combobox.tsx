"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ComboboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label: string;
  /**
   * Item list to display in the dropdown. Accepts `readonly string[]`, `string[]`,
   * `readonly ["A", "B"]` tuples, or any iterable of strings. If anything
   * non-iterable is passed (e.g. `undefined`, `null`, an object), the component
   * degrades gracefully to an empty list and surfaces a console warning
   * instead of crashing the whole form.
   */
  options?: readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  emptyHint?: string;
}

export default function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = "Rechercher...",
  error,
  hint,
  required,
  emptyHint = "Aucun résultat",
  id,
  ...props
}: ComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const safeOptions: string[] = useMemo(() => {
    if (Array.isArray(options)) {
      // Filter out any non-string entries defensively (e.g. dev typos like
      // passing numbers, undefined inside the array, etc.).
      return options.filter((opt): opt is string => typeof opt === "string");
    }
    // options might be a Set/Map in odd upstream code; accept iterables too.
    if (options != null && typeof (options as Iterable<string>)[Symbol.iterator] === "function") {
      return Array.from(options as Iterable<string>).filter(
        (opt): opt is string => typeof opt === "string"
      );
    }
    if (options === undefined && typeof window !== "undefined") {
      // Only warn in the browser — SSR passes no data-hydration context.
      console.warn(
        "[Combobox] `options` prop is undefined. Pass a string array (e.g. TUNISIAN_GOVERNORATES)."
      );
    }
    return [];
  }, [options]);

  const filtered = useMemo(() => {
    if (!safeOptions.length || !query.trim()) return [...safeOptions];
    const q = query.toLowerCase();
    return safeOptions.filter((opt) => opt.toLowerCase().includes(q));
  }, [query, safeOptions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Synchronize external system state (highlight) when filtered list changes.
    // queueMicrotask defers setState to next microtask, avoiding cascading
    // synchronous renders flagged by react-hooks/set-state-in-effect.
    if (open && filtered.length > 0) queueMicrotask(() => setHighlightedIndex(0));
    else queueMicrotask(() => setHighlightedIndex(-1));
  }, [open, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[highlightedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, open]);

  function selectOption(opt: string) {
    onChange(opt);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && highlightedIndex >= 0 && filtered[highlightedIndex]) {
        selectOption(filtered[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  let describedBy: string | undefined = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const generatedHintId = `${id || label.replace(/\s+/g, "-").toLowerCase()}-desc`;
  describedBy = error ? `${generatedHintId}-error` : hint ? `${generatedHintId}-hint` : undefined;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label htmlFor={id || generatedHintId} className="flex items-center gap-1 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-error text-xs">*</span>}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={id || generatedHintId}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${generatedHintId}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={highlightedIndex >= 0 ? `${generatedHintId}-opt-${highlightedIndex}` : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          value={open ? query : value}
          placeholder={value || placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full h-10 pl-3.5 ${value ? "pr-10" : "pr-3.5"} rounded-lg bg-bg-elevated border text-foreground text-sm placeholder:text-placeholder transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-border-focus disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? "border-error focus:ring-ring-error focus:border-error" : "border-border hover:border-border-2"
          }`}
          {...props}
        />
        {/* Dropdown chevron + clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !open && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              tabIndex={-1}
              aria-label="Effacer la sélection"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <AnimatePresence>
          {open && (
            <motion.ul
              ref={listRef}
              id={`${generatedHintId}-listbox`}
              role="listbox"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-lg bg-bg-elevated border border-border shadow-lg py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground text-center">{emptyHint}</li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt}
                    id={`${generatedHintId}-opt-${i}`}
                    role="option"
                    aria-selected={i === highlightedIndex}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      i === highlightedIndex
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-surface-2"
                    } ${opt === value ? "font-semibold" : ""}`}
                  >
                    {opt}
                    {opt === value && (
                      <svg className="inline-block ml-2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${generatedHintId}-error`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-error font-medium flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {hint && !error && (
        <p id={`${generatedHintId}-hint`} className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
