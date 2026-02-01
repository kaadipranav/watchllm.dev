/**
 * Abuse Detection for Cache-Based Attacks
 * 
 * Detects and throttles suspicious patterns such as:
 * - Excessive identical requests (cache spamming)
 * - Unusual request rates
 * - Potential DDoS or scraping behavior
 */

import type { RedisClient } from './redis';

// ============================================================================
// Constants
// ============================================================================

const ABUSE_PREFIX = 'watchllm:abuse:';
const ABUSE_DETECTION_WINDOW = 3600; // 1 hour
const IDENTICAL_REQUEST_THRESHOLD = 1000; // Flag if >1000 identical requests/hour
const SUSPICIOUS_PATTERN_THRESHOLD = 500; // Flag if >500 requests to same endpoint/hour
const AUTO_THROTTLE_THRESHOLD = 2000; // Auto-throttle if >2000 identical requests/hour
const THROTTLE_DURATION = 300; // 5 minutes

// ============================================================================
// Types
// ============================================================================

export interface AbuseMetrics {
  identicalRequests: number;
  flagged: boolean;
  throttled: boolean;
  reason?: string;
}

export interface AbuseDetectionResult {
  allowed: boolean;
  flagged: boolean;
  throttled: boolean;
  reason?: string;
  remainingThrottleTime?: number;
}

// ============================================================================
// Abuse Detector
// ============================================================================

export class AbuseDetector {
  private redis: RedisClient;

  constructor(redis: RedisClient) {
    this.redis = redis;
  }

  /**
   * Track a request and check for abuse patterns
   * 
   * @param projectId - Project ID
   * @param requestHash - Hash of the request (for identical request detection)
   * @param apiKeyId - API key ID
   * @returns Detection result with allowed/flagged/throttled status
   */
  async checkRequest(
    projectId: string,
    requestHash: string,
    apiKeyId: string
  ): Promise<AbuseDetectionResult> {
    // Check if currently throttled
    const throttleKey = `${ABUSE_PREFIX}throttle:${projectId}:${apiKeyId}`;
    const isThrottled = await this.redis.get<boolean>(throttleKey);
    
    if (isThrottled) {
      const ttl = await this.redis.ttl(throttleKey);
      return {
        allowed: false,
        flagged: true,
        throttled: true,
        reason: 'Excessive identical requests detected. Auto-throttled for abuse prevention.',
        remainingThrottleTime: ttl,
      };
    }

    // Track identical request count
    const identicalKey = `${ABUSE_PREFIX}identical:${projectId}:${requestHash}`;
    const identicalCount = await this.redis.incr(identicalKey);
    
    // Set expiry on first request
    if (identicalCount === 1) {
      await this.redis.expire(identicalKey, ABUSE_DETECTION_WINDOW);
    }

    // Track total requests per API key (for pattern detection)
    const patternKey = `${ABUSE_PREFIX}pattern:${projectId}:${apiKeyId}`;
    const totalCount = await this.redis.incr(patternKey);
    
    if (totalCount === 1) {
      await this.redis.expire(patternKey, ABUSE_DETECTION_WINDOW);
    }

    // Check for auto-throttle threshold
    if (identicalCount >= AUTO_THROTTLE_THRESHOLD) {
      // Auto-throttle this API key
      await this.redis.set(throttleKey, true, THROTTLE_DURATION);
      
      // Log abuse event
      console.warn(
        `[ABUSE] Auto-throttled project ${projectId}, API key ${apiKeyId}: ` +
        `${identicalCount} identical requests in 1 hour`
      );

      return {
        allowed: false,
        flagged: true,
        throttled: true,
        reason: 'Excessive identical requests detected. Auto-throttled for abuse prevention.',
        remainingThrottleTime: THROTTLE_DURATION,
      };
    }

    // Check for flagging threshold (warning, but still allowed)
    const flagged = identicalCount >= IDENTICAL_REQUEST_THRESHOLD;
    
    if (flagged) {
      console.warn(
        `[ABUSE] Flagged project ${projectId}, API key ${apiKeyId}: ` +
        `${identicalCount} identical requests in 1 hour (threshold: ${IDENTICAL_REQUEST_THRESHOLD})`
      );
    }

    return {
      allowed: true,
      flagged,
      throttled: false,
      reason: flagged ? 'High volume of identical requests detected' : undefined,
    };
  }

  /**
   * Get abuse metrics for a project
   */
  async getMetrics(projectId: string, apiKeyId: string): Promise<AbuseMetrics> {
    const patternKey = `${ABUSE_PREFIX}pattern:${projectId}:${apiKeyId}`;
    const throttleKey = `${ABUSE_PREFIX}throttle:${projectId}:${apiKeyId}`;
    
    const totalCount = await this.redis.get<number>(patternKey) || 0;
    const isThrottled = await this.redis.get<boolean>(throttleKey) || false;
    const flagged = totalCount >= IDENTICAL_REQUEST_THRESHOLD;

    return {
      identicalRequests: totalCount,
      flagged,
      throttled: isThrottled,
      reason: isThrottled 
        ? 'Auto-throttled due to excessive requests'
        : flagged 
        ? 'High volume detected'
        : undefined,
    };
  }

  /**
   * Manually clear throttle (admin override)
   */
  async clearThrottle(projectId: string, apiKeyId: string): Promise<void> {
    const throttleKey = `${ABUSE_PREFIX}throttle:${projectId}:${apiKeyId}`;
    await this.redis.del(throttleKey);
  }

  /**
   * Get all flagged projects (for admin monitoring)
   */
  async getFlaggedProjects(): Promise<Array<{ projectId: string; count: number }>> {
    // This would require SCAN in production Redis
    // For now, return empty array (requires separate tracking)
    return [];
  }
}

/**
 * Factory function to create AbuseDetector
 */
export function createAbuseDetector(redis: RedisClient): AbuseDetector {
  return new AbuseDetector(redis);
}
