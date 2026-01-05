'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Search, Filter, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createAnalyticsClient, type EventLog } from '@/lib/analytics-api';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function RequestsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id') || '';
  
  const [logs, setLogs] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  const pageSize = 50;

  useEffect(() => {
    if (!projectId) {
      setError('No project selected. Please select a project from the Projects page.');
      setLoading(false);
      return;
    }
    
    fetchLogs();
  }, [projectId, statusFilter, modelFilter, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsClient = createAnalyticsClient();
      
      // Get API key from localStorage or session (you'll need to implement this)
      const apiKey = localStorage.getItem(`project_${projectId}_api_key`);
      if (apiKey) {
        analyticsClient.setApiKey(apiKey);
      }
      
      const params: any = {
        project_id: projectId,
        limit: pageSize,
        offset: page * pageSize,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (modelFilter !== 'all') {
        params.model = modelFilter;
      }
      
      const response = await analyticsClient.getLogs(params);
      
      setLogs(response.logs);
      setTotalLogs(response.total);
      setHasMore(response.has_more);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'timeout':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.prompt.toLowerCase().includes(search) ||
      log.response.toLowerCase().includes(search) ||
      log.model.toLowerCase().includes(search) ||
      log.event_id.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-10 p-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.4em] text-premium-text-muted">
          Observability
        </p>
        <h1 className="text-4xl font-bold text-premium-text-primary">Request Logs</h1>
        <p className="text-lg text-premium-text-secondary">
          Every LLM request is logged, priced, and traceable. Find what&apos;s costing you money.
        </p>
      </header>

      <section className="space-y-5">

      {!projectId && (
        <Alert className="border-yellow-500/20 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle>No Project Selected</AlertTitle>
          <AlertDescription>
            Please select a project from the{' '}
            <Link href="/dashboard/projects" className="underline">
              Projects page
            </Link>{' '}
            to view logs.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts, responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Select value={modelFilter} onValueChange={(value) => { setModelFilter(value); setPage(0); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Events
              </CardTitle>
              <CardDescription>
                {totalLogs > 0 ? `Showing ${page * pageSize + 1}-${Math.min((page + 1) * pageSize, totalLogs)} of ${totalLogs} events` : 'Real-time observability events'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">Loading events...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No events found</p>
              <p className="text-sm mt-2">
                {logs.length === 0
                  ? 'Start making requests with the SDK to see events here.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <Link
                  key={log.event_id}
                  href={`/dashboard/observability/logs/${log.event_id}?project_id=${projectId}`}
                  className="block group"
                >
                  <div className="border border-white/[0.08] rounded-lg p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <code className="text-xs text-muted-foreground font-mono">
                            {log.event_id.slice(0, 8)}...
                          </code>
                          <Badge variant="outline" className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.model}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium line-clamp-1">
                            {log.prompt}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {log.response}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{log.tokens_input + log.tokens_output} tokens</span>
                          <span>{formatCost(log.cost_estimate_usd)}</span>
                          <span>{log.latency_ms}ms</span>
                          {log.error_message && (
                            <span className="text-red-500">Error: {log.error_message}</span>
                          )}
                        </div>
                      </div>
                      
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Pagination */}
              {totalLogs > pageSize && (
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Page {page + 1}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!hasMore}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </section>
    </div>
  );
}
