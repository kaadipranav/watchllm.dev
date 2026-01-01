/**
 * Input validation utilities for API requests
 * Implements defense-in-depth validation following OWASP best practices
 */

import { z } from 'zod';
import type { ChatCompletionRequest, CompletionRequest, EmbeddingsRequest } from '../types';
import type {
  ObservabilityEvent,
  BaseEvent,
  PromptCallEvent,
  ToolCallEvent,
  AgentStepEvent,
  ErrorEvent,
  AssertionFailedEvent,
  HallucinationDetectedEvent,
  PerformanceAlertEvent
} from '../../../packages/shared/src/observability/types';

// Maximum request body size (1MB)
export const MAX_REQUEST_SIZE_BYTES = 1024 * 1024;

// Maximum message content length
const MAX_MESSAGE_LENGTH = 100_000;

// Maximum array lengths
const MAX_MESSAGES = 100;
const MAX_STOP_SEQUENCES = 10;
const MAX_TOOLS = 50;

// Allowed models (whitelist approach)
const ALLOWED_MODELS = new Set([
  // OpenAI
  'gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview', 'gpt-4o', 'gpt-4o-mini',
  'gpt-3.5-turbo', 'gpt-3.5-turbo-16k',
  'text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large',
  // Anthropic
  'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307',
  'claude-3-5-sonnet-20240620', 'claude-3-5-sonnet-20241022',
  // Groq
  'llama-3.1-70b-versatile', 'llama-3.1-8b-instant',
  'llama3-groq-70b-8192-tool-use-preview', 'mixtral-8x7b-32768',
]);

const VALID_ROLES = new Set(['system', 'user', 'assistant', 'function', 'tool']);

// Zod schemas for observability events
const baseEventSchema = z.object({
  event_id: z.string().uuid('event_id must be a valid UUID'),
  project_id: z.string().min(1, 'project_id is required'),
  run_id: z.string().min(1, 'run_id is required'),
  timestamp: z.string().datetime('timestamp must be a valid ISO8601 datetime'),
  user_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  release: z.string().optional(),
  env: z.enum(['production', 'staging', 'development']),
  client: z.object({
    hostname: z.string().optional(),
    sdk_version: z.string().optional(),
    platform: z.string().optional(),
  }).default({}),
});

const errorInfoSchema = z.object({
  message: z.string().min(1, 'error message is required'),
  type: z.string().optional(),
  code: z.string().optional(),
  stack: z.string().optional(),
  context: z.record(z.any()).optional(),
});

const toolCallEventSchema = z.object({
  tool_name: z.string().min(1, 'tool_name is required'),
  tool_id: z.string().optional(),
  input: z.record(z.any()),
  output: z.record(z.any()),
  latency_ms: z.number().int().min(0),
  status: z.enum(['success', 'error', 'timeout', 'assertion_failed', 'warning']),
  error: errorInfoSchema.optional(),
});

const promptCallEventSchema = baseEventSchema.extend({
  event_type: z.literal('prompt_call'),
  prompt: z.string().min(1, 'prompt is required'),
  prompt_template_id: z.string().optional(),
  model: z.string().min(1, 'model is required'),
  model_version: z.string().optional(),
  tokens_input: z.number().int().min(0),
  tokens_output: z.number().int().min(0),
  cost_estimate_usd: z.number().min(0),
  response: z.string(),
  response_metadata: z.object({
    safety_score: z.number().min(0).max(1).optional(),
    hallucination_score: z.number().min(0).max(1).optional(),
    confidence_score: z.number().min(0).max(1).optional(),
  }).catchall(z.any()).default({}),
  tool_calls: z.array(toolCallEventSchema).optional(),
  status: z.enum(['success', 'error', 'timeout', 'assertion_failed', 'warning']),
  error: errorInfoSchema.optional(),
  latency_ms: z.number().int().min(0),
});

const agentStepEventSchema = baseEventSchema.extend({
  event_type: z.literal('agent_step'),
  step_number: z.number().int().min(0),
  step_name: z.string().min(1, 'step_name is required'),
  step_type: z.enum(['reasoning', 'tool_call', 'validation', 'output']),
  input_data: z.record(z.any()),
  output_data: z.record(z.any()),
  reasoning: z.string().optional(),
  context: z.record(z.any()),
  latency_ms: z.number().int().min(0),
  status: z.enum(['success', 'error', 'timeout', 'assertion_failed', 'warning']),
  error: errorInfoSchema.optional(),
});

const errorEventSchema = baseEventSchema.extend({
  event_type: z.literal('error'),
  error: errorInfoSchema,
  context: z.record(z.any()),
  stack_trace: z.string().optional(),
});

