"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    generateCostForecast,
    formatForecastSummary,
    CostForecast
} from "@/lib/forecasting";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CalendarDays, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

export default function ForecastingPage() {
    const supabase = createClient();
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [forecasts, setForecasts] = useState<CostForecast[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Fetch Projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from("projects")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (data && data.length > 0) {
                    setProjects(data);
                    setSelectedProjectId(data[0].id);
                }
            } catch (error) {
                console.error("Error fetching projects", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [supabase]);

    // Generate Forecast
    useEffect(() => {
        if (!selectedProjectId) return;

        const loadForecast = async () => {
            setIsGenerating(true);
            try {
                const data = await generateCostForecast(selectedProjectId, 30);
                setForecasts(data);
                setSummary(formatForecastSummary(data));
            } catch (error) {
                console.error("Error generating forecast", error);
            } finally {
                setIsGenerating(false);
            }
        };

        loadForecast();
    }, [selectedProjectId]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border rounded-lg p-3 shadow-lg backdrop-blur-sm text-sm">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => {
                        if (entry.dataKey === "range") return null; // Skip range in tooltip
                        return (
                            <div key={index} className="flex items-center gap-2" style={{ color: entry.color }}>
                                <span className="capitalize">{entry.name}:</span>
                                <span className="font-mono font-medium">${Number(entry.value).toFixed(2)}</span>
                            </div>
                        );
                    })}
                    {payload[0] && payload[0].payload && (
                        <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                            Range: ${payload[0].payload.confidenceLow.toFixed(2)} - ${payload[0].payload.confidenceHigh.toFixed(2)}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading projects...</div>;
    }

    // Transform data for Recharts Area range
    const chartData = forecasts.map(f => ({
        ...f,
        range: [f.confidenceLow, f.confidenceHigh],
    }));

    return (
        <div className="space-y-6 p-6 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight">Cost Forecasting</h1>
                    </div>
                    <p className="text-muted-foreground">
                        AI-driven cost prediction for the next 30 days.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-card border rounded-lg p-1.5 px-3">
                    <Label htmlFor="project-select" className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Project</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[180px] h-8 border-none bg-transparent focus:ring-0 px-2">
                            <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projected Cost (30d)</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${summary.nextMonth.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                +${summary.nextWeek.toFixed(2)} expected next week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Trend Direction</CardTitle>
                            {summary.trendDirection === 'increasing' ? <TrendingUp className="h-4 w-4 text-red-500" /> :
                                summary.trendDirection === 'decreasing' ? <TrendingDown className="h-4 w-4 text-green-500" /> :
                                    <Minus className="h-4 w-4 text-muted-foreground" />}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.trend}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Based on historical usage patterns
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold">{summary.confidence}</div>
                                <Badge variant={summary.confidence === 'High' ? 'default' : 'secondary'} className={summary.confidence === 'High' ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : ''}>
                                    {summary.confidence === 'High' ? 'Reliable' : 'Variable'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Based on variance in daily usage
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Chart */}
            <Card className="h-[500px] flex flex-col">
                <CardHeader>
                    <CardTitle>Forecast Timeline</CardTitle>
                    <CardDescription>
                        Predicted daily costs with confidence intervals (Low/High)
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    {isGenerating ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
                            Generating forecast data...
                        </div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                    <pattern id="striped-pattern" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                        <line stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
                                    </pattern>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />

                                {/* Confidence Band */}
                                <Area
                                    type="monotone"
                                    dataKey="range"
                                    stroke="none"
                                    fill="hsl(var(--primary))"
                                    fillOpacity={0.1}
                                    name="Confidence Interval"
                                />

                                {/* Main Prediction Line */}
                                <Line
                                    type="monotone"
                                    dataKey="predictedCost"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                                    name="Predicted Cost"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            No forecast data available.
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="text-center text-xs text-muted-foreground">
                Predictions are estimated based on historical usage patterns and may vary from actual billing.
                Does not account for future rate limit changes or plan upgrades.
            </div>
        </div>
    );
}
