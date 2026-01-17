/**
 * Agent Trace Replay & Modification System
 * 
 * Enables replaying agent traces from any step with modifications.
 * Features:
 * - Store full request/response snapshots for each step
 * - Replay from any step ("Replay from here")
 * - Edit prompts, tools, and parameters before replay
 * - Diff comparison between original and modified runs
 * - Track modification success rates
 * 
 * @feature AGENT_TRACE_REPLAY
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Full snapshot of a request at a specific step
 */
export interface RequestSnapshot {
  /** Step index this snapshot is from */
  stepIndex: number;
  /** Original timestamp */
  timestamp: string;
  /** The model used */
  model: string;
  /** Full messages array at this point */
  messages: ChatMessage[];
  /** Temperature setting */
  temperature?: number;
  /** Max tokens setting */
  maxTokens?: number;
  /** Top-p setting */
  topP?: number;
  /** Tools/functions available */
  tools?: ToolDefinition[];
  /** Tool choice setting */
  toolChoice?: string | { type: string; function?: { name: string } };
  /** Response format */
  responseFormat?: { type: string };
  /** Any other parameters */
  additionalParams?: Record<string, unknown>;
}

/**
 * Full snapshot of a response
 */
export interface ResponseSnapshot {
  /** Step index this snapshot is from */
  stepIndex: number;
  /** Response timestamp */
  timestamp: string;
  /** The model that responded */
  model: string;
  /** Response message content */
  content: string | null;
  /** Tool calls made */
  toolCalls?: ToolCall[];
  /** Function call (legacy) */
  functionCall?: { name: string; arguments: string };
  /** Finish reason */
  finishReason: string | null;
  /** Token usage */
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Cost in USD */
  costUsd: number;
  /** Latency in ms */
  latencyMs: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  functionCall?: { name: string; arguments: string };
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

/**
 * Complete step snapshot (request + response)
 */
export interface StepSnapshot {
  stepIndex: number;
  stepType: 'model_call' | 'tool_call' | 'tool_result' | 'user_input' | 'decision';
  request: RequestSnapshot;
  response: ResponseSnapshot;
  /** Cached from original run? */
  wasCached: boolean;
  /** Any errors that occurred */
  error?: {
    type: string;
    message: string;
    code?: string;
  };
}

/**
 * Complete run snapshot (all steps)
 */
export interface RunSnapshot {
  runId: string;
  projectId: string;
  agentName: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: StepSnapshot[];
  totalCostUsd: number;
  totalTokens: number;
  /** Metadata for the run */
  meta?: Record<string, unknown>;
}

/**
 * Modification request for replay
 */
export interface ReplayModification {
  /** Which step to start replay from */
  fromStepIndex: number;
  /** Modified messages (if any) */
  modifiedMessages?: ChatMessage[];
  /** Modified tools (if any) */
  modifiedTools?: ToolDefinition[];
  /** Modified parameters */
  modifiedParams?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    toolChoice?: string | { type: string; function?: { name: string } };
    responseFormat?: { type: string };
  };
  /** Description of what was changed */
  modificationDescription?: string;
}

/**
 * Replay result
 */
export interface ReplayResult {
  /** New run ID for the replayed run */
  replayRunId: string;
  /** Original run ID */
  originalRunId: string;
  /** Step we replayed from */
  fromStepIndex: number;
  /** The replay run snapshot */
  replaySnapshot: RunSnapshot;
  /** Comparison metrics */
  comparison: RunComparison;
  /** Timestamp of replay */
  replayedAt: string;
}

/**
 * Comparison between original and replayed runs
 */
export interface RunComparison {
  /** Original run ID */
  originalRunId: string;
  /** Replay run ID */
  replayRunId: string;
  /** Original run metrics */
  original: RunMetrics;
  /** Replay run metrics */
  replay: RunMetrics;
  /** Difference metrics */
  diff: DiffMetrics;
  /** Step-by-step diffs */
  stepDiffs: StepDiff[];
  /** Was this modification an improvement? */
  improved: boolean;
  /** Improvement score (-1 to 1, where 1 is major improvement) */
  improvementScore: number;
}

