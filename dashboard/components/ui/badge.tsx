"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/[0.08] bg-white/[0.06] text-white/70",
        secondary: "border-white/[0.06] bg-white/[0.04] text-white/50",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400/90",
        outline: "border-white/[0.1] text-white/60",
        success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400/90",
        warning: "border-amber-500/20 bg-amber-500/10 text-amber-400/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
