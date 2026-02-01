/**
 * Upstash Redis client for caching
 */

import type { Env } from '../types';

interface RedisResponse<T> {
  result: T | null;
  error?: string;
}

export class RedisClient {
  private baseUrl: string;
  private token: string;

  constructor(env: Env) {
    this.baseUrl = env.UPSTASH_REDIS_REST_URL;
    this.token = env.UPSTASH_REDIS_REST_TOKEN;
  }

  /**
   * Execute a Redis command via REST API
   */
  private async execute<T>(command: string[]): Promise<T | null> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        console.error(`Redis error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = (await response.json()) as RedisResponse<T>;
      
      if (data.error) {
        console.error(`Redis error: ${data.error}`);
        return null;
      }

      return data.result;
    } catch (error) {
      console.error('Redis connection error:', error);
      return null;
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const result = await this.execute<string>(['GET', key]);
    if (!result) return null;
    
    try {
      return JSON.parse(result) as T;
    } catch {
      return result as T;
    }
  }

  /**
   * Set a value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const command = ttlSeconds
      ? ['SET', key, stringValue, 'EX', ttlSeconds.toString()]
      : ['SET', key, stringValue];

    const result = await this.execute<string>(command);
    return result === 'OK';
  }

  /**
   * Set a value only if it doesn't exist (atomic operation for locking)
   * Returns true if the key was set, false if it already existed
   */
  async setNX(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const command = ttlSeconds
      ? ['SET', key, stringValue, 'NX', 'EX', ttlSeconds.toString()]
      : ['SET', key, stringValue, 'NX'];

    const result = await this.execute<string>(command);
    return result === 'OK';
  }

  /**
   * Get a field from a hash
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    const result = await this.execute<string>(['HGET', key, field]);
    if (!result) return null;
    
    try {
      return JSON.parse(result) as T;
    } catch {
      return result as T;
    }
  }

  /**
   * Set a field in a hash
   */
  async hset(key: string, field: string, value: unknown): Promise<boolean> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await this.execute<number>(['HSET', key, field, stringValue]);
    return result !== null;
  }

  /**
   * Increment a field in a hash
   */
  async hincr(key: string, field: string, increment: number = 1): Promise<number> {
    const result = await this.execute<number>(['HINCRBY', key, field, increment.toString()]);
    return result ?? 0;
  }

  /**
   * Get all fields from a hash
   */
  async hgetall<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const result = await this.execute<string[]>(['HGETALL', key]);
    if (!result || result.length === 0) return null;
    
    // Convert array to object [field1, value1, field2, value2, ...]
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < result.length; i += 2) {
      const field = result[i];
      const value = result[i + 1];
      try {
        obj[field] = JSON.parse(value);
      } catch {
        obj[field] = value;
      }
    }
    return obj as T;
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<boolean> {
    const result = await this.execute<number>(['DEL', key]);
    return result === 1;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const result = await this.execute<number>(['EXISTS', key]);
    return result === 1;
  }

  /**
   * Increment a counter (for rate limiting)
   */
  async incr(key: string): Promise<number> {
    const result = await this.execute<number>(['INCR', key]);
    return result ?? 0;
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.execute<number>(['EXPIRE', key, seconds.toString()]);
    return result === 1;
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    const result = await this.execute<number>(['TTL', key]);
    return result ?? -2;
  }

  /**
   * Rate limiting: Check and increment request count
   * Returns { allowed: boolean, remaining: number, resetAt: number }
   */
  async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number = 60
  ): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const count = await this.incr(key);
    
    // If this is the first request, set expiry
    if (count === 1) {
      await this.expire(key, windowSeconds);
    }

    const ttl = await this.ttl(key);
    const resetAt = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : windowSeconds);
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return { allowed, remaining, resetAt };
  }

  /**
   * Health check - verify connection
   */
  async ping(): Promise<boolean> {
    const result = await this.execute<string>(['PING']);
    return result === 'PONG';
  }
}

/**
 * Create Redis client instance
 */
export function createRedisClient(env: Env): RedisClient {
  return new RedisClient(env);
}
