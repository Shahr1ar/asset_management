import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <p className="text-sm uppercase tracking-[0.3em] text-primary">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Route not found</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        The admin route you requested does not exist or may have been moved.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Return to dashboard</Link>
      </Button>
    </div>
  );
}
