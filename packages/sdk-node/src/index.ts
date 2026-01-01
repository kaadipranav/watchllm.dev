/**
 * WatchLLM - TypeScript/Node.js SDK for AI Observability
 * Provides a simple interface for logging AI events and metrics
 */

import fetch from 'node-fetch';

// ============================================================================
// Types and Enums
// ============================================================================

export enum EventType {
  PROMPT_CALL = 'prompt_call',
  TOOL_CALL = 'tool_call',
  AGENT_STEP = 'agent_step',
  ERROR = 'error',
  ASSERTION_FAILED = 'assertion_failed',
  HALLUCINATION_DETECTED = 'hallucination_detected',
  COST_THRESHOLD_EXCEEDED = 'cost_threshold_exceeded',
  PERFORMANCE_ALERT = 'performance_alert',
}

export enum Status {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  ASSERTION_FAILED = 'assertion_failed',
  WARNING = 'warning',
}

export enum StepType {
  REASONING = 'reasoning',
  TOOL_CALL = 'tool_call',
  VALIDATION = 'validation',
  OUTPUT = 'output',
}

export enum AssertionType {
  RESPONSE_FORMAT = 'response_format',
  CONTENT_FILTER = 'content_filter',
  SAFETY_CHECK = 'safety_check',
  CUSTOM = 'custom',
}

export enum DetectionMethod {
  HEURISTIC = 'heuristic',
  MODEL_ENSEMBLE = 'model_ensemble',
  GROUND_TRUTH_VERIFICATION = 'ground_truth_verification',
}

export enum AlertType {
  COST_SPIKE = 'cost_spike',
  LATENCY_SPIKE = 'latency_spike',
  ERROR_RATE_SPIKE = 'error_rate_spike',
  TOKEN_LIMIT = 'token_limit',
}

export enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// ============================================================================
// Event Interfaces
// ============================================================================

export interface ClientInfo {
  sdk_version?: string;
  platform?: string;
  hostname?: string;
}

export interface BaseEvent {
  event_id: string;
  project_id: string;
  run_id: string;
  timestamp: string;
  user_id?: string;
  tags?: string[];
  release?: string;
  env?: string;
  client?: ClientInfo;
}

export interface ToolCallEvent {
  tool_name: string;
  tool_id?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
}

export interface PromptCallEvent extends BaseEvent {
  event_type: EventType.PROMPT_CALL;
  prompt: string;
  prompt_template_id?: string;
  model: string;
  model_version?: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate_usd: number;
  response: string;
  response_metadata?: Record<string, any>;
  tool_calls?: ToolCallEvent[];
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
  latency_ms: number;
}

export interface AgentStepEvent extends BaseEvent {
  event_type: EventType.AGENT_STEP;
  step_number: number;
  step_name: string;
  step_type: StepType | string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  reasoning?: string;
  context?: Record<string, any>;
  latency_ms: number;
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
}

export interface ErrorEvent extends BaseEvent {
  event_type: EventType.ERROR;
  error: {
    message: string;
    type?: string;
    stack?: string;
  };
  context?: Record<string, any>;
  stack_trace?: string;
}

export interface AssertionFailedEvent extends BaseEvent {
  event_type: EventType.ASSERTION_FAILED;
  assertion_name: string;
  assertion_type: AssertionType | string;
  expected: any;
  actual: any;
  severity: Severity | string;
}

export interface HallucinationDetectedEvent extends BaseEvent {
  event_type: EventType.HALLUCINATION_DETECTED;
  detection_method: DetectionMethod | string;
  confidence_score: number;
  flagged_content: string;
  ground_truth?: string;
  recommendations?: string[];
}

