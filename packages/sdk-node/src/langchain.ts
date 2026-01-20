/**
 * WatchLLM LangChain.js Integration - Callback Handler
 * Provides seamless integration with LangChain.js agents, chains, and LLMs.
 *
 * @example
 * ```typescript
 * import { WatchLLMClient } from 'watchllm-sdk-node';
 * import { WatchLLMCallbackHandler } from 'watchllm-sdk-node/langchain';
 * import { ChatOpenAI } from '@langchain/openai';
 * import { initializeAgentExecutorWithOptions } from 'langchain/agents';
 *
 * const client = new WatchLLMClient({
 *   apiKey: 'your-key',
 *   projectId: 'your-project'
 * });
 *
 * const handler = new WatchLLMCallbackHandler({ client });
 *
 * // Use with any LangChain component
 * const agent = await initializeAgentExecutorWithOptions(tools, llm, {
 *   callbacks: [handler]  // One line integration!
 * });
 * ```
 */

import { v4 as uuidv4 } from 'uuid';
import WatchLLMClient, { Status, StepType } from './index';

// ============================================================================
// Types for LangChain.js Compatibility
// ============================================================================

/**
 * Serialized representation of a LangChain component
 */
interface Serialized {
  lc: number;
  type: string;
  id: string[];
  kwargs?: Record<string, unknown>;
  name?: string;
}

/**
 * LLM Result from LangChain
 */
interface LLMResult {
  generations: Generation[][];
  llmOutput?: Record<string, unknown>;
}

interface Generation {
  text: string;
  generationInfo?: Record<string, unknown>;
  message?: {
    content: string | unknown[];
    [key: string]: unknown;
  };
}

/**
 * Chat model message
 */
interface BaseMessage {
  content: string | unknown[];
  type?: string;
  [key: string]: unknown;
}

/**
 * Agent action
 */
interface AgentAction {
  tool: string;
  toolInput: string | Record<string, unknown>;
  log: string;
}

/**
 * Agent finish
 */
interface AgentFinish {
  returnValues: Record<string, unknown>;
  log: string;
}

/**
 * Document from retriever
 */
interface Document {
  pageContent: string;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Run Context for Tracking
// ============================================================================

interface RunContext {
  runId: string;
  parentRunId?: string;
  startTime: number;
  stepCount: number;
  model: string;
  prompt: string;
  tokensInput: number;
  tokensOutput: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// Callback Handler Configuration
// ============================================================================

export interface WatchLLMCallbackHandlerConfig {
  /**
   * The WatchLLM client instance
   */
  client: WatchLLMClient;

  /**
   * Optional run ID to group all events. If not provided, one is generated.
   */
  runId?: string;

  /**
   * Optional user ID to associate with all events
   */
  userId?: string;

  /**
   * Optional tags to add to all events
   */
  tags?: string[];

  /**
   * Optional metadata to include with all events
   */
  metadata?: Record<string, unknown>;

  /**
   * Whether to log full prompt text (set false for privacy)
   * @default true
   */
  logPrompts?: boolean;

  /**
   * Whether to log full response text (set false for privacy)
   * @default true
   */
  logResponses?: boolean;
}

// ============================================================================
// Callback Handler Implementation
// ============================================================================

/**
 * LangChain.js callback handler for WatchLLM observability.
 *
 * Automatically captures:
 * - LLM calls (prompts, responses, tokens, costs)
 * - Agent actions and decisions
 * - Tool calls and results
 * - Chain executions
 * - Errors and exceptions
 *
 * @example
 * ```typescript
 * import { WatchLLMClient } from 'watchllm-sdk-node';
 * import { WatchLLMCallbackHandler } from 'watchllm-sdk-node/langchain';
 * import { ChatOpenAI } from '@langchain/openai';
 *
 * const client = new WatchLLMClient({
 *   apiKey: 'your-key',
 *   projectId: 'your-project'
 * });
 *
 * const handler = new WatchLLMCallbackHandler({ client });
 * const llm = new ChatOpenAI({ callbacks: [handler] });
 * ```
 */
export class WatchLLMCallbackHandler {
  name = 'WatchLLMCallbackHandler';

  private client: WatchLLMClient;
  private runId: string;
  private userId?: string;
  private tags: string[];
  private metadata: Record<string, unknown>;
  private logPrompts: boolean;
  private logResponses: boolean;

