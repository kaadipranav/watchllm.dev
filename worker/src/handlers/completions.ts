/**
 * Legacy Completions Handler
 * POST /v1/completions
 */

import type { Context } from 'hono';
import type {
  Env,
  CompletionRequest,
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
function validateRequest(body: unknown): CompletionRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const request = body as Record<string, unknown>;

  if (!request.model || typeof request.model !== 'string') {
    throw new Error('model is required and must be a string');
  }

  if (!request.prompt) {
    throw new Error('prompt is required');
  }

  // Prompt can be string or array of strings
  if (typeof request.prompt !== 'string' && !Array.isArray(request.prompt)) {
    throw new Error('prompt must be a string or array of strings');
  }

  if (Array.isArray(request.prompt)) {
    for (const p of request.prompt) {
      if (typeof p !== 'string') {
        throw new Error('prompt array must contain only strings');
      }
    }
  }

  // Validate optional parameters
  if (request.temperature !== undefined) {
    const temp = Number(request.temperature);
    if (isNaN(temp) || temp < 0 || temp > 2) {
      throw new Error('temperature must be between 0 and 2');
    }
  }

  if (request.max_tokens !== undefined) {
    const maxTokens = Number(request.max_tokens);
    if (isNaN(maxTokens) || maxTokens < 1) {
      throw new Error('max_tokens must be a positive integer');
    }
  }

  return request as unknown as CompletionRequest;
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
 * Handle legacy completions request
 */
export async function handleCompletions(
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

    // Streaming not supported for legacy completions in this implementation
    if (request.stream) {
      return errorResponse('Streaming not supported for legacy completions', 400);
    }

    // Check cache first
    const cachedResponse = await cache.getCompletion(request);
    if (cachedResponse) {
      const latency = Date.now() - startTime;

      // Log usage (cached)
      await supabase.logUsage({
        project_id: project.id,
        api_key_id: keyRecord.id,
        model: cachedResponse.model,
        provider: getProviderForModel(request.model),
        tokens_input: cachedResponse.tokens.input,
        tokens_output: cachedResponse.tokens.output,
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
    const response = await provider.completion(request);
    const latency = Date.now() - startTime;

    // Calculate cost
    const cost = calculateCost(
      response.model,
      response.usage.prompt_tokens,
      response.usage.completion_tokens
    );

    // Cache the response
    await cache.setCompletion(request, response);

    // Log usage
    await supabase.logUsage({
      project_id: project.id,
      api_key_id: keyRecord.id,
      model: response.model,
      provider: getProviderForModel(request.model),
      tokens_input: response.usage.prompt_tokens,
      tokens_output: response.usage.completion_tokens,
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
    console.error('Completion error:', errorMessage);

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
