import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Inbox className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </CardContent>
    </Card>
  );
}
