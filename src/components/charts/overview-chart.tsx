"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/formatters";
import type { DashboardSeriesPoint } from "@/types";

export function OverviewChart({ data }: { data: DashboardSeriesPoint[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Monthly overview</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(148, 163, 184, 0.18)" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={formatCompactNumber} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#020817",
                border: "1px solid rgba(148, 163, 184, 0.14)",
                borderRadius: 16,
              }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#38bdf8"
              fillOpacity={1}
              fill="url(#balanceGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
