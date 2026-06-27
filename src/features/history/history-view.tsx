"use client";

import { CalendarDays, DatabaseZap, FileDown, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { getUsers, storeMonthlySnapshotsForAllUsers } from "@/services/supabase/database-service";
import { useAppStore } from "@/store/app-store";
import type { ManagedUser } from "@/types";

export function HistoryView() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [storingData, setStoringData] = useState(false);
  const { historyFilters, setHistoryFilters } = useAppStore();

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  const rows = useMemo(() => {
    return users.flatMap((user) =>
      user.monthlyHistory.map((record) => ({
        ...record,
        userName: user.profile.fullName,
        userId: user.profile.uid,
      })),
    );
  }, [users]);

  const filteredRows = rows.filter((row) => {
    const monthMatch = historyFilters.month === "all" || row.month === historyFilters.month;
    const yearMatch =
      historyFilters.year === "all" || String(row.year) === String(historyFilters.year);
    const userMatch = historyFilters.userId === "all" || row.userId === historyFilters.userId;
    return monthMatch && yearMatch && userMatch;
  });

  const months = Array.from(new Set(rows.map((row) => row.month))).sort();
  const years = Array.from(new Set(rows.map((row) => String(row.year)))).sort();

  async function handleStoreData() {
    setStoringData(true);

    try {
      const result = await storeMonthlySnapshotsForAllUsers();
      setUsers(await getUsers());

      if (result.storedCount === 0) {
        toast.error("No user current data was available to store.");
        return;
      }

      const userLabel = result.storedCount === 1 ? "user" : "users";
      const skippedMessage =
        result.skippedCount > 0 ? ` ${result.skippedCount} users had no current data.` : "";
      toast.success(`${result.label} stored for ${result.storedCount} ${userLabel}.${skippedMessage}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to store user data.");
    } finally {
      setStoringData(false);
    }
  }

  function handleSavePdf() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly history"
        description="Store monthly financial data for every user and review historical financial states."
        actions={
          <>
            <Button disabled={users.length === 0 || storingData} onClick={() => void handleStoreData()}>
              {storingData ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <DatabaseZap className="h-4 w-4" />
              )}
              Store Data
            </Button>
            <Button variant="outline" disabled={filteredRows.length === 0} onClick={handleSavePdf}>
              <FileDown className="h-4 w-4" />
              Save PDF
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-4 p-5 md:grid-cols-3">
          <Select value={historyFilters.userId} onValueChange={(value) => setHistoryFilters({ userId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.profile.uid} value={user.profile.uid}>
                  {user.profile.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={historyFilters.month} onValueChange={(value) => setHistoryFilters({ month: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={historyFilters.year} onValueChange={(value) => setHistoryFilters({ year: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {filteredRows.length === 0 ? (
        <EmptyState
          title="No snapshots match these filters"
          description="Try a broader filter combination or store the current month for all users."
        />
      ) : (
        <div className="grid gap-4">
          {filteredRows.map((row) => (
            <Card key={`${row.userId}-${row.id}`}>
              <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle>{row.userName}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.label} - Created {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">
                  <CalendarDays className="mr-1 h-3.5 w-3.5" />
                  {row.items.length} records
                </Badge>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-4">
                {row.items.map((item) => (
                  <div key={item.key} className="rounded-xl border border-border/60 bg-white/[0.03] p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      {item.key}
                    </p>
                    <p className="mt-2 font-semibold">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
