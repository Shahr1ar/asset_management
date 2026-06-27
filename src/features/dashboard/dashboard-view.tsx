"use client";

import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { FinancialCard } from "@/components/shared/financial-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { getDashboardOverview } from "@/services/supabase/database-service";
import type { DashboardOverview } from "@/types";

const CHART_COLORS = ["#F29F67", "#3B8FF3", "#34B1AA", "#E0B50F"];

function AllocationChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#0b0f19",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
            }}
            formatter={(value: any) => [formatCurrency(Number(value)), "Value"]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardView() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    getDashboardOverview().then(setOverview);
  }, []);

  if (!overview) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investment admin dashboard"
        description="Monitor user balances, override activity, monthly snapshot cadence, and the health of your wallet portfolio in one place."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {overview.metrics.map((metric) => (
          <FinancialCard
            key={metric.label}
            title={metric.label}
            value={metric.value}
            change={metric.change}
            trend={metric.trend}
            description={metric.description}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent updates */}
        <Card id="analytics" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.recentUpdates.length === 0 ? (
              <EmptyState
                title="No recent updates"
                description="User updates and monthly snapshots will appear here once they exist in Firestore."
              />
            ) : null}
            {overview.recentUpdates.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{activity.title}</p>
                    <Badge variant="secondary">{activity.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatDateTime(activity.timestamp)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Portfolio allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio allocation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            {overview.allocation.length === 0 ? (
              <EmptyState
                title="No allocation data"
                description="No financial metrics are active across users yet."
              />
            ) : (
              <AllocationChart data={overview.allocation} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
