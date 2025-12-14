"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border border-white/[0.06] bg-premium-bg-elevated/60 p-5",
        "transition-all duration-200 hover:-translate-y-0.5",
        className
      )}
    >
      {/* Gradient border on hover */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Inner highlight */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] pointer-events-none" />
      
      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-premium-text-muted">
            {title}
          </p>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <Icon className="h-4 w-4 text-premium-accent" />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums text-premium-text-primary">
            {value}
          </p>
          
          {/* Description & Trend */}
          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && (
                <span
                  className={cn(
                    "flex items-center gap-1 font-medium",
                    trend.isPositive
                      ? "text-emerald-500"
                      : "text-red-500"
                  )}
                >
                  {trend.isPositive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {trend.isPositive ? "+" : ""}
                    {trend.value}%
                  </span>
                </span>
              )}
              {description && (
                <p className="text-premium-text-muted">{description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
