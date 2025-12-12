"use client";

import { useState } from "react";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usage Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your API usage, costs, and savings
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
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

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(22200)}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">72.4%</div>
            <p className="text-xs text-muted-foreground">+3.2% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(44.4)}</div>
            <p className="text-xs text-muted-foreground">vs {formatCurrency(77.2)} without caching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(32.8)}</div>
            <p className="text-xs text-muted-foreground">42.5% cost reduction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="cost">Cost</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-4">
          <UsageChart data={mockDailyData} type="requests" />
        </TabsContent>
        <TabsContent value="cost" className="mt-4">
          <UsageChart data={mockDailyData} type="cost" />
        </TabsContent>
        <TabsContent value="savings" className="mt-4">
          <UsageChart data={mockDailyData} type="savings" />
        </TabsContent>
      </Tabs>

      {/* Model Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Cache Hit Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockModelBreakdown.map((row) => (
                <TableRow key={row.model}>
                  <TableCell className="font-medium">{row.model}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.requests)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.cost)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={row.cached_percent > 60 ? "success" : "secondary"}>
                      {row.cached_percent}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tokens In</TableHead>
                <TableHead className="text-right">Tokens Out</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRecentLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.model}</TableCell>
                  <TableCell>
                    <Badge variant={log.cached ? "success" : "secondary"}>
                      {log.cached ? "Cached" : "API"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(log.tokens_in)}</TableCell>
                  <TableCell className="text-right">{formatNumber(log.tokens_out)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(log.cost)}</TableCell>
                  <TableCell className="text-right">{log.latency}ms</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
