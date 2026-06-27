"use client";

import { type User } from "@supabase/supabase-js";
import { createContext, useEffect, useMemo, useState } from "react";

import {
  loginWithEmailPassword,
  logoutCurrentUser,
  watchAuthState,
} from "@/services/supabase/auth-service";
import { isSupabaseConfigured } from "@/services/supabase/client";
import { getUserById } from "@/services/supabase/database-service";
import type { ManagedUser } from "@/types";

interface AuthContextValue {
  authUser: User | null;
  adminProfile: ManagedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function createFallbackAdminProfile(user: User): ManagedUser {
  const now = new Date().toISOString();

  return {
    profile: {
      uid: user.id,
      fullName: user.user_metadata?.full_name || user.email || "Admin User",
      email: user.email ?? "",
      phone: user.phone ?? undefined,
      country: "",
      joinedAt: user.created_at ?? "",
      status: "active",
      role: "admin",
      avatar: user.user_metadata?.avatar_url || undefined,
      walletTier: "starter",
      lastActiveAt: user.last_sign_in_at ?? now,
    },
    currentData: {
      items: [],
      updatedAt: "",
    },
    monthlyHistory: [],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<ManagedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    watchAuthState(async (user) => {
      setAuthUser(user);

      if (user) {
        const profile = await getUserById(user.id);
        setAdminProfile(profile ?? createFallbackAdminProfile(user));
      } else {
        setAdminProfile(null);
      }

      setLoading(false);
    }).then((cleanup) => {
      unsubscribe = cleanup;
    });

    return () => unsubscribe?.();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      adminProfile,
      loading,
      login: async (email, password) => {
        setLoading(true);
        if (!isSupabaseConfigured()) {
          setLoading(false);
          throw new Error(
            "Supabase is not configured. Add your NEXT_PUBLIC_SUPABASE_* variables first.",
          );
        }
        try {
          await loginWithEmailPassword(email, password);
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        if (isSupabaseConfigured()) {
          await logoutCurrentUser();
        }
        setAdminProfile(null);
      },
    }),
    [adminProfile, authUser, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

