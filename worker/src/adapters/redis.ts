import Redis from 'ioredis';

export interface RedisAdapterOptions {
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  connectionName?: string;
}

export interface RedisAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<boolean>;
  del(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  disconnect(): Promise<void>;
}

class IORedisAdapter implements RedisAdapter {
  private client: Redis;

  constructor(redisUrl: string, options: RedisAdapterOptions = {}) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: options.maxRetriesPerRequest ?? 2,
      enableReadyCheck: options.enableReadyCheck ?? true,
      connectionName: options.connectionName ?? 'watchllm-redis',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value == null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      console.error('[Redis] get failed:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<boolean> {
    try {
      const payload = typeof value === 'string' ? value : JSON.stringify(value);
      if (options?.ex) {
        await this.client.set(key, payload, 'EX', options.ex);
      } else {
        await this.client.set(key, payload);
      }
      return true;
    } catch (error) {
      console.error('[Redis] set failed:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error('[Redis] del failed:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result > 0;
    } catch (error) {
      console.error('[Redis] exists failed:', error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('[Redis] incr failed:', error);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1;
    } catch (error) {
      console.error('[Redis] expire failed:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error('[Redis] ttl failed:', error);
      return -2;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      console.error('[Redis] disconnect failed:', error);
    }
  }
}

export function createRedisAdapter(redisUrl: string, options?: RedisAdapterOptions): RedisAdapter {
  if (!redisUrl) {
    throw new Error('REDIS_URL is required to create redis adapter');
  }
  return new IORedisAdapter(redisUrl, options);
}
