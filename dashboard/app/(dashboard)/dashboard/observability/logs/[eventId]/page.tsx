'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Zap, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { createAnalyticsClient, type EventDetail } from '@/lib/analytics-api';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function EventDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.eventId as string;
  const projectId = searchParams.get('project_id') || '';
  
  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !eventId) {
      setError('Missing project ID or event ID');
      setLoading(false);
      return;
    }
    
    fetchEventDetail();
  }, [projectId, eventId]);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analyticsClient = createAnalyticsClient();
      
      // Get API key from localStorage
      const apiKey = localStorage.getItem(`project_${projectId}_api_key`);
      if (apiKey) {
        analyticsClient.setApiKey(apiKey);
      }
      
      const response = await analyticsClient.getEvent(eventId, {
        project_id: projectId,
      });
      
      setEventDetail(response);
    } catch (err) {
      console.error('Failed to fetch event detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link href={`/dashboard/observability/logs?project_id=${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!eventDetail) {
    return null;
  }

  const event = eventDetail.event;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/observability/logs?project_id=${projectId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Logs
          </Button>
        </Link>
      </div>

      {/* Event Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Event Details
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <code className="text-xs font-mono">{event.event_id}</code>
                <button
                  onClick={() => copyToClipboard(event.event_id, 'event_id')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedField === 'event_id' ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </CardDescription>
            </div>
            <Badge variant="outline" className={getStatusColor(event.status)}>
              {event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="font-mono text-sm font-medium">{event.model}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Latency</p>
              </div>
              <p className="font-mono text-sm font-medium">{event.latency_ms}ms</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cost</p>
              </div>
              <p className="font-mono text-sm font-medium">
                ${Number(event.cost_estimate_usd).toFixed(6)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Tokens</p>
              </div>
              <p className="font-mono text-sm font-medium">
                {event.tokens_input} / {event.tokens_output}
              </p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-1 pt-4 border-t border-white/[0.08]">
            <p className="text-sm text-muted-foreground">Timestamp</p>
            <p className="text-sm font-medium">{formatTimestamp(event.timestamp)}</p>
          </div>

          {/* Run ID */}
          {event.run_id && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Run ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{event.run_id}</code>
                <button
                  onClick={() => copyToClipboard(event.run_id, 'run_id')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedField === 'run_id' ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* User ID & Tags */}
          <div className="flex gap-4 flex-wrap">
            {event.user_id && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">User ID</p>
                <code className="text-sm font-mono">{event.user_id}</code>
              </div>
            )}
            {event.tags && event.tags.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {event.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-black/20 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{event.prompt}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(event.prompt, 'prompt')}
              className="absolute top-2 right-2 p-2 rounded-md bg-black/40 hover:bg-black/60 transition-colors"
            >
              {copiedField === 'prompt' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Response</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-black/20 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{event.response}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(event.response, 'response')}
              className="absolute top-2 right-2 p-2 rounded-md bg-black/40 hover:bg-black/60 transition-colors"
            >
              {copiedField === 'response' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Error (if present) */}
      {event.error_message && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <pre className="mt-2 text-sm">{event.error_message}</pre>
          </AlertDescription>
        </Alert>
      )}

      {/* Tool Calls (if present) */}
      {eventDetail.tool_calls && eventDetail.tool_calls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tool Calls ({eventDetail.tool_calls.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {eventDetail.tool_calls.map((toolCall: any, index: number) => (
              <div key={index} className="border border-white/[0.08] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{toolCall.tool_name}</Badge>
                    {toolCall.tool_id && (
                      <code className="text-xs text-muted-foreground">{toolCall.tool_id}</code>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{toolCall.latency_ms}ms</span>
                    <Badge variant="outline" className={getStatusColor(toolCall.status)}>
                      {toolCall.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium mb-1">Input:</p>
                    <pre className="bg-black/20 rounded p-2 text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(toolCall.tool_input || '{}'), null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-1">Output:</p>
                    <pre className="bg-black/20 rounded p-2 text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(toolCall.tool_output || '{}'), null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Response Metadata (if present) */}
      {event.response_metadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-black/20 rounded-lg p-4 overflow-x-auto text-sm">
              {JSON.stringify(JSON.parse(event.response_metadata || '{}'), null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
