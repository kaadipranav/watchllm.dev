'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface StreamingMetrics {
  metrics: {
    streaming_requests: number;
    non_streaming_requests: number;
    streaming_cache_hits: number;
    streaming_cache_misses: number;
    failed_streams: number;
  };
  derived: {
    streaming_cache_hit_rate_percent: string;
    streaming_vs_total_percent: string;
    estimated_tokens_saved: number;
  };
}

interface StreamingCacheMetricsProps {
  projectId: string;
  apiKey: string;
  workerUrl?: string;
}

export function StreamingCacheMetrics({ projectId, apiKey, workerUrl }: StreamingCacheMetricsProps) {
  const [metrics, setMetrics] = useState<StreamingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStreamingMetrics() {
      if (!projectId || !apiKey) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const baseUrl = workerUrl || process.env.NEXT_PUBLIC_WORKER_URL || 'https://api.watchllm.com';
        const response = await fetch(`${baseUrl}/v1/analytics/streaming?project_id=${projectId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Endpoint not available yet
            setMetrics({
              metrics: {
                streaming_requests: 0,
                non_streaming_requests: 0,
                streaming_cache_hits: 0,
                streaming_cache_misses: 0,
                failed_streams: 0,
              },
              derived: {
                streaming_cache_hit_rate_percent: '0.00',
                streaming_vs_total_percent: '0.00',
                estimated_tokens_saved: 0,
              },
            });
            return;
          }
          throw new Error(`Failed to fetch streaming metrics: ${response.status}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch streaming metrics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load streaming metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchStreamingMetrics();
  }, [projectId, apiKey, workerUrl]);

  if (loading) {
    return (
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-400" />
            Streaming Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Loading streaming metrics...
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
            <Radio className="h-5 w-5 text-blue-400" />
            Streaming Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            Unable to load streaming metrics
          </div>
        </CardContent>
      </Card>
    );
  }

  const cacheHitRate = parseFloat(metrics?.derived?.streaming_cache_hit_rate_percent || '0');
  const streamingPercent = parseFloat(metrics?.derived?.streaming_vs_total_percent || '0');
  const streamingHits = metrics?.metrics?.streaming_cache_hits || 0;
  const failedStreams = metrics?.metrics?.failed_streams || 0;
  const totalStreaming = (metrics?.metrics?.streaming_requests || 0) + streamingHits;

  return (
    <Card className="border-white/[0.08] bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-blue-400" />
            <CardTitle>Streaming Cache</CardTitle>
          </div>
          <Badge variant="outline" className="border-blue-400/30 text-blue-400">
            Real-time UX Preserved
          </Badge>
        </div>
        <CardDescription>
          Streaming responses are buffered and replayed with realistic timing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Cache Hit Rate */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Cache Hit Rate
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {cacheHitRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Streaming requests
            </p>
          </div>

          {/* Streaming Cache Hits */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Stream Replays
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {streamingHits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cached streams served
            </p>
          </div>

          {/* Streaming vs Non-Streaming */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Streaming Usage
              </span>
            </div>
            <div className="text-3xl font-bold text-white">
              {streamingPercent.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of total requests
            </p>
          </div>

          {/* Failed Streams */}
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Failed Streams
              </span>
            </div>
            <div className={`text-3xl font-bold ${failedStreams > 0 ? 'text-orange-400' : 'text-white'}`}>
              {failedStreams}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Not cached (partial)
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <h4 className="text-sm font-medium text-white/80 mb-2">How it works</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Streaming responses are buffered while being forwarded to your client. When the stream completes,
            it&apos;s cached for future requests. Cached streams are replayed with realistic timing delays
            to preserve the streaming UX. Partial or failed streams are not cached.
          </p>
        </div>

        {/* Stats summary */}
        {totalStreaming > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
            <span className="text-sm text-green-400">
              ✓ {streamingHits.toLocaleString()} streaming requests served from cache
            </span>
            <span className="text-sm text-muted-foreground">
              ~{metrics?.derived?.estimated_tokens_saved?.toLocaleString() || 0} tokens saved
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
