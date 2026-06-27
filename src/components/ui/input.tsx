import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-background/70 px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
