import { ProtectedShell } from "@/components/auth/protected-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedShell>{children}</ProtectedShell>;
}
