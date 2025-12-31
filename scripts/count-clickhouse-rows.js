#!/usr/bin/env node

/**
 * ClickHouse Row Count Verification Script
 * Run after Task 1.5 to verify queue consumer is working
 */

const https = require('https');

async function countRows() {
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = process.env.CLICKHOUSE_PORT || '8123';
  const user = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  const database = process.env.CLICKHOUSE_DATABASE || 'watchllm';

  const query = 'SELECT count() FROM events';
  const url = `http://${host}:${port}/?user=${user}&password=${password}&database=${database}&query=${encodeURIComponent(query)}`;

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
      const count = parseInt(response.data.trim());
      console.log(`📊 Current row count in events table: ${count}`);

      if (count > 0) {
        console.log('✅ Events are being written to ClickHouse!');
        console.log('🎉 Queue consumer is working correctly.');
      } else {
        console.log('⚠️  No rows found. Send a test event and try again.');
        console.log('💡 Make sure the queue consumer is running and processing messages.');
      }
    } else {
      console.error(`❌ Query failed with status: ${response.statusCode}`);
      console.error(`Response: ${response.data}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed to query ClickHouse:', error.message);
    process.exit(1);
  }
}

countRows();