const assertionFailedEventSchema = baseEventSchema.extend({
  event_type: z.literal('assertion_failed'),
  assertion_name: z.string().min(1, 'assertion_name is required'),
  assertion_type: z.enum(['response_format', 'content_filter', 'safety_check', 'custom']),
  expected: z.any(),
  actual: z.any(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
});

const hallucinationDetectedEventSchema = baseEventSchema.extend({
  event_type: z.literal('hallucination_detected'),
  detection_method: z.enum(['heuristic', 'model_ensemble', 'ground_truth_verification']),
  confidence_score: z.number().min(0).max(1),
  flagged_content: z.string().min(1, 'flagged_content is required'),
  ground_truth: z.string().optional(),
  recommendations: z.array(z.string()),
});

const performanceAlertEventSchema = baseEventSchema.extend({
  event_type: z.literal('cost_threshold_exceeded'),
  alert_type: z.enum(['cost_spike', 'latency_spike', 'error_rate_spike', 'token_limit']),
  threshold: z.number().min(0),
  actual_value: z.number().min(0),
  window_minutes: z.number().int().min(1),
  affected_models: z.array(z.string()).optional(),
});

// Union schema for all observability events
const observabilityEventSchema = z.discriminatedUnion('event_type', [
  promptCallEventSchema,
  agentStepEventSchema,
  errorEventSchema,
  assertionFailedEventSchema,
  hallucinationDetectedEventSchema,
  performanceAlertEventSchema,
]);

// Schema for batch events
const batchEventsSchema = z.object({
  events: z.array(observabilityEventSchema).min(1, 'events array cannot be empty').max(100, 'maximum 100 events per batch'),
});

/**
 * Sanitize string input - remove null bytes and control characters
 */
export function sanitizeString(input: string): string {
  // Remove null bytes and non-printable control characters (except newlines/tabs)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Check if model is allowed
 */
export function isAllowedModel(model: string): boolean {
  return ALLOWED_MODELS.has(model);
}

/**
 * Validate and sanitize chat completion request
 */
export function validateChatRequest(body: unknown): { valid: true; data: ChatCompletionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = body as Record<string, unknown>;

  // Model validation
  if (!req.model || typeof req.model !== 'string') {
    return { valid: false, error: 'model is required and must be a string' };
  }

  if (!isAllowedModel(req.model)) {
    return { valid: false, error: `Model "${req.model}" is not supported` };
  }

  // Messages validation
  if (!req.messages || !Array.isArray(req.messages)) {
    return { valid: false, error: 'messages is required and must be an array' };
  }

  if (req.messages.length === 0) {
    return { valid: false, error: 'messages array cannot be empty' };
  }

  if (req.messages.length > MAX_MESSAGES) {
    return { valid: false, error: `messages array exceeds maximum length of ${MAX_MESSAGES}` };
  }

  // Validate each message
  for (let i = 0; i < req.messages.length; i++) {
    const msg = req.messages[i];
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: `messages[${i}] must be an object` };
    }

    if (!msg.role || typeof msg.role !== 'string' || !VALID_ROLES.has(msg.role)) {
      return { valid: false, error: `messages[${i}].role must be one of: ${[...VALID_ROLES].join(', ')}` };
    }

    if (msg.content !== null && msg.content !== undefined) {
      if (typeof msg.content !== 'string') {
        return { valid: false, error: `messages[${i}].content must be a string or null` };
      }
      if (msg.content.length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: `messages[${i}].content exceeds maximum length of ${MAX_MESSAGE_LENGTH}` };
      }
      // Sanitize content
      (msg as Record<string, unknown>).content = sanitizeString(msg.content);
    }
  }

  // Temperature validation
  if (req.temperature !== undefined) {
    const temp = Number(req.temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return { valid: false, error: 'temperature must be a number between 0 and 2' };
    }
  }

  // Max tokens validation
  if (req.max_tokens !== undefined) {
    const maxTokens = Number(req.max_tokens);
    if (isNaN(maxTokens) || maxTokens < 1 || maxTokens > 128000) {
      return { valid: false, error: 'max_tokens must be a positive integer up to 128000' };
    }
  }

  // Stop sequences validation
  if (req.stop !== undefined) {
    if (typeof req.stop === 'string') {
      if (req.stop.length > 1000) {
        return { valid: false, error: 'stop sequence exceeds maximum length' };
      }
    } else if (Array.isArray(req.stop)) {
      if (req.stop.length > MAX_STOP_SEQUENCES) {
        return { valid: false, error: `stop array exceeds maximum length of ${MAX_STOP_SEQUENCES}` };
      }
    } else {
      return { valid: false, error: 'stop must be a string or array of strings' };
    }
  }

  // Tools validation
  if (req.tools !== undefined) {
    if (!Array.isArray(req.tools)) {
      return { valid: false, error: 'tools must be an array' };
    }
    if (req.tools.length > MAX_TOOLS) {
      return { valid: false, error: `tools array exceeds maximum length of ${MAX_TOOLS}` };
    }
  }

  return { valid: true, data: req as unknown as ChatCompletionRequest };
}

