import type { Env, ObservabilityQueueMessage } from '../types';
import { createClickHouseClient } from '../lib/clickhouse';
import type { ClickHouseClient } from '@clickhouse/client-web';
import { Pool } from 'pg';
import Redis from 'ioredis';

type D1Result<T> = {
  results?: T[];
};

type D1RunResult = {
  success: boolean;
};

class PostgresD1Statement {
  private sql: string;
  private pool: Pool;
  private params: unknown[] = [];

  constructor(pool: Pool, sql: string) {
    this.pool = pool;
    this.sql = sql;
  }

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async all<T>(): Promise<D1Result<T>> {
    const result = await this.pool.query(this.sql, this.params);
    return { results: result.rows as T[] };
  }

  async run(): Promise<D1RunResult> {
    await this.pool.query(this.sql, this.params);
    return { success: true };
  }
}

class PostgresD1Adapter {
  private pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({ connectionString: databaseUrl });
  }

  prepare(sql: string) {
    return new PostgresD1Statement(this.pool, sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export class RedisKVAdapter {
  private client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value == null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, payload);
    }
    return true;
  }

  async del(key: string): Promise<boolean> {
    const result = await this.client.del(key);
    return result > 0;
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result > 0;
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export type QueueHandler<T> = (messages: T[]) => Promise<void>;

export interface QueueLike<T> {
  send(message: T): Promise<void>;
  sendBatch?(messages: T[]): Promise<void>;
}

class InMemoryQueue<T> implements QueueLike<T> {
  private buffer: T[] = [];
  private handler: QueueHandler<T>;
  private batchSize: number;
  private flushIntervalMs: number;
  private timer?: NodeJS.Timeout;

  constructor(handler: QueueHandler<T>, batchSize: number, flushIntervalMs: number) {
    this.handler = handler;
    this.batchSize = batchSize;
    this.flushIntervalMs = flushIntervalMs;
    this.timer = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  async send(message: T): Promise<void> {
    this.buffer.push(message);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  async sendBatch(messages: T[]): Promise<void> {
    this.buffer.push(...messages);
    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    await this.handler(batch);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}

export interface SelfHostedEnv extends Env {
  DATABASE_URL?: string;
  REDIS_URL?: string;
}

export interface SelfHostedEnvOptions {
  queueHandler?: QueueHandler<ObservabilityQueueMessage>;
  queueBatchSize?: number;
  queueFlushIntervalMs?: number;
}

export function createPostgresD1Adapter(databaseUrl: string) {
  return new PostgresD1Adapter(databaseUrl) as unknown as D1Database;
}

export function createRedisKVAdapter(redisUrl: string) {
  return new RedisKVAdapter(redisUrl);
}

export function createClickHouseAdapter(env: Env): ClickHouseClient | null {
  try {
    if (!env.CLICKHOUSE_HOST) return null;
    return createClickHouseClient(env);
  } catch (error) {
    console.warn('[ClickHouse] Failed to initialize client:', error);
    return null;
  }
}

export function createInMemoryQueue<T>(
  handler: QueueHandler<T>,
  batchSize: number = 100,
  flushIntervalMs: number = 1000
): QueueLike<T> {
  return new InMemoryQueue<T>(handler, batchSize, flushIntervalMs);
}

function requiredEnv(name: string, fallback: string = ''): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    console.warn(`[SelfHostedEnv] Missing required env: ${name}`);
  }
  return value;
}

export function createSelfHostedEnv(options: SelfHostedEnvOptions = {}): SelfHostedEnv {
  const env: SelfHostedEnv = {
    SUPABASE_URL: requiredEnv('SUPABASE_URL'),
    SUPABASE_ANON_KEY: requiredEnv('SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    OPENAI_API_KEY: requiredEnv('OPENAI_API_KEY'),
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    APP_URL: process.env.APP_URL,
    EMAIL_TRIGGER_SECRET: process.env.EMAIL_TRIGGER_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SEMANTIC_CACHE_THRESHOLD: process.env.SEMANTIC_CACHE_THRESHOLD,
    ENCRYPTION_MASTER_SECRET: requiredEnv('ENCRYPTION_MASTER_SECRET'),
    CLICKHOUSE_HOST: process.env.CLICKHOUSE_HOST,
    CLICKHOUSE_PORT: process.env.CLICKHOUSE_PORT,
    CLICKHOUSE_USER: process.env.CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD: process.env.CLICKHOUSE_PASSWORD,
    CLICKHOUSE_DATABASE: process.env.CLICKHOUSE_DATABASE,
    CLICKHOUSE_SSL: process.env.CLICKHOUSE_SSL,
    DATABASE_URL: process.env.DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL,
  };

  if (env.DATABASE_URL) {
    env.DB = createPostgresD1Adapter(env.DATABASE_URL);
  }

  if (options.queueHandler) {
    env.OBSERVABILITY_QUEUE = createInMemoryQueue(
      options.queueHandler,
      options.queueBatchSize,
      options.queueFlushIntervalMs
    ) as Queue<ObservabilityQueueMessage>;
  }

  return env;
}
