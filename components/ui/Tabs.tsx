"use client";

import { useState, createContext, useContext, type ReactNode } from "react";
import { motion } from "framer-motion";

/* =============================================================================
 * Tabs — Accessible tab component with animated indicator
 * ============================================================================= */

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ activeTab: "", setActiveTab: () => {} });

interface TabsProps {
  defaultValue: string;
  value?: string;
  onChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export default function Tabs({ defaultValue, value, onChange, children, className = "" }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const activeTab = value ?? internal;

  function handleChange(id: string) {
    setInternal(id);
    onChange?.(id);
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

/* ── TabList ── */

interface TabListProps {
  children: ReactNode;
  className?: string;
}

export function TabList({ children, className = "" }: TabListProps) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 p-1 bg-surface-2 rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

/* ── Tab ── */

interface TabProps {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Tab({ value, children, icon, disabled = false, className = "" }: TabProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center ${
        isActive
          ? "text-foreground"
          : "text-muted hover:text-foreground-2"
      } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute inset-0 bg-bg-elevated rounded-lg shadow-sm border border-border/50"
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    </button>
  );
}

/* ── TabPanel ── */

interface TabPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabPanel({ value, children, className = "" }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <motion.div
      role="tabpanel"
      id={`tabpanel-${value}`}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`mt-4 ${className}`}
      tabIndex={0}
    >
      {children}
    </motion.div>
  );
}
