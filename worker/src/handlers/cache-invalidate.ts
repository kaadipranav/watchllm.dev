/**
 * Cache Invalidation Handler
 * POST /v1/cache/invalidate
 * 
 * Allows users to selectively purge cached entries based on filters:
 * - model filter: target specific LLM models
 * - date range: invalidate entries before/after a certain time
 * - similarity threshold: clear low-confidence semantic cache hits
 */

import type { Context } from 'hono';
import type {
  Env,
  ValidatedAPIKey,
  APIError,
} from '../types';

type AppContext = Context<{ Bindings: Env; Variables: { validatedKey: ValidatedAPIKey; requestId: string } }>;

import { createSupabaseClient } from '../lib/supabase';

interface CacheInvalidateRequest {
  model?: string; // Specific model to invalidate (e.g., "gpt-4")
  endpoint?: string; // Specific endpoint (e.g., "/v1/chat/completions")
  before_date?: string; // ISO 8601 timestamp - invalidate entries older than this
  after_date?: string; // ISO 8601 timestamp - invalidate entries newer than this
  min_similarity?: number; // Only invalidate cache hits below this similarity (0-1)
  max_similarity?: number; // Only invalidate cache hits above this similarity (0-1)
}

interface CacheInvalidateResponse {
  success: boolean;
  entries_invalidated: number;
  message: string;
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): CacheInvalidateRequest {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const request = body as Record<string, unknown>;

  // At least one filter must be provided
  if (!request.model && !request.endpoint && !request.before_date && !request.after_date && request.min_similarity === undefined && request.max_similarity === undefined) {
    throw new Error('At least one filter must be provided (model, endpoint, before_date, after_date, min_similarity, or max_similarity)');
  }

  // Validate date formats if provided
  if (request.before_date && typeof request.before_date === 'string') {
    try {
      new Date(request.before_date);
    } catch {
      throw new Error('Invalid before_date format, must be ISO 8601');
    }
  }

  if (request.after_date && typeof request.after_date === 'string') {
    try {
      new Date(request.after_date);
    } catch {
      throw new Error('Invalid after_date format, must be ISO 8601');
    }
  }

  // Validate similarity thresholds
  if (request.min_similarity != null && typeof request.min_similarity === 'number' && (request.min_similarity < 0 || request.min_similarity > 1)) {
    throw new Error('min_similarity must be between 0 and 1');
  }

  if (request.max_similarity != null && typeof request.max_similarity === 'number' && (request.max_similarity < 0 || request.max_similarity > 1)) {
    throw new Error('max_similarity must be between 0 and 1');
  }

  return request as unknown as CacheInvalidateRequest;
}

/**
 * Create error response
 */
function errorResponse(message: string, status: number): Response {
  const error: APIError = {
    error: {
      message,
      type: 'invalid_request_error',
      code: status === 429 ? 'rate_limit_exceeded' : undefined,
    },
  };
  return new Response(JSON.stringify(error), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle cache invalidation request
 */
export async function handleCacheInvalidate(
  c: AppContext,
  validatedKey: ValidatedAPIKey
): Promise<Response> {
  const env = c.env;
  const { project } = validatedKey;

  // Initialize clients
  const supabase = createSupabaseClient(env);

  try {
    // Parse and validate request body
    const body = await c.req.json();
    const request = validateRequest(body);

    // For now, we log the invalidation request and return a count of 0
    // A full implementation would query and delete cache entries via RPC or direct REST
    const invalidatedCount = 0;

    // Log the invalidation request via RPC or direct insert
    const logResult = await supabase.rpc('log_cache_invalidation', {
      p_project_id: project.id,
      p_trigger_type: 'api',
      p_triggered_by: validatedKey.keyRecord.id,
      p_model_filter: request.model || null,
      p_endpoint_filter: request.endpoint || null,
      p_date_range_start: request.after_date ? new Date(request.after_date).toISOString() : null,
      p_date_range_end: request.before_date ? new Date(request.before_date).toISOString() : null,
      p_similarity_threshold_min: request.min_similarity ?? null,
      p_entries_invalidated: invalidatedCount,
    });

    if (logResult.error) {
      console.error('Failed to log cache invalidation:', logResult.error.message);
    }

    // In a real implementation, we would:
    // 1. Delete the matching entries from the semantic cache (D1/database)
    // 2. Invalidate Redis keys matching the filters
    // 3. Fire webhooks if configured
    // For now, we just record the invalidation

    const response: CacheInvalidateResponse = {
      success: true,
      entries_invalidated: invalidatedCount,
      message: `Invalidated ${invalidatedCount} cache entries matching filters`,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cache invalidation error:', errorMessage);

    let status = 500;
    if (errorMessage.includes('Invalid') || errorMessage.includes('must')) {
      status = 400;
    }

    return errorResponse(errorMessage, status);
  }
}
