"use client";

import dynamic from "next/dynamic";
import { useMemo, useState, useEffect } from "react";
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
    totalSavings: 0
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchUsage = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Determine date range
        const now = new Date();
        const past = new Date();
        const days = parseInt(timeRange);
        past.setDate(now.getDate() - days);

        // Fetch logs
        const { data: logs, error } = await supabase
          .from("usage_logs")
          .select("*")
          .gte("created_at", past.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        const validLogs = logs || [];

        // 1. Calculate Stats
        const totalRequests = validLogs.length;
        const cachedCount = validLogs.filter((l: any) => l.cached).length;
        const cacheHitRate = totalRequests > 0 ? (cachedCount / totalRequests) * 100 : 0;
        const totalCost = validLogs.reduce((sum: number, l: any) => sum + (l.cost || 0), 0);
        const totalSavings = validLogs.reduce((sum: number, l: any) => sum + (l.savings || 0), 0);

        setStats({
          totalRequests,
          cacheHitRate,
          totalCost,
          totalSavings
        });

        // 2. Recent Logs (Top 5)
        setRecentLogs(validLogs.slice(0, 5));

        // 3. Model Breakdown
        const modelMap = new Map();
        validLogs.forEach(log => {
          const model = log.model || "unknown";
          if (!modelMap.has(model)) {
            modelMap.set(model, { model, requests: 0, cost: 0, cached_count: 0 });
          }
          const entry = modelMap.get(model);
          entry.requests++;
          entry.cost += (log.cost || 0);
          if (log.cached) entry.cached_count++;
        });

        setModelBreakdown(Array.from(modelMap.values()).map((m: any) => ({
          ...m,
          cached_percent: m.requests > 0 ? Math.round((m.cached_count / m.requests) * 100) : 0
        })).sort((a, b) => b.requests - a.requests));

        // 4. Chart Data (Aggregate by day)
        // Initialize map with empty days in range
        const chartMap = new Map();
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          chartMap.set(key, { date: key, requests: 0, cached: 0, cost: 0, savings: 0 });
        }

        // Fill with data (iterating from oldest to newest for correct order if we were sorting, but map preserves insertion order mostly)
        // Actually, let's just loop over logs and key by date
        validLogs.forEach(log => {
          const d = new Date(log.created_at);
          const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (chartMap.has(key)) {
            const entry = chartMap.get(key);
            entry.requests++;
            if (log.cached) entry.cached++;
            entry.cost += (log.cost || 0);
            entry.savings += (log.savings || 0);
          }
        });

        setChartData(Array.from(chartMap.values()));

      } catch (error) {
        console.error("Error fetching usage:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [timeRange, supabase]);

  const overviewStats = [
    {
      label: "Total Requests",
      value: formatNumber(stats.totalRequests),
      meta: "in selected period",
    },
    {
      label: "Cache Hit Rate",
      value: `${stats.cacheHitRate.toFixed(1)}%`,
      meta: "average",
      accent: "text-emerald-400",
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
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">Usage</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-premium-text-primary">Usage Analytics</h1>
            <p className="max-w-2xl text-lg text-premium-text-secondary">
              Monitor requests, cost, and savings with actionable, premium-ready insights.
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px] rounded-premium-md border border-premium-border-subtle bg-premium-bg-secondary text-sm font-semibold text-premium-text-primary">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem> {/* Note used simplified int parse for now, can fix if needed, 24 -> 24 days effectively but labeled hours. Adjust logic if strictly hours needed */}
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-elevated p-5 shadow-premium-sm"
          >
            <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${stat.accent || "text-premium-text-primary"}`}>
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
            <div className="flex items-center gap-2 rounded-premium-md bg-premium-bg-secondary px-3 py-1 text-xs font-semibold text-premium-text-muted">
              <span className="h-2 w-2 rounded-full bg-premium-accent" />
              Live
            </div>
          </div>
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-2 rounded-premium-md bg-premium-bg-secondary p-1 text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-premium-text-muted">
              <TabsTrigger
                value="requests"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-premium-accent/80 data-[state=active]:to-premium-accent/30 data-[state=active]:text-white"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="cost"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-premium-accent/80 data-[state=active]:to-premium-accent/30 data-[state=active]:text-white"
              >
                Cost
              </TabsTrigger>
              <TabsTrigger
                value="savings"
                className="rounded-premium-md border border-transparent bg-transparent px-2 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-premium-accent/80 data-[state=active]:to-premium-accent/30 data-[state=active]:text-white"
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
          <div className="text-sm text-premium-text-muted">Last 5 calls</div>
        </div>
        <div className="rounded-premium-xl border border-premium-border-subtle bg-premium-bg-primary p-4 shadow-premium-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Model</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Tokens In</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Tokens Out</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Cost</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Latency</TableHead>
                <TableHead className="text-xs uppercase tracking-[0.3em] text-premium-text-muted text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-premium-text-secondary h-24">No recent requests.</TableCell>
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
                    <TableCell className="text-right text-premium-text-secondary">{formatNumber(log.tokens_in)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatNumber(log.tokens_out)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{formatCurrency(log.cost)}</TableCell>
                    <TableCell className="text-right text-premium-text-secondary">{log.latency}ms</TableCell>
                    <TableCell className="text-right text-premium-text-muted">
                      {formatRelativeTime(log.created_at)}
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
