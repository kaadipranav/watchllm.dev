/**
 * VectorStore abstraction – allows WatchLLM to switch from the dev-only D1 cache
 * to a production-grade pgvector (Supabase Postgres) or any other ANN backend.
 *
 * NOTE: pgvector is available on Supabase free tier (GitHub Student Pack credit)
 * and is the default production implementation.
 */

import type { Env } from "../types";
import { createSupabaseClient } from "./supabase";

export interface VectorHit<T> {
  data: T;
  similarity: number; // 0-1 (1 == identical)
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

/**
 * pgvector implementation using Supabase PostgREST interface
 * Requires table `semantic_cache_pgvector` with columns:
 *   id uuid primary key
 *   project_id uuid
 *   kind text
 *   embedding vector(1536)
 *   data jsonb
 *   model text
 *   tokens_input int
 *   tokens_output int
 *   created_at timestamptz default now()
 *
 * Index:  USING hnsw (embedding vector_cosine_ops)
 */
export class PgVectorStore implements VectorStore {
  private supabase = createSupabaseClient(this.env);
  constructor(private env: Env) {}

  async upsertEmbedding<T extends Record<string, unknown>>(
    projectId: string,
    kind: string,
    embedding: number[],
    data: T,
    meta: { model: string; tokensInput: number; tokensOutput: number }
  ): Promise<void> {
    try {
      await this.supabase.from("semantic_cache_pgvector").insert({
        project_id: projectId,
        kind,
        embedding,
        data,
        model: meta.model,
        tokens_input: meta.tokensInput,
        tokens_output: meta.tokensOutput,
      });
    } catch (err) {
      console.error("pgvector upsert failed", err);
    }
  }

  async querySimilar<T = any>(
    projectId: string,
    kind: string,
    embedding: number[],
    threshold: number,
    limit: number
  ): Promise<VectorHit<T>[]> {
    try {
      // Supabase PostgREST: order by cosine distance (<->) asc
      const { data, error } = await this.supabase
        .from("semantic_cache_pgvector")
        .select(
          "data, model, tokens_input, tokens_output, embedding <-> $1 as distance",
          {
            head: false,
            count: "exact",
          }
        )
        .eq("project_id", projectId)
        .eq("kind", kind)
        .order("distance")
        .limit(limit)
        .single(false)
        .execute({ params: [embedding] } as any);

      if (error || !data) return [];

      return (data as any[])
        .filter((row) => row.distance <= 1 - threshold)
        .map((row) => ({
          data: row.data as T,
          similarity: 1 - row.distance,
          model: row.model,
          tokens: {
            input: row.tokens_input,
            output: row.tokens_output,
            total: row.tokens_input + row.tokens_output,
          },
        }));
    } catch (err) {
      console.error("pgvector query failed", err);
      return [];
    }
  }
}

/**
 * Factory – returns PgVectorStore if env has SUPABASE_URL + pgvector enabled.
 */
export function createVectorStore(env: Env): VectorStore | null {
  if (env.SUPABASE_URL && env.PG_VECTOR_ENABLED === "true") {
    return new PgVectorStore(env);
  }
  return null;
}
