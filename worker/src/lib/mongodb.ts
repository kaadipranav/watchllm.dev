/**
 * MongoDB Atlas Data API client for caching
 * Used as alternative to Redis for cost control
 */

interface MongoDBConfig {
  dataApiUrl: string;
  apiKey: string;
  database: string;
  collection: string;
}

export class MongoDBClient {
  private config: MongoDBConfig;

  constructor(config: MongoDBConfig) {
    this.config = config;
  }

  private async request(action: string, body: any) {
    const response = await fetch(`${this.config.dataApiUrl}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'apiKey': this.config.apiKey,
      },
      body: JSON.stringify({
        dataSource: 'Cluster0', // Update with your cluster name
        database: this.config.database,
        collection: this.config.collection,
        ...body,
      }),
    });

    if (!response.ok) {
      throw new Error(`MongoDB API error: ${response.statusText}`);
    }

    return response.json();
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
  return new MongoDBClient({
    dataApiUrl: env.MONGODB_DATA_API_URL,
    apiKey: env.MONGODB_API_KEY,
    database: env.MONGODB_DATABASE || 'watchllm',
    collection: env.MONGODB_COLLECTION || 'cache',
  });
}