export interface RunMetrics {
  totalSteps: number;
  successfulSteps: number;
  failedSteps: number;
  totalCostUsd: number;
  totalTokens: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  cacheHitRate: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

export interface DiffMetrics {
  stepCountDiff: number;
  costDiff: number;
  costDiffPercent: number;
  tokenDiff: number;
  latencyDiff: number;
  successRateDiff: number;
}

export interface StepDiff {
  stepIndex: number;
  /** Type of difference */
  diffType: 'added' | 'removed' | 'modified' | 'unchanged';
  /** What changed in this step */
  changes: StepChange[];
  /** Original step (if exists) */
  original?: StepSnapshot;
  /** Replay step (if exists) */
  replay?: StepSnapshot;
}

export interface StepChange {
  field: string;
  changeType: 'added' | 'removed' | 'modified';
  originalValue?: unknown;
  newValue?: unknown;
  /** Human-readable description */
  description: string;
}

/**
 * Modification history entry
 */
export interface ModificationRecord {
  id: string;
  originalRunId: string;
  replayRunId: string;
  fromStepIndex: number;
  modification: ReplayModification;
  comparison: RunComparison;
  /** Was this modification successful? */
  successful: boolean;
  /** User-provided rating (1-5) */
  userRating?: number;
  /** User notes */
  userNotes?: string;
  createdAt: string;
  projectId: string;
  userId?: string;
}

/**
 * Modification success tracking
 */
export interface ModificationStats {
  totalModifications: number;
  successfulModifications: number;
  successRate: number;
  /** Average improvement score */
  avgImprovementScore: number;
  /** Most common modification types */
  topModificationTypes: Array<{
    type: string;
    count: number;
    successRate: number;
  }>;
  /** Modifications by step type */
  byStepType: Map<string, {
    count: number;
    successRate: number;
    avgImprovement: number;
  }>;
}

// ============================================================================
// Snapshot Creation Functions
// ============================================================================

/**
 * Create a request snapshot from a chat completion request
 */
export function createRequestSnapshot(
  stepIndex: number,
  request: Record<string, unknown>,
  timestamp: string = new Date().toISOString()
): RequestSnapshot {
  return {
    stepIndex,
    timestamp,
    model: String(request.model || 'unknown'),
    messages: (request.messages as ChatMessage[]) || [],
    temperature: request.temperature as number | undefined,
    maxTokens: request.max_tokens as number | undefined,
    topP: request.top_p as number | undefined,
    tools: request.tools as ToolDefinition[] | undefined,
    toolChoice: request.tool_choice as string | undefined,
    responseFormat: request.response_format as { type: string } | undefined,
    additionalParams: extractAdditionalParams(request),
  };
}

/**
 * Extract any additional parameters not explicitly captured
 */
function extractAdditionalParams(request: Record<string, unknown>): Record<string, unknown> {
  const knownKeys = new Set([
    'model', 'messages', 'temperature', 'max_tokens', 'top_p',
    'tools', 'tool_choice', 'response_format', 'stream',
    'n', 'stop', 'presence_penalty', 'frequency_penalty', 'logit_bias', 'user'
  ]);
  
  const additional: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(request)) {
    if (!knownKeys.has(key)) {
      additional[key] = value;
    }
  }
  
  return Object.keys(additional).length > 0 ? additional : {};
}

/**
 * Create a response snapshot from a chat completion response
 */
