/**
 * Request Deduplication / Coalescing Module
 * 
 * Prevents duplicate API calls when identical requests arrive simultaneously
 * (race condition where cache isn't populated yet).
 * 
 * How it works:
 * 1. Hash incoming request (prompt + model + temperature + project_id)
 * 2. Check if request is already in-flight
 * 3. If in-flight, wait for first request to complete
 * 4. Serve cached response to all waiting requests
 * 
 * Edge cases handled:
 * - Streaming responses (waits for stream completion)
 * - Request timeout (next queued request takes over)
 * - Project isolation (requests are scoped by project_id)
 */

import type { RedisClient } from './redis';

// How long an in-flight request can hold the lock before timeout (ms)
const IN_FLIGHT_TIMEOUT_MS = 30000; // 30 seconds

// How often to poll for result when waiting (ms)
const POLL_INTERVAL_MS = 50;

// Maximum time to wait for a coalesced response (ms)
const MAX_WAIT_TIME_MS = 35000; // 35 seconds (slightly longer than in-flight timeout)

export interface DeduplicationResult<T> {
  type: 'leader' | 'follower';
  response?: T;
  coalesced?: boolean;
  requestHash?: string;
}

export interface InFlightRequest {
  timestamp: number;
  requestId: string;
  streaming: boolean;
}

export interface CoalescingStats {
  coalescedRequests: number;
  peakConcurrent: number;
}

/**
 * Generate a hash for request deduplication
 * Includes project_id for isolation between users/projects
 */
export async function hashRequest(
  projectId: string,
  model: string,
  prompt: string,
  temperature?: number,
  seed?: number
): Promise<string> {
  // Normalize the request data
  const normalizedData = {
    projectId,
    model: model.toLowerCase(),
    prompt: prompt.trim(),
    temperature: temperature ?? 1,
    seed: seed ?? null,
  };

  const dataString = JSON.stringify(normalizedData);
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return a shorter hash prefix for efficiency
  return hashHex.substring(0, 32);
}

/**
 * Request Deduplication Manager
 * 
 * Coordinates between concurrent identical requests to prevent
 * duplicate API calls during the cache population window.
 */
export class DeduplicationManager {
  private redis: RedisClient;
  private projectId: string;

  constructor(redis: RedisClient, projectId: string) {
    this.redis = redis;
    this.projectId = projectId;
  }

  /**
   * Get Redis key for in-flight tracking
   */
  private getInFlightKey(requestHash: string): string {
    return `inflight:${this.projectId}:${requestHash}`;
  }

  /**
   * Get Redis key for storing the response
   */
  private getResponseKey(requestHash: string): string {
    return `response:${this.projectId}:${requestHash}`;
  }

  /**
   * Get Redis key for coalescing stats
   */
  private getStatsKey(): string {
    return `coalesce:stats:${this.projectId}`;
  }

  /**
   * Get Redis key for tracking concurrent requests
   */
  private getConcurrentKey(requestHash: string): string {
    return `concurrent:${this.projectId}:${requestHash}`;
  }

  /**
   * Try to acquire leadership for a request
   * Returns true if this request should make the API call,
   * false if another request is already in-flight
   */
  async tryAcquireLeadership(
    requestHash: string,
    requestId: string,
    streaming: boolean = false
  ): Promise<{ isLeader: boolean; existingRequestId?: string }> {
    const key = this.getInFlightKey(requestHash);
    
    // Use SET NX (set if not exists) with expiry for atomic operation
    const inFlightData: InFlightRequest = {
      timestamp: Date.now(),
      requestId,
      streaming,
    };

    // Try to set the key only if it doesn't exist
    const result = await this.redis.setNX(
      key,
      JSON.stringify(inFlightData),
      Math.ceil(IN_FLIGHT_TIMEOUT_MS / 1000)
    );

    if (result) {
      // We are the leader
      return { isLeader: true };
    }

    // Someone else is the leader - get their info
    const existing = await this.redis.get<InFlightRequest>(key);
    
    // Check if the existing request has timed out
    if (existing && Date.now() - existing.timestamp > IN_FLIGHT_TIMEOUT_MS) {
      // Old request timed out, try to take over
      await this.redis.del(key);
      const retryResult = await this.redis.setNX(
        key,
        JSON.stringify(inFlightData),
        Math.ceil(IN_FLIGHT_TIMEOUT_MS / 1000)
      );
      
      if (retryResult) {
        return { isLeader: true };
      }
    }

    // Track concurrent waiting requests
    const concurrentKey = this.getConcurrentKey(requestHash);
    await this.redis.incr(concurrentKey);
    await this.redis.expire(concurrentKey, 60);

    return { 
      isLeader: false, 
      existingRequestId: existing?.requestId 
    };
  }

