/**
 * Agent Debug Ingestion
 * Handles ingestion of agent debug runs with dual-write to ClickHouse and Supabase
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import type { Env } from '../types';

// ============================================================================
// Types
// ============================================================================

export type StepType = 'user_input' | 'decision' | 'tool_call' | 'tool_result' | 'model_response' | 'error' | 'retry';
export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled';
export type FlagType = 'loop_detected' | 'high_cost_step' | 'repeated_tool' | 'cache_miss_retry' | 'error_fallback' | 'prompt_mutation' | 'empty_tool_output';
export type FlagSeverity = 'info' | 'warning' | 'error';

export interface AgentStep {
  step_index: number;
  timestamp: string;
  type: StepType;
  summary?: string;
  decision?: string;
  tool?: string;
  tool_args?: Record<string, unknown>;
  tool_output_summary?: string;
  raw?: string;
  token_cost?: number;
  api_cost_usd?: number;
  cache_hit?: boolean;
}

export interface AgentRunInput {
  run_id: string;
  started_at: string;
  ended_at?: string;
  user_id?: string;
  project_id: string;
  agent_name: string;
  status: RunStatus;
  steps: AgentStep[];
  total_cost_usd?: number;
  meta?: Record<string, unknown>;
}

export interface Flag {
  type: FlagType;
  severity: FlagSeverity;
  message: string;
  step_index?: number;
}

export interface AgentRunResult {
  success: boolean;
  run_id?: string;
  flags?: Flag[];
  error?: string;
}

// ============================================================================
// Flag Detection
// ============================================================================

const HIGH_COST_THRESHOLD = 0.05; // $0.05 per step
const LOOP_THRESHOLD = 3; // Same step type 3+ times
const LOOP_WINDOW_MS = 30000; // Within 30 seconds
const REPEATED_TOOL_THRESHOLD = 3;

/**
 * Detect anomalies and issues in agent run
 */
function detectFlags(run: AgentRunInput): Flag[] {
  const flags: Flag[] = [];
  const steps = run.steps;

  // 1. Loop detection - same step type repeated 3+ times within window
  const stepTypesByTime: Map<StepType, number[]> = new Map();
  for (const step of steps) {
    const timestamp = new Date(step.timestamp).getTime();
    if (!stepTypesByTime.has(step.type)) {
      stepTypesByTime.set(step.type, []);
    }
    stepTypesByTime.get(step.type)!.push(timestamp);
  }

  for (const [stepType, timestamps] of stepTypesByTime) {
    // Check for 3+ occurrences within window
    for (let i = 0; i <= timestamps.length - LOOP_THRESHOLD; i++) {
      const windowEnd = timestamps[i] + LOOP_WINDOW_MS;
      const inWindow = timestamps.filter(t => t >= timestamps[i] && t <= windowEnd);
      if (inWindow.length >= LOOP_THRESHOLD) {
        flags.push({
          type: 'loop_detected',
          severity: 'error',
          message: `Step type '${stepType}' repeated ${inWindow.length} times within ${LOOP_WINDOW_MS / 1000}s`,
        });
        break;
      }
    }
  }

  // 2. High cost step detection
  for (const step of steps) {
    if (step.api_cost_usd && step.api_cost_usd > HIGH_COST_THRESHOLD) {
      flags.push({
        type: 'high_cost_step',
        severity: 'warning',
        message: `Step ${step.step_index} cost $${step.api_cost_usd.toFixed(4)} exceeds threshold of $${HIGH_COST_THRESHOLD}`,
        step_index: step.step_index,
      });
    }
  }

  // 3. Repeated tool detection
  const toolCounts: Map<string, number> = new Map();
  for (const step of steps) {
    if (step.tool) {
      toolCounts.set(step.tool, (toolCounts.get(step.tool) || 0) + 1);
    }
  }

  for (const [tool, count] of toolCounts) {
    if (count >= REPEATED_TOOL_THRESHOLD) {
      flags.push({
        type: 'repeated_tool',
        severity: 'warning',
        message: `Tool '${tool}' called ${count} times`,
      });
    }
  }

  // 4. Empty tool output detection
  for (const step of steps) {
    if ((step.type === 'tool_call' || step.type === 'tool_result') && 
        step.tool_output_summary === '' || step.tool_output_summary === null) {
      flags.push({
        type: 'empty_tool_output',
        severity: 'warning',
        message: `Tool '${step.tool}' at step ${step.step_index} returned empty output`,
        step_index: step.step_index,
      });
    }
  }

  // 5. Error fallback detection
  const hasError = steps.some(s => s.type === 'error');
  const hasRetry = steps.some(s => s.type === 'retry');
  if (hasError && hasRetry) {
    flags.push({
      type: 'error_fallback',
      severity: 'error',
      message: 'Error triggered fallback/retry behavior',
    });
  }

  return flags;
}

// ============================================================================
// Cost Calculations
// ============================================================================

