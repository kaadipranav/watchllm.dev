/**
 * Type definitions for WatchLLM Worker
 */

// Environment bindings for Cloudflare Worker
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY?: string;
  GROQ_API_KEY?: string;
  APP_URL?: string;
  EMAIL_TRIGGER_SECRET?: string;
}

// API Key record from Supabase
export interface APIKeyRecord {
  id: string;
  key: string;
  project_id: string;
  name: string | null;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

// Project record from Supabase
export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro';
  created_at: string;
  updated_at: string;
}

// Plan limits configuration
export interface PlanLimits {
  requestsPerMonth: number;
  requestsPerMinute: number;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    requestsPerMonth: 50_000,
    requestsPerMinute: 10,
  },
  starter: {
    requestsPerMonth: 250_000,
    requestsPerMinute: 50,
  },
  pro: {
    requestsPerMonth: 1_000_000,
    requestsPerMinute: 200,
  },
};

// OpenAI compatible message format
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string | null;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

// Chat completion request
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  functions?: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  }>;
  function_call?: 'none' | 'auto' | { name: string };
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;
  tool_choice?: 'none' | 'auto' | { type: 'function'; function: { name: string } };
}

// Chat completion response
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Legacy completion request
export interface CompletionRequest {
  model: string;
  prompt: string | string[];
  suffix?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  logprobs?: number;
  echo?: boolean;
  stop?: string | string[];
  presence_penalty?: number;
  frequency_penalty?: number;
  best_of?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}

// Legacy completion response
export interface CompletionResponse {
  id: string;
  object: 'text_completion';
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logprobs: null | Record<string, unknown>;
    finish_reason: 'stop' | 'length' | null;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Embeddings request
export interface EmbeddingsRequest {
  model: string;
  input: string | string[];
  user?: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
}

// Embeddings response
export interface EmbeddingsResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// Usage log entry
export interface UsageLogEntry {
  project_id: string;
  api_key_id: string;
  model: string;
  provider: 'openai' | 'anthropic' | 'groq';
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_usd: number;
  cached: boolean;
  latency_ms: number;
}

// API Error response
export interface APIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

// Validated API key result
export interface ValidatedAPIKey {
  keyRecord: APIKeyRecord;
  project: ProjectRecord;
}

// Cache entry
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

// Provider types
export type Provider = 'openai' | 'anthropic' | 'groq';

// Model to provider mapping
export const MODEL_PROVIDER_MAP: Record<string, Provider> = {
  // OpenAI models
  'gpt-4': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-4-turbo-preview': 'openai',
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-3.5-turbo': 'openai',
  'gpt-3.5-turbo-16k': 'openai',
  'text-embedding-ada-002': 'openai',
  'text-embedding-3-small': 'openai',
  'text-embedding-3-large': 'openai',
  // Anthropic models
  'claude-3-opus-20240229': 'anthropic',
  'claude-3-sonnet-20240229': 'anthropic',
  'claude-3-haiku-20240307': 'anthropic',
  'claude-3-5-sonnet-20240620': 'anthropic',
  'claude-3-5-sonnet-20241022': 'anthropic',
  // Groq models
  'llama-3.1-70b-versatile': 'groq',
  'llama-3.1-8b-instant': 'groq',
  'llama3-groq-70b-8192-tool-use-preview': 'groq',
  'mixtral-8x7b-32768': 'groq',
  'gemma2-9b-it': 'groq',
};

// Pricing per 1K tokens (in USD)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-16k': { input: 0.001, output: 0.002 },
  'text-embedding-ada-002': { input: 0.0001, output: 0 },
  'text-embedding-3-small': { input: 0.00002, output: 0 },
  'text-embedding-3-large': { input: 0.00013, output: 0 },
  // Anthropic
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  // Groq (much cheaper)
  'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
  'llama3-groq-70b-8192-tool-use-preview': { input: 0.00089, output: 0.00089 },
  'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 },
  'gemma2-9b-it': { input: 0.0002, output: 0.0002 },
};

// Calculate cost for a request
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;
}
