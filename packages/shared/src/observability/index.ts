/**
 * AI Observability Platform - Main Entry Point
 * Exports all core functionality for the "Sentry for AI" expansion
 */

// Core types and interfaces
export type {
  ObservabilityEvent,
  EventType,
  Status,
  BaseEvent,
  PromptCallEvent,
  AgentStepEvent,
  ErrorEvent,
  AssertionFailedEvent,
  HallucinationDetectedEvent,
  PerformanceAlertEvent,
  ToolCallEvent,
  ErrorInfo,
  PromptTemplate,
  Assertion,
  MonitoringConfig,
  ProjectMetrics,
  EventQuery,
  EventListResponse,
  MetricsResponse,
  SDKConfig,
  Integration
} from './types';

// Event creation and validation utilities
export {
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

// Main client class
export {
  ObservabilityClient,
  createClient
} from './client';

// Re-export default for convenience
export { default } from './client';
