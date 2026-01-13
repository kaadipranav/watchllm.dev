#!/usr/bin/env node

/**
 * WatchLLM License Generator
 * 
 * Internal tool for generating enterprise license files.
 * Keep this script and the private key secure.
 * 
 * Usage:
 *   node generate-license.js --customer "ACME Corp" --type enterprise --expires 2027-01-01
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
};

const customer = getArg('customer') || 'Test Customer';
const licenseType = getArg('type') || 'enterprise';
const expiresAt = getArg('expires') || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const features = getArg('features')?.split(',') || ['self_hosted', 'audit_logs', 'advanced_analytics', 'priority_support'];
const maxUsers = parseInt(getArg('max-users') || '100');
const maxRequests = parseInt(getArg('max-requests') || '10000000');
const outputFile = getArg('output') || 'license.json';

// Get or generate private key
const privateKeyPath = getArg('key') || process.env.WATCHLLM_LICENSE_PRIVATE_KEY;
let privateKey;

if (privateKeyPath && fs.existsSync(privateKeyPath)) {
  privateKey = fs.readFileSync(privateKeyPath, 'utf-8').trim();
} else if (process.env.WATCHLLM_LICENSE_PRIVATE_KEY) {
  privateKey = process.env.WATCHLLM_LICENSE_PRIVATE_KEY;
} else {
  // Generate a new key pair if none exists
  console.log('⚠️  No private key provided. Generating new key pair...');
  privateKey = crypto.randomBytes(32).toString('hex');
  const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex').substring(0, 32);
  
  console.log('\n📝 Generated Key Pair (SAVE THESE SECURELY):');
  console.log('─'.repeat(60));
  console.log(`Private Key (keep secret): ${privateKey}`);
  console.log(`Public Key (share with deployment): ${publicKey}`);
  console.log('─'.repeat(60));
  console.log('\n');
}

// Create license payload
const license = {
  customer,
  license_type: licenseType,
  issued_at: new Date().toISOString().split('T')[0],
  expires_at: expiresAt,
  features,
  max_users: maxUsers,
  max_requests_per_month: maxRequests,
};

// Create signature
const payload = JSON.stringify(license, Object.keys(license).sort());
const signature = crypto.createHmac('sha256', privateKey).update(payload).digest('hex');

// Add signature to license
license.signature = signature;

// Write license file
const outputPath = path.resolve(outputFile);
fs.writeFileSync(outputPath, JSON.stringify(license, null, 2));

console.log('✅ License generated successfully!');
console.log('─'.repeat(60));
console.log(`Customer: ${customer}`);
console.log(`Type: ${licenseType}`);
console.log(`Expires: ${expiresAt}`);
console.log(`Features: ${features.join(', ')}`);
console.log(`Max Users: ${maxUsers}`);
console.log(`Output: ${outputPath}`);
console.log('─'.repeat(60));

// Also output the public key for reference
const publicKey = crypto.createHash('sha256').update(privateKey).digest('hex').substring(0, 32);
console.log(`\n🔑 Public Key for WATCHLLM_LICENSE_PUBLIC_KEY:`);
console.log(publicKey);
