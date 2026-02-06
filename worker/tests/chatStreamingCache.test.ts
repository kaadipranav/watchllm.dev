import { describe, it, expect } from 'vitest';
import { ReadableStream } from 'stream/web';
import { bufferChatStream, replayChatCompletionAsStream } from '../src/lib/chatStreamingCache';
import type { ChatCompletionResponse } from '../src/types';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function streamFromChunks(chunks: string[]): ReadableStream {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

describe('bufferChatStream', () => {
  it('reconstructs a complete response from SSE stream', async () => {
    const sseChunks = [
      'data: {"id":"abc","model":"gpt-4","created":1700000000,"choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}\n\n',
      'data: {"id":"abc","model":"gpt-4","choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"abc","model":"gpt-4","choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":5,"completion_tokens":2,"total_tokens":7}}\n\n',
      'data: [DONE]\n\n',
    ];

    const stream = streamFromChunks(sseChunks);
    const result = await bufferChatStream(stream, 'gpt-4');

    expect(result).not.toBeNull();
    expect(result?.choices[0].message.content).toBe('Hello');
    expect(result?.choices[0].finish_reason).toBe('stop');
    expect(result?.usage.prompt_tokens).toBe(5);
    expect(result?.usage.completion_tokens).toBe(2);
    expect(result?.usage.total_tokens).toBe(7);
  });

  it('returns null for partial/unfinished streams', async () => {
    const sseChunks = [
      'data: {"id":"abc","model":"gpt-4","choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}\n\n',
      // Missing content and finish_reason
    ];

    const stream = streamFromChunks(sseChunks);
    const result = await bufferChatStream(stream, 'gpt-4');

    expect(result).toBeNull();
  });
});

describe('replayChatCompletionAsStream', () => {
  it('emits SSE events that include role, content, finish, and DONE marker', async () => {
    const response: ChatCompletionResponse = {
      id: 'replay-1',
      object: 'chat.completion',
      created: 1700000000,
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: 'Hello world' },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
    };

    const replay = replayChatCompletionAsStream(response, 0);
    const reader = replay.getReader();
    let aggregated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      aggregated += decoder.decode(value);
    }

    expect(aggregated).toContain('"delta":{"role":"assistant"}');
    expect(aggregated).toContain('"delta":{"content":"Hello world"}');
    expect(aggregated).toContain('"finish_reason":"stop"');
    expect(aggregated).toContain('[DONE]');
  });
});
