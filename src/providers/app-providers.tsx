"use client";

import { Toaster } from "sonner";

import { AuthProvider } from "@/providers/auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
