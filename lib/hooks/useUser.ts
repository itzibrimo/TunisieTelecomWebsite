"use client";

import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";
import { getUserData, logoutUser } from "../services/auth.service";
import type { UserProfile } from "../types";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch {
      queueMicrotask(() => {
        setLoading(false);
        setAuthReady(false);
      });
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Mark auth as ready first to prevent race conditions
      setAuthReady(true);
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Only query Firestore after auth state is confirmed
          const profileData = await getUserData(firebaseUser.uid);
          setProfile(profileData);
        } catch (error) {
          console.warn("[useUser] Firestore permission error:", error);
          // User exists but profile not accessible yet - set minimal profile
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
    setAuthReady(false);
  }, []);

  return { user, profile, loading, logout, setProfile, authReady };
}
