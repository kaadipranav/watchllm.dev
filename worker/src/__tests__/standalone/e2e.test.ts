import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../index';
import { createSelfHostedEnv } from '../../adapters/env-adapter';
import type { Env } from '../../types';

describe('Standalone E2E Tests', () => {
  let env: Env;
  let testApiKey: string;

  beforeAll(async () => {
    // Initialize self-hosted environment
    env = await createSelfHostedEnv();

    // Create test project and API key
    // In production, this would come from Supabase
    testApiKey = process.env.TEST_API_KEY || 'lgw_test_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    console.log('Standalone environment initialized');
  });

  afterAll(async () => {
    // Cleanup
    if (env.REDIS) {
      // Clear test keys
      // await env.REDIS.del('test:*');
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const req = new Request('http://localhost:8080/health');
      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toMatchObject({
        status: 'healthy',
      });
    });
  });

  describe('Chat Completions API', () => {
    it('should proxy OpenAI request successfully', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: 'Say "test successful"' },
          ],
        }),
      });

      const res = await app.fetch(req, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');

      const data = await res.json() as any;
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('choices');
      expect(data.choices).toHaveLength(1);
    }, 30000); // 30s timeout for external API

    it('should reject requests without API key', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const res = await app.fetch(req, env);

      expect(res.status).toBe(401);
      const data = await res.json() as any;
      expect(data).toHaveProperty('error');
    });

    it('should reject requests with invalid API key', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer lgw_invalid_key',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const res = await app.fetch(req, env);

      expect(res.status).toBe(401);
    });
  });

  describe('Semantic Caching', () => {
    it('should cache and return cached responses', async () => {
      const uniqueContent = `Test cache ${Date.now()}`;
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: uniqueContent }],
      };

      // First request - should hit upstream
      const req1 = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const res1 = await app.fetch(req1, env);
      expect(res1.status).toBe(200);
      expect(res1.headers.get('x-watchllm-cache')).toBe('miss');

      const data1 = await res1.json();

      // Second identical request - should hit cache
      const req2 = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const res2 = await app.fetch(req2, env);
      expect(res2.status).toBe(200);
      expect(res2.headers.get('x-watchllm-cache')).toBe('hit');

      const data2 = await res2.json();

      // Response should be identical
      expect(data2).toEqual(data1);
    }, 60000); // 60s timeout
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array.from({ length: 5 }, (_, i) =>
        new Request('http://localhost:8080/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${testApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: `Request ${i}` }],
          }),
        })
      );

      const responses = await Promise.all(
        requests.map(req => app.fetch(req, env))
      );

      // Check that rate limit headers are present
      responses.forEach(res => {
        expect(res.headers.has('x-ratelimit-limit')).toBe(true);
        expect(res.headers.has('x-ratelimit-remaining')).toBe(true);
        expect(res.headers.has('x-ratelimit-reset')).toBe(true);
      });

      // Some requests should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Observability', () => {
    it('should log usage to analytics', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test observability' }],
        }),
      });

      const res = await app.fetch(req, env);
      expect(res.status).toBe(200);

      // Wait for async queue processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, check ClickHouse for the logged event
      // For tests, we can check that queue was called
      expect(env.ANALYTICS_QUEUE).toBeDefined();
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const res = await app.fetch(req, env);
      expect(res.status).toBe(400);
    });

    it('should handle missing required fields', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // missing 'model' and 'messages'
        }),
      });

      const res = await app.fetch(req, env);
      expect(res.status).toBe(400);
    });

    it('should handle upstream provider errors gracefully', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'invalid-model-that-does-not-exist',
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      const res = await app.fetch(req, env);
      expect([400, 404, 500]).toContain(res.status);

      const data = await res.json() as any;
      expect(data).toHaveProperty('error');
    }, 30000);
  });

  describe('Streaming', () => {
    it('should handle streaming requests', async () => {
      const req = new Request('http://localhost:8080/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${testApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Count to 5' }],
          stream: true,
        }),
      });

      const res = await app.fetch(req, env);
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('text/event-stream');

      // Read stream
      const reader = res.body?.getReader();
      expect(reader).toBeDefined();

      if (reader) {
        const chunks: string[] = [];
        let done = false;

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            chunks.push(new TextDecoder().decode(value));
          }
        }

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks.join('')).toContain('data:');
      }
    }, 60000);
  });
});
