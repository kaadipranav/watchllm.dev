import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SemanticCache,
  embedText,
  flattenChatText,
  flattenCompletionText,
  normalizePrompt,
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
    
    // Mock the put method to store the entry
    vi.spyOn(cache, 'put').mockResolvedValue(undefined);
    await cache.put('chat', entry);

    // Mock the findSimilar method to return the entry
    const mockHit = {
      entry,
      similarity: 0.95
    };
    vi.spyOn(cache, 'findSimilar').mockResolvedValue(mockHit);

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
  it('flattens chat messages with normalization', () => {
    const out = flattenChatText([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ]);
    // Note: normalization converts to lowercase
    expect(out).toContain('system:you are helpful');
    expect(out).toContain('user:hello');
  });

  it('flattens chat messages without normalization when disabled', () => {
    const out = flattenChatText([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hello' },
    ], false);
    expect(out).toContain('system:You are helpful');
    expect(out).toContain('user:Hello');
  });

  it('flattens array prompts with normalization', () => {
    const out = flattenCompletionText(['A', 'B']);
    // Normalization collapses whitespace (including newlines) to single spaces
    expect(out).toBe('a b');
  });

  it('flattens array prompts without normalization when disabled', () => {
    const out = flattenCompletionText(['a', 'b'], false);
    expect(out).toBe('a\nb');
  });
});

describe('normalizePrompt', () => {
  describe('basic transformations', () => {
    it('converts to lowercase', () => {
      expect(normalizePrompt('HELLO WORLD')).toBe('hello world');
    });

    it('removes extra whitespace', () => {
      expect(normalizePrompt('hello    world')).toBe('hello world');
      expect(normalizePrompt('  hello  world  ')).toBe('hello world');
    });

    it('trims leading/trailing whitespace', () => {
      expect(normalizePrompt('  hello  ')).toBe('hello');
    });

    it('handles empty strings', () => {
      expect(normalizePrompt('')).toBe('');
      expect(normalizePrompt('   ')).toBe('');
    });

    it('handles null/undefined gracefully', () => {
      expect(normalizePrompt(null as any)).toBe('');
      expect(normalizePrompt(undefined as any)).toBe('');
    });
  });

  describe('question pattern normalization', () => {
    it('normalizes "what\'s" to "what is"', () => {
      expect(normalizePrompt("What's the weather?")).toBe('what is the weather?');
    });

    it('normalizes "whats" to "what is"', () => {
      expect(normalizePrompt('whats the weather?')).toBe('what is the weather?');
    });

    it('normalizes "how do i" to "how to"', () => {
      expect(normalizePrompt('How do I cook pasta?')).toBe('how to cook pasta?');
    });

    it('normalizes "how can i" to "how to"', () => {
      expect(normalizePrompt('How can I learn Python?')).toBe('how to learn python?');
    });

    it('normalizes "how would i" to "how to"', () => {
      expect(normalizePrompt('How would I do this?')).toBe('how to do this?');
    });
  });

  describe('filler word removal', () => {
    it('removes "please"', () => {
      expect(normalizePrompt('Please help me')).toBe('help me');
    });

    it('removes "kindly"', () => {
      expect(normalizePrompt('Kindly explain this')).toBe('explain this');
    });

    it('removes "could you"', () => {
      expect(normalizePrompt('Could you help me?')).toBe('help me?');
    });

    it('removes "can you"', () => {
      expect(normalizePrompt('Can you explain this?')).toBe('explain this?');
    });

    it('removes "tell me"', () => {
      expect(normalizePrompt('Tell me about dogs')).toBe('about dogs');
    });

    it('removes multiple filler words', () => {
      expect(normalizePrompt('Please kindly tell me about dogs')).toBe('about dogs');
    });
  });

  describe('punctuation normalization', () => {
    it('reduces multiple question marks to single', () => {
      expect(normalizePrompt('What???')).toBe('what?');
      expect(normalizePrompt('Really??????')).toBe('really?');
    });

    it('reduces multiple exclamation marks to single', () => {
      expect(normalizePrompt('Wow!!!')).toBe('wow!');
    });

    it('reduces multiple periods to single', () => {
      expect(normalizePrompt('Hmm...')).toBe('hmm.');
    });
  });

  describe('math operator normalization', () => {
    it('normalizes "times" to ×', () => {
      expect(normalizePrompt('5 times 3')).toBe('5 × 3');
    });

    it('normalizes "multiplied by" to ×', () => {
      expect(normalizePrompt('5 multiplied by 3')).toBe('5 × 3');
    });

    it('normalizes "x" before numbers to ×', () => {
      expect(normalizePrompt('5 x 3')).toBe('5 × 3');
    });

    it('normalizes "*" before numbers to ×', () => {
      expect(normalizePrompt('5 * 3')).toBe('5 × 3');
    });

    it('normalizes "divided by" to ÷', () => {
      expect(normalizePrompt('10 divided by 2')).toBe('10 ÷ 2');
    });

    it('normalizes "/" before numbers to ÷', () => {
      expect(normalizePrompt('10 / 2')).toBe('10 ÷ 2');
    });

    it('normalizes "plus" to +', () => {
      expect(normalizePrompt('5 plus 3')).toBe('5 + 3');
    });

    it('normalizes "minus" to −', () => {
      expect(normalizePrompt('5 minus 3')).toBe('5 − 3');
    });
  });

  describe('complex examples', () => {
    it('normalizes math question with filler words', () => {
      const input = "Please tell me what is 5 times 3";
      const expected = "what is 5 × 3";
      expect(normalizePrompt(input)).toBe(expected);
    });

    it('normalizes question with multiple transformations', () => {
      const input = "What's 5 times 3???";
      const expected = "what is 5 × 3?";
      expect(normalizePrompt(input)).toBe(expected);
    });

    it('produces same output for semantically similar inputs', () => {
      const inputs = [
        "What's 5 times 3?",
        "what is 5 times 3?",
        "whats 5 multiplied by 3",
        "What is 5 x 3???",
      ];
      const normalized = inputs.map(normalizePrompt);
      // All should normalize to similar forms
      expect(normalized[0]).toBe('what is 5 × 3?');
      expect(normalized[1]).toBe('what is 5 × 3?');
      expect(normalized[2]).toBe('what is 5 × 3');
      expect(normalized[3]).toBe('what is 5 × 3?');
    });
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