  // Track active runs
  private runs: Map<string, RunContext> = new Map();
  private runStack: string[] = [];
  private globalStepCount = 0;

  constructor(config: WatchLLMCallbackHandlerConfig) {
    this.client = config.client;
    this.runId = config.runId || uuidv4();
    this.userId = config.userId;
    this.tags = config.tags || [];
    this.metadata = config.metadata || {};
    this.logPrompts = config.logPrompts ?? true;
    this.logResponses = config.logResponses ?? true;
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private getRunContext(runId: string): RunContext {
    if (!this.runs.has(runId)) {
      const parentId = this.runStack.length > 0 ? this.runStack[this.runStack.length - 1] : undefined;
      this.runs.set(runId, {
        runId,
        parentRunId: parentId,
        startTime: Date.now(),
        stepCount: 0,
        model: '',
        prompt: '',
        tokensInput: 0,
        tokensOutput: 0,
        metadata: {},
      });
    }
    return this.runs.get(runId)!;
  }

  private cleanupRun(runId: string): RunContext | undefined {
    const ctx = this.runs.get(runId);
    this.runs.delete(runId);
    const stackIndex = this.runStack.indexOf(runId);
    if (stackIndex !== -1) {
      this.runStack.splice(stackIndex, 1);
    }
    return ctx;
  }

  private serializeMessage(message: BaseMessage | unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message && typeof message === 'object' && 'content' in message) {
      const content = (message as BaseMessage).content;
      if (typeof content === 'string') {
        return content;
      }
      if (Array.isArray(content)) {
        return content
          .map((c) => (typeof c === 'string' ? c : JSON.stringify(c)))
          .join('\n');
      }
    }
    return String(message);
  }

  private serializeMessages(messages: BaseMessage[][] | BaseMessage[]): string {
    const parts: string[] = [];

    const flatMessages: BaseMessage[] = [];
    for (const item of messages) {
      if (Array.isArray(item)) {
        flatMessages.push(...item);
      } else {
        flatMessages.push(item);
      }
    }

    for (const msg of flatMessages) {
      const type = msg?.type || 'unknown';
      const content = this.serializeMessage(msg);
      parts.push(`[${type}]: ${content}`);
    }

    return parts.join('\n');
  }

  private extractModelName(serialized: Serialized | Record<string, unknown>): string {
    // Try kwargs first
    if (serialized.kwargs) {
      const kwargs = serialized.kwargs as Record<string, unknown>;
      for (const key of ['model', 'model_name', 'modelName', 'model_id']) {
        if (kwargs[key]) {
          return String(kwargs[key]);
        }
      }
    }

    // Try name
    if ('name' in serialized && serialized.name) {
      return String(serialized.name);
    }

    // Try id array
    if ('id' in serialized && Array.isArray(serialized.id) && serialized.id.length > 0) {
      return String(serialized.id[serialized.id.length - 1]);
    }

    return 'unknown';
  }

  private extractTokenUsage(response: LLMResult): { input: number; output: number } {
    const usage = { input: 0, output: 0 };

    if (response?.llmOutput) {
      const llmOutput = response.llmOutput;
      if ('tokenUsage' in llmOutput || 'token_usage' in llmOutput) {
        const tokenUsage = (llmOutput.tokenUsage || llmOutput.token_usage) as Record<string, number>;
        usage.input = tokenUsage?.promptTokens || tokenUsage?.prompt_tokens || 0;
        usage.output = tokenUsage?.completionTokens || tokenUsage?.completion_tokens || 0;
      }
    }

    return usage;
  }

  // ===========================================================================
  // LLM Callbacks
  // ===========================================================================

  handleLLMStart(
    llm: Serialized,
    prompts: string[],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
  ): void {
    const ctx = this.getRunContext(runId);
    ctx.startTime = Date.now();
    ctx.model = this.extractModelName(llm);
    ctx.prompt = prompts[0] || '';
    ctx.metadata = { ...this.metadata, ...(metadata || {}) };
    this.runStack.push(runId);
  }