  /**
   * Wait for the leader's response
   * Returns the cached response once available
   */
  async waitForResponse<T>(
    requestHash: string,
    requestId: string
  ): Promise<T | null> {
    const responseKey = this.getResponseKey(requestHash);
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_WAIT_TIME_MS) {
      // Check if response is available
      const response = await this.redis.get<T>(responseKey);
      if (response !== null) {
        // Track that this request was coalesced
        await this.trackCoalescedRequest(requestHash);
        return response;
      }

      // Check if the leader is still alive
      const inFlightKey = this.getInFlightKey(requestHash);
      const inFlightExists = await this.redis.exists(inFlightKey);
      
      if (!inFlightExists) {
        // Leader finished or timed out without storing response
        // This request should become the new leader
        return null;
      }

      // Wait before polling again
      await sleep(POLL_INTERVAL_MS);
    }

    // Timeout waiting - return null to let caller handle
    return null;
  }

  /**
   * Store the response for waiting followers
   */
  async storeResponse<T>(requestHash: string, response: T): Promise<void> {
    const responseKey = this.getResponseKey(requestHash);
    
    // Store response with short TTL (just long enough for followers to read)
    await this.redis.set(responseKey, response, 10); // 10 second TTL
    
    // Release leadership
    const inFlightKey = this.getInFlightKey(requestHash);
    await this.redis.del(inFlightKey);
    
    // Update peak concurrent tracking
    await this.updatePeakConcurrent(requestHash);
  }

  /**
   * Release leadership without storing a response (error case)
   */
  async releaseLeadership(requestHash: string): Promise<void> {
    const inFlightKey = this.getInFlightKey(requestHash);
    await this.redis.del(inFlightKey);
  }

  /**
   * Track a coalesced request for metrics
   */
  private async trackCoalescedRequest(requestHash: string): Promise<void> {
    const statsKey = this.getStatsKey();
    const monthKey = this.getMonthlyStatsKey();
    
    // Increment coalesced count
    await this.redis.hincr(statsKey, 'coalesced');
    await this.redis.hincr(monthKey, 'coalesced');
    
    // Set expiry if new key
    await this.redis.expire(statsKey, 86400 * 30); // 30 days
    await this.redis.expire(monthKey, 86400 * 35); // 35 days
  }

  /**
   * Update peak concurrent requests
   */
  private async updatePeakConcurrent(requestHash: string): Promise<void> {
    const concurrentKey = this.getConcurrentKey(requestHash);
    const concurrent = await this.redis.get<number>(concurrentKey) || 0;
    
    if (concurrent > 0) {
      const statsKey = this.getStatsKey();
      const monthKey = this.getMonthlyStatsKey();
      
      // Get current peak
      const currentPeak = await this.redis.hget<number>(statsKey, 'peak') || 0;
      
      if (concurrent > currentPeak) {
        await this.redis.hset(statsKey, 'peak', concurrent);
        await this.redis.hset(monthKey, 'peak', concurrent);
      }
      
      // Clean up concurrent counter
      await this.redis.del(concurrentKey);
    }
  }

  /**
   * Get monthly stats key
   */
  private getMonthlyStatsKey(): string {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `coalesce:monthly:${this.projectId}:${month}`;
  }

  /**
   * Get coalescing statistics
   */
  async getStats(): Promise<CoalescingStats> {
    const monthKey = this.getMonthlyStatsKey();
    
    const coalesced = await this.redis.hget<number>(monthKey, 'coalesced') || 0;
    const peak = await this.redis.hget<number>(monthKey, 'peak') || 0;

    return {
      coalescedRequests: coalesced,
      peakConcurrent: peak,
    };
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a deduplication manager
 */
export function createDeduplicationManager(
  redis: RedisClient,
  projectId: string
): DeduplicationManager {
  return new DeduplicationManager(redis, projectId);
}
