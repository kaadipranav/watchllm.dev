#!/usr/bin/env node

/**
 * ClickHouse Connection Verification Script
 * Run after Task 1.1 to verify ClickHouse setup
 */

const https = require('https');

async function verifyClickHouse() {
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = process.env.CLICKHOUSE_PORT || '8123';
  const user = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  const database = process.env.CLICKHOUSE_DATABASE || 'watchllm';

  const url = `http://${host}:${port}/?user=${user}&password=${password}&database=${database}`;

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Connection timeout')));
    });

    if (response.statusCode === 200) {
      console.log('✅ Successfully connected to ClickHouse!');
      console.log(`📊 Version: ${response.data.trim()}`);
      console.log('🎉 ClickHouse is ready for the next task.');
    } else {
      console.error(`❌ ClickHouse connection failed with status: ${response.statusCode}`);
      console.error(`Response: ${response.data}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to connect to ClickHouse:', error.message);
    console.error('💡 Make sure ClickHouse is running and credentials are correct in .env');
    process.exit(1);
  }
}

verifyClickHouse();