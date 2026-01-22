import { Pool, PoolClient } from 'pg';

type D1Result<T> = {
  results?: T[];
};

type D1RunResult = {
  success: boolean;
};

export interface DatabaseAdapterOptions {
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface DatabaseAdapter {
  prepare(sql: string): DatabaseStatement;
  transaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
  close(): Promise<void>;
}

export interface DatabaseTransaction {
  prepare(sql: string): DatabaseStatement;
}

export interface DatabaseStatement {
  bind(...params: unknown[]): DatabaseStatement;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1RunResult>;
}

class PostgresStatement implements DatabaseStatement {
  private poolOrClient: Pool | PoolClient;
  private sql: string;
  private params: unknown[] = [];

  constructor(poolOrClient: Pool | PoolClient, sql: string) {
    this.poolOrClient = poolOrClient;
    this.sql = sql;
  }

  bind(...params: unknown[]) {
    this.params = params;
    return this;
  }

  async all<T>(): Promise<D1Result<T>> {
    const result = await this.poolOrClient.query(this.sql, this.params);
    return { results: result.rows as T[] };
  }

  async run(): Promise<D1RunResult> {
    await this.poolOrClient.query(this.sql, this.params);
    return { success: true };
  }
}

class PostgresTransaction implements DatabaseTransaction {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  prepare(sql: string): DatabaseStatement {
    return new PostgresStatement(this.client, sql);
  }
}

class PostgresDatabaseAdapter implements DatabaseAdapter {
  private pool: Pool;

  constructor(databaseUrl: string, options: DatabaseAdapterOptions = {}) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      max: options.max ?? 10,
      idleTimeoutMillis: options.idleTimeoutMillis ?? 30_000,
      connectionTimeoutMillis: options.connectionTimeoutMillis ?? 10_000,
    });
  }

  prepare(sql: string): DatabaseStatement {
    return new PostgresStatement(this.pool, sql);
  }

  async transaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(new PostgresTransaction(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('[Database] Health check failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export function createDatabaseAdapter(databaseUrl: string, options?: DatabaseAdapterOptions): DatabaseAdapter {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to create database adapter');
  }
  return new PostgresDatabaseAdapter(databaseUrl, options);
}
