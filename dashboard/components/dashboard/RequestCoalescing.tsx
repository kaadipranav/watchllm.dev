'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers, TrendingUp, Zap, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CoalescingStats {
  current_month: {
    coalesced_requests: number;
    peak_concurrent: number;
    estimated_savings_usd: string;
  };
  historical: Array<{
    period_start: string;
    coalesced_requests: number;
    peak_concurrent: number;
    estimated_cost_saved_usd: number;
  }>;
}

interface RequestCoalescingProps {
  projectId: string;
  apiKey: string;
  workerUrl?: string;
}

export function RequestCoalescing({ projectId, apiKey, workerUrl }: RequestCoalescingProps) {
  const [stats, setStats] = useState<CoalescingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoalescingStats() {
      if (!projectId || !apiKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const baseUrl = workerUrl || process.env.NEXT_PUBLIC_WORKER_URL || 'https://api.watchllm.com';
        const response = await fetch(`${baseUrl}/v1/analytics/coalescing?project_id=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Endpoint not available yet, show empty state
            setStats({
              current_month: {
                coalesced_requests: 0,
                peak_concurrent: 0,
                estimated_savings_usd: '0.0000',
              },
              historical: [],
            });
            return;
          }
          throw new Error(`Failed to fetch coalescing stats: ${response.status}`);
        }

        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch coalescing stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load coalescing stats');
      } finally {
        setLoading(false);
      }
    }

    fetchCoalescingStats();
  }, [projectId, apiKey, workerUrl]);

  if (loading) {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            Request Coalescing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Loading coalescing metrics...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            Request Coalescing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Unable to load coalescing stats
          </div>
        </CardContent>
      </Card>
    );
  }

  const coalescedRequests = stats?.current_month?.coalesced_requests || 0;
  const peakConcurrent = stats?.current_month?.peak_concurrent || 0;
  const estimatedSavings = parseFloat(stats?.current_month?.estimated_savings_usd || '0');

  return (
    <Card className="border-white/[0.08] bg-gradient-to-br from-purple-500/5 to-blue-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            <CardTitle>Request Coalescing</CardTitle>
          </div>
          <Badge variant="outline" className="border-purple-400/30 text-purple-400">
            Race Condition Protection
          </Badge>
        </div>
        <CardDescription>
          Identical in-flight requests are deduplicated to prevent redundant API calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coalesced Requests */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Requests Deduplicated
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {coalescedRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </div>

          {/* Peak Concurrent */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Peak Concurrent
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {peakConcurrent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max identical requests at once
            </p>
          </div>

          {/* Estimated Savings */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Estimated Savings
              </span>
            </div>
            <div className="text-3xl font-bold text-green-400">
              ${estimatedSavings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From deduplication
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-sm font-medium text-white/80 mb-2">How it works</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            When multiple identical requests arrive simultaneously (before cache is populated), 
            only the first request is forwarded to the upstream API. Subsequent identical requests 
            wait for the first response and receive the same result, preventing duplicate API charges.
          </p>
        </div>

        {/* Historical data */}
        {stats?.historical && stats.historical.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-white/80 mb-3">Historical</h4>
            <div className="space-y-2">
              {stats.historical.slice(0, 3).map((period, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <span className="text-sm text-muted-foreground">
                    {new Date(period.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">
                      {period.coalesced_requests.toLocaleString()} coalesced
                    </span>
                    <span className="text-sm text-green-400">
                      ${period.estimated_cost_saved_usd.toFixed(2)} saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