export interface PerformanceAlertEvent extends BaseEvent {
  event_type: EventType.PERFORMANCE_ALERT;
  alert_type: AlertType | string;
  threshold: number;
  actual_value: number;
  window_minutes: number;
  affected_models?: string[];
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface WatchLLMConfig {
  apiKey: string;
  projectId: string;
  baseUrl?: string;
  environment?: string;
  sampleRate?: number;
  redactPII?: boolean;
  batchSize?: number;
  flushIntervalSeconds?: number;
  timeout?: number;
}

// ============================================================================
// WatchLLM Client
// ============================================================================

export class WatchLLMClient {
  private apiKey: string;
  private projectId: string;
  private baseUrl: string;
  private environment: string;
  private sampleRate: number;
  private redactPII: boolean;
  private batchSize: number;
  private flushIntervalSeconds: number;
  private timeout: number;

  private eventQueue: any[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isShutdown = false;

  constructor(config: WatchLLMConfig) {
    this.apiKey = config.apiKey;
    this.projectId = config.projectId;
    this.baseUrl = (config.baseUrl || 'https://proxy.watchllm.dev/v1').replace(/\/$/, '');
    this.environment = config.environment || 'development';
    this.sampleRate = config.sampleRate ?? 1.0;
    this.redactPII = config.redactPII ?? true;
    this.batchSize = config.batchSize || 10;
    this.flushIntervalSeconds = config.flushIntervalSeconds || 5;
    this.timeout = config.timeout || 30000;

    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush().catch((err) => {
          console.error('[WatchLLM] Auto-flush error:', err);
        });
      }
    }, this.flushIntervalSeconds * 1000);

