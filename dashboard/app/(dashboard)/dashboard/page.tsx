import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const dynamic = "force-dynamic";

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

export default async function DashboardPage() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
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
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Projects</h2>
          <Link href="/dashboard/projects" className="text-sm text-primary hover:underline flex items-center">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Create a Project</h4>
                <p className="text-sm text-muted-foreground">
                  Organize your API keys and usage by project
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Generate an API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Create a key to authenticate your requests
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Update Your Base URL</h4>
                <p className="text-sm text-muted-foreground">
                  Change <code className="text-xs bg-muted px-1 py-0.5 rounded">api.openai.com</code> to{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">api.watchllm.com</code>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