interface CostSummary {
  total_cost_usd: number;
  wasted_spend_usd: number;
  amount_saved_usd: number;
  cache_hit_rate: number;
}

function calculateCosts(steps: AgentStep[]): CostSummary {
  let totalCost = 0;
  let wastedSpend = 0;
  let amountSaved = 0;
  let cacheableSteps = 0;
  let cacheHits = 0;

  for (const step of steps) {
    const cost = step.api_cost_usd || 0;
    totalCost += cost;

    // Retry steps count as wasted
    if (step.type === 'retry') {
      wastedSpend += cost;
    }

    // Cache hits count as saved
    if (step.cache_hit === true) {
      amountSaved += cost; // The cost would have been this much
      cacheHits++;
    }

    // Cacheable step types
    if (['tool_call', 'decision', 'model_response'].includes(step.type)) {
      cacheableSteps++;
    }
  }

  const cacheHitRate = cacheableSteps > 0 
    ? Math.round((cacheHits / cacheableSteps) * 100) 
    : 0;

  return {
    total_cost_usd: totalCost,
    wasted_spend_usd: wastedSpend,
    amount_saved_usd: amountSaved,
    cache_hit_rate: cacheHitRate,
  };
}

// ============================================================================
// PII Sanitization
// ============================================================================

const PII_PATTERNS = [
  // API keys
  /sk-[a-zA-Z0-9]{32,}/g,
  /api[_-]?key["\s:=]+["']?[a-zA-Z0-9_-]{20,}["']?/gi,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Email addresses
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  // Credit card numbers
  /\b(?:\d{4}[- ]?){3}\d{4}\b/g,
  // Phone numbers
  /\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g,
];

