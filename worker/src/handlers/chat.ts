/**
 * Chat Completions Handler
 * POST /v1/chat/completions
 */

import type { Context } from 'hono';
import type {
  Env,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ValidatedAPIKey,
  APIError,
} from '../types';

// Define app context type
type AppContext = Context<{ Bindings: Env; Variables: { validatedKey: ValidatedAPIKey; requestId: string } }>;
import { calculateCost, PLAN_LIMITS } from '../types';
import { createRedisClient } from '../lib/redis';
import { createMongoDBClient } from '../lib/mongodb';
import { createSupabaseClient } from '../lib/supabase';
import { createCacheManager } from '../lib/cache';
import { getSharedProviderClient, getProviderForModel } from '../lib/providers';
import { maybeSendUsageAlert } from '../lib/notifications';
import {
  SemanticCache,
  SemanticCacheEntry,
  embedText,
  flattenChatText,
} from '../lib/semanticCache';

/**
 * Validate request body
 */
function validateRequest(body: unknown): ChatCompletionRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const request = body as Record<string, unknown>;

  if (!request.model || typeof request.model !== 'string') {
    throw new Error('model is required and must be a string');
  }

  if (!request.messages || !Array.isArray(request.messages)) {
    throw new Error('messages is required and must be an array');
  }

  if (request.messages.length === 0) {
    throw new Error('messages array cannot be empty');
  }

  // Validate each message
  for (const message of request.messages) {
    if (!message.role || typeof message.role !== 'string') {
      throw new Error('Each message must have a role');
    }
    if (!['system', 'user', 'assistant', 'function', 'tool'].includes(message.role)) {
      throw new Error(`Invalid message role: ${message.role}`);
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

  return request as unknown as ChatCompletionRequest;
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
 * Handle chat completions request
 */
export async function handleChatCompletions(
  c: AppContext,
  validatedKey: ValidatedAPIKey
): Promise<Response> {
  const startTime = Date.now();
  const env = c.env;
  const { keyRecord, project } = validatedKey;

  // Initialize clients
  const redis = createRedisClient(env);
  const mongodb = createMongoDBClient(env);
  const supabase = createSupabaseClient(env);
  const cache = createCacheManager(redis);
  const provider = getSharedProviderClient(env);
  const semanticCache = new SemanticCache(mongodb, project.id);
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

    // Handle streaming requests
    if (request.stream) {
      return handleStreamingRequest(c, request, validatedKey, provider, supabase, startTime);
    }

    // Check deterministic cache first
    const cachedResponse = await cache.getChatCompletion(request);
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
        cost_usd: 0, // No cost for cached responses
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

    // Semantic cache (vector similarity) attempt
    const textForEmbedding = flattenChatText(request.messages);
    const textEmbedding = await embedText(provider, textForEmbedding);
    if (textEmbedding) {
      const semanticHit = await semanticCache.findSimilar<ChatCompletionResponse>(
        'chat',
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
          cached: true,
          latency_ms: latency,
        });

        return new Response(JSON.stringify(semanticHit.entry.data), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT-SEM',
            'X-Cache-Similarity': semanticHit.similarity.toFixed(4),
            'X-Cache-Age': Math.floor((Date.now() - semanticHit.entry.timestamp) / 1000).toString(),
            'X-Latency-Ms': latency.toString(),
          },
        });
      }
    }

    // Make request to provider
    const response = await provider.chatCompletion(request);
    const latency = Date.now() - startTime;

    // Calculate cost
    const cost = calculateCost(
      response.model,
      response.usage.prompt_tokens,
      response.usage.completion_tokens
    );

    // Cache the response
    await cache.setChatCompletion(request, response);

    // Store semantic entry if embedding is available
    if (textEmbedding) {
      const entry: SemanticCacheEntry<ChatCompletionResponse> = {
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
      await semanticCache.put('chat', entry);
    }

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
    console.error('Chat completion error:', errorMessage);

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('required')) {
      status = 400;
    } else if (errorMessage.includes('API key not configured')) {
      status = 503;
    }

    return errorResponse(
      errorMessage, // Unmasked for debugging
      status
    );
  }
}

/**
 * Handle streaming chat completion request
 */
async function handleStreamingRequest(
  c: AppContext,
  request: ChatCompletionRequest,
  validatedKey: ValidatedAPIKey,
  providerClient: ReturnType<typeof getSharedProviderClient>,
  supabase: ReturnType<typeof createSupabaseClient>,
  startTime: number
): Promise<Response> {
  const { keyRecord, project } = validatedKey;

  try {
    const stream = await providerClient.streamChatCompletion(request);
    const latency = Date.now() - startTime;

    // Log usage (estimated for streaming)
    // Note: Actual token count isn't available until stream completes
    await supabase.logUsage({
      project_id: project.id,
      api_key_id: keyRecord.id,
      model: request.model,
      provider: getProviderForModel(request.model),
      tokens_input: 0, // Will be updated if we track stream
      tokens_output: 0,
      tokens_total: 0,
      cost_usd: 0,
      cached: false,
      latency_ms: latency,
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Latency-Ms': latency.toString(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Streaming error';
    console.error('Streaming error:', errorMessage);
    return errorResponse('Failed to stream response', 500);
  }
}
