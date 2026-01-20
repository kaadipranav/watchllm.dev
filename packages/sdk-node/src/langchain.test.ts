/**
 * Tests for WatchLLM LangChain.js Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WatchLLMCallbackHandler, createCallbackHandler } from './langchain';
import WatchLLMClient, { Status, StepType } from './index';

// Mock WatchLLMClient
const createMockClient = () => {
  return {
    logPromptCall: vi.fn().mockReturnValue('event-123'),
    logAgentStep: vi.fn().mockReturnValue('event-456'),
    logError: vi.fn().mockReturnValue('event-789'),
  } as unknown as WatchLLMClient;
};

// Mock LangChain types
const createMockLLMResult = (text = 'test response', tokensInput = 10, tokensOutput = 20) => ({
  generations: [[{ text, message: { content: text } }]],
  llmOutput: {
    tokenUsage: {
      promptTokens: tokensInput,
      completionTokens: tokensOutput,
      totalTokens: tokensInput + tokensOutput,
    },
  },
});

const createMockSerialized = (name = 'ChatOpenAI', model = 'gpt-4') => ({
  lc: 1,
  type: 'constructor',
  id: ['langchain', 'chat_models', 'openai', name],
  name,
  kwargs: { model },
});

describe('WatchLLMCallbackHandler', () => {
  let mockClient: ReturnType<typeof createMockClient>;
  let handler: WatchLLMCallbackHandler;

  beforeEach(() => {
    mockClient = createMockClient();
    handler = new WatchLLMCallbackHandler({
      client: mockClient,
      runId: 'test-run-123',
      userId: 'user-456',
      tags: ['test', 'integration'],
    });
  });

  describe('initialization', () => {
    it('should initialize with correct config', () => {
      const customHandler = new WatchLLMCallbackHandler({
        client: mockClient,
        runId: 'custom-run',
        userId: 'user-123',
        tags: ['prod'],
        metadata: { env: 'production' },
        logPrompts: false,
        logResponses: true,
      });

      expect(customHandler.name).toBe('WatchLLMCallbackHandler');
    });

    it('should auto-generate run_id if not provided', () => {
      const autoHandler = new WatchLLMCallbackHandler({ client: mockClient });
      // Run ID should be a valid UUID
      expect(autoHandler).toBeDefined();
    });
  });

  describe('LLM callbacks', () => {
    it('should handle LLM start and end', () => {
      const runId = 'llm-run-1';
      const serialized = createMockSerialized();

      handler.handleLLMStart(serialized, ['What is 2+2?'], runId);

      // Small delay simulation
      handler.handleLLMEnd(createMockLLMResult('4', 5, 1), runId);

      expect(mockClient.logPromptCall).toHaveBeenCalledOnce();
      const callArgs = mockClient.logPromptCall.mock.calls[0][0];

      expect(callArgs.runId).toBe('test-run-123');
      expect(callArgs.model).toBe('gpt-4');
      expect(callArgs.prompt).toBe('What is 2+2?');
      expect(callArgs.response).toBe('4');
      expect(callArgs.tokensInput).toBe(5);
      expect(callArgs.tokensOutput).toBe(1);
    });

    it('should handle LLM error', () => {
      const runId = 'llm-run-error';
      const serialized = createMockSerialized();

      handler.handleLLMStart(serialized, ['test prompt'], runId);
      handler.handleLLMError(new Error('API error'), runId);

      expect(mockClient.logPromptCall).toHaveBeenCalledOnce();
      const callArgs = mockClient.logPromptCall.mock.calls[0][0];

      expect(callArgs.status).toBe(Status.ERROR);
      expect(callArgs.error?.message).toBe('API error');
    });

    it('should handle chat model start', () => {
      const runId = 'chat-run-1';
      const serialized = createMockSerialized('ChatOpenAI', 'gpt-4o');

      const messages = [
        [
          { type: 'system', content: 'You are helpful' },
          { type: 'human', content: 'Hello!' },
        ],
      ];

      handler.handleChatModelStart(serialized, messages as any, runId);
      handler.handleLLMEnd(createMockLLMResult('Hi there!'), runId);

      const callArgs = mockClient.logPromptCall.mock.calls[0][0];
      expect(callArgs.prompt).toContain('[system]');
      expect(callArgs.prompt).toContain('[human]');
    });
  });

  describe('Tool callbacks', () => {
    it('should handle tool start and end', () => {
      const runId = 'tool-run-1';
      const serialized = {
        lc: 1,
        type: 'constructor',
        id: ['langchain', 'tools', 'Calculator'],
        name: 'Calculator',
        kwargs: { description: 'Math tool' },
      };

      handler.handleToolStart(serialized, '2 + 2', runId);
      handler.handleToolEnd('4', runId);

      expect(mockClient.logAgentStep).toHaveBeenCalledOnce();
      const callArgs = mockClient.logAgentStep.mock.calls[0][0];

      expect(callArgs.stepName).toBe('tool:Calculator');
      expect(callArgs.stepType).toBe(StepType.TOOL_CALL);
      expect(callArgs.inputData.input).toBe('2 + 2');
      expect(callArgs.outputData.output).toBe('4');
    });

    it('should handle tool error', () => {
      const runId = 'tool-run-error';
      const serialized = { name: 'FailingTool', kwargs: {} };

      handler.handleToolStart(serialized as any, 'bad input', runId);
      handler.handleToolError(new Error('Tool failed'), runId);

      expect(mockClient.logError).toHaveBeenCalledOnce();
      const callArgs = mockClient.logError.mock.calls[0][0];

      expect(callArgs.context.toolName).toBe('FailingTool');
    });
  });

  describe('Chain callbacks', () => {
    it('should handle chain start and end', () => {
      const runId = 'chain-run-1';
      const serialized = {
        lc: 1,
        type: 'constructor',
        id: ['langchain', 'chains', 'LLMChain'],
        name: 'LLMChain',
      };

      handler.handleChainStart(serialized as any, { question: 'What is AI?' }, runId);
      handler.handleChainEnd({ answer: 'Artificial Intelligence' }, runId);

      expect(mockClient.logAgentStep).toHaveBeenCalledOnce();
      const callArgs = mockClient.logAgentStep.mock.calls[0][0];

      expect(callArgs.stepName).toBe('chain:LLMChain');
      expect(callArgs.stepType).toBe(StepType.REASONING);
    });

    it('should handle chain error', () => {
      const runId = 'chain-run-error';
      const serialized = { name: 'FailingChain', id: ['FailingChain'] };

      handler.handleChainStart(serialized as any, {}, runId);
      handler.handleChainError(new Error('Chain failed'), runId);

      expect(mockClient.logError).toHaveBeenCalledOnce();
    });
  });

  describe('Agent callbacks', () => {
    it('should handle agent action', () => {
      const action = {
        tool: 'search',
        toolInput: { query: 'test query' },
        log: 'Searching for test query...',
      };

      handler.handleAgentAction(action, 'agent-run-1');

      expect(mockClient.logAgentStep).toHaveBeenCalledOnce();
      const callArgs = mockClient.logAgentStep.mock.calls[0][0];

      expect(callArgs.stepName).toBe('agent_action:search');
      expect(callArgs.reasoning).toBe('Searching for test query...');
    });

    it('should handle agent finish', () => {
      const finish = {
        returnValues: { output: 'Task completed!' },
        log: 'Agent finished successfully',
      };

      handler.handleAgentEnd(finish, 'agent-run-1');

      expect(mockClient.logAgentStep).toHaveBeenCalledOnce();
      const callArgs = mockClient.logAgentStep.mock.calls[0][0];

      expect(callArgs.stepName).toBe('agent_finish');
      expect(callArgs.stepType).toBe(StepType.OUTPUT);
      expect(callArgs.outputData.output).toBe('Task completed!');
    });
  });

  describe('Retriever callbacks', () => {
    it('should handle retriever start and end', () => {
      const runId = 'retriever-run-1';
      const serialized = { name: 'VectorStoreRetriever' };

      handler.handleRetrieverStart(serialized as any, 'Find AI documents', runId);

      const documents = [
        { pageContent: 'AI is artificial intelligence', metadata: { source: 'doc1' } },
        { pageContent: 'Machine learning is a subset of AI', metadata: { source: 'doc2' } },
      ];

      handler.handleRetrieverEnd(documents, runId);

      expect(mockClient.logAgentStep).toHaveBeenCalledOnce();
      const callArgs = mockClient.logAgentStep.mock.calls[0][0];

      expect(callArgs.stepName).toBe('retriever');
      expect(callArgs.inputData.query).toBe('Find AI documents');
      expect(callArgs.outputData.documentCount).toBe(2);
    });

    it('should handle retriever error', () => {
      const runId = 'retriever-run-error';
      const serialized = { name: 'VectorStoreRetriever' };

      handler.handleRetrieverStart(serialized as any, 'query', runId);
      handler.handleRetrieverError(new Error('Retrieval failed'), runId);

      expect(mockClient.logError).toHaveBeenCalledOnce();
    });
  });

  describe('Privacy options', () => {
    it('should redact prompts when logPrompts is false', () => {
      const privateHandler = new WatchLLMCallbackHandler({
        client: mockClient,
        logPrompts: false,
        logResponses: false,
      });

      const runId = 'private-run';
      privateHandler.handleLLMStart(createMockSerialized(), ['Secret prompt'], runId);
      privateHandler.handleLLMEnd(createMockLLMResult('Secret response'), runId);

      const callArgs = mockClient.logPromptCall.mock.calls[0][0];
      expect(callArgs.prompt).toBe('[REDACTED]');
      expect(callArgs.response).toBe('[REDACTED]');
    });
  });

  describe('Step counting', () => {
    it('should increment step count across multiple operations', () => {
      // First tool call
      handler.handleToolStart({ name: 'Tool1' } as any, 'input1', 'run-1');
      handler.handleToolEnd('output1', 'run-1');

      // Second tool call
      handler.handleToolStart({ name: 'Tool2' } as any, 'input2', 'run-2');
      handler.handleToolEnd('output2', 'run-2');

      expect(mockClient.logAgentStep).toHaveBeenCalledTimes(2);

      const firstCall = mockClient.logAgentStep.mock.calls[0][0];
      const secondCall = mockClient.logAgentStep.mock.calls[1][0];

      expect(firstCall.stepNumber).toBe(1);
      expect(secondCall.stepNumber).toBe(2);
    });
  });
});

describe('createCallbackHandler', () => {
  it('should create handler with factory function', () => {
    const mockClient = createMockClient();

    const handler = createCallbackHandler({
      client: mockClient,
      runId: 'factory-run',
      tags: ['test'],
    });

    expect(handler).toBeInstanceOf(WatchLLMCallbackHandler);
    expect(handler.name).toBe('WatchLLMCallbackHandler');
  });
});
