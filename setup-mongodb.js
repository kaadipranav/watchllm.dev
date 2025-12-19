#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Helper for WatchLLM
 *
 * This script helps you set up MongoDB Atlas for caching.
 * Run this after creating your MongoDB Atlas account.
 */

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 WatchLLM MongoDB Atlas Setup Helper');
  console.log('=====================================\n');

  console.log('Make sure you have:');
  console.log('1. Created a MongoDB Atlas account with GitHub Student Pack');
  console.log('2. Created a cluster (free tier)');
  console.log('3. Enabled Data API in your cluster');
  console.log('4. Created an API key for Data API\n');

  const dataApiUrl = await ask('Enter your Data API URL: ');
  const apiKey = await ask('Enter your API Key: ');
  const dataSource = await ask('Enter your cluster name (default: Cluster0): ') || 'Cluster0';

  console.log('\nSetting secrets in Cloudflare Workers...\n');

  try {
    // Change to worker directory
    process.chdir('./worker');

    // Set secrets
    console.log('Setting MONGODB_DATA_API_URL...');
    execSync(`echo "${dataApiUrl}" | wrangler secret put MONGODB_DATA_API_URL`, { stdio: 'inherit' });

    console.log('Setting MONGODB_API_KEY...');
    execSync(`echo "${apiKey}" | wrangler secret put MONGODB_API_KEY`, { stdio: 'inherit' });

    console.log('Setting MONGODB_DATA_SOURCE...');
    execSync(`echo "${dataSource}" | wrangler secret put MONGODB_DATA_SOURCE`, { stdio: 'inherit' });

    console.log('\n✅ Secrets configured successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy: wrangler deploy');
    console.log('2. Test: cd .. && node test-proxy.js');

  } catch (error) {
    console.error('❌ Error setting secrets:', error.message);
    console.log('\nManual setup:');
    console.log('cd worker');
    console.log('wrangler secret put MONGODB_DATA_API_URL');
    console.log('wrangler secret put MONGODB_API_KEY');
    console.log('wrangler secret put MONGODB_DATA_SOURCE');
  }

  rl.close();
}

main().catch(console.error);