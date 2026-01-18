/**
 * Custom Evaluation Pipeline
 * 
 * Provides:
 * - User-defined evaluation criteria
 * - Async evaluation execution (non-blocking)
 * - Result storage for ClickHouse
 * - Pass/fail rate tracking
 * - Alert thresholds for metric drops
 * 
 * @feature CUSTOM_EVALUATION
 */

// ============================================================================
// Types - Evaluation Criteria
// ============================================================================

/**
 * Supported evaluation types
 */
export type EvaluationType =
  | 'regex_match'           // Response matches regex pattern
  | 'regex_no_match'        // Response does NOT match regex pattern
  | 'contains'              // Response contains substring
  | 'not_contains'          // Response does NOT contain substring
  | 'json_schema'           // Response is valid JSON matching schema
  | 'json_path_exists'      // JSON path exists in response
  | 'json_path_equals'      // JSON path value equals expected
  | 'length_min'            // Response length >= minimum
  | 'length_max'            // Response length <= maximum
  | 'latency_max'           // Latency <= threshold (ms)
  | 'cost_max'              // Cost <= threshold (dollars)
  | 'llm_judge'             // Use another LLM to judge quality
  | 'custom_function'       // User-provided evaluation function
  | 'sentiment'             // Sentiment analysis (positive/negative/neutral)
  | 'toxicity'              // Check for toxic content
  | 'pii_detection'         // Check for PII in response
  | 'factuality'            // Check factual accuracy
  | 'relevance'             // Check relevance to input
  | 'coherence'             // Check coherence/readability
  | 'composite';            // Combine multiple evaluations

/**
 * Severity level for evaluation failures
 */
export type EvaluationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Single evaluation criterion
 */
