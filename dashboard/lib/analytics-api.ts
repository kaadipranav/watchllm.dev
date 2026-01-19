/**
 * Analytics API Client
 * Typed client for fetching analytics data from WatchLLM Worker API
 * Powers dashboard charts, tables, and metrics
 */

// ============================================================================
// Types
// ============================================================================

export interface AnalyticsStats {
  project_id: string;
  date_from: string;
  date_to: string;
  stats: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    total_tokens_input: number;
    total_tokens_output: number;
    total_cost_usd: string;
    avg_latency_ms: string;
    error_rate: string;
    unique_models: number;
  };
  top_models: Array<{
    model: string;
    request_count: number;
    total_cost: string;
  }>;
}

export interface TimeseriesDataPoint {
  timestamp: string;
  value: number;
}

export interface TimeseriesResponse {
  project_id: string;
  period: string;
  metric: string;
  date_from: string;
  date_to: string;
  data: TimeseriesDataPoint[];
}

export interface EventLog {
  event_id: string;
  run_id: string;
  timestamp: string;
  model: string;
  prompt: string;
  response: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate_usd: number;
  latency_ms: number;
  status: string;
  error_message: string | null;
  user_id: string | null;
  tags: string[];
}

export interface LogsResponse {
  project_id: string;
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
  logs: EventLog[];
}

export interface EventDetail {
  event: Record<string, any>;
  tool_calls: Array<Record<string, any>>;
}

export interface StatsQueryParams {
  project_id: string;
  date_from?: string;
  date_to?: string;
}

export interface TimeseriesQueryParams {
  project_id: string;
  period?: '1h' | '6h' | '24h' | '7d' | '30d';
  metric?: 'requests' | 'cost' | 'latency' | 'errors';
}

export interface LogsQueryParams {
  project_id: string;
  limit?: number;
  offset?: number;
  status?: string;
  model?: string;
  run_id?: string;
}

export interface EventQueryParams {
  project_id: string;
}

// ============================================================================
// API Client Configuration
// ============================================================================

export interface AnalyticsClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export class AnalyticsAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'AnalyticsAPIError';
  }
}

// ============================================================================
// Analytics API Client
// ============================================================================

export class AnalyticsAPIClient {
  private baseUrl: string;
  private apiKey: string | null;
  private timeout: number;

  constructor(config: AnalyticsClientConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.NEXT_PUBLIC_WORKER_URL || 'https://proxy.watchllm.dev').replace(/\/$/, '');
    this.apiKey = config.apiKey || null;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Set API key for authenticated requests
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Build request headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new AnalyticsAPIError(
          `HTTP ${response.status}: ${errorText}`,
          response.status,
          errorText
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AnalyticsAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new AnalyticsAPIError('Request timeout');
        }
        throw new AnalyticsAPIError(`Network error: ${error.message}`);
      }

      throw new AnalyticsAPIError('Unknown error occurred');
    }
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * GET /v1/analytics/stats
   * Fetch aggregated statistics for a project
   */
  async getStats(params: StatsQueryParams): Promise<AnalyticsStats> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<AnalyticsStats>(`/v1/analytics/stats${query}`);
  }

  /**
   * GET /v1/analytics/timeseries
   * Fetch time-series data for charts
   */
  async getTimeseries(params: TimeseriesQueryParams): Promise<TimeseriesResponse> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<TimeseriesResponse>(`/v1/analytics/timeseries${query}`);
  }

  /**
   * GET /v1/analytics/logs
   * Fetch event logs with filtering and pagination
   */
  async getLogs(params: LogsQueryParams): Promise<LogsResponse> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<LogsResponse>(`/v1/analytics/logs${query}`);
  }

  /**
   * GET /v1/analytics/event/:eventId
   * Fetch detailed information for a single event
   */
  async getEvent(eventId: string, params: EventQueryParams): Promise<EventDetail> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<EventDetail>(`/v1/analytics/event/${eventId}${query}`);
  }

  /**
   * Helper: Get stats for last 24 hours
   */
  async getStatsLast24h(projectId: string): Promise<AnalyticsStats> {
    const dateTo = new Date().toISOString();
    const dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    return this.getStats({
      project_id: projectId,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

  /**
   * Helper: Get stats for last 7 days
   */
  async getStatsLast7d(projectId: string): Promise<AnalyticsStats> {
    const dateTo = new Date().toISOString();
    const dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return this.getStats({
      project_id: projectId,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

  /**
   * Helper: Get stats for last 30 days
   */
  async getStatsLast30d(projectId: string): Promise<AnalyticsStats> {
    const dateTo = new Date().toISOString();
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    return this.getStats({
      project_id: projectId,
      date_from: dateFrom,
      date_to: dateTo,
    });
  }

  /**
   * Helper: Get recent logs (last 100)
   */
  async getRecentLogs(projectId: string, limit = 100): Promise<LogsResponse> {
    return this.getLogs({
      project_id: projectId,
      limit,
      offset: 0,
    });
  }

  /**
   * Helper: Get error logs only
   */
  async getErrorLogs(projectId: string, limit = 100): Promise<LogsResponse> {
    return this.getLogs({
      project_id: projectId,
      status: 'error',
      limit,
      offset: 0,
    });
  }

  /**
   * Helper: Get logs for specific model
   */
  async getModelLogs(
    projectId: string,
    model: string,
    limit = 100
  ): Promise<LogsResponse> {
    return this.getLogs({
      project_id: projectId,
      model,
      limit,
      offset: 0,
    });
  }

  /**
   * Helper: Get logs for specific run
   */
  async getRunLogs(projectId: string, runId: string): Promise<LogsResponse> {
    return this.getLogs({
      project_id: projectId,
      run_id: runId,
      limit: 1000, // Get all events in a run
      offset: 0,
    });
  }

  // ============================================================================
  // Agent Templates
  // ============================================================================

  /**
   * GET /v1/agent-templates
   * Fetch list of agent templates
   */
  async getAgentTemplates(params: {
    category?: string;
    tags?: string[];
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<any> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<any>(`/v1/agent-templates${query}`);
  }

  /**
   * POST /v1/agent-templates/:templateId/deploy
   * Deploy a template
   */
  async deployTemplate(templateId: string, projectId: string): Promise<any> {
    return this.fetchAPI<any>(`/v1/agent-templates/${templateId}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });
  }

  // ============================================================================
  // Agent Cost Attribution
  // ============================================================================

  /**
   * GET /v1/analytics/agents
   * Fetch agent cost summaries
   */
  async getAgentCostSummaries(params: {
    project_id: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const query = this.buildQueryString(params);
    return this.fetchAPI<any>(`/v1/analytics/agents${query}`);
  }
}

// ============================================================================
// Default Export & Factory Function
// ============================================================================

/**
 * Create a new analytics API client
 */
export function createAnalyticsClient(config?: AnalyticsClientConfig): AnalyticsAPIClient {
  return new AnalyticsAPIClient(config);
}

/**
 * Singleton client instance for use in React Server Components
 */
let defaultClient: AnalyticsAPIClient | null = null;

export function getAnalyticsClient(): AnalyticsAPIClient {
  if (!defaultClient) {
    defaultClient = new AnalyticsAPIClient();
  }
  return defaultClient;
}

export default AnalyticsAPIClient;
