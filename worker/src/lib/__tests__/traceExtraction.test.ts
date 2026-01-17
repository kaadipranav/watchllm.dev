/**
 * Tests for Automatic Agent Trace Extraction
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractTraceContext,
  extractToolCalls,
  detectAgenticWorkflow,
  generateStepsFromResponse,
  extractTrace,
  generateTraceHeaders,
  InMemoryTraceStore,
  type TraceContext,
  type ExtractedToolCall,
} from '../traceExtraction';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../../types';

describe('Trace Context Extraction', () => {
  it('should generate default trace context with no headers', () => {
    const headers = new Headers();
    const context = extractTraceContext(headers);

    expect(context.traceId).toBeDefined();
    expect(context.traceId.length).toBe(16);
    expect(context.spanId).toBeDefined();
    expect(context.spanId.length).toBe(16);
    expect(context.tags).toEqual([]);
  });

  it('should extract LangChain trace ID from headers', () => {
    const headers = new Headers({
      'x-langchain-trace-id': 'lc-trace-12345',
      'langsmith-project': 'my-project',
    });
    const context = extractTraceContext(headers);

    expect(context.langchainTraceId).toBe('lc-trace-12345');
    expect(context.langsmithProject).toBe('my-project');
    expect(context.tags).toContain('langchain');
    expect(context.tags).toContain('langsmith');
  });

  it('should parse OpenTelemetry traceparent header', () => {
    const headers = new Headers({
      'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
    });
    const context = extractTraceContext(headers);

    expect(context.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
    expect(context.parentSpanId).toBe('b7ad6b7169203331');
    expect(context.tags).toContain('otel');
  });

  it('should extract WatchLLM custom headers', () => {
    const headers = new Headers({
      'x-watchllm-trace-id': 'custom-trace-id',
      'x-watchllm-agent-name': 'ResearchAgent',
      'x-watchllm-run-id': 'run-123',
      'x-watchllm-session-id': 'session-456',
    });
    const context = extractTraceContext(headers);

    expect(context.traceId).toBe('custom-trace-id');
    expect(context.agentName).toBe('ResearchAgent');
    expect(context.runId).toBe('run-123');
    expect(context.sessionId).toBe('session-456');
    expect(context.tags).toContain('named_agent');
  });

  it('should detect CrewAI headers', () => {
    const headers = new Headers({
      'x-crewai-agent-id': 'researcher',
      'x-crewai-task-id': 'task-789',
    });
    const context = extractTraceContext(headers);

    expect(context.agentName).toBe('researcher');
    expect(context.runId).toBe('task-789');
    expect(context.tags).toContain('crewai');
  });
});

describe('Tool Call Extraction', () => {
  it('should extract tool_calls from response', () => {
    const response: ChatCompletionResponse = {
      id: 'chatcmpl-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_123',
              type: 'function',
              function: {
                name: 'get_weather',
                arguments: '{"location": "San Francisco", "unit": "celsius"}',
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
    };

    const toolCalls = extractToolCalls(response);

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].function.name).toBe('get_weather');
    expect(toolCalls[0].function.parsedArguments).toEqual({
      location: 'San Francisco',
      unit: 'celsius',
    });
  });

  it('should extract legacy function_call from response', () => {
    const response: ChatCompletionResponse = {
      id: 'chatcmpl-456',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-3.5-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          function_call: {
            name: 'search_database',
            arguments: '{"query": "latest sales data"}',
          },
        },
        finish_reason: 'function_call',
      }],
      usage: { prompt_tokens: 15, completion_tokens: 25, total_tokens: 40 },
    };

    const toolCalls = extractToolCalls(response);

    expect(toolCalls).toHaveLength(1);
    expect(toolCalls[0].function.name).toBe('search_database');
    expect(toolCalls[0].function.parsedArguments).toEqual({
      query: 'latest sales data',
    });
  });

  it('should handle multiple tool calls', () => {
    const response: ChatCompletionResponse = {
      id: 'chatcmpl-789',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'I will search for information.',
          tool_calls: [
            {
              id: 'call_1',
              type: 'function',
              function: { name: 'search', arguments: '{"q": "AI trends"}' },
            },
            {
              id: 'call_2',
              type: 'function',
              function: { name: 'get_date', arguments: '{}' },
            },
          ],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 20, completion_tokens: 30, total_tokens: 50 },
    };

    const toolCalls = extractToolCalls(response);

    expect(toolCalls).toHaveLength(2);
    expect(toolCalls[0].function.name).toBe('search');
    expect(toolCalls[1].function.name).toBe('get_date');
  });

  it('should return empty array for response without tool calls', () => {
    const response: ChatCompletionResponse = {
      id: 'chatcmpl-simple',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello, how can I help you?' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
    };

    const toolCalls = extractToolCalls(response);

    expect(toolCalls).toHaveLength(0);
  });
});

describe('Agentic Workflow Detection', () => {
  it('should detect agentic workflow with tools defined', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the weather?' },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get weather for a location',
            parameters: { type: 'object', properties: { location: { type: 'string' } } },
          },
        },
      ],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.isAgentic).toBe(true);
    expect(workflow.confidence).toBeGreaterThanOrEqual(30);
    expect(workflow.indicators).toContain('1 tools defined');
  });

  it('should detect agentic workflow from system prompt patterns', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI agent with access to the following tools. Use step-by-step reasoning. You can call functions to help complete tasks.' 
        },
        { role: 'user', content: 'Research this topic.' },
      ],
      // Adding tools to ensure threshold is met
      tools: [{ type: 'function', function: { name: 'search' } }],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.isAgentic).toBe(true);
    expect(workflow.indicators.some(i => i.includes('System prompt matches'))).toBe(true);
  });

  it('should detect tool_loop workflow with multiple tool messages', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You have tools.' },
        { role: 'user', content: 'Do multiple searches.' },
        { role: 'assistant', content: null, tool_calls: [] },
        { role: 'tool', content: 'Result 1' },
        { role: 'assistant', content: null, tool_calls: [] },
        { role: 'tool', content: 'Result 2' },
        { role: 'assistant', content: null, tool_calls: [] },
        { role: 'tool', content: 'Result 3' },
      ],
      tools: [{ type: 'function', function: { name: 'search' } }],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.isAgentic).toBe(true);
    expect(workflow.type).toBe('tool_loop');
    expect(workflow.indicators).toContain('Contains tool/function result messages');
  });

  it('should detect branching workflow with parent span', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Simple question' },
      ],
      tools: [{ type: 'function', function: { name: 'helper' } }],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      parentSpanId: 'parent-123',
      tags: [],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.type).toBe('branching');
    expect(workflow.indicators).toContain('Has parent span (nested call)');
  });

  it('should classify simple requests as single_call', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Hello!' },
      ],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.isAgentic).toBe(false);
    expect(workflow.type).toBe('single_call');
    expect(workflow.confidence).toBeLessThan(20);
  });

  it('should boost confidence with LangChain trace', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Process this' },
      ],
      tools: [{ type: 'function', function: { name: 'process' } }],
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      langchainTraceId: 'lc-123',
      tags: ['langchain'],
    };

    const workflow = detectAgenticWorkflow(request, context);

    expect(workflow.isAgentic).toBe(true);
    expect(workflow.indicators).toContain('LangChain trace detected');
    expect(workflow.confidence).toBeGreaterThanOrEqual(50);
  });
});

describe('Step Generation', () => {
  it('should generate steps from simple response', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'What is 2+2?' },
      ],
    };
    const response: ChatCompletionResponse = {
      id: 'test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: '2+2 equals 4.' },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const steps = generateStepsFromResponse(request, response, context, 100, 0.001, false);

    expect(steps).toHaveLength(2);
    expect(steps[0].type).toBe('user_input');
    expect(steps[0].summary).toBe('What is 2+2?');
    expect(steps[1].type).toBe('model_response');
    expect(steps[1].summary).toBe('2+2 equals 4.');
    expect(steps[1].cache_hit).toBe(false);
  });

  it('should generate steps for tool calls', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'user', content: 'Get the weather in NYC' },
      ],
      tools: [{ type: 'function', function: { name: 'get_weather' } }],
    };
    const response: ChatCompletionResponse = {
      id: 'test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Let me check the weather.',
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: { name: 'get_weather', arguments: '{"location":"NYC"}' },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 20, completion_tokens: 15, total_tokens: 35 },
    };
    const context: TraceContext = {
      traceId: 'test',
      spanId: 'test',
      tags: [],
    };

    const steps = generateStepsFromResponse(request, response, context, 200, 0.01, false);

    expect(steps).toHaveLength(3);
    expect(steps[0].type).toBe('user_input');
    expect(steps[1].type).toBe('decision');
    expect(steps[1].decision).toContain('get_weather');
    expect(steps[2].type).toBe('tool_call');
    expect(steps[2].tool).toBe('get_weather');
    expect(steps[2].tool_args).toEqual({ location: 'NYC' });
  });
});

describe('Full Trace Extraction', () => {
  it('should extract complete trace from request/response', () => {
    const request: ChatCompletionRequest = {
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an AI agent with tools.' },
        { role: 'user', content: 'Search for AI news' },
      ],
      tools: [
        { type: 'function', function: { name: 'search', description: 'Search the web' } },
      ],
    };
    const response: ChatCompletionResponse = {
      id: 'test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: 'Searching for AI news.',
          tool_calls: [{
            id: 'call_1',
            type: 'function',
            function: { name: 'search', arguments: '{"query":"AI news 2024"}' },
          }],
        },
        finish_reason: 'tool_calls',
      }],
      usage: { prompt_tokens: 30, completion_tokens: 20, total_tokens: 50 },
    };
    const headers = new Headers({
      'x-watchllm-agent-name': 'NewsBot',
      'x-langchain-trace-id': 'lc-trace-abc',
    });

    const trace = extractTrace(request, response, headers, 150, 0.02, false);

    expect(trace.isAgentic).toBe(true);
    expect(trace.workflowType).toBe('multi_step');
    expect(trace.context.agentName).toBe('NewsBot');
    expect(trace.context.langchainTraceId).toBe('lc-trace-abc');
    expect(trace.context.tags).toContain('agentic');
    expect(trace.context.tags).toContain('has_tool_calls');
    expect(trace.toolCalls).toHaveLength(1);
    expect(trace.steps.length).toBeGreaterThanOrEqual(2);
    expect(trace.metadata.model).toBe('gpt-4');
    expect(trace.metadata.latency_ms).toBe(150);
  });
});

describe('Trace Headers Generation', () => {
  it('should generate response headers from trace context', () => {
    const context: TraceContext = {
      traceId: 'trace-123',
      spanId: 'span-456',
      parentSpanId: 'parent-789',
      agentName: 'TestAgent',
      runId: 'run-abc',
      sessionId: 'session-def',
      tags: ['agentic', 'multi_step', 'langchain'],
    };

    const headers = generateTraceHeaders(context);

    expect(headers['X-WatchLLM-Trace-Id']).toBe('trace-123');
    expect(headers['X-WatchLLM-Span-Id']).toBe('span-456');
    expect(headers['X-WatchLLM-Parent-Span']).toBe('parent-789');
    expect(headers['X-WatchLLM-Agent-Name']).toBe('TestAgent');
    expect(headers['X-WatchLLM-Run-Id']).toBe('run-abc');
    expect(headers['X-WatchLLM-Session-Id']).toBe('session-def');
    expect(headers['X-WatchLLM-Tags']).toBe('agentic,multi_step,langchain');
  });
});

describe('InMemoryTraceStore', () => {
  let store: InMemoryTraceStore;

  beforeEach(() => {
    store = new InMemoryTraceStore();
  });

  it('should save and retrieve traces', async () => {
    const trace = {
      context: { traceId: 'trace-1', spanId: 'span-1', tags: ['test'] },
      steps: [{ step_index: 0, timestamp: new Date().toISOString(), type: 'user_input' as const, summary: 'Hello' }],
      isAgentic: false,
      workflowType: 'single_call' as const,
      toolCalls: [],
      metadata: {},
    };

    const result = await store.saveTrace('project-1', trace);
    expect(result.success).toBe(true);
    expect(result.traceId).toBe('trace-1');

    const retrieved = await store.getTrace('trace-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.context.traceId).toBe('trace-1');
  });

  it('should append steps to existing trace', async () => {
    const trace = {
      context: { traceId: 'trace-2', spanId: 'span-2', tags: [] },
      steps: [{ step_index: 0, timestamp: new Date().toISOString(), type: 'user_input' as const }],
      isAgentic: true,
      workflowType: 'multi_step' as const,
      toolCalls: [],
      metadata: {},
    };

    await store.saveTrace('project-1', trace);

    const newSteps = [
      { step_index: 0, timestamp: new Date().toISOString(), type: 'tool_call' as const, tool: 'search' },
    ];

    const result = await store.appendSteps('trace-2', newSteps);
    expect(result.success).toBe(true);

    const retrieved = await store.getTrace('trace-2');
    expect(retrieved?.steps).toHaveLength(2);
    expect(retrieved?.steps[1].step_index).toBe(1);
    expect(retrieved?.steps[1].tool).toBe('search');
  });

  it('should list traces for a project', async () => {
    const traces = [
      {
        context: { traceId: 'trace-a', spanId: 'span-a', agentName: 'Agent1', tags: [] },
        steps: [{ step_index: 0, timestamp: '2024-01-01T10:00:00Z', type: 'user_input' as const }],
        isAgentic: true,
        workflowType: 'multi_step' as const,
        toolCalls: [],
        metadata: {},
      },
      {
        context: { traceId: 'trace-b', spanId: 'span-b', agentName: 'Agent2', tags: [] },
        steps: [{ step_index: 0, timestamp: '2024-01-01T11:00:00Z', type: 'user_input' as const }],
        isAgentic: true,
        workflowType: 'tool_loop' as const,
        toolCalls: [],
        metadata: {},
      },
      {
        context: { traceId: 'trace-c', spanId: 'span-c', tags: [] },
        steps: [{ step_index: 0, timestamp: '2024-01-01T12:00:00Z', type: 'user_input' as const }],
        isAgentic: false,
        workflowType: 'single_call' as const,
        toolCalls: [],
        metadata: {},
      },
    ];

    for (const trace of traces) {
      await store.saveTrace('project-1', trace);
    }

    // List all
    const all = await store.listTraces('project-1');
    expect(all).toHaveLength(3);

    // Filter by agent name
    const agent1 = await store.listTraces('project-1', { agentName: 'Agent1' });
    expect(agent1).toHaveLength(1);
    expect(agent1[0].context.agentName).toBe('Agent1');

    // Filter by isAgentic
    const agentic = await store.listTraces('project-1', { isAgentic: true });
    expect(agentic).toHaveLength(2);

    const nonAgentic = await store.listTraces('project-1', { isAgentic: false });
    expect(nonAgentic).toHaveLength(1);

    // Pagination
    const paginated = await store.listTraces('project-1', { limit: 2 });
    expect(paginated).toHaveLength(2);
  });
});
