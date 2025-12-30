/**
 * Event creation and validation utilities for AI Observability Platform
 * Provides factory functions and validators for all observability events
 */

import type {
  ObservabilityEvent,
  PromptCallEvent,
  AgentStepEvent,
  ErrorEvent,
  AssertionFailedEvent,
  HallucinationDetectedEvent,
  PerformanceAlertEvent,
  BaseEvent,
  SDKConfig,
  EventType,
  Status,
  ErrorInfo
} from './types';

/**
 * Creates a base event with common fields
 */
export function createBaseEvent(
  config: SDKConfig,
  eventType: EventType,
  runId: string,
  overrides: Partial<BaseEvent> = {}
): BaseEvent {
  return {
    event_id: generateEventId(),
    project_id: config.project_id,
    run_id: runId,
    timestamp: new Date().toISOString(),
    tags: [],
    env: config.environment || 'development',
    client: {
      sdk_version: '1.0.0', // This should come from package.json
      platform: typeof globalThis !== 'undefined' && (globalThis as any).window ? 'browser' : 'node'
    },
    ...overrides
  };
}

/**
 * Creates a prompt call event
 */
export function createPromptCallEvent(
  config: SDKConfig,
  runId: string,
  data: Omit<PromptCallEvent, keyof BaseEvent | 'event_type'>
): PromptCallEvent {
  const baseEvent = createBaseEvent(config, 'prompt_call', runId);
  
  return {
    ...baseEvent,
    event_type: 'prompt_call',
    prompt: data.prompt,
    prompt_template_id: data.prompt_template_id,
    model: data.model,
    model_version: data.model_version,
    tokens_input: data.tokens_input,
    tokens_output: data.tokens_output,
    cost_estimate_usd: data.cost_estimate_usd,
    response: data.response,
    response_metadata: data.response_metadata || {},
    tool_calls: data.tool_calls || [],
    status: data.status,
    error: data.error,
    latency_ms: data.latency_ms
  };
}

/**
 * Creates an agent step event
 */
export function createAgentStepEvent(
  config: SDKConfig,
  runId: string,
  data: Omit<AgentStepEvent, keyof BaseEvent | 'event_type'>
): AgentStepEvent {
  const baseEvent = createBaseEvent(config, 'agent_step', runId);
  
  return {
    ...baseEvent,
    event_type: 'agent_step',
    step_number: data.step_number,
    step_name: data.step_name,
    step_type: data.step_type,
    input_data: data.input_data,
    output_data: data.output_data,
    reasoning: data.reasoning,
    context: data.context || {},
    latency_ms: data.latency_ms,
    status: data.status,
    error: data.error
  };
}

/**
 * Creates an error event
 */
export function createErrorEvent(
  config: SDKConfig,
  runId: string,
  error: Error | ErrorInfo,
  context: Record<string, any> = {}
): ErrorEvent {
  const baseEvent = createBaseEvent(config, 'error', runId);
  const errorInfo = error instanceof Error 
    ? {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      }
    : error;
  
  return {
    ...baseEvent,
    event_type: 'error',
    error: errorInfo,
    context,
    stack_trace: errorInfo.stack
  };
}

/**
 * Creates an assertion failed event
 */
export function createAssertionFailedEvent(
  config: SDKConfig,
  runId: string,
  data: Omit<AssertionFailedEvent, keyof BaseEvent | 'event_type'>
): AssertionFailedEvent {
  const baseEvent = createBaseEvent(config, 'assertion_failed', runId);
  
  return {
    ...baseEvent,
    event_type: 'assertion_failed',
    assertion_name: data.assertion_name,
    assertion_type: data.assertion_type,
    expected: data.expected,
    actual: data.actual,
    severity: data.severity
  };
}

/**
 * Creates a hallucination detected event
 */