    // Don't keep Node.js process alive just for the timer
    if (this.flushTimer.unref) {
      this.flushTimer.unref();
    }
  }

  private shouldSample(): boolean {
    return this.sampleRate >= 1.0 || (this.sampleRate > 0 && Math.random() < this.sampleRate);
  }

  private redactPIIData(event: any): any {
    if (!this.redactPII) {
      return event;
    }

    const eventStr = JSON.stringify(event);
    
    // Redact emails
    let redacted = eventStr.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
    
    // Redact credit card numbers
    redacted = redacted.replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[REDACTED_CC]');
    
    return JSON.parse(redacted);
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private generateEventId(): string {
    // Simple UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private queueEvent(event: any): void {
    if (!this.shouldSample()) {
      return;
    }

    try {
      const redactedEvent = this.redactPIIData(event);
      this.eventQueue.push(redactedEvent);

      // Auto-flush if batch size reached
      if (this.eventQueue.length >= this.batchSize) {
        this.flush().catch((err) => {
          console.error('[WatchLLM] Auto-flush error:', err);
        });
      }
    } catch (error) {
      console.error('[WatchLLM] Failed to queue event:', error);
    }
  }

  private calculateCostEstimate(model: string, tokensInput: number, tokensOutput: number): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    };

    let modelPricing = pricing[model];
    if (!modelPricing) {
      if (model.includes('gpt-4')) {
        modelPricing = { input: 0.03, output: 0.06 };
      } else {
        modelPricing = { input: 0.001, output: 0.002 };
      }
    }

    return (tokensInput * modelPricing.input + tokensOutput * modelPricing.output) / 1000;
  }

  /**
   * Log a prompt call event (LLM request/response)
   */
  public logPromptCall(params: {
    runId: string;
    prompt: string;
    model: string;
    response: string;
    tokensInput: number;
    tokensOutput: number;
    latencyMs: number;
    status?: Status | string;
    error?: { message: string; type?: string; stack?: string };
    promptTemplateId?: string;
    modelVersion?: string;
    responseMetadata?: Record<string, any>;
    toolCalls?: ToolCallEvent[];
    tags?: string[];
    userId?: string;
    release?: string;
  }): string {
    const eventId = this.generateEventId();
    const costEstimate = this.calculateCostEstimate(params.model, params.tokensInput, params.tokensOutput);

    const event: PromptCallEvent = {
      event_id: eventId,
      event_type: EventType.PROMPT_CALL,
      project_id: this.projectId,
      run_id: params.runId,
      timestamp: this.getTimestamp(),
      prompt: params.prompt,
      model: params.model,
      tokens_input: params.tokensInput,
      tokens_output: params.tokensOutput,
      cost_estimate_usd: costEstimate,
      response: params.response,
      response_metadata: params.responseMetadata || {},
      tool_calls: params.toolCalls || [],
      latency_ms: params.latencyMs,
      status: params.status || Status.SUCCESS,
      error: params.error,
      prompt_template_id: params.promptTemplateId,
      model_version: params.modelVersion,
      tags: params.tags || [],
      user_id: params.userId,
      release: params.release,
      env: this.environment,
      client: {
        sdk_version: '0.1.0',
        platform: 'node',
        hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : 'unknown',
      },
    };

    this.queueEvent(event);
    return eventId;
  }

  /**
   * Log an agent step event
   */
  public logAgentStep(params: {
    runId: string;
    stepNumber: number;
    stepName: string;
    stepType: StepType | string;
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    latencyMs: number;
    status?: Status | string;
    reasoning?: string;
    context?: Record<string, any>;
    error?: { message: string; type?: string; stack?: string };
    tags?: string[];
    userId?: string;
    release?: string;
  }): string {
    const eventId = this.generateEventId();

    const event: AgentStepEvent = {
      event_id: eventId,
      event_type: EventType.AGENT_STEP,
      project_id: this.projectId,
      run_id: params.runId,
      timestamp: this.getTimestamp(),
      step_number: params.stepNumber,
      step_name: params.stepName,
      step_type: params.stepType,
      input_data: params.inputData,
      output_data: params.outputData,
      reasoning: params.reasoning,
      context: params.context || {},
      latency_ms: params.latencyMs,
      status: params.status || Status.SUCCESS,
      error: params.error,
      tags: params.tags || [],
      user_id: params.userId,
      release: params.release,
      env: this.environment,
      client: {
        sdk_version: '0.1.0',
        platform: 'node',
        hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : 'unknown',
      },
    };

    this.queueEvent(event);
    return eventId;
  }

  /**
   * Log an error event
   */
  public logError(params: {
    runId: string;
    error: Error | { message: string; type?: string; stack?: string };
    context?: Record<string, any>;
    tags?: string[];
    userId?: string;
    release?: string;
  }): string {
    const eventId = this.generateEventId();

    let errorDict: { message: string; type?: string; stack?: string };
    if (params.error instanceof Error) {
      errorDict = {
        message: params.error.message,
        type: params.error.name,
        stack: params.error.stack,
      };
    } else {
      errorDict = params.error;
    }

    const event: ErrorEvent = {
      event_id: eventId,
      event_type: EventType.ERROR,
      project_id: this.projectId,
      run_id: params.runId,
      timestamp: this.getTimestamp(),
      error: errorDict,
      context: params.context || {},
      stack_trace: errorDict.stack,
      tags: params.tags || [],
      user_id: params.userId,
      release: params.release,
      env: this.environment,
      client: {
        sdk_version: '0.1.0',
        platform: 'node',
        hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : 'unknown',
      },
    };

    this.queueEvent(event);
    return eventId;
  }

  /**
   * Flush all queued events to the API
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = this.eventQueue.splice(0, 100); // Take up to 100 events

    try {
      await this.sendEventsBatch(events);
    } catch (error) {
      console.error('[WatchLLM] Failed to flush events:', error);
      // Re-queue events on failure (at the front)
      this.eventQueue.unshift(...events);
      throw error;
    }
  }

  private async sendEventsBatch(events: any[]): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/events/batch`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Close the client and flush remaining events
   */
  public async close(): Promise<void> {
    this.isShutdown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      await this.flush();
    } catch (error) {
      console.error('[WatchLLM] Error during final flush:', error);
    }
  }
}

/**
 * Initialize a new WatchLLM client
 */
export function init(config: WatchLLMConfig): WatchLLMClient {
  return new WatchLLMClient(config);
}

export default WatchLLMClient;
