/**
 * Cryptographic utilities for API key generation and hashing
 */

/**
 * Generate a cryptographically secure API key
 * Uses Web Crypto API for secure random bytes
 */
export async function generateSecureAPIKey(prefix: 'proj' | 'test' = 'proj'): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  
  // Convert to URL-safe base64
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `lgw_${prefix}_${base64}`;
}

/**
 * Hash an API key for secure storage using SHA-256
 * Returns hex-encoded hash
 */
export async function hashAPIKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare a plaintext key against its hash
 */
export async function verifyAPIKey(plaintext: string, hash: string): Promise<boolean> {
  const computedHash = await hashAPIKey(plaintext);
  // Timing-safe comparison
  if (computedHash.length !== hash.length) return false;
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Mask an API key for safe logging/display
 * Shows prefix and last 4 characters only
 */
export function maskAPIKey(key: string | null | undefined): string {
  if (!key) return '[none]';
  if (key.length <= 16) return '***';
  const prefix = key.slice(0, 12);
  const suffix = key.slice(-4);
  return `${prefix}••••${suffix}`;
}

/**
 * Validate API key format
 */
export function isValidAPIKeyFormat(key: string): boolean {
  // Must start with lgw_proj_ or lgw_test_ and have sufficient length
  const pattern = /^lgw_(proj|test)_[A-Za-z0-9]{32,}$/;
  return pattern.test(key);
}

/**
 * Generate a secure random token (for webhooks, CSRF, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
