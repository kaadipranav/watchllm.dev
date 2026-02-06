/**
 * D1 Database client for semantic caching
 * Replaces MongoDB to avoid Cloudflare Workers subrequest limits
 */

export interface D1CacheEntry {
    id: string;
    project_id: string;
    kind: string;
    text: string;
    embedding: string; // JSON stringified array
    response: string; // JSON stringified response
    model: string;
    tokens_input: number;
    tokens_output: number;
    tokens_total: number;
    timestamp: number;
    expires_at: number | null; // Unix timestamp in ms, null = never expires
}

export interface CacheQueryOptions {
    ttlSeconds?: number | null; // Filter entries that would be expired with this TTL
    includeExpired?: boolean; // Whether to include expired entries (default: false)
}

export class D1Client {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    /**
     * Get all cache entries for a project/kind, filtering out expired entries
     */
    async getEntries(projectId: string, kind: string, options: CacheQueryOptions = {}): Promise<D1CacheEntry[]> {
        try {
            const now = Date.now();
            const includeExpired = options.includeExpired ?? false;
            
            // Build query based on whether we should include expired entries
            let query: string;
            let bindings: (string | number)[];
            
            if (includeExpired) {
                query = 'SELECT * FROM semantic_cache WHERE project_id = ? AND kind = ? ORDER BY timestamp DESC LIMIT 50';
                bindings = [projectId, kind];
            } else {
                // Exclude entries where expires_at is set and is in the past
                query = `
                    SELECT * FROM semantic_cache 
                    WHERE project_id = ? AND kind = ? 
                    AND (expires_at IS NULL OR expires_at > ?)
                    ORDER BY timestamp DESC LIMIT 50
                `;
                bindings = [projectId, kind, now];
            }
            
            const result = await this.db
                .prepare(query)
                .bind(...bindings)
                .all<D1CacheEntry>();

            return result.results || [];
        } catch (error) {
            console.error('D1 getEntries error:', error);
            return [];
        }
    }

