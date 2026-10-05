import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/Toast";
import ThemeInit from "@/components/effects/ThemeInit";
import MonitoringProvider from "@/components/monitoring/MonitoringProvider";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";

/* ─── Typography system (@fontsource/* — fully offline after install) ───────
   Self-hosted via npm. WOFF2 files are served from /_next/static/media by
   Next.js + @fontsource, so no runtime network fetch (no fonts.googleapis.com,
   no fonts.gstatic.com) is required.

   pairing rationale:
   • Marketing (landing, hero, brand surfaces):
       Heading: Abril Fatface (display serif)  → "Archivo + Abril" pairing for editorial scale
       Subhead: Archivo (geometric sans)       → pairs cleanly with display serif
   • Dashboard / admin (functional, dense UI):
       All text: Inter (UI-grade sans)         → "Arial + Uber-style" goal: neutral, small-size legible
   • Editorial accent (legal docs, about, etc.):
       Body:    DM Sans (ID-Grotesk-like)      → "ID Grotesk" pairing for editorial flavor
   • Data / tables / code:
       Mono:    JetBrains Mono                  → always-readable tabular figures

   Fonts are referenced in globals.css via `--font-sans`/`--font-display`/
   `--font-heading`/`--font-accent`/`--font-mono`. CSS variables carry the
   real @font-family strings; components never hardcode font-family.
   ──────────────────────────────────────────────────────────────────────────── */

/* Inter — UI body (dashboard, admin, forms) */
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

/* Abril Fatface — display serif (marketing hero headlines) */
import "@fontsource/abril-fatface/400.css";

/* Archivo — geometric sans (subheadings, body in marketing surfaces) */
import "@fontsource/archivo/300.css";
import "@fontsource/archivo/400.css";
import "@fontsource/archivo/500.css";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/archivo/900.css";

/* DM Sans — accent (editorial sections, future docs) */
import "@fontsource/dm-sans/300.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/800.css";

/* JetBrains Mono — data, tables, code, stat numerals */
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";

export const metadata: Metadata = {
  title: {
    default: "TT Digital — La vie est émotions",
    template: "%s | TT Digital",
  },
  description: "Solutions télécom innovantes : Internet fibre, mobile, TV et entreprise. TT Digital connecte la Tunisie au futur.",
  keywords: ["tunisie telecom", "internet fibre", "mobile", "télécom", "facture en ligne", "TT Cash", "forfait mobile"],
  authors: [{ name: "Tunisie Telecom" }],
  creator: "Tunisie Telecom",
  publisher: "Tunisie Telecom",
  metadataBase: new URL("https://ttdigital.tn"),
  openGraph: {
    type: "website",
    locale: "fr_TN",
    siteName: "TT Digital",
    title: "TT Digital — La vie est émotions",
    description: "Solutions télécom innovantes : Internet fibre, mobile, TV et entreprise.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "TT Digital — Tunisie Telecom" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TT Digital — La vie est émotions",
    description: "Solutions télécom innovantes : Internet fibre, mobile, TV et entreprise.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 } },
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tunisie Telecom",
    url: "https://ttdigital.tn",
    logo: "https://ttdigital.tn/logo.png",
    description: "Solutions télécom innovantes : Internet fibre, mobile, TV et entreprise.",
    address: { "@type": "PostalAddress", addressCountry: "TN", addressLocality: "Tunis" },
    contactPoint: { "@type": "ContactPoint", telephone: "+216-80-100-010", contactType: "customer service", availableLanguage: "French" },
    sameAs: ["https://facebook.com/tunisietelecom", "https://twitter.com/tunisietelecom", "https://instagram.com/tunisietelecom"],
  };

  return (
    <html lang="fr" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="flex flex-col antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Aller au contenu principal
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ThemeInit />
          <MonitoringProvider>
            <AppShell>{children}</AppShell>
          </MonitoringProvider>
          <PWAInstallPrompt />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
