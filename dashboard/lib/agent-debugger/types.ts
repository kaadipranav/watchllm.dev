/**
 * Agent Debugger Types
 * 
 * Core type definitions for the Agent Debugger feature.
 * These types define the canonical JSON format for agent run instrumentation.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

// ============================================================================
// Step Types
// ============================================================================

export type StepType = 
  | 'user_input' 
  | 'decision' 
  | 'tool_call' 
  | 'tool_result' 
  | 'model_response' 
  | 'error' 
  | 'retry';

export type ExplainSource = 'deterministic' | 'llm';

// ============================================================================
// Flag Types
// ============================================================================

export type FlagType = 
  | 'loop_detected'
  | 'high_cost_step'
  | 'repeated_tool'
  | 'cache_miss_retry'
  | 'timeout_retry'
  | 'error_fallback'
  | 'prompt_mutation'
  | 'empty_tool_output';

export interface Flag {
  type: FlagType;
  description: string;
  severity: 'info' | 'warning' | 'error';
  details?: Record<string, unknown>;
}

// ============================================================================
// Step Types
// ============================================================================

export interface AgentStep {
  step_index: number;
  timestamp: string;
  type: StepType;
  summary?: string;
  raw?: string;
  
  // Decision-specific fields
  decision?: string;
  tool?: string;
  tool_args?: Record<string, unknown>;
  tool_output_summary?: string;
  
  // Cost attribution
  token_cost?: number;
  api_cost_usd?: number;
  cache_hit?: boolean;
  
  // Explanation fields (computed)
  why_explanation?: string;
  explain_confidence?: number;
  explain_source?: ExplainSource;
  explain_rules_matched?: string[];
  
  // Flags (computed)
  flags?: Flag[];
}

// ============================================================================
// Run Types
// ============================================================================

export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentRunMeta {
  region?: string;
  env?: string;
  [key: string]: unknown;
}

export interface AgentRun {
  run_id: string;
  started_at: string;
  ended_at?: string;
  user_id: string;
  project_id?: string;
  agent_name: string;
  status: RunStatus;
  steps: AgentStep[];
  total_cost_usd: number;
  meta?: AgentRunMeta;
}

// ============================================================================
// Debug View Model (computed from AgentRun)
// ============================================================================

export interface CachingOpportunity {
  step_index: number;
  similarity_score: number;
  original_cost: number;
  saved_cost: number;
  reference_step_index: number;
  message: string;
}

export interface CostSummary {
  total_cost_usd: number;
  wasted_spend_usd: number;
  amount_saved_usd: number;
  potential_savings_usd: number;
  cache_hit_rate: number;
  cacheable_requests: number;
  caching_opportunities: CachingOpportunity[];
  
  // Breakdown
  breakdown: {
    tool_calls_cost: number;
    model_responses_cost: number;
    retries_cost: number;
  };
}

export interface RunSummary {
  run_id: string;
  agent_name: string;
  started_at: string;
  ended_at?: string;
  status: RunStatus;
  duration_ms?: number;
  total_steps: number;
  cost: CostSummary;
  flags: Flag[];
  meta?: AgentRunMeta;
}

export interface StepDebugView extends AgentStep {
  // Additional computed fields for display
  duration_ms?: number;
  is_expensive: boolean;
  cost_percentage: number;
}

export interface AgentDebugViewModel {
  summary: RunSummary;
  steps: StepDebugView[];
  raw_json_url?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface AgentRunListItem {
  run_id: string;
  agent_name: string;
  started_at: string;
  ended_at?: string;
  status: RunStatus;
  total_cost_usd: number;
  total_steps: number;
  flags_count: number;
  has_warnings: boolean;
}

export interface AgentRunsListResponse {
  runs: AgentRunListItem[];
  total: number;
  has_more: boolean;
  limit: number;
  offset: number;
}

export interface AgentRunDebugResponse {
  debug: AgentDebugViewModel;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AgentDebuggerConfig {
  // Feature toggle
  enabled: boolean;
  
  // Flag thresholds
  loop_detection_threshold: number; // Number of same-type steps within time window
  loop_detection_window_seconds: number;
  high_cost_threshold_usd: number;
  repeated_tool_threshold: number;
  
  // LLM explainer settings
  explainer_enabled: boolean;
  explainer_model: string;
  explainer_max_tokens: number;
  explainer_confidence_threshold: number; // Below this, use LLM fallback
  
  // Privacy settings
  sanitize_pii: boolean;
  mask_api_keys: boolean;
  truncate_raw_payload_length: number;
}

export const DEFAULT_AGENT_DEBUGGER_CONFIG: AgentDebuggerConfig = {
  enabled: false, // Feature flag controlled
  
  loop_detection_threshold: 3,
  loop_detection_window_seconds: 30,
  high_cost_threshold_usd: 0.05,
  repeated_tool_threshold: 3,
  
  explainer_enabled: false,
  explainer_model: 'gpt-4o-mini',
  explainer_max_tokens: 150,
  explainer_confidence_threshold: 0.7,
  
  sanitize_pii: true,
  mask_api_keys: true,
  truncate_raw_payload_length: 5000,
};