  handleChatModelStart(
    llm: Serialized,
    messages: BaseMessage[][],
    runId: string,
    parentRunId?: string,
    extraParams?: Record<string, unknown>,
    tags?: string[],
    metadata?: Record<string, unknown>,
  ): void {
    const ctx = this.getRunContext(runId);
    ctx.startTime = Date.now();
    ctx.model = this.extractModelName(llm);
    ctx.prompt = this.serializeMessages(messages);
    ctx.metadata = { ...this.metadata, ...(metadata || {}) };
    this.runStack.push(runId);
  }

  handleLLMEnd(output: LLMResult, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);
    if (!ctx) return;

    const latencyMs = Date.now() - ctx.startTime;

    // Extract response text
    let responseText = '';
    if (output?.generations?.[0]?.[0]) {
      const gen = output.generations[0][0];
      if (gen.text) {
        responseText = gen.text;
      } else if (gen.message?.content) {
        responseText = this.serializeMessage(gen.message);
      }
    }

    // Extract token usage
    const usage = this.extractTokenUsage(output);

    this.client.logPromptCall({
      runId: this.runId,
      prompt: this.logPrompts ? ctx.prompt : '[REDACTED]',
      model: ctx.model,
      response: this.logResponses ? responseText : '[REDACTED]',
      tokensInput: usage.input,
      tokensOutput: usage.output,
      latencyMs,
      status: Status.SUCCESS,
      responseMetadata: ctx.metadata as Record<string, any>,
      tags: this.tags,
      userId: this.userId,
    });
  }

  handleLLMError(err: Error, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);
    const latencyMs = ctx ? Date.now() - ctx.startTime : 0;

    this.client.logPromptCall({
      runId: this.runId,
      prompt: ctx && this.logPrompts ? ctx.prompt : '[REDACTED]',
      model: ctx?.model || 'unknown',
      response: '',
      tokensInput: 0,
      tokensOutput: 0,
      latencyMs,
      status: Status.ERROR,
      error: {
        message: err.message,
        type: err.name,
        stack: err.stack,
      },
      tags: this.tags,
      userId: this.userId,
    });
  }

  // ===========================================================================
  // Chain Callbacks
  // ===========================================================================

  handleChainStart(
    chain: Serialized,
    inputs: Record<string, unknown>,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
  ): void {
    const ctx = this.getRunContext(runId);
    ctx.startTime = Date.now();
    ctx.metadata = {
      chainName: chain.name || 'unknown',
      chainType: chain.id?.[chain.id.length - 1] || 'unknown',
      inputs,
      ...(metadata || {}),
    };
    this.runStack.push(runId);
  }

  handleChainEnd(outputs: Record<string, unknown>, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);
    if (!ctx) return;

    const latencyMs = Date.now() - ctx.startTime;
    this.globalStepCount++;

    const chainName = (ctx.metadata.chainName as string) || 'chain';

