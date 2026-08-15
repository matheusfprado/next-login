"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  data: { user: AuthUser } | null;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signOut: (options?: { callbackUrl?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{ user: AuthUser } | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const refresh = useCallback(async () => {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok) {
      setData(null);
      setStatus("unauthenticated");
      return;
    }

    const session = (await response.json()) as { user: AuthUser } | null;
    setData(session);
    setStatus(session?.user ? "authenticated" : "unauthenticated");
  }, []);

  const signOut = useCallback(async (options?: { callbackUrl?: string }) => {
    await fetch("/api/auth/logout", { method: "POST" });
    setData(null);
    setStatus("unauthenticated");
    window.location.assign(options?.callbackUrl ?? "/login");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ data, status, refresh, signOut }),
    [data, refresh, signOut, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
