/**
 * Semantic cache backed by MongoDB Atlas (vector similarity in-worker)
 * - Embeds text with OpenAI embeddings
 * - Performs cosine similarity search over a small per-project index
 */

import type { MongoDBClient } from './mongodb';
import type {
  ChatCompletionResponse,
  CompletionResponse,
  ChatMessage,
} from '../types';
import type { ProviderClient } from './providers';

const SEM_PREFIX = 'watchllm:sem:';
const DEFAULT_THRESHOLD = 0.95;
const MAX_ENTRIES = 50; // cap to keep payload small in Redis

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

function semanticKey(kind: SemanticKind, projectId: string): string {
  return `${SEM_PREFIX}${kind}:${projectId}`;
}

export class SemanticCache {
  private db: MongoDBClient;
  private projectId: string;
  private maxEntries: number;

  constructor(db: MongoDBClient, projectId: string, maxEntries: number = MAX_ENTRIES) {
    this.db = db;
    this.projectId = projectId;
    this.maxEntries = maxEntries;
  }

  private async load<T>(kind: SemanticKind): Promise<SemanticCacheEntry<T>[]> {
    // For MongoDB, we store all entries in one document per project/kind
    const key = semanticKey(kind, this.projectId);
    const doc = await this.db.get<{ entries: SemanticCacheEntry<T>[] }>(key);
    return doc?.entries ?? [];
  }

  private async save<T>(kind: SemanticKind, entries: SemanticCacheEntry<T>[]): Promise<void> {
    const key = semanticKey(kind, this.projectId);
    await this.db.set(key, { entries: entries.slice(0, this.maxEntries) });
  }

  async findSimilar<T>(
    kind: SemanticKind,
    embedding: number[],
    threshold: number = DEFAULT_THRESHOLD
  ): Promise<SemanticHit<T> | null> {
    const entries = await this.load<T>(kind);
    let best: SemanticHit<T> | null = null;
    for (const entry of entries) {
      const sim = cosineSimilarity(embedding, entry.embedding);
      if (sim >= threshold && (!best || sim > best.similarity)) {
        best = { entry, similarity: sim };
      }
    }
    return best;
  }

  async put<T>(kind: SemanticKind, entry: SemanticCacheEntry<T>): Promise<void> {
    const entries = await this.load<T>(kind);
    const updated = [entry, ...entries].slice(0, this.maxEntries);
    await this.save(kind, updated);
  }
}

/**
 * Embed arbitrary text using OpenAI embeddings via existing ProviderClient
 */
export async function embedText(
  provider: ProviderClient,
  text: string,
  model: string = 'text-embedding-3-small'
): Promise<number[] | null> {
  if (!text.trim()) return null;
  try {
    const response = await provider.embeddings({
      model,
      input: text,
    });
    const vector = response.data[0]?.embedding;
    if (!vector || !Array.isArray(vector)) return null;
    return vector as number[];
  } catch (error) {
    console.error('Semantic embedding failed:', error);
    return null;
  }
}

export function flattenChatText(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role}:${(m.content || '').trim()}`)
    .join('\n');
}

export function flattenCompletionText(prompt: string | string[]): string {
  return Array.isArray(prompt) ? prompt.join('\n') : prompt;
}
