/**
 * Similarity Calculation Utilities
 * 
 * Reusable functions for calculating semantic and text similarity.
 * Used by both semantic caching and agent debugger to detect caching opportunities.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import type { ProviderClient } from './providers';
import { embedText } from './semanticCache';

// ============================================================================
// Cosine Similarity (from semanticCache.ts)
// ============================================================================

/**
 * Calculate cosine similarity between two embedding vectors
 * Returns a value between 0.0 and 1.0, where 1.0 is identical
 * 
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score (0.0 - 1.0)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ============================================================================
// Text Normalization
// ============================================================================

/**
 * Normalize text for comparison by:
 * - Converting to lowercase
 * - Removing extra whitespace
 * - Sorting JSON keys if it's JSON
 * 
 * @param text - Raw text to normalize
 * @returns Normalized text
 */
export function normalizeTextForComparison(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text.trim().toLowerCase();
  
  // Try to parse as JSON and re-serialize with sorted keys
  try {
    const parsed = JSON.parse(text);
    // Only normalize JSON if it's an object (not array or primitive)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const sorted = sortObjectKeys(parsed);
      normalized = JSON.stringify(sorted).toLowerCase();
    }
  } catch {
    // Not JSON, use as-is
  }
  
  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Recursively sort object keys for consistent JSON serialization
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sortObjectKeys(item));
  }
  
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
  }
  
  return sorted;
}

/**
 * Serialize tool arguments for comparison
 * Ensures consistent JSON serialization with sorted keys
 * 
 * @param toolArgs - Tool arguments object
 * @returns Normalized JSON string
 */
export function serializeToolArgs(toolArgs: Record<string, unknown> | undefined): string {
  if (!toolArgs) return '';
  
  try {
    const sorted = sortObjectKeys(toolArgs) as Record<string, unknown>;
    return JSON.stringify(sorted).toLowerCase().trim();
  } catch {
    // Fallback to string representation
    return String(toolArgs).toLowerCase().trim();
  }
}

// ============================================================================
// Semantic Similarity (requires embeddings)
// ============================================================================

/**
 * Calculate semantic similarity between two texts using embeddings
 * Uses the same logic as semantic cache (cosine similarity with embeddings)
 * 
 * @param provider - Provider client for embeddings (optional, falls back to string similarity)
 * @param textA - First text to compare
 * @param textB - Second text to compare
 * @param useEmbeddings - Whether to use embeddings (default: true if provider available)
 * @returns Similarity score (0.0 - 1.0) and method used
 */
export async function calculateTextSimilarity(
  textA: string,
  textB: string,
  provider?: ProviderClient,
  useEmbeddings: boolean = true
): Promise<{ similarity: number; method: 'embedding' | 'string' }> {
  // Normalize texts first
  const normalizedA = normalizeTextForComparison(textA);
  const normalizedB = normalizeTextForComparison(textB);
  
  // Exact match after normalization
  if (normalizedA === normalizedB) {
    return { similarity: 1.0, method: 'string' };
  }
  
  // Try embedding-based similarity if provider is available
  if (provider && useEmbeddings) {
    try {
      // Generate embeddings for both texts
      const embeddingA = await embedText(provider, normalizedA);
      const embeddingB = await embedText(provider, normalizedB);
      
      if (embeddingA && embeddingB) {
        const similarity = cosineSimilarity(embeddingA, embeddingB);
        return { similarity, method: 'embedding' };
      }
    } catch (error) {
      console.warn('[SimilarityUtils] Embedding generation failed, falling back to string similarity:', error);
      // Fall back to string similarity
    }
  }
  
  // Fallback to Jaccard similarity (word overlap)
  return { 
    similarity: calculateJaccardSimilarity(normalizedA, normalizedB), 
    method: 'string' 
  };
}

/**
 * Calculate Jaccard similarity (word overlap) between two texts
 * Returns similarity score between 0.0 and 1.0
 * 
 * @param textA - First text
 * @param textB - Second text
 * @returns Similarity score (0.0 - 1.0)
 */
export function calculateJaccardSimilarity(textA: string, textB: string): number {
  if (textA === textB) return 1.0;
  if (!textA || !textB) return 0;
  
  const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  if (union.size === 0) return 0;
  
  return intersection.size / union.size;
}

// ============================================================================
// Tool Call Similarity
// ============================================================================

/**
 * Calculate similarity between two tool calls
 * Compares tool name and arguments
 * 
 * @param provider - Provider client for embeddings (optional)
 * @param toolA - First tool name
 * @param argsA - First tool arguments
 * @param toolB - Second tool name
 * @param argsB - Second tool arguments
 * @returns Similarity score (0.0 - 1.0)
 */
export async function calculateToolCallSimilarity(
  toolA: string | undefined,
  argsA: Record<string, unknown> | undefined,
  toolB: string | undefined,
  argsB: Record<string, unknown> | undefined,
  provider?: ProviderClient
): Promise<{ similarity: number; method: 'embedding' | 'string' }> {
  // Tools must match
  if (toolA !== toolB) {
    return { similarity: 0, method: 'string' };
  }
  
  // Serialize arguments for comparison
  const argsAStr = serializeToolArgs(argsA);
  const argsBStr = serializeToolArgs(argsB);
  
  // Compare arguments using semantic similarity
  return calculateTextSimilarity(argsAStr, argsBStr, provider);
}

