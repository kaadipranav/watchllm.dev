import * as React from "react"
import { cn } from "@/lib/utils"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, decorative = true, role, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? "separator" : role ?? "separator"}
      aria-orientation={props['aria-orientation'] ?? "horizontal"}
      className={cn("shrink-0 bg-border", props['aria-orientation'] === "vertical" ? "w-px h-full" : "h-px w-full", className)}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
