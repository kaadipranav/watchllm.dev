/**
 * Analytics API Handlers
 * Provides query endpoints for ClickHouse-backed analytics
 * Powers the dashboard with real-time metrics and historical data
 */

import { Hono } from 'hono';
import type { Env } from '../types';
import { createClickHouseClient } from '../lib/clickhouse';
import { createSupabaseClient } from '../lib/supabase';

// Create the analytics sub-app
const analyticsApp = new Hono<{ 
  Bindings: Env;
  Variables: {
    apiKey: string;
    projectId?: string;
  };
}>();

// ============================================================================
// Middleware: Extract and validate API key
// ============================================================================
analyticsApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const apiKey = authHeader.substring(7);
  c.set('apiKey', apiKey);
  await next();
});

// ============================================================================
// Helper: Validate API key and project access
// ============================================================================
async function validateProjectAccess(
  env: Env,
  apiKey: string,
  projectId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const supabase = createSupabaseClient(env);
    const result = await supabase.validateAPIKey(apiKey);

    if (!result || !result.keyRecord || !result.project) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if project ID matches
    if (result.project.id !== projectId) {
      return { valid: false, error: 'Unauthorized access to project' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Authentication failed' };
  }
}

// ============================================================================
// GET /v1/analytics/stats
// Returns aggregated statistics for a project
// Query params: project_id, date_from?, date_to?
// ============================================================================
analyticsApp.get('/v1/analytics/stats', async (c) => {
  const projectId = c.req.query('project_id');
  if (!projectId) {
    return c.json({ error: 'project_id query parameter is required' }, 400);
  }

  // Validate access
  const apiKey = c.get('apiKey');
  const access = await validateProjectAccess(c.env, apiKey, projectId);
  if (!access.valid) {
    return c.json({ error: access.error || 'Unauthorized' }, 403);
  }

  // Parse date range (default: last 30 days)
  const dateTo = c.req.query('date_to') || new Date().toISOString();
  const dateFrom = c.req.query('date_from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const clickhouse = createClickHouseClient(c.env);

    // Query aggregated stats
    const query = `
      SELECT
        count() as total_requests,
        countIf(status = 'success') as successful_requests,
        countIf(status = 'error') as failed_requests,
        sum(tokens_input) as total_tokens_input,
        sum(tokens_output) as total_tokens_output,
        sum(cost_estimate_usd) as total_cost_usd,
        avg(latency_ms) as avg_latency_ms,
        countIf(status = 'error') / count() * 100 as error_rate,
        uniqExact(model) as unique_models,
        groupArray(model) as models_used
      FROM events
      WHERE project_id = {project_id:String}
        AND event_type = 'prompt_call'
        AND timestamp >= {date_from:DateTime64(3)}
        AND timestamp <= {date_to:DateTime64(3)}
    `;

    const resultSet = await clickhouse.query({
      query,
      query_params: {
        project_id: projectId,
        date_from: dateFrom,
        date_to: dateTo,
      },
      format: 'JSONEachRow',
    });

    const data = await resultSet.json<any>();
    const stats = data[0] || {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      total_tokens_input: 0,
      total_tokens_output: 0,
      total_cost_usd: 0,
      avg_latency_ms: 0,
      error_rate: 0,
      unique_models: 0,
      models_used: [],
    };

    // Get top models
    const topModelsQuery = `
      SELECT
        model,
        count() as request_count,
        sum(cost_estimate_usd) as total_cost
      FROM events
      WHERE project_id = {project_id:String}
        AND event_type = 'prompt_call'
        AND timestamp >= {date_from:DateTime64(3)}
        AND timestamp <= {date_to:DateTime64(3)}
        AND model IS NOT NULL
      GROUP BY model
      ORDER BY request_count DESC
      LIMIT 5
    `;

    const topModelsResult = await clickhouse.query({
      query: topModelsQuery,
      query_params: {
        project_id: projectId,
        date_from: dateFrom,
        date_to: dateTo,
      },
      format: 'JSONEachRow',
    });

    const topModels = await topModelsResult.json<any>();

    return c.json({
      project_id: projectId,
      date_from: dateFrom,
      date_to: dateTo,
      stats: {
        total_requests: Number(stats.total_requests),
        successful_requests: Number(stats.successful_requests),
        failed_requests: Number(stats.failed_requests),
        total_tokens_input: Number(stats.total_tokens_input),
        total_tokens_output: Number(stats.total_tokens_output),
        total_cost_usd: Number(stats.total_cost_usd).toFixed(4),
        avg_latency_ms: Number(stats.avg_latency_ms).toFixed(2),
        error_rate: Number(stats.error_rate).toFixed(2),
        unique_models: Number(stats.unique_models),
      },
      top_models: topModels.map((m: any) => ({
        model: m.model,
        request_count: Number(m.request_count),
        total_cost: Number(m.total_cost).toFixed(4),
      })),
    });
  } catch (error) {
    console.error('Analytics stats query failed:', error);
    return c.json({ error: 'Failed to fetch analytics stats' }, 500);
  }
});

// ============================================================================
// GET /v1/analytics/timeseries
// Returns time-series data for charts
// Query params: project_id, period (1h|6h|24h|7d|30d), metric (requests|cost|latency|errors)
// ============================================================================
analyticsApp.get('/v1/analytics/timeseries', async (c) => {
  const projectId = c.req.query('project_id');
  if (!projectId) {
    return c.json({ error: 'project_id query parameter is required' }, 400);
  }

  // Validate access
  const apiKey = c.get('apiKey');
  const access = await validateProjectAccess(c.env, apiKey, projectId);
  if (!access.valid) {
    return c.json({ error: access.error || 'Unauthorized' }, 403);
  }

  const period = c.req.query('period') || '24h';
  const metric = c.req.query('metric') || 'requests';

  // Calculate time range based on period
  const now = Date.now();
  const ranges: Record<string, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };

  const timeRange = ranges[period] || ranges['24h'];
  const dateFrom = new Date(now - timeRange).toISOString();
  const dateTo = new Date(now).toISOString();

  // Determine interval for grouping
  const intervals: Record<string, string> = {
    '1h': '5 MINUTE',
    '6h': '30 MINUTE',
    '24h': '1 HOUR',
    '7d': '6 HOUR',
    '30d': '1 DAY',
  };
  const interval = intervals[period] || '1 HOUR';

  try {
    const clickhouse = createClickHouseClient(c.env);

    // Build metric-specific query
    let metricSelect = '';
    switch (metric) {
      case 'cost':
        metricSelect = 'sum(cost_estimate_usd) as value';
        break;
      case 'latency':
        metricSelect = 'avg(latency_ms) as value';
        break;
      case 'errors':
        metricSelect = "countIf(status = 'error') as value";
        break;
      case 'requests':
      default:
        metricSelect = 'count() as value';
        break;
    }

    const query = `
      SELECT
        toStartOfInterval(timestamp, INTERVAL ${interval}) as time_bucket,
        ${metricSelect}
      FROM events
      WHERE project_id = {project_id:String}
        AND event_type = 'prompt_call'
        AND timestamp >= {date_from:DateTime64(3)}
        AND timestamp <= {date_to:DateTime64(3)}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC
    `;

    const resultSet = await clickhouse.query({
      query,
      query_params: {
        project_id: projectId,
        date_from: dateFrom,
        date_to: dateTo,
      },
      format: 'JSONEachRow',
    });

    const data = await resultSet.json<any>();

    return c.json({
      project_id: projectId,
      period,
      metric,
      date_from: dateFrom,
      date_to: dateTo,
      data: data.map((row: any) => ({
        timestamp: row.time_bucket,
        value: Number(row.value),
      })),
    });
  } catch (error) {
    console.error('Analytics timeseries query failed:', error);
    return c.json({ error: 'Failed to fetch timeseries data' }, 500);
  }
});

