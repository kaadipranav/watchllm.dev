/**
 * Streaming Cache for AI API Responses
 * 
 * This module handles:
 * 1. Buffering streaming responses while forwarding to client
 * 2. Caching complete streamed responses
 * 3. Replaying cached streams at realistic speeds
 * 4. Handling streaming failures gracefully
 */

import type { RedisClient } from './redis';
import type { ChatCompletionRequest } from '../types';
import { normalizePrompt } from './semanticCache';

// ============================================================================
// Constants
// ============================================================================

const STREAM_CACHE_PREFIX = 'watchllm:stream:';
const STREAM_CACHE_TTL = 3600; // 1 hour default
const REPLAY_CHUNK_DELAY_MS = 30; // Delay between chunks during replay
const STREAM_TIMEOUT_MS = 120000; // 2 minute timeout for streams
const MIN_CHUNKS_TO_CACHE = 3; // Minimum chunks needed to consider response complete

// ============================================================================
// Types
// ============================================================================

export interface StreamChunk {
  /** Raw SSE data line */
  data: string;
  /** Timestamp when chunk was received */
  timestamp: number;
  /** Time since previous chunk (for replay timing) */
  deltaMs: number;
}

export interface CachedStream {
  /** All chunks in order */
  chunks: StreamChunk[];
  /** Request model */
  model: string;
  /** When this was cached */
  cachedAt: number;
  /** Total time to stream */
  totalDurationMs: number;
  /** Whether stream completed successfully */
  complete: boolean;
  /** Reconstructed full response text */
  fullContent: string;
  /** Estimated token counts */
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

export interface StreamMetrics {
  streamingRequests: number;
  nonStreamingRequests: number;
  streamingCacheHits: number;
  streamingCacheMisses: number;
  failedStreams: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate cache key for streaming request
 */
function generateStreamCacheKey(request: ChatCompletionRequest): string {
  const model = request.model;
  const temperature = (request.temperature ?? 1).toFixed(2);
  
  const messagesKey = request.messages
    .map(m => `${m.role}:${normalizePrompt(m.content || '')}`)
    .join('|');
  
  // Simple hash function
  let hash = 0;
  const str = `${model}:${temperature}:${messagesKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  
  return `${STREAM_CACHE_PREFIX}${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

/**
 * Parse SSE data line to extract content
 */
function parseSSEContent(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6);
  if (data === '[DONE]') return null;
  
  try {
    const parsed = JSON.parse(data);
    return parsed.choices?.[0]?.delta?.content || null;
  } catch {
    return null;
  }
}

/**
 * Estimate tokens from content (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

// ============================================================================
// Stream Cache Manager
// ============================================================================

export class StreamCacheManager {
  private redis: RedisClient;
  private ttl: number;
  private metricsKey: string;

  constructor(redis: RedisClient, projectId: string, ttlSeconds: number = STREAM_CACHE_TTL) {
    this.redis = redis;
    this.ttl = ttlSeconds;
    const month = new Date().toISOString().slice(0, 7);
    this.metricsKey = `watchllm:stream_metrics:${projectId}:${month}`;
  }

  /**
   * Check if a streaming request has a cached response
   */
  async getCachedStream(request: ChatCompletionRequest): Promise<CachedStream | null> {
    const key = generateStreamCacheKey(request);
    const cached = await this.redis.get<CachedStream>(key);
    
    if (cached && cached.complete) {
      await this.incrementMetric('streamingCacheHits');
      return cached;
    }
    
    await this.incrementMetric('streamingCacheMisses');
    return null;
  }

  /**
   * Create a transform stream that buffers chunks for caching
   * while passing them through to the client
   */
  createBufferingStream(
    sourceStream: ReadableStream<Uint8Array>,
    request: ChatCompletionRequest,
    onComplete?: (cached: CachedStream) => void
  ): ReadableStream<Uint8Array> {
    const chunks: StreamChunk[] = [];
    let lastChunkTime = Date.now();
    let fullContent = '';
    let streamComplete = false;
    const decoder = new TextDecoder();
    const key = generateStreamCacheKey(request);
    const redis = this.redis;
    const ttl = this.ttl;
    const incrementMetric = this.incrementMetric.bind(this);

    // Track partial data for handling split chunks
    let partialData = '';

    return new ReadableStream({
      async start(controller) {
        const reader = sourceStream.getReader();
        const startTime = Date.now();

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              streamComplete = true;
              break;
            }

            const now = Date.now();
            const text = decoder.decode(value, { stream: true });
            
            // Handle potential split SSE messages
            const fullText = partialData + text;
            const lines = fullText.split('\n');
            
            // Keep last incomplete line for next iteration
            partialData = lines.pop() || '';

            for (const line of lines) {
              if (line.trim()) {
                chunks.push({
                  data: line,
                  timestamp: now,
                  deltaMs: now - lastChunkTime,
                });
                lastChunkTime = now;

                // Extract content for full response reconstruction
                const content = parseSSEContent(line);
                if (content) {
                  fullContent += content;
                }
              }
            }

            // Pass through to client
            controller.enqueue(value);
          }

          // Handle any remaining partial data
          if (partialData.trim()) {
            chunks.push({
              data: partialData,
              timestamp: Date.now(),
              deltaMs: Date.now() - lastChunkTime,
            });
            const content = parseSSEContent(partialData);
            if (content) {
              fullContent += content;
            }
          }

          controller.close();

          // Cache complete stream
          if (streamComplete && chunks.length >= MIN_CHUNKS_TO_CACHE) {
            const inputTokens = estimateTokens(
              request.messages.map(m => m.content || '').join(' ')
            );
            const outputTokens = estimateTokens(fullContent);

            const cachedStream: CachedStream = {
              chunks,
              model: request.model,
              cachedAt: Date.now(),
              totalDurationMs: Date.now() - startTime,
              complete: true,
              fullContent,
              tokens: {
                input: inputTokens,
                output: outputTokens,
                total: inputTokens + outputTokens,
              },
            };

            await redis.set(key, cachedStream, ttl);
            await incrementMetric('streamingRequests');
            
            if (onComplete) {
              onComplete(cachedStream);
            }
          } else if (!streamComplete) {
            // Stream was interrupted
            await incrementMetric('failedStreams');
          }
        } catch (error) {
          await incrementMetric('failedStreams');
          controller.error(error);
        }
      },
    });
  }

  /**
   * Replay a cached stream with realistic timing
   */
  createReplayStream(
    cachedStream: CachedStream,
    realisticTiming: boolean = true
  ): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const chunks = cachedStream.chunks;
    let chunkIndex = 0;

    return new ReadableStream({
      async pull(controller) {
        if (chunkIndex >= chunks.length) {
          controller.close();
          return;
        }

        const chunk = chunks[chunkIndex];
        
        // Add realistic delay if enabled
        if (realisticTiming && chunk.deltaMs > 0 && chunkIndex > 0) {
          // Cap delay at 100ms to prevent overly slow replays
          const delay = Math.min(chunk.deltaMs, 100);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (!realisticTiming && chunkIndex > 0) {
          // Minimal delay for fast replay
          await new Promise(resolve => setTimeout(resolve, REPLAY_CHUNK_DELAY_MS));
        }

        // Send the chunk
        const data = encoder.encode(chunk.data + '\n');
        controller.enqueue(data);
        chunkIndex++;
      },
    });
  }

  /**
   * Increment a metric counter
   */
  private async incrementMetric(metric: keyof StreamMetrics): Promise<void> {
    try {
      await this.redis.hincr(this.metricsKey, metric, 1);
    } catch (error) {
      console.error(`Failed to increment stream metric ${metric}:`, error);
    }
  }

  /**
   * Get streaming metrics
   */
  async getMetrics(): Promise<StreamMetrics> {
    try {
      const data = await this.redis.hgetall(this.metricsKey);
      return {
        streamingRequests: parseInt(data?.streamingRequests || '0', 10),
        nonStreamingRequests: parseInt(data?.nonStreamingRequests || '0', 10),
        streamingCacheHits: parseInt(data?.streamingCacheHits || '0', 10),
        streamingCacheMisses: parseInt(data?.streamingCacheMisses || '0', 10),
        failedStreams: parseInt(data?.failedStreams || '0', 10),
      };
    } catch (error) {
      console.error('Failed to get stream metrics:', error);
      return {
        streamingRequests: 0,
        nonStreamingRequests: 0,
        streamingCacheHits: 0,
        streamingCacheMisses: 0,
        failedStreams: 0,
      };
    }
  }

  /**
   * Track non-streaming request for metrics
   */
  async trackNonStreamingRequest(): Promise<void> {
    await this.incrementMetric('nonStreamingRequests');
  }
}

/**
 * Factory function to create StreamCacheManager
 */
export function createStreamCacheManager(
  redis: RedisClient,
  projectId: string,
  ttlSeconds?: number
): StreamCacheManager {
  return new StreamCacheManager(redis, projectId, ttlSeconds);
}
