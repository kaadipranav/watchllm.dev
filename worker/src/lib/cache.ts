/**
 * Semantic caching logic for AI API responses
 */

import type { RedisClient } from './redis';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  CompletionRequest,
  CompletionResponse,
  EmbeddingsRequest,
  EmbeddingsResponse,
  CacheEntry,
  CacheTTLEndpointOverrides,
} from '../types';
import { normalizePrompt } from './semanticCache';

// Default TTL: 24 hours in seconds
const DEFAULT_TTL = 86400;

// Cache key prefix
const CACHE_PREFIX = 'watchllm:cache:';

/**
 * Generate a deterministic hash for cache key
 * Uses a simple but effective string hash algorithm
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate cache key for chat completions
 */
export function generateChatCacheKey(request: ChatCompletionRequest): string {
  // Extract relevant parts for caching
  const model = request.model;
  const temperature = (request.temperature ?? 1).toFixed(2);

  // Normalize and concatenate messages using the same normalization as semantic cache
  const messagesKey = request.messages
    .map((m) => {
      const role = m.role;
      const content = normalizePrompt(m.content || '');
      return `${role}:${content}`;
    })
    .join('|');

  // Include function/tool definitions if present
  const functionsKey = request.functions
    ? JSON.stringify(request.functions)
    : '';
  const toolsKey = request.tools
    ? JSON.stringify(request.tools)
    : '';
  const responseFormatKey = request.response_format
    ? JSON.stringify(request.response_format)
    : '';

  const keyData = `${model}:${temperature}:${messagesKey}:${functionsKey}:${toolsKey}:${responseFormatKey}`;
  const hash = hashString(keyData);

  return `${CACHE_PREFIX}chat:${hash}`;
}

/**
 * Generate cache key for legacy completions
 */
export function generateCompletionCacheKey(request: CompletionRequest): string {
  const model = request.model;
  const temperature = (request.temperature ?? 1).toFixed(2);

  // Normalize prompt using the same normalization as semantic cache
  const prompt = Array.isArray(request.prompt)
    ? request.prompt.map(normalizePrompt).join('|')
    : normalizePrompt(request.prompt);

  const keyData = `${model}:${temperature}:${prompt}`;
  const hash = hashString(keyData);

  return `${CACHE_PREFIX}completion:${hash}`;
}

/**
 * Generate cache key for embeddings
 */
export function generateEmbeddingsCacheKey(request: EmbeddingsRequest): string {
  const model = request.model;

  // Normalize input using the same normalization as semantic cache
  const input = Array.isArray(request.input)
    ? request.input.map(normalizePrompt).join('|')
    : normalizePrompt(request.input);

  const dimensions = request.dimensions ?? '';

  const keyData = `${model}:${input}:${dimensions}`;
  const hash = hashString(keyData);

  return `${CACHE_PREFIX}embedding:${hash}`;
}

/**
 * Cache manager for handling all caching operations with TTL support
 */
export class CacheManager {
  private redis: RedisClient;
  private ttl: number;
  private endpointOverrides: CacheTTLEndpointOverrides;

  constructor(
    redis: RedisClient,
    ttlSeconds: number = DEFAULT_TTL,
    endpointOverrides: CacheTTLEndpointOverrides = {}
  ) {
    this.redis = redis;
    this.ttl = ttlSeconds;
    this.endpointOverrides = endpointOverrides;
  }

  /**
   * Get effective TTL for an endpoint
   */
  private getEffectiveTTL(endpoint: string): number {
    return this.endpointOverrides[endpoint] ?? this.ttl;
  }

  /**
   * Check if a cache entry has expired
   */
  private isExpired(entry: any, ttlSeconds: number): boolean {
    if (ttlSeconds === -1) return false; // Never expire
    const ageSeconds = (Date.now() - entry.timestamp) / 1000;
    return ageSeconds > ttlSeconds;
  }

