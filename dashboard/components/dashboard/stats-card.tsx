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
        "group relative overflow-hidden",
        "bg-premium-bg-elevated border border-premium-border-subtle rounded-premium-lg",
        "shadow-premium-sm hover:shadow-premium-md",
        "transition-all duration-base hover:-translate-y-1",
        "p-6",
        className
      )}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-premium-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base pointer-events-none" />
      
      {/* Content */}
      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-premium-text-muted uppercase tracking-wide">
            {title}
          </p>
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-premium-md",
            "bg-premium-bg-elevated-hover border border-premium-border-subtle",
            "group-hover:border-premium-accent/30 transition-colors duration-base"
          )}>
            <Icon className="h-5 w-5 text-premium-accent" />
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <p className="text-3xl font-bold text-premium-text-primary tracking-tight">
            {value}
          </p>
          
          {/* Description & Trend */}
          {(description || trend) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-premium-sm font-medium",
                    trend.isPositive
                      ? "bg-premium-success/10 text-premium-success"
                      : "bg-premium-danger/10 text-premium-danger"
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
                </div>
              )}
              {description && (
                <p className="text-premium-text-secondary">{description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-premium-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
    </div>
  );
}