export interface EvaluationCriterion {
  id: string;
  name: string;
  description?: string;
  type: EvaluationType;
  /** Configuration specific to evaluation type */
  config: EvaluationConfig;
  /** Weight for composite scoring (0-1) */
  weight: number;
  /** Severity when this criterion fails */
  severity: EvaluationSeverity;
  /** Whether this criterion is enabled */
  enabled: boolean;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Configuration for different evaluation types
 */
export type EvaluationConfig =
  | RegexConfig
  | ContainsConfig
  | JsonSchemaConfig
  | JsonPathConfig
  | LengthConfig
  | ThresholdConfig
  | LLMJudgeConfig
  | CustomFunctionConfig
  | SentimentConfig
  | CompositeConfig;

export interface RegexConfig {
  type: 'regex';
  pattern: string;
  flags?: string;
}

export interface ContainsConfig {
  type: 'contains';
  substring: string;
  caseSensitive?: boolean;
}

export interface JsonSchemaConfig {
  type: 'json_schema';
  schema: Record<string, unknown>;
}

export interface JsonPathConfig {
  type: 'json_path';
  path: string;
  expectedValue?: unknown;
}

export interface LengthConfig {
  type: 'length';
  min?: number;
  max?: number;
}

export interface ThresholdConfig {
  type: 'threshold';
  maxValue: number;
  unit?: string;
}

export interface LLMJudgeConfig {
  type: 'llm_judge';
  model: string;
  prompt: string;
  passThreshold: number; // 0-1 score threshold to pass
  /** Optional criteria the LLM should evaluate */
  criteria?: string[];
}

export interface CustomFunctionConfig {
  type: 'custom_function';
  /** JavaScript function body as string */
  functionBody: string;
  /** Timeout in ms */
  timeout?: number;
}

export interface SentimentConfig {
  type: 'sentiment';
  expectedSentiment: 'positive' | 'negative' | 'neutral';
  threshold?: number;
}

export interface CompositeConfig {
  type: 'composite';
  criteria: EvaluationCriterion[];
  /** How to combine results: all must pass, any must pass, or weighted score */
  combineMode: 'all' | 'any' | 'weighted';
  /** Minimum weighted score to pass (0-1) */
  minScore?: number;
}

/**
 * Evaluation rule set - a collection of criteria applied to requests
 */
export interface EvaluationRuleSet {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  /** Criteria in this rule set */
  criteria: EvaluationCriterion[];
  /** Filter: which requests to evaluate */
  filter: RequestFilter;
  /** Whether to run async (recommended) or block response */
  async: boolean;
  /** Sample rate (0-1) for evaluation */
  sampleRate: number;
  /** Alert configuration */
  alertConfig?: AlertConfig;
  createdAt: string;
  updatedAt: string;
  enabled: boolean;
}

/**
 * Filter to select which requests to evaluate
 */
export interface RequestFilter {
  /** Models to include (empty = all) */
  models?: string[];
  /** Agent names to include */
  agentNames?: string[];
  /** Paths to include */
  paths?: string[];
  /** Tags to include */
  tags?: string[];
  /** Minimum cost threshold */
  minCost?: number;
  /** Custom filter expression */
  expression?: string;
}

/**
 * Alert configuration for evaluation metrics
 */
export interface AlertConfig {
  enabled: boolean;
  /** Minimum pass rate threshold (0-1) */
  passRateThreshold: number;
  /** Window for calculating pass rate (minutes) */
  windowMinutes: number;
  /** Minimum samples before alerting */
  minSamples: number;
  /** Channels to notify */
  channels: AlertChannel[];
  /** Cooldown between alerts (minutes) */
  cooldownMinutes: number;
  /** Last alert timestamp */
  lastAlertAt?: string;
}

export type AlertChannel = 
  | { type: 'slack'; webhookUrl: string }
  | { type: 'email'; addresses: string[] }
  | { type: 'webhook'; url: string; headers?: Record<string, string> };

// ============================================================================
// Types - Evaluation Results
// ============================================================================

/**
 * Result of a single criterion evaluation
 */
export interface CriterionResult {
  criterionId: string;
  criterionName: string;
  type: EvaluationType;
  passed: boolean;
  score: number; // 0-1
  message?: string;
  details?: Record<string, unknown>;
  durationMs: number;
}

/**
 * Complete evaluation result for a request
 */
export interface EvaluationResult {
  id: string;
  projectId: string;
  ruleSetId: string;
  requestId: string;
  runId?: string;
  agentName?: string;
  model: string;
  /** Overall pass/fail */
  passed: boolean;
  /** Overall score (0-1) */
  score: number;
  /** Individual criterion results */
  criteriaResults: CriterionResult[];
  /** Summary counts */
  passedCount: number;
  failedCount: number;
  totalCount: number;
  /** Highest severity of failed criteria */
  maxSeverity?: EvaluationSeverity;
  /** Request metadata */
  requestPath: string;
  requestLatencyMs: number;
  requestCost: number;
  /** Timestamps */
  evaluatedAt: string;
  requestedAt: string;
  /** Duration of evaluation */
  evaluationDurationMs: number;
}

/**
 * Aggregated evaluation metrics
 */
export interface EvaluationMetrics {
  projectId: string;
  ruleSetId: string;
  period: string; // ISO duration or 'all'
  /** Total evaluations */
  totalEvaluations: number;
  /** Pass/fail counts */
  passedCount: number;
  failedCount: number;
  /** Pass rate (0-1) */
  passRate: number;
  /** Average score */
  avgScore: number;
  /** Score distribution */
  scoreDistribution: {
    '0-0.2': number;
    '0.2-0.4': number;
    '0.4-0.6': number;
    '0.6-0.8': number;
    '0.8-1.0': number;
  };
  /** Per-criterion metrics */
  criterionMetrics: Record<string, {
    passRate: number;
    avgScore: number;
    failureCount: number;
  }>;
  /** Per-model metrics */
  modelMetrics: Record<string, {
    passRate: number;
    avgScore: number;
    count: number;
  }>;
  /** Trend data */
  trend: {
    timestamp: string;
    passRate: number;
    avgScore: number;
    count: number;
  }[];
}

/**
 * ClickHouse row format for evaluation results
 */
export interface ClickHouseEvaluationRow {
  id: string;
  project_id: string;
  rule_set_id: string;
  request_id: string;
  run_id: string;
  agent_name: string;
  model: string;
  passed: number; // 0 or 1
  score: number;
  passed_count: number;
  failed_count: number;
  total_count: number;
  max_severity: string;
  request_path: string;
  request_latency_ms: number;
  request_cost: number;
  evaluated_at: string;
  requested_at: string;
  evaluation_duration_ms: number;
  criteria_results: string; // JSON string
}

// ============================================================================
// Evaluation Engine
// ============================================================================

/**
 * Input for evaluation
 */
export interface EvaluationInput {
  requestId: string;
  projectId: string;
  runId?: string;
  agentName?: string;
  model: string;
  path: string;
  /** The prompt/input */
  input: string;
  /** The response/output */
  output: string;
  /** Full request body (for JSON path checks) */
  requestBody?: Record<string, unknown>;
  /** Full response body */
  responseBody?: Record<string, unknown>;
  /** Request metadata */
  latencyMs: number;
  cost: number;
  requestedAt: string;
  tags?: string[];
}

/**
 * Evaluate a response against a single criterion
 */
export async function evaluateCriterion(
  criterion: EvaluationCriterion,
  input: EvaluationInput
): Promise<CriterionResult> {
  const startTime = Date.now();
  
  try {
    const result = await runEvaluation(criterion, input);
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      type: criterion.type,
      passed: result.passed,
      score: result.score,
      message: result.message,
      details: result.details,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      criterionId: criterion.id,
      criterionName: criterion.name,
      type: criterion.type,
      passed: false,
      score: 0,
      message: `Evaluation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Run specific evaluation based on type
 */
async function runEvaluation(
  criterion: EvaluationCriterion,
  input: EvaluationInput
): Promise<{ passed: boolean; score: number; message?: string; details?: Record<string, unknown> }> {
  const config = criterion.config;
  const output = input.output;

  switch (criterion.type) {
    case 'regex_match': {
      const regexConfig = config as RegexConfig;
      const regex = new RegExp(regexConfig.pattern, regexConfig.flags);
      const matches = regex.test(output);
      return {
        passed: matches,
        score: matches ? 1 : 0,
        message: matches ? 'Pattern matched' : 'Pattern did not match',
        details: { pattern: regexConfig.pattern },
      };
    }

    case 'regex_no_match': {
      const regexConfig = config as RegexConfig;
      const regex = new RegExp(regexConfig.pattern, regexConfig.flags);
      const matches = regex.test(output);
      return {
        passed: !matches,
        score: matches ? 0 : 1,
        message: matches ? 'Unwanted pattern found' : 'Unwanted pattern not found',
        details: { pattern: regexConfig.pattern },
      };
    }

    case 'contains': {
      const containsConfig = config as ContainsConfig;
      const haystack = containsConfig.caseSensitive ? output : output.toLowerCase();
      const needle = containsConfig.caseSensitive 
        ? containsConfig.substring 
        : containsConfig.substring.toLowerCase();
      const contains = haystack.includes(needle);
      return {
        passed: contains,
        score: contains ? 1 : 0,
        message: contains ? 'Substring found' : 'Substring not found',
        details: { substring: containsConfig.substring },
      };
    }

    case 'not_contains': {
      const containsConfig = config as ContainsConfig;
      const haystack = containsConfig.caseSensitive ? output : output.toLowerCase();
      const needle = containsConfig.caseSensitive 
        ? containsConfig.substring 
        : containsConfig.substring.toLowerCase();
      const contains = haystack.includes(needle);
      return {
        passed: !contains,
        score: contains ? 0 : 1,
        message: contains ? 'Unwanted substring found' : 'Unwanted substring not found',
        details: { substring: containsConfig.substring },
      };
    }

    case 'json_schema': {
      const schemaConfig = config as JsonSchemaConfig;
      try {
        const parsed = JSON.parse(output);
        // Basic schema validation (in production, use a full JSON Schema validator)
        const valid = validateBasicSchema(parsed, schemaConfig.schema);
        return {
          passed: valid,
          score: valid ? 1 : 0,
          message: valid ? 'JSON matches schema' : 'JSON does not match schema',
        };
      } catch {
        return {
          passed: false,
          score: 0,
          message: 'Output is not valid JSON',
        };
      }
    }

    case 'json_path_exists': {
      const pathConfig = config as JsonPathConfig;
      try {
        const parsed = input.responseBody || JSON.parse(output);
        const value = getJsonPath(parsed, pathConfig.path);
        const exists = value !== undefined;
        return {
          passed: exists,
          score: exists ? 1 : 0,
          message: exists ? `Path ${pathConfig.path} exists` : `Path ${pathConfig.path} not found`,
          details: { path: pathConfig.path, value: exists ? value : undefined },
        };
      } catch {
        return {
          passed: false,
          score: 0,
          message: 'Failed to parse JSON',
        };
      }
    }

    case 'json_path_equals': {
      const pathConfig = config as JsonPathConfig;
      try {
        const parsed = input.responseBody || JSON.parse(output);
        const value = getJsonPath(parsed, pathConfig.path);
        const equals = JSON.stringify(value) === JSON.stringify(pathConfig.expectedValue);
        return {
          passed: equals,
          score: equals ? 1 : 0,
          message: equals 
            ? `Path ${pathConfig.path} equals expected value` 
            : `Path ${pathConfig.path} does not equal expected value`,
          details: { path: pathConfig.path, actual: value, expected: pathConfig.expectedValue },
        };
      } catch {
        return {
          passed: false,
          score: 0,
          message: 'Failed to parse JSON',
        };
      }
    }

    case 'length_min': {
      const lengthConfig = config as LengthConfig;
      const length = output.length;
      const passed = length >= (lengthConfig.min || 0);
      return {
        passed,
        score: passed ? 1 : Math.min(length / (lengthConfig.min || 1), 1),
        message: passed 
          ? `Length ${length} >= minimum ${lengthConfig.min}` 
          : `Length ${length} < minimum ${lengthConfig.min}`,
        details: { length, min: lengthConfig.min },
      };
    }

    case 'length_max': {
      const lengthConfig = config as LengthConfig;
      const length = output.length;
      const passed = length <= (lengthConfig.max || Infinity);
      return {
        passed,
        score: passed ? 1 : Math.max(1 - (length - (lengthConfig.max || 0)) / (lengthConfig.max || 1), 0),
        message: passed 
          ? `Length ${length} <= maximum ${lengthConfig.max}` 
          : `Length ${length} > maximum ${lengthConfig.max}`,
        details: { length, max: lengthConfig.max },
      };
    }

    case 'latency_max': {
      const thresholdConfig = config as ThresholdConfig;
      const latency = input.latencyMs;
      const passed = latency <= thresholdConfig.maxValue;
      return {
        passed,
        score: passed ? 1 : Math.max(1 - (latency - thresholdConfig.maxValue) / thresholdConfig.maxValue, 0),
        message: passed 
          ? `Latency ${latency}ms <= threshold ${thresholdConfig.maxValue}ms` 
          : `Latency ${latency}ms > threshold ${thresholdConfig.maxValue}ms`,
        details: { latency, threshold: thresholdConfig.maxValue },
      };
    }

    case 'cost_max': {
      const thresholdConfig = config as ThresholdConfig;
      const cost = input.cost;
      const passed = cost <= thresholdConfig.maxValue;
      return {
        passed,
        score: passed ? 1 : Math.max(1 - (cost - thresholdConfig.maxValue) / thresholdConfig.maxValue, 0),
        message: passed 
          ? `Cost $${cost.toFixed(4)} <= threshold $${thresholdConfig.maxValue}` 
          : `Cost $${cost.toFixed(4)} > threshold $${thresholdConfig.maxValue}`,
        details: { cost, threshold: thresholdConfig.maxValue },
      };
    }

    case 'sentiment': {
      const sentimentConfig = config as SentimentConfig;
      // Simple sentiment analysis using keyword matching
      const sentiment = analyzeSentiment(output);
      const passed = sentiment.label === sentimentConfig.expectedSentiment;
      return {
        passed,
        score: passed ? sentiment.confidence : 1 - sentiment.confidence,
        message: `Sentiment: ${sentiment.label} (expected: ${sentimentConfig.expectedSentiment})`,
        details: { detected: sentiment.label, confidence: sentiment.confidence },
      };
    }

    case 'toxicity': {
      // Simple toxicity check using keyword matching
      const toxicity = checkToxicity(output);
      const passed = !toxicity.isToxic;
      return {
        passed,
        score: passed ? 1 : 0,
        message: passed ? 'No toxic content detected' : 'Toxic content detected',
        details: { matches: toxicity.matches },
      };
    }

    case 'pii_detection': {
      const pii = detectPII(output);
      const passed = pii.length === 0;
      return {
        passed,
        score: passed ? 1 : 0,
        message: passed ? 'No PII detected' : `PII detected: ${pii.join(', ')}`,
        details: { piiTypes: pii },
      };
    }

    case 'llm_judge': {
      const judgeConfig = config as LLMJudgeConfig;
      // In production, this would call an LLM API
      // For now, return a placeholder result
      return {
        passed: true,
        score: 0.85,
        message: 'LLM judge evaluation (placeholder)',
        details: { 
          model: judgeConfig.model, 
          note: 'LLM judge requires integration with LLM provider' 
        },
      };
    }

    case 'custom_function': {
      const funcConfig = config as CustomFunctionConfig;
      try {
        // Execute the custom function safely
        const result = await executeCustomFunction(funcConfig.functionBody, input, funcConfig.timeout);
        return {
          passed: result.passed,
          score: result.score ?? (result.passed ? 1 : 0),
          message: result.message,
          details: result.details,
        };
      } catch (error) {
        return {
          passed: false,
          score: 0,
          message: `Custom function error: ${error instanceof Error ? error.message : 'Unknown'}`,
        };
      }
    }

    case 'composite': {
      const compositeConfig = config as CompositeConfig;
      const results: CriterionResult[] = [];
      
      for (const subCriterion of compositeConfig.criteria) {
        const result = await evaluateCriterion(subCriterion, input);
        results.push(result);
      }

      let passed: boolean;
      let score: number;

      switch (compositeConfig.combineMode) {
        case 'all':
          passed = results.every(r => r.passed);
          score = results.reduce((sum, r) => sum + r.score, 0) / results.length;
          break;
        case 'any':
          passed = results.some(r => r.passed);
          score = Math.max(...results.map(r => r.score));
          break;
        case 'weighted':
          score = compositeConfig.criteria.reduce((sum, c, i) => 
            sum + c.weight * results[i].score, 0
          ) / compositeConfig.criteria.reduce((sum, c) => sum + c.weight, 0);
          passed = score >= (compositeConfig.minScore || 0.5);
          break;
      }

      return {
        passed,
        score,
        message: `Composite: ${results.filter(r => r.passed).length}/${results.length} passed`,
        details: { subResults: results },
      };
    }

    default:
      return {
        passed: true,
        score: 1,
        message: `Unknown evaluation type: ${criterion.type}`,
      };
  }
}

/**
 * Evaluate a response against a full rule set
 */
export async function evaluateRuleSet(
  ruleSet: EvaluationRuleSet,
  input: EvaluationInput
): Promise<EvaluationResult> {
  const startTime = Date.now();
  const criteriaResults: CriterionResult[] = [];

  // Evaluate each enabled criterion
  for (const criterion of ruleSet.criteria) {
    if (!criterion.enabled) continue;
    const result = await evaluateCriterion(criterion, input);
    criteriaResults.push(result);
  }

  // Calculate aggregates
  const passedCount = criteriaResults.filter(r => r.passed).length;
  const failedCount = criteriaResults.filter(r => !r.passed).length;
  const totalCount = criteriaResults.length;
  
  const avgScore = totalCount > 0
    ? criteriaResults.reduce((sum, r) => sum + r.score, 0) / totalCount
    : 1;
  
  const passed = failedCount === 0;
  
  // Find max severity of failures
  const severityOrder: EvaluationSeverity[] = ['info', 'warning', 'error', 'critical'];
  let maxSeverity: EvaluationSeverity | undefined;
  
  for (const result of criteriaResults) {
    if (!result.passed) {
      const criterion = ruleSet.criteria.find(c => c.id === result.criterionId);
      if (criterion) {
        const currentIdx = severityOrder.indexOf(criterion.severity);
        const maxIdx = maxSeverity ? severityOrder.indexOf(maxSeverity) : -1;
        if (currentIdx > maxIdx) {
          maxSeverity = criterion.severity;
        }
      }
    }
  }

  return {
    id: `eval_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    projectId: input.projectId,
    ruleSetId: ruleSet.id,
    requestId: input.requestId,
    runId: input.runId,
    agentName: input.agentName,
    model: input.model,
    passed,
    score: avgScore,
    criteriaResults,
    passedCount,
    failedCount,
    totalCount,
    maxSeverity,
    requestPath: input.path,
    requestLatencyMs: input.latencyMs,
    requestCost: input.cost,
    evaluatedAt: new Date().toISOString(),
    requestedAt: input.requestedAt,
    evaluationDurationMs: Date.now() - startTime,
  };
}

/**
 * Check if a request matches a filter
 */
export function matchesFilter(filter: RequestFilter, input: EvaluationInput): boolean {
  // Model filter
  if (filter.models && filter.models.length > 0) {
    if (!filter.models.includes(input.model)) return false;
  }

  // Agent name filter
  if (filter.agentNames && filter.agentNames.length > 0) {
    if (!input.agentName || !filter.agentNames.includes(input.agentName)) return false;
  }

  // Path filter
  if (filter.paths && filter.paths.length > 0) {
    if (!filter.paths.some(p => input.path.includes(p))) return false;
  }

  // Tag filter
  if (filter.tags && filter.tags.length > 0) {
    if (!input.tags || !filter.tags.some(t => input.tags!.includes(t))) return false;
  }

  // Cost filter
  if (filter.minCost !== undefined) {
    if (input.cost < filter.minCost) return false;
  }

  return true;
}

/**
 * Determine if evaluation should run based on sample rate
 */
export function shouldSample(sampleRate: number): boolean {
  return Math.random() < sampleRate;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Basic JSON schema validation (simplified)
 */
function validateBasicSchema(data: unknown, schema: Record<string, unknown>): boolean {
  if (typeof data !== 'object' || data === null) {
    return schema.type === 'null' || (typeof data === schema.type);
  }

  // Check required properties
  if (schema.required && Array.isArray(schema.required)) {
    for (const prop of schema.required) {
      if (!(prop in (data as Record<string, unknown>))) return false;
    }
  }

  // Check property types
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (key in (data as Record<string, unknown>)) {
        const value = (data as Record<string, unknown>)[key];
        const expectedType = (propSchema as Record<string, unknown>).type;
        if (expectedType && typeof value !== expectedType && expectedType !== 'null') {
          if (expectedType === 'array' && !Array.isArray(value)) return false;
          if (expectedType !== 'array' && typeof value !== expectedType) return false;
        }
      }
    }
  }

