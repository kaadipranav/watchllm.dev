"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, Key, BarChart, MoreVertical, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatNumber, formatCompactNumber } from "@/lib/utils";

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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Link href={`/dashboard/projects/${project.id}`}>
              <CardTitle className="text-lg hover:underline cursor-pointer">
                {project.name}
              </CardTitle>
            </Link>
            <p className="text-sm text-muted-foreground">{project.slug}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/projects/${project.id}`}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/projects/${project.id}/keys`}>
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/projects/${project.id}/usage`}>
                <BarChart className="h-4 w-4 mr-2" />
                Usage
              </Link>
            </DropdownMenuItem>
            {onDelete && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(project.id)}
              >
                Delete Project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{project.api_keys_count}</span>{" "}
              <span className="text-muted-foreground">API Keys</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">
                {formatCompactNumber(project.requests_this_month)}
              </span>{" "}
              <span className="text-muted-foreground">Requests</span>
            </span>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Cache Hit Rate</span>
            <Badge variant={project.cache_hit_rate > 50 ? "success" : "secondary"}>
              {project.cache_hit_rate.toFixed(1)}%
            </Badge>
          </div>
        </div>

        {/* Usage Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Monthly Usage</span>
            <span className="text-sm">
              {formatNumber(project.requests_this_month)} / {formatCompactNumber(project.requests_limit)}
            </span>
          </div>
          <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