// ============================================================================
// GET /v1/analytics/logs
// Returns recent event logs with filtering
// Query params: project_id, limit?, offset?, status?, model?, run_id?
// ============================================================================
analyticsApp.get('/v1/analytics/logs', async (c) => {
  const projectId = c.req.query('project_id');
  if (!projectId) {
    return c.json({ error: 'project_id query parameter is required' }, 400);
  }

  // Validate access
  const apiKey = c.get('apiKey');
  const access = await validateProjectAccess(c.env, apiKey, projectId);
  if (!access.valid) {
    return c.json({ error: access.error || 'Unauthorized' }, 403);
  }

  const limit = parseInt(c.req.query('limit') || '100', 10);
  const offset = parseInt(c.req.query('offset') || '0', 10);
  const status = c.req.query('status');
  const model = c.req.query('model');
  const runId = c.req.query('run_id');

  try {
    const clickhouse = createClickHouseClient(c.env);

    // Build WHERE conditions
    const conditions = ['project_id = {project_id:String}', "event_type = 'prompt_call'"];
    const params: Record<string, any> = { project_id: projectId };

    if (status) {
      conditions.push('status = {status:String}');
      params.status = status;
    }
    if (model) {
      conditions.push('model = {model:String}');
      params.model = model;
    }
    if (runId) {
      conditions.push('run_id = {run_id:String}');
      params.run_id = runId;
    }

    const whereClause = conditions.join(' AND ');

    // Query for logs
    const query = `
      SELECT
        event_id,
        run_id,
        timestamp,
        model,
        prompt,
        response,
        tokens_input,
        tokens_output,
        cost_estimate_usd,
        latency_ms,
        status,
        error_message,
        user_id,
        tags
      FROM events
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT {limit:Int32}
      OFFSET {offset:Int32}
    `;

    params.limit = limit;
    params.offset = offset;

    const resultSet = await clickhouse.query({
      query,
      query_params: params,
      format: 'JSONEachRow',
    });

    const logs = await resultSet.json<any>();

    // Get total count for pagination
    const countQuery = `
      SELECT count() as total
      FROM events
      WHERE ${whereClause}
    `;

    const countResult = await clickhouse.query({
      query: countQuery,
      query_params: { project_id: projectId, ...(status && { status }), ...(model && { model }), ...(runId && { run_id: runId }) },
      format: 'JSONEachRow',
    });

    const countData = await countResult.json<any>();
    const total = Number(countData[0]?.total || 0);

    return c.json({
      project_id: projectId,
      total,
      limit,
      offset,
      has_more: offset + logs.length < total,
      logs: logs.map((log: any) => ({
        event_id: log.event_id,
        run_id: log.run_id,
        timestamp: log.timestamp,
        model: log.model,
        prompt: log.prompt,
        response: log.response,
        tokens_input: Number(log.tokens_input),
        tokens_output: Number(log.tokens_output),
        cost_estimate_usd: Number(log.cost_estimate_usd),
        latency_ms: Number(log.latency_ms),
        status: log.status,
        error_message: log.error_message,
        user_id: log.user_id,
        tags: log.tags,
      })),
    });
  } catch (error) {
    console.error('Analytics logs query failed:', error);
    return c.json({ error: 'Failed to fetch logs' }, 500);
  }
});

