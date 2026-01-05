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
    ComposedChart,
    Bar,
} from "recharts";
import { TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SavingsTrendChartProps {
    data: {
        date: string;
        savings: number;
        cost: number;
        requests?: number;
        cached?: number;
    }[];
    period?: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const savings = payload.find((p: any) => p.dataKey === "savings")?.value || 0;
    const cost = payload.find((p: any) => p.dataKey === "cost")?.value || 0;
    const total = savings + cost;
    const savingsPercent = total > 0 ? ((savings / total) * 100).toFixed(0) : 0;

    return (
        <div className="rounded-lg border border-white/[0.08] bg-[hsl(220,13%,12%)]/95 px-4 py-3 shadow-xl backdrop-blur-sm">
            <p className="text-xs font-medium text-white/70 mb-2">{label}</p>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-xs text-white/60">Saved</span>
                    </div>
                    <span className="text-sm font-semibold text-green-400 tabular-nums">
                        ${savings.toFixed(2)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400/70" />
                        <span className="text-xs text-white/60">Spent</span>
                    </div>
                    <span className="text-sm font-medium text-red-400/80 tabular-nums">
                        ${cost.toFixed(2)}
                    </span>
                </div>
                <div className="pt-1.5 border-t border-white/[0.08]">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-white/50">Efficiency</span>
                        <span className="text-sm font-bold text-white tabular-nums">
                            {savingsPercent}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

function SavingsTrendChartComponent({ data, period = "last 7 days" }: SavingsTrendChartProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const totalSavings = data.reduce((acc, d) => acc + d.savings, 0);
    const totalCost = data.reduce((acc, d) => acc + d.cost, 0);
    const total = totalSavings + totalCost;
    const overallEfficiency = total > 0 ? ((totalSavings / total) * 100).toFixed(1) : 0;

    return (
        <div className="relative rounded-xl border border-white/[0.06] bg-[hsl(220,13%,10%)]/80 p-5">
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg border border-green-500/20 bg-green-500/10">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Savings vs Spend
                        </h3>
                        <p className="text-xs text-white/40">{period}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-white/50">Saved: ${totalSavings.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400/70" />
                        <span className="text-white/50">Spent: ${totalCost.toFixed(2)}</span>
                    </div>
                    <div className="px-2 py-1 rounded-md bg-white/[0.05] border border-white/[0.08]">
                        <span className="text-white/70 font-medium">{overallEfficiency}% efficiency</span>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div
                className={cn(
                    "relative h-[280px] transition-opacity duration-500",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
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
                            width={50}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="savings"
                            stroke="hsl(142, 71%, 45%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSavings)"
                            name="Saved"
                            animationDuration={800}
                            animationEasing="ease-out"
                        />
                        <Bar
                            dataKey="cost"
                            fill="hsl(0, 72%, 51%)"
                            fillOpacity={0.3}
                            radius={[2, 2, 0, 0]}
                            name="Spent"
                            animationDuration={800}
                            animationEasing="ease-out"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="relative mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-center gap-6 text-xs text-white/50">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-2 rounded-sm bg-gradient-to-t from-green-500/30 to-green-500" />
                    <span>Money not spent (cached)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-2 rounded-sm bg-red-500/30" />
                    <span>Actual LLM API cost</span>
                </div>
            </div>
        </div>
    );
}

export const SavingsTrendChart = memo(SavingsTrendChartComponent);
