"use client";

import { useEffect, useState, useRef } from "react";
import { getFirebaseDb } from "../firebase";
import {
  collection, query, orderBy, onSnapshot, limit,
  where, type Unsubscribe, type Query, type DocumentData,
} from "firebase/firestore";
import type { Reclamation, Invoice, ActivityEntry, NotificationEntry, LoginHistoryEntry } from "../types";

function useRealtimeCollection<T>(
  uid: string | null | undefined,
  path: string,
  opts?: { orderByField?: string; limitCount?: number; constraints?: unknown[] }
): { data: T[]; loading: boolean; error: string | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!uid) {
      const id = requestAnimationFrame(() => setLoading(false));
      return () => cancelAnimationFrame(id);
    }

    const db = getFirebaseDb();
    const constraints: unknown[] = [...(opts?.constraints || [])];
    if (opts?.orderByField) constraints.push(orderBy(opts.orderByField, "desc"));
    if (opts?.limitCount) constraints.push(limit(opts.limitCount));

    const q = constraints.length > 0
      ? query(collection(db, path), ...(constraints as Parameters<typeof query>[1][]))
      : collection(db, path);

    unsubRef.current = onSnapshot(
      q as Query<DocumentData>,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
        setLoading(false);
        setError(null);
      },
      (err: unknown) => {
        // Silently handle permission-denied errors for collections that may not exist
        const errorCode = (err as { code?: string })?.code;
        const errorMessage = (err as { message?: string })?.message;
        if (errorCode === "permission-denied" || errorMessage?.includes("permission")) {
          setData([]);
          setLoading(false);
          return;
        }
        console.error(`[useRealtime] ${path}:`, err);
        setError(errorMessage ?? "Unknown error");
        setLoading(false);
      }
    );

    return () => { unsubRef.current?.(); unsubRef.current = null; };
  }, [uid, path]);

  return { data, loading, error };
}

export function useRealtimeReclamations(uid: string | null | undefined) {
  return useRealtimeCollection<Reclamation>(uid, `reclamations`, {
    orderByField: "createdAt",
    constraints: uid ? [where("userId", "==", uid)] : [],
  });
}

export function useRealtimeUserReclamations(uid: string | null | undefined) {
  return useRealtimeCollection<Reclamation>(uid, `users/${uid}/reclamations`, {
    orderByField: "createdAt",
  });
}

export function useRealtimeInvoices(uid: string | null | undefined) {
  return useRealtimeCollection<Invoice>(uid, `users/${uid}/invoices`, {
    orderByField: "createdAt",
  });
}

export function useRealtimeNotifications(uid: string | null | undefined) {
  return useRealtimeCollection<NotificationEntry>(uid, `users/${uid}/notifications`, {
    orderByField: "createdAt",
    limitCount: 50,
  });
}

export function useRealtimeActivity(uid: string | null | undefined) {
  return useRealtimeCollection<ActivityEntry>(uid, `users/${uid}/activity`, {
    orderByField: "timestamp",
    limitCount: 50,
  });
}

export function useRealtimeLoginHistory(uid: string | null | undefined) {
  return useRealtimeCollection<LoginHistoryEntry>(uid, `users/${uid}/loginHistory`, {
    orderByField: "timestamp",
    limitCount: 20,
  });
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsOnline(navigator.onLine));
    const onUp = () => setIsOnline(true);
    const onDown = () => setIsOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  return isOnline;
}
