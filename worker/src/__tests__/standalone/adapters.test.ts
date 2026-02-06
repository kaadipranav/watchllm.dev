import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { createClient } from '@clickhouse/client';
import { createDatabaseAdapter, DatabaseAdapter } from '../../adapters/database';
import { createRedisAdapter, RedisAdapter } from '../../adapters/redis';
import { createClickHouseAdapter } from '../../adapters/clickhouse';
import { createQueueAdapter, QueueAdapter } from '../../adapters/queue';

const hasDB = !!process.env.DATABASE_URL;
const hasRedis = !!process.env.REDIS_URL;

describe('Standalone Adapters', () => {
  describe.skipIf(!hasDB)('PostgresD1Adapter', () => {
    let pool: Pool;
    let adapter: DatabaseAdapter;

    beforeAll(async () => {
      // Use test database URL from environment
      const dbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
      if (!dbUrl) {
        console.warn('Skipping PostgreSQL tests: DATABASE_URL not set');
        return;
      }

      pool = new Pool({ connectionString: dbUrl, max: 5 });
      adapter = createDatabaseAdapter(dbUrl);

      // Create test table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS test_users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    });

    afterAll(async () => {
      if (pool) {
        await pool.query('DROP TABLE IF EXISTS test_users');
        await pool.end();
      }
    });

    it('should prepare and execute a query', async () => {
      if (!adapter) return; // Skip if no DB

      const stmt = adapter.prepare(
        'INSERT INTO test_users (name, email) VALUES ($1, $2) RETURNING *'
      );
      const result = await stmt.bind('Alice', 'alice@test.com').all();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results?.[0]).toMatchObject({
        name: 'Alice',
        email: 'alice@test.com',
      });
    });

    it('should handle SELECT queries', async () => {
      if (!adapter) return;

      const stmt = adapter.prepare('SELECT * FROM test_users WHERE email = $1');
      const result = await stmt.bind('alice@test.com').all();

      expect(result.success).toBe(true);
      expect(result.results?.[0]).toMatchObject({
        name: 'Alice',
        email: 'alice@test.com',
      });
    });

    it('should support transactions', async () => {
      if (!adapter) return;

      const result = await adapter.batch([
        adapter.prepare('INSERT INTO test_users (name, email) VALUES ($1, $2)').bind('Bob', 'bob@test.com'),
        adapter.prepare('INSERT INTO test_users (name, email) VALUES ($1, $2)').bind('Charlie', 'charlie@test.com'),
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].success).toBe(true);
      expect(result[1].success).toBe(true);
    });

    it('should report healthy connection', async () => {
      if (!adapter) return;

      const healthy = await adapter.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  describe.skipIf(!hasRedis)('IORedisAdapter', () => {
    let adapter: RedisAdapter;
    let redisUrl: string;

    beforeAll(async () => {
      redisUrl = process.env.TEST_REDIS_URL || process.env.REDIS_URL || '';
      if (!redisUrl) {
        console.warn('Skipping Redis tests: REDIS_URL not set');
        return;
      }

      adapter = createRedisAdapter(redisUrl);

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    afterAll(async () => {
      if (adapter) {
        await adapter.disconnect();
      }
    });

    it('should set and get a string value', async () => {
      if (!adapter) return;

      await adapter.set('test:string', 'hello world');
      const value = await adapter.get('test:string');

      expect(value).toBe('hello world');
    });

    it('should set and get a JSON value', async () => {
      if (!adapter) return;

      const obj = { name: 'Alice', age: 30 };
      await adapter.set('test:json', obj);
      const value = await adapter.get<typeof obj>('test:json');

      expect(value).toEqual(obj);
    });

    it('should respect TTL expiration', async () => {
      if (!adapter) return;

      await adapter.set('test:ttl', 'expiring', { ex: 1 });
      const value1 = await adapter.get('test:ttl');
      expect(value1).toBe('expiring');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      const value2 = await adapter.get('test:ttl');
      expect(value2).toBeNull();
    });

    it('should increment counters', async () => {
      if (!adapter) return;

      await adapter.set('test:counter', 0);
      const val1 = await adapter.incr('test:counter');
      const val2 = await adapter.incr('test:counter');

      expect(val1).toBe(1);
      expect(val2).toBe(2);
    });

    it('should delete keys', async () => {
      if (!adapter) return;

      await adapter.set('test:delete', 'value');
      await adapter.del('test:delete');
      const value = await adapter.get('test:delete');

      expect(value).toBeNull();
    });

    it('should check key existence', async () => {
      if (!adapter) return;

      await adapter.set('test:exists', 'value');
      const exists1 = await adapter.exists('test:exists');
      const exists2 = await adapter.exists('test:nonexistent');

      expect(exists1).toBe(1);
      expect(exists2).toBe(0);
    });
  });

  describe('ClickHouseAdapter', () => {
    let adapter: ReturnType<typeof createClickHouseAdapter> | null;

    beforeAll(() => {
      const host = process.env.TEST_CLICKHOUSE_HOST || process.env.CLICKHOUSE_HOST;
      if (!host) {
        console.warn('Skipping ClickHouse tests: CLICKHOUSE_HOST not set');
        return;
      }

      adapter = createClickHouseAdapter({
        host,
        database: process.env.CLICKHOUSE_DATABASE || 'watchllm',
        username: process.env.CLICKHOUSE_USERNAME || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
      });
    });

    it('should ping successfully', async () => {
      if (!adapter) return;

      const result = await adapter.ping();
      expect(result).toBe(true);
    });

    it('should insert events', async () => {
      if (!adapter) return;

      const events = [
        {
          event_id: `test_${Date.now()}_1`,
          timestamp: new Date().toISOString(),
          project_id: 'test_project',
          event_type: 'api_request',
          model: 'gpt-4',
        },
        {
          event_id: `test_${Date.now()}_2`,
          timestamp: new Date().toISOString(),
          project_id: 'test_project',
          event_type: 'api_request',
          model: 'claude-3',
        },
      ];

      await expect(adapter.insert('api_requests', events)).resolves.not.toThrow();
    });

    it('should query events', async () => {
      if (!adapter) return;

      const result = await adapter.query(
        'SELECT COUNT(*) as count FROM api_requests WHERE project_id = $1',
        ['test_project']
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('InMemoryQueueAdapter', () => {
    it('should batch and process messages', async () => {
      const processedBatches: Array<Array<unknown>> = [];

      const adapter = createQueueAdapter(async (batch) => {
        processedBatches.push([...batch]);
      }, {
        batchSize: 3,
        flushIntervalMs: 100,
      });

      // Send messages
      await adapter.send({ id: 1 });
      await adapter.send({ id: 2 });
      await adapter.send({ id: 3 }); // Should trigger batch

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toHaveLength(3);

      adapter.stop();
    });

    it('should flush on interval even if batch not full', async () => {
      const processedBatches: Array<Array<unknown>> = [];

      const adapter = createQueueAdapter(async (batch) => {
        processedBatches.push([...batch]);
      }, {
        batchSize: 10,
        flushIntervalMs: 100,
      });

      // Send only 2 messages
      await adapter.send({ id: 1 });
      await adapter.send({ id: 2 });

      // Wait for interval flush
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toHaveLength(2);

      adapter.stop();
    });

    it('should handle sendBatch', async () => {
      const processedBatches: Array<Array<unknown>> = [];

      const adapter = createQueueAdapter(async (batch) => {
        processedBatches.push([...batch]);
      }, {
        batchSize: 5,
        flushIntervalMs: 1000,
      });

      await adapter.sendBatch([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(processedBatches).toHaveLength(1);
      expect(processedBatches[0]).toHaveLength(3);

      adapter.stop();
    });

    it('should retry failed processing', async () => {
      let attemptCount = 0;
      const adapter = createQueueAdapter(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Processing failed');
        }
      }, {
        batchSize: 1,
        flushIntervalMs: 50,
        maxRetries: 3,
      });

      await adapter.send({ id: 1 });

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(attemptCount).toBeGreaterThanOrEqual(3);

      adapter.stop();
    });
  });
});