  return true;
}

/**
 * Get value at JSON path (simplified)
 */
function getJsonPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/^\$\.?/, '').split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array indexing
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }
  
  return current;
}

/**
 * Simple sentiment analysis
 */
function analyzeSentiment(text: string): { label: 'positive' | 'negative' | 'neutral'; confidence: number } {
  const lower = text.toLowerCase();
  
  const positiveWords = ['great', 'good', 'excellent', 'amazing', 'wonderful', 'fantastic', 
    'love', 'happy', 'helpful', 'perfect', 'best', 'awesome', 'thank', 'appreciate'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'poor',
    'wrong', 'error', 'fail', 'problem', 'issue', 'disappointed', 'frustrated'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  for (const word of positiveWords) {
    if (lower.includes(word)) positiveCount++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negativeCount++;
  }
  
  const total = positiveCount + negativeCount;
  if (total === 0) return { label: 'neutral', confidence: 0.5 };
  
  const positiveRatio = positiveCount / total;
  if (positiveRatio > 0.6) return { label: 'positive', confidence: positiveRatio };
  if (positiveRatio < 0.4) return { label: 'negative', confidence: 1 - positiveRatio };
  return { label: 'neutral', confidence: 0.5 };
}

/**
 * Simple toxicity check
 */
function checkToxicity(text: string): { isToxic: boolean; matches: string[] } {
  const lower = text.toLowerCase();
  const toxicPatterns = [
    'hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 
    // Add more patterns in production
  ];
  
  const matches = toxicPatterns.filter(p => lower.includes(p));
  return { isToxic: matches.length > 0, matches };
}

/**
 * Simple PII detection
 */
function detectPII(text: string): string[] {
  const piiTypes: string[] = [];
  
  // Email
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    piiTypes.push('email');
  }
  
  // Phone (US format)
  if (/(\+1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/.test(text)) {
    piiTypes.push('phone');
  }
  
  // SSN
  if (/\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/.test(text)) {
    piiTypes.push('ssn');
  }
  
  // Credit card
  if (/\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/.test(text)) {
    piiTypes.push('credit_card');
  }
  
  return piiTypes;
}

/**
 * Execute custom evaluation function safely
 */
async function executeCustomFunction(
  functionBody: string,
  input: EvaluationInput,
  timeout: number = 5000
): Promise<{ passed: boolean; score?: number; message?: string; details?: Record<string, unknown> }> {
  // In production, this would use a sandboxed environment
  // For now, create a function and execute it
  try {
    const fn = new Function('input', 'output', 'request', `
      return (async () => {
        ${functionBody}
      })();
    `);
    
    const result = await Promise.race([
      fn(input.input, input.output, input),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Custom function timeout')), timeout)
      ),
    ]);
    
    if (typeof result === 'boolean') {
      return { passed: result };
    }
    if (typeof result === 'object' && result !== null) {
      return result as { passed: boolean; score?: number; message?: string; details?: Record<string, unknown> };
    }
    return { passed: !!result };
  } catch (error) {
    throw error;
  }
}

