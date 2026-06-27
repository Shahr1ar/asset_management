"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#38bdf8", "#14b8a6", "#22c55e", "#f59e0b", "#8b5cf6"];

export function AllocationChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Allocation mix</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={65}
              outerRadius={105}
              paddingAngle={3}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#020817",
                border: "1px solid rgba(148, 163, 184, 0.14)",
                borderRadius: 16,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
