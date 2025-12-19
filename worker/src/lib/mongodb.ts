/**
 * MongoDB client for caching using the native driver
 * Cloudflare Workers support the native driver via nodejs_compat and TCP connections
 */

import { MongoClient, Collection, Document } from 'mongodb';

export class MongoDBClient {
  private client: MongoClient;
  private dbName: string;
  private collectionName: string;
  private collection: Collection<Document> | null = null;

  constructor(uri: string, dbName: string, collectionName: string) {
    this.client = new MongoClient(uri, {
      // Best practices for serverless/edge environments
      maxPoolSize: 1,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    });
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<Collection<Document>> {
    if (!this.collection) {
      // MongoClient.connect() is implicit but we can be explicit
      await this.client.connect();
      const db = this.client.db(this.dbName);
      this.collection = db.collection(this.collectionName);

      // Ensure TTL index if needed - though we'll handle expiresAt in our logic
      // Ideally this is done once at setup, not every request
    }
    return this.collection;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const collection = await this.getCollection();
      const document = await collection.findOne({ _id: key as any });

      if (!document) return null;

      // Check for manual TTL if implemented
      if (document.expiresAt && new Date(document.expiresAt as string) < new Date()) {
        await this.delete(key);
        return null;
      }

      return document as unknown as T;
    } catch (error) {
      console.error('MongoDB get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      const doc = { ...value };

      if (ttlSeconds) {
        doc.expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      }

      await collection.updateOne(
        { _id: key as any },
        { $set: doc },
        { upsert: true }
      );
      return true;
    } catch (error) {
      console.error('MongoDB set error:', error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const collection = await this.getCollection();
      await collection.deleteOne({ _id: key as any });
      return true;
    } catch (error) {
      console.error('MongoDB delete error:', error);
      return false;
    }
  }

  // Cleanup connections if worker is shutting down (though unlikely to be called in ephemeral worker)
  async close() {
    await this.client.close();
  }
}

export function createMongoDBClient(env: any): MongoDBClient {
  // Temporarily disabled due to Cloudflare Workers subrequest limits with native driver
  console.warn('MongoDB disabled - semantic caching unavailable');
  return null as any;

  /* Original code - re-enable when we have HTTP-based solution
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not configured, caching will be disabled');
    return null as any;
  }

  return new MongoDBClient(
    uri,
    env.MONGODB_DATABASE || 'watchllm',
    env.MONGODB_COLLECTION || 'cache'
  );
  */
}