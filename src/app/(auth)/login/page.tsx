import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6 text-foreground">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Fintech admin suite
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Production-ready control for global financial defaults and user-level overrides.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Manage balances, revenue, dynamic financial items, and immutable monthly history in a
              responsive Next.js 15 admin panel built for scale.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