/**
 * Validate and sanitize completion request
 */
export function validateCompletionRequest(body: unknown): { valid: true; data: CompletionRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = body as Record<string, unknown>;

  // Model validation
  if (!req.model || typeof req.model !== 'string') {
    return { valid: false, error: 'model is required and must be a string' };
  }

  // Prompt validation
  if (!req.prompt) {
    return { valid: false, error: 'prompt is required' };
  }

  if (typeof req.prompt === 'string') {
    if (req.prompt.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'prompt exceeds maximum length' };
    }
    req.prompt = sanitizeString(req.prompt);
  } else if (Array.isArray(req.prompt)) {
    for (let i = 0; i < req.prompt.length; i++) {
      if (typeof req.prompt[i] !== 'string') {
        return { valid: false, error: 'prompt array must contain only strings' };
      }
      if (req.prompt[i].length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: `prompt[${i}] exceeds maximum length` };
      }
      req.prompt[i] = sanitizeString(req.prompt[i]);
    }
  } else {
    return { valid: false, error: 'prompt must be a string or array of strings' };
  }

  // Temperature validation
  if (req.temperature !== undefined) {
    const temp = Number(req.temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      return { valid: false, error: 'temperature must be a number between 0 and 2' };
    }
  }

  return { valid: true, data: req as unknown as CompletionRequest };
}

/**
 * Validate and sanitize embeddings request
 */
export function validateEmbeddingsRequest(body: unknown): { valid: true; data: EmbeddingsRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const req = body as Record<string, unknown>;

  // Model validation
  if (!req.model || typeof req.model !== 'string') {
    return { valid: false, error: 'model is required and must be a string' };
  }

  // Input validation
  if (!req.input) {
    return { valid: false, error: 'input is required' };
  }

  if (typeof req.input === 'string') {
    if (req.input.length > MAX_MESSAGE_LENGTH) {
      return { valid: false, error: 'input exceeds maximum length' };
    }
    req.input = sanitizeString(req.input);
  } else if (Array.isArray(req.input)) {
    if (req.input.length > MAX_MESSAGES) {
      return { valid: false, error: `input array exceeds maximum length of ${MAX_MESSAGES}` };
    }
    for (let i = 0; i < req.input.length; i++) {
      if (typeof req.input[i] !== 'string') {
        return { valid: false, error: 'input array must contain only strings' };
      }
      if (req.input[i].length > MAX_MESSAGE_LENGTH) {
        return { valid: false, error: `input[${i}] exceeds maximum length` };
      }
      req.input[i] = sanitizeString(req.input[i]);
    }
  } else {
    return { valid: false, error: 'input must be a string or array of strings' };
  }

  return { valid: true, data: req as unknown as EmbeddingsRequest };
}

/**
 * Validate observability event payload
 */
export function validateObservabilityEvent(body: unknown): { valid: true; data: ObservabilityEvent } | { valid: false; error: string } {
  try {
    const validatedEvent = observabilityEventSchema.parse(body) as ObservabilityEvent;
    return { valid: true, data: validatedEvent };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { valid: false, error: `Validation failed: ${errorMessages}` };
    }
    return { valid: false, error: 'Invalid event format' };
  }
}

/**
 * Validate batch observability events payload
 */
export function validateBatchObservabilityEvents(body: unknown): { valid: true; data: { events: ObservabilityEvent[] } } | { valid: false; error: string } {
  try {
    const validatedBatch = batchEventsSchema.parse(body) as { events: ObservabilityEvent[] };
    return { valid: true, data: validatedBatch };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { valid: false, error: `Batch validation failed: ${errorMessages}` };
    }
    return { valid: false, error: 'Invalid batch format' };
  }
}

/**
 * Check request size against limit
 */
export function checkRequestSize(contentLength: string | undefined | null): { allowed: boolean; error?: string } {
  if (!contentLength) {
    return { allowed: true }; // Let body parsing handle missing content-length
  }

  const size = parseInt(contentLength, 10);
  if (isNaN(size)) {
    return { allowed: false, error: 'Invalid Content-Length header' };
  }

  if (size > MAX_REQUEST_SIZE_BYTES) {
    return { allowed: false, error: `Request body exceeds maximum size of ${MAX_REQUEST_SIZE_BYTES / 1024}KB` };
  }

  return { allowed: true };
}
