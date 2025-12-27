"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs px-2 py-0.5 text-xs font-medium uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default: 
          "bg-bg-elevated text-text-secondary border border-border-subtle",
        secondary:
          "bg-bg-elevated/50 text-text-muted border border-border-subtle",
        primary: 
          "bg-accent-primary/10 text-accent-primary border border-accent-primary/20",
        success: 
          "bg-accent-success/10 text-accent-success border border-accent-success/20",
        warning: 
          "bg-accent-warning/10 text-accent-warning border border-accent-warning/20",
        error: 
          "bg-accent-error/10 text-accent-error border border-accent-error/20",
        destructive:
          "bg-accent-error/10 text-accent-error border border-accent-error/20",
        outline: 
          "border border-border-default text-text-secondary bg-transparent",
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
