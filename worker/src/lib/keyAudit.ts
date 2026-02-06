/**
 * Provider Key Access Audit Logging
 * 
 * Tracks every time a provider API key is accessed/decrypted
 * Enables security monitoring and alerts for unusual access patterns
 */

import type { SupabaseClient } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface KeyAccessLog {
  id: string;
  project_id: string;
  provider_key_id: string;
  provider: 'openai' | 'anthropic' | 'groq' | 'openrouter';
  access_type: 'decrypt' | 'validate' | 'rotate' | 'delete';
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  success: boolean;
  failure_reason?: string;
}

export interface AccessPattern {
  hourlyAccesses: number;
  dailyAccesses: number;
  lastAccessTime: Date | null;
  unusualPattern: boolean;
  reason?: string;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_HOURLY_ACCESSES = 10000; // Flag if >10k accesses/hour
const MAX_DAILY_ACCESSES = 100000; // Flag if >100k accesses/day
const RAPID_ACCESS_THRESHOLD = 100; // Flag if >100 accesses in 1 minute

// ============================================================================
// Audit Logger
// ============================================================================

export class KeyAccessAuditor {
  private supabase: SupabaseClient;
  private projectId: string;

  constructor(supabase: SupabaseClient, projectId: string) {
    this.supabase = supabase;
    this.projectId = projectId;
  }

  /**
   * Log a provider key access event
   */
  async logAccess(
    providerKeyId: string,
    provider: 'openai' | 'anthropic' | 'groq' | 'openrouter',
    accessType: 'decrypt' | 'validate' | 'rotate' | 'delete',
    success: boolean,
    options?: {
      ipAddress?: string;
      userAgent?: string;
      requestId?: string;
      failureReason?: string;
    }
  ): Promise<void> {
    try {
      await this.supabase.client
        .from('provider_key_access_logs')
        .insert({
          project_id: this.projectId,
          provider_key_id: providerKeyId,
          provider,
          access_type: accessType,
          success,
          failure_reason: options?.failureReason,
          ip_address: options?.ipAddress,
          user_agent: options?.userAgent,
          request_id: options?.requestId,
          accessed_at: new Date().toISOString(),
        });
    } catch (error) {
      // Don't throw - audit logging failures shouldn't break the app
      console.error('[KeyAccessAuditor] Failed to log access:', error);
    }
  }

  /**
   * Update last_used_at timestamp on provider key
   */
  async updateLastUsed(providerKeyId: string): Promise<void> {
    try {
      await this.supabase.client
        .from('provider_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', providerKeyId)
        .eq('project_id', this.projectId);
    } catch (error) {
      console.error('[KeyAccessAuditor] Failed to update last_used_at:', error);
    }
  }

  /**
   * Analyze access patterns for anomaly detection
   */
  async analyzeAccessPattern(providerKeyId: string): Promise<AccessPattern> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000);
      const oneDayAgo = new Date(now.getTime() - 86400000);
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      // Get hourly accesses
      const { data: hourlyData } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('id')
        .eq('provider_key_id', providerKeyId)
        .eq('success', true)
        .gte('accessed_at', oneHourAgo.toISOString());

      const hourlyAccesses = hourlyData?.length || 0;

      // Get daily accesses
      const { data: dailyData } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('id')
        .eq('provider_key_id', providerKeyId)
        .eq('success', true)
        .gte('accessed_at', oneDayAgo.toISOString());

      const dailyAccesses = dailyData?.length || 0;

      // Get rapid accesses (last minute)
      const { data: rapidData } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('id')
        .eq('provider_key_id', providerKeyId)
        .eq('success', true)
        .gte('accessed_at', oneMinuteAgo.toISOString());

      const rapidAccesses = rapidData?.length || 0;

      // Get last access time
      const { data: lastAccessData } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('accessed_at')
        .eq('provider_key_id', providerKeyId)
        .eq('success', true)
        .order('accessed_at', { ascending: false })
        .limit(1)
        .single();

      const lastAccessTime = lastAccessData?.accessed_at 
        ? new Date(lastAccessData.accessed_at)
        : null;

      // Detect unusual patterns
      let unusualPattern = false;
      let reason: string | undefined;

      if (rapidAccesses >= RAPID_ACCESS_THRESHOLD) {
        unusualPattern = true;
        reason = `Rapid access: ${rapidAccesses} accesses in last minute`;
      } else if (hourlyAccesses >= MAX_HOURLY_ACCESSES) {
        unusualPattern = true;
        reason = `High volume: ${hourlyAccesses} accesses in last hour`;
      } else if (dailyAccesses >= MAX_DAILY_ACCESSES) {
        unusualPattern = true;
        reason = `Very high volume: ${dailyAccesses} accesses in last 24 hours`;
      }

      return {
        hourlyAccesses,
        dailyAccesses,
        lastAccessTime,
        unusualPattern,
        reason,
      };
    } catch (error) {
      console.error('[KeyAccessAuditor] Failed to analyze access pattern:', error);
      return {
        hourlyAccesses: 0,
        dailyAccesses: 0,
        lastAccessTime: null,
        unusualPattern: false,
      };
    }
  }

  /**
   * Get access history for a provider key
   */
  async getAccessHistory(
    providerKeyId: string,
    limit: number = 100
  ): Promise<KeyAccessLog[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('*')
        .eq('provider_key_id', providerKeyId)
        .order('accessed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[KeyAccessAuditor] Failed to get access history:', error);
      return [];
    }
  }

  /**
   * Get failed access attempts (potential security incidents)
   */
  async getFailedAccessAttempts(
    hoursBack: number = 24
  ): Promise<KeyAccessLog[]> {
    try {
      const since = new Date(Date.now() - hoursBack * 3600000);

      const { data, error } = await this.supabase.client
        .from('provider_key_access_logs')
        .select('*')
        .eq('project_id', this.projectId)
        .eq('success', false)
        .gte('accessed_at', since.toISOString())
        .order('accessed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[KeyAccessAuditor] Failed to get failed attempts:', error);
      return [];
    }
  }
}

/**
 * Factory function to create KeyAccessAuditor
 */
export function createKeyAccessAuditor(
  supabase: SupabaseClient,
  projectId: string
): KeyAccessAuditor {
  return new KeyAccessAuditor(supabase, projectId);
}
