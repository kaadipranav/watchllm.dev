/**
 * Test script for BYOK encryption/decryption
 * Run with: node --loader tsx test-byok-crypto.ts
 */

import { encryptProviderKey, decryptProviderKey, validateEncryptedKey } from './worker/src/lib/crypto';

async function testBYOKCrypto() {
    console.log('🔐 Testing BYOK Encryption/Decryption\n');

    const testCases = [
        { name: 'OpenAI Key', key: 'sk-proj-test123456789abcdefghijklmnopqrstuvwxyz' },
        { name: 'Anthropic Key', key: 'sk-ant-api03-test123456789' },
        { name: 'Groq Key', key: 'gsk_test123456789abcdefghijklmnopqrstuvwxyz' },
    ];

    const masterSecret = 'test-master-secret-for-encryption-testing-12345';

    for (const testCase of testCases) {
        console.log(`Testing ${testCase.name}...`);

        try {
            // Encrypt
            const { encryptedKey, iv } = await encryptProviderKey(testCase.key, masterSecret);
            console.log(`  ✓ Encrypted (length: ${encryptedKey.length})`);
            console.log(`  ✓ IV generated (length: ${iv.length})`);

            // Decrypt
            const decrypted = await decryptProviderKey(encryptedKey, iv, masterSecret);
            console.log(`  ✓ Decrypted successfully`);

            // Validate
            if (decrypted === testCase.key) {
                console.log(`  ✅ PASS: Decrypted key matches original\n`);
            } else {
                console.log(`  ❌ FAIL: Decrypted key does not match`);
                console.log(`    Expected: ${testCase.key}`);
                console.log(`    Got: ${decrypted}\n`);
            }

            // Test validation function
            const isValid = await validateEncryptedKey(encryptedKey, iv, masterSecret);
            if (isValid) {
                console.log(`  ✓ Validation function works\n`);
            } else {
                console.log(`  ❌ Validation function failed\n`);
            }

            // Test with wrong secret
            try {
                await decryptProviderKey(encryptedKey, iv, 'wrong-secret');
                console.log(`  ❌ FAIL: Should have thrown error with wrong secret\n`);
            } catch (error) {
                console.log(`  ✓ Correctly rejects wrong secret\n`);
            }

        } catch (error) {
            console.log(`  ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        }
    }

    console.log('🎉 All tests completed!');
}

// Run tests
testBYOKCrypto().catch(console.error);
