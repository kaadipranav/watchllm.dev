#!/usr/bin/env node

/**
 * ClickHouse Connection Verification Script
 * 
 * This script verifies that WatchLLM can connect to the ClickHouse instance.
 * 
 * Usage:
 *   node scripts/verify-clickhouse.js
 * 
 * Expected output:
 *   ✅ Successfully connected to ClickHouse! Version: 24.x.x.x
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

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

// Load environment variables before setting config
loadEnv();

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

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

async function verifyClickHouse() {
  log('\n🔍 Verifying ClickHouse Connection...', 'cyan');
  log('━'.repeat(50), 'cyan');

  // Check environment variables
  const config = {
    host: process.env.CLICKHOUSE_HOST || 'localhost',
    port: process.env.CLICKHOUSE_PORT || '8123',
    user: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'watchllm',
    ssl: process.env.CLICKHOUSE_SSL === 'true',
  };

  // Check for placeholder values
  const placeholders = ['your-clickhouse', 'watchllm'];
  if (placeholders.includes(config.host)) {
    log('\n❌ ClickHouse host is not configured!', 'red');
    log('\n📝 Please update worker/.dev.vars with your ClickHouse credentials:', 'yellow');
    log('   CLICKHOUSE_HOST=YOUR_DROPLET_IP', 'yellow');
    log('   CLICKHOUSE_USER=watchllm_user', 'yellow');
    log('   CLICKHOUSE_PASSWORD=YOUR_STRONG_PASSWORD', 'yellow');
    log('   CLICKHOUSE_DATABASE=watchllm', 'yellow');
    log('\n   See docs/CLICKHOUSE_SETUP.md for setup instructions\n', 'yellow');
    process.exit(1);
  }

  // Display configuration (with masked password)
  log('\n📋 Configuration:', 'blue');
  log(`   Host:     ${config.host}`, 'blue');
  log(`   Port:     ${config.port}`, 'blue');
  log(`   User:     ${config.user}`, 'blue');
  log(`   Password: ${'*'.repeat(config.password.length || 8)}`, 'blue');
  log(`   Database: ${config.database}`, 'blue');
  log(`   SSL:      ${config.ssl ? 'Enabled' : 'Disabled'}`, 'blue');

  const protocol = config.ssl ? 'https' : 'http';
  const baseUrl = `${protocol}://${config.host}:${config.port}/?user=${config.user}&password=${encodeURIComponent(config.password)}&database=${config.database}`;

  try {
    log('\n🔌 Attempting connection...', 'cyan');

    // Test 1: Ping
    const pingResponse = await makeRequest(baseUrl, 'SELECT 1');
    if (pingResponse.statusCode !== 200) {
      throw new Error(`Ping failed with status ${pingResponse.statusCode}: ${pingResponse.data}`);
    }
    log('   ✅ Ping successful', 'green');

    // Test 2: Get version
    const versionResponse = await makeRequest(baseUrl, 'SELECT version()');
    if (versionResponse.statusCode !== 200) {
      throw new Error(`Version query failed: ${versionResponse.data}`);
    }
    const version = versionResponse.data;
    log(`   ✅ Version: ${version}`, 'green');

    // Test 3: Check database exists
    const dbCheckResponse = await makeRequest(
      baseUrl,
      `SELECT name FROM system.databases WHERE name = '${config.database}'`
    );

    if (dbCheckResponse.data === '') {
      log(`   ⚠️  Database '${config.database}' does not exist`, 'yellow');
      log('   Creating database...', 'cyan');

      const createDbResponse = await makeRequest(
        baseUrl,
        `CREATE DATABASE IF NOT EXISTS ${config.database}`
      );

      if (createDbResponse.statusCode === 200) {
        log(`   ✅ Database '${config.database}' created`, 'green');
      } else {
        throw new Error(`Failed to create database: ${createDbResponse.data}`);
      }
    } else {
      log(`   ✅ Database '${config.database}' exists`, 'green');
    }

    // Test 4: List tables
    const tablesResponse = await makeRequest(
      baseUrl,
      `SELECT name FROM system.tables WHERE database = '${config.database}' FORMAT TabSeparated`
    );

    const tables = tablesResponse.data ? tablesResponse.data.split('\n').filter(Boolean) : [];

    if (tables.length === 0) {
      log('   ℹ️  No tables found (expected for fresh setup)', 'blue');
    } else {
      log(`   ✅ Found ${tables.length} table(s):`, 'green');
      tables.forEach(table => {
        log(`      - ${table}`, 'green');
      });
    }

    // Test 5: Write and read test
    log('\n🧪 Running read/write test...', 'cyan');

    const testTableName = 'watchllm_connection_test';

    // Create test table
    await makeRequest(
      baseUrl,
      `CREATE TABLE IF NOT EXISTS ${testTableName} (
        id UInt32,
        message String,
        timestamp DateTime DEFAULT now()
      ) ENGINE = MergeTree()
      ORDER BY id`
    );

    // Insert test data
    const testId = Math.floor(Math.random() * 1000000);
    await makeRequest(
      baseUrl,
      `INSERT INTO ${testTableName} (id, message) VALUES (${testId}, 'WatchLLM connection test')`
    );

    // Read test data
    const readResponse = await makeRequest(
      baseUrl,
      `SELECT message FROM ${testTableName} WHERE id = ${testId} FORMAT TabSeparated`
    );

    if (readResponse.data.trim() === 'WatchLLM connection test') {
      log('   ✅ Write test successful', 'green');
      log('   ✅ Read test successful', 'green');
    } else {
      throw new Error(`Read/write test failed: data mismatch (expected 'WatchLLM connection test', got '${readResponse.data.trim()}')`);
    }

    // Clean up test table
    await makeRequest(baseUrl, `DROP TABLE IF EXISTS ${testTableName}`);
    log('   ✅ Cleanup successful', 'green');

    // Success summary
    log('\n' + '━'.repeat(50), 'green');
    log('✅ All checks passed! ClickHouse is ready for WatchLLM', 'green');
    log('━'.repeat(50), 'green');
    log('\n📊 Connection Summary:', 'cyan');
    log(`   • ClickHouse Version: ${version}`, 'cyan');
    log(`   • Database: ${config.database}`, 'cyan');
    log(`   • Tables: ${tables.length}`, 'cyan');
    log(`   • Status: Ready ✅`, 'green');

    log('\n📝 Next Steps:', 'blue');
    log('   1. Proceed to Task 1.2: ClickHouse Schema Design', 'blue');
    log('   2. Run: node scripts/check-tables.js (after schema creation)', 'blue');
    log('   3. Continue with TASKS.md Phase 1\n', 'blue');

    process.exit(0);

  } catch (error) {
    log('\n' + '━'.repeat(50), 'red');
    log('❌ Connection Failed', 'red');
    log('━'.repeat(50), 'red');

    log('\n🔍 Error Details:', 'red');
    log(`   ${error.message}`, 'yellow');

    if (error.code) {
      log(`   Error Code: ${error.code}`, 'yellow');
    }

    log('\n🛠️  Troubleshooting Steps:', 'yellow');
    log('   1. Verify ClickHouse is running:', 'yellow');
    log('      ssh root@YOUR_DROPLET_IP "systemctl status clickhouse-server"', 'yellow');
    log('   2. Check firewall allows port 8123:', 'yellow');
    log('      ssh root@YOUR_DROPLET_IP "ufw status"', 'yellow');
    log('   3. Test HTTP interface directly:', 'yellow');
    log(`      curl ${protocol}://${config.host}:${config.port}/`, 'yellow');
    log('   4. Verify credentials in worker/.dev.vars', 'yellow');
    log('   5. Check docs/CLICKHOUSE_SETUP.md for detailed setup\n', 'yellow');

    process.exit(1);
  }
}

// Run verification
verifyClickHouse().catch(error => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});