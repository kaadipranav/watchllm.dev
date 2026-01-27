/**
 * Agent Cost Attribution & ROI Dashboard
 * 
 * Groups requests by agent_name/run_id and calculates:
 * - Per-agent: cost, task count, latency, errors
 * - Business value field (user-configurable)
 * - ROI reports: "This agent saved X hours costing Y dollars"
 * 
 * @feature AGENT_COST_ATTRIBUTION
 */

// ============================================================================
// Types
// ============================================================================

export interface AgentRequestMetrics {
  requestCount: number;
  totalCostUsd: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
  errorCount: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  costSavedByCaching: number;
}

export interface AgentTaskMetrics {
  taskCount: number;
  successfulTasks: number;
  failedTasks: number;
  successRate: number;
  avgTaskDurationMs: number;
  totalTaskDurationMs: number;
}

export interface BusinessValueConfig {
  /** Estimated hourly cost of manual work this agent replaces (e.g., $50/hour) */
  hourlyLaborCost: number;
  /** Estimated hours saved per successful task (e.g., 0.5 hours) */
  hoursSavedPerTask: number;
  /** Custom multiplier for business impact (e.g., 1.2 for high-value tasks) */
  impactMultiplier: number;
  /** Currency symbol for display */
  currency: string;
}

export interface ROIMetrics {
  /** Total cost of running this agent */
  totalAgentCostUsd: number;
  /** Estimated hours saved by automation */
  hoursSaved: number;
  /** Monetary value of hours saved */
  laborCostSaved: number;
  /** Cost saved through semantic caching */
  cachingSavings: number;
  /** Net ROI = (labor saved + caching savings - agent cost) */
  netSavings: number;
  /** ROI percentage = (net savings / agent cost) * 100 */
  roiPercentage: number;
  /** Human-readable summary */
  summary: string;
}

export interface AgentCostSummary {
  agentName: string;
  runIds: string[];
  timeRange: {
    from: string;
    to: string;
  };
  requestMetrics: AgentRequestMetrics;
  taskMetrics: AgentTaskMetrics;
  roi: ROIMetrics;
}

export interface AgentRequest {
  runId: string;
  agentName: string;
  timestamp: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  latencyMs: number;
  cached: boolean;
  potentialCostUsd: number;
  status: 'success' | 'error' | 'timeout';
  errorMessage?: string;
}

export interface AgentRun {
  runId: string;
  agentName: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  totalCostUsd: number;
  stepCount: number;
}

