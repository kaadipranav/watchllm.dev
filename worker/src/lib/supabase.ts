/**
 * Supabase client for database operations
 */

import type {
  Env,
  APIKeyRecord,
  ProjectRecord,
  UsageLogEntry,
  ValidatedAPIKey,
} from '../types';

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export class SupabaseClient {
  private url: string;
  private key: string;

  constructor(env: Env) {
    this.url = env.SUPABASE_URL;
    this.key = env.SUPABASE_ANON_KEY;
  }

  /**
   * Execute a Supabase REST API request
   */
  private async query<T>(
    table: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      select?: string;
      filters?: Record<string, string>;
      body?: Record<string, unknown>;
      single?: boolean;
    } = {}
  ): Promise<SupabaseResponse<T>> {
    const { method = 'GET', select, filters = {}, body, single } = options;

    try {
      // Build URL with query parameters
      const url = new URL(`${this.url}/rest/v1/${table}`);
      
      if (select) {
        url.searchParams.set('select', select);
      }

      for (const [key, value] of Object.entries(filters)) {
        url.searchParams.set(key, value);
      }

      const headers: Record<string, string> = {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      };

      if (single) {
        headers['Accept'] = 'application/vnd.pgrst.object+json';
      }

      if (method === 'POST') {
        headers['Prefer'] = 'return=representation';
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Supabase error: ${response.status} - ${errorText}`);
        return {
          data: null,
          error: { message: errorText, code: response.status.toString() },
        };
      }

      // Handle no content responses
      if (response.status === 204) {
        return { data: null, error: null };
      }

      const data = await response.json();
      return { data: data as T, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Supabase connection error:', errorMessage);
      return {
        data: null,
        error: { message: errorMessage },
      };
    }
  }

  /**
   * Validate an API key and return key + project info
   */
  async validateAPIKey(apiKey: string): Promise<ValidatedAPIKey | null> {
    // Find the API key record
    const keyResult = await this.query<APIKeyRecord>('api_keys', {
      select: '*',
      filters: {
        key: `eq.${apiKey}`,
        is_active: 'eq.true',
      },
      single: true,
    });

    if (keyResult.error || !keyResult.data) {
      return null;
    }

    const keyRecord = keyResult.data;

    // Get the associated project
    const projectResult = await this.query<ProjectRecord>('projects', {
      select: '*',
      filters: {
        id: `eq.${keyRecord.project_id}`,
      },
      single: true,
    });

    if (projectResult.error || !projectResult.data) {
      return null;
    }

    // Update last_used_at timestamp
    await this.query('api_keys', {
      method: 'PATCH',
      filters: { id: `eq.${keyRecord.id}` },
      body: { last_used_at: new Date().toISOString() },
    });

    return {
      keyRecord,
      project: projectResult.data,
    };
  }

  /**
   * Log API usage
   */
  async logUsage(entry: UsageLogEntry): Promise<boolean> {
    const result = await this.query('usage_logs', {
      method: 'POST',
      body: entry as unknown as Record<string, unknown>,
    });

    if (result.error) {
      console.error('Failed to log usage:', result.error.message);
      return false;
    }

    return true;
  }

  /**
   * Get monthly usage count for a project
   */
  async getMonthlyUsage(projectId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.query<Array<{ count: number }>>('usage_logs', {
      select: 'count',
      filters: {
        project_id: `eq.${projectId}`,
        created_at: `gte.${startOfMonth.toISOString()}`,
      },
    });

    if (result.error || !result.data) {
      return 0;
    }

    // Supabase returns count in a different way via RPC
    // For now, we'll count the array length or use aggregation
    return Array.isArray(result.data) ? result.data.length : 0;
  }

  /**
   * Health check - verify connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: this.key,
          Authorization: `Bearer ${this.key}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Create Supabase client instance
 */
export function createSupabaseClient(env: Env): SupabaseClient {
  return new SupabaseClient(env);
}