export function createResponseSnapshot(
  stepIndex: number,
  response: Record<string, unknown>,
  latencyMs: number,
  costUsd: number,
  timestamp: string = new Date().toISOString()
): ResponseSnapshot {
  const choice = ((response.choices as unknown[]) || [])[0] as Record<string, unknown> | undefined;
  const message = choice?.message as Record<string, unknown> | undefined;
  const usage = response.usage as Record<string, number> | undefined;

  return {
    stepIndex,
    timestamp,
    model: String(response.model || 'unknown'),
    content: message?.content as string | null ?? null,
    toolCalls: message?.tool_calls as ToolCall[] | undefined,
    functionCall: message?.function_call as { name: string; arguments: string } | undefined,
    finishReason: (choice?.finish_reason as string) || null,
    usage: {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    },
    costUsd,
    latencyMs,
  };
}

/**
 * Create a complete step snapshot
 */
export function createStepSnapshot(
  stepIndex: number,
  stepType: StepSnapshot['stepType'],
  request: Record<string, unknown>,
  response: Record<string, unknown>,
  latencyMs: number,
  costUsd: number,
  wasCached: boolean = false,
  error?: { type: string; message: string; code?: string }
): StepSnapshot {
  return {
    stepIndex,
    stepType,
    request: createRequestSnapshot(stepIndex, request),
    response: createResponseSnapshot(stepIndex, response, latencyMs, costUsd),
    wasCached,
    error,
  };
}

// ============================================================================
// Replay Functions
// ============================================================================

/**
 * Prepare a replay request from a snapshot with modifications
 */
export function prepareReplayRequest(
  snapshot: RunSnapshot,
  modification: ReplayModification
): RequestSnapshot {
  const fromStep = snapshot.steps[modification.fromStepIndex];
  if (!fromStep) {
    throw new Error(`Step ${modification.fromStepIndex} not found in snapshot`);
  }

  const baseRequest = fromStep.request;
  
  return {
    ...baseRequest,
    stepIndex: modification.fromStepIndex,
    timestamp: new Date().toISOString(),
    // Apply modifications
    messages: modification.modifiedMessages || baseRequest.messages,
    tools: modification.modifiedTools || baseRequest.tools,
    model: modification.modifiedParams?.model || baseRequest.model,
    temperature: modification.modifiedParams?.temperature ?? baseRequest.temperature,
    maxTokens: modification.modifiedParams?.maxTokens ?? baseRequest.maxTokens,
    topP: modification.modifiedParams?.topP ?? baseRequest.topP,
    toolChoice: modification.modifiedParams?.toolChoice ?? baseRequest.toolChoice,
    responseFormat: modification.modifiedParams?.responseFormat ?? baseRequest.responseFormat,
  };
}

/**
 * Convert a request snapshot back to API request format
 */
export function snapshotToRequest(snapshot: RequestSnapshot): Record<string, unknown> {
  const request: Record<string, unknown> = {
    model: snapshot.model,
    messages: snapshot.messages,
  };

  if (snapshot.temperature !== undefined) request.temperature = snapshot.temperature;
  if (snapshot.maxTokens !== undefined) request.max_tokens = snapshot.maxTokens;
  if (snapshot.topP !== undefined) request.top_p = snapshot.topP;
  if (snapshot.tools) request.tools = snapshot.tools;
  if (snapshot.toolChoice) request.tool_choice = snapshot.toolChoice;
  if (snapshot.responseFormat) request.response_format = snapshot.responseFormat;

  // Add any additional params
  if (snapshot.additionalParams) {
    Object.assign(request, snapshot.additionalParams);
  }

  return request;
}

// ============================================================================
// Diff and Comparison Functions
// ============================================================================

/**
 * Calculate metrics for a run
 */
