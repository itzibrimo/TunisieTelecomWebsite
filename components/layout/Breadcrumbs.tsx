"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/* =============================================================================
 * Breadcrumbs — Navigation breadcrumb trail
 * ============================================================================= */

const routeLabels: Record<string, string> = {
  "/": "Accueil",
  "/dashboard": "Tableau de bord",
  "/profile": "Profil",
  "/settings": "Paramètres",
  "/settings/appearance": "Apparence",
  "/settings/notifications": "Notifications",
  "/settings/security": "Sécurité",
  "/account": "Mon compte",
  "/account/profile": "Profil",
  "/account/security": "Sécurité",
  "/account/devices": "Appareils",
  "/account/notifications": "Notifications",
  "/account/preferences": "Préférences",
  "/reclamations": "Réclamations",
  "/reclamations/new": "Nouvelle réclamation",
  "/factures": "Factures",
  "/offres": "Offres",
  "/checkout": "Paiement",
  "/tt-cash": "TT Cash",
  "/efacture": "E-Facture",
  "/support": "Support",
  "/aide": "Aide",
  "/contact": "Contact",
  "/services": "Services",
  "/about": "À propos",
  "/admin": "Admin",
  "/admin/users": "Utilisateurs",
  "/admin/reclamations": "Réclamations",
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ href: "/", label: "Accueil" }];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
    crumbs.push({ href: currentPath, label });
  }

  return crumbs;
}

export default function Breadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const crumbs = getBreadcrumbs(pathname);

  if (crumbs.length <= 1) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-1.5 text-sm ${className}`}
      aria-label="Fil d'Ariane"
    >
      <ol className="flex items-center gap-1.5" role="list">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-1.5">
              {!isLast && (
                <>
                  <Link
                    href={crumb.href}
                    className="text-muted hover:text-foreground transition-colors font-medium"
                  >
                    {crumb.label}
                  </Link>
                  <svg
                    className="h-4 w-4 text-muted-foreground shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
              {isLast && (
                <span className="text-foreground font-medium" aria-current="page">
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}