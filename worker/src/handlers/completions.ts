/**
 * Legacy Completions Handler
 * POST /v1/completions
 */

import type { Context } from 'hono';
import type {
  Env,
  CompletionRequest,
  CompletionResponse,
  ValidatedAPIKey,
  APIError,
} from '../types';

// Define app context type
type AppContext = Context<{ Bindings: Env; Variables: { validatedKey: ValidatedAPIKey; requestId: string } }>;
import { calculateCost, PLAN_LIMITS } from '../types';
import { createRedisClient } from '../lib/redis';
import { createD1Client } from '../lib/d1';
import { createSupabaseClient } from '../lib/supabase';
import { createCacheManager } from '../lib/cache';
import { getSharedProviderClient, getProviderForModel } from '../lib/providers';
import { maybeSendUsageAlert } from '../lib/notifications';
import {
  SemanticCache,
  SemanticCacheEntry,
  embedText,
  flattenCompletionText,
  normalizePrompt,
} from '../lib/semanticCache';
import { 
  createDeduplicationManager, 
  hashRequest 
} from '../lib/deduplication';

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
  const d1 = createD1Client(env.DB);
  const supabase = createSupabaseClient(env);
  const cache = createCacheManager(redis);
  const provider = getSharedProviderClient(env);
  
  // Initialize semantic cache with TTL options from project settings
  const semanticCache = new SemanticCache(d1, project.id, 50, {
    ttlSeconds: project.cache_ttl_seconds ?? 86400, // Default 24 hours
    endpointTTLOverrides: project.cache_ttl_overrides ?? {},
  });
  const semanticThreshold =
    typeof env.SEMANTIC_CACHE_THRESHOLD === 'string'
      ? Math.min(Math.max(Number(env.SEMANTIC_CACHE_THRESHOLD), 0.5), 0.99)
      : 0.95;

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

    // Check monthly quota
    const monthlyUsage = await supabase.getMonthlyUsage(project.id);
    if (monthlyUsage >= planLimits.requestsPerMonth) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Monthly quota exceeded. Your ${project.plan} plan allows ${planLimits.requestsPerMonth.toLocaleString()} requests/month. Upgrade your plan to continue.`,
            type: 'quota_exceeded',
            code: 'monthly_quota_exceeded',
            details: {
              plan: project.plan,
              limit: planLimits.requestsPerMonth,
              used: monthlyUsage,
            },
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Quota-Limit': planLimits.requestsPerMonth.toString(),
            'X-Quota-Used': monthlyUsage.toString(),
            'X-Quota-Remaining': Math.max(0, planLimits.requestsPerMonth - monthlyUsage).toString(),
          },
        }
      );
    }

    // Streaming not supported for legacy completions in this implementation
    if (request.stream) {
      return errorResponse('Streaming not supported for legacy completions', 400);
    }

    // Check deterministic cache first
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
        potential_cost_usd: calculateCost(
          cachedResponse.model,
          cachedResponse.tokens.input,
          cachedResponse.tokens.output
        ),
        cached: true,
        latency_ms: latency,
      });

      return new Response(JSON.stringify(cachedResponse.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-WatchLLM-Cache': 'HIT',
          'X-WatchLLM-Cache-Age': Math.floor((Date.now() - cachedResponse.timestamp) / 1000).toString(),
          'X-WatchLLM-Latency-Ms': latency.toString(),
          'X-WatchLLM-Provider': getProviderForModel(request.model),
          'X-WatchLLM-Tokens-Saved': cachedResponse.tokens.total.toString(),
        },
      });
    }

    // Semantic cache (vector similarity) attempt
    const textForEmbedding = flattenCompletionText(request.prompt);
    const textEmbedding = await embedText(provider, textForEmbedding);
    if (textEmbedding) {
      const semanticHit = await semanticCache.findSimilar<CompletionResponse>(
        'completion',
        textEmbedding,
        semanticThreshold
      );
      if (semanticHit) {
        const latency = Date.now() - startTime;

        await supabase.logUsage({
          project_id: project.id,
          api_key_id: keyRecord.id,
          model: semanticHit.entry.model,
          provider: getProviderForModel(request.model),
          tokens_input: semanticHit.entry.tokens.input,
          tokens_output: semanticHit.entry.tokens.output,
          tokens_total: semanticHit.entry.tokens.total,
          cost_usd: 0,
          potential_cost_usd: calculateCost(
            semanticHit.entry.model,
            semanticHit.entry.tokens.input,
            semanticHit.entry.tokens.output
          ),
          cached: true,
          latency_ms: latency,
        });

        return new Response(JSON.stringify(semanticHit.entry.data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-WatchLLM-Cache': 'HIT-SEMANTIC',
            'X-WatchLLM-Cache-Similarity': semanticHit.similarity.toFixed(4),
            'X-WatchLLM-Cache-Age': Math.floor((Date.now() - semanticHit.entry.timestamp) / 1000).toString(),
            'X-WatchLLM-Latency-Ms': latency.toString(),
            'X-WatchLLM-Provider': getProviderForModel(request.model),
            'X-WatchLLM-Tokens-Saved': semanticHit.entry.tokens.total.toString(),
          },
        });
      }
    }

    // =========================================================================
    // REQUEST DEDUPLICATION / COALESCING
    // Prevent duplicate API calls when identical requests arrive simultaneously
    // =========================================================================
    const dedup = createDeduplicationManager(redis, project.id);
    const requestId = c.get('requestId') || crypto.randomUUID();
    const requestHash = await hashRequest(
      project.id,
      request.model,
      textForEmbedding,
      request.temperature
    );

    const { isLeader, existingRequestId } = await dedup.tryAcquireLeadership(
      requestHash,
      requestId,
      false
    );

    // If not the leader, wait for the leader's response
    if (!isLeader) {
      console.log(`[Dedup] Completion request ${requestId} waiting for leader ${existingRequestId}`);
      
      const coalescedResponse = await dedup.waitForResponse<CompletionResponse>(
        requestHash,
        requestId
      );

      if (coalescedResponse) {
        const latency = Date.now() - startTime;

        await supabase.logUsage({
          project_id: project.id,
          api_key_id: keyRecord.id,
          model: coalescedResponse.model,
          provider: getProviderForModel(request.model),
          tokens_input: coalescedResponse.usage.prompt_tokens,
          tokens_output: coalescedResponse.usage.completion_tokens,
          tokens_total: coalescedResponse.usage.total_tokens,
          cost_usd: 0,
          potential_cost_usd: calculateCost(
            coalescedResponse.model,
            coalescedResponse.usage.prompt_tokens,
            coalescedResponse.usage.completion_tokens
          ),
          cached: true,
          latency_ms: latency,
        });

        return new Response(JSON.stringify(coalescedResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-WatchLLM-Cache': 'HIT-COALESCED',
            'X-WatchLLM-Latency-Ms': latency.toString(),
            'X-WatchLLM-Provider': getProviderForModel(request.model),
            'X-WatchLLM-Tokens-Saved': coalescedResponse.usage.total_tokens.toString(),
          },
        });
      }

      // Leader failed - become new leader
      await dedup.tryAcquireLeadership(requestHash, requestId, false);
    }

    // Make request to provider
    try {
      const response = await provider.completion(request, project.id);
      const latency = Date.now() - startTime;

      // Calculate cost
      const cost = calculateCost(
        response.model,
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );

      // Cache the response
      await cache.setCompletion(request, response);

      // Store semantic entry if embedding is available
      if (textEmbedding) {
        const entry: SemanticCacheEntry<CompletionResponse> = {
          embedding: textEmbedding,
          data: response,
          model: response.model,
          timestamp: Date.now(),
          tokens: {
            input: response.usage.prompt_tokens,
            output: response.usage.completion_tokens,
            total: response.usage.total_tokens,
          },
          text: textForEmbedding,
        };
        await semanticCache.put('completion', entry, '/v1/completions');
      }

      // Store response for coalesced requests
      await dedup.storeResponse(requestHash, response);

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
        potential_cost_usd: cost,
        cached: false,
        latency_ms: latency,
      });

      await maybeSendUsageAlert(env, supabase, redis, project);

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-WatchLLM-Cache': 'MISS',
          'X-WatchLLM-Latency-Ms': latency.toString(),
          'X-WatchLLM-Cost-USD': cost.toFixed(6),
          'X-WatchLLM-Provider': getProviderForModel(request.model),
        },
      });
    } catch (apiError) {
      await dedup.releaseLeadership(requestHash);
      throw apiError;
    }
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
