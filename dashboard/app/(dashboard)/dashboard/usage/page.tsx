"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatRelativeTime } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const LazyUsageChart = dynamic(() => import("@/components/dashboard/usage-chart").then(mod => mod.UsageChart), {
  ssr: false,
  loading: () => (
    <Card>
      <CardHeader>
        <CardTitle>Loading chart...</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] animate-pulse rounded-md bg-muted" />
      </CardContent>
    </Card>
  ),
});

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [modelBreakdown, setModelBreakdown] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHitRate: 0,
    totalCost: 0,
    totalSavings: 0,
    cacheAccuracy: 100,
    avgCacheSimilarity: 0,
  });
  const [flaggingId, setFlaggingId] = useState<string | null>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const past = new Date();
      const days = parseInt(timeRange);
      past.setDate(now.getDate() - days);

      const { data: logs, error } = await supabase
        .from("usage_logs")
        .select("*")
        .gte("created_at", past.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const validLogs = logs || [];
      const cachedLogs = validLogs.filter((l: any) => l.cached);
      const semanticCachedLogs = cachedLogs.filter((l: any) => l.cache_decision === "semantic");
      const totalRequests = validLogs.length;
      const cachedCount = cachedLogs.length;
      const incorrectCached = cachedLogs.filter((l: any) => l.cache_flagged_incorrect).length;
      const cacheHitRate = totalRequests > 0 ? (cachedCount / totalRequests) * 100 : 0;
      const cacheAccuracy = cachedCount > 0 ? ((cachedCount - incorrectCached) / cachedCount) * 100 : 100;
      const avgCacheSimilarity = semanticCachedLogs.length > 0
        ? (semanticCachedLogs.reduce((sum: number, l: any) => sum + (Number(l.cache_similarity) || 0), 0) / semanticCachedLogs.length) * 100
        : 0;
      const totalCost = validLogs.reduce((sum: number, l: any) => sum + (Number(l.cost_usd) || 0), 0);
      const totalSavings = validLogs.reduce((sum: number, l: any) => {
        const savings = (Number(l.potential_cost_usd) || 0) - (Number(l.cost_usd) || 0);
        return sum + (savings > 0 ? savings : 0);
      }, 0);

      setStats({
        totalRequests,
        cacheHitRate,
        totalCost,
        totalSavings,
        cacheAccuracy,
        avgCacheSimilarity,
      });

      setRecentLogs(validLogs.slice(0, 5));

      const modelMap = new Map();
      validLogs.forEach(log => {
        const model = log.model || "unknown";
        if (!modelMap.has(model)) {
          modelMap.set(model, { model, requests: 0, cost: 0, cached_count: 0 });
        }
        const entry = modelMap.get(model);
        entry.requests++;
        entry.cost += (Number(log.cost_usd) || 0);
        if (log.cached) entry.cached_count++;
      });

      setModelBreakdown(Array.from(modelMap.values()).map((m: any) => ({
        ...m,
        cached_percent: m.requests > 0 ? Math.round((m.cached_count / m.requests) * 100) : 0
      })).sort((a, b) => b.requests - a.requests));

      const chartMap = new Map();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        chartMap.set(key, { date: key, requests: 0, cached: 0, cost: 0, savings: 0 });
      }

      validLogs.forEach(log => {
        const d = new Date(log.created_at);
        const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (chartMap.has(key)) {
          const entry = chartMap.get(key);
          entry.requests++;
          if (log.cached) entry.cached++;

          const cost = Number(log.cost_usd) || 0;
          const potentialCost = Number(log.potential_cost_usd) || 0;
          const savings = potentialCost - cost;

          entry.cost += cost;
          entry.savings += (savings > 0 ? savings : 0);
        }
      });

      setChartData(Array.from(chartMap.values()));

    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, timeRange]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const handleFlagCached = useCallback(async (log: any) => {
    setFlaggingId(log.id);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("usage_logs")
        .update({
          cache_flagged_incorrect: true,
          cache_reviewed_at: now,
        })
        .eq("id", log.id);

      if (error) throw error;

      const similarityScore = Number(log.cache_similarity || 0);
      const { data: projectRow, error: projectError } = await supabase
        .from("projects")
        .select("semantic_cache_threshold")
        .eq("id", log.project_id)
        .single();

      if (projectError) throw projectError;

      const currentThreshold = Number(projectRow?.semantic_cache_threshold ?? 0.95);
      const suggestedThreshold = Math.min(0.99, Math.max(currentThreshold, similarityScore > 0 ? similarityScore + 0.02 : currentThreshold + 0.02));

      if (suggestedThreshold > currentThreshold) {
        await supabase
          .from("projects")
          .update({ semantic_cache_threshold: suggestedThreshold })
          .eq("id", log.project_id);
      }

      await fetchUsage();

      toast({
        title: "Flag submitted",
        description: suggestedThreshold > currentThreshold
          ? `Threshold auto-tuned to ${(suggestedThreshold * 100).toFixed(0)}% based on feedback.`
          : "Cached response flagged for manual review.",
      });
    } catch (err: any) {
      toast({
        title: "Could not flag response",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFlaggingId(null);
    }
  }, [fetchUsage, supabase, toast]);

  const overviewStats = [
    {
      label: "Total Requests",
      value: formatNumber(stats.totalRequests),
      meta: "in selected period",
    },
    {
      label: "Cache Accuracy",
      value: `${stats.cacheAccuracy.toFixed(1)}%`,
      meta: "Flagged false positives vs cached",
      accent: stats.cacheAccuracy < 90 ? "text-yellow-300" : "text-white/90",
    },
    {
      label: "Cache Miss Rate",
      value: `${(100 - stats.cacheHitRate).toFixed(1)}%`,
      meta: "requests costing you money",
      accent: stats.cacheHitRate < 50 ? "text-red-400" : "text-white/90",
    },
    {
      label: "Total Cost",
      value: formatCurrency(stats.totalCost),
      meta: `vs ${formatCurrency(stats.totalCost + stats.totalSavings)} without caching`,
    },
    {
      label: "Total Savings",
      value: formatCurrency(stats.totalSavings),
      meta: "cost reduction",
      accent: "text-emerald-400",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-10 p-8">
        <div className="h-96 rounded-xl bg-white/5 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-white/40">Usage</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white/90">Usage Analytics</h1>
            <p className="max-w-2xl text-lg text-white/60">
              Track every dollar. See what&apos;s cached, what&apos;s not, and where you&apos;re bleeding money.
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-white/90">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/5 p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${stat.accent || "text-white/90"}`}>
              {stat.value}
            </p>
            <p className="text-xs text-premium-text-secondary">{stat.meta}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-6 shadow-premium-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Traffic</p>
              <h2 className="text-lg font-semibold text-premium-text-primary">Trends</h2>
            </div>
            <div className="flex items-center gap-2 rounded-premium-md bg-premium-bg-elevated border border-premium-border-subtle px-3 py-1 text-xs font-semibold text-premium-text-muted">
              <span className="h-2 w-2 rounded-full bg-premium-accent" />
              Live
            </div>
          </div>
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-2 rounded-premium-md bg-premium-bg-primary border border-premium-border-subtle p-1 text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-premium-text-muted">
              <TabsTrigger
                value="requests"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="cost"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-premium-bg-primary data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
              >
                Cost
              </TabsTrigger>
              <TabsTrigger
                value="savings"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-premium-bg-primary data-[state=active]:text-premium-text-primary data-[state=active]:shadow-glow-accent"
              >
                Savings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="requests">
              <LazyUsageChart data={chartData} type="requests" />
            </TabsContent>
            <TabsContent value="cost">
              <LazyUsageChart data={chartData} type="cost" />
            </TabsContent>
            <TabsContent value="savings">
              <LazyUsageChart data={chartData} type="savings" />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Model Breakdown</p>
            <h2 className="text-lg font-semibold text-premium-text-primary">Usage by model</h2>
          </div>
        </div>
        <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-4 shadow-premium-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Model</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Requests</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Cost</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Cache Hit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-premium-text-secondary h-24">No usage data found for this period.</TableCell>
                </TableRow>
              ) : (
                modelBreakdown.map((row: any) => (
                  <TableRow key={row.model} className="border-b border-premium-border-subtle last:border-0">
                    <TableCell className="font-medium text-premium-text-primary">{row.model}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatNumber(row.requests)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatCurrency(row.cost)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={row.cached_percent > 60 ? "success" : "secondary"}>
                        {row.cached_percent}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Recent Activity</p>
            <h2 className="text-lg font-semibold text-premium-text-primary">Recent requests</h2>
          </div>
          <div className="text-sm text-premium-text-muted flex flex-col items-end">
            <span>Last 5 calls</span>
            <span className="text-xs">Avg cached similarity {stats.avgCacheSimilarity.toFixed(1)}%</span>
          </div>
        </div>
        <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-4 shadow-premium-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Model</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Similarity</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Tokens In</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Tokens Out</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Cost</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Latency</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Time</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-premium-text-secondary h-24">No recent requests.</TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log: any) => (
                  <TableRow key={log.id} className="border-b border-premium-border-subtle last:border-0">
                    <TableCell className="font-medium text-premium-text-primary">{log.model}</TableCell>
                    <TableCell>
                      <Badge variant={log.cached ? "success" : "secondary"}>
                        {log.cached ? "Cached" : "API"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-premium-text-secondary">
                      {log.cached && log.cache_decision === "semantic" && log.cache_similarity
                        ? `${(Number(log.cache_similarity) * 100).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatNumber(log.tokens_input)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatNumber(log.tokens_output)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatCurrency(log.cost_usd)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{log.latency_ms}ms</TableCell>
                    <TableCell className="text-right text-premium-text-muted">
                      {formatRelativeTime(log.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.cached && log.cache_decision === "semantic" ? (
                        log.cache_flagged_incorrect ? (
                          <Badge variant="destructive">Flagged</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFlagCached(log)}
                            disabled={flaggingId === log.id}
                            className="text-xs"
                          >
                            {flaggingId === log.id ? "Submitting..." : "Manual review"}
                          </Button>
                        )
                      ) : (
                        <span className="text-xs text-premium-text-muted">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
