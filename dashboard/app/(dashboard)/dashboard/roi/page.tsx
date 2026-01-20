"use client";

import { useState, useEffect } from "react";
import { createAnalyticsClient } from "@/lib/analytics-api";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DollarSign, Clock, TrendingUp, Activity, Loader2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";

export default function ROIPage() {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [isLoading, setIsLoading] = useState(true);
    const [agentSummaries, setAgentSummaries] = useState<any[]>([]);
    const [overallStats, setOverallStats] = useState({
        totalCost: 0,
        totalSavings: 0,
        hoursSaved: 0,
        roi: 0,
    });

    const supabase = createClient();
    const analyticsClient = createAnalyticsClient();
    const { toast } = useToast();

    // Load Projects
    useEffect(() => {
        async function loadProjects() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("projects")
                .select("id, name")
                .order("created_at", { ascending: false });

            setProjects(data || []);
            if (data && data.length > 0) {
                setSelectedProject(data[0].id);
            } else {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, []);

    // Load ROI Data when project changes
    useEffect(() => {
        if (!selectedProject) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                // Get an active API key for this project from the database
                const { data: apiKeys } = await supabase
                    .from("api_keys")
                    .select("key")
                    .eq("project_id", selectedProject)
                    .eq("is_active", true)
                    .limit(1)
                    .single();

                if (!apiKeys?.key) {
                    toast({
                        title: "No API Key",
                        description: "Please create an API key for this project first",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }

                analyticsClient.setApiKey(apiKeys.key);

                const response = await analyticsClient.getAgentCostSummaries({
                    project_id: selectedProject,
                    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                });

                const agents = response.agents || [];
                setAgentSummaries(agents);

                // Calculate overall stats
                const total = agents.reduce((acc: any, agent: any) => ({
                    totalCost: acc.totalCost + agent.roi.totalAgentCostUsd,
                    totalSavings: acc.totalSavings + agent.roi.netSavings,
                    hoursSaved: acc.hoursSaved + agent.roi.hoursSaved,
                }), { totalCost: 0, totalSavings: 0, hoursSaved: 0 });

                const roi = total.totalCost > 0 ? (total.totalSavings / total.totalCost) * 100 : 0;

                setOverallStats({
                    ...total,
                    roi,
                });

            } catch (error) {
                console.error("Failed to fetch ROI data:", error);
                toast({
                    title: "Error",
                    description: "Failed to load ROI data",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [selectedProject, toast]);

    if (isLoading && projects.length === 0) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h1 className="text-xl font-medium tracking-tight text-white/90">ROI & Cost Attribution</h1>
                    <p className="text-sm text-white/50">
                        Track business value and ROI per agent.
                    </p>
                </div>
                <div className="w-[200px]">
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Net Savings"
                    value={`$${overallStats.totalSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    description="vs manual labor"
                    icon={TrendingUp}
                    trend={{ value: overallStats.roi, isPositive: true }}
                />
                <StatsCard
                    title="Hours Saved"
                    value={overallStats.hoursSaved.toFixed(1)}
                    description="automated work"
                    icon={Clock}
                    trend={{ value: 0, isPositive: true }}
                />
                <StatsCard
                    title="Agent Cost"
                    value={`$${overallStats.totalCost.toFixed(2)}`}
                    description="total spend"
                    icon={DollarSign}
                    trend={{ value: 0, isPositive: false }}
                />
                <StatsCard
                    title="ROI Multiplier"
                    value={`${(overallStats.roi / 100 + 1).toFixed(1)}x`}
                    description="return on spend"
                    icon={Activity}
                    trend={{ value: 0, isPositive: true }}
                />
            </div>

            {/* Detailed Breakdown */}
            <Card className="border-white/[0.08] bg-white/[0.02]">
                <CardHeader>
                    <CardTitle className="text-base text-white/90">Agent Performance Breakdown</CardTitle>
                    <CardDescription className="text-white/50">
                        Cost and value attribution by autonomous agent
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {agentSummaries.length === 0 ? (
                        <div className="text-center py-8 text-white/40 text-sm">
                            No agent runs found for this period.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-white/[0.06] hover:bg-transparent">
                                    <TableHead className="text-white/60">Agent Name</TableHead>
                                    <TableHead className="text-white/60 text-right">Runs</TableHead>
                                    <TableHead className="text-white/60 text-right">Avg Duration</TableHead>
                                    <TableHead className="text-white/60 text-right">Cost</TableHead>
                                    <TableHead className="text-white/60 text-right">Net Savings</TableHead>
                                    <TableHead className="text-white/60 text-right">ROI</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agentSummaries.map((agent: any) => (
                                    <TableRow key={agent.agentName} className="border-white/[0.06] hover:bg-white/[0.02]">
                                        <TableCell className="font-medium text-white/90">{agent.agentName}</TableCell>
                                        <TableCell className="text-right text-white/70">{agent.taskMetrics.taskCount}</TableCell>
                                        <TableCell className="text-right text-white/70">
                                            {(agent.taskMetrics.avgTaskDurationMs / 1000).toFixed(1)}s
                                        </TableCell>
                                        <TableCell className="text-right text-white/70">
                                            ${agent.roi.totalAgentCostUsd.toFixed(4)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-400">
                                            ${agent.roi.netSavings.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right text-white/70">
                                            {agent.roi.roiPercentage.toFixed(0)}%
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