export interface AgentGrouping {
  byAgent: Map<string, AgentRequest[]>;
  byRun: Map<string, AgentRequest[]>;
  byAgentAndRun: Map<string, Map<string, AgentRequest[]>>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_BUSINESS_VALUE_CONFIG: BusinessValueConfig = {
  hourlyLaborCost: 50, // $50/hour is typical developer cost
  hoursSavedPerTask: 0.25, // 15 minutes per task
  impactMultiplier: 1.0,
  currency: 'USD',
};

// ============================================================================
// Request Grouping Functions
// ============================================================================

/**
 * Group requests by agent name
 */
export function groupByAgent(requests: AgentRequest[]): Map<string, AgentRequest[]> {
  const groups = new Map<string, AgentRequest[]>();
  
  for (const request of requests) {
    const agentName = request.agentName || 'unknown';
    if (!groups.has(agentName)) {
      groups.set(agentName, []);
    }
    groups.get(agentName)!.push(request);
  }
  
  return groups;
}

/**
 * Group requests by run ID
 */
export function groupByRunId(requests: AgentRequest[]): Map<string, AgentRequest[]> {
  const groups = new Map<string, AgentRequest[]>();
  
  for (const request of requests) {
    const runId = request.runId || 'unknown';
    if (!groups.has(runId)) {
      groups.set(runId, []);
    }
    groups.get(runId)!.push(request);
  }
  
  return groups;
}

/**
 * Group requests by both agent name and run ID
 */
export function groupByAgentAndRun(requests: AgentRequest[]): Map<string, Map<string, AgentRequest[]>> {
  const groups = new Map<string, Map<string, AgentRequest[]>>();
  
  for (const request of requests) {
    const agentName = request.agentName || 'unknown';
    const runId = request.runId || 'unknown';
    
    if (!groups.has(agentName)) {
      groups.set(agentName, new Map());
    }
    const agentGroup = groups.get(agentName)!;
    
    if (!agentGroup.has(runId)) {
      agentGroup.set(runId, []);
    }
    agentGroup.get(runId)!.push(request);
  }
  
  return groups;
}

/**
 * Complete grouping of requests
 */
export function groupRequests(requests: AgentRequest[]): AgentGrouping {
  return {
    byAgent: groupByAgent(requests),
    byRun: groupByRunId(requests),
    byAgentAndRun: groupByAgentAndRun(requests),
  };
}

// ============================================================================
// Metrics Calculation Functions
// ============================================================================

/**
 * Calculate request-level metrics for a set of requests
 */
export function calculateRequestMetrics(requests: AgentRequest[]): AgentRequestMetrics {
  if (requests.length === 0) {
    return {
      requestCount: 0,
      totalCostUsd: 0,
      totalTokensInput: 0,
      totalTokensOutput: 0,
      totalLatencyMs: 0,
      avgLatencyMs: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      costSavedByCaching: 0,
    };
  }

  let totalCostUsd = 0;
  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  let totalLatencyMs = 0;
  let errorCount = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  let costSavedByCaching = 0;

  for (const request of requests) {
    totalCostUsd += request.costUsd;
    totalTokensInput += request.tokensInput;
    totalTokensOutput += request.tokensOutput;
    totalLatencyMs += request.latencyMs;
    
    if (request.status === 'error' || request.status === 'timeout') {
      errorCount++;
    }
    
    if (request.cached) {
      cacheHits++;
      // Cost saved = what it would have cost - what it actually cost
      costSavedByCaching += (request.potentialCostUsd - request.costUsd);
    } else {
      cacheMisses++;
    }
  }

  const requestCount = requests.length;
  const cacheHitRate = requestCount > 0 ? (cacheHits / requestCount) * 100 : 0;

  return {
    requestCount,
    totalCostUsd,
    totalTokensInput,
    totalTokensOutput,
    totalLatencyMs,
    avgLatencyMs: requestCount > 0 ? totalLatencyMs / requestCount : 0,
    errorCount,
    cacheHits,
    cacheMisses,
    cacheHitRate,
    costSavedByCaching,
  };
}

/**
 * Calculate task-level metrics from agent runs
 */
export function calculateTaskMetrics(runs: AgentRun[]): AgentTaskMetrics {
  if (runs.length === 0) {
    return {
      taskCount: 0,
      successfulTasks: 0,
      failedTasks: 0,
      successRate: 0,
      avgTaskDurationMs: 0,
      totalTaskDurationMs: 0,
    };
  }

  let successfulTasks = 0;
  let failedTasks = 0;
  let totalTaskDurationMs = 0;
  let tasksWithDuration = 0;

  for (const run of runs) {
    if (run.status === 'completed') {
      successfulTasks++;
    } else if (run.status === 'failed' || run.status === 'cancelled') {
      failedTasks++;
    }
    // Running tasks are neither success nor failure yet

    if (run.endedAt && run.startedAt) {
      const duration = new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime();
      if (duration > 0) {
        totalTaskDurationMs += duration;
        tasksWithDuration++;
      }
    }
  }

  const taskCount = runs.length;
  const successRate = taskCount > 0 ? (successfulTasks / taskCount) * 100 : 0;
  const avgTaskDurationMs = tasksWithDuration > 0 ? totalTaskDurationMs / tasksWithDuration : 0;

  return {
    taskCount,
    successfulTasks,
    failedTasks,
    successRate,
    avgTaskDurationMs,
    totalTaskDurationMs,
  };
}

// ============================================================================
// ROI Calculation Functions
// ============================================================================

/**
 * Calculate ROI metrics for an agent
 */
export function calculateROI(
  requestMetrics: AgentRequestMetrics,
  taskMetrics: AgentTaskMetrics,
  config: BusinessValueConfig = DEFAULT_BUSINESS_VALUE_CONFIG
): ROIMetrics {
  const totalAgentCostUsd = requestMetrics.totalCostUsd;
  
  // Hours saved = successful tasks * hours per task
  const hoursSaved = taskMetrics.successfulTasks * config.hoursSavedPerTask * config.impactMultiplier;
  
  // Labor cost saved = hours saved * hourly rate
  const laborCostSaved = hoursSaved * config.hourlyLaborCost;
  
  // Caching savings already calculated
  const cachingSavings = requestMetrics.costSavedByCaching;
  
  // Net savings = (labor saved + caching savings) - agent cost
  const netSavings = (laborCostSaved + cachingSavings) - totalAgentCostUsd;
  
  // ROI percentage = (net savings / agent cost) * 100
  // Handle edge case where agent cost is 0
  const roiPercentage = totalAgentCostUsd > 0 
    ? (netSavings / totalAgentCostUsd) * 100 
    : (netSavings > 0 ? Infinity : 0);

  // Generate human-readable summary
  const summary = generateROISummary({
    totalAgentCostUsd,
    hoursSaved,
    laborCostSaved,
    cachingSavings,
    netSavings,
    roiPercentage,
    summary: '',
  } as ROIMetrics, config, taskMetrics);

  return {
    totalAgentCostUsd,
    hoursSaved,
    laborCostSaved,
    cachingSavings,
    netSavings,
    roiPercentage,
    summary,
  };
}

/**
 * Generate a human-readable ROI summary
 */
export function generateROISummary(
  roi: Omit<ROIMetrics, 'summary'>,
  config: BusinessValueConfig,
  taskMetrics: AgentTaskMetrics
): string {
  const formatCurrency = (amount: number): string => {
    const symbol = config.currency === 'USD' ? '$' : config.currency;
    return `${symbol}${Math.abs(amount).toFixed(2)}`;
  };

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    return `${hours.toFixed(1)} hours`;
  };

