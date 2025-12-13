/**
 * Embeddings Handler
 * POST /v1/embeddings
 */

import type { Context } from 'hono';
import type {
  Env,
  EmbeddingsRequest,
  ValidatedAPIKey,
  APIError,
} from '../types';

// Define app context type
type AppContext = Context<{ Bindings: Env; Variables: { validatedKey: ValidatedAPIKey; requestId: string } }>;
import { calculateCost, PLAN_LIMITS } from '../types';
import { createRedisClient } from '../lib/redis';
import { createSupabaseClient } from '../lib/supabase';
import { createCacheManager } from '../lib/cache';
import { createProviderClient, getProviderForModel } from '../lib/providers';
import { maybeSendUsageAlert } from '../lib/notifications';

/**
 * Validate request body
 */
function validateRequest(body: unknown): EmbeddingsRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const request = body as Record<string, unknown>;

  if (!request.model || typeof request.model !== 'string') {
    throw new Error('model is required and must be a string');
  }

  if (!request.input) {
    throw new Error('input is required');
  }

  // Input can be string or array of strings
  if (typeof request.input !== 'string' && !Array.isArray(request.input)) {
    throw new Error('input must be a string or array of strings');
  }

  if (Array.isArray(request.input)) {
    for (const i of request.input) {
      if (typeof i !== 'string') {
        throw new Error('input array must contain only strings');
      }
    }
    if (request.input.length === 0) {
      throw new Error('input array cannot be empty');
    }
  }

  // Validate optional parameters
  if (request.dimensions !== undefined) {
    const dims = Number(request.dimensions);
    if (isNaN(dims) || dims < 1) {
      throw new Error('dimensions must be a positive integer');
    }
  }

  if (request.encoding_format !== undefined) {
    if (!['float', 'base64'].includes(request.encoding_format as string)) {
      throw new Error('encoding_format must be "float" or "base64"');
    }
  }

  return request as unknown as EmbeddingsRequest;
}

/**
 * Create error response
 */
function errorResponse(message: string, status: number): Response {
  const error: APIError = {
    error: {
      message,
      type: status === 401 ? 'invalid_request_error' : 'api_error',
      code: status === 429 ? 'rate_limit_exceeded' : undefined,
    },
  };
  return new Response(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle embeddings request
 */
export async function handleEmbeddings(
  c: AppContext,
  validatedKey: ValidatedAPIKey
): Promise<Response> {
  const startTime = Date.now();
  const env = c.env;
  const { keyRecord, project } = validatedKey;

  // Initialize clients
  const redis = createRedisClient(env);
  const supabase = createSupabaseClient(env);
  const cache = createCacheManager(redis);
  const provider = createProviderClient(env);

  try {
    // Parse and validate request body
    const body = await c.req.json();
    const request = validateRequest(body);

    // Check rate limiting
    const rateLimitKey = `ratelimit:${keyRecord.id}:minute`;
    const planLimits = PLAN_LIMITS[project.plan] || PLAN_LIMITS.free;
    const rateLimit = await redis.checkRateLimit(
      rateLimitKey,
      planLimits.requestsPerMinute,
      60
    );

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Rate limit exceeded. Limit: ${planLimits.requestsPerMinute}/minute`,
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded',
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': planLimits.requestsPerMinute.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': '60',
          },
        }
      );
    }

    // Check cache first (embeddings are deterministic, great for caching)
    const cachedResponse = await cache.getEmbeddings(request);
    if (cachedResponse) {
      const latency = Date.now() - startTime;

      // Log usage (cached)
      await supabase.logUsage({
        project_id: project.id,
        api_key_id: keyRecord.id,
        model: cachedResponse.model,
        provider: getProviderForModel(request.model),
        tokens_input: cachedResponse.tokens.input,
        tokens_output: 0,
        tokens_total: cachedResponse.tokens.total,
        cost_usd: 0,
        cached: true,
        latency_ms: latency,
      });

      return new Response(JSON.stringify(cachedResponse.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Age': Math.floor((Date.now() - cachedResponse.timestamp) / 1000).toString(),
          'X-Latency-Ms': latency.toString(),
        },
      });
    }

    // Make request to provider
    const response = await provider.embeddings(request);
    const latency = Date.now() - startTime;

    // Calculate cost
    const cost = calculateCost(
      response.model,
      response.usage.prompt_tokens,
      0 // Embeddings have no output tokens
    );

    // Cache the response (embeddings cached for 24 hours by default)
    await cache.setEmbeddings(request, response);

    // Log usage
    await supabase.logUsage({
      project_id: project.id,
      api_key_id: keyRecord.id,
      model: response.model,
      provider: getProviderForModel(request.model),
      tokens_input: response.usage.prompt_tokens,
      tokens_output: 0,
      tokens_total: response.usage.total_tokens,
      cost_usd: cost,
      cached: false,
      latency_ms: latency,
    });
    
    await maybeSendUsageAlert(env, supabase, redis, project);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-Latency-Ms': latency.toString(),
        'X-Cost-USD': cost.toFixed(6),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Embeddings error:', errorMessage);

    let status = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
      status = 400;
    } else if (errorMessage.includes('API key not configured')) {
      status = 503;
    } else if (errorMessage.includes('only supported for OpenAI')) {
      status = 400;
    }

    return errorResponse(
      status === 500 ? 'Internal server error' : errorMessage,
      status
    );
  }
}
