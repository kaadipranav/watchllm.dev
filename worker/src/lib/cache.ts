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
} from '../types';
import { normalizePrompt } from './semanticCache';

// Default TTL: 1 hour in seconds
const DEFAULT_TTL = 3600;

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
 * Cache manager for handling all caching operations
 */
export class CacheManager {
  private redis: RedisClient;
  private ttl: number;

  constructor(redis: RedisClient, ttlSeconds: number = DEFAULT_TTL) {
    this.redis = redis;
    this.ttl = ttlSeconds;
  }

  /**
   * Get cached chat completion response
   */
  async getChatCompletion(
    request: ChatCompletionRequest
  ): Promise<CacheEntry<ChatCompletionResponse> | null> {
    // Don't cache streaming requests
    if (request.stream) {
      return null;
    }

    const key = generateChatCacheKey(request);
    const result = await this.redis.get<CacheEntry<ChatCompletionResponse>>(key);
    return result;
  }

  /**
   * Cache a chat completion response
   */
  async setChatCompletion(
    request: ChatCompletionRequest,
    response: ChatCompletionResponse
  ): Promise<boolean> {
    // Don't cache streaming requests
    if (request.stream) {
      return false;
    }

    const key = generateChatCacheKey(request);
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

    const result = await this.redis.set(key, entry, this.ttl);
    return result;
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
    return this.redis.get<CacheEntry<CompletionResponse>>(key);
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

    return this.redis.set(key, entry, this.ttl);
  }

  /**
   * Get cached embeddings response
   */
  async getEmbeddings(
    request: EmbeddingsRequest
  ): Promise<CacheEntry<EmbeddingsResponse> | null> {
    const key = generateEmbeddingsCacheKey(request);
    return this.redis.get<CacheEntry<EmbeddingsResponse>>(key);
  }

  /**
   * Cache an embeddings response
   */
  async setEmbeddings(
    request: EmbeddingsRequest,
    response: EmbeddingsResponse
  ): Promise<boolean> {
    const key = generateEmbeddingsCacheKey(request);
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

    // Embeddings can be cached longer since they're deterministic
    return this.redis.set(key, entry, this.ttl * 24); // 24 hours for embeddings
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
  ttlSeconds?: number
): CacheManager {
  return new CacheManager(redis, ttlSeconds);
}
