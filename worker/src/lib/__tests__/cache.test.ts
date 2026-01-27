import { describe, it, expect } from "vitest";
import {
  CacheManager,
  generateChatCacheKey,
  generateCompletionCacheKey,
  generateEmbeddingsCacheKey,
} from "../cache";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CompletionRequest,
  CompletionResponse,
  EmbeddingsRequest,
  EmbeddingsResponse,
} from "../../types";

class MockRedis {
  public store = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }
  async set(key: string, value: unknown): Promise<boolean> {
    this.store.set(key, value);
    return true;
  }
  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
}

describe("cache key generation", () => {
  it("creates deterministic chat keys and normalizes input", () => {
    const baseRequest: ChatCompletionRequest = {
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are helpful" },
        { role: "user", content: "Hello   WORLD" },
      ],
      temperature: 0.7,
    };

    const key1 = generateChatCacheKey(baseRequest);
    const key2 = generateChatCacheKey({
      ...baseRequest,
      messages: [
        { role: "system", content: " you are   helpful  " },
        { role: "user", content: "hello world" },
      ],
    });

    expect(key1).toMatch(/^watchllm:cache:chat:/);
    expect(key1).toBe(key2);
  });

  it("changes keys when content differs", () => {
    const request: ChatCompletionRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "Hi" }],
    };

    const keyA = generateChatCacheKey(request);
    const keyB = generateChatCacheKey({ ...request, messages: [{ role: "user", content: "Hi there" }] });
    expect(keyA).not.toBe(keyB);
  });

  it("generates completion and embedding keys with prefixes", () => {
    const completionKey = generateCompletionCacheKey({
      model: "gpt-3.5-turbo",
      prompt: "Hello",
      temperature: 0.9,
    } satisfies CompletionRequest);

    const embeddingKey = generateEmbeddingsCacheKey({
      model: "text-embedding-3-small",
      input: ["foo", "bar"],
    } satisfies EmbeddingsRequest);

    expect(completionKey).toMatch(/^watchllm:cache:completion:/);
    expect(embeddingKey).toMatch(/^watchllm:cache:embedding:/);
  });
});

describe("CacheManager", () => {
  it("caches streaming requests (for replay)", async () => {
    const redis = new MockRedis();
    const cache = new CacheManager(redis as any);

    const request: ChatCompletionRequest = {
      model: "gpt-4o",
      messages: [{ role: "user", content: "stream please" }],
      stream: true,
    };

    const stored = await cache.setChatCompletion(request, {
      id: "chat1",
      object: "chat.completion",
      created: Date.now(),
      model: "gpt-4o",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "hi" },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    } satisfies ChatCompletionResponse);

    expect(stored).toBe(true);
    expect(redis.store.size).toBe(1);
  });

  it("stores and retrieves non-streaming responses", async () => {
    const redis = new MockRedis();
    const cache = new CacheManager(redis as any);

    const request: CompletionRequest = {
      model: "gpt-3.5-turbo",
      prompt: "Tell me a joke",
      temperature: 0.5,
    };

    const response: CompletionResponse = {
      id: "cmp-1",
      object: "text_completion",
      created: Date.now(),
      model: "gpt-3.5-turbo",
      choices: [{ text: "A joke", index: 0, logprobs: null, finish_reason: "stop" }],
      usage: { prompt_tokens: 5, completion_tokens: 7, total_tokens: 12 },
    };

    await cache.setCompletion(request, response);
    const cached = await cache.getCompletion(request);

    expect(cached?.data).toEqual(response);
    expect(cached?.tokens.total).toBe(12);
  });

  it("stores embeddings with extended TTL", async () => {
    const redis = new MockRedis();
    const cache = new CacheManager(redis as any);

    const request: EmbeddingsRequest = { model: "text-embedding-3-small", input: "hello" };
    const response: EmbeddingsResponse = {
      object: "list",
      data: [{ object: "embedding", index: 0, embedding: [1, 2, 3] }],
      model: "text-embedding-3-small",
      usage: { prompt_tokens: 3, total_tokens: 3 },
    };

    const stored = await cache.setEmbeddings(request, response);
    expect(stored).toBe(true);
    expect(redis.store.size).toBe(1);
  });
});
