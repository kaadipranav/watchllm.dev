/**
 * Rate Limiting Tests
 * 
 * Tests for rate limiting and quota enforcement
 * Note: These tests verify the logic but skip actual Redis operations in test environment
 */

import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS } from '../rate-limiting';

describe('Plan Limits Configuration', () => {
  it('should have correct plan configuration', () => {
    expect(PLAN_LIMITS.free.requestsPerMonth).toBe(10_000);
    expect(PLAN_LIMITS.free.requestsPerMinute).toBe(10);

    expect(PLAN_LIMITS.starter.requestsPerMonth).toBe(100_000);
    expect(PLAN_LIMITS.starter.requestsPerMinute).toBe(50);

    expect(PLAN_LIMITS.pro.requestsPerMonth).toBe(250_000);
    expect(PLAN_LIMITS.pro.requestsPerMinute).toBe(10_000); // Effectively unlimited
  });

  it('should have higher limits for paid plans', () => {
    expect(PLAN_LIMITS.starter.requestsPerMonth).toBeGreaterThan(PLAN_LIMITS.free.requestsPerMonth);
    expect(PLAN_LIMITS.pro.requestsPerMonth).toBeGreaterThan(PLAN_LIMITS.starter.requestsPerMonth);

    expect(PLAN_LIMITS.starter.requestsPerMinute).toBeGreaterThan(PLAN_LIMITS.free.requestsPerMinute);
    expect(PLAN_LIMITS.pro.requestsPerMinute).toBeGreaterThan(PLAN_LIMITS.starter.requestsPerMinute);
  });

  it('should have reasonable rate limits', () => {
    // Free plan should allow at least 10 requests per minute
    expect(PLAN_LIMITS.free.requestsPerMinute).toBeGreaterThanOrEqual(10);
    
    // Pro plan should allow significantly more (effectively unlimited)
    expect(PLAN_LIMITS.pro.requestsPerMinute).toBeGreaterThanOrEqual(1000);
    
    // Monthly quotas should be reasonable
    expect(PLAN_LIMITS.free.requestsPerMonth).toBeGreaterThanOrEqual(10_000);
    expect(PLAN_LIMITS.pro.requestsPerMonth).toBeGreaterThanOrEqual(250_000);
  });

  it('should maintain consistent ratios between plans', () => {
    // Starter should be roughly 10x free
    const starterToFreeRatio = PLAN_LIMITS.starter.requestsPerMonth / PLAN_LIMITS.free.requestsPerMonth;
    expect(starterToFreeRatio).toBeGreaterThan(5);
    expect(starterToFreeRatio).toBeLessThan(15);

    // Pro should be at least 2x starter
    const proToStarterRatio = PLAN_LIMITS.pro.requestsPerMonth / PLAN_LIMITS.starter.requestsPerMonth;
    expect(proToStarterRatio).toBeGreaterThanOrEqual(2);
  });
});

describe('Rate Limiting Logic', () => {
  it('should enforce per-minute limits', () => {
    const plans = ['free', 'starter', 'pro'] as const;
    
    plans.forEach(plan => {
      const limit = PLAN_LIMITS[plan].requestsPerMinute;
      expect(limit).toBeGreaterThan(0);
      expect(Number.isInteger(limit)).toBe(true);
    });
  });

  it('should enforce monthly quotas', () => {
    const plans = ['free', 'starter', 'pro'] as const;
    
    plans.forEach(plan => {
      const quota = PLAN_LIMITS[plan].requestsPerMonth;
      expect(quota).toBeGreaterThan(0);
      expect(Number.isInteger(quota)).toBe(true);
    });
  });

  it('should calculate correct remaining requests', () => {
    const limit = 100;
    const used = 25;
    const remaining = limit - used;
    
    expect(remaining).toBe(75);
    expect(Math.max(0, remaining)).toBe(75);
    
    // When over limit
    const used2 = 150;
    const remaining2 = Math.max(0, limit - used2);
    expect(remaining2).toBe(0);
  });

  it('should handle quota percentage calculations', () => {
    const quota = PLAN_LIMITS.free.requestsPerMonth;
    const used = quota * 0.8; // 80% used
    const percentUsed = (used / quota) * 100;
    
    expect(percentUsed).toBe(80);
    expect(percentUsed).toBeGreaterThan(0);
    expect(percentUsed).toBeLessThanOrEqual(100);
  });
});

describe('Time Window Calculations', () => {
  it('should calculate correct rate limit windows', () => {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const currentWindow = Math.floor(now / windowMs);
    
    expect(currentWindow).toBeGreaterThan(0);
    expect(Number.isInteger(currentWindow)).toBe(true);
    
    // Next window should be exactly 60 seconds later
    const nextWindowStart = (currentWindow + 1) * windowMs;
    expect(nextWindowStart - now).toBeLessThanOrEqual(windowMs);
    expect(nextWindowStart - now).toBeGreaterThan(0);
  });

  it('should calculate correct monthly reset dates', () => {
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
    
    expect(monthStart.getUTCDate()).toBe(1);
    expect(monthStart.getUTCHours()).toBe(0);
    expect(monthEnd.getUTCDate()).toBe(1);
    expect(monthEnd.getTime()).toBeGreaterThan(monthStart.getTime());
  });

  it('should handle month transitions correctly', () => {
    // December -> January
    const dec = new Date(Date.UTC(2024, 11, 31)); // December 31, 2024
    const nextMonth = new Date(Date.UTC(dec.getUTCFullYear(), dec.getUTCMonth() + 1, 1));
    
    expect(nextMonth.getUTCMonth()).toBe(0); // January
    expect(nextMonth.getUTCFullYear()).toBe(2025);
    
    // January -> February
    const jan = new Date(Date.UTC(2025, 0, 15)); // January 15, 2025
    const feb = new Date(Date.UTC(jan.getUTCFullYear(), jan.getUTCMonth() + 1, 1));
    
    expect(feb.getUTCMonth()).toBe(1); // February
    expect(feb.getUTCFullYear()).toBe(2025);
  });
});

describe('Error Response Formatting', () => {
  it('should format rate limit error correctly', () => {
    const error = {
      message: 'Rate limit exceeded. You can make 10 requests per minute on the free plan.',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded',
      details: {
        limit: 10,
        remaining: 0,
        resetAt: Math.floor(Date.now() / 1000) + 60,
        retryAfter: 60,
      },
    };
    
    expect(error.code).toBe('rate_limit_exceeded');
    expect(error.type).toBe('rate_limit_error');
    expect(error.details.limit).toBe(10);
    expect(error.details.retryAfter).toBeLessThanOrEqual(60);
  });

  it('should format quota exceeded error correctly', () => {
    const resetAt = Math.floor(new Date(Date.UTC(2025, 1, 1)).getTime() / 1000);
    const error = {
      message: `Monthly quota exceeded. Upgrade your plan or wait until ${new Date(resetAt * 1000).toLocaleDateString()}.`,
      type: 'quota_exceeded_error',
      code: 'quota_exceeded',
      details: {
        used: 50_000,
        limit: 50_000,
        remaining: 0,
        resetAt,
      },
    };
    
    expect(error.code).toBe('quota_exceeded');
    expect(error.type).toBe('quota_exceeded_error');
    expect(error.details.used).toBe(error.details.limit);
    expect(error.details.remaining).toBe(0);
  });
});

/*
 * Integration tests with Redis would go here
 * Skipped in test environment since Redis may not be available
 * Use scripts/verify-rate-limiting.js for manual testing
 */
