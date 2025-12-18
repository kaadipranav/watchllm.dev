import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SemanticCache,
  embedText,
  flattenChatText,
  flattenCompletionText,
  type SemanticCacheEntry,
} from '../semanticCache';

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

describe('SemanticCache', () => {
  let redis: MockRedis;
  let cache: SemanticCache;

  beforeEach(() => {
    redis = new MockRedis();
    cache = new SemanticCache(redis as any, 'project-1', 10);
  });

  it('returns best semantic hit above threshold', async () => {
    const entry: SemanticCacheEntry<{ ok: boolean }> = {
      embedding: [1, 0, 0],
      data: { ok: true },
      model: 'gpt-4o',
      timestamp: Date.now(),
      tokens: { input: 1, output: 1, total: 2 },
      text: 'hello world',
    };
    await cache.put('chat', entry);

    const hit = await cache.findSimilar<{ ok: boolean }>('chat', [0.98, 0.01, 0.01], 0.9);
    expect(hit).not.toBeNull();
    expect(hit?.entry.data.ok).toBe(true);
  });

  it('returns null when below threshold', async () => {
    const entry: SemanticCacheEntry<{ ok: boolean }> = {
      embedding: [1, 0, 0],
      data: { ok: true },
      model: 'gpt-4o',
      timestamp: Date.now(),
      tokens: { input: 1, output: 1, total: 2 },
      text: 'hello world',
    };
    await cache.put('chat', entry);

    const hit = await cache.findSimilar('chat', [0, 1, 0], 0.95);
    expect(hit).toBeNull();
  });
});

describe('flatten helpers', () => {
  it('flattens chat messages', () => {
    const out = flattenChatText([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ]);
    expect(out).toContain('system:You are helpful');
    expect(out).toContain('user:Hello');
  });

  it('flattens array prompts', () => {
    const out = flattenCompletionText(['a', 'b']);
    expect(out).toBe('a\nb');
  });
});

describe('embedText', () => {
  it('returns embedding from provider', async () => {
    const provider = {
      embeddings: vi.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }],
      }),
    } as any;
    const vec = await embedText(provider, 'hello');
    expect(vec).toEqual([0.1, 0.2, 0.3]);
  });

  it('handles provider failure gracefully', async () => {
    const provider = {
      embeddings: vi.fn().mockRejectedValue(new Error('boom')),
    } as any;
    const vec = await embedText(provider, 'hello');
    expect(vec).toBeNull();
  });
});
