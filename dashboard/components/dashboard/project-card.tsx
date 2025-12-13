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
    <div className="group relative overflow-hidden bg-premium-bg-elevated border border-premium-border-subtle rounded-premium-lg shadow-premium-sm hover:shadow-premium-md transition-all duration-base hover:-translate-y-1">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-premium-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base pointer-events-none" />
      
      {/* Content */}
      <div className="relative p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Project icon */}
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-premium-md border transition-all duration-base",
              "bg-premium-bg-elevated-hover border-premium-border-subtle",
              "group-hover:border-premium-accent/30 group-hover:bg-premium-accent/10"
            )}>
              <FolderOpen className="h-5 w-5 text-premium-accent" />
            </div>
            
            {/* Project info */}
            <div className="flex-1 min-w-0">
              <Link href={`/dashboard/projects/${project.id}`}>
                <h3 className="text-base font-semibold text-premium-text-primary group-hover:text-premium-accent transition-colors duration-base truncate cursor-pointer">
                  {project.name}
                </h3>
              </Link>
              <p className="text-xs text-premium-text-muted truncate">{project.slug}</p>
            </div>
          </div>
          
          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 hover:bg-premium-bg-elevated-hover"
              >
                <MoreVertical className="h-4 w-4 text-premium-text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}`} className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/keys`} className="cursor-pointer">
                  <Key className="h-4 w-4 mr-2" />
                  API Keys
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/usage`} className="cursor-pointer">
                  <BarChart className="h-4 w-4 mr-2" />
                  Usage
                </Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-premium-danger cursor-pointer"
                  onClick={() => onDelete(project.id)}
                >
                  Delete Project
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-premium-md bg-premium-bg-primary border border-premium-border-subtle">
            <Key className="h-4 w-4 text-premium-text-muted" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-premium-text-primary">{project.api_keys_count}</span>
              <span className="text-xs text-premium-text-muted">API Keys</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 rounded-premium-md bg-premium-bg-primary border border-premium-border-subtle">
            <BarChart className="h-4 w-4 text-premium-text-muted" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-premium-text-primary">
                {formatCompactNumber(project.requests_this_month)}
              </span>
              <span className="text-xs text-premium-text-muted">Requests</span>
            </div>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-premium-success" />
              <span className="text-sm font-medium text-premium-text-secondary">Cache Hit Rate</span>
            </div>
            <Badge
              className={cn(
                "text-xs font-semibold",
                isHighCacheRate
                  ? "bg-premium-success/10 text-premium-success border-premium-success/20"
                  : "bg-premium-warning/10 text-premium-warning border-premium-warning/20"
              )}
            >
              {project.cache_hit_rate.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-premium-text-secondary">Monthly Usage</span>
            <span className="text-premium-text-muted font-mono">
              {formatNumber(project.requests_this_month)} / {formatCompactNumber(project.requests_limit)}
            </span>
          </div>
          
          {/* Custom progress bar */}
          <div className="relative h-2 rounded-full bg-premium-bg-primary border border-premium-border-subtle overflow-hidden">
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all duration-slow",
                isHighUsage
                  ? "bg-gradient-to-r from-premium-warning to-premium-danger"
                  : "bg-gradient-to-r from-premium-accent to-premium-success"
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
            {/* Glow effect */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full blur-sm transition-all duration-slow",
                isHighUsage ? "bg-premium-warning/30" : "bg-premium-accent/30"
              )}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          
          {isHighUsage && (
            <p className="text-xs text-premium-warning flex items-center gap-1">
              <span>⚠️</span>
              <span>Approaching usage limit</span>
            </p>
          )}
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-premium-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base" />
    </div>
  );
}
