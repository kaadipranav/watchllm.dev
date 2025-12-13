/**
 * Security headers middleware for Cloudflare Workers
 */

import type { Context, Next } from 'hono';

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
