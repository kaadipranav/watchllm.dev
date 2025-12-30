/**
 * AI Observability Dashboard Component
 * Provides the main UI for viewing AI events, metrics, and alerts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Filter,
  Search,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

// Types for observability data
interface ObservabilityEvent {
  event_id: string;
  event_type: 'prompt_call' | 'agent_step' | 'error' | 'assertion_failed' | 'hallucination_detected';
  timestamp: string;
  run_id: string;
  user_id?: string;
  model?: string;
  status: 'success' | 'error' | 'timeout' | 'assertion_failed';
  latency_ms: number;
  cost_estimate_usd?: number;
  prompt?: string;
  response?: string;
  error?: {
    message: string;
    type?: string;
  };
  tags: string[];
}

interface ProjectMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  error_rate: number;
  top_models: Array<{
    model: string;
    count: number;
    cost_usd: number;
  }>;
}

interface ObservabilityDashboardProps {
  projectId: string;
  apiKey: string;
}

export function ObservabilityDashboard({ projectId, apiKey }: ObservabilityDashboardProps) {
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');

  // Load initial data
  useEffect(() => {
    loadMetrics();
    loadEvents();
  }, [projectId]);

  const loadMetrics = async () => {
    try {
      const response = await fetch(`/api/observability/projects/${projectId}/metrics`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load metrics');
      }

      const data = await response.json();
      setMetrics(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/observability/events/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          limit: 50,
          sort_by: 'timestamp',
          sort_order: 'desc'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to load events');
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm || 
      event.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.response?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.run_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesEventType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;

    return matchesSearch && matchesStatus && matchesEventType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      case 'assertion_failed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'prompt_call': return <Zap className="h-4 w-4" />;
      case 'agent_step': return <Activity className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'assertion_failed': return <CheckCircle className="h-4 w-4" />;
      case 'hallucination_detected': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.total_requests.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((metrics.successful_requests / metrics.total_requests) * 100).toFixed(1)}% success rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.total_cost_usd.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                This period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.avg_latency_ms.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.error_rate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {metrics.failed_requests} failed requests
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>
            Real-time observability events from your AI applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="assertion_failed">Assertion Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="prompt_call">Prompt Calls</SelectItem>
                <SelectItem value="agent_step">Agent Steps</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="assertion_failed">Assertions</SelectItem>
                <SelectItem value="hallucination_detected">Hallucinations</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading events...</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No events found matching your filters
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.event_id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getEventTypeIcon(event.event_type)}
                      <span className="font-medium">{event.event_type.replace('_', ' ')}</span>
                      <Badge variant="outline">{event.run_id}</Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {event.model && <span>{event.model}</span>}
                      <span>{new Date(event.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {event.prompt && (
                    <div className="text-sm">
                      <span className="font-medium">Prompt:</span>
                      <div className="bg-muted p-2 rounded mt-1 font-mono text-xs">
                        {event.prompt.substring(0, 200)}
                        {event.prompt.length > 200 && '...'}
                      </div>
                    </div>
                  )}

                  {event.response && (
                    <div className="text-sm">
                      <span className="font-medium">Response:</span>
                      <div className="bg-muted p-2 rounded mt-1 font-mono text-xs">
                        {event.response.substring(0, 200)}
                        {event.response.length > 200 && '...'}
                      </div>
                    </div>
                  )}

                  {event.error && (
                    <div className="text-sm">
                      <span className="font-medium text-red-600">Error:</span>
                      <div className="bg-red-50 p-2 rounded mt-1 text-red-800 text-xs">
                        {event.error.message}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Latency: {event.latency_ms}ms</span>
                    {event.cost_estimate_usd && (
                      <span>Cost: ${event.cost_estimate_usd.toFixed(4)}</span>
                    )}
                    {event.user_id && <span>User: {event.user_id}</span>}
                  </div>

                  {event.tags.length > 0 && (
                    <div className="flex gap-1">
                      {event.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
