/**
 * Rate Limiting and Quota Enforcement
 * 
 * Implements Redis-based rate limiting with sliding window algorithm
 * and monthly quota enforcement based on user plan tiers.
 */

import type { Env, ProjectRecord } from '../types';
import { createRedisClient } from './redis';

/**
 * Plan limits matching dashboard/lib/utils.ts
 */
export const PLAN_LIMITS = {
  free: {
    requestsPerMonth: 10_000,
    requestsPerMinute: 10,
  },
  starter: {
    requestsPerMonth: 100_000,
    requestsPerMinute: 50,
  },
  pro: {
    requestsPerMonth: 250_000,
    requestsPerMinute: 10_000, // Effectively unlimited
  },
} as const;

export type Plan = keyof typeof PLAN_LIMITS;

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds to wait before retry
}

/**
 * Quota check result
 */
export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp for next month
}

/**
 * Check rate limit using sliding window algorithm
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 * @param plan - User's subscription plan
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  env: Env,
  projectId: string,
  plan: Plan = 'free'
): Promise<RateLimitResult> {
  const redis = createRedisClient(env);
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const limit = PLAN_LIMITS[plan].requestsPerMinute;

  // Redis key for rate limiting
  const key = `ratelimit:${projectId}:${Math.floor(now / windowMs)}`;

  try {
    // Increment counter
    const count = await redis.incr(key);
    
    if (!count) {
      // Redis unavailable - allow request but log warning
      console.warn(`[RateLimit] Redis unavailable for project ${projectId}, allowing request`);
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetAt: Math.floor((now + windowMs) / 1000),
      };
    }

    // Set expiration on first request of window
    if (count === 1) {
      await redis.expire(key, 60); // Expire after 60 seconds
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetAt = Math.floor((Math.floor(now / windowMs) + 1) * windowMs / 1000);

    return {
      allowed,
      limit,
      remaining,
      resetAt,
      retryAfter: allowed ? undefined : Math.ceil((resetAt * 1000 - now) / 1000),
    };
  } catch (error) {
    console.error(`[RateLimit] Error checking rate limit:`, error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt: Math.floor((now + windowMs) / 1000),
    };
  }
}

/**
 * Check monthly quota
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 * @param plan - User's subscription plan
 * @returns Quota check result
 */
export async function checkQuota(
  env: Env,
  projectId: string,
  plan: Plan = 'free'
): Promise<QuotaResult> {
  const redis = createRedisClient(env);
  const now = new Date();
  const limit = PLAN_LIMITS[plan].requestsPerMonth;

  // Get start of current month (UTC)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  
  const monthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
  const key = `quota:${projectId}:${monthKey}`;

  try {
    // Get current usage
    const usage = await redis.get(key);
    const used = usage ? parseInt(usage as string, 10) : 0;

    const allowed = used < limit;
    const remaining = Math.max(0, limit - used);
    const resetAt = Math.floor(monthEnd.getTime() / 1000);

    return {
      allowed,
      used,
      limit,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error(`[Quota] Error checking quota:`, error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      used: 0,
      limit,
      remaining: limit,
      resetAt: Math.floor(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).getTime() / 1000),
    };
  }
}

/**
 * Increment usage counters
 * 
 * Increments both rate limit and quota counters atomically
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 */
export async function incrementUsage(
  env: Env,
  projectId: string
): Promise<void> {
  const redis = createRedisClient(env);
  const now = new Date();

  // Monthly quota key
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const monthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
  const quotaKey = `quota:${projectId}:${monthKey}`;

  try {
    // Increment monthly quota
    const count = await redis.incr(quotaKey);
    
    // Set expiration on first request of month (expire at end of next month for safety)
    if (count === 1) {
      const ttl = Math.floor((monthEnd.getTime() - Date.now()) / 1000) + (30 * 24 * 60 * 60);
      await redis.expire(quotaKey, ttl);
    }

    // Note: Rate limit counter is already incremented in checkRateLimit()
  } catch (error) {
    console.error(`[Usage] Error incrementing usage:`, error);
    // Continue processing even if Redis fails
  }
}

/**
 * Get detailed usage stats for a project
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 * @param plan - User's subscription plan
 * @returns Usage statistics
 */
export async function getUsageStats(
  env: Env,
  projectId: string,
  plan: Plan = 'free'
): Promise<{
  rateLimit: RateLimitResult;
  quota: QuotaResult;
}> {
  const [rateLimit, quota] = await Promise.all([
    checkRateLimit(env, projectId, plan),
    checkQuota(env, projectId, plan),
  ]);

  return { rateLimit, quota };
}

/**
 * Reset usage for a project (admin/testing only)
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 */
export async function resetUsage(
  env: Env,
  projectId: string
): Promise<void> {
  const redis = createRedisClient(env);
  const now = new Date();

  // Delete rate limit keys (last 5 minutes worth)
  const windowMs = 60 * 1000;
  const currentWindow = Math.floor(Date.now() / windowMs);
  
  for (let i = 0; i < 5; i++) {
    const key = `ratelimit:${projectId}:${currentWindow - i}`;
    await redis.del(key);
  }

  // Delete quota key
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
  const quotaKey = `quota:${projectId}:${monthKey}`;
  await redis.del(quotaKey);
}

/**
 * Set usage for testing (admin only)
 * 
 * @param env - Cloudflare Worker environment
 * @param projectId - Project identifier
 * @param usage - Usage count to set
 */
export async function setUsageForTesting(
  env: Env,
  projectId: string,
  usage: number
): Promise<void> {
  const redis = createRedisClient(env);
  const now = new Date();
  
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthKey = `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`;
  const quotaKey = `quota:${projectId}:${monthKey}`;

  await redis.set(quotaKey, usage.toString());
}
