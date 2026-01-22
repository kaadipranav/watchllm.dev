import { serve } from '@hono/node-server';
import type { ExecutionContext } from '@cloudflare/workers-types';
import type { ObservabilityEvent } from '../packages/shared/src/observability/types';
import type { ObservabilityQueueMessage } from './src/types';
import worker from './src/index';
import { createSelfHostedEnv } from './src/adapters/env-adapter';
import { createRedisAdapter } from './src/adapters/redis';
import { createClickHouseAdapter } from './src/adapters/clickhouse';
import { createDatabaseAdapter } from './src/adapters/database';
import { insertEventsBatch } from './src/lib/clickhouse';

const port = Number(process.env.WORKER_PORT || 8080);

function createExecutionContext(): ExecutionContext {
  return {
    waitUntil: (promise: Promise<any>) => {
      promise.catch((error) => console.error('[Standalone] waitUntil error:', error));
    },
    passThroughOnException: () => {
      // no-op
    },
  } as ExecutionContext;
}

async function runStartupHealthChecks() {
  const checks: Array<Promise<boolean>> = [];

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    const db = createDatabaseAdapter(databaseUrl);
    checks.push(db.healthCheck().finally(() => db.close()));
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const redis = createRedisAdapter(redisUrl);
    checks.push(redis.ttl('watchllm:health').then(() => true).catch(() => false).finally(() => redis.disconnect()));
  }

  const clickhouse = createClickHouseAdapter({
    host: process.env.CLICKHOUSE_HOST,
    port: process.env.CLICKHOUSE_PORT,
    username: process.env.CLICKHOUSE_USER,
    password: process.env.CLICKHOUSE_PASSWORD,
    database: process.env.CLICKHOUSE_DATABASE,
    ssl: process.env.CLICKHOUSE_SSL,
  });

  if (clickhouse) {
    checks.push(clickhouse.ping().finally(() => clickhouse.close()));
  }

  const results = await Promise.allSettled(checks);
  const failed = results.filter((result) => result.status === 'fulfilled' && result.value === false);

  if (failed.length > 0) {
    console.warn('[Standalone] One or more startup health checks failed');
  } else {
    console.log('[Standalone] Startup health checks passed');
  }
}

async function main() {
  const env = createSelfHostedEnv({
    queueHandler: async (messages: ObservabilityQueueMessage[]) => {
      const events = messages.map((message) => message.payload as ObservabilityEvent);
      try {
        await insertEventsBatch(env, events);
      } catch (error) {
        console.error('[Standalone] Failed to insert observability batch:', error);
      }
    },
  });

  await runStartupHealthChecks();

  const ctx = createExecutionContext();

  const fetch = async (request: Request) => {
    const start = Date.now();
    const response = await worker.fetch(request, env, ctx);
    const durationMs = Date.now() - start;
    console.log(`[Standalone] ${request.method} ${new URL(request.url).pathname} -> ${response.status} (${durationMs}ms)`);
    return response;
  };

  const server = serve({
    fetch,
    port,
  });

  console.log(`[Standalone] Worker server running on http://localhost:${port}`);

  const shutdown = async () => {
    console.log('[Standalone] Shutting down...');
    server.close();
    if (env.OBSERVABILITY_QUEUE && 'stop' in env.OBSERVABILITY_QUEUE) {
      (env.OBSERVABILITY_QUEUE as any).stop();
    }
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((error) => {
  console.error('[Standalone] Fatal error:', error);
  process.exit(1);
});
