/**
 * Cache Management Handlers
 * 
 * Provides endpoints for:
 * - Cache invalidation (manual/programmatic)
 * - Cache statistics and age analytics
 * - Webhook support for cache invalidation
 */

import { Hono } from 'hono';
import type { Env, ValidatedAPIKey } from '../types';
import { createD1Client } from '../lib/d1';
import { SemanticCache, SemanticCacheOptions } from '../lib/semanticCache';
import { createSupabaseClient } from '../lib/supabase';

// Create cache management router
const cacheManagementApp = new Hono<{ 
  Bindings: Env; 
  Variables: { validatedKey: ValidatedAPIKey; requestId: string } 
}>();

/**
 * POST /v1/cache/invalidate
 * 
 * Invalidate cache entries based on filters
 * 
 * Request body:
 * {
 *   model?: string,        // Filter by model name
 *   kind?: 'chat' | 'completion',  // Filter by request type
 *   before?: string,       // ISO date string - invalidate entries before this date
 *   after?: string,        // ISO date string - invalidate entries after this date
 *   all?: boolean          // Invalidate all entries (requires confirmation)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   entries_invalidated: number,
 *   message: string
 * }
 */
cacheManagementApp.post('/v1/cache/invalidate', async (c) => {
  const validatedKey = c.get('validatedKey');
  if (!validatedKey) {
    return c.json({ 
      error: { message: 'Unauthorized', code: 'unauthorized' } 
    }, 401);
  }

  const { project } = validatedKey;
  const d1 = createD1Client(c.env.DB);
  
  if (!d1) {
    return c.json({ 
      error: { message: 'Cache not available', code: 'cache_unavailable' } 
    }, 503);
  }

  try {
    const body = await c.req.json();
    const { model, kind, before, after, all } = body;

    // Require at least one filter unless 'all' is explicitly set
    if (!model && !kind && !before && !after && !all) {
      return c.json({
        error: {
          message: 'At least one filter (model, kind, before, after) or "all: true" is required',
          code: 'invalid_request'
        }
      }, 400);
    }

    // Safety check for "all" invalidation
    if (all === true && (model || kind || before || after)) {
      return c.json({
        error: {
          message: 'When using "all: true", no other filters should be provided',
          code: 'invalid_request'
        }
      }, 400);
    }

    // Build filter object
    const filters: {
      model?: string;
      kind?: string;
      beforeTimestamp?: number;
      afterTimestamp?: number;
    } = {};

    if (model) filters.model = model;
    if (kind) filters.kind = kind;
    if (before) filters.beforeTimestamp = new Date(before).getTime();
    if (after) filters.afterTimestamp = new Date(after).getTime();

    // Perform invalidation
    const invalidatedCount = await d1.invalidateEntries(project.id, filters);

    // Log invalidation to Supabase for analytics
    const supabase = createSupabaseClient(c.env);
    try {
      await supabase.client.from('cache_invalidations').insert({
        project_id: project.id,
        user_id: project.user_id,
        invalidation_type: 'api',
        entries_invalidated: invalidatedCount,
        filters: body,
      });
    } catch (logError) {
      console.error('Failed to log cache invalidation:', logError);
      // Don't fail the request just because logging failed
    }

    return c.json({
      success: true,
      entries_invalidated: invalidatedCount,
      message: invalidatedCount > 0 
        ? `Successfully invalidated ${invalidatedCount} cache entries`
        : 'No matching cache entries found'
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return c.json({
      error: {
        message: 'Failed to invalidate cache',
        code: 'internal_error'
      }
    }, 500);
  }
});

/**
 * GET /v1/cache/stats
 * 
 * Get cache statistics and age distribution
 * 
 * Response:
 * {
 *   total_entries: number,
 *   age_distribution: {
 *     under_1h: number,
 *     1h_to_6h: number,
 *     6h_to_24h: number,
 *     1d_to_7d: number,
 *     7d_to_30d: number,
 *     over_30d: number
 *   },
 *   average_age_hours: number,
 *   expired_count: number,
 *   ttl_config: {
 *     default_ttl_seconds: number | null,
 *     endpoint_overrides: Record<string, number | null>
 *   }
 * }
 */
cacheManagementApp.get('/v1/cache/stats', async (c) => {
  const validatedKey = c.get('validatedKey');
  if (!validatedKey) {
    return c.json({ 
      error: { message: 'Unauthorized', code: 'unauthorized' } 
    }, 401);
  }

  const { project } = validatedKey;
  const d1 = createD1Client(c.env.DB);
  
  if (!d1) {
    return c.json({ 
      error: { message: 'Cache not available', code: 'cache_unavailable' } 
    }, 503);
  }

  try {
    const stats = await d1.getCacheAgeStats(project.id);

    return c.json({
      total_entries: stats.total,
      age_distribution: {
        under_1h: stats.under1h,
        '1h_to_6h': stats.oneToSixH,
        '6h_to_24h': stats.sixTo24H,
        '1d_to_7d': stats.oneTo7D,
        '7d_to_30d': stats.sevenTo30D,
        over_30d: stats.over30D
      },
      average_age_hours: Math.round(stats.avgAgeHours * 100) / 100,
      expired_count: stats.expiredCount,
      ttl_config: {
        default_ttl_seconds: project.cache_ttl_seconds ?? 86400,
        endpoint_overrides: project.cache_ttl_overrides ?? {}
      }
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    return c.json({
      error: {
        message: 'Failed to get cache statistics',
        code: 'internal_error'
      }
    }, 500);
  }
});

/**
 * POST /v1/cache/cleanup
 * 
 * Manually trigger cleanup of expired cache entries
 * 
 * Response:
 * {
 *   success: true,
 *   expired_entries_removed: number,
 *   message: string
 * }
 */
cacheManagementApp.post('/v1/cache/cleanup', async (c) => {
  const validatedKey = c.get('validatedKey');
  if (!validatedKey) {
    return c.json({ 
      error: { message: 'Unauthorized', code: 'unauthorized' } 
    }, 401);
  }

  const d1 = createD1Client(c.env.DB);
  
  if (!d1) {
    return c.json({ 
      error: { message: 'Cache not available', code: 'cache_unavailable' } 
    }, 503);
  }

  try {
    const expiredRemoved = await d1.cleanupExpired();

    return c.json({
      success: true,
      expired_entries_removed: expiredRemoved,
      message: expiredRemoved > 0
        ? `Successfully removed ${expiredRemoved} expired cache entries`
        : 'No expired cache entries to remove'
    });
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return c.json({
      error: {
        message: 'Failed to cleanup cache',
        code: 'internal_error'
      }
    }, 500);
  }
});

/**
 * Webhook endpoint for external cache invalidation
 * 
 * POST /v1/cache/webhook
 * 
 * Headers:
 * - X-Webhook-Secret: <webhook_secret>
 * 
 * Request body: Same as /v1/cache/invalidate
 */
cacheManagementApp.post('/v1/cache/webhook', async (c) => {
  const validatedKey = c.get('validatedKey');
  if (!validatedKey) {
    return c.json({ 
      error: { message: 'Unauthorized', code: 'unauthorized' } 
    }, 401);
  }

  const { project } = validatedKey;
  const d1 = createD1Client(c.env.DB);
  
  if (!d1) {
    return c.json({ 
      error: { message: 'Cache not available', code: 'cache_unavailable' } 
    }, 503);
  }

  try {
    const body = await c.req.json();
    const { model, kind, before, after, all } = body;

    // Build filter object
    const filters: {
      model?: string;
      kind?: string;
      beforeTimestamp?: number;
      afterTimestamp?: number;
    } = {};

    if (model) filters.model = model;
    if (kind) filters.kind = kind;
    if (before) filters.beforeTimestamp = new Date(before).getTime();
    if (after) filters.afterTimestamp = new Date(after).getTime();

    // Perform invalidation
    const invalidatedCount = await d1.invalidateEntries(project.id, filters);

    // Log webhook invalidation
    const supabase = createSupabaseClient(c.env);
    try {
      await supabase.client.from('cache_invalidations').insert({
        project_id: project.id,
        user_id: project.user_id,
        invalidation_type: 'webhook',
        entries_invalidated: invalidatedCount,
        filters: body,
      });
    } catch (logError) {
      console.error('Failed to log webhook invalidation:', logError);
    }

    return c.json({
      success: true,
      entries_invalidated: invalidatedCount,
      message: `Webhook processed: ${invalidatedCount} entries invalidated`
    });
  } catch (error) {
    console.error('Webhook cache invalidation error:', error);
    return c.json({
      error: {
        message: 'Failed to process webhook',
        code: 'internal_error'
      }
    }, 500);
  }
});

export default cacheManagementApp;
