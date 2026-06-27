import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-300",
        destructive: "border-transparent bg-rose-500/15 text-rose-300",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
