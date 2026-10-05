"use client";

import { useEffect, type ReactNode } from "react";
import { useGlobalErrorHandler, useWebVitals } from "@/lib/hooks/useMonitoring";
import { initAnalytics, initPerformanceMonitoring } from "@/lib/services/analytics.service";
import { trackPageView } from "@/lib/services/analytics.service";
import { usePathname } from "next/navigation";

export default function MonitoringProvider({ children }: { children: ReactNode }) {
  useGlobalErrorHandler();
  useWebVitals();

  const pathname = usePathname();

  useEffect(() => {
    initAnalytics();
    initPerformanceMonitoring();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}
