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
import { validateObservabilityEvent, validateBatchObservabilityEvents } from '../lib/validation';
import { createAgentDebugIngestion, type AgentRunInput, type AgentStep } from './agent-debug';
import {
  LeaderboardStore,
  createLeaderboardEntry,
  validateShareRequest,
  generateSocialMetadata,
  type ShareAgentRequest,
  type LeaderboardFilter,
  type LeaderboardEntry,
} from '../lib/leaderboard';

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
observabilityApp.post('/v1/projects/:projectId/events', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    const validation = validateObservabilityEvent(body);

    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const event = validation.data;

    // Ensure project_id matches the URL parameter
    if (event.project_id !== projectId) {
      return c.json({ error: 'project_id in event does not match URL parameter' }, 400);
    }

    const ingestion = createObservabilityIngestion(c.env);
    const result = await ingestion.ingestEvent(projectId, event, apiKey);

    if (result.success) {
      return c.json({ success: true, event_id: event.event_id });
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/events/batch
 * Ingest multiple observability events
 */
observabilityApp.post('/v1/events/batch', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    const validation = validateBatchObservabilityEvents(body);

    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    const { events } = validation.data;

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
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

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

// ============================================================================
// Agent Debugger Routes
// ============================================================================

/**
 * POST /v1/agent-runs
 * Ingest a complete agent run with all steps
 * 
 * @feature AGENT_DEBUGGER_V1
 */
observabilityApp.post('/v1/agent-runs', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.run_id || typeof body.run_id !== 'string') {
      return c.json({ error: 'run_id is required and must be a string' }, 400);
    }
    if (!body.project_id || typeof body.project_id !== 'string') {
      return c.json({ error: 'project_id is required and must be a string' }, 400);
    }
    if (!body.agent_name || typeof body.agent_name !== 'string') {
      return c.json({ error: 'agent_name is required and must be a string' }, 400);
    }
    if (!body.started_at || typeof body.started_at !== 'string') {
      return c.json({ error: 'started_at is required and must be an ISO8601 timestamp' }, 400);
    }
    if (!body.status || !['running', 'completed', 'failed', 'cancelled'].includes(body.status)) {
      return c.json({ error: 'status is required and must be one of: running, completed, failed, cancelled' }, 400);
    }
    if (!Array.isArray(body.steps)) {
      return c.json({ error: 'steps is required and must be an array' }, 400);
    }

    // Validate steps
    const validStepTypes = ['user_input', 'decision', 'tool_call', 'tool_result', 'model_response', 'error', 'retry'];
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      if (typeof step.step_index !== 'number') {
        return c.json({ error: `steps[${i}].step_index is required and must be a number` }, 400);
      }
      if (!step.timestamp || typeof step.timestamp !== 'string') {
        return c.json({ error: `steps[${i}].timestamp is required and must be an ISO8601 timestamp` }, 400);
      }
      if (!step.type || !validStepTypes.includes(step.type)) {
        return c.json({ error: `steps[${i}].type is required and must be one of: ${validStepTypes.join(', ')}` }, 400);
      }
    }

    const agentRun: AgentRunInput = {
      run_id: body.run_id,
      started_at: body.started_at,
      ended_at: body.ended_at,
      user_id: body.user_id,
      project_id: body.project_id,
      agent_name: body.agent_name,
      status: body.status,
      steps: body.steps as AgentStep[],
      total_cost_usd: body.total_cost_usd,
      meta: body.meta,
    };

    const ingestion = createAgentDebugIngestion(c.env);
    const result = await ingestion.ingestRun(agentRun, apiKey);

    if (result.success) {
      return c.json({
        success: true,
        run_id: result.run_id,
        flags: result.flags,
        message: 'Agent run ingested successfully',
      }, 201);
    } else {
      return c.json({ error: result.error }, 400);
    }
  } catch (error) {
    console.error('[AgentRuns] Unexpected error:', error);
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/agent-runs/:runId/steps
 * Add steps to an existing agent run (for streaming)
 * 
 * @feature AGENT_DEBUGGER_V1
 */
observabilityApp.post('/v1/agent-runs/:runId/steps', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!Array.isArray(body.steps)) {
      return c.json({ error: 'steps is required and must be an array' }, 400);
    }

    // For now, return not implemented - full streaming support is Phase 2
    return c.json({
      error: 'Streaming steps not yet implemented. Please send complete runs to POST /v1/agent-runs',
      hint: 'Send all steps in the initial POST /v1/agent-runs request',
    }, 501);
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * PATCH /v1/agent-runs/:runId
 * Update an agent run status (e.g., mark as completed)
 * 
 * @feature AGENT_DEBUGGER_V1
 */
observabilityApp.patch('/v1/agent-runs/:runId', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // For now, return not implemented - status updates are Phase 2
    return c.json({
      error: 'Run updates not yet implemented. Please send complete runs to POST /v1/agent-runs',
      hint: 'Include ended_at and final status in the initial POST /v1/agent-runs request',
    }, 501);
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

// ============================================================================
// Agent Trace Replay Routes
// ============================================================================

import {
  type RunSnapshot,
  type StepSnapshot,
  type ReplayModification,
  type ReplayResult,
  type RunComparison,
  type ModificationRecord,
  type ModificationStats,
  createStepSnapshot,
  prepareReplayRequest,
  snapshotToRequest,
  compareRuns,
  calculateRunMetrics,
  createModificationRecord,
  calculateModificationStats,
  RunSnapshotStore,
  ModificationStore,
} from '../lib/traceReplay';

// In-memory stores for replay functionality
// In production, these would be backed by Supabase/ClickHouse
const snapshotStore = new RunSnapshotStore(1000);
const modificationStore = new ModificationStore(5000);

/**
 * POST /v1/agent-runs/:runId/snapshot
 * Store a full snapshot of an agent run for replay
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.post('/v1/agent-runs/:runId/snapshot', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.projectId || typeof body.projectId !== 'string') {
      return c.json({ error: 'projectId is required' }, 400);
    }
    if (!body.agentName || typeof body.agentName !== 'string') {
      return c.json({ error: 'agentName is required' }, 400);
    }
    if (!Array.isArray(body.steps)) {
      return c.json({ error: 'steps array is required' }, 400);
    }

    // Create the snapshot
    const snapshot: RunSnapshot = {
      runId,
      projectId: body.projectId,
      agentName: body.agentName,
      startedAt: body.startedAt || new Date().toISOString(),
      endedAt: body.endedAt,
      status: body.status || 'completed',
      steps: body.steps as StepSnapshot[],
      totalCostUsd: body.totalCostUsd || 0,
      totalTokens: body.totalTokens || 0,
      meta: body.meta,
    };

    snapshotStore.set(runId, snapshot);

    return c.json({
      success: true,
      runId,
      message: 'Snapshot stored successfully',
      stepCount: snapshot.steps.length,
    }, 201);
  } catch (error) {
    console.error('[TraceReplay] Snapshot storage error:', error);
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/agent-runs/:runId/snapshot
 * Get the stored snapshot for an agent run
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.get('/v1/agent-runs/:runId/snapshot', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  const snapshot = snapshotStore.get(runId);
  
  if (!snapshot) {
    return c.json({ error: 'Snapshot not found for this run' }, 404);
  }

  return c.json({
    success: true,
    snapshot,
    metrics: calculateRunMetrics(snapshot),
  });
});

/**
 * GET /v1/agent-runs/:runId/steps/:stepIndex/replay-context
 * Get the context needed to replay from a specific step
 * Returns the request snapshot and preceding context
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.get('/v1/agent-runs/:runId/steps/:stepIndex/replay-context', async (c) => {
  const runId = c.req.param('runId');
  const stepIndex = parseInt(c.req.param('stepIndex'), 10);
  const apiKey = c.get('apiKey');

  if (isNaN(stepIndex) || stepIndex < 0) {
    return c.json({ error: 'stepIndex must be a non-negative integer' }, 400);
  }

  const snapshot = snapshotStore.get(runId);
  
  if (!snapshot) {
    return c.json({ error: 'Snapshot not found for this run' }, 404);
  }

  if (stepIndex >= snapshot.steps.length) {
    return c.json({ 
      error: `Step ${stepIndex} not found. Run has ${snapshot.steps.length} steps (0-${snapshot.steps.length - 1})` 
    }, 404);
  }

  const step = snapshot.steps[stepIndex];
  const precedingSteps = snapshot.steps.slice(0, stepIndex);

  return c.json({
    success: true,
    runId,
    stepIndex,
    step,
    precedingSteps,
    replayableRequest: snapshotToRequest(step.request),
    hint: 'Use POST /v1/agent-runs/:runId/replay to execute a modified replay',
  });
});

/**
 * POST /v1/agent-runs/:runId/replay
 * Replay an agent run from a specific step with optional modifications
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.post('/v1/agent-runs/:runId/replay', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // Validate required fields
    const fromStepIndex = body.fromStepIndex;
    if (typeof fromStepIndex !== 'number' || fromStepIndex < 0) {
      return c.json({ error: 'fromStepIndex is required and must be a non-negative integer' }, 400);
    }

    const snapshot = snapshotStore.get(runId);
    if (!snapshot) {
      return c.json({ error: 'Snapshot not found for this run' }, 404);
    }

    if (fromStepIndex >= snapshot.steps.length) {
      return c.json({ 
        error: `Step ${fromStepIndex} not found. Run has ${snapshot.steps.length} steps` 
      }, 404);
    }

    // Build modification object
    const modification: ReplayModification = {
      fromStepIndex,
      modifiedMessages: body.modifiedMessages,
      modifiedTools: body.modifiedTools,
      modifiedParams: body.modifiedParams,
      modificationDescription: body.description,
    };

    // Prepare the replay request
    const replayRequest = prepareReplayRequest(snapshot, modification);
    const replayRunId = `replay_${runId}_${Date.now().toString(36)}`;

    // In a real implementation, we would:
    // 1. Execute the replay request through the proxy
    // 2. Continue the agent execution from this point
    // 3. Store the new run snapshot
    // 4. Create a modification record
    
    // For now, return the prepared request for client-side execution
    return c.json({
      success: true,
      originalRunId: runId,
      replayRunId,
      fromStepIndex,
      modification,
      replayRequest: snapshotToRequest(replayRequest),
      precedingSteps: snapshot.steps.slice(0, fromStepIndex),
      instructions: {
        step1: 'Execute replayRequest through your agent',
        step2: 'Continue agent execution from this point',
        step3: `POST the complete replay run to /v1/agent-runs/${replayRunId}/snapshot`,
        step4: `POST to /v1/agent-runs/${runId}/compare with replayRunId to get comparison`,
      },
    });
  } catch (error) {
    console.error('[TraceReplay] Replay error:', error);
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/agent-runs/:runId/compare
 * Compare original run with a replay run
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.post('/v1/agent-runs/:runId/compare', async (c) => {
  const originalRunId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    const replayRunId = body.replayRunId;
    if (!replayRunId || typeof replayRunId !== 'string') {
      return c.json({ error: 'replayRunId is required' }, 400);
    }

    const originalSnapshot = snapshotStore.get(originalRunId);
    if (!originalSnapshot) {
      return c.json({ error: 'Original run snapshot not found' }, 404);
    }

    const replaySnapshot = snapshotStore.get(replayRunId);
    if (!replaySnapshot) {
      return c.json({ error: 'Replay run snapshot not found' }, 404);
    }

    // Perform comparison
    const comparison = compareRuns(originalSnapshot, replaySnapshot);

    // Store modification record if fromStepIndex is provided
    if (typeof body.fromStepIndex === 'number') {
      const modificationRecord = createModificationRecord(
        originalRunId,
        replayRunId,
        body.fromStepIndex,
        body.modification || { fromStepIndex: body.fromStepIndex },
        comparison,
        originalSnapshot.projectId,
        body.userId
      );
      modificationStore.add(modificationRecord);
    }

    return c.json({
      success: true,
      originalRunId,
      replayRunId,
      comparison,
      summary: {
        improved: comparison.improved,
        improvementScore: comparison.improvementScore,
        costDiff: `${comparison.diff.costDiff >= 0 ? '+' : ''}$${comparison.diff.costDiff.toFixed(4)}`,
        costDiffPercent: `${comparison.diff.costDiffPercent >= 0 ? '+' : ''}${comparison.diff.costDiffPercent.toFixed(1)}%`,
        successRateDiff: `${comparison.diff.successRateDiff >= 0 ? '+' : ''}${comparison.diff.successRateDiff.toFixed(1)}%`,
        stepsChanged: comparison.stepDiffs.filter(d => d.diffType !== 'unchanged').length,
      },
    });
  } catch (error) {
    console.error('[TraceReplay] Comparison error:', error);
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/agent-runs/:runId/modifications
 * Get all modification records for an original run
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.get('/v1/agent-runs/:runId/modifications', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  const modifications = modificationStore.getByOriginalRun(runId);

  return c.json({
    success: true,
    runId,
    totalModifications: modifications.length,
    modifications: modifications.map(m => ({
      id: m.id,
      replayRunId: m.replayRunId,
      fromStepIndex: m.fromStepIndex,
      successful: m.successful,
      improvementScore: m.comparison.improvementScore,
      userRating: m.userRating,
      createdAt: m.createdAt,
    })),
  });
});

/**
 * GET /v1/projects/:projectId/modification-stats
 * Get modification statistics for a project
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.get('/v1/projects/:projectId/modification-stats', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const stats = modificationStore.getProjectStats(projectId);

  return c.json({
    success: true,
    projectId,
    stats: {
      totalModifications: stats.totalModifications,
      successfulModifications: stats.successfulModifications,
      successRate: `${stats.successRate.toFixed(1)}%`,
      avgImprovementScore: stats.avgImprovementScore.toFixed(3),
      topModificationTypes: stats.topModificationTypes,
    },
  });
});

/**
 * POST /v1/modifications/:modificationId/feedback
 * Add user feedback (rating/notes) to a modification
 * 
 * @feature AGENT_TRACE_REPLAY
 */
observabilityApp.post('/v1/modifications/:modificationId/feedback', async (c) => {
  const modificationId = c.req.param('modificationId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    const rating = body.rating;
    if (rating !== undefined && (typeof rating !== 'number' || rating < 1 || rating > 5)) {
      return c.json({ error: 'rating must be a number between 1 and 5' }, 400);
    }

    const notes = body.notes;
    if (notes !== undefined && typeof notes !== 'string') {
      return c.json({ error: 'notes must be a string' }, 400);
    }

    const success = modificationStore.updateUserFeedback(modificationId, rating, notes);
    
    if (!success) {
      return c.json({ error: 'Modification not found' }, 404);
    }

    return c.json({
      success: true,
      modificationId,
      message: 'Feedback recorded',
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

// ============================================================================
// Team Workspace API Routes
// @feature TEAM_WORKSPACE
// ============================================================================

import {
  type TeamMember,
  type ShareableLink,
  type TraceComment,
  type SlackWebhookConfig,
  type UserRole,
  TeamMemberStore,
  ShareLinkStore,
  CommentStore,
  hasPermission,
  canManageRole,
  getRoleDisplayName,
  createShareableLink,
  isShareLinkValid,
  isDomainAllowed,
  getShareUrl,
  createComment,
  extractMentions,
  getThreadSummary,
  sendSlackMessage,
  createRunFailedSlackMessage,
  createNewCommentSlackMessage,
  shouldNotifySlack,
  generateInviteToken,
  DEFAULT_WORKSPACE_SETTINGS,
  DEFAULT_SLACK_CONFIG,
} from '../lib/teamWorkspace';

// In-memory stores for team features
const teamMemberStore = new TeamMemberStore();
const shareLinkStore = new ShareLinkStore();
const commentStore = new CommentStore();

// ============================================================================
// Team Member Endpoints
// ============================================================================

/**
 * GET /v1/projects/:projectId/team
 * Get all team members for a project
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/projects/:projectId/team', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const members = teamMemberStore.getByProject(projectId);

  return c.json({
    success: true,
    projectId,
    totalMembers: members.length,
    members: members.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.email,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl,
      role: m.role,
      roleDisplayName: getRoleDisplayName(m.role),
      status: m.status,
      invitedAt: m.invitedAt,
      acceptedAt: m.acceptedAt,
    })),
  });
});

/**
 * POST /v1/projects/:projectId/team/invite
 * Invite a new team member
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/projects/:projectId/team/invite', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.email || typeof body.email !== 'string') {
      return c.json({ error: 'email is required' }, 400);
    }
    
    const role = body.role || 'viewer';
    if (!['admin', 'developer', 'viewer'].includes(role)) {
      return c.json({ error: 'role must be admin, developer, or viewer' }, 400);
    }

    const inviterId = body.inviterId || 'system';
    
    // Create the team member with pending status
    const member: TeamMember = {
      id: `member_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      userId: '', // Will be set when invitation is accepted
      email: body.email.toLowerCase(),
      displayName: body.displayName,
      role: role as UserRole,
      projectId,
      invitedBy: inviterId,
      invitedAt: new Date().toISOString(),
      status: 'pending',
    };

    teamMemberStore.add(member);

    const inviteToken = generateInviteToken();

    return c.json({
      success: true,
      message: 'Invitation sent',
      invitation: {
        memberId: member.id,
        email: member.email,
        role: member.role,
        roleDisplayName: getRoleDisplayName(member.role),
        inviteToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * PUT /v1/projects/:projectId/team/:memberId/role
 * Update a team member's role
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.put('/v1/projects/:projectId/team/:memberId/role', async (c) => {
  const projectId = c.req.param('projectId');
  const memberId = c.req.param('memberId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    const newRole = body.role;
    if (!newRole || !['admin', 'developer', 'viewer'].includes(newRole)) {
      return c.json({ error: 'role must be admin, developer, or viewer' }, 400);
    }

    const member = teamMemberStore.get(memberId);
    if (!member || member.projectId !== projectId) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    // Can't change owner role
    if (member.role === 'owner') {
      return c.json({ error: 'Cannot change owner role' }, 403);
    }

    const oldRole = member.role;
    const success = teamMemberStore.updateRole(memberId, newRole as UserRole);

    if (!success) {
      return c.json({ error: 'Failed to update role' }, 500);
    }

    return c.json({
      success: true,
      message: 'Role updated',
      member: {
        id: memberId,
        email: member.email,
        oldRole,
        newRole,
        roleDisplayName: getRoleDisplayName(newRole as UserRole),
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * DELETE /v1/projects/:projectId/team/:memberId
 * Remove a team member
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.delete('/v1/projects/:projectId/team/:memberId', async (c) => {
  const projectId = c.req.param('projectId');
  const memberId = c.req.param('memberId');
  const apiKey = c.get('apiKey');

  const member = teamMemberStore.get(memberId);
  if (!member || member.projectId !== projectId) {
    return c.json({ error: 'Team member not found' }, 404);
  }

  if (member.role === 'owner') {
    return c.json({ error: 'Cannot remove project owner' }, 403);
  }

  const success = teamMemberStore.remove(memberId);

  return c.json({
    success,
    message: success ? 'Team member removed' : 'Failed to remove member',
    removedMember: {
      id: memberId,
      email: member.email,
      role: member.role,
    },
  });
});

/**
 * GET /v1/users/:userId/teams
 * Get all teams/projects a user belongs to
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/users/:userId/teams', async (c) => {
  const userId = c.req.param('userId');
  const apiKey = c.get('apiKey');

  const memberships = teamMemberStore.getByUser(userId);

  return c.json({
    success: true,
    userId,
    totalTeams: memberships.length,
    teams: memberships.map(m => ({
      projectId: m.projectId,
      role: m.role,
      roleDisplayName: getRoleDisplayName(m.role),
      status: m.status,
      joinedAt: m.acceptedAt || m.invitedAt,
    })),
  });
});

// ============================================================================
// Shareable Link Endpoints
// ============================================================================

/**
 * POST /v1/agent-runs/:runId/share
 * Create a shareable link for a run
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/agent-runs/:runId/share', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    const projectId = body.projectId;
    if (!projectId || typeof projectId !== 'string') {
      return c.json({ error: 'projectId is required' }, 400);
    }

    const createdBy = body.createdBy || 'system';
    
    const link = createShareableLink(runId, projectId, createdBy, {
      accessLevel: body.accessLevel,
      expiresInHours: body.expiresInHours,
      password: body.password,
      message: body.message,
      allowedDomains: body.allowedDomains,
    });

    shareLinkStore.add(link);

    const baseUrl = body.baseUrl || 'https://watchllm.com';

    return c.json({
      success: true,
      link: {
        id: link.id,
        token: link.token,
        url: getShareUrl(link, baseUrl),
        accessLevel: link.accessLevel,
        expiresAt: link.expiresAt,
        hasPassword: !!link.password,
        allowedDomains: link.allowedDomains,
        createdAt: link.createdAt,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/shared/:token
 * Access a shared run via token
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/shared/:token', async (c) => {
  const token = c.req.param('token');

  const link = shareLinkStore.getByToken(token);
  
  if (!link) {
    return c.json({ error: 'Share link not found' }, 404);
  }

  if (!isShareLinkValid(link)) {
    return c.json({ 
      error: 'Share link has expired or been deactivated',
      expired: true,
    }, 410);
  }

  // Check password if required
  const password = c.req.query('password');
  if (link.password && link.password !== password) {
    return c.json({ 
      error: 'Password required',
      passwordRequired: true,
    }, 401);
  }

  // Check domain restriction if any
  const email = c.req.query('email');
  if (link.allowedDomains && link.allowedDomains.length > 0) {
    if (!email || !isDomainAllowed(link, email)) {
      return c.json({ 
        error: 'Access restricted to specific email domains',
        domainRestricted: true,
        allowedDomains: link.allowedDomains,
      }, 403);
    }
  }

  // Record access
  shareLinkStore.recordAccess(token);

  return c.json({
    success: true,
    runId: link.runId,
    accessLevel: link.accessLevel,
    message: link.message,
    viewCount: link.viewCount + 1,
  });
});

/**
 * GET /v1/agent-runs/:runId/shares
 * Get all share links for a run
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/agent-runs/:runId/shares', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  const links = shareLinkStore.getByRun(runId);

  return c.json({
    success: true,
    runId,
    totalLinks: links.length,
    links: links.map(l => ({
      id: l.id,
      token: l.token,
      accessLevel: l.accessLevel,
      isActive: l.isActive,
      isValid: isShareLinkValid(l),
      expiresAt: l.expiresAt,
      viewCount: l.viewCount,
      lastViewedAt: l.lastViewedAt,
      hasPassword: !!l.password,
      createdAt: l.createdAt,
      createdBy: l.createdBy,
    })),
  });
});

/**
 * DELETE /v1/shares/:linkId
 * Deactivate a share link
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.delete('/v1/shares/:linkId', async (c) => {
  const linkId = c.req.param('linkId');
  const apiKey = c.get('apiKey');

  const link = shareLinkStore.get(linkId);
  if (!link) {
    return c.json({ error: 'Share link not found' }, 404);
  }

  const success = shareLinkStore.deactivate(linkId);

  return c.json({
    success,
    message: success ? 'Share link deactivated' : 'Failed to deactivate',
    linkId,
  });
});

// ============================================================================
// Comment Endpoints
// ============================================================================

/**
 * GET /v1/agent-runs/:runId/comments
 * Get all comments for a run
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/agent-runs/:runId/comments', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');
  
  const stepIndex = c.req.query('stepIndex');

  let comments: TraceComment[];
  if (stepIndex !== undefined) {
    comments = commentStore.getByStep(runId, parseInt(stepIndex, 10));
  } else {
    comments = commentStore.getByRun(runId);
  }

  const summary = getThreadSummary(comments);

  return c.json({
    success: true,
    runId,
    stepIndex: stepIndex ? parseInt(stepIndex, 10) : undefined,
    summary,
    comments: comments.map(c => ({
      id: c.id,
      stepIndex: c.stepIndex,
      authorId: c.authorId,
      authorName: c.authorName,
      authorAvatarUrl: c.authorAvatarUrl,
      content: c.content,
      createdAt: c.createdAt,
      isEdited: c.isEdited,
      editedAt: c.editedAt,
      parentId: c.parentId,
      reactions: c.reactions,
      isResolved: c.isResolved,
      resolvedBy: c.resolvedBy,
      resolvedAt: c.resolvedAt,
    })),
  });
});

/**
 * POST /v1/agent-runs/:runId/comments
 * Add a comment to a run
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/agent-runs/:runId/comments', async (c) => {
  const runId = c.req.param('runId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.content || typeof body.content !== 'string') {
      return c.json({ error: 'content is required' }, 400);
    }
    
    if (!body.projectId || typeof body.projectId !== 'string') {
      return c.json({ error: 'projectId is required' }, 400);
    }

    const author = {
      id: body.authorId || 'anonymous',
      name: body.authorName || 'Anonymous',
      email: body.authorEmail || '',
      avatarUrl: body.authorAvatarUrl,
    };

    const comment = createComment(runId, body.projectId, author, body.content, {
      stepIndex: body.stepIndex,
      parentId: body.parentId,
    });

    commentStore.add(comment);

    return c.json({
      success: true,
      comment: {
        id: comment.id,
        runId: comment.runId,
        stepIndex: comment.stepIndex,
        content: comment.content,
        authorId: comment.authorId,
        authorName: comment.authorName,
        createdAt: comment.createdAt,
        mentions: comment.mentions,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * PUT /v1/comments/:commentId
 * Update a comment
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.put('/v1/comments/:commentId', async (c) => {
  const commentId = c.req.param('commentId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!body.content || typeof body.content !== 'string') {
      return c.json({ error: 'content is required' }, 400);
    }

    const existingComment = commentStore.get(commentId);
    if (!existingComment) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const success = commentStore.update(commentId, body.content);

    if (!success) {
      return c.json({ error: 'Failed to update comment' }, 500);
    }

    const updatedComment = commentStore.get(commentId);

    return c.json({
      success: true,
      comment: {
        id: updatedComment!.id,
        content: updatedComment!.content,
        isEdited: updatedComment!.isEdited,
        editedAt: updatedComment!.editedAt,
        mentions: extractMentions(updatedComment!.content),
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * DELETE /v1/comments/:commentId
 * Delete a comment
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.delete('/v1/comments/:commentId', async (c) => {
  const commentId = c.req.param('commentId');
  const apiKey = c.get('apiKey');

  const comment = commentStore.get(commentId);
  if (!comment) {
    return c.json({ error: 'Comment not found' }, 404);
  }

  const success = commentStore.delete(commentId);

  return c.json({
    success,
    message: success ? 'Comment deleted' : 'Failed to delete comment',
    commentId,
  });
});

/**
 * POST /v1/comments/:commentId/reactions
 * Add a reaction to a comment
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/comments/:commentId/reactions', async (c) => {
  const commentId = c.req.param('commentId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!body.emoji || typeof body.emoji !== 'string') {
      return c.json({ error: 'emoji is required' }, 400);
    }

    const success = commentStore.addReaction(commentId, body.emoji);

    if (!success) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const comment = commentStore.get(commentId);

    return c.json({
      success: true,
      reactions: comment!.reactions,
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * DELETE /v1/comments/:commentId/reactions/:emoji
 * Remove a reaction from a comment
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.delete('/v1/comments/:commentId/reactions/:emoji', async (c) => {
  const commentId = c.req.param('commentId');
  const emoji = c.req.param('emoji');
  const apiKey = c.get('apiKey');

  const success = commentStore.removeReaction(commentId, emoji);

  if (!success) {
    return c.json({ error: 'Comment or reaction not found' }, 404);
  }

  const comment = commentStore.get(commentId);

  return c.json({
    success: true,
    reactions: comment!.reactions,
  });
});

/**
 * POST /v1/comments/:commentId/resolve
 * Resolve a comment thread
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/comments/:commentId/resolve', async (c) => {
  const commentId = c.req.param('commentId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    const resolvedBy = body.resolvedBy || 'system';

    const success = commentStore.resolve(commentId, resolvedBy);

    if (!success) {
      return c.json({ error: 'Comment not found' }, 404);
    }

    const comment = commentStore.get(commentId);

    return c.json({
      success: true,
      comment: {
        id: comment!.id,
        isResolved: comment!.isResolved,
        resolvedBy: comment!.resolvedBy,
        resolvedAt: comment!.resolvedAt,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/comments/:commentId/unresolve
 * Unresolve a comment thread
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/comments/:commentId/unresolve', async (c) => {
  const commentId = c.req.param('commentId');
  const apiKey = c.get('apiKey');

  const success = commentStore.unresolve(commentId);

  if (!success) {
    return c.json({ error: 'Comment not found' }, 404);
  }

  return c.json({
    success: true,
    message: 'Comment unresolved',
    commentId,
  });
});

// ============================================================================
// Slack Integration Endpoints
// ============================================================================

/**
 * PUT /v1/projects/:projectId/integrations/slack
 * Configure Slack webhook for a project
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.put('/v1/projects/:projectId/integrations/slack', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!body.webhookUrl || typeof body.webhookUrl !== 'string') {
      return c.json({ error: 'webhookUrl is required' }, 400);
    }

    // Validate webhook URL format
    if (!body.webhookUrl.startsWith('https://hooks.slack.com/')) {
      return c.json({ error: 'Invalid Slack webhook URL format' }, 400);
    }

    const config: SlackWebhookConfig = {
      webhookUrl: body.webhookUrl,
      channel: body.channel,
      enabled: body.enabled !== false,
      events: body.events || DEFAULT_SLACK_CONFIG.events,
      minSeverity: body.minSeverity || DEFAULT_SLACK_CONFIG.minSeverity,
      digestMode: body.digestMode || false,
      digestTime: body.digestTime,
    };

    // TODO: Store in persistent storage (Supabase)
    // For now, just validate and return success

    return c.json({
      success: true,
      message: 'Slack integration configured',
      config: {
        webhookUrl: '***' + config.webhookUrl.slice(-20), // Mask URL
        channel: config.channel,
        enabled: config.enabled,
        events: config.events,
        minSeverity: config.minSeverity,
        digestMode: config.digestMode,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/projects/:projectId/integrations/slack/test
 * Send a test message to configured Slack webhook
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/projects/:projectId/integrations/slack/test', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!body.webhookUrl || typeof body.webhookUrl !== 'string') {
      return c.json({ error: 'webhookUrl is required' }, 400);
    }

    const testMessage = {
      blocks: [
        {
          type: 'header' as const,
          text: {
            type: 'plain_text' as const,
            text: '✅ WatchLLM Test Message',
            emoji: true,
          },
        },
        {
          type: 'section' as const,
          text: {
            type: 'mrkdwn' as const,
            text: `Your Slack integration is working! Project: *${projectId}*`,
          },
        },
        {
          type: 'context' as const,
          elements: [
            {
              type: 'mrkdwn',
              text: `Sent at ${new Date().toISOString()}`,
            },
          ],
        },
      ],
    };

    const result = await sendSlackMessage(body.webhookUrl, testMessage);

    if (result.success) {
      return c.json({
        success: true,
        message: 'Test message sent successfully',
      });
    } else {
      return c.json({
        success: false,
        error: result.error,
      }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/projects/:projectId/integrations/slack/notify
 * Manually send a notification to Slack
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.post('/v1/projects/:projectId/integrations/slack/notify', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    if (!body.webhookUrl || typeof body.webhookUrl !== 'string') {
      return c.json({ error: 'webhookUrl is required' }, 400);
    }
    
    if (!body.eventType || typeof body.eventType !== 'string') {
      return c.json({ error: 'eventType is required' }, 400);
    }

    const dashboardUrl = body.dashboardUrl || 'https://watchllm.com';
    let message;

    switch (body.eventType) {
      case 'run_failed':
        message = createRunFailedSlackMessage(
          body.runId || 'unknown',
          body.agentName || 'Unknown Agent',
          body.error || 'Unknown error',
          dashboardUrl
        );
        break;
      case 'new_comment':
        if (!body.comment) {
          return c.json({ error: 'comment object is required for new_comment event' }, 400);
        }
        message = createNewCommentSlackMessage(
          body.comment as TraceComment,
          body.runName || 'Unknown Run',
          dashboardUrl
        );
        break;
      default:
        return c.json({ 
          error: `Unsupported event type: ${body.eventType}. Supported: run_failed, new_comment` 
        }, 400);
    }

    const result = await sendSlackMessage(body.webhookUrl, message);

    if (result.success) {
      return c.json({
        success: true,
        message: 'Notification sent',
        eventType: body.eventType,
      });
    } else {
      return c.json({
        success: false,
        error: result.error,
      }, 400);
    }
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/projects/:projectId/team-stats
 * Get team activity statistics
 * 
 * @feature TEAM_WORKSPACE
 */
observabilityApp.get('/v1/projects/:projectId/team-stats', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const members = teamMemberStore.getByProject(projectId);
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingInvites = members.filter(m => m.status === 'pending');

  // Count by role
  const roleBreakdown: Record<string, number> = {};
  for (const member of members) {
    roleBreakdown[member.role] = (roleBreakdown[member.role] || 0) + 1;
  }

  return c.json({
    success: true,
    projectId,
    stats: {
      totalMembers: members.length,
      activeMembers: activeMembers.length,
      pendingInvites: pendingInvites.length,
      roleBreakdown,
      totalShareLinks: shareLinkStore.getSize(),
      totalComments: commentStore.getSize(),
    },
  });
});

// ============================================================================
// Custom Evaluation Pipeline API Routes
// @feature CUSTOM_EVALUATION
// ============================================================================

import {
  type EvaluationRuleSet,
  type EvaluationCriterion,
  type EvaluationInput,
  type EvaluationResult,
  RuleSetStore,
  ResultStore,
  EvaluationQueue,
  evaluateRuleSet,
  matchesFilter,
  shouldSample,
  checkAlertThreshold,
  createEvaluationAlertSlackMessage,
  toClickHouseRow,
  createRegexCriterion,
  createContainsCriterion,
  createLatencyCriterion,
  createCostCriterion,
  createRuleSet,
} from '../lib/evaluationPipeline';

// In-memory stores for evaluation features
const ruleSetStore = new RuleSetStore();
const resultStore = new ResultStore();
const evaluationQueue = new EvaluationQueue();

// In-memory store for leaderboard
const leaderboardStore = new LeaderboardStore();

// ============================================================================
// Rule Set Endpoints
// ============================================================================

/**
 * GET /v1/projects/:projectId/evaluations/rule-sets
 * List all evaluation rule sets for a project
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/projects/:projectId/evaluations/rule-sets', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const ruleSets = ruleSetStore.getByProject(projectId);

  return c.json({
    success: true,
    projectId,
    totalRuleSets: ruleSets.length,
    ruleSets: ruleSets.map(rs => ({
      id: rs.id,
      name: rs.name,
      description: rs.description,
      criteriaCount: rs.criteria.length,
      enabled: rs.enabled,
      async: rs.async,
      sampleRate: rs.sampleRate,
      hasAlerts: !!rs.alertConfig?.enabled,
      createdAt: rs.createdAt,
      updatedAt: rs.updatedAt,
    })),
  });
});

/**
 * POST /v1/projects/:projectId/evaluations/rule-sets
 * Create a new evaluation rule set
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/projects/:projectId/evaluations/rule-sets', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();

    if (!body.name || typeof body.name !== 'string') {
      return c.json({ error: 'name is required' }, 400);
    }

    if (!body.criteria || !Array.isArray(body.criteria)) {
      return c.json({ error: 'criteria array is required' }, 400);
    }

    const ruleSet = createRuleSet(projectId, body.name, body.criteria, {
      description: body.description,
      filter: body.filter,
      sampleRate: body.sampleRate,
      async: body.async,
    });

    if (body.alertConfig) {
      ruleSet.alertConfig = body.alertConfig;
    }

    ruleSetStore.add(ruleSet);
    evaluationQueue.addRuleSet(ruleSet);

    return c.json({
      success: true,
      ruleSet: {
        id: ruleSet.id,
        name: ruleSet.name,
        criteriaCount: ruleSet.criteria.length,
        createdAt: ruleSet.createdAt,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/evaluations/rule-sets/:ruleSetId
 * Get a specific rule set
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/evaluations/rule-sets/:ruleSetId', async (c) => {
  const ruleSetId = c.req.param('ruleSetId');
  const apiKey = c.get('apiKey');

  const ruleSet = ruleSetStore.get(ruleSetId);
  if (!ruleSet) {
    return c.json({ error: 'Rule set not found' }, 404);
  }

  return c.json({
    success: true,
    ruleSet,
  });
});

/**
 * PUT /v1/evaluations/rule-sets/:ruleSetId
 * Update a rule set
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.put('/v1/evaluations/rule-sets/:ruleSetId', async (c) => {
  const ruleSetId = c.req.param('ruleSetId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();

    const existing = ruleSetStore.get(ruleSetId);
    if (!existing) {
      return c.json({ error: 'Rule set not found' }, 404);
    }

    const updates: Partial<EvaluationRuleSet> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.criteria !== undefined) updates.criteria = body.criteria;
    if (body.filter !== undefined) updates.filter = body.filter;
    if (body.async !== undefined) updates.async = body.async;
    if (body.sampleRate !== undefined) updates.sampleRate = body.sampleRate;
    if (body.alertConfig !== undefined) updates.alertConfig = body.alertConfig;
    if (body.enabled !== undefined) updates.enabled = body.enabled;

    const success = ruleSetStore.update(ruleSetId, updates);

    if (!success) {
      return c.json({ error: 'Failed to update rule set' }, 500);
    }

    const updated = ruleSetStore.get(ruleSetId);

    return c.json({
      success: true,
      ruleSet: {
        id: updated!.id,
        name: updated!.name,
        enabled: updated!.enabled,
        updatedAt: updated!.updatedAt,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * DELETE /v1/evaluations/rule-sets/:ruleSetId
 * Delete a rule set
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.delete('/v1/evaluations/rule-sets/:ruleSetId', async (c) => {
  const ruleSetId = c.req.param('ruleSetId');
  const apiKey = c.get('apiKey');

  const ruleSet = ruleSetStore.get(ruleSetId);
  if (!ruleSet) {
    return c.json({ error: 'Rule set not found' }, 404);
  }

  const success = ruleSetStore.delete(ruleSetId);

  return c.json({
    success,
    message: success ? 'Rule set deleted' : 'Failed to delete',
    ruleSetId,
  });
});

// ============================================================================
// Evaluation Execution Endpoints
// ============================================================================

/**
 * POST /v1/evaluations/run
 * Run evaluation on a request/response
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/evaluations/run', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();

    if (!body.ruleSetId || typeof body.ruleSetId !== 'string') {
      return c.json({ error: 'ruleSetId is required' }, 400);
    }

    if (!body.input || typeof body.input !== 'object') {
      return c.json({ error: 'input object is required' }, 400);
    }

    const ruleSet = ruleSetStore.get(body.ruleSetId);
    if (!ruleSet) {
      return c.json({ error: 'Rule set not found' }, 404);
    }

    if (!ruleSet.enabled) {
      return c.json({ error: 'Rule set is disabled' }, 400);
    }

    const input: EvaluationInput = {
      requestId: body.input.requestId || `req_${Date.now()}`,
      projectId: ruleSet.projectId,
      runId: body.input.runId,
      agentName: body.input.agentName,
      model: body.input.model || 'unknown',
      path: body.input.path || '/v1/chat/completions',
      input: body.input.input || '',
      output: body.input.output || '',
      requestBody: body.input.requestBody,
      responseBody: body.input.responseBody,
      latencyMs: body.input.latencyMs || 0,
      cost: body.input.cost || 0,
      requestedAt: body.input.requestedAt || new Date().toISOString(),
      tags: body.input.tags,
    };

    // Check filter
    if (!matchesFilter(ruleSet.filter, input)) {
      return c.json({
        success: true,
        skipped: true,
        reason: 'Request does not match filter',
      });
    }

    // Check sample rate
    if (!shouldSample(ruleSet.sampleRate)) {
      return c.json({
        success: true,
        skipped: true,
        reason: 'Not sampled',
      });
    }

    // Run evaluation (async or sync)
    if (ruleSet.async && body.async !== false) {
      const jobId = evaluationQueue.enqueue(ruleSet.id, input);
      return c.json({
        success: true,
        async: true,
        jobId,
        message: 'Evaluation queued',
      });
    } else {
      const result = await evaluateRuleSet(ruleSet, input);
      resultStore.add(result);

      return c.json({
        success: true,
        result: {
          id: result.id,
          passed: result.passed,
          score: result.score,
          passedCount: result.passedCount,
          failedCount: result.failedCount,
          totalCount: result.totalCount,
          maxSeverity: result.maxSeverity,
          evaluationDurationMs: result.evaluationDurationMs,
          criteriaResults: result.criteriaResults.map(cr => ({
            criterionName: cr.criterionName,
            passed: cr.passed,
            score: cr.score,
            message: cr.message,
          })),
        },
      });
    }
  } catch (error) {
    console.error('[Evaluation] Run error:', error);
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * POST /v1/evaluations/run-batch
 * Run evaluations on multiple requests
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/evaluations/run-batch', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();

    if (!body.ruleSetId || typeof body.ruleSetId !== 'string') {
      return c.json({ error: 'ruleSetId is required' }, 400);
    }

    if (!body.inputs || !Array.isArray(body.inputs)) {
      return c.json({ error: 'inputs array is required' }, 400);
    }

    const ruleSet = ruleSetStore.get(body.ruleSetId);
    if (!ruleSet) {
      return c.json({ error: 'Rule set not found' }, 404);
    }

    const results: EvaluationResult[] = [];
    const skipped: string[] = [];

    for (const inputData of body.inputs) {
      const input: EvaluationInput = {
        requestId: inputData.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        projectId: ruleSet.projectId,
        runId: inputData.runId,
        agentName: inputData.agentName,
        model: inputData.model || 'unknown',
        path: inputData.path || '/v1/chat/completions',
        input: inputData.input || '',
        output: inputData.output || '',
        latencyMs: inputData.latencyMs || 0,
        cost: inputData.cost || 0,
        requestedAt: inputData.requestedAt || new Date().toISOString(),
      };

      if (!matchesFilter(ruleSet.filter, input) || !shouldSample(ruleSet.sampleRate)) {
        skipped.push(input.requestId);
        continue;
      }

      const result = await evaluateRuleSet(ruleSet, input);
      resultStore.add(result);
      results.push(result);
    }

    return c.json({
      success: true,
      totalInputs: body.inputs.length,
      evaluated: results.length,
      skipped: skipped.length,
      passRate: results.length > 0 
        ? results.filter(r => r.passed).length / results.length 
        : 1,
      avgScore: results.length > 0
        ? results.reduce((sum, r) => sum + r.score, 0) / results.length
        : 1,
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/evaluations/jobs/:jobId
 * Get status of an async evaluation job
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/evaluations/jobs/:jobId', async (c) => {
  const jobId = c.req.param('jobId');
  const apiKey = c.get('apiKey');

  const job = evaluationQueue.getJob(jobId);
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }

  return c.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      result: job.result ? {
        id: job.result.id,
        passed: job.result.passed,
        score: job.result.score,
      } : undefined,
      error: job.error,
    },
  });
});

/**
 * POST /v1/evaluations/process-queue
 * Process pending evaluation jobs (for worker/cron)
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/evaluations/process-queue', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    const maxJobs = body.maxJobs || 10;

    const processed: EvaluationResult[] = [];

    for (let i = 0; i < maxJobs; i++) {
      const result = await evaluationQueue.processNext();
      if (!result) break;
      resultStore.add(result);
      processed.push(result);
    }

    const stats = evaluationQueue.getStats();

    return c.json({
      success: true,
      processed: processed.length,
      passRate: processed.length > 0 
        ? processed.filter(r => r.passed).length / processed.length 
        : 1,
      queueStats: stats,
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

// ============================================================================
// Evaluation Results & Metrics Endpoints
// ============================================================================

/**
 * GET /v1/projects/:projectId/evaluations/results
 * Get evaluation results for a project
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/projects/:projectId/evaluations/results', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');
  
  const limit = parseInt(c.req.query('limit') || '100', 10);
  const ruleSetId = c.req.query('ruleSetId');

  let results: EvaluationResult[];
  if (ruleSetId) {
    results = resultStore.getByRuleSet(ruleSetId, limit);
  } else {
    results = resultStore.getByProject(projectId, limit);
  }

  return c.json({
    success: true,
    projectId,
    totalResults: results.length,
    results: results.map(r => ({
      id: r.id,
      ruleSetId: r.ruleSetId,
      requestId: r.requestId,
      model: r.model,
      passed: r.passed,
      score: r.score,
      passedCount: r.passedCount,
      failedCount: r.failedCount,
      maxSeverity: r.maxSeverity,
      evaluatedAt: r.evaluatedAt,
    })),
  });
});

/**
 * GET /v1/evaluations/results/:resultId
 * Get a specific evaluation result with details
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/evaluations/results/:resultId', async (c) => {
  const resultId = c.req.param('resultId');
  const apiKey = c.get('apiKey');

  const result = resultStore.get(resultId);
  if (!result) {
    return c.json({ error: 'Result not found' }, 404);
  }

  return c.json({
    success: true,
    result,
  });
});

/**
 * GET /v1/projects/:projectId/evaluations/metrics
 * Get aggregated evaluation metrics
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/projects/:projectId/evaluations/metrics', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');
  
  const ruleSetId = c.req.query('ruleSetId');

  const metrics = resultStore.getMetrics(projectId, ruleSetId);

  return c.json({
    success: true,
    metrics: {
      ...metrics,
      passRate: `${(metrics.passRate * 100).toFixed(1)}%`,
      avgScore: metrics.avgScore.toFixed(3),
    },
  });
});

/**
 * GET /v1/projects/:projectId/evaluations/dashboard
 * Get evaluation dashboard data
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/projects/:projectId/evaluations/dashboard', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const ruleSets = ruleSetStore.getByProject(projectId);
  const metrics = resultStore.getMetrics(projectId);
  const recentResults = resultStore.getByProject(projectId, 10);
  const queueStats = evaluationQueue.getStats();

  // Per-rule-set summary
  const ruleSetSummaries = ruleSets.map(rs => {
    const rsMetrics = resultStore.getMetrics(projectId, rs.id);
    return {
      id: rs.id,
      name: rs.name,
      enabled: rs.enabled,
      passRate: rsMetrics.passRate,
      totalEvaluations: rsMetrics.totalEvaluations,
      hasAlert: !!rs.alertConfig?.enabled,
    };
  });

  return c.json({
    success: true,
    dashboard: {
      overview: {
        totalRuleSets: ruleSets.length,
        enabledRuleSets: ruleSets.filter(rs => rs.enabled).length,
        totalEvaluations: metrics.totalEvaluations,
        overallPassRate: `${(metrics.passRate * 100).toFixed(1)}%`,
        avgScore: metrics.avgScore.toFixed(3),
      },
      queue: queueStats,
      ruleSets: ruleSetSummaries,
      scoreDistribution: metrics.scoreDistribution,
      modelMetrics: metrics.modelMetrics,
      recentResults: recentResults.map(r => ({
        id: r.id,
        ruleSetId: r.ruleSetId,
        passed: r.passed,
        score: r.score,
        model: r.model,
        evaluatedAt: r.evaluatedAt,
      })),
    },
  });
});

// ============================================================================
// Alert Endpoints
// ============================================================================

/**
 * POST /v1/evaluations/rule-sets/:ruleSetId/check-alerts
 * Check if alerts should fire for a rule set
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/evaluations/rule-sets/:ruleSetId/check-alerts', async (c) => {
  const ruleSetId = c.req.param('ruleSetId');
  const apiKey = c.get('apiKey');

  const ruleSet = ruleSetStore.get(ruleSetId);
  if (!ruleSet) {
    return c.json({ error: 'Rule set not found' }, 404);
  }

  if (!ruleSet.alertConfig) {
    return c.json({
      success: true,
      alertsEnabled: false,
      message: 'No alert configuration',
    });
  }

  const recentResults = resultStore.getByRuleSet(ruleSetId);
  const alertCheck = checkAlertThreshold(ruleSet.alertConfig, recentResults);

  if (alertCheck.shouldAlert) {
    // Update last alert time
    ruleSet.alertConfig.lastAlertAt = new Date().toISOString();

    // TODO: Actually send alert to channels
    // For now, return the alert info
    return c.json({
      success: true,
      alert: {
        triggered: true,
        passRate: `${(alertCheck.passRate * 100).toFixed(1)}%`,
        threshold: `${(ruleSet.alertConfig.passRateThreshold * 100).toFixed(1)}%`,
        sampleCount: alertCheck.sampleCount,
        message: createEvaluationAlertSlackMessage(
          ruleSet.name,
          alertCheck.passRate,
          ruleSet.alertConfig.passRateThreshold,
          alertCheck.sampleCount,
          'https://watchllm.com'
        ),
      },
    });
  }

  return c.json({
    success: true,
    alert: {
      triggered: false,
      passRate: `${(alertCheck.passRate * 100).toFixed(1)}%`,
      threshold: `${(ruleSet.alertConfig.passRateThreshold * 100).toFixed(1)}%`,
      sampleCount: alertCheck.sampleCount,
    },
  });
});

// ============================================================================
// Criterion Template Endpoints
// ============================================================================

/**
 * GET /v1/evaluations/criterion-templates
 * Get available criterion templates
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/evaluations/criterion-templates', async (c) => {
  return c.json({
    success: true,
    templates: [
      {
        type: 'regex_match',
        name: 'Regex Match',
        description: 'Check if response matches a regex pattern',
        example: { pattern: '^\\{.*\\}$', flags: 's' },
      },
      {
        type: 'contains',
        name: 'Contains',
        description: 'Check if response contains a substring',
        example: { substring: 'success', caseSensitive: false },
      },
      {
        type: 'json_schema',
        name: 'JSON Schema',
        description: 'Validate response against a JSON schema',
        example: { schema: { type: 'object', required: ['result'] } },
      },
      {
        type: 'latency_max',
        name: 'Max Latency',
        description: 'Check if latency is below threshold',
        example: { maxValue: 5000, unit: 'ms' },
      },
      {
        type: 'cost_max',
        name: 'Max Cost',
        description: 'Check if cost is below threshold',
        example: { maxValue: 0.10, unit: 'dollars' },
      },
      {
        type: 'sentiment',
        name: 'Sentiment',
        description: 'Check response sentiment',
        example: { expectedSentiment: 'positive' },
      },
      {
        type: 'pii_detection',
        name: 'PII Detection',
        description: 'Check for personally identifiable information',
        example: {},
      },
      {
        type: 'toxicity',
        name: 'Toxicity Check',
        description: 'Check for toxic content',
        example: {},
      },
    ],
  });
});

/**
 * POST /v1/evaluations/criterion-templates/create
 * Create a criterion from a template
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.post('/v1/evaluations/criterion-templates/create', async (c) => {
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();

    if (!body.type || typeof body.type !== 'string') {
      return c.json({ error: 'type is required' }, 400);
    }

    if (!body.name || typeof body.name !== 'string') {
      return c.json({ error: 'name is required' }, 400);
    }

    let criterion: EvaluationCriterion;

    switch (body.type) {
      case 'regex_match':
        criterion = createRegexCriterion(body.name, body.pattern || '.*', {
          flags: body.flags,
          severity: body.severity,
          weight: body.weight,
        });
        break;
      case 'contains':
        criterion = createContainsCriterion(body.name, body.substring || '', {
          caseSensitive: body.caseSensitive,
          severity: body.severity,
          weight: body.weight,
        });
        break;
      case 'latency_max':
        criterion = createLatencyCriterion(body.name, body.maxValue || 5000, {
          severity: body.severity,
          weight: body.weight,
        });
        break;
      case 'cost_max':
        criterion = createCostCriterion(body.name, body.maxValue || 0.10, {
          severity: body.severity,
          weight: body.weight,
        });
        break;
      default:
        return c.json({ error: `Unsupported template type: ${body.type}` }, 400);
    }

    return c.json({
      success: true,
      criterion,
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/projects/:projectId/evaluations/stats
 * Get evaluation statistics
 * 
 * @feature CUSTOM_EVALUATION
 */
observabilityApp.get('/v1/projects/:projectId/evaluations/stats', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const ruleSets = ruleSetStore.getByProject(projectId);
  const metrics = resultStore.getMetrics(projectId);
  const queueStats = evaluationQueue.getStats();

  return c.json({
    success: true,
    projectId,
    stats: {
      totalRuleSets: ruleSets.length,
      enabledRuleSets: ruleSets.filter(rs => rs.enabled).length,
      totalEvaluations: metrics.totalEvaluations,
      passRate: `${(metrics.passRate * 100).toFixed(1)}%`,
      failedCount: metrics.failedCount,
      avgScore: metrics.avgScore.toFixed(3),
      queuePending: queueStats.pending,
      queueCompleted: queueStats.completed,
      queueFailed: queueStats.failed,
    },
  });
});

// ============================================================================
// Leaderboard Endpoints
// ============================================================================

/**
 * POST /v1/projects/:projectId/leaderboard/share
 * Share agent to public leaderboard
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.post('/v1/projects/:projectId/leaderboard/share', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  try {
    const body: ShareAgentRequest = await c.req.json();
    
    // Validate request
    const validationError = validateShareRequest(body);
    if (validationError) {
      return c.json({ error: validationError }, 400);
    }

    // In production, fetch runs from ClickHouse/Supabase
    // For now, using mock data
    const mockRuns = body.runIds.map((runId, i) => ({
      id: runId,
      agent_name: body.agentName,
      status: i % 5 === 0 ? 'failed' : 'completed',
      success: i % 5 !== 0,
      cost: 0.01 + Math.random() * 0.05,
      latency_ms: 100 + Math.random() * 900,
      input: `Sample input ${i + 1}`,
      output: `Sample output ${i + 1}`,
    }));

    // Create leaderboard entry
    const userId = 'user_123'; // In production, extract from API key
    const entry = createLeaderboardEntry(body, userId, mockRuns);

    // Store entry
    leaderboardStore.add(entry);

    return c.json({
      success: true,
      entry: {
        id: entry.id,
        displayName: entry.displayName,
        displayAuthor: entry.displayAuthor,
        successRate: entry.successRate,
        avgCostPerTask: entry.avgCostPerTask,
        totalRuns: entry.totalRuns,
        sharedAt: entry.sharedAt,
        shareUrl: `https://watchllm.com/leaderboard/${entry.id}`,
      },
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/leaderboard
 * Get public leaderboard entries
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/leaderboard', async (c) => {
  const category = c.req.query('category');
  const tags = c.req.query('tags')?.split(',').filter(Boolean);
  const minSuccessRate = c.req.query('minSuccessRate') ? parseFloat(c.req.query('minSuccessRate')!) : undefined;
  const maxCostPerTask = c.req.query('maxCostPerTask') ? parseFloat(c.req.query('maxCostPerTask')!) : undefined;
  const sortBy = (c.req.query('sortBy') || 'popularity') as any;
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
  const offset = c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0;

  const filter: LeaderboardFilter = {
    category,
    tags,
    minSuccessRate,
    maxCostPerTask,
    sortBy,
    limit,
    offset,
  };

  const entries = leaderboardStore.filter(filter);
  const stats = leaderboardStore.getStats();

  return c.json({
    success: true,
    entries: entries.map(e => ({
      id: e.id,
      displayName: e.displayName,
      displayAuthor: e.displayAuthor,
      category: e.category,
      tags: e.tags,
      successRate: e.successRate,
      avgCostPerTask: e.avgCostPerTask,
      avgLatencyMs: e.avgLatencyMs,
      totalRuns: e.totalRuns,
      views: e.views,
      upvotes: e.upvotes,
      sharedAt: e.sharedAt,
    })),
    stats,
    pagination: {
      offset,
      limit,
      total: leaderboardStore.getPublic().length,
    },
  });
});

/**
 * GET /v1/leaderboard/featured
 * Get featured agents
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/leaderboard/featured', async (c) => {
  const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
  
  const featured = leaderboardStore.getFeatured().slice(0, limit);

  return c.json({
    success: true,
    featured: featured.map(e => ({
      id: e.id,
      displayName: e.displayName,
      displayAuthor: e.displayAuthor,
      description: e.agentDescription,
      category: e.category,
      tags: e.tags,
      successRate: e.successRate,
      avgCostPerTask: e.avgCostPerTask,
      avgLatencyMs: e.avgLatencyMs,
      totalRuns: e.totalRuns,
      views: e.views,
      upvotes: e.upvotes,
      featuredRank: e.featuredRank,
    })),
  });
});

/**
 * GET /v1/leaderboard/:entryId
 * Get leaderboard entry details
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/leaderboard/:entryId', async (c) => {
  const entryId = c.req.param('entryId');

  const entry = leaderboardStore.get(entryId);
  if (!entry || !entry.isPublic) {
    return c.json({ error: 'Entry not found' }, 404);
  }

  // Increment view count
  leaderboardStore.incrementViews(entryId);

  return c.json({
    success: true,
    entry: {
      id: entry.id,
      displayName: entry.displayName,
      displayAuthor: entry.displayAuthor,
      description: entry.agentDescription,
      category: entry.category,
      tags: entry.tags,
      successRate: entry.successRate,
      avgCostPerTask: entry.avgCostPerTask,
      avgLatencyMs: entry.avgLatencyMs,
      totalRuns: entry.totalRuns,
      sampleInputs: entry.sampleInputs,
      sampleOutputs: entry.sampleOutputs,
      views: entry.views + 1, // Include the current view
      upvotes: entry.upvotes,
      sharedAt: entry.sharedAt,
    },
  });
});

/**
 * POST /v1/leaderboard/:entryId/upvote
 * Upvote a leaderboard entry
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.post('/v1/leaderboard/:entryId/upvote', async (c) => {
  const entryId = c.req.param('entryId');

  const entry = leaderboardStore.get(entryId);
  if (!entry || !entry.isPublic) {
    return c.json({ error: 'Entry not found' }, 404);
  }

  // In production, track unique upvotes per user
  leaderboardStore.incrementUpvotes(entryId);

  return c.json({
    success: true,
    upvotes: entry.upvotes + 1,
  });
});

/**
 * DELETE /v1/leaderboard/:entryId
 * Remove entry from leaderboard (owner only)
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.delete('/v1/leaderboard/:entryId', async (c) => {
  const entryId = c.req.param('entryId');
  const apiKey = c.get('apiKey');

  const entry = leaderboardStore.get(entryId);
  if (!entry) {
    return c.json({ error: 'Entry not found' }, 404);
  }

  // In production, verify ownership via API key -> userId
  // For now, just delete
  const success = leaderboardStore.delete(entryId);

  if (!success) {
    return c.json({ error: 'Failed to delete entry' }, 500);
  }

  return c.json({
    success: true,
    message: 'Entry removed from leaderboard',
  });
});

/**
 * PUT /v1/leaderboard/:entryId
 * Update leaderboard entry (owner only)
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.put('/v1/leaderboard/:entryId', async (c) => {
  const entryId = c.req.param('entryId');
  const apiKey = c.get('apiKey');

  try {
    const body = await c.req.json();
    
    const entry = leaderboardStore.get(entryId);
    if (!entry) {
      return c.json({ error: 'Entry not found' }, 404);
    }

    // In production, verify ownership
    
    const updates: Partial<LeaderboardEntry> = {};
    if (body.displayName) updates.displayName = body.displayName;
    if (body.displayAuthor) updates.displayAuthor = body.displayAuthor;
    if (body.description) updates.agentDescription = body.description;
    if (body.category) updates.category = body.category;
    if (body.tags) updates.tags = body.tags;
    if (body.isPublic !== undefined) updates.isPublic = body.isPublic;

    const success = leaderboardStore.update(entryId, updates);

    if (!success) {
      return c.json({ error: 'Failed to update entry' }, 500);
    }

    return c.json({
      success: true,
      entry: leaderboardStore.get(entryId),
    });
  } catch (error) {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
});

/**
 * GET /v1/leaderboard/:entryId/metadata
 * Get social sharing metadata for entry
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/leaderboard/:entryId/metadata', async (c) => {
  const entryId = c.req.param('entryId');

  const entry = leaderboardStore.get(entryId);
  if (!entry || !entry.isPublic) {
    return c.json({ error: 'Entry not found' }, 404);
  }

  const baseUrl = 'https://watchllm.com'; // In production, use env var
  const metadata = generateSocialMetadata(entry, baseUrl);

  return c.json({
    success: true,
    metadata,
  });
});

/**
 * GET /v1/leaderboard/categories
 * Get available categories and their counts
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/leaderboard/categories', async (c) => {
  const stats = leaderboardStore.getStats();

  return c.json({
    success: true,
    categories: stats.categories,
  });
});

/**
 * GET /v1/projects/:projectId/leaderboard/entries
 * Get user's own leaderboard entries
 * 
 * @feature PUBLIC_LEADERBOARD
 */
observabilityApp.get('/v1/projects/:projectId/leaderboard/entries', async (c) => {
  const projectId = c.req.param('projectId');
  const apiKey = c.get('apiKey');

  const entries = leaderboardStore.getByProject(projectId);

  return c.json({
    success: true,
    entries: entries.map(e => ({
      id: e.id,
      agentName: e.agentName,
      displayName: e.displayName,
      isPublic: e.isPublic,
      isFeatured: e.isFeatured,
      successRate: e.successRate,
      avgCostPerTask: e.avgCostPerTask,
      totalRuns: e.totalRuns,
      views: e.views,
      upvotes: e.upvotes,
      sharedAt: e.sharedAt,
    })),
  });
});

export default observabilityApp;