export function calculateRunMetrics(snapshot: RunSnapshot): RunMetrics {
  const steps = snapshot.steps;
  
  let successfulSteps = 0;
  let failedSteps = 0;
  let totalTokens = 0;
  let totalLatencyMs = 0;
  let cacheHits = 0;

  for (const step of steps) {
    if (step.error) {
      failedSteps++;
    } else {
      successfulSteps++;
    }
    totalTokens += step.response.usage.totalTokens;
    totalLatencyMs += step.response.latencyMs;
    if (step.wasCached) cacheHits++;
  }

  return {
    totalSteps: steps.length,
    successfulSteps,
    failedSteps,
    totalCostUsd: snapshot.totalCostUsd,
    totalTokens,
    totalLatencyMs,
    avgLatencyMs: steps.length > 0 ? totalLatencyMs / steps.length : 0,
    cacheHitRate: steps.length > 0 ? (cacheHits / steps.length) * 100 : 0,
    status: snapshot.status,
  };
}

/**
 * Calculate diff metrics between two runs
 */
export function calculateDiffMetrics(original: RunMetrics, replay: RunMetrics): DiffMetrics {
  const costDiff = replay.totalCostUsd - original.totalCostUsd;
  const costDiffPercent = original.totalCostUsd > 0 
    ? ((costDiff / original.totalCostUsd) * 100) 
    : 0;

  const originalSuccessRate = original.totalSteps > 0 
    ? (original.successfulSteps / original.totalSteps) * 100 
    : 0;
  const replaySuccessRate = replay.totalSteps > 0 
    ? (replay.successfulSteps / replay.totalSteps) * 100 
    : 0;

  return {
    stepCountDiff: replay.totalSteps - original.totalSteps,
    costDiff,
    costDiffPercent,
    tokenDiff: replay.totalTokens - original.totalTokens,
    latencyDiff: replay.totalLatencyMs - original.totalLatencyMs,
    successRateDiff: replaySuccessRate - originalSuccessRate,
  };
}

/**
 * Deep compare two values and describe the difference
 */
function compareValues(field: string, original: unknown, replay: unknown): StepChange | null {
  // Both undefined/null - no change
  if (original === undefined && replay === undefined) return null;
  if (original === null && replay === null) return null;

  // Added
  if ((original === undefined || original === null) && replay !== undefined && replay !== null) {
    return {
      field,
      changeType: 'added',
      newValue: replay,
      description: `Added ${field}`,
    };
  }

  // Removed
  if (original !== undefined && original !== null && (replay === undefined || replay === null)) {
    return {
      field,
      changeType: 'removed',
      originalValue: original,
      description: `Removed ${field}`,
    };
  }

  // Compare values
  const originalStr = JSON.stringify(original);
  const replayStr = JSON.stringify(replay);

  if (originalStr !== replayStr) {
    return {
      field,
      changeType: 'modified',
      originalValue: original,
      newValue: replay,
      description: `Modified ${field}`,
    };
  }

  return null;
}

/**
 * Compare two steps and return differences
 */