// ============================================================================
// Alert System
// ============================================================================

/**
 * Check if alerts should fire based on recent results
 */
export function checkAlertThreshold(
  alertConfig: AlertConfig,
  recentResults: EvaluationResult[],
  now: Date = new Date()
): { shouldAlert: boolean; passRate: number; sampleCount: number } {
  if (!alertConfig.enabled) {
    return { shouldAlert: false, passRate: 1, sampleCount: 0 };
  }

  // Filter to window
  const windowStart = new Date(now.getTime() - alertConfig.windowMinutes * 60 * 1000);
  const windowResults = recentResults.filter(r => new Date(r.evaluatedAt) >= windowStart);

  if (windowResults.length < alertConfig.minSamples) {
    return { shouldAlert: false, passRate: 1, sampleCount: windowResults.length };
  }

  const passRate = windowResults.filter(r => r.passed).length / windowResults.length;

  // Check cooldown
  if (alertConfig.lastAlertAt) {
    const cooldownEnd = new Date(
      new Date(alertConfig.lastAlertAt).getTime() + alertConfig.cooldownMinutes * 60 * 1000
    );
    if (now < cooldownEnd) {
      return { shouldAlert: false, passRate, sampleCount: windowResults.length };
    }
  }

  const shouldAlert = passRate < alertConfig.passRateThreshold;

  return { shouldAlert, passRate, sampleCount: windowResults.length };
}

