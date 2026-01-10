/**
 * Agent Debug Sanitizer
 * 
 * Sanitizes agent run data to remove PII and sensitive information.
 * 
 * @feature AGENT_DEBUGGER_V1
 */

import { AgentStep, AgentDebuggerConfig } from './types';

// Patterns for sensitive data
const PATTERNS = {
  // API keys (various formats)
  apiKey: /(?:api[_-]?key|apikey|api_secret|secret_key|access_token|bearer)\s*[=:]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
  
  // Bearer tokens
  bearerToken: /Bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  
  // Common API key prefixes
  knownApiKeys: /\b(sk-[a-zA-Z0-9]{20,}|pk-[a-zA-Z0-9]{20,}|lgw_[a-z]+_[a-zA-Z0-9]+|xoxb-[a-zA-Z0-9\-]+)\b/g,
  
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (various formats)
  phone: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // Credit card numbers
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // SSN
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  
  // IP addresses
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // Passwords in strings
  password: /(?:password|passwd|pwd)\s*[=:]\s*['"]?([^'"\s]+)['"]?/gi,
};

// Mask replacement patterns
const MASKS = {
  apiKey: '[API_KEY_REDACTED]',
  bearerToken: 'Bearer [TOKEN_REDACTED]',
  knownApiKeys: '[KEY_REDACTED]',
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  creditCard: '[CARD_REDACTED]',
  ssn: '[SSN_REDACTED]',
  ipAddress: '[IP_REDACTED]',
  password: 'password=[PASSWORD_REDACTED]',
};

/**
 * Sanitize a string by removing sensitive patterns
 */
export function sanitizeString(text: string, config: AgentDebuggerConfig): string {
  if (!text) return text;

  let sanitized = text;

  if (config.mask_api_keys) {
    sanitized = sanitized.replace(PATTERNS.apiKey, MASKS.apiKey);
    sanitized = sanitized.replace(PATTERNS.bearerToken, MASKS.bearerToken);
    sanitized = sanitized.replace(PATTERNS.knownApiKeys, MASKS.knownApiKeys);
    sanitized = sanitized.replace(PATTERNS.password, MASKS.password);
  }

  if (config.sanitize_pii) {
    sanitized = sanitized.replace(PATTERNS.email, MASKS.email);
    sanitized = sanitized.replace(PATTERNS.phone, MASKS.phone);
    sanitized = sanitized.replace(PATTERNS.creditCard, MASKS.creditCard);
    sanitized = sanitized.replace(PATTERNS.ssn, MASKS.ssn);
    // Note: IP addresses are not sanitized by default as they may be needed for debugging
  }

  return sanitized;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject(obj: unknown, config: AgentDebuggerConfig): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return sanitizeString(obj, config);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, config));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key itself suggests sensitive data
      const lowerKey = key.toLowerCase();
      if (
        config.mask_api_keys &&
        (lowerKey.includes('key') || 
         lowerKey.includes('token') || 
         lowerKey.includes('secret') ||
         lowerKey.includes('password') ||
         lowerKey.includes('credential'))
      ) {
        if (typeof value === 'string' && value.length > 8) {
          result[key] = maskValue(value);
        } else {
          result[key] = value;
        }
      } else {
        result[key] = sanitizeObject(value, config);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Mask a sensitive value, showing only first and last few characters
 */
function maskValue(value: string): string {
  if (value.length <= 8) return '********';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

/**
 * Truncate raw payload to configured length
 */
export function truncateRaw(raw: string | undefined, maxLength: number): { value: string | undefined; truncated: boolean } {
  if (!raw) return { value: raw, truncated: false };
  
  if (raw.length <= maxLength) {
    return { value: raw, truncated: false };
  }

  return {
    value: raw.slice(0, maxLength) + '\n... [TRUNCATED]',
    truncated: true,
  };
}

/**
 * Sanitize an agent step
 */
export function sanitizeStep(step: AgentStep, config: AgentDebuggerConfig): AgentStep {
  const sanitized = { ...step };

  // Sanitize string fields
  if (sanitized.summary) {
    sanitized.summary = sanitizeString(sanitized.summary, config);
  }

  if (sanitized.tool_output_summary) {
    sanitized.tool_output_summary = sanitizeString(sanitized.tool_output_summary, config);
  }

  // Sanitize and truncate raw payload
  if (sanitized.raw) {
    const { value, truncated } = truncateRaw(
      sanitizeString(sanitized.raw, config),
      config.truncate_raw_payload_length
    );
    sanitized.raw = value;
    // Note: We could add a `raw_truncated` field here if needed
  }

  // Sanitize tool args
  if (sanitized.tool_args) {
    sanitized.tool_args = sanitizeObject(sanitized.tool_args, config) as Record<string, unknown>;
  }

  return sanitized;
}

/**
 * Check if a string contains any sensitive patterns
 */
export function containsSensitiveData(text: string): boolean {
  if (!text) return false;

  for (const pattern of Object.values(PATTERNS)) {
    if (pattern.test(text)) {
      // Reset regex state
      pattern.lastIndex = 0;
      return true;
    }
    // Reset regex state
    pattern.lastIndex = 0;
  }

  return false;
}
