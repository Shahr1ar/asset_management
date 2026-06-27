"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import {
  getMergedUserFinancialRows,
  getUserById,
  updateUserFinancialData,
  updateUserProfile,
} from "@/services/supabase/database-service";
import type { ManagedUser } from "@/types";

const profileSchema = z.object({
  fullName: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(5),
});

type ProfileValues = z.infer<typeof profileSchema>;
type FinancialRowValue = number | string;

function normalizeFinancialRowValue(value: FinancialRowValue) {
  if (value === "") {
    return 0;
  }

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

export function UserDetailView({ userId }: { userId: string }) {
  const [user, setUser] = useState<ManagedUser | null>(null);
  const [financialRows, setFinancialRows] = useState<
    Array<{ key: string; title: string; value: FinancialRowValue; enabled: boolean; description?: string }>
  >([]);
  const [savingOverrides, setSavingOverrides] = useState(false);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  const loadUser = useCallback(async () => {
    const result = await getUserById(userId);
    setUser(result);
    if (result) {
      form.reset({
        fullName: result.profile.fullName,
        country: result.profile.country,
        phone: result.profile.phone ?? "",
      });

      const merged = await getMergedUserFinancialRows(result);
      setFinancialRows(
        merged.map((row) => ({
          key: row.key,
          title: row.title,
          value: row.value,
          enabled: row.enabled,
          description: row.description,
        })),
      );
    }
  }, [form, userId]);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  async function persistFinancialRows(
    rows: Array<{ key: string; value: FinancialRowValue; enabled: boolean }>,
    successMessage: string,
  ) {
    setSavingOverrides(true);

    try {
      await updateUserFinancialData(
        userId,
        rows.map((row) => ({
          key: row.key,
          value: normalizeFinancialRowValue(row.value),
          enabled: row.enabled,
        })),
      );
      toast.success(successMessage);
    } finally {
      setSavingOverrides(false);
    }
  }

  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="We could not find a matching user record for this route."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.profile.fullName}
        description="Edit profile metadata, manage override values, and review the immutable monthly history ledger."
      />
      <div className="grid gap-6">
        <Card>
          <CardContent className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profile.avatar} alt={user.profile.fullName} />
                <AvatarFallback>{user.profile.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{user.profile.fullName}</h2>
                  <Badge variant={user.profile.status === "active" ? "success" : "warning"}>
                    {user.profile.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user.profile.email}</p>
                <p className="text-sm text-muted-foreground">
                  Last active {formatDateTime(user.profile.lastActiveAt)}
                </p>
              </div>
            </div>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={form.handleSubmit(async (values) => {
                await updateUserProfile(userId, values);
                toast.success("Profile details saved.");
              })}
            >
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" {...form.register("fullName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...form.register("country")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit">
                  <Save className="h-4 w-4" />
                  Save profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="financials">
        <TabsList>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="history">Monthly history</TabsTrigger>
        </TabsList>
        <TabsContent value="financials">
          <Card>
            <CardHeader>
              <CardTitle>Current financial items</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {financialRows.length === 0 ? (
                <div className="md:col-span-2">
                  <EmptyState
                    title="No financial items to edit"
                    description="Create global financial item documents first. They will then appear here for per-user overrides."
                  />
                </div>
              ) : (
                <>
                  {financialRows.map((row, index) => (
                    <div
                      key={row.key}
                      className={`rounded-2xl border border-border/60 p-4 transition ${
                        row.enabled ? "bg-transparent" : "bg-white/[0.02] opacity-75"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-xs text-muted-foreground">{row.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
                            <span className="text-xs text-muted-foreground">Enabled</span>
                            <Switch
                              checked={row.enabled}
                              onCheckedChange={(checked) => {
                                const nextRows = financialRows.map((entry) =>
                                  entry.key === row.key ? { ...entry, enabled: checked } : entry,
                                );

                                setFinancialRows(nextRows);
                                void persistFinancialRows(
                                  nextRows.map((entry) => ({
                                    key: entry.key,
                                    value: entry.value,
                                    enabled: entry.enabled,
                                  })),
                                  `${row.title} ${checked ? "enabled" : "disabled"}.`,
                                );
                              }}
                            />
                          </div>
                          <Badge variant={row.enabled ? "success" : "warning"}>
                            {row.enabled ? "active" : "disabled"}
                          </Badge>
                          <Badge variant="secondary">#{index + 1}</Badge>
                        </div>
                      </div>
                      <Input
                        type="number"
                        disabled={!row.enabled}
                        value={row.value}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setFinancialRows((current) =>
                            current.map((entry) =>
                              entry.key === row.key ? { ...entry, value: nextValue } : entry,
                            ),
                          );
                        }}
                      />
                    </div>
                  ))}
                  <div className="md:col-span-2">
                    <Button
                      disabled={savingOverrides}
                      onClick={async () => {
                        await persistFinancialRows(
                          financialRows.map((row) => ({
                            key: row.key,
                            value: row.value,
                            enabled: row.enabled,
                          })),
                          "User financial overrides updated.",
                        );
                      }}
                    >
                      Save overrides
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Read-only snapshot history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.monthlyHistory.length === 0 ? (
                <EmptyState
                  title="No monthly history yet"
                  description="Snapshots become visible here after you store them from the history page."
                />
              ) : (
                user.monthlyHistory.map((snapshot) => (
                  <div key={snapshot.id} className="rounded-2xl border border-border/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{snapshot.label}</p>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDateTime(snapshot.createdAt)}
                        </p>
                      </div>
                      <Badge variant="outline">{snapshot.items.length} items</Badge>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {snapshot.items.map((item) => (
                        <div key={item.key} className="rounded-xl bg-white/[0.03] p-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {item.key}
                          </p>
                          <p className="mt-2 font-semibold">{formatCurrency(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