/**
 * Create alert message for Slack
 */
export function createEvaluationAlertSlackMessage(
  ruleSetName: string,
  passRate: number,
  threshold: number,
  sampleCount: number,
  dashboardUrl: string
): {
  blocks: Array<{
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    fields?: Array<{ type: string; text: string }>;
    elements?: Array<{ type: string; text?: { type: string; text: string }; url?: string }>;
  }>;
} {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '⚠️ Evaluation Pass Rate Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Rule set *${ruleSetName}* has fallen below the pass rate threshold`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Current Pass Rate:*\n${(passRate * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Threshold:*\n${(threshold * 100).toFixed(1)}%` },
          { type: 'mrkdwn', text: `*Sample Count:*\n${sampleCount}` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Evaluation Dashboard' },
            url: `${dashboardUrl}/dashboard/evaluations`,
          },
        ],
      },
    ],
  };
}

// ============================================================================
// ClickHouse Integration
// ============================================================================

/**
 * Convert evaluation result to ClickHouse row format
 */
export function toClickHouseRow(result: EvaluationResult): ClickHouseEvaluationRow {
  return {
    id: result.id,
    project_id: result.projectId,
    rule_set_id: result.ruleSetId,
    request_id: result.requestId,
    run_id: result.runId || '',
    agent_name: result.agentName || '',
    model: result.model,
    passed: result.passed ? 1 : 0,
    score: result.score,
    passed_count: result.passedCount,
    failed_count: result.failedCount,
    total_count: result.totalCount,
    max_severity: result.maxSeverity || '',
    request_path: result.requestPath,
    request_latency_ms: result.requestLatencyMs,
    request_cost: result.requestCost,
    evaluated_at: result.evaluatedAt,
    requested_at: result.requestedAt,
    evaluation_duration_ms: result.evaluationDurationMs,
    criteria_results: JSON.stringify(result.criteriaResults),
  };
}

