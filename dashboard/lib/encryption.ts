/**
 * Cryptographic utilities for encrypting/decrypting provider API keys.
 * Uses Web Crypto API (supported in Node.js 18+ and edge runtimes).
 */

/**
 * Derive an encryption key from the master secret
 * Uses PBKDF2 for key derivation
 */
async function deriveEncryptionKey(masterSecret: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();

    // Use crypto.subtle if available (browser/edge), otherwise use node:crypto
    const subtle = typeof crypto !== 'undefined' ? crypto.subtle : (await import('crypto')).webcrypto.subtle;

    const keyMaterial = await subtle.importKey(
        'raw',
        encoder.encode(masterSecret),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return subtle.deriveKey(
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
    const subtle = typeof crypto !== 'undefined' ? crypto.subtle : (await import('crypto')).webcrypto.subtle;
    const webCrypto = typeof crypto !== 'undefined' ? crypto : (await import('crypto')).webcrypto;

    // Generate random IV (12 bytes for GCM)
    const iv = new Uint8Array(12);
    (webCrypto as any).getRandomValues(iv);

    // Generate random salt for key derivation
    const salt = new Uint8Array(16);
    (webCrypto as any).getRandomValues(salt);

    // Derive encryption key
    const key = await deriveEncryptionKey(masterSecret, salt);

    // Encrypt the API key
    const encryptedBuffer = await subtle.encrypt(
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
    // Buffer.from is available in Node.js, otherwise use btoa
    const encryptedKeyBase64 = typeof Buffer !== 'undefined'
        ? Buffer.from(combined).toString('base64')
        : btoa(String.fromCharCode(...combined));

    const ivBase64 = typeof Buffer !== 'undefined'
        ? Buffer.from(iv).toString('base64')
        : btoa(String.fromCharCode(...iv));

    return {
        encryptedKey: encryptedKeyBase64,
        iv: ivBase64,
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
        const subtle = typeof crypto !== 'undefined' ? crypto.subtle : (await import('crypto')).webcrypto.subtle;

        // Decode from base64
        const combined = typeof Buffer !== 'undefined'
            ? Buffer.from(encryptedKey, 'base64')
            : Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));

        const ivBytes = typeof Buffer !== 'undefined'
            ? Buffer.from(iv, 'base64')
            : Uint8Array.from(atob(iv), c => c.charCodeAt(0));

        // Extract salt and encrypted data
        const salt = combined.slice(0, 16);
        const encryptedData = combined.slice(16);

        // Derive the same encryption key
        const key = await deriveEncryptionKey(masterSecret, new Uint8Array(salt));

        // Decrypt
        const decryptedBuffer = await subtle.decrypt(
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
