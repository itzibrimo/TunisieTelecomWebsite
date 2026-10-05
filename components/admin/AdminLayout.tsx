"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/hooks/useUser";
import { isAdmin } from "@/lib/services/admin.service";

const ease = [0.16, 1, 0.3, 1] as const;

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Utilisateurs", icon: "👥" },
  { href: "/admin/reclamations", label: "Réclamations", icon: "📋" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useUser();
  const [adminCheck, setAdminCheck] = useState<"loading" | "admin" | "denied">("loading");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    isAdmin(user.uid)
      .then(ok => setAdminCheck(ok ? "admin" : "denied"))
      .catch(() => setAdminCheck("denied"));
  }, [user, authLoading, router]);

  useEffect(() => {
    if (adminCheck === "denied") router.push("/dashboard");
  }, [adminCheck, router]);

  if (authLoading || adminCheck === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted">Vérification des accès...</p>
        </div>
      </div>
    );
  }

  if (adminCheck === "denied" || !user) return null;

  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="hidden lg:flex w-64 flex-col border-r border-border bg-surface sticky top-0 h-screen"
      >
        <div className="p-5 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center shadow-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">Admin Panel</span>
              <span className="block text-[10px] text-muted">TT Digital</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ease }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.href)
                    ? "bg-primary text-white shadow-md"
                    : "text-muted hover:text-foreground hover:bg-surface-2"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </motion.div>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted hover:text-foreground hover:bg-surface-2 transition-all">
            ← Retour
          </Link>
        </div>
      </motion.aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border h-14 flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-surface-2 text-foreground">
          ☰
        </button>
        <span className="ml-3 font-semibold text-sm text-foreground">Admin Panel</span>
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 z-50 w-64 bg-surface border-r border-border shadow-2xl lg:hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <span className="font-bold text-sm text-foreground">Admin Panel</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-surface-2 text-foreground">
                  ×
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-primary text-white"
                        : "text-muted hover:text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0">{children}</main>
    </div>
  );
}