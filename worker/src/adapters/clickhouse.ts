import { createClient, type ClickHouseClient } from '@clickhouse/client';

export interface ClickHouseConfig {
  host?: string;
  port?: string | number;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | string;
}

export interface ClickHouseAdapter {
  insert(table: string, rows: Record<string, unknown>[]): Promise<void>;
  query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

class ClickHouseAdapterImpl implements ClickHouseAdapter {
  private client: ClickHouseClient;

  constructor(config: Required<ClickHouseConfig>) {
    const protocol = config.ssl === true || config.ssl === 'true' ? 'https' : 'http';
    const url = `${protocol}://${config.host}:${config.port}`;

    this.client = createClient({
      url,
      username: config.username,
      password: config.password,
      database: config.database,
      application: 'watchllm-standalone',
    });
  }

  async insert(table: string, rows: Record<string, unknown>[]): Promise<void> {
    if (rows.length === 0) return;
    await this.client.insert({
      table,
      values: rows,
      format: 'JSONEachRow',
    });
  }

  async query<T>(sql: string, params?: Record<string, unknown>): Promise<T[]> {
    const result = await this.client.query({
      query: sql,
      query_params: params,
      format: 'JSONEachRow',
    });

    return await result.json<T>();
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error('[ClickHouse] Ping failed:', error);
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

export function createClickHouseAdapter(config: ClickHouseConfig): ClickHouseAdapter | null {
  if (!config.host) {
    return null;
  }

  return new ClickHouseAdapterImpl({
    host: config.host,
    port: config.port ?? 8123,
    username: config.username ?? 'default',
    password: config.password ?? '',
    database: config.database ?? 'watchllm',
    ssl: config.ssl ?? false,
  });
}