// ============================================================================
// GET /v1/analytics/event/:eventId
// Returns detailed information for a single event
// ============================================================================
analyticsApp.get('/v1/analytics/event/:eventId', async (c) => {
  const eventId = c.req.param('eventId');
  const projectId = c.req.query('project_id');
  
  if (!projectId) {
    return c.json({ error: 'project_id query parameter is required' }, 400);
  }

  // Validate access
  const apiKey = c.get('apiKey');
  const access = await validateProjectAccess(c.env, apiKey, projectId);
  if (!access.valid) {
    return c.json({ error: access.error || 'Unauthorized' }, 403);
  }

  try {
    const clickhouse = createClickHouseClient(c.env);

    // Query main event
    const eventQuery = `
      SELECT *
      FROM events
      WHERE event_id = {event_id:String}
        AND project_id = {project_id:String}
      LIMIT 1
    `;

    const eventResult = await clickhouse.query({
      query: eventQuery,
      query_params: {
        event_id: eventId,
        project_id: projectId,
      },
      format: 'JSONEachRow',
    });

    const events = await eventResult.json<any>();
    if (events.length === 0) {
      return c.json({ error: 'Event not found' }, 404);
    }

    const event = events[0];

    // Query associated tool calls
    const toolCallsQuery = `
      SELECT *
      FROM tool_calls
      WHERE event_id = {event_id:String}
        AND project_id = {project_id:String}
      ORDER BY timestamp ASC
    `;

    const toolCallsResult = await clickhouse.query({
      query: toolCallsQuery,
      query_params: {
        event_id: eventId,
        project_id: projectId,
      },
      format: 'JSONEachRow',
    });

    const toolCalls = await toolCallsResult.json<any>();

    return c.json({
      event,
      tool_calls: toolCalls,
    });
  } catch (error) {
    console.error('Analytics event detail query failed:', error);
    return c.json({ error: 'Failed to fetch event details' }, 500);
  }
});

export default analyticsApp;
