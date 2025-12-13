"use client";

import { memo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Activity, DollarSign, TrendingUp } from "lucide-react";

interface UsageChartProps {
  data: {
    date: string;
    requests: number;
    cached?: number;
    cost?: number;
    savings?: number;
  }[];
  type?: "requests" | "cost" | "savings";
}

// Premium tooltip component
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-premium-bg-elevated border border-premium-border-subtle rounded-premium-md shadow-premium-lg p-3 backdrop-blur-sm">
      <p className="text-xs font-medium text-premium-text-secondary mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-premium-text-primary font-medium">
            {entry.name}:
          </span>
          <span className="text-premium-text-primary font-bold">
            {type === "cost" || type === "savings"
              ? `$${entry.value.toFixed(2)}`
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

function UsageChartComponent({ data, type = "requests" }: UsageChartProps) {
  const getChartIcon = () => {
    switch (type) {
      case "cost":
        return DollarSign;
      case "savings":
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const getChartTitle = () => {
    switch (type) {
      case "cost":
        return "Cost Over Time";
      case "savings":
        return "Savings Over Time";
      default:
        return "API Requests";
    }
  };

  const ChartIcon = getChartIcon();

  return (
    <div className="group relative overflow-hidden bg-premium-bg-elevated border border-premium-border-subtle rounded-premium-lg shadow-premium-sm hover:shadow-premium-md transition-all duration-base p-6">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-premium-accent/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-base pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-premium-md bg-premium-bg-elevated-hover border border-premium-border-subtle">
            <ChartIcon className="h-5 w-5 text-premium-accent" />
          </div>
          <h3 className="text-lg font-semibold text-premium-text-primary">
            {getChartTitle()}
          </h3>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "requests" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent-primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--accent-primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCached" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border-subtle))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--accent-primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRequests)"
                name="Total Requests"
              />
              <Area
                type="monotone"
                dataKey="cached"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCached)"
                name="Cached Requests"
              />
            </AreaChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={
                      type === "savings"
                        ? "hsl(var(--success))"
                        : "hsl(var(--accent-primary))"
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      type === "savings"
                        ? "hsl(var(--success))"
                        : "hsl(var(--accent-primary))"
                    }
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border-subtle))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                dx={-10}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey={type}
                stroke={
                  type === "savings"
                    ? "hsl(var(--success))"
                    : "hsl(var(--accent-primary))"
                }
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                name={type === "cost" ? "Cost" : "Savings"}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const UsageChart = memo(UsageChartComponent);
