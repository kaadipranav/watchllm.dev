"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
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

// Mock data
const mockDailyData = [
  { date: "Jan 1", requests: 2500, cached: 1800, cost: 5.0, savings: 3.6 },
  { date: "Jan 2", requests: 3200, cached: 2400, cost: 6.4, savings: 4.8 },
  { date: "Jan 3", requests: 2800, cached: 2000, cost: 5.6, savings: 4.0 },
  { date: "Jan 4", requests: 3500, cached: 2600, cost: 7.0, savings: 5.2 },
  { date: "Jan 5", requests: 4200, cached: 3200, cost: 8.4, savings: 6.4 },
  { date: "Jan 6", requests: 3800, cached: 2900, cost: 7.6, savings: 5.8 },
  { date: "Jan 7", requests: 2200, cached: 1500, cost: 4.4, savings: 3.0 },
];

const mockRecentLogs = [
  {
    id: "1",
    model: "gpt-4o",
    cached: true,
    tokens_in: 450,
    tokens_out: 280,
    cost: 0.0021,
    latency: 45,
    created_at: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: "2",
    model: "gpt-4o",
    cached: false,
    tokens_in: 320,
    tokens_out: 520,
    cost: 0.0168,
    latency: 1250,
    created_at: new Date(Date.now() - 15000).toISOString(),
  },
  {
    id: "3",
    model: "gpt-3.5-turbo",
    cached: true,
    tokens_in: 180,
    tokens_out: 95,
    cost: 0.00041,
    latency: 38,
    created_at: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: "4",
    model: "claude-3-opus",
    cached: false,
    tokens_in: 550,
    tokens_out: 620,
    cost: 0.0585,
    latency: 2100,
    created_at: new Date(Date.now() - 60000).toISOString(),
  },
  {
    id: "5",
    model: "gpt-4o",
    cached: true,
    tokens_in: 280,
    tokens_out: 340,
    cost: 0.00186,
    latency: 42,
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
];

const mockModelBreakdown = [
  { model: "gpt-4o", requests: 8500, cost: 42.5, cached_percent: 72 },
  { model: "gpt-3.5-turbo", requests: 12000, cost: 12.0, cached_percent: 68 },
  { model: "claude-3-opus", requests: 1500, cost: 45.0, cached_percent: 55 },
  { model: "claude-3-sonnet", requests: 3000, cost: 15.0, cached_percent: 62 },
];

export default function UsagePage() {
  const [timeRange, setTimeRange] = useState("7d");
  const chartData = useMemo(() => mockDailyData, []);

  const overviewStats = [
    {
      label: "Total Requests",
      value: formatNumber(22200),
      meta: "+12% from last period",
    },
    {
      label: "Cache Hit Rate",
      value: "72.4%",
      meta: "+3.2% from last period",
      accent: "text-emerald-400",
    },
    {
      label: "Total Cost",
      value: formatCurrency(44.4),
      meta: `vs ${formatCurrency(77.2)} without caching`,
    },
    {
      label: "Total Savings",
      value: formatCurrency(32.8),
      meta: "42.5% cost reduction",
      accent: "text-emerald-400",
    },
  ];

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
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
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
              <h2 className="text-lg font-semibold text-premium-text-primary">Regional trends</h2>
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
          <Button variant="outline" className="rounded-premium-md border border-premium-border-subtle text-premium-text-muted">
            Export CSV
          </Button>
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
              {mockModelBreakdown.map((row) => (
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
              ))}
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
              {mockRecentLogs.map((log) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
