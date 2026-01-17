/**
 * Automatic Agent Trace Extraction
 * 
 * Automatically extracts agent traces from proxy requests:
 * - Parses OpenAI function/tool calls from responses
 * - Detects LangChain/LangSmith trace IDs from headers
 * - Auto-tags agentic workflows (multi-step, loops, branching)
 * - Stores hierarchical traces (parent requests → child tool calls)
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import type { Env, ChatCompletionRequest, ChatCompletionResponse } from '../types';
import type { AgentStep, StepType } from '../observability/agent-debug';

// ============================================================================
// Types
// ============================================================================

export interface TraceContext {
  /** Unique trace ID for this agent run */
  traceId: string;
  /** Parent span ID for hierarchical traces */
  parentSpanId?: string;
  /** Current span ID */
  spanId: string;
  /** LangChain/LangSmith trace ID if detected */
  langchainTraceId?: string;
  /** LangSmith project name if detected */
  langsmithProject?: string;
  /** Agent name if detected from headers or request */
  agentName?: string;
  /** Run ID if detected from headers */
  runId?: string;
  /** Session ID for multi-turn conversations */
  sessionId?: string;
  /** Workflow tags */
  tags: string[];
}

export interface ExtractedToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
    parsedArguments?: Record<string, unknown>;
  };
}

