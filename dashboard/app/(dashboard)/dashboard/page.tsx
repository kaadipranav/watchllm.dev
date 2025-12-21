"use client";

import { StatsCard } from "@/components/dashboard/stats-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  DollarSign,
  Zap,
  TrendingUp,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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

        // Fetch API Key counts for these projects
        const projectsWithCounts = await Promise.all((projectsData || []).map(async (p) => {
          const { count } = await supabase
            .from("api_keys")
            .select("*", { count: "exact", head: true })
            .eq("project_id", p.id);
          return {
            ...p,
            api_keys_count: count || 0,
            requests_this_month: 0, // Placeholder
            requests_limit: 50000,
            cache_hit_rate: 0
          };
        }));
        setProjects(projectsWithCounts);

        // 2. Fetch Usage Logs (Last 7 days for Chart & aggregates)
        // In a real production app, this should be an RPC call or aggregated table.
        // For individual dev accounts, fetching raw logs is okay for small volumes.
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: logs } = await supabase
          .from("usage_logs")
          .select("created_at, tokens, cached, cost, savings")
          .gte("created_at", sevenDaysAgo.toISOString());

        // Process Stats
        const validLogs = logs || [];
        const totalRequests = validLogs.length;
        const cachedRequests = validLogs.filter(l => l.cached).length;
        const cacheHitRate = totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0;
        const totalSavings = validLogs.reduce((acc, l) => acc + (l.savings || 0), 0);
        const apiCost = validLogs.reduce((acc, l) => acc + (l.cost || 0), 0);

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
            entry.cost += (log.cost || 0);
            entry.savings += (log.savings || 0);
          }
        });

        setChartData(Array.from(chartMap.values()));

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
          <h1 className="text-xl font-medium tracking-tight text-white/90">Dashboard</h1>
          <p className="text-sm text-white/50">
            Overview of your API usage and savings
          </p>
        </div>
        <Link href="/dashboard/projects">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Requests"
          value={stats.totalRequests.toLocaleString()}
          description="last 7 days"
          icon={Activity}
          trend={{ value: 0, isPositive: true }} // Trends require historical data comparison
        />
        <StatsCard
          title="Cache Hit Rate"
          value={`${stats.cacheHitRate.toFixed(1)}%`}
          description="average this week"
          icon={Zap}
          trend={{ value: 0, isPositive: true }}
        />
        <StatsCard
          title="Total Savings"
          value={`$${stats.totalSavings.toFixed(4)}`}
          description="this week"
          icon={DollarSign}
          trend={{ value: 0, isPositive: true }}
        />
        <StatsCard
          title="API Cost"
          value={`$${stats.apiCost.toFixed(4)}`}
          description="actual spend"
          icon={TrendingUp}
          trend={{ value: 0, isPositive: true }}
        />
      </div>

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
