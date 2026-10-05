"use client";

import { useEffect } from "react";
import { trackError, trackPerformance } from "@/lib/services/analytics.service";

export function useGlobalErrorHandler() {
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      console.error("[GlobalError]", event.error);
      trackError(event.error || new Error(event.message), "window_error").catch(() => {});
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      console.error("[UnhandledRejection]", error);
      trackError(error, "unhandled_rejection").catch(() => {});
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);
}

export function useWebVitals() {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { startTime?: number };
        if (last?.startTime) {
          trackPerformance("LCP", Math.round(last.startTime)).catch(() => {});
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!(entry as unknown as { hadRecentInput?: boolean }).hadRecentInput) clsValue += (entry as unknown as { value: number }).value;
        });
        if (clsValue > 0) {
          trackPerformance("CLS", Math.round(clsValue * 1000)).catch(() => {});
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      return () => {
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    } catch {
      // PerformanceObserver not fully supported
    }
  }, []);
}
