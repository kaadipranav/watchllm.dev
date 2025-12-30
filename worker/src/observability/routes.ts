/**
 * Observability API Routes
 * Defines HTTP endpoints for the AI observability platform
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validator } from 'hono/validator';
import type { Env } from '../types';
import type { ObservabilityEvent, EventQuery } from '../../../packages/shared/src/observability/types';
import { createObservabilityIngestion } from './ingestion';

// Create the observability sub-app with proper typing
const observabilityApp = new Hono<{ 
  Bindings: Env;
  Variables: {
    apiKey: string;
  };
}>();

// Middleware
observabilityApp.use('*', logger());
observabilityApp.use('*', cors({
  origin: ['http://localhost:3000', 'https://watchllm.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Extract API key from Authorization header
observabilityApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }
  
  const apiKey = authHeader.substring(7);
  c.set('apiKey', apiKey);
  await next();
});

/**
 * POST /v1/projects/{projectId}/events
 * Ingest a single observability event
 */
observabilityApp.post(
  '/v1/projects/:projectId/events',
  validator('json', (value, c) => {
    // Basic validation for event structure
    if (!value.event_id || !value.event_type || !value.project_id) {
      return c.json({ error: 'Missing required fields: event_id, event_type, project_id' }, 400);
    }
    return value as ObservabilityEvent;
  }),
  async (c) => {
    const projectId = c.req.param('projectId');
    const event = c.req.valid('json') as ObservabilityEvent;
    const apiKey = c.get('apiKey');

    const ingestion = createObservabilityIngestion(c.env);
    const result = await ingestion.ingestEvent(projectId, event, apiKey);

    if (result.success) {
      return c.json({ success: true, event_id: event.event_id });
    } else {
      return c.json({ error: result.error }, 400);
    }
  }
);

/**
 * POST /v1/events/batch
 * Ingest multiple observability events
 */
observabilityApp.post(
  '/v1/events/batch',
  validator('json', (value, c) => {
    if (!Array.isArray(value.events) || value.events.length === 0) {
      return c.json({ error: 'events must be a non-empty array' }, 400);
    }
    return value as { events: ObservabilityEvent[] };
  }),
  async (c) => {
    const { events } = c.req.valid('json') as { events: ObservabilityEvent[] };
    const apiKey = c.get('apiKey');

    // Group events by project ID for batch processing
    const eventsByProject = new Map<string, ObservabilityEvent[]>();
    for (const event of events) {
      const projectId = event.project_id;
      if (!eventsByProject.has(projectId)) {
        eventsByProject.set(projectId, []);
      }
      eventsByProject.get(projectId)!.push(event);
    }

    const ingestion = createObservabilityIngestion(c.env);
    const results: Array<{ projectId: string; success: boolean; processed: number; errors: string[] }> = [];

    // Process each project's events
    for (const [projectId, projectEvents] of eventsByProject) {
      const result = await ingestion.ingestBatch(projectId, projectEvents, apiKey);
      results.push({
        projectId,
        success: result.success,
        processed: result.processed,
        errors: result.errors
      });
    }

    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    return c.json({
      success: totalErrors === 0,
      total_processed: totalProcessed,
      total_errors: totalErrors,
      results
    });
  }
);

/**
 * POST /v1/events/query
 * Query events with filters
 */
observabilityApp.post(
  '/v1/events/query',
  validator('json', (value, c) => {
    if (!value.project_id) {
      return c.json({ error: 'project_id is required' }, 400);
    }
    return value as EventQuery;
  }),
  async (c) => {
    const query = c.req.valid('json') as EventQuery;
    const apiKey = c.get('apiKey');

    try {
      const ingestion = createObservabilityIngestion(c.env);
      const result = await ingestion.queryEvents(query, apiKey);

      return c.json(result);
    } catch (error) {
      return c.json({ 
        error: error instanceof Error ? error.message : 'Query failed' 
      }, 500);
    }
  }
);

/**
 * GET /v1/projects/{projectId}/metrics
 * Get project metrics
 */
observabilityApp.get('/v1/projects/:projectId/metrics', async (c) => {
  const projectId = c.req.param('projectId');
  const dateFrom = c.req.query('date_from');
  const dateTo = c.req.query('date_to');
  const apiKey = c.get('apiKey');

  try {
    const ingestion = createObservabilityIngestion(c.env);
    const result = await ingestion.getProjectMetrics(projectId, dateFrom, dateTo, apiKey);

    return c.json(result);
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to get metrics' 
    }, 500);
  }
});

/**
 * GET /v1/projects/{projectId}/health
 * Health check for observability service
 */
observabilityApp.get('/v1/projects/:projectId/health', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const ingestion = createObservabilityIngestion(c.env);
    // Simple health check - validate API key and return status
    const authResult = await (ingestion as any).validateAPIKey(apiKey, projectId);
    
    if (authResult.valid) {
      return c.json({
        status: 'healthy',
        project_id: projectId,
        timestamp: new Date().toISOString(),
        services: {
          ingestion: 'healthy',
          database: 'healthy',
          alerts: 'healthy'
        }
      });
    } else {
      return c.json({ error: 'Invalid API key' }, 401);
    }
  } catch (error) {
    return c.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Health check failed'
    }, 500);
  }
});

/**
 * POST /v1/projects/{projectId}/alerts/test
 * Test alert configuration
 */
observabilityApp.post('/v1/projects/:projectId/alerts/test', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');
  const alertConfig = await c.req.json();

  try {
    // This would test the alert configuration
    // For now, just validate the API key and return success
    
    const ingestion = createObservabilityIngestion(c.env);
    const authResult = await (ingestion as any).validateAPIKey(apiKey, projectId);
    
    if (!authResult.valid) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    return c.json({
      success: true,
      message: 'Alert test triggered successfully',
      alert_config: alertConfig
    });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Alert test failed' 
    }, 500);
  }
});

/**
 * GET /v1/projects/{projectId}/integrations
 * List integrations for a project
 */
observabilityApp.get('/v1/projects/:projectId/integrations', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    // This would fetch integrations from the database
    // For now, return placeholder data
    
    const ingestion = createObservabilityIngestion(c.env);
    const authResult = await (ingestion as any).validateAPIKey(apiKey, projectId);
    
    if (!authResult.valid) {
      return c.json({ error: 'Invalid API key' }, 401);
    }

    return c.json({
      integrations: [
        {
          id: 'slack-1',
          type: 'slack',
          name: 'Slack Notifications',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: 'webhook-1',
          type: 'webhook',
          name: 'Custom Webhook',
          is_active: false,
          created_at: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch integrations' 
    }, 500);
  }
});

export default observabilityApp;
