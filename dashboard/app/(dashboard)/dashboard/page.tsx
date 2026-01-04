"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  DollarSign,
  Zap,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock,
  Download,
} from "lucide-react";
import Link from "next/link";
import { ActionableInsights } from "@/components/dashboard/actionable-insights";
import { COPY } from "@/lib/icp";
import type { InsightsResult } from "@/lib/insights";
import { createClient } from "@/lib/supabase/client";
import { createAnalyticsClient } from "@/lib/analytics-api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/lib/config";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    cacheHitRate: 0,
    totalSavings: 0,
    apiCost: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [observabilityReadiness, setObservabilityReadiness] = useState({
    totalProjects: 0,
    readyProjects: 0,
    missingProjects: [] as string[],
  });
  const [observabilityStats, setObservabilityStats] = useState<{
    totalRequests: number;
    avgLatency: number;
    totalCost: number;
    errorRate: number;
  } | null>(null);
  const [isLoadingObservability, setIsLoadingObservability] = useState(false);
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Export Cost Report function
  const exportCostReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      period: "Last 7 days",
      summary: {
        total_requests: stats.totalRequests,
        cache_hit_rate: `${stats.cacheHitRate.toFixed(1)}%`,
        cache_miss_rate: `${(100 - stats.cacheHitRate).toFixed(1)}%`,
        total_savings: `$${stats.totalSavings.toFixed(2)}`,
        actual_spend: `$${stats.apiCost.toFixed(2)}`,
        estimated_waste: `$${((stats.apiCost * (100 - stats.cacheHitRate) / 100) * 0.7).toFixed(2)}`,
      },
      observability: observabilityStats ? {
        logged_requests: observabilityStats.totalRequests,
        avg_latency_ms: Math.round(observabilityStats.avgLatency),
        total_cost: `$${observabilityStats.totalCost.toFixed(2)}`,
        error_rate: `${observabilityStats.errorRate.toFixed(1)}%`,
      } : null,
      insights: insights ? {
        total_impact: `$${insights.totalImpactUsd.toFixed(2)}`,
        insight_count: insights.insightCount,
        wasted_spend: insights.wastedSpend?.data.wasted_cost_usd ?? 0,
      } : null,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchllm-cost-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // 1. Fetch Projects (limit 4 for preview)
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4);

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Fetch API Key counts and usage stats for these projects
        const projectsWithCounts = await Promise.all((projectsData || []).map(async (p) => {
          // Count active keys
          const { count: keyCount } = await supabase
            .from("api_keys")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id);

          // Get monthly requests
          const { count: monthlyRequests } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id)
            .gte("created_at", startOfMonth.toISOString());

          // Get cached requests for hit rate
          const { count: cachedRequests } = await supabase
            .from("usage_logs")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id)
            .eq("cached", true)
            .gte("created_at", startOfMonth.toISOString());

          const hitRate = monthlyRequests && monthlyRequests > 0
            ? ((cachedRequests || 0) / monthlyRequests) * 100
            : 0;

          // Define limits based on plan
          const limits: Record<string, number> = {
            free: 50000,
            starter: 250000,
            pro: 1000000
          };

          return {
            ...p,
            api_keys_count: keyCount || 0,
            requests_this_month: monthlyRequests || 0,
            requests_limit: limits[p.plan] || 50000,
            cache_hit_rate: hitRate
          };
        }));
        const projectIds = (projectsData || []).map((p) => p.id);
        let providerRows: { project_id: string }[] = [];
        if (projectIds.length > 0) {
          const { data: providerKeys } = await supabase
            .from("provider_keys")
            .select("project_id")
            .in("project_id", projectIds)
            .eq("is_active", true);
          providerRows = providerKeys || [];
        }

        const readyProjectIds = new Set(providerRows.map((row) => row.project_id));

        const projectsWithProviderState = projectsWithCounts.map((project) => ({
          ...project,
          provider_keys_count: providerRows.filter((row) => row.project_id === project.id).length,
          has_provider_key: readyProjectIds.has(project.id),
        }));

        setProjects(projectsWithProviderState);
        setObservabilityReadiness({
          totalProjects: projectIds.length,
          readyProjects: readyProjectIds.size,
          missingProjects: (projectsData || [])
            .filter((project) => !readyProjectIds.has(project.id))
            .map((project) => project.name || `Project ${project.id}`)
            .slice(0, 2),
        });

        // 2. Fetch Usage Logs (Last 7 days for Chart & aggregates)
        // In a real production app, this should be an RPC call or aggregated table.
        // For individual dev accounts, fetching raw logs is okay for small volumes.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: logs } = await supabase
          .from("usage_logs")
          .select("created_at, tokens_total, cached, cost_usd, potential_cost_usd")
          .gte("created_at", sevenDaysAgo.toISOString());

        // Process Stats
        const validLogs = logs || [];
        const totalRequests = validLogs.length;
        const cachedRequests = validLogs.filter(l => l.cached).length;
        const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;

        // Calculate savings (potential cost - actual cost)
        const totalSavings = validLogs.reduce((acc, l) => {
          const potential = l.potential_cost_usd || 0;
          const actual = l.cost_usd || 0;
          const savings = potential - actual;
          return acc + (savings > 0 ? savings : 0);
        }, 0);

        const apiCost = validLogs.reduce((acc, l) => acc + (l.cost_usd || 0), 0);

        setStats({
          totalRequests,
          cacheHitRate,
          totalSavings,
          apiCost
        });

        // Process Chart Data
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const chartMap = new Map();

        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = days[d.getDay()];
          chartMap.set(dayName, { date: dayName, requests: 0, cached: 0, cost: 0, savings: 0 });
        }

        validLogs.forEach(log => {
          const d = new Date(log.created_at);
          const dayName = days[d.getDay()];
          if (chartMap.has(dayName)) {
            const entry = chartMap.get(dayName);
            entry.requests += 1;
            if (log.cached) entry.cached += 1;
            entry.cost += (log.cost_usd || 0);

            const potential = log.potential_cost_usd || 0;
            const actual = log.cost_usd || 0;
            const savings = potential - actual;
            entry.savings += (savings > 0 ? savings : 0);
          }
        });

        setChartData(Array.from(chartMap.values()));

        // 3. Fetch Observability Stats (if user has projects with provider keys)
        if (readyProjectIds.size > 0 && projectIds.length > 0) {
          try {
            setIsLoadingObservability(true);
            const analyticsClient = createAnalyticsClient();
            
            // Get API key for the first ready project (in production, aggregate across all projects)
            const firstReadyProject = projectIds.find(id => readyProjectIds.has(id));
            if (firstReadyProject) {
              const apiKey = localStorage.getItem(`project_${firstReadyProject}_api_key`);
              if (apiKey) {
                analyticsClient.setApiKey(apiKey);
                
                // Fetch last 7 days of observability stats
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const now = new Date().toISOString();
                
                const observabilityData = await analyticsClient.getStats({
                  project_id: firstReadyProject,
                  date_from: sevenDaysAgo,
                  date_to: now,
                });
                
                setObservabilityStats({
                  totalRequests: observabilityData.stats.total_requests,
                  avgLatency: parseFloat(observabilityData.stats.avg_latency_ms),
                  totalCost: parseFloat(observabilityData.stats.total_cost_usd),
                  errorRate: parseFloat(observabilityData.stats.error_rate),
                });
              }
            }
          } catch (error) {
            console.error("Error fetching observability stats:", error);
            // Don't block the dashboard if observability fails
          } finally {
            setIsLoadingObservability(false);
          }
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="skeleton w-96 h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-medium tracking-tight text-white/90">{COPY.dashboard.title}</h1>
          <p className="text-sm text-white/50">
            {COPY.dashboard.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCostReport()}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Link href="/dashboard/projects">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Actionable Insights - ABOVE raw metrics */}
      <ActionableInsights
        wastedSpend={insights?.wastedSpend ?? null}
        costWastingEndpoints={insights?.costWastingEndpoints ?? []}
        overPromptedRequests={insights?.overPromptedRequests ?? []}
        cacheThreshold={insights?.cacheThreshold ?? null}
        modelSwaps={insights?.modelSwaps ?? []}
        totalImpactUsd={insights?.totalImpactUsd ?? 0}
        isLoading={isLoadingInsights}
      />

      {/* Stats Cards */}
      <div className="space-y-4">
        {/* Wasted Spend - The "Oh Sh*t" Metric */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-red-500/20 bg-gradient-to-br from-red-500/10 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-300">Wasted LLM Spend</CardTitle>
              <CardDescription className="text-xs text-red-400/60">
                Requests that missed cache but could have hit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-400">
                ${((stats.apiCost * (100 - stats.cacheHitRate) / 100) * 0.7).toFixed(2)}
              </div>
              <p className="text-xs text-red-400/70 mt-1">
                {(100 - stats.cacheHitRate).toFixed(1)}% of requests are still costing you money
              </p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/10 to-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-300">Money Saved</CardTitle>
              <CardDescription className="text-xs text-green-400/60">
                Cost avoided via caching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                ${stats.totalSavings.toFixed(2)}
              </div>
              <p className="text-xs text-green-400/70 mt-1">
                {stats.cacheHitRate.toFixed(1)}% cache hit rate this week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Caching Stats */}
        <div>
          <h2 className="text-sm font-medium text-white/70 mb-3">Performance Metrics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Requests"
              value={stats.totalRequests.toLocaleString()}
              description="last 7 days"
              icon={Activity}
              trend={{ value: 0, isPositive: true }}
            />
            <StatsCard
              title="Cache Miss Rate"
              value={`${(100 - stats.cacheHitRate).toFixed(1)}%`}
              description="requests costing money"
              icon={AlertCircle}
              trend={{ value: 0, isPositive: false }}
            />
            <StatsCard
              title="Saved This Week"
              value={`$${stats.totalSavings.toFixed(2)}`}
              description="via caching"
              icon={DollarSign}
              trend={{ value: 0, isPositive: true }}
            />
            <StatsCard
              title="Actual Spend"
              value={`$${stats.apiCost.toFixed(2)}`}
              description="LLM API cost"
              icon={TrendingUp}
              trend={{ value: 0, isPositive: true }}
            />
          </div>
        </div>

        {/* Observability Stats */}
        {observabilityStats && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-white/70">Request Telemetry</h2>
              <Link href="/dashboard/observability/logs" className="text-xs text-white/50 hover:text-white/70">
                Every request is logged, priced, and traceable →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Logged Requests"
                value={observabilityStats.totalRequests.toLocaleString()}
                description="every call tracked"
                icon={Activity}
                trend={{ value: 0, isPositive: true }}
              />
              <StatsCard
                title="Avg Latency"
                value={`${Math.round(observabilityStats.avgLatency)}ms`}
                description="response time"
                icon={Clock}
                trend={{ value: 0, isPositive: false }}
              />
              <StatsCard
                title="LLM Spend"
                value={`$${observabilityStats.totalCost.toFixed(2)}`}
                description="actual cost"
                icon={DollarSign}
                trend={{ value: 0, isPositive: false }}
              />
              <StatsCard
                title="Error Rate"
                value={`${observabilityStats.errorRate.toFixed(1)}%`}
                description="failed requests"
                icon={AlertCircle}
                trend={{ value: 0, isPositive: false }}
              />
            </div>
          </div>
        )}

        {isLoadingObservability && (
          <div className="text-center py-4">
            <p className="text-sm text-white/50">Loading observability stats...</p>
          </div>
        )}
      </div>

      {/* Observability Readiness */}
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-white/60" />
            <CardTitle className="text-sm">Observability Setup</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Every LLM request is logged, priced, and traceable. We thought about retention for you—30 days default, partitioned by month.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Projects: {observabilityReadiness.totalProjects}</Badge>
            <Badge variant="secondary">Ready: {observabilityReadiness.readyProjects}</Badge>
            <Badge variant="secondary">Missing keys: {observabilityReadiness.totalProjects - observabilityReadiness.readyProjects}</Badge>
          </div>
          {observabilityReadiness.missingProjects.length > 0 && (
            <div className="text-xs text-white/70">
              Projects without provider keys: {observabilityReadiness.missingProjects.join(', ')}{observabilityReadiness.totalProjects - observabilityReadiness.readyProjects > observabilityReadiness.missingProjects.length && '...'}
            </div>
          )}
          <Alert className="text-xs text-white/70 bg-white/[0.04] border-white/[0.06]">
            <AlertTitle className="text-[10px] uppercase tracking-wide">Storage controls</AlertTitle>
            <AlertDescription>
              ClickHouse tables are partitioned by month and you can configure retention so logs don’t grow forever. Observability is scoped to the same project+provider key already protecting your caching data.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/observability/logs">
              <Button variant="outline" size="sm" className="min-w-[160px]">
                Open Observability
              </Button>
            </Link>
            <Link href="/dashboard/api-keys">
              <Button variant="ghost" size="sm" className="min-w-[160px]">
                Configure provider key
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Usage Chart */}
      {chartData.length > 0 && (
        <UsageChart data={chartData} type="requests" />
      )}

      {/* Projects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-white/90">Your Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-sm text-white/50 hover:text-white/70 flex items-center gap-1 transition-colors duration-100"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 border border-white/5 rounded-xl bg-white/[0.02]">
            <p className="text-white/40 text-sm">No projects created yet.</p>
            <Link href="/dashboard/projects" className="mt-2 inline-block text-premium-accent text-sm hover:underline">
              Create your first project &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Start Guide */}
      <div className="bg-[hsl(220_13%_10%)] border border-white/[0.06] rounded-xl p-5">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.06]">
              <Zap className="h-4 w-4 text-white/60" />
            </div>
            <h3 className="text-sm font-medium text-white/90">Quick Start Guide</h3>
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white/60 text-xs font-medium">
                1
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-medium text-white/80 mb-0.5">
                  Create a Project
                </h4>
                <p className="text-xs text-white/40">
                  Organize your API keys and usage by project
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white/60 text-xs font-medium">
                2
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-medium text-white/80 mb-0.5">
                  Generate an API Key
                </h4>
                <p className="text-xs text-white/40">
                  Create a key to authenticate your requests
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.08] text-white/60 text-xs font-medium">
                3
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-medium text-white/80 mb-0.5">
                  Update Your Base URL
                </h4>
                <p className="text-xs text-white/40 mb-2">
                  Replace your OpenAI base URL with WatchLLM&apos;s caching proxy:
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <code className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/50 font-mono">
                    api.openai.com
                  </code>
                  <ArrowRight className="h-3 w-3 text-white/30" />
                  <code className="px-2 py-1 rounded-md bg-white/[0.06] border border-white/[0.08] text-white/70 font-mono">
                    {APP_CONFIG.workerUrl.replace(/^https?:\/\//, "")}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
