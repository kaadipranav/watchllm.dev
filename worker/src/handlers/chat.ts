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
import { createD1Client } from '../lib/d1';
import { createSupabaseClient } from '../lib/supabase';
import { createCacheManager } from '../lib/cache';
import { getSharedProviderClient, getProviderForModel } from '../lib/providers';
import { maybeSendUsageAlert } from '../lib/notifications';
import {
  SemanticCache,
  SemanticCacheEntry,
  embedText,
  flattenChatText,
  normalizePrompt,
  calculateContextHash
} from '../lib/semanticCache';
import { 
  createDeduplicationManager, 
  hashRequest,
  type DeduplicationManager 
} from '../lib/deduplication';

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
  const d1 = createD1Client(env.DB);
  const supabase = createSupabaseClient(env);
  const cache = createCacheManager(redis);
  const provider = getSharedProviderClient(env);
  
  // Initialize semantic cache with TTL options from project settings
  const semanticCache = new SemanticCache(d1, project.id, 50, {
    ttlSeconds: project.cache_ttl_seconds ?? 86400, // Default 24 hours
    endpointTTLOverrides: project.cache_ttl_overrides ?? {},
  });

  // Use project-level semantic cache threshold (with env fallback)
  const semanticThreshold = project.semantic_cache_threshold ||
    (typeof env.SEMANTIC_CACHE_THRESHOLD === 'string'
      ? Math.min(Math.max(Number(env.SEMANTIC_CACHE_THRESHOLD), 0.5), 0.99)
      : 0.85);

  try {
    // Parse and validate request body
    const body = await c.req.json();
    let request = validateRequest(body);

    // A/B Testing: Select model variant if enabled
    if (project.ab_testing_enabled && project.ab_testing_config) {
      const { selectABTestVariant } = await import('../lib/abTesting');
      const selectedModel = selectABTestVariant(project.ab_testing_config, request.model);
      if (selectedModel !== request.model) {
        console.log(`A/B Test: Switching from ${request.model} to ${selectedModel}`);
        request = { ...request, model: selectedModel };
      }
    }

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

    // Handle streaming requests
    if (request.stream) {
      const { stream, isFreeModel } = await provider.streamChatCompletion(request, project.id);
      const latency = Date.now() - startTime;

      // Log usage (estimated for streaming)
      const logProvider = getProviderForModel(request.model);
      await supabase.logUsage({
        project_id: project.id,
        api_key_id: keyRecord.id,
        model: request.model,
        provider: logProvider,
        tokens_input: 0,
        tokens_output: 0,
        tokens_total: 0,
        cost_usd: 0,
        potential_cost_usd: 0,
        cached: false,
        latency_ms: latency,
      });

      const headers: Record<string, string> = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-WatchLLM-Latency-Ms': latency.toString(),
      };

      if (isFreeModel) {
        headers['X-WatchLLM-Fallback-Notice'] = 'Using shared Free model infrastructure. Bring your own key for paid models.';
      }

      return new Response(stream, {
        status: 200,
        headers,
      });
    }

    // Check deterministic cache first
    const cachedResponse = await cache.getChatCompletion(request);
    if (cachedResponse) {
      const latency = Date.now() - startTime;

      // Log usage (cached)
      const logProvider = getProviderForModel(request.model);
      await supabase.logUsage({
        project_id: project.id,
        api_key_id: keyRecord.id,
        model: cachedResponse.model,
        provider: logProvider,
        tokens_input: cachedResponse.tokens.input,
        tokens_output: cachedResponse.tokens.output,
        tokens_total: cachedResponse.tokens.total,
        cost_usd: 0, // No cost for cached responses
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
    const textForEmbedding = flattenChatText(request.messages);
    console.log(`Attempting to embed text: "${textForEmbedding.substring(0, 50)}..."`);
    const textEmbedding = await embedText(provider, textForEmbedding);
    console.log(`Embedding result: ${textEmbedding ? `success (${textEmbedding.length} dims)` : 'failed'}`);

    // Calculate context hash for strict matching of tools/format
    const contextHash = await calculateContextHash(request);
    const cacheKeyModel = `${request.model}:${contextHash}`;
    console.log(`[Semantic Cache] Key: ${cacheKeyModel}`);

    if (textEmbedding) {
      const semanticHit = await semanticCache.findSimilar<ChatCompletionResponse>(
        'chat',
        textEmbedding,
        semanticThreshold,
        cacheKeyModel // Filter by model+context
      );
      if (semanticHit) {
        console.log(`Semantic cache HIT! Similarity: ${semanticHit.similarity.toFixed(4)}, Threshold: ${semanticThreshold}`);
        const latency = Date.now() - startTime;

        const logProvider = getProviderForModel(request.model);
        await supabase.logUsage({
          project_id: project.id,
          api_key_id: keyRecord.id,
          model: semanticHit.entry.model.split(':')[0], // Log original model name
          provider: logProvider,
          tokens_input: semanticHit.entry.tokens.input,
          tokens_output: semanticHit.entry.tokens.output,
          tokens_total: semanticHit.entry.tokens.total,
          cost_usd: 0,
          potential_cost_usd: calculateCost(
            semanticHit.entry.model.split(':')[0],
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
      request.temperature,
      request.seed
    );

    const { isLeader, existingRequestId } = await dedup.tryAcquireLeadership(
      requestHash,
      requestId,
      false // not streaming
    );

    // If not the leader, wait for the leader's response
    if (!isLeader) {
      console.log(`[Dedup] Request ${requestId} waiting for leader ${existingRequestId}`);
      
      const coalescedResponse = await dedup.waitForResponse<ChatCompletionResponse>(
        requestHash,
        requestId
      );

      if (coalescedResponse) {
        const latency = Date.now() - startTime;
        console.log(`[Dedup] Request ${requestId} received coalesced response`);

        // Log as cached (coalesced)
        const logProvider = getProviderForModel(request.model);
        await supabase.logUsage({
          project_id: project.id,
          api_key_id: keyRecord.id,
          model: coalescedResponse.model,
          provider: logProvider,
          tokens_input: coalescedResponse.usage.prompt_tokens,
          tokens_output: coalescedResponse.usage.completion_tokens,
          tokens_total: coalescedResponse.usage.total_tokens,
          cost_usd: 0, // No cost for coalesced responses
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

      // Leader failed or timed out - this request becomes the new leader
      console.log(`[Dedup] Request ${requestId} taking over as leader (previous failed)`);
      await dedup.tryAcquireLeadership(requestHash, requestId, false);
    }

    console.log(`[Dedup] Request ${requestId} is the leader, proceeding with API call`);

    // MOCK MODE FOR TESTING
    let response: ChatCompletionResponse & { _isFreeModel?: boolean };

    try {
      if (request.model.startsWith('test/mock-model')) {
         // Mock Provider for Testing
         await new Promise(resolve => setTimeout(resolve, 200)); // Simulate latency
         response = {
           id: 'chatcmpl-mock-' + Date.now(),
           object: 'chat.completion',
           created: Math.floor(Date.now() / 1000),
           model: request.model,
           choices: [
             {
               index: 0,
               message: {
                 role: 'assistant',
                 content: `Mock response for: ${flattenChatText(request.messages).substring(0, 30)}...`,
               },
               finish_reason: 'stop',
             },
         ],
         usage: {
           prompt_tokens: 10,
           completion_tokens: 5,
           total_tokens: 15,
         },
         _isFreeModel: true,
       };
    } else {
       response = await provider.chatCompletion(request, project.id);
    }

    const latency = Date.now() - startTime;
    const { _isFreeModel, ...cleanResponse } = response;

    // Calculate cost
    const cost = calculateCost(
      cleanResponse.model,
      cleanResponse.usage.prompt_tokens,
      cleanResponse.usage.completion_tokens
    );

    // Cache the response
    await cache.setChatCompletion(request, cleanResponse);

    // Store semantic entry if embedding is available
    if (textEmbedding) {
      console.log(`Saving semantic cache entry for: "${textForEmbedding.substring(0, 50)}..."`);
      const entry: SemanticCacheEntry<ChatCompletionResponse> = {
        embedding: textEmbedding,
        data: cleanResponse,
        model: cacheKeyModel, // Store model:hash
        timestamp: Date.now(),
        tokens: {
          input: cleanResponse.usage.prompt_tokens,
          output: cleanResponse.usage.completion_tokens,
          total: cleanResponse.usage.total_tokens,
        },
        text: textForEmbedding,
      };
      await semanticCache.put('chat', entry, '/v1/chat/completions');
      console.log('Semantic cache entry saved to D1');
    }

    // Store response for coalesced requests (deduplication)
    await dedup.storeResponse(requestHash, cleanResponse);

    // Log usage
    const logProvider = getProviderForModel(request.model);
    await supabase.logUsage({
      project_id: project.id,
      api_key_id: keyRecord.id,
      model: cleanResponse.model,
      provider: logProvider,
      tokens_input: cleanResponse.usage.prompt_tokens,
      tokens_output: cleanResponse.usage.completion_tokens,
      tokens_total: cleanResponse.usage.total_tokens,
      cost_usd: cost,
      potential_cost_usd: cost, // Same as actual cost for non-cached
      cached: false,
      latency_ms: latency,
    });

    await maybeSendUsageAlert(env, supabase, redis, project);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-WatchLLM-Cache': 'MISS',
      'X-WatchLLM-Latency-Ms': latency.toString(),
      'X-WatchLLM-Cost-USD': cost.toFixed(6),
      'X-WatchLLM-Provider': getProviderForModel(request.model),
    };

    if (_isFreeModel) {
      headers['X-WatchLLM-Fallback-Notice'] = 'Using shared Free model infrastructure. Bring your own key for paid models.';
    }

    return new Response(JSON.stringify(cleanResponse), {
      status: 200,
      headers,
    });
    } catch (apiError) {
      // Release leadership if API call fails
      await dedup.releaseLeadership(requestHash);
      throw apiError;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat completion error:', errorMessage);

    // Determine appropriate status code
    let status = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('required') || errorMessage.includes('BYOK Required')) {
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
