import { getApp } from "../firebase";
import type { Analytics } from "firebase/analytics";

let analyticsModule: Analytics | null = null;
let perfModule: unknown = null;

async function getAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return null;
  if (analyticsModule) return analyticsModule;
  try {
    const { getAnalytics, isSupported } = await import("firebase/analytics");
    const supported = await isSupported();
    if (!supported) return null;
    analyticsModule = getAnalytics(getApp());
    return analyticsModule;
  } catch {
    return null;
  }
}

async function getPerf() {
  if (typeof window === "undefined") return null;
  if (perfModule) return perfModule;
  try {
    const { getPerformance } = await import("firebase/performance");
    perfModule = getPerformance(getApp());
    return perfModule;
  } catch {
    return null;
  }
}

export async function initAnalytics(): Promise<void> {
  const a = await getAnalytics();
  if (a) console.log("[Analytics] Initialized");
}

export async function initPerformanceMonitoring(): Promise<void> {
  const p = await getPerf();
  if (p) console.log("[Perf] Initialized");
}

export async function logEvent(name: string, params?: Record<string, unknown>): Promise<void> {
  const a = await getAnalytics();
  if (!a) return;
  try {
    const { logEvent: fbLogEvent } = await import("firebase/analytics");
    fbLogEvent(a, name, params as Record<string, string | number | boolean>);
  } catch {
    // silent fail
  }
}

export async function trackPageView(pageName: string): Promise<void> {
  await logEvent("page_view", { page_title: pageName });
}

export async function trackError(error: Error, context?: string): Promise<void> {
  await logEvent("app_error", {
    error_name: error.name,
    error_message: error.message,
    error_context: context || "unknown",
  });
}

export async function trackPerformance(metric: string, value: number): Promise<void> {
  await logEvent("performance_metric", {
    metric_name: metric,
    metric_value: value,
  });
}
