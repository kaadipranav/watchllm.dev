#!/usr/bin/env node

/**
 * ClickHouse Schema Creation Script
 * 
 * This script applies the schema.sql file to ClickHouse
 * 
 * Usage:
 *   node scripts/create-schema.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

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

async function makeRequest(url, query = '', method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search + (query && method === 'GET' ? `&query=${encodeURIComponent(query)}` : ''),
            method: method,
            timeout: 30000,
        };

        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({
                statusCode: res.statusCode,
                data: data.trim()
            }));
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Connection timeout'));
        });

        if (method === 'POST' && query) {
            req.write(query);
        }

        req.end();
    });
}

async function createSchema() {
    log('\n🔨 Creating ClickHouse Schema...', 'cyan');
    log('━'.repeat(70), 'cyan');

    // Load configuration
    const config = {
        host: process.env.CLICKHOUSE_HOST || 'localhost',
        port: process.env.CLICKHOUSE_PORT || '8123',
        user: process.env.CLICKHOUSE_USER || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || '',
        database: process.env.CLICKHOUSE_DATABASE || 'watchllm',
        ssl: process.env.CLICKHOUSE_SSL === 'true',
    };

    const protocol = config.ssl ? 'https' : 'http';
    const baseUrl = `${protocol}://${config.host}:${config.port}/?user=${config.user}&password=${encodeURIComponent(config.password)}&database=${config.database}`;

    try {
        // Read schema file
        const schemaPath = path.join(__dirname, '..', 'clickhouse', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        log(`\n📄 Reading schema from: clickhouse/schema.sql`, 'blue');
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');

        // Split into individual statements (separated by semicolons)
        // First remove comment lines
        const lines = schemaContent.split('\n').filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 0 && !trimmed.startsWith('--') && !trimmed.startsWith('/*');
        });
        const cleanedContent = lines.join('\n');
        const statements = cleanedContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        log(`   Found ${statements.length} SQL statements\n`, 'blue');

        // Execute each statement
        let successCount = 0;
        let skipCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];

            // Extract table/view name for logging
            const match = statement.match(/CREATE\s+(TABLE|MATERIALIZED VIEW|VIEW)\s+(?:IF NOT EXISTS\s+)?(\w+)/i);
            const objectType = match ? match[1] : 'Statement';
            const objectName = match ? match[2] : `#${i + 1}`;

            try {
                log(`   ${i + 1}/${statements.length} Creating ${objectType}: ${objectName}...`, 'cyan');

                const response = await makeRequest(baseUrl, statement, 'POST');

                if (response.statusCode === 200) {
                    successCount++;
                    log(`      ✅ Success`, 'green');
                } else if (response.data.includes('already exists')) {
                    skipCount++;
                    log(`      ⏭️  Already exists (skipped)`, 'yellow');
                } else {
                    log(`      ⚠️  Warning: ${response.data}`, 'yellow');
                }
            } catch (error) {
                if (error.message.includes('already exists')) {
                    skipCount++;
                    log(`      ⏭️  Already exists (skipped)`, 'yellow');
                } else {
                    log(`      ❌ Failed: ${error.message}`, 'red');
                    throw error;
                }
            }
        }

        // Success summary
        log('\n' + '━'.repeat(70), 'green');
        log('✅ Schema Creation Complete!', 'green');
        log('━'.repeat(70), 'green');

        log('\n📊 Summary:', 'cyan');
        log(`   • Total Statements: ${statements.length}`, 'cyan');
        log(`   • Successfully Created: ${successCount}`, 'green');
        log(`   • Already Existed: ${skipCount}`, 'yellow');

        log('\n📝 Next Steps:', 'blue');
        log('   1. Verify tables: node scripts/check-tables.js', 'blue');
        log('   2. Proceed to Task 1.3: Cloudflare Queues Setup\n', 'blue');

        process.exit(0);

    } catch (error) {
        log('\n' + '━'.repeat(70), 'red');
        log('❌ Schema Creation Failed', 'red');
        log('━'.repeat(70), 'red');

        log('\n🔍 Error Details:', 'red');
        log(`   ${error.message}`, 'yellow');

        log('\n🛠️  Troubleshooting:', 'yellow');
        log('   1. Verify ClickHouse is running', 'yellow');
        log('   2. Check credentials in worker/.dev.vars', 'yellow');
        log('   3. Run: node scripts/verify-clickhouse.js', 'yellow');
        log('   4. Check clickhouse/schema.sql for syntax errors\n', 'yellow');

        process.exit(1);
    }
}

// Run schema creation
createSchema().catch(error => {
    log(`\n❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
});