export function compareSteps(original: StepSnapshot | undefined, replay: StepSnapshot | undefined): StepDiff {
  // If both exist, compare them
  if (original && replay) {
    const changes: StepChange[] = [];

    // Compare request fields
    const requestChanges: Array<[string, unknown, unknown]> = [
      ['model', original.request.model, replay.request.model],
      ['temperature', original.request.temperature, replay.request.temperature],
      ['maxTokens', original.request.maxTokens, replay.request.maxTokens],
      ['messages', original.request.messages, replay.request.messages],
      ['tools', original.request.tools, replay.request.tools],
      ['toolChoice', original.request.toolChoice, replay.request.toolChoice],
    ];

    for (const [field, origVal, replayVal] of requestChanges) {
      const change = compareValues(`request.${field}`, origVal, replayVal);
      if (change) changes.push(change);
    }

    // Compare response fields
    const responseChanges: Array<[string, unknown, unknown]> = [
      ['content', original.response.content, replay.response.content],
      ['toolCalls', original.response.toolCalls, replay.response.toolCalls],
      ['finishReason', original.response.finishReason, replay.response.finishReason],
    ];

    for (const [field, origVal, replayVal] of responseChanges) {
      const change = compareValues(`response.${field}`, origVal, replayVal);
      if (change) changes.push(change);
    }

    // Always note cost/latency differences
    if (original.response.costUsd !== replay.response.costUsd) {
      changes.push({
        field: 'response.costUsd',
        changeType: 'modified',
        originalValue: original.response.costUsd,
        newValue: replay.response.costUsd,
        description: `Cost changed from $${original.response.costUsd.toFixed(4)} to $${replay.response.costUsd.toFixed(4)}`,
      });
    }

    if (Math.abs(original.response.latencyMs - replay.response.latencyMs) > 50) {
      changes.push({
        field: 'response.latencyMs',
        changeType: 'modified',
        originalValue: original.response.latencyMs,
        newValue: replay.response.latencyMs,
        description: `Latency changed from ${original.response.latencyMs}ms to ${replay.response.latencyMs}ms`,
      });
    }

    return {
      stepIndex: original.stepIndex,
      diffType: changes.length > 0 ? 'modified' : 'unchanged',
      changes,
      original,
      replay,
    };
  }

  // Only original exists - removed in replay
  if (original && !replay) {
    return {
      stepIndex: original.stepIndex,
      diffType: 'removed',
      changes: [{
        field: 'step',
        changeType: 'removed',
        originalValue: original.stepType,
        description: `Step ${original.stepIndex} was removed`,
      }],
      original,
    };
  }

  // Only replay exists - added
  if (!original && replay) {
    return {
      stepIndex: replay.stepIndex,
      diffType: 'added',
      changes: [{
        field: 'step',
        changeType: 'added',
        newValue: replay.stepType,
        description: `Step ${replay.stepIndex} was added`,
      }],
      replay,
    };
  }

  // Neither exists (shouldn't happen)
  throw new Error('Both original and replay steps are undefined');
}

/**
 * Compare two complete runs
 */
export function compareRuns(original: RunSnapshot, replay: RunSnapshot): RunComparison {
  const originalMetrics = calculateRunMetrics(original);
  const replayMetrics = calculateRunMetrics(replay);
  const diff = calculateDiffMetrics(originalMetrics, replayMetrics);

  // Compare steps
  const stepDiffs: StepDiff[] = [];
  const maxSteps = Math.max(original.steps.length, replay.steps.length);

  for (let i = 0; i < maxSteps; i++) {
    const origStep = original.steps[i];
    const replayStep = replay.steps[i];
    stepDiffs.push(compareSteps(origStep, replayStep));
  }

  // Calculate improvement score
  // Positive factors: lower cost, faster, higher success rate
  // Negative factors: more errors, slower
  let improvementScore = 0;
  
  // Cost improvement (weight: 0.3)
  if (diff.costDiffPercent < 0) {
    improvementScore += Math.min(0.3, Math.abs(diff.costDiffPercent) / 100 * 0.3);
  } else {
    improvementScore -= Math.min(0.3, diff.costDiffPercent / 100 * 0.3);
  }

  // Success rate improvement (weight: 0.4)
  improvementScore += (diff.successRateDiff / 100) * 0.4;

  // Latency improvement (weight: 0.2)
  const latencyImprovement = originalMetrics.totalLatencyMs > 0 
    ? -diff.latencyDiff / originalMetrics.totalLatencyMs 
    : 0;
  improvementScore += Math.max(-0.2, Math.min(0.2, latencyImprovement * 0.2));

  // Status improvement (weight: 0.1)
  if (replayMetrics.status === 'completed' && originalMetrics.status !== 'completed') {
    improvementScore += 0.1;
  } else if (replayMetrics.status !== 'completed' && originalMetrics.status === 'completed') {
    improvementScore -= 0.1;
  }

  const improved = improvementScore > 0;

  return {
    originalRunId: original.runId,
    replayRunId: replay.runId,
    original: originalMetrics,
    replay: replayMetrics,
    diff,
    stepDiffs,
    improved,
    improvementScore: Math.max(-1, Math.min(1, improvementScore)),
  };
}

