"use client";

import { ReactNode } from "react";

import { AuthProvider } from "@/src/contexts/AuthContext";

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