  const parts: string[] = [];

  // Tasks completed
  if (taskMetrics.successfulTasks > 0) {
    parts.push(`Completed ${taskMetrics.successfulTasks} task${taskMetrics.successfulTasks > 1 ? 's' : ''}`);
  }

  // Cost
  parts.push(`Cost: ${formatCurrency(roi.totalAgentCostUsd)}`);

  // Time saved
  if (roi.hoursSaved > 0) {
    parts.push(`Saved ${formatHours(roi.hoursSaved)} of manual work`);
  }

  // Caching savings
  if (roi.cachingSavings > 0) {
    parts.push(`Caching saved ${formatCurrency(roi.cachingSavings)}`);
  }

  // Net result
  if (roi.netSavings > 0) {
    parts.push(`Net savings: ${formatCurrency(roi.netSavings)}`);
  } else if (roi.netSavings < 0) {
    parts.push(`Net cost: ${formatCurrency(roi.netSavings)}`);
  }

  // ROI percentage
  if (Number.isFinite(roi.roiPercentage) && roi.roiPercentage !== 0) {
    const roiSign = roi.roiPercentage > 0 ? '+' : '';
    parts.push(`ROI: ${roiSign}${roi.roiPercentage.toFixed(0)}%`);
  }

  return parts.join(' • ');
}

// ============================================================================
// Complete Agent Cost Summary
// ============================================================================

/**
 * Calculate complete cost summary for an agent
 */
export function calculateAgentCostSummary(
  agentName: string,
  requests: AgentRequest[],
  runs: AgentRun[],
  config: BusinessValueConfig = DEFAULT_BUSINESS_VALUE_CONFIG
): AgentCostSummary {
  const requestMetrics = calculateRequestMetrics(requests);
  const taskMetrics = calculateTaskMetrics(runs);
  const roi = calculateROI(requestMetrics, taskMetrics, config);

  // Determine time range from requests
  let fromTimestamp = new Date().toISOString();
  let toTimestamp = new Date().toISOString();
  
  if (requests.length > 0) {
    const timestamps = requests.map(r => new Date(r.timestamp).getTime());
    fromTimestamp = new Date(Math.min(...timestamps)).toISOString();
    toTimestamp = new Date(Math.max(...timestamps)).toISOString();
  }

  // Collect unique run IDs
  const runIds = [...new Set(requests.map(r => r.runId))];

  return {
    agentName,
    runIds,
    timeRange: {
      from: fromTimestamp,
      to: toTimestamp,
    },
    requestMetrics,
    taskMetrics,
    roi,
  };
}

// ============================================================================
// Aggregation Across Multiple Agents
// ============================================================================

