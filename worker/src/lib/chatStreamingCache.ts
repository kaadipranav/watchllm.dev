/**
 * Helpers for buffering upstream chat streams and replaying cached responses as SSE.
 */

import type { ChatCompletionResponse } from '../types';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

function chunkContent(content: string, size: number): string[] {
  if (!content) return [];
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += size) {
    chunks.push(content.slice(i, i + size));
  }
  return chunks;
}

function encodeSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function buildResponseFromEvents(rawEvents: string[], fallbackModel: string): ChatCompletionResponse | null {
  let id: string | null = null;
  let model = fallbackModel;
  let created = Math.floor(Date.now() / 1000);
  let role: 'assistant' | 'system' | 'user' | 'function' | 'tool' = 'assistant';
  let content = '';
  let finishReason: 'stop' | 'length' | 'function_call' | 'tool_calls' | 'content_filter' | null = null;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  for (const event of rawEvents) {
    const dataLine = event
      .split('\n')
      .map((l) => l.trim())
      .find((line) => line.startsWith('data:'));

    if (!dataLine) continue;

    const payload = dataLine.replace(/^data:\s*/, '');
    if (payload === '[DONE]') {
      continue;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(payload);
    } catch {
      continue;
    }

    if (!id && parsed.id) {
      id = parsed.id as string;
    }

    if (parsed.model) {
      model = parsed.model as string;
    }

    if (parsed.created) {
      created = Number(parsed.created);
    }

    const choice = parsed.choices?.[0];
    const delta = choice?.delta;
    if (delta?.role) {
      role = delta.role;
    }
    if (delta?.content) {
      content += delta.content;
    }
    if (choice?.finish_reason) {
      finishReason = choice.finish_reason;
    }

    const usage = parsed.usage;
    if (usage) {
      promptTokens = usage.prompt_tokens ?? promptTokens;
      completionTokens = usage.completion_tokens ?? usage.output_tokens ?? completionTokens;
      totalTokens = usage.total_tokens ?? promptTokens + completionTokens;
    }
  }

  totalTokens = totalTokens || promptTokens + completionTokens;

  if (!content || !finishReason) {
    return null; // Skip caching partial or empty streams
  }

  return {
    id: id ?? `stream-${Date.now()}`,
    object: 'chat.completion',
    created,
    model,
    choices: [
      {
        index: 0,
        message: {
          role,
          content,
        },
        finish_reason: finishReason,
      },
    ],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
  };
}

/**
 * Read an upstream streaming response, buffer it, and reconstruct a ChatCompletionResponse.
 */
export async function bufferChatStream(
  stream: ReadableStream,
  fallbackModel: string
): Promise<ChatCompletionResponse | null> {
  const reader = stream.getReader();
  let raw = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += textDecoder.decode(value, { stream: true });
    }
    raw += textDecoder.decode();
  } catch (error) {
    console.error('Failed to buffer streaming response:', error);
    return null;
  }

  const events = raw
    .split(/\n\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  return buildResponseFromEvents(events, fallbackModel);
}

/**
 * Replay a cached chat completion as an SSE stream with a slight delay between chunks.
 */
export function replayChatCompletionAsStream(
  response: ChatCompletionResponse,
  delayMs: number = 50
): ReadableStream {
  const content = response.choices?.[0]?.message.content || '';
  const role = response.choices?.[0]?.message.role || 'assistant';
  const model = response.model;
  const created = response.created || Math.floor(Date.now() / 1000);
  const id = response.id || `replay-${Date.now()}`;

  const contentChunks = chunkContent(content, 48);

  const events: string[] = [];
  events.push(
    encodeSSE({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [
        {
          index: 0,
          delta: { role },
          finish_reason: null,
        },
      ],
    })
  );

  for (const chunk of contentChunks) {
    events.push(
      encodeSSE({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [
          {
            index: 0,
            delta: { content: chunk },
            finish_reason: null,
          },
        ],
      })
    );
  }

  events.push(
    encodeSSE({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: response.choices?.[0]?.finish_reason ?? 'stop',
        },
      ],
    })
  );

  events.push('data: [DONE]\n\n');

  return new ReadableStream({
    start(controller) {
      let idx = 0;
      const pump = () => {
        if (idx >= events.length) {
          controller.close();
          return;
        }
        controller.enqueue(textEncoder.encode(events[idx]));
        idx += 1;
        setTimeout(pump, delayMs);
      };

      pump();
    },
  });
}
