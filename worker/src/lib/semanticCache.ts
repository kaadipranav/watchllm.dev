/**
 * Semantic cache backed by Cloudflare D1
 * - Embeds text with OpenAI embeddings
 * - Performs cosine similarity search over cached entries
 */

import type { D1Client, D1CacheEntry } from './d1';
import type {
  ChatCompletionResponse,
  CompletionResponse,
  ChatMessage,
} from '../types';
import type { ProviderClient } from './providers';

const DEFAULT_THRESHOLD = 0.95;
const MAX_ENTRIES = 50;

export type SemanticKind = 'chat' | 'completion';

export interface SemanticCacheEntry<T> {
  embedding: number[];
  data: T;
  model: string;
  timestamp: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  text: string;
}

interface SemanticHit<T> {
  entry: SemanticCacheEntry<T>;
  similarity: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
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

export class SemanticCache {
  private db: D1Client | null;
  private projectId: string;
  private maxEntries: number;

  constructor(db: D1Client | null, projectId: string, maxEntries: number = MAX_ENTRIES) {
    this.db = db;
    this.projectId = projectId;
    this.maxEntries = maxEntries;
  }

  private async load<T>(kind: SemanticKind): Promise<SemanticCacheEntry<T>[]> {
    if (!this.db) return [];
    try {
      const entries = await this.db.getEntries(this.projectId, kind);
      return entries.map(e => ({
        embedding: JSON.parse(e.embedding),
        data: JSON.parse(e.response) as T,
        model: e.model,
        timestamp: e.timestamp,
        tokens: {
          input: e.tokens_input,
          output: e.tokens_output,
          total: e.tokens_total,
        },
        text: e.text,
      }));
    } catch (error) {
      console.error('Semantic cache load error:', error);
      return [];
    }
  }

  async findSimilar<T>(
    kind: SemanticKind,
    embedding: number[],
    threshold: number = DEFAULT_THRESHOLD
  ): Promise<SemanticHit<T> | null> {
    if (!this.db || !embedding || embedding.length === 0) return null;

    try {
      const entries = await this.load<T>(kind);
      console.log(`Semantic cache: Comparing against ${entries.length} entries, threshold: ${threshold}`);
      let best: SemanticHit<T> | null = null;
      for (const entry of entries) {
        const sim = cosineSimilarity(embedding, entry.embedding);
        if (sim >= threshold && (!best || sim > best.similarity)) {
          best = { entry, similarity: sim };
        }
      }
      if (best) {
        console.log(`Best match: similarity=${best.similarity.toFixed(4)}`);
      } else {
        console.log('No semantic match found above threshold');
      }
      return best;
    } catch (error) {
      console.error('Semantic cache findSimilar error:', error);
      return null;
    }
  }