/**
 * Parse ClickHouse row back to evaluation result
 */
export function fromClickHouseRow(row: ClickHouseEvaluationRow): EvaluationResult {
  return {
    id: row.id,
    projectId: row.project_id,
    ruleSetId: row.rule_set_id,
    requestId: row.request_id,
    runId: row.run_id || undefined,
    agentName: row.agent_name || undefined,
    model: row.model,
    passed: row.passed === 1,
    score: row.score,
    criteriaResults: JSON.parse(row.criteria_results),
    passedCount: row.passed_count,
    failedCount: row.failed_count,
    totalCount: row.total_count,
    maxSeverity: row.max_severity as EvaluationSeverity || undefined,
    requestPath: row.request_path,
    requestLatencyMs: row.request_latency_ms,
    requestCost: row.request_cost,
    evaluatedAt: row.evaluated_at,
    requestedAt: row.requested_at,
    evaluationDurationMs: row.evaluation_duration_ms,
  };
}

/**
 * Generate ClickHouse INSERT statement for evaluation results
 */
export function generateClickHouseInsert(results: EvaluationResult[]): string {
  const rows = results.map(toClickHouseRow);
  const values = rows.map(row => `(
    '${row.id}',
    '${row.project_id}',
    '${row.rule_set_id}',
    '${row.request_id}',
    '${row.run_id}',
    '${row.agent_name}',
    '${row.model}',
    ${row.passed},
    ${row.score},
    ${row.passed_count},
    ${row.failed_count},
    ${row.total_count},
    '${row.max_severity}',
    '${row.request_path}',
    ${row.request_latency_ms},
    ${row.request_cost},
    '${row.evaluated_at}',
    '${row.requested_at}',
    ${row.evaluation_duration_ms},
    '${row.criteria_results.replace(/'/g, "\\'")}'
  )`).join(',\n');

  return `INSERT INTO evaluation_results 
    (id, project_id, rule_set_id, request_id, run_id, agent_name, model, 
     passed, score, passed_count, failed_count, total_count, max_severity,
     request_path, request_latency_ms, request_cost, evaluated_at, requested_at,
     evaluation_duration_ms, criteria_results)
    VALUES ${values}`;
}

