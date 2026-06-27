import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FinancialCard({
  title,
  value,
  description,
  change,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  change: string;
  trend: "up" | "down" | "neutral";
}) {
  const Icon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const variant = trend === "up" ? "success" : trend === "down" ? "warning" : "secondary";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <CardTitle className="mt-2 text-3xl font-semibold">{value}</CardTitle>
        </div>
        <Badge variant={variant} className="gap-1">
          <Icon className="h-3.5 w-3.5" />
          {change}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
