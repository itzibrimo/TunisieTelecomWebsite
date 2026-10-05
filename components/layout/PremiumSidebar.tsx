"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { isAdmin } from "@/lib/services/admin.service";
import Avatar from "@/components/ui/Avatar";

/* =============================================================================
 * PremiumSidebar — Collapsible animated sidebar for authenticated areas
 * Features: collapse toggle, section groups, active indicator, keyboard nav
 * Uses CSS transitions for GPU-accelerated width animation.
 * ============================================================================= */

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const mainNav: NavSection = {
  items: [
    { href: "/dashboard", label: "Tableau de bord", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: "/reclamations", label: "Réclamations", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/factures", label: "Factures", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg> },
  ],
};

const servicesNav: NavSection = {
  title: "Services",
  items: [
    { href: "/tt-cash", label: "TT Cash", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: "/offres", label: "Offres", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
    { href: "/efacture", label: "E-Facture", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  ],
};

const supportNav: NavSection = {
  title: "Support",
  items: [
    { href: "/support", label: "Contact", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { href: "/aide", label: "Aide", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ],
};

const adminNav: NavSection = {
  title: "Administration",
  items: [
    { href: "/admin", label: "Dashboard Admin", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
    { href: "/admin/users", label: "Utilisateurs", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { href: "/admin/reclamations", label: "Toutes réclamations", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
  ],
};

interface PremiumSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function PremiumSidebar({ collapsed = false, onToggle }: PremiumSidebarProps) {
  const pathname = usePathname();
  const { user, profile, loading } = useUser();
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      isAdmin(user.uid).then(setIsAdminUser).catch(() => setIsAdminUser(false));
    }
  }, [user?.uid]);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sections = [mainNav, servicesNav, supportNav, ...(isAdminUser ? [adminNav] : [])];

  return (
    <aside
      className="hidden lg:flex flex-col sticky top-16 flex-shrink-0 border-r border-border bg-bg z-30 self-start h-[calc(100vh-4rem)] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{ width: collapsed ? 64 : 240 }}
    >
      {/* Header with toggle */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-lg gradient-brand flex items-center justify-center shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-[family-name:var(--font-display)] text-sm font-bold text-foreground whitespace-nowrap">TT Digital</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors"
          aria-label={collapsed ? "Étendre le menu" : "Réduire le menu"}
        >
          <svg className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            {section.title && !collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? "bg-primary text-white shadow-md"
                          : "text-muted hover:text-foreground hover:bg-surface-2"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`shrink-0 ${active ? "text-white" : "text-muted group-hover:text-foreground"}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-primary-50 text-primary dark:bg-primary/20 dark:text-primary-light rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {active && !collapsed && (
                        <div
                          className="absolute inset-0 bg-primary rounded-lg -z-10"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User section */}
      {!loading && user && (
        <div className="border-t border-border p-3">
          <Link
            href="/account"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-surface-2 transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Avatar
              src={profile?.photoURL || null}
              name={profile?.name || user.email || "User"}
              size="sm"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.name || user.email?.split("@")[0]}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            )}
          </Link>
        </div>
      )}
    </aside>
  );
}