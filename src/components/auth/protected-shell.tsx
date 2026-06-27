"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { LoadingGrid } from "@/components/shared/loading-grid";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { adminProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !adminProfile && pathname !== "/login") {
      router.replace("/login");
    }
  }, [adminProfile, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-6 py-10">
        <LoadingGrid />
      </div>
    );
  }

  if (!adminProfile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 xl:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
