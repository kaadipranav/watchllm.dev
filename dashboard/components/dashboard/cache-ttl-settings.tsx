"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Timer,
  BarChart2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  updateCacheTTL,
  getCacheTTLSettings,
  invalidateCache,
  getCacheAgeStats,
} from "@/app/actions/cache-ttl";

// TTL presets matching the worker
export const TTL_OPTIONS = [
  { value: "3600", label: "1 hour", seconds: 3600 },
  { value: "21600", label: "6 hours", seconds: 21600 },
  { value: "86400", label: "24 hours", seconds: 86400 },
  { value: "604800", label: "7 days", seconds: 604800 },
  { value: "2592000", label: "30 days", seconds: 2592000 },
  { value: "never", label: "Never expire", seconds: null },
] as const;

interface CacheTTLSettingsProps {
  projectId: string;
  currentTTL: number | null;
  endpointOverrides?: Record<string, number | null>;
  onSettingsChange?: () => void;
}

interface EndpointOverride {
  endpoint: string;
  ttlSeconds: number | null;
}

export function CacheTTLSettings({
  projectId,
  currentTTL,
  endpointOverrides = {},
  onSettingsChange,
}: CacheTTLSettingsProps) {
  const [ttl, setTTL] = useState<string>(
    currentTTL === null ? "never" : currentTTL.toString()
  );
  const [overrides, setOverrides] = useState<EndpointOverride[]>(
    Object.entries(endpointOverrides).map(([endpoint, ttlSeconds]) => ({
      endpoint,
      ttlSeconds,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const newTTLValue = currentTTL === null ? "never" : currentTTL.toString();
    setTTL(newTTLValue);
    setOverrides(
      Object.entries(endpointOverrides).map(([endpoint, ttlSeconds]) => ({
        endpoint,
        ttlSeconds,
      }))
    );
  }, [currentTTL, endpointOverrides]);

  useEffect(() => {
    const originalTTL = currentTTL === null ? "never" : currentTTL.toString();
    const ttlChanged = ttl !== originalTTL;
    
    const originalOverrides = Object.entries(endpointOverrides).map(
      ([endpoint, ttlSeconds]) => ({ endpoint, ttlSeconds })
    );
    const overridesChanged =
      JSON.stringify(overrides) !== JSON.stringify(originalOverrides);
    
    setHasChanges(ttlChanged || overridesChanged);
  }, [ttl, overrides, currentTTL, endpointOverrides]);

  const getTTLLabel = (seconds: number | null): string => {
    const option = TTL_OPTIONS.find(
      (o) => (o.seconds === null && seconds === null) || o.seconds === seconds
    );
    return option?.label || `${seconds} seconds`;
  };

  const getTTLExplanation = (
    seconds: number | null
  ): { text: string; type: "warning" | "info" | "success" } => {
    if (seconds === null) {
      return {
        text: "Cache entries will never expire automatically. Use manual invalidation when needed.",
        type: "warning",
      };
    }
    if (seconds <= 3600) {
      return {
        text: "Very short TTL. Cache refreshes frequently, but may increase costs.",
        type: "info",
      };
    }
    if (seconds <= 86400) {
      return {
        text: "Balanced TTL. Good for most use cases with moderate data freshness needs.",
        type: "success",
      };
    }
    if (seconds <= 604800) {
      return {
        text: "Long TTL. Best for static data or when cost savings are prioritized.",
        type: "success",
      };
    }
    return {
      text: "Very long TTL. Excellent cost savings but cache may become stale.",
      type: "warning",
    };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const ttlSeconds = ttl === "never" ? null : parseInt(ttl, 10);
      const overridesObj = overrides.reduce(
        (acc, { endpoint, ttlSeconds }) => {
          acc[endpoint] = ttlSeconds;
          return acc;
        },
        {} as Record<string, number | null>
      );

      const result = await updateCacheTTL(projectId, ttlSeconds, overridesObj);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "TTL Settings Updated",
        description: `Cache TTL set to ${getTTLLabel(ttlSeconds)}`,
      });

      onSettingsChange?.();
      setHasChanges(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update TTL settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTTL(currentTTL === null ? "never" : currentTTL.toString());
    setOverrides(
      Object.entries(endpointOverrides).map(([endpoint, ttlSeconds]) => ({
        endpoint,
        ttlSeconds,
      }))
    );
    setHasChanges(false);
  };

  const addOverride = () => {
    setOverrides([
      ...overrides,
      { endpoint: "/v1/chat/completions", ttlSeconds: 86400 },
    ]);
  };

  const removeOverride = (index: number) => {
    setOverrides(overrides.filter((_, i) => i !== index));
  };

  const updateOverride = (
    index: number,
    field: "endpoint" | "ttlSeconds",
    value: string | number | null
  ) => {
    const newOverrides = [...overrides];
    if (field === "endpoint") {
      newOverrides[index].endpoint = value as string;
    } else {
      newOverrides[index].ttlSeconds =
        value === "never" ? null : (value as number);
    }
    setOverrides(newOverrides);
  };

  const explanation = getTTLExplanation(
    ttl === "never" ? null : parseInt(ttl, 10)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-500" />
              Cache Expiration (TTL)
            </CardTitle>
            <CardDescription>
              Control how long cached responses remain valid
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default TTL Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Default TTL</Label>
            <Badge variant="outline" className="text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {getTTLLabel(ttl === "never" ? null : parseInt(ttl, 10))}
            </Badge>
          </div>

          <Select value={ttl} onValueChange={setTTL}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select TTL" />
            </SelectTrigger>
            <SelectContent>
              {TTL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Explanation */}
          <div
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg text-sm",
              explanation.type === "warning" &&
                "bg-yellow-50 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
              explanation.type === "info" &&
                "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
              explanation.type === "success" &&
                "bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
            )}
          >
            {explanation.type === "warning" && (
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            {explanation.type === "info" && (
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            {explanation.type === "success" && (
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <span>{explanation.text}</span>
          </div>
        </div>

        {/* Per-Endpoint Overrides */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Endpoint-Specific TTL Overrides
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addOverride}
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Override
            </Button>
          </div>

          {overrides.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No endpoint overrides configured. All endpoints use the default
              TTL.
            </p>
          ) : (
            <div className="space-y-3">
              {overrides.map((override, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <Select
                    value={override.endpoint}
                    onValueChange={(value) =>
                      updateOverride(index, "endpoint", value)
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="/v1/chat/completions">
                        /v1/chat/completions
                      </SelectItem>
                      <SelectItem value="/v1/completions">
                        /v1/completions
                      </SelectItem>
                      <SelectItem value="/v1/embeddings">
                        /v1/embeddings
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      override.ttlSeconds === null
                        ? "never"
                        : override.ttlSeconds.toString()
                    }
                    onValueChange={(value) =>
                      updateOverride(
                        index,
                        "ttlSeconds",
                        value === "never" ? null : parseInt(value, 10)
                      )
                    }
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TTL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOverride(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save/Reset Buttons */}
        {hasChanges && (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Cache Age Analytics Component
// ============================================================================

interface CacheAgeStats {
  total: number;
  under1h: number;
  oneToSixH: number;
  sixTo24H: number;
  oneTo7D: number;
  sevenTo30D: number;
  over30D: number;
  avgAgeHours: number;
  expiredCount: number;
}

interface CacheAgeAnalyticsProps {
  projectId: string;
}

export function CacheAgeAnalytics({ projectId }: CacheAgeAnalyticsProps) {
  const [stats, setStats] = useState<CacheAgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCacheAgeStats(projectId);
      if (result.error) {
        throw new Error(result.error);
      }
      setStats(result.stats || null);
    } catch (err: any) {
      setError(err.message || "Failed to load cache statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p>{error}</p>
            <Button variant="outline" onClick={fetchStats} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-purple-500" />
            Cache Age Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No cache entries yet. Start making requests to see analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPercentage = (value: number) =>
    stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : "0";

  const ageDistribution = [
    { label: "< 1 hour", value: stats.under1h, color: "bg-green-500" },
    { label: "1-6 hours", value: stats.oneToSixH, color: "bg-blue-500" },
    { label: "6-24 hours", value: stats.sixTo24H, color: "bg-yellow-500" },
    { label: "1-7 days", value: stats.oneTo7D, color: "bg-orange-500" },
    { label: "7-30 days", value: stats.sevenTo30D, color: "bg-red-500" },
    { label: "> 30 days", value: stats.over30D, color: "bg-gray-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-500" />
              Cache Age Distribution
            </CardTitle>
            <CardDescription>
              How old are your cached responses?
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">
              {stats.avgAgeHours.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Average Age</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-red-500">
              {stats.expiredCount}
            </div>
            <div className="text-xs text-muted-foreground">Expired</div>
          </div>
        </div>

        {/* Age Distribution Bar */}
        <div className="space-y-2">
          <div className="flex h-4 rounded-full overflow-hidden">
            {ageDistribution.map((bucket, index) => {
              const width = getPercentage(bucket.value);
              if (parseFloat(width) === 0) return null;
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(bucket.color, "transition-all")}
                        style={{ width: `${width}%` }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {bucket.label}: {bucket.value} ({width}%)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {ageDistribution.map((bucket, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", bucket.color)} />
                <span className="text-muted-foreground">
                  {bucket.label}: {bucket.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Cache Invalidation Component
// ============================================================================

interface CacheInvalidationProps {
  projectId: string;
  onInvalidated?: () => void;
}

export function CacheInvalidation({
  projectId,
  onInvalidated,
}: CacheInvalidationProps) {
  const [model, setModel] = useState("");
  const [kind, setKind] = useState<string>("");
  const [invalidating, setInvalidating] = useState(false);
  const { toast } = useToast();

  const handleInvalidate = async (all: boolean = false) => {
    setInvalidating(true);
    try {
      const filters: Record<string, any> = {};
      if (all) {
        filters.all = true;
      } else {
        if (model) filters.model = model;
        if (kind) filters.kind = kind;
      }

      const result = await invalidateCache(projectId, filters);

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Cache Invalidated",
        description: `${result.entriesInvalidated || 0} entries removed`,
      });

      onInvalidated?.();
      setModel("");
      setKind("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invalidate cache",
        variant: "destructive",
      });
    } finally {
      setInvalidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Cache Invalidation
        </CardTitle>
        <CardDescription>
          Manually clear cached responses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Filter by Model (optional)</Label>
            <Input
              placeholder="e.g., gpt-4"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Filter by Type (optional)</Label>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="completion">Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={() => handleInvalidate(false)}
            disabled={invalidating || (!model && !kind)}
          >
            {invalidating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Invalidate Matching
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to clear ALL cache entries? This cannot be undone."
                )
              ) {
                handleInvalidate(true);
              }
            }}
            disabled={invalidating}
            className="text-red-500 hover:text-red-600"
          >
            Clear All Cache
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          Invalidating cache will cause future requests to hit the API,
          potentially increasing costs temporarily.
        </p>
      </CardContent>
    </Card>
  );
}
