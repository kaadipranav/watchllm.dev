import type { Env } from "../types";

export interface VectorHit<T> {
  data: T;
  similarity: number;
  model: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
}

export interface VectorStore {
  upsertEmbedding<T extends Record<string, unknown>>(
    projectId: string,
    kind: string,
    embedding: number[],
    data: T,
    meta: {
      model: string;
      tokensInput: number;
      tokensOutput: number;
    }
  ): Promise<void>;

  querySimilar<T = any>(
    projectId: string,
    kind: string,
    embedding: number[],
    threshold: number,
    limit: number
  ): Promise<VectorHit<T>[]>;
}

export function createVectorStore(_env: Env): VectorStore | null {
  return null;
}