    /**
     * Save a new cache entry with optional expiration
     */
    async saveEntry(entry: Omit<D1CacheEntry, 'created_at' | 'expires_at'>, ttlSeconds?: number | null): Promise<boolean> {
        try {
            // Calculate expires_at: null = never expire, 0 = never expire
            const expiresAt = (ttlSeconds === null || ttlSeconds === undefined || ttlSeconds === 0) 
                ? null 
                : entry.timestamp + (ttlSeconds * 1000);
            
            await this.db
                .prepare(`
          INSERT INTO semantic_cache 
          (id, project_id, kind, text, embedding, response, model, tokens_input, tokens_output, tokens_total, timestamp, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
                .bind(
                    entry.id,
                    entry.project_id,
                    entry.kind,
                    entry.text,
                    entry.embedding,
                    entry.response,
                    entry.model,
                    entry.tokens_input,
                    entry.tokens_output,
                    entry.tokens_total,
                    entry.timestamp,
                    expiresAt
                )
                .run();

            return true;
        } catch (error) {
            console.error('D1 saveEntry error:', error);
            return false;
        }
    }

    /**
     * Delete old entries (cleanup by count and expiration)
     */
    async cleanup(projectId: string, kind: string, maxEntries: number = 50): Promise<{ deleted: number; expiredDeleted: number }> {
        const result = { deleted: 0, expiredDeleted: 0 };
        
        try {
            // First, delete expired entries
            const expiredResult = await this.db
                .prepare(`
                    DELETE FROM semantic_cache 
                    WHERE project_id = ? AND kind = ? 
                    AND expires_at IS NOT NULL AND expires_at < ?
                `)
                .bind(projectId, kind, Date.now())
                .run();
            
            result.expiredDeleted = expiredResult.meta?.changes ?? 0;
            
            // Then, keep only the most recent maxEntries
            const countResult = await this.db
                .prepare(`
          DELETE FROM semantic_cache 
          WHERE project_id = ? AND kind = ? AND id NOT IN (
            SELECT id FROM semantic_cache 
            WHERE project_id = ? AND kind = ?
            ORDER BY timestamp DESC 
            LIMIT ?
          )
        `)
                .bind(projectId, kind, projectId, kind, maxEntries)
                .run();
            
            result.deleted = countResult.meta?.changes ?? 0;
            
            return result;
        } catch (error) {
            console.error('D1 cleanup error:', error);
            return result;
        }
    }
    
    /**
     * Delete expired entries across all projects (for scheduled cleanup)
     */
    async cleanupExpired(): Promise<number> {
        try {
            const result = await this.db
                .prepare(`
                    DELETE FROM semantic_cache 
                    WHERE expires_at IS NOT NULL AND expires_at < ?
                `)
                .bind(Date.now())
                .run();
            
            return result.meta?.changes ?? 0;
        } catch (error) {
            console.error('D1 cleanupExpired error:', error);
            return 0;
        }
    }
    
    /**
     * Invalidate cache entries based on filters
     */
    async invalidateEntries(
        projectId: string, 
        filters: {
            model?: string;
            kind?: string;
            beforeTimestamp?: number;
            afterTimestamp?: number;
        }
    ): Promise<number> {
        try {
            let query = 'DELETE FROM semantic_cache WHERE project_id = ?';
            const bindings: (string | number)[] = [projectId];
            
            if (filters.model) {
                query += ' AND model = ?';
                bindings.push(filters.model);
            }
            
            if (filters.kind) {
                query += ' AND kind = ?';
                bindings.push(filters.kind);
            }
            
            if (filters.beforeTimestamp) {
                query += ' AND timestamp < ?';
                bindings.push(filters.beforeTimestamp);
            }
            
            if (filters.afterTimestamp) {
                query += ' AND timestamp > ?';
                bindings.push(filters.afterTimestamp);
            }
            
            const result = await this.db
                .prepare(query)
                .bind(...bindings)
                .run();
            
            return result.meta?.changes ?? 0;
        } catch (error) {
            console.error('D1 invalidateEntries error:', error);
            return 0;
        }
    }
    
    /**
     * Get cache age statistics for a project
     */
    async getCacheAgeStats(projectId: string): Promise<{
        total: number;
        under1h: number;
        oneToSixH: number;
        sixTo24H: number;
        oneTo7D: number;
        sevenTo30D: number;
        over30D: number;
        avgAgeHours: number;
        expiredCount: number;
    }> {
        try {
            const now = Date.now();
            const oneHour = 60 * 60 * 1000;
            const sixHours = 6 * oneHour;
            const oneDay = 24 * oneHour;
            const sevenDays = 7 * oneDay;
            const thirtyDays = 30 * oneDay;
            
            const result = await this.db
                .prepare(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN (? - timestamp) < ? THEN 1 ELSE 0 END) as under1h,
                        SUM(CASE WHEN (? - timestamp) >= ? AND (? - timestamp) < ? THEN 1 ELSE 0 END) as oneToSixH,
                        SUM(CASE WHEN (? - timestamp) >= ? AND (? - timestamp) < ? THEN 1 ELSE 0 END) as sixTo24H,
                        SUM(CASE WHEN (? - timestamp) >= ? AND (? - timestamp) < ? THEN 1 ELSE 0 END) as oneTo7D,
                        SUM(CASE WHEN (? - timestamp) >= ? AND (? - timestamp) < ? THEN 1 ELSE 0 END) as sevenTo30D,
                        SUM(CASE WHEN (? - timestamp) >= ? THEN 1 ELSE 0 END) as over30D,
                        AVG((? - timestamp) / 3600000.0) as avgAgeHours,
                        SUM(CASE WHEN expires_at IS NOT NULL AND expires_at < ? THEN 1 ELSE 0 END) as expiredCount
                    FROM semantic_cache
                    WHERE project_id = ?
                `)
                .bind(
                    now, oneHour,
                    now, oneHour, now, sixHours,
                    now, sixHours, now, oneDay,
                    now, oneDay, now, sevenDays,
                    now, sevenDays, now, thirtyDays,
                    now, thirtyDays,
                    now,
                    now,
                    projectId
                )
                .first();
            
            return {
                total: (result?.total as number) ?? 0,
                under1h: (result?.under1h as number) ?? 0,
                oneToSixH: (result?.oneToSixH as number) ?? 0,
                sixTo24H: (result?.sixTo24H as number) ?? 0,
                oneTo7D: (result?.oneTo7D as number) ?? 0,
                sevenTo30D: (result?.sevenTo30D as number) ?? 0,
                over30D: (result?.over30D as number) ?? 0,
                avgAgeHours: (result?.avgAgeHours as number) ?? 0,
                expiredCount: (result?.expiredCount as number) ?? 0,
            };
        } catch (error) {
            console.error('D1 getCacheAgeStats error:', error);
            return {
                total: 0, under1h: 0, oneToSixH: 0, sixTo24H: 0,
                oneTo7D: 0, sevenTo30D: 0, over30D: 0, avgAgeHours: 0, expiredCount: 0
            };
        }
    }
}

export function createD1Client(db: D1Database | undefined): D1Client | null {
    if (!db) {
        console.warn('D1 database not configured, semantic caching will be disabled');
        return null;
    }
    return new D1Client(db);
}
