"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import PremiumNavbar from "./PremiumNavbar";
import PremiumSidebar from "./PremiumSidebar";
import Breadcrumbs from "./Breadcrumbs";
import { useUser } from "@/lib/hooks/useUser";

interface AppShellProps {
  children: React.ReactNode;
}

const SIDEBAR_ROUTES = ["/dashboard", "/reclamations", "/factures", "/tt-cash", "/offres", "/efacture", "/settings", "/account", "/support", "/aide", "/admin"];
const NO_NAVBAR_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const shouldShowSidebar = SIDEBAR_ROUTES.some((route) => pathname.startsWith(route));
  const shouldShowNavbar = !NO_NAVBAR_ROUTES.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((c) => !c);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showSidebarNow = shouldShowSidebar && !loading && !!user;

  return (
    <>
      {shouldShowNavbar && <PremiumNavbar />}

      <div className="flex flex-1 min-h-screen">
        {showSidebarNow && (
          <PremiumSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}

        <main
          id="main-content"
          role="main"
          className={`flex-1 flex flex-col min-w-0 ${
            shouldShowNavbar ? "pt-16" : ""
          }`}
        >
          {showSidebarNow && (
            <div className="px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-sm">
              <Breadcrumbs />
            </div>
          )}
          <div className="flex-1 flex flex-col">{children}</div>
        </main>
      </div>
    </>
  );
}
