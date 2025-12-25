"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Key, BarChart, MoreVertical, Settings, Zap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber, formatCompactNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  api_keys_count: number;
  requests_this_month: number;
  requests_limit: number;
  cache_hit_rate: number;
}

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const usagePercentage = (project.requests_this_month / project.requests_limit) * 100;
  const isHighUsage = usagePercentage > 80;
  const isHighCacheRate = project.cache_hit_rate > 60;

  return (
    <div className="group relative bg-[hsl(220_13%_10%)] border border-white/[0.06] rounded-xl transition-all duration-100 hover:-translate-y-0.5 hover:border-white/[0.1]">
      {/* Gradient border on hover - subtle */}
      <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-white/[0.08] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none" />

      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <FolderOpen className="h-4 w-4 text-white/60" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="group/name">
                <h3 className="text-sm font-medium text-white/90 transition-colors duration-100 truncate cursor-default">
                  {project.name}
                </h3>
              </div>
              <p className="text-xs text-white/40 truncate font-mono">{project.slug}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/[0.04] transition-colors duration-100"
              >
                <MoreVertical className="h-4 w-4 text-white/40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44 bg-[hsl(220_13%_12%)] border-white/[0.08] shadow-xl"
              sideOffset={4}
            >
              <DropdownMenuItem asChild className="text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-100">
                <Link href={`/dashboard/api-keys?project=${project.id}`}>
                  <Key className="h-3.5 w-3.5 mr-2 opacity-60" />
                  API Keys
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors duration-100">
                <Link href={`/dashboard/usage?project=${project.id}`}>
                  <BarChart className="h-3.5 w-3.5 mr-2 opacity-60" />
                  Usage
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors duration-100"
                  onClick={() => onDelete(project.id)}
                >
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats - inline */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Key className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/60">{project.api_keys_count} keys</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart className="h-3.5 w-3.5 text-white/30" />
            <span className="text-white/60">{formatCompactNumber(project.requests_this_month)} req</span>
          </div>
        </div>

        {/* Cache Hit Rate - compact */}
        <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Zap className={cn(
              "h-3.5 w-3.5",
              isHighCacheRate ? "text-emerald-400/70" : "text-amber-400/70"
            )} />
            <span className="text-xs text-white/50">Cache hit rate</span>
          </div>
          <span className={cn(
            "text-sm font-medium tabular-nums",
            isHighCacheRate ? "text-emerald-400/90" : "text-amber-400/90"
          )}>
            {project.cache_hit_rate.toFixed(1)}%
          </span>
        </div>

        {/* Usage Progress - minimal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40">Usage</span>
            <span className="text-xs text-white/50 font-mono tabular-nums">
              {formatCompactNumber(project.requests_this_month)}/{formatCompactNumber(project.requests_limit)}
            </span>
          </div>

          <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isHighUsage ? "bg-amber-500/70" : "bg-white/20"
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {isHighUsage && (
            <p className="text-[11px] text-amber-400/70">
              Approaching limit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
