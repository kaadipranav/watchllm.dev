/**
 * Type definitions for AI Observability Platform (Sentry for AI)
 * This file defines the core data structures for logging, monitoring, and debugging AI interactions
 */

// Core event types for observability
export type EventType = 
  | 'prompt_call'
  | 'tool_call' 
  | 'agent_step'
  | 'error'
  | 'assertion_failed'
  | 'hallucination_detected'
  | 'cost_threshold_exceeded'
  | 'performance_alert';

export type Status = 'success' | 'error' | 'timeout' | 'assertion_failed' | 'warning';

// Base event interface that all observability events extend
export interface BaseEvent {
  event_id: string;
  project_id: string;
  run_id: string;
  timestamp: string; // ISO8601
  user_id?: string;
  tags: string[];
  release?: string; // git SHA
  env: 'production' | 'staging' | 'development';
  client: {
    hostname?: string;
    sdk_version?: string;
    platform?: string;
  };
}

// Main prompt call event (core of the observability platform)
export interface PromptCallEvent extends BaseEvent {
  event_type: 'prompt_call';
  prompt: string;
  prompt_template_id?: string;
  model: string;
  model_version?: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate_usd: number;
  response: string;
  response_metadata: {
    safety_score?: number;
    hallucination_score?: number;
    confidence_score?: number;
    [key: string]: any;
  };
  tool_calls?: ToolCallEvent[];
  status: Status;
  error?: ErrorInfo;
  latency_ms: number;
}

// Tool call event for tracking agent/tool interactions
export interface ToolCallEvent {
  tool_name: string;
  tool_id?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  status: Status;
  error?: ErrorInfo;
}

// Agent step event for debugging multi-step workflows
export interface AgentStepEvent extends BaseEvent {
  event_type: 'agent_step';
  step_number: number;
  step_name: string;
  step_type: 'reasoning' | 'tool_call' | 'validation' | 'output';
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  reasoning?: string;
  context: Record<string, any>;
  latency_ms: number;
  status: Status;
  error?: ErrorInfo;
}

// Error event for tracking failures
export interface ErrorEvent extends BaseEvent {
  event_type: 'error';
  error: ErrorInfo;
  context: Record<string, any>;
  stack_trace?: string;
}

// Assertion failure event for LLM assertions
export interface AssertionFailedEvent extends BaseEvent {
  event_type: 'assertion_failed';
  assertion_name: string;
  assertion_type: 'response_format' | 'content_filter' | 'safety_check' | 'custom';
  expected: any;
  actual: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Hallucination detection event
export interface HallucinationDetectedEvent extends BaseEvent {
  event_type: 'hallucination_detected';
  detection_method: 'heuristic' | 'model_ensemble' | 'ground_truth_verification';
  confidence_score: number;
  flagged_content: string;
  ground_truth?: string;
  recommendations: string[];
}

// Performance and cost alerts
export interface PerformanceAlertEvent extends BaseEvent {
  event_type: 'cost_threshold_exceeded';
  alert_type: 'cost_spike' | 'latency_spike' | 'error_rate_spike' | 'token_limit';
  threshold: number;
  actual_value: number;
  window_minutes: number;
  affected_models?: string[];
}

// Error information structure
export interface ErrorInfo {
  message: string;
  type?: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
}

// Prompt template for versioning and management
export interface PromptTemplate {
  id: string;
  project_id: string;
  name: string;
  template: string;
  variables: string[];
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  metadata: {
    description?: string;
    tags?: string[];
    author?: string;
  };
}

// Assertion definition for automated testing
export interface Assertion {
  id: string;
  project_id: string;
  name: string;
  type: 'response_format' | 'content_filter' | 'safety_check' | 'custom';
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Monitoring configuration
export interface MonitoringConfig {
  project_id: string;
  cost_thresholds: {
    daily_limit_usd?: number;
    alert_on_spike: boolean;
    spike_percentage: number;
  };
  latency_thresholds: {
    warning_ms: number;
    critical_ms: number;
  };
  error_rate_thresholds: {
    warning_percentage: number;
    critical_percentage: number;
  };
  alerts: {
    email_enabled: boolean;
    webhook_url?: string;
    slack_webhook?: string;
  };
  retention_days: number;
}

// Aggregated metrics for dashboards
export interface ProjectMetrics {
  project_id: string;
  date: string; // YYYY-MM-DD
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost_usd: number;
  avg_latency_ms: number;
  error_rate: number;
  unique_models: string[];
  top_prompts: Array<{
    prompt_hash: string;
    count: number;
    avg_cost_usd: number;
  }>;
}

// Search and filter options
export interface EventQuery {
  project_id: string;
  run_id?: string;
  user_id?: string;
  event_types?: EventType[];
  status?: Status;
  models?: string[];
  tags?: string[];
  date_from?: string;
  date_to?: string;
  text_search?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'timestamp' | 'latency_ms' | 'cost_estimate_usd';
  sort_order?: 'asc' | 'desc';
}

// API response types
export interface EventListResponse {
  events: (PromptCallEvent | AgentStepEvent | ErrorEvent | AssertionFailedEvent | HallucinationDetectedEvent | PerformanceAlertEvent)[];
  total: number;
  has_more: boolean;
}

export interface MetricsResponse {
  metrics: ProjectMetrics[];
  summary: {
    total_cost_usd: number;
    total_requests: number;
    avg_success_rate: number;
    top_model: string;
  };
}

// SDK configuration
export interface SDKConfig {
  api_key: string;
  project_id: string;
  base_url?: string;
  environment?: 'production' | 'staging' | 'development';
  sample_rate?: number; // 0.0 to 1.0 for sampling events
  redact_pii?: boolean;
  batch_size?: number;
  flush_interval_seconds?: number;
}

// Integration types
export interface Integration {
  id: string;
  type: 'slack' | 'webhook' | 'pagerduty' | 'datadog' | 'opentelemetry';
  config: Record<string, any>;
  is_active: boolean;
  project_id: string;
  created_at: string;
}

// Export all types for easy importing
export type ObservabilityEvent = 
  | PromptCallEvent 
  | AgentStepEvent 
  | ErrorEvent 
  | AssertionFailedEvent 
  | HallucinationDetectedEvent 
  | PerformanceAlertEvent;
