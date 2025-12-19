/**
 * MongoDB Atlas Data API client for caching
 * Used as alternative to Redis for cost control
 */

interface MongoDBConfig {
  dataApiUrl: string;
  apiKey: string;
  database: string;
  collection: string;
  dataSource?: string; // Cluster name, defaults to 'Cluster0'
}

export class MongoDBClient {
  private config: MongoDBConfig;

  constructor(config: MongoDBConfig) {
    this.config = {
      dataSource: 'Cluster0',
      ...config
    };
  }

  private async request(action: string, body: any) {
    const url = `${this.config.dataApiUrl}/action/${action}`;
    console.log(`MongoDB ${action} request to:`, url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'apiKey': this.config.apiKey,
      },
      body: JSON.stringify({
        dataSource: this.config.dataSource,
        database: this.config.database,
        collection: this.config.collection,
        ...body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MongoDB API error ${response.status}:`, errorText);
      throw new Error(`MongoDB API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`MongoDB ${action} result:`, result);
    return result;
  }

  async get<T>(key: string): Promise<T | null> {
    const result = await this.request('findOne', {
      filter: { _id: key },
    }) as { document: T | null };
    return result.document || null;
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    const doc = { _id: key, ...value };
    if (ttlSeconds) {
      doc.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    }

    // Use insertOne, but for updates, we need to handle upsert
    try {
      await this.request('insertOne', {
        document: doc,
      });
    } catch (error) {
      // If duplicate key, update
      await this.request('updateOne', {
        filter: { _id: key },
        update: { $set: doc },
        upsert: true,
      });
    }
    return true;
  }

  async delete(key: string): Promise<boolean> {
    await this.request('deleteOne', {
      filter: { _id: key },
    });
    return true;
  }
}

export function createMongoDBClient(env: any): MongoDBClient {
  if (!env.MONGODB_DATA_API_URL || !env.MONGODB_API_KEY) {
    console.warn('MongoDB not configured, caching will be disabled');
    return null as any; // Will cause errors that disable caching gracefully
  }

  return new MongoDBClient({
    dataApiUrl: env.MONGODB_DATA_API_URL,
    apiKey: env.MONGODB_API_KEY,
    database: env.MONGODB_DATABASE || 'watchllm',
    collection: env.MONGODB_COLLECTION || 'cache',
    dataSource: env.MONGODB_DATA_SOURCE || 'Cluster0',
  });
}