import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        // Primary Button: gradient background with glow
        default: 
          "bg-gradient-to-br from-accent-primary to-accent-primary-hover text-white rounded-sm shadow-subtle hover:shadow-glow-primary hover:scale-[1.02] hover:brightness-110",
        // Secondary Button: bordered with hover fill
        secondary: 
          "border border-border-default bg-transparent text-text-primary rounded-sm hover:border-accent-primary hover:bg-accent-primary/10",
        // Ghost Button: transparent with subtle hover
        ghost: 
          "bg-transparent text-text-secondary rounded-sm hover:bg-white/5 hover:text-text-primary",
        // Outline variant
        outline: 
          "border border-border-default bg-transparent text-text-primary rounded-sm hover:bg-bg-elevated hover:border-border-hover",
        // Destructive
        destructive: 
          "bg-accent-error text-white rounded-sm shadow-subtle hover:bg-accent-error/90",
        // Link
        link: 
          "text-accent-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-3 text-sm",
        sm: "h-8 px-4 py-2 text-xs rounded-xs",
        lg: "h-12 px-8 py-4 text-base rounded-md",
        icon: "h-8 w-8 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
