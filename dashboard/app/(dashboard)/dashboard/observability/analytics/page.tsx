'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Activity, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { createAnalyticsClient } from '@/lib/analytics-api';
import { createClient } from '@/lib/supabase/client';

export default function AnalyticsPage() {
  const supabase = createClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('created_at', { ascending: false });

      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      } else {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  const fetchAnalytics = useCallback(async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      setError(null);

      const analyticsClient = createAnalyticsClient();

      // Get API key from database
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('key')
        .eq('project_id', selectedProject)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!apiKeys?.key) {
        setError('No API key found for this project');
        setLoading(false);
        return;
      }

      analyticsClient.setApiKey(apiKeys.key);

      const stats = await analyticsClient.getStatsLast7d(selectedProject);
      setMetrics(stats);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      if (err instanceof Error && err.message.includes('404')) {
        setError('Analytics endpoint not available. Worker may not be running.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Observability
        </p>
        <h1 className="text-4xl font-bold text-premium-text-primary">Analytics</h1>
        <p className="text-lg text-premium-text-secondary">
          See where your LLM spend is going. Costs, latency, and errors—all in one place.
        </p>
      </header>

      <section className="space-y-5">

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {error && (
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="border-white/[0.08] bg-white/[0.02]">
        <AlertTitle className="text-xs uppercase tracking-wide">We&apos;ve set sensible defaults</AlertTitle>
        <AlertDescription className="text-xs text-white/70">
          Retention: 30 days. Partitioned by month. No config needed—we&apos;ve thought about this for you.
        </AlertDescription>
      </Alert>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : metrics?.stats?.total_requests?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : `$${parseFloat(metrics?.stats?.total_cost_usd || '0').toFixed(4)}`}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : `${parseFloat(metrics?.stats?.avg_latency_ms || '0').toFixed(0)}ms`}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '-' : `${parseFloat(metrics?.stats?.error_rate || '0').toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Time-Series Metrics</CardTitle>
          <CardDescription>
            Request volume, costs, and latency over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Coming soon: Charts will display here
          </div>
        </CardContent>
      </Card>

      {/* Top Models */}
      <Card>
        <CardHeader>
          <CardTitle>Top Models by Usage</CardTitle>
          <CardDescription>
            Most frequently used AI models.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Loading models data...
            </div>
          ) : !metrics?.top_models || metrics.top_models.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No model usage data available
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.top_models.map((model: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-white/[0.08] rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{model.model}</p>
                    <p className="text-xs text-muted-foreground">{model.request_count} requests</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${parseFloat(model.total_cost).toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
