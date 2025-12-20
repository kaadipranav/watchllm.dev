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

// ============================================================================
// AES-GCM Encryption for Provider Keys (BYOK)
// ============================================================================

/**
 * Derive an encryption key from the master secret
 * Uses PBKDF2 for key derivation
 */
async function deriveEncryptionKey(masterSecret: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterSecret),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a provider API key using AES-GCM
 * Returns { encryptedKey: base64, iv: base64 }
 */
export async function encryptProviderKey(
  plainKey: string,
  masterSecret: string
): Promise<{ encryptedKey: string; iv: string }> {
  const encoder = new TextEncoder();

  // Generate random IV (12 bytes for GCM)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Generate random salt for key derivation
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  // Derive encryption key
  const key = await deriveEncryptionKey(masterSecret, salt);

  // Encrypt the API key
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(plainKey)
  );

  // Combine salt + encrypted data for storage
  const combined = new Uint8Array(salt.length + encryptedBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(new Uint8Array(encryptedBuffer), salt.length);

  // Convert to base64 for storage
  return {
    encryptedKey: btoa(String.fromCharCode(...combined)),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

/**
 * Decrypt a provider API key using AES-GCM
 * Returns the plaintext API key
 */
export async function decryptProviderKey(
  encryptedKey: string,
  iv: string,
  masterSecret: string
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

    // Extract salt and encrypted data
    const salt = combined.slice(0, 16);
    const encryptedData = combined.slice(16);

    // Derive the same encryption key
    const key = await deriveEncryptionKey(masterSecret, salt);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBytes,
      },
      key,
      encryptedData
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt provider key');
  }
}

/**
 * Validate that an encrypted key can be decrypted
 * Returns true if decryption succeeds
 */
export async function validateEncryptedKey(
  encryptedKey: string,
  iv: string,
  masterSecret: string
): Promise<boolean> {
  try {
    await decryptProviderKey(encryptedKey, iv, masterSecret);
    return true;
  } catch {
    return false;
  }
}