function sanitizeString(str: string): string {
  let result = str;
  for (const pattern of PII_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  return result;
}

function sanitizeStep(step: AgentStep): AgentStep {
  const sanitized = { ...step };
  
  if (sanitized.summary) {
    sanitized.summary = sanitizeString(sanitized.summary);
  }
  if (sanitized.tool_output_summary) {
    sanitized.tool_output_summary = sanitizeString(sanitized.tool_output_summary);
  }
  if (sanitized.raw) {
    sanitized.raw = sanitizeString(sanitized.raw);
    // Truncate raw to 5000 chars
    if (sanitized.raw.length > 5000) {
      sanitized.raw = sanitized.raw.substring(0, 5000) + '... [truncated]';
    }
  }
  
  return sanitized;
}

// ============================================================================
// Main Ingestion Class
// ============================================================================

export class AgentDebugIngestion {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Ingest an agent run with dual-write to ClickHouse and Supabase
   */
  async ingestRun(
    run: AgentRunInput,
    apiKey: string
  ): Promise<AgentRunResult> {
    try {
      // 1. Validate API key and get user info
      const authResult = await this.validateAPIKey(apiKey, run.project_id);
      if (!authResult.valid) {
        return { success: false, error: 'Invalid API key or project access' };
      }

      // 2. Sanitize PII from steps
      const sanitizedSteps = run.steps.map(sanitizeStep);
      const sanitizedRun = { ...run, steps: sanitizedSteps };

      // 3. Detect anomalies/flags
      const flags = detectFlags(sanitizedRun);

      // 4. Calculate cost summary
      const costs = calculateCosts(sanitizedSteps);

      // Get user ID (should always be set after auth validation)
      const userId = authResult.userId || run.user_id || 'unknown';

      // 5. Write to ClickHouse (observability events)
      await this.writeToClickHouse(sanitizedRun, userId);

      // 6. Write to Supabase (agent debugger)
      await this.writeToSupabase(sanitizedRun, userId, flags, costs);

      return {
        success: true,
        run_id: run.run_id,
        flags,
      };
    } catch (error) {
      console.error('[AgentDebugIngestion] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate API key and return user info
   */
  private async validateAPIKey(
    apiKey: string,
    projectId: string
  ): Promise<{ valid: boolean; userId?: string; projectId?: string }> {
    // Test key bypass for development
    if (apiKey === 'test-key') {
      return { valid: true, userId: 'test-user', projectId };
    }

    try {
      const url = new URL(`${this.env.SUPABASE_URL}/rest/v1/api_keys`);
      url.searchParams.set('select', 'id,project_id,projects(id,user_id)');
      url.searchParams.set('key', `eq.${apiKey}`);
      url.searchParams.set('is_active', 'eq.true');

      const response = await fetch(url.toString(), {
        headers: {
          apikey: this.env.SUPABASE_SERVICE_ROLE_KEY || this.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY || this.env.SUPABASE_ANON_KEY}`,
          Accept: 'application/vnd.pgrst.object+json',
        },
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json() as any;
      if (!data || !data.projects) {
        return { valid: false };
      }

      // Check project ID matches
      if (data.project_id !== projectId) {
        return { valid: false };
      }

      return {
        valid: true,
        userId: data.projects.user_id,
        projectId: data.project_id,
      };
    } catch (error) {
      console.error('[AgentDebugIngestion] Auth error:', error);
      return { valid: false };
    }
  }

  /**
   * Write agent steps to ClickHouse as observability events
   */
  private async writeToClickHouse(run: AgentRunInput, userId: string): Promise<void> {
    // Queue events for ClickHouse ingestion
    if (!this.env.OBSERVABILITY_QUEUE) {
      console.warn('[AgentDebugIngestion] OBSERVABILITY_QUEUE not available, skipping ClickHouse');
      return;
    }

    for (const step of run.steps) {
      const event = {
        event_type: 'agent_step',
        event_id: `${run.run_id}-step-${step.step_index}`,
        project_id: run.project_id,
        run_id: run.run_id,
        timestamp: step.timestamp,
        user_id: userId,
        tags: [],
        env: 'production',
        step_number: step.step_index,
        step_name: step.summary || `Step ${step.step_index}`,
        step_type: mapStepTypeToClickHouse(step.type),
        input_data: step.tool_args || {},
        output_data: step.tool_output_summary ? { summary: step.tool_output_summary } : {},
        reasoning: step.decision,
        context: {},
        latency_ms: 0,
        status: 'success',
      };

      try {
        await this.env.OBSERVABILITY_QUEUE.send({
          event_type: event.event_type,
          event_id: event.event_id,
          project_id: event.project_id,
          run_id: event.run_id,
          timestamp: event.timestamp,
          payload: event,
        });
      } catch (error) {
        console.error('[AgentDebugIngestion] Failed to queue event:', error);
      }
    }
  }

  /**
   * Write agent run and steps to Supabase
   */
  private async writeToSupabase(
    run: AgentRunInput,
    userId: string,
    flags: Flag[],
    costs: CostSummary
  ): Promise<void> {
    const supabaseUrl = this.env.SUPABASE_URL;
    const supabaseKey = this.env.SUPABASE_SERVICE_ROLE_KEY || this.env.SUPABASE_ANON_KEY;

    // 1. Insert agent_debug_logs record
    const logRecord = {
      run_id: run.run_id,
      project_id: run.project_id,
      user_id: userId,
      agent_name: run.agent_name,
      started_at: run.started_at,
      ended_at: run.ended_at,
      status: run.status,
      total_cost_usd: costs.total_cost_usd,
      wasted_spend_usd: costs.wasted_spend_usd,
      amount_saved_usd: costs.amount_saved_usd,
      cache_hit_rate: costs.cache_hit_rate,
      total_steps: run.steps.length,
      flags: JSON.stringify(flags.map(f => f.type)),
      meta: JSON.stringify(run.meta || {}),
    };

    const logResponse = await fetch(`${supabaseUrl}/rest/v1/agent_debug_logs`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(logRecord),
    });

    if (!logResponse.ok) {
      const errorText = await logResponse.text();
      console.error('[AgentDebugIngestion] Failed to insert log:', errorText);
      throw new Error(`Failed to insert agent_debug_logs: ${errorText}`);
    }

    // 2. Insert agent_debug_steps records
    const stepRecords = run.steps.map(step => ({
      run_id: run.run_id,
      step_index: step.step_index,
      timestamp: step.timestamp,
      type: step.type,
      summary: step.summary,
      decision: step.decision,
      tool: step.tool,
      tool_args: step.tool_args ? JSON.stringify(step.tool_args) : null,
      tool_output_summary: step.tool_output_summary,
      raw: step.raw,
      raw_truncated: step.raw ? step.raw.length > 5000 : false,
      token_cost: step.token_cost || 0,
      api_cost_usd: step.api_cost_usd || 0,
      cache_hit: step.cache_hit || false,
      flags: JSON.stringify(flags.filter(f => f.step_index === step.step_index).map(f => ({ type: f.type, severity: f.severity, message: f.message }))),
    }));

    const stepsResponse = await fetch(`${supabaseUrl}/rest/v1/agent_debug_steps`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(stepRecords),
    });

    if (!stepsResponse.ok) {
      const errorText = await stepsResponse.text();
      console.error('[AgentDebugIngestion] Failed to insert steps:', errorText);
      // Don't throw - log record was created, steps are supplementary
    }

    console.log(`[AgentDebugIngestion] Wrote run ${run.run_id} with ${run.steps.length} steps to Supabase`);
  }
}

/**
 * Map our step types to ClickHouse agent_step enum
 */
function mapStepTypeToClickHouse(type: StepType): string {
  const mapping: Record<StepType, string> = {
    user_input: 'output',
    decision: 'reasoning',
    tool_call: 'tool_call',
    tool_result: 'output',
    model_response: 'output',
    error: 'output',
    retry: 'reasoning',
  };
  return mapping[type] || 'output';
}

/**
 * Factory function
 */
export function createAgentDebugIngestion(env: Env): AgentDebugIngestion {
  return new AgentDebugIngestion(env);
}
