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
}

export class D1Client {
    private db: D1Database;

    constructor(db: D1Database) {
        this.db = db;
    }

    /**
     * Get all cache entries for a project/kind
     */
    async getEntries(projectId: string, kind: string): Promise<D1CacheEntry[]> {
        try {
            const result = await this.db
                .prepare('SELECT * FROM semantic_cache WHERE project_id = ? AND kind = ? ORDER BY timestamp DESC LIMIT 50')
                .bind(projectId, kind)
                .all<D1CacheEntry>();

            return result.results || [];
        } catch (error) {
            console.error('D1 getEntries error:', error);
            return [];
        }
    }

    /**
     * Save a new cache entry
     */
    async saveEntry(entry: Omit<D1CacheEntry, 'created_at'>): Promise<boolean> {
        try {
            await this.db
                .prepare(`
          INSERT INTO semantic_cache 
          (id, project_id, kind, text, embedding, response, model, tokens_input, tokens_output, tokens_total, timestamp)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    entry.timestamp
                )
                .run();

            return true;
        } catch (error) {
            console.error('D1 saveEntry error:', error);
            return false;
        }
    }

    /**
     * Delete old entries (cleanup)
     */
    async cleanup(projectId: string, kind: string, maxEntries: number = 50): Promise<void> {
        try {
            // Keep only the most recent maxEntries
            await this.db
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
        } catch (error) {
            console.error('D1 cleanup error:', error);
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