export interface AgentComparison {
  agents: AgentCostSummary[];
  totals: {
    totalCostUsd: number;
    totalHoursSaved: number;
    totalNetSavings: number;
    averageROI: number;
    totalTasks: number;
    overallSuccessRate: number;
  };
  topPerformers: {
    byROI: AgentCostSummary | null;
    byCostEfficiency: AgentCostSummary | null;
    bySuccessRate: AgentCostSummary | null;
  };
}

/**
 * Compare multiple agents and generate a leaderboard
 */
export function compareAgents(summaries: AgentCostSummary[]): AgentComparison {
  if (summaries.length === 0) {
    return {
      agents: [],
      totals: {
        totalCostUsd: 0,
        totalHoursSaved: 0,
        totalNetSavings: 0,
        averageROI: 0,
        totalTasks: 0,
        overallSuccessRate: 0,
      },
      topPerformers: {
        byROI: null,
        byCostEfficiency: null,
        bySuccessRate: null,
      },
    };
  }

  // Calculate totals
  let totalCostUsd = 0;
  let totalHoursSaved = 0;
  let totalNetSavings = 0;
  let totalROI = 0;
  let totalTasks = 0;
  let totalSuccessfulTasks = 0;

  for (const summary of summaries) {
    totalCostUsd += summary.roi.totalAgentCostUsd;
    totalHoursSaved += summary.roi.hoursSaved;
    totalNetSavings += summary.roi.netSavings;
    if (Number.isFinite(summary.roi.roiPercentage)) {
      totalROI += summary.roi.roiPercentage;
    }
    totalTasks += summary.taskMetrics.taskCount;
    totalSuccessfulTasks += summary.taskMetrics.successfulTasks;
  }

  const averageROI = summaries.length > 0 ? totalROI / summaries.length : 0;
  const overallSuccessRate = totalTasks > 0 ? (totalSuccessfulTasks / totalTasks) * 100 : 0;

  // Find top performers
  const byROI = [...summaries]
    .filter(s => Number.isFinite(s.roi.roiPercentage))
    .sort((a, b) => b.roi.roiPercentage - a.roi.roiPercentage)[0] || null;

  // Cost efficiency = (tasks completed / cost)
  const byCostEfficiency = [...summaries]
    .filter(s => s.roi.totalAgentCostUsd > 0)
    .sort((a, b) => {
      const effA = a.taskMetrics.successfulTasks / a.roi.totalAgentCostUsd;
      const effB = b.taskMetrics.successfulTasks / b.roi.totalAgentCostUsd;
      return effB - effA;
    })[0] || null;

  const bySuccessRate = [...summaries]
    .filter(s => s.taskMetrics.taskCount > 0)
    .sort((a, b) => b.taskMetrics.successRate - a.taskMetrics.successRate)[0] || null;

  return {
    agents: summaries,
    totals: {
      totalCostUsd,
      totalHoursSaved,
      totalNetSavings,
      averageROI,
      totalTasks,
      overallSuccessRate,
    },
    topPerformers: {
      byROI,
      byCostEfficiency,
      bySuccessRate,
    },
  };
}

// ============================================================================
// Time-based Aggregation
// ============================================================================

export type TimeGranularity = 'hour' | 'day' | 'week' | 'month';

export interface TimeSeriesDataPoint {
  timestamp: string;
  cost: number;
  requests: number;
  cacheHits: number;
  errors: number;
  tasks: number;
}

/**
 * Aggregate metrics into time series
 */
