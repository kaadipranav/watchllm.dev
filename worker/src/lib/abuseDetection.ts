/**
 * Simple abuse detection to throttle excessive identical requests.
 */
import type { RedisClient } from './redis';

const ONE_HOUR_SECONDS = 3600;

export async function isAbusivePattern(
  redis: RedisClient,
  projectId: string,
  cacheKey: string,
  threshold: number = 1000
): Promise<boolean> {
  const key = `abuse:${projectId}:${cacheKey}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ONE_HOUR_SECONDS);
  }
  return count > threshold;
}
