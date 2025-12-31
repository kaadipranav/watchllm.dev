#!/usr/bin/env node

/**
 * ClickHouse Tables Verification Script
 * Run after Task 1.2 to verify schema creation
 */

const https = require('https');

async function checkTables() {
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = process.env.CLICKHOUSE_PORT || '8123';
  const user = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  const database = process.env.CLICKHOUSE_DATABASE || 'watchllm';

  const query = 'SHOW TABLES';
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
      const tables = response.data.trim().split('\n').filter(t => t.length > 0);
      console.log('✅ ClickHouse tables found:');
      tables.forEach(table => console.log(`  📋 ${table}`));

      const expectedTables = ['events', 'tool_calls', 'agent_steps'];
      const missingTables = expectedTables.filter(t => !tables.includes(t));

      if (missingTables.length > 0) {
        console.error(`❌ Missing expected tables: ${missingTables.join(', ')}`);
        console.error('💡 Run the schema.sql migration and try again.');
        process.exit(1);
      } else {
        console.log('🎉 All expected tables are present!');
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

checkTables();