export function createHallucinationDetectedEvent(
  config: SDKConfig,
  runId: string,
  data: Omit<HallucinationDetectedEvent, keyof BaseEvent | 'event_type'>
): HallucinationDetectedEvent {
  const baseEvent = createBaseEvent(config, 'hallucination_detected', runId);
  
  return {
    ...baseEvent,
    event_type: 'hallucination_detected',
    detection_method: data.detection_method,
    confidence_score: data.confidence_score,
    flagged_content: data.flagged_content,
    ground_truth: data.ground_truth,
    recommendations: data.recommendations || []
  };
}

/**
 * Creates a performance alert event
 */
export function createPerformanceAlertEvent(
  config: SDKConfig,
  runId: string,
  data: Omit<PerformanceAlertEvent, keyof BaseEvent | 'event_type'>
): PerformanceAlertEvent {
  const baseEvent = createBaseEvent(config, 'cost_threshold_exceeded', runId);
  
  return {
    ...baseEvent,
    event_type: 'cost_threshold_exceeded',
    alert_type: data.alert_type,
    threshold: data.threshold,
    actual_value: data.actual_value,
    window_minutes: data.window_minutes,
    affected_models: data.affected_models
  };
}

/**
 * Validates an event object
 */
export function validateEvent(event: ObservabilityEvent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Base event validation
  if (!event.event_id || typeof event.event_id !== 'string') {
    errors.push('event_id is required and must be a string');
  }
  
  if (!event.project_id || typeof event.project_id !== 'string') {
    errors.push('project_id is required and must be a string');
  }
  
  if (!event.run_id || typeof event.run_id !== 'string') {
    errors.push('run_id is required and must be a string');
  }
  
  if (!event.timestamp || !isValidISODate(event.timestamp)) {
    errors.push('timestamp is required and must be a valid ISO date');
  }
  
  if (!Array.isArray(event.tags)) {
    errors.push('tags must be an array');
  }
  
  if (!['production', 'staging', 'development'].includes(event.env)) {
    errors.push('env must be one of: production, staging, development');
  }
  
  // Event type specific validation
  switch (event.event_type) {
    case 'prompt_call':
      validatePromptCallEvent(event as PromptCallEvent, errors);
      break;
    case 'agent_step':
      validateAgentStepEvent(event as AgentStepEvent, errors);
      break;
    case 'error':
      validateErrorEvent(event as ErrorEvent, errors);
      break;
    case 'assertion_failed':
      validateAssertionFailedEvent(event as AssertionFailedEvent, errors);
      break;
    case 'hallucination_detected':
      validateHallucinationDetectedEvent(event as HallucinationDetectedEvent, errors);
      break;
    case 'cost_threshold_exceeded':
      validatePerformanceAlertEvent(event as PerformanceAlertEvent, errors);
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function validatePromptCallEvent(event: PromptCallEvent, errors: string[]): void {
  if (!event.prompt || typeof event.prompt !== 'string') {
    errors.push('prompt is required and must be a string');
  }
  
  if (!event.model || typeof event.model !== 'string') {
    errors.push('model is required and must be a string');
  }
  
  if (typeof event.tokens_input !== 'number' || event.tokens_input < 0) {
    errors.push('tokens_input is required and must be a non-negative number');
  }
  
  if (typeof event.tokens_output !== 'number' || event.tokens_output < 0) {
    errors.push('tokens_output is required and must be a non-negative number');
  }
  
  if (typeof event.cost_estimate_usd !== 'number' || event.cost_estimate_usd < 0) {
    errors.push('cost_estimate_usd is required and must be a non-negative number');
  }
  
  if (!event.response || typeof event.response !== 'string') {
    errors.push('response is required and must be a string');
  }
  
  if (typeof event.latency_ms !== 'number' || event.latency_ms < 0) {
    errors.push('latency_ms is required and must be a non-negative number');
  }
}

function validateAgentStepEvent(event: AgentStepEvent, errors: string[]): void {
  if (typeof event.step_number !== 'number' || event.step_number < 0) {
    errors.push('step_number is required and must be a non-negative number');
  }
  
  if (!event.step_name || typeof event.step_name !== 'string') {
    errors.push('step_name is required and must be a string');
  }
  
  if (!['reasoning', 'tool_call', 'validation', 'output'].includes(event.step_type)) {
    errors.push('step_type must be one of: reasoning, tool_call, validation, output');
  }
  
  if (!event.input_data || typeof event.input_data !== 'object') {
    errors.push('input_data is required and must be an object');
  }
  
  if (!event.output_data || typeof event.output_data !== 'object') {
    errors.push('output_data is required and must be an object');
  }
}

function validateErrorEvent(event: ErrorEvent, errors: string[]): void {
  if (!event.error || typeof event.error !== 'object') {
    errors.push('error is required and must be an object');
  } else {
    if (!event.error.message || typeof event.error.message !== 'string') {
      errors.push('error.message is required and must be a string');
    }
  }
}

function validateAssertionFailedEvent(event: AssertionFailedEvent, errors: string[]): void {
  if (!event.assertion_name || typeof event.assertion_name !== 'string') {
    errors.push('assertion_name is required and must be a string');
  }
  
  if (!['response_format', 'content_filter', 'safety_check', 'custom'].includes(event.assertion_type)) {
    errors.push('assertion_type must be one of: response_format, content_filter, safety_check, custom');
  }
  
  if (!['low', 'medium', 'high', 'critical'].includes(event.severity)) {
    errors.push('severity must be one of: low, medium, high, critical');
  }
}

function validateHallucinationDetectedEvent(event: HallucinationDetectedEvent, errors: string[]): void {
  if (!['heuristic', 'model_ensemble', 'ground_truth_verification'].includes(event.detection_method)) {
    errors.push('detection_method must be one of: heuristic, model_ensemble, ground_truth_verification');
  }
  
  if (typeof event.confidence_score !== 'number' || event.confidence_score < 0 || event.confidence_score > 1) {
    errors.push('confidence_score must be a number between 0 and 1');
  }
  
  if (!event.flagged_content || typeof event.flagged_content !== 'string') {
    errors.push('flagged_content is required and must be a string');
  }
}

function validatePerformanceAlertEvent(event: PerformanceAlertEvent, errors: string[]): void {
  if (!['cost_spike', 'latency_spike', 'error_rate_spike', 'token_limit'].includes(event.alert_type)) {
    errors.push('alert_type must be one of: cost_spike, latency_spike, error_rate_spike, token_limit');
  }
  
  if (typeof event.threshold !== 'number' || event.threshold < 0) {
    errors.push('threshold must be a non-negative number');
  }
  
  if (typeof event.actual_value !== 'number' || event.actual_value < 0) {
    errors.push('actual_value must be a non-negative number');
  }
  
  if (typeof event.window_minutes !== 'number' || event.window_minutes <= 0) {
    errors.push('window_minutes must be a positive number');
  }
}

/**
 * Utility functions
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date.toISOString() === dateString;
}

/**
 * Redacts PII from events based on configuration
 */
export function redactPII(event: ObservabilityEvent, patterns?: RegExp[]): ObservabilityEvent {
  const defaultPatterns = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit cards
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  ];
  
  const redactionPatterns = patterns || defaultPatterns;
  const eventString = JSON.stringify(event);
  let redactedString = eventString;
  
  for (const pattern of redactionPatterns) {
    redactedString = redactedString.replace(pattern, '[REDACTED]');
  }
  
  return JSON.parse(redactedString);
}

/**
 * Calculates cost estimate for a prompt call
 */
export function calculateCostEstimate(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  // This is a simplified pricing model - in production, this should be more sophisticated
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  };
  
  const modelPricing = pricing[model] || { input: 0.001, output: 0.002 };
  return (tokensInput * modelPricing.input + tokensOutput * modelPricing.output) / 1000;
}