// ============================================================================
// Modification Tracking
// ============================================================================

/**
 * Create a modification record
 */
export function createModificationRecord(
  originalRunId: string,
  replayRunId: string,
  fromStepIndex: number,
  modification: ReplayModification,
  comparison: RunComparison,
  projectId: string,
  userId?: string
): ModificationRecord {
  return {
    id: generateModificationId(),
    originalRunId,
    replayRunId,
    fromStepIndex,
    modification,
    comparison,
    successful: comparison.improved,
    createdAt: new Date().toISOString(),
    projectId,
    userId,
  };
}

/**
 * Generate a unique modification ID
 */
function generateModificationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `mod_${timestamp}_${random}`;
}

/**
 * Calculate modification statistics from records
 */
export function calculateModificationStats(records: ModificationRecord[]): ModificationStats {
  if (records.length === 0) {
    return {
      totalModifications: 0,
      successfulModifications: 0,
      successRate: 0,
      avgImprovementScore: 0,
      topModificationTypes: [],
      byStepType: new Map(),
    };
  }

  let successfulModifications = 0;
  let totalImprovementScore = 0;
  const modificationTypes = new Map<string, { count: number; successful: number }>();
  const byStepType = new Map<string, { count: number; successful: number; totalImprovement: number }>();

  for (const record of records) {
    if (record.successful) successfulModifications++;
    totalImprovementScore += record.comparison.improvementScore;

    // Track modification types
    const modType = categorizeModification(record.modification);
    const typeStats = modificationTypes.get(modType) || { count: 0, successful: 0 };
    typeStats.count++;
    if (record.successful) typeStats.successful++;
    modificationTypes.set(modType, typeStats);

    // Track by step type (from the step being modified)
    const stepType = record.modification.fromStepIndex.toString();
    const stepStats = byStepType.get(stepType) || { count: 0, successful: 0, totalImprovement: 0 };
    stepStats.count++;
    if (record.successful) stepStats.successful++;
    stepStats.totalImprovement += record.comparison.improvementScore;
    byStepType.set(stepType, stepStats);
  }

  // Sort modification types by count
  const topModificationTypes = Array.from(modificationTypes.entries())
    .map(([type, stats]) => ({
      type,
      count: stats.count,
      successRate: (stats.successful / stats.count) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Convert byStepType to include success rate
  const byStepTypeWithRates = new Map<string, { count: number; successRate: number; avgImprovement: number }>();
  for (const [stepType, stats] of byStepType) {
    byStepTypeWithRates.set(stepType, {
      count: stats.count,
      successRate: (stats.successful / stats.count) * 100,
      avgImprovement: stats.totalImprovement / stats.count,
    });
  }

  return {
    totalModifications: records.length,
    successfulModifications,
    successRate: (successfulModifications / records.length) * 100,
    avgImprovementScore: totalImprovementScore / records.length,
    topModificationTypes,
    byStepType: byStepTypeWithRates,
  };
}

/**
 * Categorize a modification type based on what was changed
 */
function categorizeModification(modification: ReplayModification): string {
  const categories: string[] = [];

  if (modification.modifiedMessages) {
    categories.push('messages');
  }
  if (modification.modifiedTools) {
    categories.push('tools');
  }
  if (modification.modifiedParams?.model) {
    categories.push('model');
  }
  if (modification.modifiedParams?.temperature !== undefined) {
    categories.push('temperature');
  }
  if (modification.modifiedParams?.maxTokens !== undefined) {
    categories.push('max_tokens');
  }

  return categories.length > 0 ? categories.join('+') : 'unknown';
}

// ============================================================================
// In-Memory Stores
// ============================================================================

/**
 * In-memory store for run snapshots
 */
export class RunSnapshotStore {
  private snapshots: Map<string, RunSnapshot> = new Map();
  private maxSnapshots: number;

  constructor(maxSnapshots: number = 1000) {
    this.maxSnapshots = maxSnapshots;
  }

  /**
   * Store a run snapshot
   */
  set(runId: string, snapshot: RunSnapshot): void {
    // Evict oldest if at capacity
    if (this.snapshots.size >= this.maxSnapshots) {
      const oldest = this.snapshots.keys().next().value;
      if (oldest) this.snapshots.delete(oldest);
    }
    this.snapshots.set(runId, snapshot);
  }

  /**
   * Get a run snapshot
   */
  get(runId: string): RunSnapshot | undefined {
    return this.snapshots.get(runId);
  }

  /**
   * Check if a snapshot exists
   */
  has(runId: string): boolean {
    return this.snapshots.has(runId);
  }

  /**
   * Delete a snapshot
   */
  delete(runId: string): boolean {
    return this.snapshots.delete(runId);
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
  }

  /**
   * Get the number of snapshots stored
   */
  getSize(): number {
    return this.snapshots.size;
  }

  /**
   * Get stats
   */
  getStats(): { count: number; maxSnapshots: number } {
    return {
      count: this.snapshots.size,
      maxSnapshots: this.maxSnapshots,
    };
  }
}

/**
 * In-memory store for modification records
 */
export class ModificationStore {
  private records: Map<string, ModificationRecord> = new Map();
  private byOriginalRun: Map<string, string[]> = new Map();
  private maxRecords: number;

  constructor(maxRecords: number = 5000) {
    this.maxRecords = maxRecords;
  }

  /**
   * Add a modification record
   */
  add(record: ModificationRecord): void {
    // Evict oldest if at capacity
    if (this.records.size >= this.maxRecords) {
      const oldest = this.records.keys().next().value;
      if (oldest) this.delete(oldest);
    }

    this.records.set(record.id, record);

    // Index by original run
    const runRecords = this.byOriginalRun.get(record.originalRunId) || [];
    runRecords.push(record.id);
    this.byOriginalRun.set(record.originalRunId, runRecords);
  }

  /**
   * Get a record by ID
   */
  get(id: string): ModificationRecord | undefined {
    return this.records.get(id);
  }

  /**
   * Get all records for an original run
   */
  getByOriginalRun(originalRunId: string): ModificationRecord[] {
    const ids = this.byOriginalRun.get(originalRunId) || [];
    return ids.map(id => this.records.get(id)).filter((r): r is ModificationRecord => r !== undefined);
  }

  /**
   * Update user rating/notes
   */
  updateUserFeedback(id: string, rating?: number, notes?: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    if (rating !== undefined) record.userRating = rating;
    if (notes !== undefined) record.userNotes = notes;
    return true;
  }

  /**
   * Delete a record
   */
  delete(id: string): boolean {
    const record = this.records.get(id);
    if (!record) return false;

    // Remove from index
    const runRecords = this.byOriginalRun.get(record.originalRunId);
    if (runRecords) {
      const idx = runRecords.indexOf(id);
      if (idx >= 0) runRecords.splice(idx, 1);
    }

    return this.records.delete(id);
  }

  /**
   * Get all records for a project
   */
  getByProject(projectId: string): ModificationRecord[] {
    return Array.from(this.records.values()).filter(r => r.projectId === projectId);
  }

  /**
   * Get stats for a project
   */
  getProjectStats(projectId: string): ModificationStats {
    const records = this.getByProject(projectId);
    return calculateModificationStats(records);
  }

  /**
   * Clear all records
   */
  clear(): void {
    this.records.clear();
    this.byOriginalRun.clear();
  }

  /**
   * Get the number of records stored
   */
  getSize(): number {
    return this.records.size;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createRunSnapshotStore(maxSnapshots?: number): RunSnapshotStore {
  return new RunSnapshotStore(maxSnapshots);
}

export function createModificationStore(maxRecords?: number): ModificationStore {
  return new ModificationStore(maxRecords);
}
