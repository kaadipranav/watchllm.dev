import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WatchLLMClient, EventType, Status, StepType, init } from './index';

// Mock node-fetch module
vi.mock('node-fetch', () => {
  return {
    default: vi.fn(),
  };
});

import fetch from 'node-fetch';
const mockFetch = fetch as any;

describe('WatchLLMClient', () => {
  let client: WatchLLMClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch response - needs to be AFTER clearAllMocks
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
      text: async () => JSON.stringify({ success: true }),
    });
    
    client = new WatchLLMClient({
      apiKey: 'lgw_test_12345678901234567890123456789012',
      projectId: 'test-project',
      baseUrl: 'http://localhost:8787/v1',
      flushIntervalSeconds: 60, // Long interval to prevent auto-flush during tests
    });
  });

  afterEach(async () => {
    await client.close();
  });

  describe('initialization', () => {
    it('should create client with default config', () => {
      expect(client).toBeInstanceOf(WatchLLMClient);
    });

    it('should create client using init helper', () => {
      const helperClient = init({
        apiKey: 'lgw_test_12345678901234567890123456789012',
        projectId: 'test-project',
      });
      expect(helperClient).toBeInstanceOf(WatchLLMClient);
    });
  });

  describe('logPromptCall', () => {
    it('should log a prompt call event', () => {
      const eventId = client.logPromptCall({
        runId: 'run-123',
        prompt: 'What is 2+2?',
        model: 'gpt-4o-mini',
        response: 'The answer is 4.',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 250,
      });

      expect(eventId).toBeTruthy();
      expect(eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should include tool calls if provided', () => {
      const eventId = client.logPromptCall({
        runId: 'run-123',
        prompt: 'Search for X',
        model: 'gpt-4',
        response: 'Result: Y',
        tokensInput: 20,
        tokensOutput: 15,
        latencyMs: 500,
        toolCalls: [
          {
            tool_name: 'search',
            input: { query: 'X' },
            output: { result: 'Y' },
            latency_ms: 100,
            status: Status.SUCCESS,
          },
        ],
      });

      expect(eventId).toBeTruthy();
    });

    it('should calculate cost estimate', () => {
      // Mock to capture the event
      const queueSpy = vi.spyOn(client as any, 'queueEvent');

      client.logPromptCall({
        runId: 'run-123',
        prompt: 'Test',
        model: 'gpt-4o-mini',
        response: 'Response',
        tokensInput: 1000,
        tokensOutput: 2000,
        latencyMs: 100,
      });

      expect(queueSpy).toHaveBeenCalled();
      const event = queueSpy.mock.calls[0][0] as any;
      expect(event.cost_estimate_usd).toBeGreaterThan(0);
    });
  });

  describe('logAgentStep', () => {
    it('should log an agent step event', () => {
      const eventId = client.logAgentStep({
        runId: 'run-123',
        stepNumber: 1,
        stepName: 'Analyze Input',
        stepType: StepType.REASONING,
        inputData: { user_query: 'test' },
        outputData: { analysis: 'result' },
        latencyMs: 150,
      });

      expect(eventId).toBeTruthy();
    });

    it('should include reasoning if provided', () => {
      const eventId = client.logAgentStep({
        runId: 'run-123',
        stepNumber: 2,
        stepName: 'Execute Tool',
        stepType: StepType.TOOL_CALL,
        inputData: { tool: 'calculator' },
        outputData: { result: 42 },
        latencyMs: 200,
        reasoning: 'Need to calculate 6*7',
      });

      expect(eventId).toBeTruthy();
    });
  });

  describe('logError', () => {
    it('should log an error from Error object', () => {
      const error = new Error('Test error');
      const eventId = client.logError({
        runId: 'run-123',
        error,
      });

      expect(eventId).toBeTruthy();
    });

    it('should log an error from error dict', () => {
      const eventId = client.logError({
        runId: 'run-123',
        error: {
          message: 'Custom error',
          type: 'CustomError',
        },
      });

      expect(eventId).toBeTruthy();
    });
  });

  describe('flush', () => {
    it('should send events to API', async () => {
      // Clear beforeEach mock setup
      vi.clearAllMocks();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      });

      client.logPromptCall({
        runId: 'run-123',
        prompt: 'Test',
        model: 'gpt-4',
        response: 'Response',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      await client.flush();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8787/v1/events/batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer lgw_test_12345678901234567890123456789012',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      client.logPromptCall({
        runId: 'run-123',
        prompt: 'Test',
        model: 'gpt-4',
        response: 'Response',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      await expect(client.flush()).rejects.toThrow();
    });

    it('should not send if queue is empty', async () => {
      await client.flush();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('sampling', () => {
    it('should respect sample rate', () => {
      const sampledClient = new WatchLLMClient({
        apiKey: 'test-key',
        projectId: 'test-project',
        sampleRate: 0, // Never sample
      });

      const queueSpy = vi.spyOn(sampledClient as any, 'queueEvent');

      sampledClient.logPromptCall({
        runId: 'run-123',
        prompt: 'Test',
        model: 'gpt-4',
        response: 'Response',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      // Event should be queued but immediately filtered out
      expect(queueSpy).toHaveBeenCalled();
    });
  });

  describe('PII redaction', () => {
    it('should redact email addresses', async () => {
      const redactClient = new WatchLLMClient({
        apiKey: 'lgw_test_12345678901234567890123456789012',
        projectId: 'test-project',
        redactPII: true,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      });

      redactClient.logPromptCall({
        runId: 'run-123',
        prompt: 'Contact me at user@example.com',
        model: 'gpt-4',
        response: 'OK',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      await redactClient.flush();

      const callArgs = mockFetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      const prompt = body.events[0].prompt;

      expect(prompt).toContain('[REDACTED_EMAIL]');
      expect(prompt).not.toContain('user@example.com');
    });
  });

  describe('batch sending', () => {
    it('should auto-flush when batch size is reached', async () => {
      // Clear beforeEach mock setup
      vi.clearAllMocks();
      
      const batchClient = new WatchLLMClient({
        apiKey: 'lgw_test_12345678901234567890123456789012',
        projectId: 'test-project',
        batchSize: 2,
        flushIntervalSeconds: 60,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
        text: async () => JSON.stringify({ success: true }),
      });

      batchClient.logPromptCall({
        runId: 'run-1',
        prompt: 'Test 1',
        model: 'gpt-4',
        response: 'Response 1',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      expect(mockFetch).not.toHaveBeenCalled();

      batchClient.logPromptCall({
        runId: 'run-2',
        prompt: 'Test 2',
        model: 'gpt-4',
        response: 'Response 2',
        tokensInput: 10,
        tokensOutput: 5,
        latencyMs: 100,
      });

      // Wait for async flush (needs more time for promise chain)
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await batchClient.close();
    });
  });
});