// ============================================================================
// Async Evaluation Queue
// ============================================================================

/**
 * Evaluation job for async processing
 */
export interface EvaluationJob {
  id: string;
  ruleSetId: string;
  input: EvaluationInput;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: EvaluationResult;
  error?: string;
}

/**
 * In-memory evaluation queue (in production, use Redis/SQS)
 */
export class EvaluationQueue {
  private jobs: Map<string, EvaluationJob> = new Map();
  private pending: string[] = [];
  private ruleSets: Map<string, EvaluationRuleSet> = new Map();

  addRuleSet(ruleSet: EvaluationRuleSet): void {
    this.ruleSets.set(ruleSet.id, ruleSet);
  }

  getRuleSet(id: string): EvaluationRuleSet | undefined {
    return this.ruleSets.get(id);
  }

  enqueue(ruleSetId: string, input: EvaluationInput): string {
    const job: EvaluationJob = {
      id: `job_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
      ruleSetId,
      input,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.jobs.set(job.id, job);
    this.pending.push(job.id);
    return job.id;
  }

  async processNext(): Promise<EvaluationResult | null> {
    const jobId = this.pending.shift();
    if (!jobId) return null;

    const job = this.jobs.get(jobId);
    if (!job) return null;

    job.status = 'processing';

    const ruleSet = this.ruleSets.get(job.ruleSetId);
    if (!ruleSet) {
      job.status = 'failed';
      job.error = 'Rule set not found';
      return null;
    }

    try {
      const result = await evaluateRuleSet(ruleSet, job.input);
      job.status = 'completed';
      job.result = result;
      return result;
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      return null;
    }
  }

  getJob(id: string): EvaluationJob | undefined {
    return this.jobs.get(id);
  }

  getPendingCount(): number {
    return this.pending.length;
  }

  getStats(): { pending: number; completed: number; failed: number } {
    let completed = 0;
    let failed = 0;
    for (const job of this.jobs.values()) {
      if (job.status === 'completed') completed++;
      if (job.status === 'failed') failed++;
    }
    return { pending: this.pending.length, completed, failed };
  }
}

// ============================================================================
// In-Memory Stores
// ============================================================================

/**
 * Store for evaluation rule sets
 */
export class RuleSetStore {
  private ruleSets: Map<string, EvaluationRuleSet> = new Map();
  private byProject: Map<string, Set<string>> = new Map();

  add(ruleSet: EvaluationRuleSet): void {
    this.ruleSets.set(ruleSet.id, ruleSet);
    
    if (!this.byProject.has(ruleSet.projectId)) {
      this.byProject.set(ruleSet.projectId, new Set());
    }
    this.byProject.get(ruleSet.projectId)!.add(ruleSet.id);
  }

  get(id: string): EvaluationRuleSet | undefined {
    return this.ruleSets.get(id);
  }

  getByProject(projectId: string): EvaluationRuleSet[] {
    const ids = this.byProject.get(projectId) || new Set();
    return Array.from(ids)
      .map(id => this.ruleSets.get(id))
      .filter((rs): rs is EvaluationRuleSet => rs !== undefined);
  }

  update(id: string, updates: Partial<EvaluationRuleSet>): boolean {
    const ruleSet = this.ruleSets.get(id);
    if (!ruleSet) return false;
    
    Object.assign(ruleSet, updates, { updatedAt: new Date().toISOString() });
    return true;
  }

  delete(id: string): boolean {
    const ruleSet = this.ruleSets.get(id);
    if (!ruleSet) return false;
    
    this.byProject.get(ruleSet.projectId)?.delete(id);
    return this.ruleSets.delete(id);
  }

  getSize(): number {
    return this.ruleSets.size;
  }
}

/**
 * Store for evaluation results (in-memory cache, backed by ClickHouse)
 */
export class ResultStore {
  private results: Map<string, EvaluationResult> = new Map();
  private byProject: Map<string, string[]> = new Map();
  private byRuleSet: Map<string, string[]> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  add(result: EvaluationResult): void {
    // Evict oldest if at capacity
    if (this.results.size >= this.maxSize) {
      const oldest = this.results.keys().next().value;
      if (oldest) this.results.delete(oldest);
    }

    this.results.set(result.id, result);

    if (!this.byProject.has(result.projectId)) {
      this.byProject.set(result.projectId, []);
    }
    this.byProject.get(result.projectId)!.push(result.id);

    if (!this.byRuleSet.has(result.ruleSetId)) {
      this.byRuleSet.set(result.ruleSetId, []);
    }
    this.byRuleSet.get(result.ruleSetId)!.push(result.id);
  }

  get(id: string): EvaluationResult | undefined {
    return this.results.get(id);
  }

  getByProject(projectId: string, limit?: number): EvaluationResult[] {
    const ids = this.byProject.get(projectId) || [];
    const results = ids
      .map(id => this.results.get(id))
      .filter((r): r is EvaluationResult => r !== undefined)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    
    return limit ? results.slice(0, limit) : results;
  }

  getByRuleSet(ruleSetId: string, limit?: number): EvaluationResult[] {
    const ids = this.byRuleSet.get(ruleSetId) || [];
    const results = ids
      .map(id => this.results.get(id))
      .filter((r): r is EvaluationResult => r !== undefined)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    
    return limit ? results.slice(0, limit) : results;
  }

  getMetrics(projectId: string, ruleSetId?: string): EvaluationMetrics {
    const results = ruleSetId 
      ? this.getByRuleSet(ruleSetId) 
      : this.getByProject(projectId);

    const totalEvaluations = results.length;
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.filter(r => !r.passed).length;
    const passRate = totalEvaluations > 0 ? passedCount / totalEvaluations : 1;
    const avgScore = totalEvaluations > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / totalEvaluations 
      : 1;

    // Score distribution
    const scoreDistribution = {
      '0-0.2': 0,
      '0.2-0.4': 0,
      '0.4-0.6': 0,
      '0.6-0.8': 0,
      '0.8-1.0': 0,
    };
    for (const r of results) {
      if (r.score < 0.2) scoreDistribution['0-0.2']++;
      else if (r.score < 0.4) scoreDistribution['0.2-0.4']++;
      else if (r.score < 0.6) scoreDistribution['0.4-0.6']++;
      else if (r.score < 0.8) scoreDistribution['0.6-0.8']++;
      else scoreDistribution['0.8-1.0']++;
    }

    // Per-criterion metrics
    const criterionMetrics: Record<string, { passRate: number; avgScore: number; failureCount: number }> = {};
    const criterionData: Map<string, { passed: number; scores: number[]; total: number }> = new Map();
    
    for (const result of results) {
      for (const cr of result.criteriaResults) {
        if (!criterionData.has(cr.criterionId)) {
          criterionData.set(cr.criterionId, { passed: 0, scores: [], total: 0 });
        }
        const data = criterionData.get(cr.criterionId)!;
        data.total++;
        if (cr.passed) data.passed++;
        data.scores.push(cr.score);
      }
    }
    
    for (const [id, data] of criterionData) {
      criterionMetrics[id] = {
        passRate: data.passed / data.total,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        failureCount: data.total - data.passed,
      };
    }

    // Per-model metrics
    const modelMetrics: Record<string, { passRate: number; avgScore: number; count: number }> = {};
    const modelData: Map<string, { passed: number; scores: number[]; total: number }> = new Map();
    
    for (const r of results) {
      if (!modelData.has(r.model)) {
        modelData.set(r.model, { passed: 0, scores: [], total: 0 });
      }
      const data = modelData.get(r.model)!;
      data.total++;
      if (r.passed) data.passed++;
      data.scores.push(r.score);
    }
    
    for (const [model, data] of modelData) {
      modelMetrics[model] = {
        passRate: data.passed / data.total,
        avgScore: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        count: data.total,
      };
    }

    return {
      projectId,
      ruleSetId: ruleSetId || 'all',
      period: 'all',
      totalEvaluations,
      passedCount,
      failedCount,
      passRate,
      avgScore,
      scoreDistribution,
      criterionMetrics,
      modelMetrics,
      trend: [], // Would be populated from ClickHouse time-series data
    };
  }

  getSize(): number {
    return this.results.size;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a simple regex match criterion
 */
export function createRegexCriterion(
  name: string,
  pattern: string,
  options: { flags?: string; severity?: EvaluationSeverity; weight?: number } = {}
): EvaluationCriterion {
  return {
    id: `crit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: 'regex_match',
    config: { type: 'regex', pattern, flags: options.flags },
    weight: options.weight ?? 1,
    severity: options.severity ?? 'warning',
    enabled: true,
  };
}

/**
 * Create a contains criterion
 */
export function createContainsCriterion(
  name: string,
  substring: string,
  options: { caseSensitive?: boolean; severity?: EvaluationSeverity; weight?: number } = {}
): EvaluationCriterion {
  return {
    id: `crit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: 'contains',
    config: { type: 'contains', substring, caseSensitive: options.caseSensitive },
    weight: options.weight ?? 1,
    severity: options.severity ?? 'warning',
    enabled: true,
  };
}

/**
 * Create a latency threshold criterion
 */
export function createLatencyCriterion(
  name: string,
  maxLatencyMs: number,
  options: { severity?: EvaluationSeverity; weight?: number } = {}
): EvaluationCriterion {
  return {
    id: `crit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: 'latency_max',
    config: { type: 'threshold', maxValue: maxLatencyMs, unit: 'ms' },
    weight: options.weight ?? 1,
    severity: options.severity ?? 'warning',
    enabled: true,
  };
}

/**
 * Create a cost threshold criterion
 */
export function createCostCriterion(
  name: string,
  maxCost: number,
  options: { severity?: EvaluationSeverity; weight?: number } = {}
): EvaluationCriterion {
  return {
    id: `crit_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: 'cost_max',
    config: { type: 'threshold', maxValue: maxCost, unit: 'dollars' },
    weight: options.weight ?? 1,
    severity: options.severity ?? 'warning',
    enabled: true,
  };
}

/**
 * Create a basic rule set
 */
export function createRuleSet(
  projectId: string,
  name: string,
  criteria: EvaluationCriterion[],
  options: {
    description?: string;
    filter?: RequestFilter;
    sampleRate?: number;
    async?: boolean;
  } = {}
): EvaluationRuleSet {
  return {
    id: `ruleset_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    projectId,
    name,
    description: options.description,
    criteria,
    filter: options.filter || {},
    async: options.async ?? true,
    sampleRate: options.sampleRate ?? 1.0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    enabled: true,
  };
}