  /**
   * Get cached chat completion response
   */
  async getChatCompletion(
    request: ChatCompletionRequest
  ): Promise<CacheEntry<ChatCompletionResponse> | null> {
    const key = generateChatCacheKey(request);
    const result = await this.redis.get<CacheEntry<ChatCompletionResponse>>(key);
    
    if (!result) return null;

    // Check if expired
    const ttl = this.getEffectiveTTL('/v1/chat/completions');
    if (this.isExpired(result, ttl)) {
      await this.redis.del(key);
      return null;
    }

    return result;
  }

  /**
   * Cache a chat completion response
   */
  async setChatCompletion(
    request: ChatCompletionRequest,
    response: ChatCompletionResponse
  ): Promise<boolean> {
    const key = generateChatCacheKey(request);
    const ttl = this.getEffectiveTTL('/v1/chat/completions');
    
    const entry: CacheEntry<ChatCompletionResponse> = {
      data: response,
      timestamp: Date.now(),
      model: response.model,
      tokens: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
    };

    return this.redis.set(key, entry, ttl === -1 ? 0 : ttl); // 0 = no expiry for Redis
  }

  /**
   * Get cached completion response
   */
  async getCompletion(
    request: CompletionRequest
  ): Promise<CacheEntry<CompletionResponse> | null> {
    if (request.stream) {
      return null;
    }

    const key = generateCompletionCacheKey(request);
    const result = await this.redis.get<CacheEntry<CompletionResponse>>(key);
    
    if (!result) return null;

    const ttl = this.getEffectiveTTL('/v1/completions');
    if (this.isExpired(result, ttl)) {
      await this.redis.del(key);
      return null;
    }

    return result;
  }

  /**
   * Cache a completion response
   */
  async setCompletion(
    request: CompletionRequest,
    response: CompletionResponse
  ): Promise<boolean> {
    if (request.stream) {
      return false;
    }

    const key = generateCompletionCacheKey(request);
    const ttl = this.getEffectiveTTL('/v1/completions');
    
    const entry: CacheEntry<CompletionResponse> = {
      data: response,
      timestamp: Date.now(),
      model: response.model,
      tokens: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
        total: response.usage.total_tokens,
      },
    };

    return this.redis.set(key, entry, ttl === -1 ? 0 : ttl);
  }

  /**
   * Get cached embeddings response
   */
  async getEmbeddings(
    request: EmbeddingsRequest
  ): Promise<CacheEntry<EmbeddingsResponse> | null> {
    const key = generateEmbeddingsCacheKey(request);
    const result = await this.redis.get<CacheEntry<EmbeddingsResponse>>(key);
    
    if (!result) return null;

    const ttl = this.getEffectiveTTL('/v1/embeddings');
    if (this.isExpired(result, ttl)) {
      await this.redis.del(key);
      return null;
    }

    return result;
  }

  /**
   * Cache an embeddings response
   */
  async setEmbeddings(
    request: EmbeddingsRequest,
    response: EmbeddingsResponse
  ): Promise<boolean> {
    const key = generateEmbeddingsCacheKey(request);
    const ttl = this.getEffectiveTTL('/v1/embeddings');
    
    const entry: CacheEntry<EmbeddingsResponse> = {
      data: response,
      timestamp: Date.now(),
      model: response.model,
      tokens: {
        input: response.usage.prompt_tokens,
        output: 0,
        total: response.usage.total_tokens,
      },
    };

    return this.redis.set(key, entry, ttl === -1 ? 0 : ttl);
  }

  /**
   * Invalidate a specific cache entry
   */
  async invalidate(key: string): Promise<boolean> {
    return this.redis.del(key);
  }
}

/**
 * Create cache manager instance
 */
export function createCacheManager(
  redis: RedisClient,
  ttlSeconds?: number,
  endpointOverrides?: CacheTTLEndpointOverrides
): CacheManager {
  return new CacheManager(redis, ttlSeconds, endpointOverrides);
}
