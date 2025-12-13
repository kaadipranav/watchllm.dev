import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Env } from "../../types";

class MockRedis {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();
  private counters = new Map<string, { count: number; resetAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return true;
  }

  async del(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async checkRateLimit(key: string, limit: number, windowSeconds = 60) {
    const now = Date.now();
    const record = this.counters.get(key) ?? { count: 0, resetAt: now + windowSeconds * 1000 };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowSeconds * 1000;
    }
    record.count += 1;
    this.counters.set(key, record);

    return {
      allowed: record.count <= limit,
      remaining: Math.max(0, limit - record.count),
      resetAt: Math.floor(record.resetAt / 1000),
    };
  }

  // Unused in this test but required by interface
  async ping() { return true; }
  async exists() { return false; }
  async expire() { return true; }
  async ttl() { return 60; }
  async incr(key: string) { const current = this.counters.get(key)?.count ?? 0; this.counters.set(key, { count: current + 1, resetAt: Date.now() + 60000 }); return current + 1; }
}

const usageLogs: Array<Record<string, unknown>> = [];

class MockSupabase {
  async validateAPIKey() {
    return {
      keyRecord: {
        id: "key_1",
        key: "test_key",
        project_id: "proj_1",
        name: "Test",
        created_at: new Date().toISOString(),
        last_used_at: null,
        is_active: true,
      },
      project: {
        id: "proj_1",
        user_id: "user_1",
        name: "Test Project",
        plan: "starter",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  async logUsage(entry: Record<string, unknown>) {
    usageLogs.push(entry);
    return true;
  }

  async healthCheck() {
    return true;
  }
}

vi.mock("../../lib/redis", () => ({
  createRedisClient: () => new MockRedis(),
  RedisClient: MockRedis,
}));

vi.mock("../../lib/supabase", () => ({
  createSupabaseClient: () => new MockSupabase(),
  SupabaseClient: MockSupabase,
}));

vi.mock("../../lib/notifications", () => ({
  maybeSendUsageAlert: vi.fn(),
}));

import app from "../../index";

const fetchCounts = { openai: 0 };

const server = setupServer(
  http.post("https://api.openai.com/v1/chat/completions", async ({ request }) => {
    fetchCounts.openai += 1;
    const body = (await request.json()) as Record<string, unknown>;
    if (!body) return HttpResponse.json({ error: "missing body" }, { status: 400 });

    return HttpResponse.json({
      id: "chat-test",
      object: "chat.completion",
      created: 123,
      model: "gpt-4o",
      choices: [
        { index: 0, message: { role: "assistant", content: "Hello!" }, finish_reason: "stop" },
      ],
      usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  fetchCounts.openai = 0;
  usageLogs.length = 0;
});
afterAll(() => server.close());

describe("API proxy integration", () => {
  const env: Env = {
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_ANON_KEY: "anon-key",
    UPSTASH_REDIS_REST_URL: "https://redis",
    UPSTASH_REDIS_REST_TOKEN: "token",
    OPENAI_API_KEY: "openai-key",
  };

  const makeRequest = () =>
    new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test_key",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        temperature: 0.5,
      }),
    });

  it("forwards to provider then serves cached response", async () => {
    const res1 = await app.fetch(makeRequest(), env as any);
    const json1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-Cache")).toBe("MISS");
    expect(json1.choices[0].message.content).toBe("Hello!");
    expect(fetchCounts.openai).toBe(1);

    const res2 = await app.fetch(makeRequest(), env as any);
    const json2 = await res2.json();

    expect(res2.headers.get("X-Cache")).toBe("HIT");
    expect(json2.choices[0].message.content).toBe("Hello!");
    expect(fetchCounts.openai).toBe(1);
    expect(usageLogs.length).toBeGreaterThanOrEqual(2);
  });
});
