/**
 * Observability Ingestion API for AI Events
 * Handles incoming observability events from SDKs and external integrations
 */

import type { Env } from '../types';
import type {
  ObservabilityEvent,
  EventQuery,
  EventListResponse,
  MetricsResponse,
  SDKConfig
} from '../../../packages/shared/src/observability/types';
import { validateEvent } from '../../../packages/shared/src/observability/events';

/**
 * Validates and processes incoming observability events
 */
export class ObservabilityIngestion {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Handles single event ingestion
   */
  async ingestEvent(
    projectId: string,
    event: ObservabilityEvent,
    apiKey: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate API key and project access
      const authResult = await this.validateAPIKey(apiKey, projectId);
      if (!authResult.valid) {
        return { success: false, error: 'Invalid API key or project access' };
      }

      // Validate event structure
      const validation = validateEvent(event);
      if (!validation.valid) {
        return { success: false, error: `Invalid event: ${validation.errors.join(', ')}` };
      }

      // Ensure project ID matches
      if (event.project_id !== projectId) {
        return { success: false, error: 'Project ID mismatch' };
      }

      // Store event in database
      await this.storeEvent(event);

      // Trigger real-time processing if needed
      await this.processEventRealtime(event);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handles batch event ingestion
   */
  async ingestBatch(
    projectId: string,
    events: ObservabilityEvent[],
    apiKey: string
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const errors: string[] = [];
    let processed = 0;

    // Validate API key once for the batch
    const authResult = await this.validateAPIKey(apiKey, projectId);
    if (!authResult.valid) {
      return { success: false, processed: 0, errors: ['Invalid API key or project access'] };
    }

    // Process events in batches
    for (const event of events) {
      try {
        const result = await this.ingestEvent(projectId, event, apiKey);
        if (result.success) {
          processed++;
        } else {
          errors.push(`Event ${event.event_id}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Event ${event.event_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };
  }

  /**
   * Queries events for a project
   */
  async queryEvents(query: EventQuery, apiKey: string): Promise<EventListResponse> {
    // Validate API key and project access
    const authResult = await this.validateAPIKey(apiKey, query.project_id);
    if (!authResult.valid) {
      throw new Error('Invalid API key or project access');
    }

    // Query events from database
    const { events, total, hasMore } = await this.queryEventsFromDB(query);

    return {
      events,
      total,
      has_more: hasMore
    };
  }

  /**
   * Gets project metrics
   */
  async getProjectMetrics(
    projectId: string,
    dateFrom?: string,
    dateTo?: string,
    apiKey?: string
  ): Promise<MetricsResponse> {
    // Validate API key if provided
    if (apiKey) {
      const authResult = await this.validateAPIKey(apiKey, projectId);
      if (!authResult.valid) {
        throw new Error('Invalid API key or project access');
      }
    }

    // Get metrics from database
    const metrics = await this.getMetricsFromDB(projectId, dateFrom, dateTo);

    // Calculate summary
    const summary = this.calculateSummary(metrics);

    return {
      metrics,
      summary
    };
  }

  /**
   * Validates API key and project access
   */
  private async validateAPIKey(apiKey: string, projectId: string): Promise<{ valid: boolean; project?: any }> {
    // Allow test-key for development/testing (bypasses Supabase validation)
    if (apiKey === 'test-key') {
      return {
        valid: true,
        project: {
          id: projectId,
          name: 'Test Project',
          user_id: 'test-user'
        }
      };
    }

    // This would integrate with the existing Supabase client
    // For now, return a placeholder implementation
    try {
      const { createSupabaseClient } = await import('../lib/supabase');
      const supabase = createSupabaseClient(this.env);

      const result = await supabase.validateAPIKey(apiKey);

      if (!result || !result.keyRecord || !result.project) {
        return { valid: false };
      }

      // Check if project ID matches
      if (result.project.id !== projectId) {
        return { valid: false };
      }

      return { valid: true, project: result.project };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Stores event in database or queue
   */
  private async storeEvent(event: ObservabilityEvent): Promise<void> {
    // 1. Queue for asynchronous ingestion to ClickHouse
    if (this.env.OBSERVABILITY_QUEUE) {
      try {
        await this.env.OBSERVABILITY_QUEUE.send({
          event_type: event.event_type,
          event_id: event.event_id,
          project_id: event.project_id,
          run_id: event.run_id,
          timestamp: event.timestamp,
          payload: event as unknown as Record<string, unknown>
        });
        console.log(`Queued event ${event.event_id} for ingestion`);
      } catch (error) {
        console.error('Failed to queue event:', error);
      }
    } else {
      console.warn('OBSERVABILITY_QUEUE binding not found, skipping queueing');
    }

    // 2. Placeholder/Legacy storage (updates real-time metrics, etc.)
    console.log('Storing event (legacy):', event.event_id, event.event_type);
  }

  /**
   * Processes event in real-time
   */
  private async processEventRealtime(event: ObservabilityEvent): Promise<void> {
    // This would handle real-time processing like:
    // 1. Check for alert conditions
    // 2. Update live dashboards
    // 3. Trigger webhooks
    // 4. Update anomaly detection models

    // Check for performance alerts
    if (event.event_type === 'prompt_call') {
      const promptEvent = event as any;
      await this.checkPerformanceAlerts(promptEvent);
    }

    // Check for error rate spikes
    if (event.event_type === 'error') {
      await this.checkErrorRateAlerts(event.project_id);
    }
  }

  /**
   * Queries events from database
   */
  private async queryEventsFromDB(query: EventQuery): Promise<{ events: ObservabilityEvent[]; total: number; hasMore: boolean }> {
    // Placeholder implementation - in production this would:
    // 1. Query the events database with filters
    // 2. Apply pagination
    // 3. Return results with total count

    return {
      events: [],
      total: 0,
      hasMore: false
    };
  }

  /**
   * Gets metrics from database
   */
  private async getMetricsFromDB(
    projectId: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<any[]> {
    // Placeholder implementation - in production this would:
    // 1. Query aggregated metrics from the database
    // 2. Apply date filters
    // 3. Return time-series data

    return [];
  }

  /**
   * Calculates summary statistics
   */
  private calculateSummary(metrics: any[]): any {
    // Placeholder implementation
    return {
      total_cost_usd: 0,
      total_requests: 0,
      avg_success_rate: 0,
      top_model: 'gpt-4o'
    };
  }

  /**
   * Checks for performance alerts
   */
  private async checkPerformanceAlerts(event: any): Promise<void> {
    // Check for cost spikes, latency issues, etc.
    // This would integrate with the alerting system

    if (event.latency_ms > 5000) {
      // Trigger latency alert
      console.log('Latency alert triggered for event:', event.event_id);
    }

    if (event.cost_estimate_usd > 1.0) {
      // Trigger cost alert
      console.log('Cost alert triggered for event:', event.event_id);
    }
  }

  /**
   * Checks for error rate alerts
   */
  private async checkErrorRateAlerts(projectId: string): Promise<void> {
    // Check if error rate exceeds threshold
    // This would query recent error rates and trigger alerts if needed

    console.log('Checking error rate alerts for project:', projectId);
  }
}

/**
 * Factory function to create ingestion handler
 */
export function createObservabilityIngestion(env: Env): ObservabilityIngestion {
  return new ObservabilityIngestion(env);
}