export function aggregateByTime(
  requests: AgentRequest[],
  runs: AgentRun[],
  granularity: TimeGranularity
): TimeSeriesDataPoint[] {
  const buckets = new Map<string, {
    cost: number;
    requests: number;
    cacheHits: number;
    errors: number;
    tasks: Set<string>;
  }>();

  // Get bucket key for a timestamp
  const getBucketKey = (timestamp: string): string => {
    const date = new Date(timestamp);
    switch (granularity) {
      case 'hour':
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:00:00Z`;
      case 'day':
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T00:00:00Z`;
      case 'week':
        // Get Monday of the week
        const day = date.getUTCDay();
        const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setUTCDate(diff);
        return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, '0')}-${String(monday.getUTCDate()).padStart(2, '0')}T00:00:00Z`;
      case 'month':
        return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01T00:00:00Z`;
    }
  };

  // Aggregate requests
  for (const request of requests) {
    const key = getBucketKey(request.timestamp);
    if (!buckets.has(key)) {
      buckets.set(key, { cost: 0, requests: 0, cacheHits: 0, errors: 0, tasks: new Set() });
    }
    const bucket = buckets.get(key)!;
    bucket.cost += request.costUsd;
    bucket.requests++;
    if (request.cached) bucket.cacheHits++;
    if (request.status === 'error' || request.status === 'timeout') bucket.errors++;
    bucket.tasks.add(request.runId);
  }

  // Add task info from runs
  for (const run of runs) {
    const key = getBucketKey(run.startedAt);
    if (!buckets.has(key)) {
      buckets.set(key, { cost: 0, requests: 0, cacheHits: 0, errors: 0, tasks: new Set() });
    }
    buckets.get(key)!.tasks.add(run.runId);
  }

  // Convert to array and sort by timestamp
  const result: TimeSeriesDataPoint[] = [];
  for (const [timestamp, bucket] of buckets) {
    result.push({
      timestamp,
      cost: bucket.cost,
      requests: bucket.requests,
      cacheHits: bucket.cacheHits,
      errors: bucket.errors,
      tasks: bucket.tasks.size,
    });
  }

  return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// ============================================================================
// In-Memory Store for Aggregation
// ============================================================================

export class AgentCostStore {
  private requests: AgentRequest[] = [];
  private runs: AgentRun[] = [];
  private businessValueConfigs: Map<string, BusinessValueConfig> = new Map();

  /**
   * Add a request to the store
   */
  addRequest(request: AgentRequest): void {
    this.requests.push(request);
  }

  /**
   * Add multiple requests
   */
  addRequests(requests: AgentRequest[]): void {
    this.requests.push(...requests);
  }

  /**
   * Add a run to the store
   */
  addRun(run: AgentRun): void {
    this.runs.push(run);
  }

  /**
   * Set business value config for an agent
   */
  setBusinessValueConfig(agentName: string, config: BusinessValueConfig): void {
    this.businessValueConfigs.set(agentName, config);
  }

  /**
   * Get business value config for an agent
   */
  getBusinessValueConfig(agentName: string): BusinessValueConfig {
    return this.businessValueConfigs.get(agentName) || DEFAULT_BUSINESS_VALUE_CONFIG;
  }

  /**
   * Get summary for a specific agent
   */
  getAgentSummary(agentName: string): AgentCostSummary {
    const agentRequests = this.requests.filter(r => r.agentName === agentName);
    const agentRuns = this.runs.filter(r => r.agentName === agentName);
    const config = this.getBusinessValueConfig(agentName);
    
    return calculateAgentCostSummary(agentName, agentRequests, agentRuns, config);
  }

  /**
   * Get summaries for all agents
   */
  getAllAgentSummaries(): AgentCostSummary[] {
    const agentNames = new Set(this.requests.map(r => r.agentName));
    return Array.from(agentNames).map(name => this.getAgentSummary(name));
  }

  /**
   * Get comparison across all agents
   */
  getAgentComparison(): AgentComparison {
    const summaries = this.getAllAgentSummaries();
    return compareAgents(summaries);
  }

  /**
   * Get time series for an agent
   */
  getTimeSeries(agentName: string, granularity: TimeGranularity): TimeSeriesDataPoint[] {
    const agentRequests = this.requests.filter(r => r.agentName === agentName);
    const agentRuns = this.runs.filter(r => r.agentName === agentName);
    return aggregateByTime(agentRequests, agentRuns, granularity);
  }

  /**
   * Get requests for a specific run
   */
  getRunRequests(runId: string): AgentRequest[] {
    return this.requests.filter(r => r.runId === runId);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.requests = [];
    this.runs = [];
  }

  /**
   * Get store stats
   */
  getStats(): { requestCount: number; runCount: number; agentCount: number } {
    const agentNames = new Set(this.requests.map(r => r.agentName));
    return {
      requestCount: this.requests.length,
      runCount: this.runs.length,
      agentCount: agentNames.size,
    };
  }
}

// ============================================================================
// Export Factory Function
// ============================================================================

export function createAgentCostStore(): AgentCostStore {
  return new AgentCostStore();
}