export interface ExtractedTrace {
  context: TraceContext;
  steps: AgentStep[];
  isAgentic: boolean;
  workflowType: 'single_call' | 'multi_step' | 'tool_loop' | 'branching' | 'unknown';
  toolCalls: ExtractedToolCall[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// Header Constants for Framework Detection
// ============================================================================

const TRACE_HEADERS = {
  // LangChain/LangSmith
  LANGCHAIN_TRACE_ID: 'x-langchain-trace-id',
  LANGSMITH_TRACE_ID: 'langsmith-trace-id',
  LANGSMITH_PROJECT: 'langsmith-project',
  LANGCHAIN_RUN_ID: 'x-langchain-run-id',
  LANGCHAIN_SESSION_ID: 'x-langchain-session-id',
  
  // OpenTelemetry
  TRACEPARENT: 'traceparent',
  TRACESTATE: 'tracestate',
  
  // Custom WatchLLM headers
  WATCHLLM_TRACE_ID: 'x-watchllm-trace-id',
  WATCHLLM_PARENT_SPAN: 'x-watchllm-parent-span',
  WATCHLLM_AGENT_NAME: 'x-watchllm-agent-name',
  WATCHLLM_RUN_ID: 'x-watchllm-run-id',
  WATCHLLM_SESSION_ID: 'x-watchllm-session-id',
  
  // Common agent frameworks
  AUTOGPT_TASK_ID: 'x-autogpt-task-id',
  CREWAI_AGENT_ID: 'x-crewai-agent-id',
  CREWAI_TASK_ID: 'x-crewai-task-id',
} as const;

// ============================================================================
// Trace Context Extraction
// ============================================================================

/**
 * Generate a unique trace/span ID
 */
function generateId(): string {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
}

/**
 * Parse OpenTelemetry traceparent header
 * Format: version-trace_id-parent_id-trace_flags
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 */
function parseTraceparent(header: string): { traceId: string; parentId: string } | null {
  const parts = header.split('-');
  if (parts.length !== 4) return null;
  
  const [, traceId, parentId] = parts;
  if (!traceId || !parentId) return null;
  
  return { traceId, parentId };
}

/**
 * Extract trace context from request headers
 */
export function extractTraceContext(headers: Headers): TraceContext {
  const context: TraceContext = {
    traceId: generateId(),
    spanId: generateId(),
    tags: [],
  };

  // Check for OpenTelemetry traceparent
  const traceparent = headers.get(TRACE_HEADERS.TRACEPARENT);
  if (traceparent) {
    const parsed = parseTraceparent(traceparent);
    if (parsed) {
      context.traceId = parsed.traceId;
      context.parentSpanId = parsed.parentId;
      context.tags.push('otel');
    }
  }

  // Check for LangChain/LangSmith headers
  const langchainTraceId = headers.get(TRACE_HEADERS.LANGCHAIN_TRACE_ID) ||
                           headers.get(TRACE_HEADERS.LANGSMITH_TRACE_ID);
  if (langchainTraceId) {
    context.langchainTraceId = langchainTraceId;
    context.tags.push('langchain');
  }

  const langsmithProject = headers.get(TRACE_HEADERS.LANGSMITH_PROJECT);
  if (langsmithProject) {
    context.langsmithProject = langsmithProject;
    context.tags.push('langsmith');
  }

  const langchainRunId = headers.get(TRACE_HEADERS.LANGCHAIN_RUN_ID);
  if (langchainRunId) {
    context.runId = langchainRunId;
  }

  const langchainSessionId = headers.get(TRACE_HEADERS.LANGCHAIN_SESSION_ID);
  if (langchainSessionId) {
    context.sessionId = langchainSessionId;
  }

  // Check for WatchLLM custom headers
  const watchllmTraceId = headers.get(TRACE_HEADERS.WATCHLLM_TRACE_ID);
  if (watchllmTraceId) {
    context.traceId = watchllmTraceId;
  }

  const watchllmParentSpan = headers.get(TRACE_HEADERS.WATCHLLM_PARENT_SPAN);
  if (watchllmParentSpan) {
    context.parentSpanId = watchllmParentSpan;
  }

  const watchllmAgentName = headers.get(TRACE_HEADERS.WATCHLLM_AGENT_NAME);
  if (watchllmAgentName) {
    context.agentName = watchllmAgentName;
    context.tags.push('named_agent');
  }

  const watchllmRunId = headers.get(TRACE_HEADERS.WATCHLLM_RUN_ID);
  if (watchllmRunId) {
    context.runId = watchllmRunId;
  }

  const watchllmSessionId = headers.get(TRACE_HEADERS.WATCHLLM_SESSION_ID);
  if (watchllmSessionId) {
    context.sessionId = watchllmSessionId;
  }

  // Check for AutoGPT/CrewAI headers
  const autogptTaskId = headers.get(TRACE_HEADERS.AUTOGPT_TASK_ID);
  if (autogptTaskId) {
    context.runId = autogptTaskId;
    context.tags.push('autogpt');
  }

  const crewaiAgentId = headers.get(TRACE_HEADERS.CREWAI_AGENT_ID);
  if (crewaiAgentId) {
    context.agentName = crewaiAgentId;
    context.tags.push('crewai');
  }

  const crewaiTaskId = headers.get(TRACE_HEADERS.CREWAI_TASK_ID);
  if (crewaiTaskId) {
    context.runId = crewaiTaskId;
  }

  return context;
}

// ============================================================================
// Tool Call Extraction from OpenAI Responses
// ============================================================================

/**
 * Extract tool/function calls from OpenAI chat completion response
 */
export function extractToolCalls(response: ChatCompletionResponse): ExtractedToolCall[] {
  const toolCalls: ExtractedToolCall[] = [];

  for (const choice of response.choices) {
    const message = choice.message;

    // Extract new-style tool_calls
    if (message.tool_calls && Array.isArray(message.tool_calls)) {
      for (const toolCall of message.tool_calls) {
        const extracted: ExtractedToolCall = {
          id: toolCall.id,
          type: 'function',
          function: {
            name: toolCall.function.name,
            arguments: toolCall.function.arguments,
          },
        };

        // Try to parse arguments as JSON
        try {
          extracted.function.parsedArguments = JSON.parse(toolCall.function.arguments);
        } catch {
          // Keep as string if not valid JSON
        }

        toolCalls.push(extracted);
      }
    }

    // Extract legacy function_call
    if (message.function_call) {
      const extracted: ExtractedToolCall = {
        id: `fc_${generateId()}`,
        type: 'function',
        function: {
          name: message.function_call.name,
          arguments: message.function_call.arguments || '{}',
        },
      };

      try {
        extracted.function.parsedArguments = JSON.parse(extracted.function.arguments);
      } catch {
        // Keep as string if not valid JSON
      }

      toolCalls.push(extracted);
    }
  }

  return toolCalls;
}

// ============================================================================
// Agentic Workflow Detection
// ============================================================================

export interface WorkflowPattern {
  isAgentic: boolean;
  type: 'single_call' | 'multi_step' | 'tool_loop' | 'branching' | 'unknown';
  confidence: number;
  indicators: string[];
}

/**
 * Detect if a request is part of an agentic workflow
 */
export function detectAgenticWorkflow(
  request: ChatCompletionRequest,
  context: TraceContext
): WorkflowPattern {
  const indicators: string[] = [];
  let agentScore = 0;

  // Check for tools/functions defined (strong indicator)
  if (request.tools && request.tools.length > 0) {
    agentScore += 30;
    indicators.push(`${request.tools.length} tools defined`);
  }

  if (request.functions && request.functions.length > 0) {
    agentScore += 30;
    indicators.push(`${request.functions.length} functions defined`);
  }

  // Check for tool_choice or function_call settings
  if (request.tool_choice && request.tool_choice !== 'none') {
    agentScore += 15;
    indicators.push(`tool_choice: ${JSON.stringify(request.tool_choice)}`);
  }

  if (request.function_call && request.function_call !== 'none') {
    agentScore += 15;
    indicators.push(`function_call: ${JSON.stringify(request.function_call)}`);
  }

  // Check for system prompt patterns that indicate agents
  const systemMessage = request.messages.find(m => m.role === 'system');
  if (systemMessage?.content) {
    const content = systemMessage.content.toLowerCase();
    
    const agentPatterns = [
      /you are an? (ai |llm )?agent/i,
      /you have access to (the following )?tools?/i,
      /use the following tools?/i,
      /you can call (these )?functions?/i,
      /available tools?:/i,
      /tool calling/i,
      /function calling/i,
      /step.?by.?step/i,
      /chain.?of.?thought/i,
      /react pattern/i,
      /reason and act/i,
    ];

    for (const pattern of agentPatterns) {
      if (pattern.test(content)) {
        agentScore += 10;
        indicators.push(`System prompt matches: ${pattern.source}`);
      }
    }
  }

  // Check for multi-turn conversation with tool/function messages
  const hasToolMessages = request.messages.some(m => m.role === 'tool' || m.role === 'function');
  if (hasToolMessages) {
    agentScore += 25;
    indicators.push('Contains tool/function result messages');
  }

  // Check for trace context indicators
  if (context.langchainTraceId) {
    agentScore += 20;
    indicators.push('LangChain trace detected');
  }

  if (context.agentName) {
    agentScore += 15;
    indicators.push(`Named agent: ${context.agentName}`);
  }

  if (context.parentSpanId) {
    agentScore += 10;
    indicators.push('Has parent span (nested call)');
  }

  // Determine workflow type
  let workflowType: WorkflowPattern['type'] = 'unknown';
  
  if (agentScore < 20) {
    workflowType = 'single_call';
  } else if (hasToolMessages && request.messages.filter(m => m.role === 'tool' || m.role === 'function').length >= 3) {
    workflowType = 'tool_loop';
  } else if (context.parentSpanId) {
    workflowType = 'branching';
  } else if (agentScore >= 40) {
    workflowType = 'multi_step';
  }

  return {
    isAgentic: agentScore >= 30,
    type: workflowType,
    confidence: Math.min(agentScore, 100),
    indicators,
  };
}

// ============================================================================
// Step Generation from Request/Response
// ============================================================================

/**
 * Generate agent steps from request and response
 */
export function generateStepsFromResponse(
  request: ChatCompletionRequest,
  response: ChatCompletionResponse,
  context: TraceContext,
  latencyMs: number,
  costUsd: number,
  cached: boolean
): AgentStep[] {
  const steps: AgentStep[] = [];
  const timestamp = new Date().toISOString();
  let stepIndex = 0;

  // Extract the user's input as first step (if not a tool result continuation)
  const lastUserMessage = [...request.messages].reverse().find(m => m.role === 'user');
  if (lastUserMessage) {
    steps.push({
      step_index: stepIndex++,
      timestamp,
      type: 'user_input',
      summary: truncate(lastUserMessage.content || '', 200),
      raw: lastUserMessage.content || '',
    });
  }

  // Extract tool calls from response
  const toolCalls = extractToolCalls(response);

  if (toolCalls.length > 0) {
    // Add model decision step
    const assistantMessage = response.choices[0]?.message?.content;
    if (assistantMessage) {
      steps.push({
        step_index: stepIndex++,
        timestamp,
        type: 'decision',
        summary: truncate(assistantMessage, 200),
        decision: `Decided to call ${toolCalls.length} tool(s): ${toolCalls.map(t => t.function.name).join(', ')}`,
        raw: assistantMessage,
        token_cost: response.usage?.total_tokens,
        api_cost_usd: costUsd / (toolCalls.length + 1), // Distribute cost
        cache_hit: cached,
      });
    }

    // Add each tool call as a step
    for (const toolCall of toolCalls) {
      steps.push({
        step_index: stepIndex++,
        timestamp,
        type: 'tool_call',
        summary: `Called ${toolCall.function.name}`,
        tool: toolCall.function.name,
        tool_args: toolCall.function.parsedArguments || { raw: toolCall.function.arguments },
        token_cost: 0,
        api_cost_usd: costUsd / (toolCalls.length + 1),
        cache_hit: cached,
      });
    }
  } else {
    // Simple model response without tool calls
    const assistantMessage = response.choices[0]?.message?.content;
    steps.push({
      step_index: stepIndex++,
      timestamp,
      type: 'model_response',
      summary: truncate(assistantMessage || '', 200),
      raw: assistantMessage || '',
      token_cost: response.usage?.total_tokens,
      api_cost_usd: costUsd,
      cache_hit: cached,
    });
  }

  return steps;
}

/**
 * Truncate string to max length with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Main Trace Extraction Function
// ============================================================================

/**
 * Extract complete trace from a proxy request/response
 */
export function extractTrace(
  request: ChatCompletionRequest,
  response: ChatCompletionResponse,
  headers: Headers,
  latencyMs: number,
  costUsd: number,
  cached: boolean
): ExtractedTrace {
  // Extract trace context from headers
  const context = extractTraceContext(headers);

  // Detect if this is an agentic workflow
  const workflow = detectAgenticWorkflow(request, context);

  // Add workflow tags to context
  if (workflow.isAgentic) {
    context.tags.push('agentic');
    context.tags.push(workflow.type);
  }

  // Extract tool calls
  const toolCalls = extractToolCalls(response);
  if (toolCalls.length > 0) {
    context.tags.push('has_tool_calls');
  }

  // Generate steps
  const steps = generateStepsFromResponse(
    request,
    response,
    context,
    latencyMs,
    costUsd,
    cached
  );

  return {
    context,
    steps,
    isAgentic: workflow.isAgentic,
    workflowType: workflow.type,
    toolCalls,
    metadata: {
      model: request.model,
      latency_ms: latencyMs,
      cost_usd: costUsd,
      cached,
      workflow_confidence: workflow.confidence,
      workflow_indicators: workflow.indicators,
      tokens: response.usage,
    },
  };
}

// ============================================================================
// Trace Storage Interface
// ============================================================================

export interface TraceStore {
  /**
   * Store a trace and its steps
   */
  saveTrace(
    projectId: string,
    trace: ExtractedTrace
  ): Promise<{ success: boolean; traceId: string }>;

  /**
   * Append steps to an existing trace (for multi-request agents)
   */
  appendSteps(
    traceId: string,
    steps: AgentStep[]
  ): Promise<{ success: boolean }>;

  /**
   * Get a trace by ID
   */
  getTrace(traceId: string): Promise<ExtractedTrace | null>;

  /**
   * List traces for a project
   */
  listTraces(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      agentName?: string;
      isAgentic?: boolean;
    }
  ): Promise<ExtractedTrace[]>;
}

// ============================================================================
// In-Memory Trace Store (for development/testing)
// ============================================================================

export class InMemoryTraceStore implements TraceStore {
  private traces: Map<string, ExtractedTrace> = new Map();
  private projectIndex: Map<string, Set<string>> = new Map();

