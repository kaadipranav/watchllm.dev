/**
 * Request coalescing helper to prevent duplicate upstream calls.
 *
 * Strategy:
 * - Leader acquires a short lock in Redis (SET NX).
 * - Followers wait for cache population by polling cache via provided callback.
 * - If leader appears stuck (lock expires and still no cache), a follower attempts to become leader.
 * - Waiters are counted to measure requests saved and peak group size.
 */

import { RedisClient } from './redis';

export interface CoalesceOptions<T> {
  redis: RedisClient;
  key: string; // unique per normalized request (include project id)
  lockTtlSeconds?: number; // lock TTL to avoid stuck locks
  waitTimeoutMs?: number; // how long followers wait before attempting takeover
  pollIntervalMs?: number; // follower polling interval
  checkCached: () => Promise<T | null>; // how followers detect cached result
  execute: () => Promise<T>; // leader work (call provider + cache)
}

export interface CoalesceResult<T> {
  data: T;
  fromCache: boolean; // true when follower served from cache
  coalescedWaiters: number; // number of queued followers served by this leader
}

const defaultOptions = {
  lockTtlSeconds: 30,
  waitTimeoutMs: 12000,
  pollIntervalMs: 120,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRequestCoalescing<T>(opts: CoalesceOptions<T>): Promise<CoalesceResult<T>> {
  const lockTtlSeconds = opts.lockTtlSeconds ?? defaultOptions.lockTtlSeconds;
  const waitTimeoutMs = opts.waitTimeoutMs ?? defaultOptions.waitTimeoutMs;
  const pollIntervalMs = opts.pollIntervalMs ?? defaultOptions.pollIntervalMs;
  const lockKey = `inflight:${opts.key}`;
  const waiterKey = `inflight:${opts.key}:waiters`;

  // Try to become leader
  const acquired = await opts.redis.setnx(lockKey, Date.now(), lockTtlSeconds);
  if (acquired) {
    // Initialize waiters counter
    await opts.redis.set(waiterKey, 0, lockTtlSeconds);

    const data = await opts.execute();
    const waitersRaw = await opts.redis.get<number | string>(waiterKey);
    const waiters = Number(waitersRaw || 0);

    // Cleanup
    await opts.redis.del(lockKey);
    await opts.redis.del(waiterKey);

    return { data, fromCache: false, coalescedWaiters: waiters };
  }

  // Follower path
  await opts.redis.incr(waiterKey);
  await opts.redis.expire(waiterKey, lockTtlSeconds);

  const start = Date.now();
  while (Date.now() - start < waitTimeoutMs) {
    const cached = await opts.checkCached();
    if (cached) {
      return { data: cached, fromCache: true, coalescedWaiters: 0 };
    }

    const ttl = await opts.redis.ttl(lockKey);
    if (ttl <= 0) {
      break; // lock expired, try to take over
    }

    await sleep(pollIntervalMs);
  }

  // Attempt takeover to avoid indefinite waiting
  const takeover = await opts.redis.setnx(lockKey, Date.now(), lockTtlSeconds);
  if (takeover) {
    await opts.redis.set(waiterKey, 0, lockTtlSeconds);
    const data = await opts.execute();
    const waitersRaw = await opts.redis.get<number | string>(waiterKey);
    const waiters = Number(waitersRaw || 0);
    await opts.redis.del(lockKey);
    await opts.redis.del(waiterKey);
    return { data, fromCache: false, coalescedWaiters: waiters };
  }

  // Fallback: return cached if available, otherwise perform independently (to unblock)
  const cachedFallback = await opts.checkCached();
  if (cachedFallback) {
    return { data: cachedFallback, fromCache: true, coalescedWaiters: 0 };
  }

  const data = await opts.execute();
  return { data, fromCache: false, coalescedWaiters: 0 };
}
