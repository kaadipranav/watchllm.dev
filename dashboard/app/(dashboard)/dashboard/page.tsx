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

// Mock data for demo
const mockUsageData = [
  { date: "Mon", requests: 1200, cached: 800, cost: 2.4, savings: 1.6 },
  { date: "Tue", requests: 1800, cached: 1200, cost: 3.6, savings: 2.4 },
  { date: "Wed", requests: 2200, cached: 1600, cost: 4.4, savings: 3.2 },
  { date: "Thu", requests: 1600, cached: 1100, cost: 3.2, savings: 2.2 },
  { date: "Fri", requests: 2400, cached: 1800, cost: 4.8, savings: 3.6 },
  { date: "Sat", requests: 1000, cached: 700, cost: 2.0, savings: 1.4 },
  { date: "Sun", requests: 800, cached: 550, cost: 1.6, savings: 1.1 },
];

const mockProjects = [
  {
    id: "1",
    name: "Production App",
    slug: "production-app",
    created_at: new Date().toISOString(),
    api_keys_count: 3,
    requests_this_month: 45000,
    requests_limit: 50000,
    cache_hit_rate: 67.5,
  },
  {
    id: "2",
    name: "Development",
    slug: "development",
    created_at: new Date().toISOString(),
    api_keys_count: 1,
    requests_this_month: 5000,
    requests_limit: 50000,
    cache_hit_rate: 45.2,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router, supabase.auth]);

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
        <Link href="/dashboard/projects/new">
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
          value="11,000"
          description="from last week"
          icon={Activity}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Cache Hit Rate"
          value="68.2%"
          description="average this month"
          icon={Zap}
          trend={{ value: 4.2, isPositive: true }}
        />
        <StatsCard
          title="Total Savings"
          value="$15.50"
          description="this month"
          icon={DollarSign}
          trend={{ value: 18.3, isPositive: true }}
        />
        <StatsCard
          title="API Cost"
          value="$22.00"
          description="vs $37.50 without caching"
          icon={TrendingUp}
          trend={{ value: 41.3, isPositive: true }}
        />
      </div>

      {/* Usage Chart */}
      <UsageChart data={mockUsageData} type="requests" />

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
        <div className="grid gap-4 md:grid-cols-2">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
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
                    api.watchllm.com
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
