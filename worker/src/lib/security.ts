/**
 * Security headers middleware for Cloudflare Workers
 */

import type { Context, Next } from 'hono';
import type { Env } from '../types';
import type { RedisClient } from './redis';

/**
 * Security headers to add to all responses
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Enable XSS filter (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy - restrict browser features
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

/**
 * Add security headers to response
 */
export function securityHeaders() {
  return async (c: Context, next: Next) => {
    await next();

    // Add security headers to response
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      c.res.headers.set(key, value);
    }
  };
}

/**
 * CORS configuration for production environments
 */
export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

/**
 * Get CORS configuration based on environment
 */
export function getCORSConfig(env: { APP_URL?: string }): CORSConfig {
  const isProduction = env.APP_URL && !env.APP_URL.includes('localhost');

  // In production, restrict to known origins
  const allowedOrigins = isProduction && env.APP_URL
    ? [
      env.APP_URL,
      env.APP_URL.replace('http://', 'https://'),
      // Add other trusted origins here
    ]
    : ['*']; // Allow all in development

  return {
    allowedOrigins,
    allowedMethods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: [
      'X-Cache',
      'X-Cache-Age',
      'X-Latency-Ms',
      'X-Cost-USD',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-IP-RateLimit-Limit',
      'X-IP-RateLimit-Remaining',
      'X-IP-RateLimit-Reset',
    ],
    maxAge: 86400,
    credentials: false,
  };
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  if (allowedOrigins.includes('*')) return true;
  return allowedOrigins.some(allowed => {
    if (allowed === origin) return true;
    // Support wildcard subdomains like *.watchllm.dev
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain) && origin.includes('.');
    }
    return false;
  });
}

// ============================================================================
// IP-Based Rate Limiting
// ============================================================================

/**
 * IP Rate Limit Configuration
 */
export const IP_RATE_LIMITS = {
  // Global limit per IP per minute (acts as abuse prevention layer)
  requestsPerMinute: 120,
  // Burst protection: max requests in 10 seconds
  burstLimit: 30,
  burstWindowSeconds: 10,
  // Block duration for repeat offenders
  blockDurationSeconds: 300, // 5 minute block
};

export interface IPRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  blocked: boolean;
  reason?: string;
}

/**
 * Extract client IP from request headers
 * Works with Cloudflare Workers (CF-Connecting-IP) and standard proxies
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getClientIP(c: Context<any>): string {
  // Cloudflare's real IP header (most reliable in CF Workers)
  const cfConnectingIP = c.req.header('CF-Connecting-IP');
  if (cfConnectingIP) return cfConnectingIP;

  // Standard forwarded header
  const xForwardedFor = c.req.header('X-Forwarded-For');
  if (xForwardedFor) {
    // Take the first IP in the chain (original client)
    return xForwardedFor.split(',')[0].trim();
  }

  // X-Real-IP (used by some proxies)
  const xRealIP = c.req.header('X-Real-IP');
  if (xRealIP) return xRealIP;

  // Fallback
  return 'unknown';
}

/**
 * Hash IP for privacy
 */
export async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

/**
 * Check IP-based rate limit
 * Provides secondary layer of protection against coordinated attacks
 */
export async function checkIPRateLimit(
  redis: RedisClient,
  clientIP: string
): Promise<IPRateLimitResult> {
  const hashedIP = await hashIP(clientIP);

  // Check if IP is currently blocked
  const blockKey = `ip:blocked:${hashedIP}`;
  const isBlocked = await redis.exists(blockKey);
  if (isBlocked) {
    const ttl = await redis.ttl(blockKey);
    return {
      allowed: false,
      remaining: 0,
      resetAt: Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : 0),
      blocked: true,
      reason: 'IP temporarily blocked due to suspicious activity',
    };
  }

  // Check burst limit (short window - prevents rapid-fire attacks)
  const burstKey = `ip:burst:${hashedIP}`;
  const burstResult = await redis.checkRateLimit(
    burstKey,
    IP_RATE_LIMITS.burstLimit,
    IP_RATE_LIMITS.burstWindowSeconds
  );

  if (!burstResult.allowed) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: burstResult.resetAt,
      blocked: false,
      reason: 'Burst rate limit exceeded. Please slow down.',
    };
  }

  // Check minute limit
  const minuteKey = `ip:minute:${hashedIP}`;
  const minuteResult = await redis.checkRateLimit(
    minuteKey,
    IP_RATE_LIMITS.requestsPerMinute,
    60
  );

  // Track repeat offenders
  if (!minuteResult.allowed) {
    const suspiciousKey = `ip:suspicious:${hashedIP}`;
    const suspiciousCount = await redis.incr(suspiciousKey);

    if (suspiciousCount === 1) {
      await redis.expire(suspiciousKey, 300); // 5 min window
    }

    // Block IP after 5 rate limit violations in 5 minutes
    if (suspiciousCount >= 5) {
      await redis.set(blockKey, '1', IP_RATE_LIMITS.blockDurationSeconds);
      console.warn(`Blocked suspicious IP: ${clientIP.substring(0, 8)}***`);

      return {
        allowed: false,
        remaining: 0,
        resetAt: Math.floor(Date.now() / 1000) + IP_RATE_LIMITS.blockDurationSeconds,
        blocked: true,
        reason: 'IP blocked due to repeated rate limit violations',
      };
    }
  }

  return {
    allowed: minuteResult.allowed,
    remaining: minuteResult.remaining,
    resetAt: minuteResult.resetAt,
    blocked: false,
  };
}

/**
 * IP Rate Limit Middleware
 * Apply before API key rate limiting for defense in depth
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ipRateLimitMiddleware(
  c: Context<any>,
  redis: RedisClient
): Promise<Response | null> {
  const clientIP = getClientIP(c);

  // Skip for health checks
  if (c.req.path.startsWith('/health')) {
    return null;
  }

  const result = await checkIPRateLimit(redis, clientIP);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: {
          message: result.reason || 'IP rate limit exceeded',
          type: 'rate_limit_error',
          code: result.blocked ? 'ip_blocked' : 'ip_rate_limit_exceeded',
        },
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-IP-RateLimit-Limit': IP_RATE_LIMITS.requestsPerMinute.toString(),
          'X-IP-RateLimit-Remaining': result.remaining.toString(),
          'X-IP-RateLimit-Reset': result.resetAt.toString(),
          'Retry-After': result.blocked
            ? IP_RATE_LIMITS.blockDurationSeconds.toString()
            : '60',
        },
      }
    );
  }

  return null;
}

// ============================================================================
// Provider Health Check
// ============================================================================

export interface ProviderHealthResult {
  healthy: boolean;
  latencyMs: number;
  modelsAvailable?: number;
  error?: string;
}

/**
 * Check OpenRouter provider health
 * Pings the models endpoint to verify availability
 */
export async function checkProviderHealth(env: Env): Promise<ProviderHealthResult> {
  const startTime = Date.now();

  try {
    // OpenRouter models endpoint - lightweight check
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        healthy: false,
        latencyMs,
        error: `OpenRouter returned ${response.status}`,
      };
    }

    const data = await response.json() as { data?: unknown[] };
    const modelsAvailable = Array.isArray(data?.data) ? data.data.length : 0;

    return {
      healthy: true,
      latencyMs,
      modelsAvailable,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      healthy: false,
      latencyMs,
      error: errorMessage,
    };
  }
}
