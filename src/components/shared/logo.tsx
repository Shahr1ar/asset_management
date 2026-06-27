import { Landmark } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Landmark className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>
        <p className="text-xs text-muted-foreground">Fintech operations control room</p>
      </div>
    </div>
  );
}
