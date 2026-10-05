"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./useUser";

/**
 * useAuthGuard — Redirects unauthenticated users.
 * Extracts the duplicated auth guard pattern from 12+ pages.
 */
export function useAuthGuard(options?: { requireVerified?: boolean }) {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    } else if (options?.requireVerified && !user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router, options?.requireVerified]);

  return { user, loading, isReady: !loading && !!user };
}