  async put<T>(kind: SemanticKind, entry: SemanticCacheEntry<T>): Promise<void> {
    if (!this.db || !entry.embedding || entry.embedding.length === 0) return;

    try {
      const id = crypto.randomUUID();
      await this.db.saveEntry({
        id,
        project_id: this.projectId,
        kind,
        text: entry.text,
        embedding: JSON.stringify(entry.embedding),
        response: JSON.stringify(entry.data),
        model: entry.model,
        tokens_input: entry.tokens.input,
        tokens_output: entry.tokens.output,
        tokens_total: entry.tokens.total,
        timestamp: entry.timestamp,
      });

      // Cleanup old entries
      await this.db.cleanup(this.projectId, kind, this.maxEntries);
    } catch (error) {
      console.error('Semantic cache put error:', error);
    }
  }
}

/**
 * Embed arbitrary text using OpenAI embeddings via existing ProviderClient
 */
export async function embedText(
  provider: ProviderClient,
  text: string,
  model: string = 'text-embedding-3-small' // Will be routed to OpenRouter
): Promise<number[] | null> {
  if (!text.trim() || !provider) return null;
  try {
    // Note: ProviderClient will automatically route this to OpenRouter
    // BUT we must ensure the model exists on OpenRouter if we are using OpenRouter exclusively.
    // 'text-embedding-3-small' is available on OpenRouter via OpenAI.
    const response = await provider.embeddings({
      model,
      input: text,
    });
    const vector = response.data[0]?.embedding;
    if (!vector || !Array.isArray(vector)) return null;
    return vector as number[];
  } catch (error) {
    console.error('Semantic embedding failed:', error);
    // Return null so we just skip semantic caching instead of crashing request
    return null;
  }
}

/**
 * Normalize prompt text to increase semantic cache hit rates.
 * Converts semantically identical queries to a canonical form.
 * 
 * @param text - The raw prompt text to normalize
 * @returns The normalized prompt text
 * 
 * @example
 * normalizePrompt("What's 5 times 3???") // "what is 5 × 3?"
 * normalizePrompt("Please tell me how do I multiply 5 by 3") // "how to multiply 5 × 3"
 */
export function normalizePrompt(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text;
  
  // Convert to lowercase
  normalized = normalized.toLowerCase();
  
  // Remove filler words/phrases (do this before other transformations)
  const fillerPatterns = [
    /\bplease\b/gi,
    /\bkindly\b/gi,
    /\bcould you\b/gi,
    /\bcan you\b/gi,
    /\bwould you\b/gi,
    /\btell me\b/gi,
    /\bi want to know\b/gi,
    /\bi need to know\b/gi,
    /\bi would like to know\b/gi,
    /\bjust\b/gi,
  ];
  for (const pattern of fillerPatterns) {
    normalized = normalized.replace(pattern, '');
  }
  
  // Normalize common question patterns
  normalized = normalized.replace(/\bwhat's\b/g, 'what is');
  normalized = normalized.replace(/\bwhats\b/g, 'what is');
  normalized = normalized.replace(/\bhow do i\b/g, 'how to');
  normalized = normalized.replace(/\bhow can i\b/g, 'how to');
  normalized = normalized.replace(/\bhow would i\b/g, 'how to');
  normalized = normalized.replace(/\bwhere can i\b/g, 'where to');
  normalized = normalized.replace(/\bwhere do i\b/g, 'where to');
  
  // Normalize math operators (word forms to symbols)
  normalized = normalized.replace(/\btimes\b/g, '×');
  normalized = normalized.replace(/\bmultiplied by\b/g, '×');
  normalized = normalized.replace(/\bmultiply(?:ing)?\s+(?:by)?/g, '×');
  normalized = normalized.replace(/\bx\b(?=\s*\d)/g, '×'); // 'x' before a number
  normalized = normalized.replace(/\*(?=\s*\d)/g, '×'); // '*' before a number
  normalized = normalized.replace(/\bdivided by\b/g, '÷');
  normalized = normalized.replace(/\bdivide(?:d)?\s+by/g, '÷');
  normalized = normalized.replace(/\/(?=\s*\d)/g, '÷'); // '/' before a number
  normalized = normalized.replace(/\bplus\b/g, '+');
  normalized = normalized.replace(/\badd(?:ed)?\s+(?:to)?/g, '+');
  normalized = normalized.replace(/\bminus\b/g, '−');
  normalized = normalized.replace(/\bsubtract(?:ed)?\s+(?:from)?/g, '−');
  normalized = normalized.replace(/-(?=\s*\d)/g, '−'); // '-' before a number (use proper minus sign)
  
  // Normalize punctuation - remove excessive question/exclamation marks
  normalized = normalized.replace(/\?{2,}/g, '?');
  normalized = normalized.replace(/!{2,}/g, '!');
  normalized = normalized.replace(/\.{2,}/g, '.');
  
  // Remove extra whitespace (multiple spaces → single space)
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Trim leading/trailing whitespace
  normalized = normalized.trim();
  
  return normalized;
}

/**
 * Flatten chat messages into a single string for embedding.
 * Applies normalization to increase cache hit rates.
 * 
 * @param messages - Array of chat messages
 * @param enableNormalization - Whether to apply prompt normalization (default: true)
 * @returns Flattened and optionally normalized text
 */
export function flattenChatText(messages: ChatMessage[], enableNormalization: boolean = true): string {
  const raw = messages
    .map((m) => `${m.role}:${(m.content || '').trim()}`)
    .join('\n');
  
  if (!enableNormalization) return raw;
  
  const normalized = normalizePrompt(raw);
  
  // Log normalization for debugging/analytics
  if (raw !== normalized) {
    console.log(`[Normalization] Chat text transformed:`);
    console.log(`  Original (${raw.length} chars): "${raw.substring(0, 100)}${raw.length > 100 ? '...' : ''}"`);
    console.log(`  Normalized (${normalized.length} chars): "${normalized.substring(0, 100)}${normalized.length > 100 ? '...' : ''}"`);
  }
  
  return normalized;
}

/**
 * Flatten completion prompt into a single string for embedding.
 * Applies normalization to increase cache hit rates.
 * 
 * @param prompt - Single prompt string or array of prompts
 * @param enableNormalization - Whether to apply prompt normalization (default: true)
 * @returns Flattened and optionally normalized text
 */
export function flattenCompletionText(prompt: string | string[], enableNormalization: boolean = true): string {
  const raw = Array.isArray(prompt) ? prompt.join('\n') : prompt;
  
  if (!enableNormalization) return raw;
  
  const normalized = normalizePrompt(raw);
  
  // Log normalization for debugging/analytics
  if (raw !== normalized) {
    console.log(`[Normalization] Completion text transformed:`);
    console.log(`  Original (${raw.length} chars): "${raw.substring(0, 100)}${raw.length > 100 ? '...' : ''}"`);
    console.log(`  Normalized (${normalized.length} chars): "${normalized.substring(0, 100)}${normalized.length > 100 ? '...' : ''}"`);
  }
  
  return normalized;
}
