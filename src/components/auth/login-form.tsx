"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Landmark, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { adminProfile, loading, login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && adminProfile) {
      router.replace("/dashboard");
    }
  }, [adminProfile, loading, router]);

  async function onSubmit(values: LoginValues) {
    try {
      setSubmitting(true);
      await login(values.email, values.password);
      toast.success("Welcome back. Access granted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-border bg-card">
      <CardHeader className="space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Landmark className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Admin login</CardTitle>
          <CardDescription>
            Secure access for wallet operations, defaults, overrides, and monthly history.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...form.register("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...form.register("password")} />
          </div>
          <Button className="w-full" size="lg" type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
