#!/usr/bin/env node

/**
 * ClickHouse Tables Verification Script
 * Run after Task 1.2 to verify schema creation
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

/**
 * Robustly load environment variables from multiple possible locations
 */
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../dashboard/.env.local'),
    path.join(__dirname, '../worker/.dev.vars')
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').map(l => l.trim()).forEach(line => {
        if (!line || line.startsWith('#')) return;
        const parts = line.split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          let value = parts.slice(1).join('=').trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length - 1);
          }
          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  }
}

// Load environment variables
loadEnv();

async function makeRequest(url, query = '') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: query ? 'POST' : 'GET',
      timeout: 10000,
      headers: query ? {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(query),
      } : {},
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        data: data.trim(),
        headers: res.headers
      }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Connection timeout'));
    });

    if (query) {
      req.write(query);
    }
    req.end();
  });
}

async function checkTables() {
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = process.env.CLICKHOUSE_PORT || '8123';
  const user = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  const database = process.env.CLICKHOUSE_DATABASE || 'watchllm';
  const ssl = process.env.CLICKHOUSE_SSL === 'true';

  const protocol = ssl ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}:${port}/?user=${user}&password=${encodeURIComponent(password)}&database=${database}`;

  try {
    const response = await makeRequest(baseUrl, 'SHOW TABLES');

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