  async saveTrace(
    projectId: string,
    trace: ExtractedTrace
  ): Promise<{ success: boolean; traceId: string }> {
    const traceId = trace.context.traceId;
    this.traces.set(traceId, trace);

    if (!this.projectIndex.has(projectId)) {
      this.projectIndex.set(projectId, new Set());
    }
    this.projectIndex.get(projectId)!.add(traceId);

    return { success: true, traceId };
  }

  async appendSteps(
    traceId: string,
    steps: AgentStep[]
  ): Promise<{ success: boolean }> {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return { success: false };
    }

    // Renumber steps
    const maxIndex = Math.max(...trace.steps.map(s => s.step_index), -1);
    for (let i = 0; i < steps.length; i++) {
      steps[i].step_index = maxIndex + 1 + i;
    }

    trace.steps.push(...steps);
    return { success: true };
  }

  async getTrace(traceId: string): Promise<ExtractedTrace | null> {
    return this.traces.get(traceId) || null;
  }

  async listTraces(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      agentName?: string;
      isAgentic?: boolean;
    }
  ): Promise<ExtractedTrace[]> {
    const traceIds = this.projectIndex.get(projectId);
    if (!traceIds) return [];

    let traces = Array.from(traceIds)
      .map(id => this.traces.get(id)!)
      .filter(Boolean);

    // Apply filters
    if (options?.agentName) {
      traces = traces.filter(t => t.context.agentName === options.agentName);
    }
    if (options?.isAgentic !== undefined) {
      traces = traces.filter(t => t.isAgentic === options.isAgentic);
    }

    // Sort by timestamp (newest first)
    traces.sort((a, b) => {
      const aTime = a.steps[0]?.timestamp || '';
      const bTime = b.steps[0]?.timestamp || '';
      return bTime.localeCompare(aTime);
    });

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return traces.slice(offset, offset + limit);
  }
}

// ============================================================================
// Export Response Headers for Trace Propagation
// ============================================================================

/**
 * Generate response headers for trace propagation
 */
export function generateTraceHeaders(context: TraceContext): Record<string, string> {
  const headers: Record<string, string> = {
    'X-WatchLLM-Trace-Id': context.traceId,
    'X-WatchLLM-Span-Id': context.spanId,
  };

  if (context.parentSpanId) {
    headers['X-WatchLLM-Parent-Span'] = context.parentSpanId;
  }

  if (context.agentName) {
    headers['X-WatchLLM-Agent-Name'] = context.agentName;
  }

  if (context.runId) {
    headers['X-WatchLLM-Run-Id'] = context.runId;
  }

  if (context.sessionId) {
    headers['X-WatchLLM-Session-Id'] = context.sessionId;
  }

  if (context.tags.length > 0) {
    headers['X-WatchLLM-Tags'] = context.tags.join(',');
  }

  return headers;
}