    this.client.logAgentStep({
      runId: this.runId,
      stepNumber: this.globalStepCount,
      stepName: `chain:${chainName}`,
      stepType: StepType.REASONING,
      inputData: (ctx.metadata.inputs as Record<string, any>) || {},
      outputData: outputs as Record<string, any>,
      latencyMs,
      status: Status.SUCCESS,
      context: { chainType: ctx.metadata.chainType as string },
      tags: this.tags,
      userId: this.userId,
    });
  }

  handleChainError(err: Error, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);

    this.client.logError({
      runId: this.runId,
      error: err,
      context: { chainMetadata: ctx?.metadata || {} },
      tags: this.tags,
      userId: this.userId,
    });
  }

  // ===========================================================================
  // Tool Callbacks
  // ===========================================================================

  handleToolStart(
    tool: Serialized,
    input: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
  ): void {
    const ctx = this.getRunContext(runId);
    ctx.startTime = Date.now();
    ctx.metadata = {
      toolName: tool.name || 'unknown',
      toolDescription: (tool.kwargs?.description as string) || '',
      inputStr: input,
      ...(metadata || {}),
    };
    this.runStack.push(runId);
  }

  handleToolEnd(output: string, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);
    if (!ctx) return;

    const latencyMs = Date.now() - ctx.startTime;
    this.globalStepCount++;

    const toolName = (ctx.metadata.toolName as string) || 'unknown';

    this.client.logAgentStep({
      runId: this.runId,
      stepNumber: this.globalStepCount,
      stepName: `tool:${toolName}`,
      stepType: StepType.TOOL_CALL,
      inputData: { input: ctx.metadata.inputStr || '' },
      outputData: { output: output || '' },
      latencyMs,
      status: Status.SUCCESS,
      context: { toolDescription: ctx.metadata.toolDescription as string },
      tags: this.tags,
      userId: this.userId,
    });
  }

  handleToolError(err: Error, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);

    const toolName = (ctx?.metadata?.toolName as string) || 'unknown';

    this.client.logError({
      runId: this.runId,
      error: err,
      context: {
        toolName,
        toolMetadata: ctx?.metadata || {},
      },
      tags: this.tags,
      userId: this.userId,
    });
  }

  // ===========================================================================
  // Agent Callbacks
  // ===========================================================================

  handleAgentAction(action: AgentAction, runId: string, parentRunId?: string): void {
    this.globalStepCount++;

    this.client.logAgentStep({
      runId: this.runId,
      stepNumber: this.globalStepCount,
      stepName: `agent_action:${action.tool}`,
      stepType: StepType.REASONING,
      inputData: { toolInput: action.toolInput as Record<string, any> },
      outputData: {},
      reasoning: action.log,
      latencyMs: 0,
      status: Status.SUCCESS,
      tags: this.tags,
      userId: this.userId,
    });
  }

  handleAgentEnd(action: AgentFinish, runId: string, parentRunId?: string): void {
    this.globalStepCount++;

    this.client.logAgentStep({
      runId: this.runId,
      stepNumber: this.globalStepCount,
      stepName: 'agent_finish',
      stepType: StepType.OUTPUT,
      inputData: {},
      outputData: action.returnValues as Record<string, any>,
      reasoning: action.log,
      latencyMs: 0,
      status: Status.SUCCESS,
      tags: this.tags,
      userId: this.userId,
    });
  }

  // ===========================================================================
  // Retriever Callbacks
  // ===========================================================================

  handleRetrieverStart(
    retriever: Serialized,
    query: string,
    runId: string,
    parentRunId?: string,
    tags?: string[],
    metadata?: Record<string, unknown>,
  ): void {
    const ctx = this.getRunContext(runId);
    ctx.startTime = Date.now();
    ctx.metadata = {
      retrieverType: retriever.name || 'unknown',
      query,
      ...(metadata || {}),
    };
    this.runStack.push(runId);
  }

  handleRetrieverEnd(documents: Document[], runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);
    if (!ctx) return;

    const latencyMs = Date.now() - ctx.startTime;
    this.globalStepCount++;

    // Serialize documents (limit to 5)
    const docSummaries = documents.slice(0, 5).map((doc) => ({
      contentPreview:
        doc.pageContent.length > 200 ? doc.pageContent.slice(0, 200) + '...' : doc.pageContent,
      metadata: doc.metadata,
    }));

    this.client.logAgentStep({
      runId: this.runId,
      stepNumber: this.globalStepCount,
      stepName: 'retriever',
      stepType: StepType.TOOL_CALL,
      inputData: { query: ctx.metadata.query as string },
      outputData: {
        documentCount: documents.length,
        documents: docSummaries,
      },
      latencyMs,
      status: Status.SUCCESS,
      context: { retrieverType: ctx.metadata.retrieverType as string },
      tags: this.tags,
      userId: this.userId,
    });
  }

  handleRetrieverError(err: Error, runId: string, parentRunId?: string): void {
    const ctx = this.cleanupRun(runId);

    this.client.logError({
      runId: this.runId,
      error: err,
      context: { retrieverMetadata: ctx?.metadata || {} },
      tags: this.tags,
      userId: this.userId,
    });
  }

  // ===========================================================================
  // Text Callbacks (for completion models)
  // ===========================================================================

  handleText(text: string, runId: string, parentRunId?: string): void {
    // Text streaming - we typically don't log individual tokens
    // but could be extended for streaming support
  }
}

/**
 * Factory function to create a WatchLLM callback handler.
 *
 * @param config - Configuration for the callback handler
 * @returns A configured WatchLLMCallbackHandler instance
 */
export function createCallbackHandler(config: WatchLLMCallbackHandlerConfig): WatchLLMCallbackHandler {
  return new WatchLLMCallbackHandler(config);
}

export default WatchLLMCallbackHandler;
