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
        <div className="shimmer w-96 h-96 rounded-premium-lg bg-premium-bg-elevated" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Page Header with Premium Styling */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-premium-text-primary">Dashboard</h1>
          <p className="text-base text-premium-text-secondary">
            Overview of your API usage and savings
          </p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="bg-premium-accent hover:bg-premium-accent/90 text-white shadow-glow-accent hover:shadow-glow-accent transition-all duration-base hover:scale-105">
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
          <h2 className="text-2xl font-semibold text-premium-text-primary">Your Projects</h2>
          <Link 
            href="/dashboard/projects" 
            className="text-sm font-medium text-premium-accent hover:text-premium-accent/80 flex items-center gap-1 transition-colors duration-base group"
          >
            View all
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-base" />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Quick Start Guide with Premium Styling */}
      <div className="group relative overflow-hidden bg-premium-bg-elevated border border-premium-border-subtle rounded-premium-lg shadow-premium-sm p-6">
        {/* Gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-premium-accent/5 via-transparent to-premium-success/5 opacity-50 pointer-events-none" />
        
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-premium-md bg-premium-accent/10 border border-premium-accent/20">
              <Zap className="h-5 w-5 text-premium-accent" />
            </div>
            <h3 className="text-xl font-semibold text-premium-text-primary">Quick Start Guide</h3>
          </div>
          
          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex items-start gap-4 group/step">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-premium-accent text-white text-sm font-bold shadow-glow-accent">
                1
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-premium-text-primary mb-1 group-hover/step:text-premium-accent transition-colors duration-base">
                  Create a Project
                </h4>
                <p className="text-sm text-premium-text-secondary">
                  Organize your API keys and usage by project
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-start gap-4 group/step">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-premium-accent text-white text-sm font-bold shadow-glow-accent">
                2
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-premium-text-primary mb-1 group-hover/step:text-premium-accent transition-colors duration-base">
                  Generate an API Key
                </h4>
                <p className="text-sm text-premium-text-secondary">
                  Create a key to authenticate your requests
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex items-start gap-4 group/step">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-premium-md bg-premium-accent text-white text-sm font-bold shadow-glow-accent">
                3
              </div>
              <div className="flex-1 pt-1">
                <h4 className="font-semibold text-premium-text-primary mb-1 group-hover/step:text-premium-accent transition-colors duration-base">
                  Update Your Base URL
                </h4>
                <p className="text-sm text-premium-text-secondary mb-2">
                  Replace your OpenAI base URL with WatchLLM&apos;s caching proxy:
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <code className="px-3 py-1.5 rounded-premium-md bg-premium-bg-primary border border-premium-border-subtle text-premium-text-muted font-mono">
                    api.openai.com
                  </code>
                  <ArrowRight className="h-3 w-3 text-premium-accent" />
                  <code className="px-3 py-1.5 rounded-premium-md bg-premium-accent/10 border border-premium-accent/20 text-premium-accent font-mono font-semibold">
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
