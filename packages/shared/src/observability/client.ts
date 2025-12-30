/**
 * Core client for AI Observability Platform
 * Provides the main SDK interface for logging events and managing configuration
 */

import type {
  ObservabilityEvent,
  SDKConfig,
  EventQuery,
  EventListResponse,
  MetricsResponse,
  BaseEvent
} from './types';
import {
  createPromptCallEvent,
  createAgentStepEvent,
  createErrorEvent,
  createAssertionFailedEvent,
  createHallucinationDetectedEvent,
  createPerformanceAlertEvent,
  validateEvent,
  redactPII,
  calculateCostEstimate
} from './events';

// Type for timer reference
type Timer = any;

/**
 * Main observability client class
 */
export class ObservabilityClient {
  private config: SDKConfig;
  private eventQueue: ObservabilityEvent[] = [];
  private flushTimer?: Timer;
  private isDestroyed = false;

  constructor(config: SDKConfig) {
    this.config = {
      ...config,
      sample_rate: config.sample_rate ?? 1.0,
      redact_pii: config.redact_pii ?? true,
      batch_size: config.batch_size ?? 10,
      flush_interval_seconds: config.flush_interval_seconds ?? 5
    };

    // Start auto-flush timer
    this.startFlushTimer();
  }

  /**
   * Logs a prompt call event
   */
  async logPromptCall(data: {
    runId: string;
    prompt: string;
    model: string;
    response: string;
    tokensInput: number;
    tokensOutput: number;
    latencyMs: number;
    status: 'success' | 'error' | 'timeout';
    error?: {
      message: string;
      type?: string;
      stack?: string;
    };
    promptTemplateId?: string;
    modelVersion?: string;
    responseMetadata?: Record<string, any>;
    toolCalls?: Array<{
      toolName: string;
      input: Record<string, any>;
      output: Record<string, any>;
      latencyMs: number;
      status: 'success' | 'error';
      error?: {
        message: string;
        type?: string;
      };
    }>;
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const costEstimate = calculateCostEstimate(data.model, data.tokensInput, data.tokensOutput);
    
    const event = createPromptCallEvent(this.config, data.runId, {
      prompt: data.prompt,
      model: data.model,
      response: data.response,
      tokens_input: data.tokensInput,
      tokens_output: data.tokensOutput,
      cost_estimate_usd: costEstimate,
      latency_ms: data.latencyMs,
      status: data.status,
      error: data.error,
      prompt_template_id: data.promptTemplateId,
      model_version: data.modelVersion,
      response_metadata: data.responseMetadata || {},
      tool_calls: data.toolCalls?.map(tc => ({
        tool_name: tc.toolName,
        input: tc.input,
        output: tc.output,
        latency_ms: tc.latencyMs,
        status: tc.status,
        error: tc.error
      }))
    });
    
    // Add optional fields through overrides
    if (data.tags) (event as BaseEvent).tags = data.tags;
    if (data.userId) (event as BaseEvent).user_id = data.userId;
    if (data.release) (event as BaseEvent).release = data.release;

    await this.addEvent(event);
  }

  /**
   * Logs an agent step event
   */
  async logAgentStep(data: {
    runId: string;
    stepNumber: number;
    stepName: string;
    stepType: 'reasoning' | 'tool_call' | 'validation' | 'output';
    inputData: Record<string, any>;
    outputData: Record<string, any>;
    reasoning?: string;
    context?: Record<string, any>;
    latencyMs: number;
    status: 'success' | 'error' | 'timeout';
    error?: {
      message: string;
      type?: string;
    };
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const event = createAgentStepEvent(this.config, data.runId, {
      step_number: data.stepNumber,
      step_name: data.stepName,
      step_type: data.stepType,
      input_data: data.inputData,
      output_data: data.outputData,
      reasoning: data.reasoning,
      context: data.context || {},
      latency_ms: data.latencyMs,
      status: data.status,
      error: data.error
    });
    
    // Add optional fields through overrides
    if (data.tags) (event as BaseEvent).tags = data.tags;
    if (data.userId) (event as BaseEvent).user_id = data.userId;
    if (data.release) (event as BaseEvent).release = data.release;

    await this.addEvent(event);
  }

  /**
   * Logs an error event
   */
  async logError(data: {
    runId: string;
    error: Error | {
      message: string;
      type?: string;
      stack?: string;
    };
    context?: Record<string, any>;
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const event = createErrorEvent(this.config, data.runId, data.error, data.context);
    
    if (data.tags) event.tags = data.tags;
    if (data.userId) event.user_id = data.userId;
    if (data.release) event.release = data.release;

    await this.addEvent(event);
  }

  /**
   * Logs an assertion failure event
   */
  async logAssertionFailure(data: {
    runId: string;
    assertionName: string;
    assertionType: 'response_format' | 'content_filter' | 'safety_check' | 'custom';
    expected: any;
    actual: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const event = createAssertionFailedEvent(this.config, data.runId, {
      assertion_name: data.assertionName,
      assertion_type: data.assertionType,
      expected: data.expected,
      actual: data.actual,
      severity: data.severity
    });
    
    // Add optional fields through overrides
    if (data.tags) (event as BaseEvent).tags = data.tags;
    if (data.userId) (event as BaseEvent).user_id = data.userId;
    if (data.release) (event as BaseEvent).release = data.release;

    await this.addEvent(event);
  }

  /**
   * Logs a hallucination detection event
   */
  async logHallucinationDetection(data: {
    runId: string;
    detectionMethod: 'heuristic' | 'model_ensemble' | 'ground_truth_verification';
    confidenceScore: number;
    flaggedContent: string;
    groundTruth?: string;
    recommendations?: string[];
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const event = createHallucinationDetectedEvent(this.config, data.runId, {
      detection_method: data.detectionMethod,
      confidence_score: data.confidenceScore,
      flagged_content: data.flaggedContent,
      ground_truth: data.groundTruth,
      recommendations: data.recommendations || []
    });
    
    // Add optional fields through overrides
    if (data.tags) (event as BaseEvent).tags = data.tags;
    if (data.userId) (event as BaseEvent).user_id = data.userId;
    if (data.release) (event as BaseEvent).release = data.release;

    await this.addEvent(event);
  }

  /**
   * Logs a performance alert event
   */
  async logPerformanceAlert(data: {
    runId: string;
    alertType: 'cost_spike' | 'latency_spike' | 'error_rate_spike' | 'token_limit';
    threshold: number;
    actualValue: number;
    windowMinutes: number;
    affectedModels?: string[];
    tags?: string[];
    userId?: string;
    release?: string;
  }): Promise<void> {
    const event = createPerformanceAlertEvent(this.config, data.runId, {
      alert_type: data.alertType,
      threshold: data.threshold,
      actual_value: data.actualValue,
      window_minutes: data.windowMinutes,
      affected_models: data.affectedModels
    });
    
    // Add optional fields through overrides
    if (data.tags) (event as BaseEvent).tags = data.tags;
    if (data.userId) (event as BaseEvent).user_id = data.userId;
    if (data.release) (event as BaseEvent).release = data.release;

    await this.addEvent(event);
  }

  /**
   * Queries events from the API
   */
  async getEvents(query: EventQuery): Promise<EventListResponse> {
    const response = await this.makeRequest('/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    });

    return response.json();
  }

  /**
   * Gets project metrics
   */
  async getMetrics(projectId: string, dateFrom?: string, dateTo?: string): Promise<MetricsResponse> {
    const params = this.buildQueryString({
      project_id: projectId,
      ...(dateFrom && { date_from: dateFrom }),
      ...(dateTo && { date_to: dateTo })
    });

    const response = await this.makeRequest(`/metrics?${params}`);
    return response.json();
  }

  /**
   * Manually flush the event queue
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      // Re-add events to queue on failure
      this.eventQueue.unshift(...events);
      // Use a simple logger instead of console for compatibility
      if (typeof globalThis !== 'undefined' && (globalThis as any).console) {
        (globalThis as any).console.error('Failed to send events:', error);
      }
    }
  }

  /**
   * Destroys the client and cleans up resources
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    
    if (this.flushTimer) {
      this.clearTimer(this.flushTimer);
      this.flushTimer = undefined;
    }

    // Flush remaining events
    this.flush().catch(() => {});
  }

  /**
   * Adds an event to the queue
   */
  private async addEvent(event: ObservabilityEvent): Promise<void> {
    if (this.isDestroyed) return;

    // Sample events if sample rate is less than 1
    if (this.config.sample_rate! < 1 && Math.random() > this.config.sample_rate!) {
      return;
    }

    // Validate event
    const validation = validateEvent(event);
    if (!validation.valid) {
      // Use a simple logger instead of console for compatibility
      if (typeof globalThis !== 'undefined' && (globalThis as any).console) {
        (globalThis as any).console.warn('Invalid event:', validation.errors);
      }
      return;
    }

    // Redact PII if enabled
    const processedEvent = this.config.redact_pii! ? redactPII(event) : event;

    this.eventQueue.push(processedEvent);

    // Auto-flush if batch size reached
    if (this.eventQueue.length >= this.config.batch_size!) {
      await this.flush();
    }
  }

  /**
   * Sends events to the API
   */
  private async sendEvents(events: ObservabilityEvent[]): Promise<void> {
    await this.makeRequest('/events/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events })
    });
  }

  /**
   * Makes an HTTP request to the API
   */
  private async makeRequest(path: string, options: any = {}): Promise<any> {
    const url = `${this.config.base_url || 'https://api.aisentry.com/v1'}${path}`;
    
    const response = await this.fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.api_key}`,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  }

  /**
   * Starts the auto-flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = this.setTimeout(() => {
      this.flush().then(() => {
        if (!this.isDestroyed) {
          this.startFlushTimer();
        }
      });
    }, this.config.flush_interval_seconds! * 1000);
  }

  // Platform-specific utilities
  private setTimeout(callback: () => void, delay: number): Timer {
    if (typeof globalThis !== 'undefined' && (globalThis as any).setTimeout) {
      return (globalThis as any).setTimeout(callback, delay);
    }
    // Fallback for environments without setTimeout
    return { callback, delay };
  }

  private clearTimer(timer: Timer): void {
    if (typeof globalThis !== 'undefined' && (globalThis as any).clearTimeout) {
      (globalThis as any).clearTimeout(timer);
    }
  }

  private fetch(url: string, options: any): Promise<any> {
    if (typeof globalThis !== 'undefined' && (globalThis as any).fetch) {
      return (globalThis as any).fetch(url, options);
    }
    throw new Error('fetch is not available in this environment');
  }

  private buildQueryString(params: Record<string, string>): string {
    return Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }
}

/**
 * Factory function to create a new client
 */
export function createClient(config: SDKConfig): ObservabilityClient {
  return new ObservabilityClient(config);
}

/**
 * Default export for convenience
 */
export default ObservabilityClient;
