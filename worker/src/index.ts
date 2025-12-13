/**
 * WatchLLM API Proxy Worker
 *
 * A high-performance, cost-optimizing proxy for AI API requests
 * with semantic caching, rate limiting, and usage tracking.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as Sentry from '@sentry/cloudflare';

import type { Env, ValidatedAPIKey, APIError } from './types';
import { createRedisClient } from './lib/redis';
import { createSupabaseClient } from './lib/supabase';
import { handleChatCompletions } from './handlers/chat';
import { handleCompletions } from './handlers/completions';
import { handleEmbeddings } from './handlers/embeddings';
import { log, maskApiKey } from './lib/logger';

// Create Hono app with environment bindings
const app = new Hono<{ Bindings: Env; Variables: { validatedKey: ValidatedAPIKey; requestId: string } }>();

// ============================================================================
// Middleware
// ============================================================================

// CORS middleware
app.use(
  '*',
  cors({
    origin: '*', // Configure specific origins in production
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposeHeaders: [
      'X-Cache',
      'X-Cache-Age',
      'X-Latency-Ms',
      'X-Cost-USD',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    maxAge: 86400,
  })
);

// Simple request logging
app.use('*', logger());

// Structured logging, Sentry init, and request timing
app.use('*', async (c, next) => {
  if (c.env.SENTRY_DSN && !Sentry.isInitialized()) {
    Sentry.init({
      dsn: c.env.SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: c.env.APP_URL?.includes('localhost') ? 'development' : 'production',
    });
  }

  const requestId = crypto.randomUUID();
  c.set('requestId', requestId);
  const start = performance.now();
  const authHeader = c.req.header('Authorization');
  const apiKey = maskApiKey(extractAPIKey(authHeader || ''));

  try {
    await next();
  } catch (err) {
    Sentry.captureException(err, {
      extra: { requestId, path: c.req.path, method: c.req.method },
    });
    throw err;
  } finally {
    const duration = Math.round(performance.now() - start);
    log('info', 'request.complete', {
      requestId,
      path: c.req.path,
      method: c.req.method,
      status: c.res?.status || 500,
      latencyMs: duration,
      apiKey,
      cache: c.res?.headers?.get('X-Cache'),
    });
  }
});

// ============================================================================
// API Key Authentication Middleware
// ============================================================================

/**
 * Extract API key from Authorization header
 */
function extractAPIKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  // Support both "Bearer <key>" and raw key formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

/**
 * Authentication middleware for API endpoints
 */
app.use('/v1/*', async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = extractAPIKey(authHeader);

  if (!apiKey) {
    const error: APIError = {
      error: {
        message: 'Missing API key. Include it in the Authorization header as "Bearer <key>"',
        type: 'invalid_request_error',
        code: 'missing_api_key',
      },
    };
    return c.json(error, 401);
  }

  // Validate API key against Supabase
  const supabase = createSupabaseClient(c.env);
  const validatedKey = await supabase.validateAPIKey(apiKey);

  if (!validatedKey) {
    const error: APIError = {
      error: {
        message: 'Invalid API key. Please check your key and try again.',
        type: 'invalid_request_error',
        code: 'invalid_api_key',
      },
    };
    return c.json(error, 401);
  }

  // Store validated key for handlers
  c.set('validatedKey', validatedKey);

  await next();
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

/**
 * Basic health check
 */
app.get('/health', async (c) => {
  return c.json({
    status: 'ok',
    service: 'watchllm-proxy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * Detailed health check with dependency status
 */
app.get('/health/detailed', async (c) => {
  const redis = createRedisClient(c.env);
  const supabase = createSupabaseClient(c.env);

  const [redisOk, supabaseOk] = await Promise.all([
    redis.ping(),
    supabase.healthCheck(),
  ]);

  const allHealthy = redisOk && supabaseOk;

  return c.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'watchllm-proxy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      dependencies: {
        redis: redisOk ? 'healthy' : 'unhealthy',
        supabase: supabaseOk ? 'healthy' : 'unhealthy',
      },
    },
    allHealthy ? 200 : 503
  );
});

/**
 * Root endpoint
 */
app.get('/', (c) => {
  return c.json({
    message: 'WatchLLM API Proxy',
    version: '1.0.0',
    docs: 'https://docs.watchllm.dev',
    endpoints: {
      chat: 'POST /v1/chat/completions',
      completions: 'POST /v1/completions',
      embeddings: 'POST /v1/embeddings',
      health: 'GET /health',
    },
  });
});

// ============================================================================
// OpenAI-Compatible API Endpoints
// ============================================================================

/**
 * Chat Completions - OpenAI compatible
 * POST /v1/chat/completions
 */
app.post('/v1/chat/completions', async (c) => {
  const validatedKey = c.get('validatedKey');
  return handleChatCompletions(c, validatedKey);
});

/**
 * Legacy Completions - OpenAI compatible
 * POST /v1/completions
 */
app.post('/v1/completions', async (c) => {
  const validatedKey = c.get('validatedKey');
  return handleCompletions(c, validatedKey);
});

/**
 * Embeddings - OpenAI compatible
 * POST /v1/embeddings
 */
app.post('/v1/embeddings', async (c) => {
  const validatedKey = c.get('validatedKey');
  return handleEmbeddings(c, validatedKey);
});

/**
 * Models list endpoint (for compatibility)
 * GET /v1/models
 */
app.get('/v1/models', (c) => {
  return c.json({
    object: 'list',
    data: [
      // OpenAI models
      { id: 'gpt-4o', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'gpt-4o-mini', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'gpt-4-turbo', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'gpt-3.5-turbo', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'text-embedding-3-small', object: 'model', created: 1715367049, owned_by: 'openai' },
      { id: 'text-embedding-3-large', object: 'model', created: 1715367049, owned_by: 'openai' },
      // Anthropic models
      { id: 'claude-3-5-sonnet-20241022', object: 'model', created: 1715367049, owned_by: 'anthropic' },
      { id: 'claude-3-opus-20240229', object: 'model', created: 1715367049, owned_by: 'anthropic' },
      { id: 'claude-3-haiku-20240307', object: 'model', created: 1715367049, owned_by: 'anthropic' },
      // Groq models
      { id: 'llama-3.1-70b-versatile', object: 'model', created: 1715367049, owned_by: 'groq' },
      { id: 'llama-3.1-8b-instant', object: 'model', created: 1715367049, owned_by: 'groq' },
      { id: 'mixtral-8x7b-32768', object: 'model', created: 1715367049, owned_by: 'groq' },
    ],
  });
});

// ============================================================================
// Error Handling
// ============================================================================

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: {
        message: `Endpoint not found: ${c.req.method} ${c.req.path}`,
        type: 'invalid_request_error',
        code: 'not_found',
      },
    },
    404
  );
});

/**
 * Global error handler
 */
app.onError((err, c) => {
  Sentry.captureException(err, { extra: { path: c.req.path, method: c.req.method, requestId: c.get('requestId') } });
  console.error('Unhandled error:', err);

  return c.json(
    {
      error: {
        message: 'Internal server error',
        type: 'api_error',
        code: 'internal_error',
      },
    },
    500
  );
});

export default app;
