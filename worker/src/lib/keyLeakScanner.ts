import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Scans logs and error messages for accidentally exposed provider API keys
 * This is a defensive security measure to catch unintentional key leaks
 */

interface LeakDetectionResult {
  found: boolean;
  locations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Common patterns that might indicate an API key leak
const KEY_PATTERNS = [
  // OpenAI keys: sk-... or sk-proj-...
  /sk-[a-zA-Z0-9]{20,}/g,
  /sk-proj-[a-zA-Z0-9]{20,}/g,
  
  // Anthropic keys: sk-ant-...
  /sk-ant-[a-zA-Z0-9-]{20,}/g,
  
  // Groq keys: gsk_...
  /gsk_[a-zA-Z0-9]{20,}/g,
  
  // Generic Bearer tokens
  /Bearer\s+[a-zA-Z0-9-_]{20,}/gi,
];

export class KeyLeakScanner {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Scan a string for patterns that look like provider API keys
   */
  scanString(text: string): LeakDetectionResult {
    const locations: string[] = [];
    
    for (const pattern of KEY_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Redact most of the key for safety
          const redacted = match.slice(0, 8) + '...' + match.slice(-4);
          locations.push(`Potential key: ${redacted}`);
        }
      }
    }

    return {
      found: locations.length > 0,
      locations,
      severity: locations.length > 0 ? 'critical' : 'low',
    };
  }

  /**
   * Scan recent error logs for accidentally exposed keys
   * This checks the last N hours of error logs
   */
  async scanErrorLogs(projectId: string, hoursBack: number = 24): Promise<LeakDetectionResult> {
    try {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - hoursBack);

      // Query recent error logs from ClickHouse via Supabase
      const { data: logs, error } = await this.supabase
        .from('error_logs')
        .select('id, message, stack_trace, created_at')
        .eq('project_id', projectId)
        .gte('created_at', cutoff.toISOString())
        .limit(1000);

      if (error || !logs) {
        console.error('Failed to fetch error logs for leak scanning:', error);
        return { found: false, locations: [], severity: 'low' };
      }

      const allLocations: string[] = [];

      for (const log of logs) {
        const messageResult = this.scanString(log.message || '');
        const stackResult = this.scanString(log.stack_trace || '');

        if (messageResult.found) {
          allLocations.push(
            `Log ${log.id} (${new Date(log.created_at).toISOString()}): ${messageResult.locations.join(', ')}`
          );
        }

        if (stackResult.found) {
          allLocations.push(
            `Stack trace in log ${log.id}: ${stackResult.locations.join(', ')}`
          );
        }
      }

      return {
        found: allLocations.length > 0,
        locations: allLocations,
        severity: allLocations.length > 0 ? 'critical' : 'low',
      };
    } catch (err) {
      console.error('Error scanning logs for key leaks:', err);
      return { found: false, locations: [], severity: 'low' };
    }
  }

  /**
   * Check if a specific provider key has been leaked
   * This should be called BEFORE returning any error to the user
   */
  async checkKeyLeak(keyId: string, errorMessage: string): Promise<boolean> {
    const result = this.scanString(errorMessage);

    if (result.found) {
      // CRITICAL: Key detected in error message!
      // Log this incident for security review
      await this.supabase.from('security_incidents').insert({
        type: 'provider_key_leak_detected',
        provider_key_id: keyId,
        severity: 'critical',
        details: {
          locations: result.locations,
          error_message_length: errorMessage.length,
        },
        detected_at: new Date().toISOString(),
      });

      return true;
    }

    return false;
  }

  /**
   * Sanitize an error message by removing any detected API keys
   */
  sanitizeErrorMessage(message: string): string {
    let sanitized = message;

    for (const pattern of KEY_PATTERNS) {
      sanitized = sanitized.replace(pattern, (match) => {
        // Replace with redacted version
        return match.slice(0, 8) + '...[REDACTED]';
      });
    }

    return sanitized;
  }

  /**
   * Schedule a periodic leak scan (should be run via cron job)
   * Returns number of leaks detected
   */
  async scheduledScan(projectId: string): Promise<number> {
    const result = await this.scanErrorLogs(projectId, 24);

    if (result.found) {
      // Log security incident
      await this.supabase.from('security_incidents').insert({
        type: 'scheduled_leak_scan_alert',
        project_id: projectId,
        severity: result.severity,
        details: {
          leak_count: result.locations.length,
          locations: result.locations,
        },
        detected_at: new Date().toISOString(),
      });

      return result.locations.length;
    }

    return 0;
  }
}

/**
 * Factory function to create a KeyLeakScanner
 */
export function createKeyLeakScanner(supabase: SupabaseClient): KeyLeakScanner {
  return new KeyLeakScanner(supabase);
}
