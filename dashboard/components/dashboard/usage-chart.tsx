"use client";

import { memo, useState, useEffect } from "react";
import {
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

// Minimal tooltip - instant feel
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-premium-bg-elevated/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-[0.65rem] font-medium text-premium-text-muted mb-1.5">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-premium-text-muted">{entry.name}:</span>
          <span className="font-medium text-premium-text-primary tabular-nums">
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
  const [isLoaded, setIsLoaded] = useState(false);

  // Gentle load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="relative rounded-xl border border-white/[0.06] bg-premium-bg-elevated/60 p-5">
      {/* Inner highlight */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] pointer-events-none" />

      {/* Header */}
      <div className="relative flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <ChartIcon className="h-4 w-4 text-premium-accent" />
        </div>
        <h3 className="text-sm font-semibold text-premium-text-primary">
          {getChartTitle()}
        </h3>
      </div>

      {/* Chart */}
      <div 
        className="relative h-[300px] transition-opacity duration-500"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {type === "requests" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCached" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dx={-8}
                width={40}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="hsl(258, 90%, 66%)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorRequests)"
                name="Total"
                animationDuration={800}
                animationEasing="ease-out"
              />
              <Area
                type="monotone"
                dataKey="cached"
                stroke="hsl(158, 64%, 52%)"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorCached)"
                name="Cached"
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={type === "savings" ? "hsl(158, 64%, 52%)" : "hsl(258, 90%, 66%)"}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={type === "savings" ? "hsl(158, 64%, 52%)" : "hsl(258, 90%, 66%)"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                tick={{ fill: "hsl(240, 4%, 46%)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                dx={-8}
                width={40}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip type={type} />} />
              <Area
                type="monotone"
                dataKey={type}
                stroke={type === "savings" ? "hsl(158, 64%, 52%)" : "hsl(258, 90%, 66%)"}
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorValue)"
                name={type === "cost" ? "Cost" : "Savings"}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const UsageChart = memo(UsageChartComponent);
