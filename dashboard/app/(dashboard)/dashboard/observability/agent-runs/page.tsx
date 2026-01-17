'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LoadingScreen from '@/components/loading-screen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bug,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { formatRelativeTime, formatCurrency } from '@/lib/utils';
import type { AgentRunsListResponse, AgentRunListItem, RunStatus } from '@/lib/agent-debugger';

/**
 * Agent Runs List Page
 * 
 * Displays a paginated list of agent runs with filtering options.
 * Links to individual run debug pages.
 * 
 * @feature AGENT_DEBUGGER_V1
 */
export default function AgentRunsPage() {
  const [runs, setRuns] = useState<AgentRunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [totalRuns, setTotalRuns] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    fetchRuns();
  }, [page, statusFilter]);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: (page * pageSize).toString(),
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/agent-runs?${params}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Agent Debugger feature is not enabled. Set AGENT_DEBUGGER_V1=true in environment.');
        } else {
          throw new Error('Failed to fetch runs');
        }
        return;
      }

      const data: AgentRunsListResponse = await response.json();
      setRuns(data.runs);
      setTotalRuns(data.total);
      setHasMore(data.has_more);
    } catch (err) {
      console.error('Failed to fetch agent runs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agent runs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'cancelled':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeVariant = (status: RunStatus) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'primary';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredRuns = runs.filter(run => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      run.agent_name.toLowerCase().includes(search) ||
      run.run_id.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <LoadingScreen
        title="Loading agent runs"
        subtitle="Syncing with WatchLLM"
        detail="Collecting telemetry from the edge, Supabase, and ClickHouse."
      />
    );
  }

  return (
    <div className="space-y-10 p-8">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Observability
        </p>
        <h1 className="text-4xl font-bold text-premium-text-primary">Agent Debugger</h1>
        <p className="text-lg text-premium-text-secondary">
          Debug and analyze agent runs with cost attribution and decision explanations.
        </p>
      </header>

      <section className="space-y-5">
        {/* Feature Alert */}
        <Alert className="border-white/[0.08] bg-white/[0.02]">
          <Bug className="h-4 w-4" />
          <AlertTitle className="text-xs uppercase tracking-wide">Agent Debugger v1</AlertTitle>
          <AlertDescription className="text-xs text-white/70">
            View detailed timelines of agent runs, including per-step cost attribution, decision explanations, and anomaly flags.
            Money → Decisions → Outcomes.
          </AlertDescription>
        </Alert>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by agent name or run ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Runs List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Agent Runs
            </CardTitle>
            <CardDescription>
              {totalRuns} total runs • Click on a run to view detailed debug information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading runs...</span>
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No runs match your filters.'
                  : 'No agent runs found. Runs will appear here after instrumentation is set up.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRuns.map((run) => (
                  <Link
                    key={run.run_id}
                    href={`/dashboard/observability/agent-runs/${run.run_id}/debug`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border-subtle bg-bg-elevated hover:border-border-hover hover:bg-bg-elevated/80 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(run.status)}
                        <div>
                          <div className="font-medium text-text-primary">
                            {run.agent_name}
                          </div>
                          <div className="text-xs text-text-muted">
                            {run.run_id.slice(0, 8)}... • {run.total_steps} steps • {formatRelativeTime(run.started_at)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {run.has_warnings && (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {run.flags_count}
                          </Badge>
                        )}
                        <Badge variant={getStatusBadgeVariant(run.status) as any}>
                          {run.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-text-secondary min-w-[80px] justify-end">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-sm font-mono">
                            {formatCurrency(run.total_cost_usd)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalRuns > pageSize && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-subtle">
                <div className="text-sm text-text-muted">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalRuns)} of {totalRuns}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Fixtures Link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Fixtures</CardTitle>
            <CardDescription>
              View sample agent runs to explore the debugger features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Link href="/dashboard/observability/agent-runs/fixture/normal">
                <Button variant="outline" size="sm">
                  Normal Run
                </Button>
              </Link>
              <Link href="/dashboard/observability/agent-runs/fixture/loop">
                <Button variant="outline" size="sm">
                  Loop Detection
                </Button>
              </Link>
              <Link href="/dashboard/observability/agent-runs/fixture/high-cost">
                <Button variant="outline" size="sm">
                  High Cost Run
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
