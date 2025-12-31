#!/usr/bin/env node

/**
 * Golden Path E2E Test Script
 * Run after Phase 6 to verify the complete flow
 */

const https = require('https');
const { spawn } = require('child_process');

async function runGoldenPathTest() {
  console.log('🚀 Starting Golden Path E2E Test...');
  console.log('This will test: Python SDK -> Worker -> Queue -> ClickHouse -> Analytics API -> Dashboard');

  // Step 1: Send a test event via Python SDK (simulated)
  console.log('\n📤 Step 1: Sending test event...');
  try {
    const event = {
      event_id: `test-${Date.now()}`,
      event_type: 'prompt_call',
      project_id: 'test-project',
      run_id: 'golden-path-test',
      timestamp: new Date().toISOString(),
      tags: ['test', 'golden-path'],
      env: 'development',
      client: { sdk_version: '1.0.0', platform: 'test' },
      prompt: 'Hello, this is a test prompt for the golden path.',
      model: 'gpt-4',
      tokens_input: 10,
      tokens_output: 15,
      cost_estimate_usd: 0.002,
      response: 'This is a test response from the AI model.',
      response_metadata: { confidence_score: 0.95 },
      status: 'success',
      latency_ms: 250
    };

    // Send to worker (assuming it's running on localhost:8787)
    const workerResponse = await sendToWorker(event);
    if (!workerResponse.success) {
      throw new Error('Failed to send event to worker');
    }
    console.log('✅ Event sent to worker successfully');

    // Step 2: Wait for processing and check ClickHouse
    console.log('\n⏳ Step 2: Waiting for queue processing...');
    await sleep(3000); // Wait 3 seconds for queue processing

    const rowCount = await getClickHouseRowCount();
    if (rowCount === 0) {
      throw new Error('No events found in ClickHouse');
    }
    console.log(`✅ Event processed and stored in ClickHouse (${rowCount} total rows)`);

    // Step 3: Test Analytics API
    console.log('\n📊 Step 3: Testing Analytics API...');
    const stats = await getAnalyticsStats('test-project');
    if (!stats || stats.total_requests === undefined) {
      throw new Error('Analytics API not returning expected data');
    }
    console.log(`✅ Analytics API working: ${JSON.stringify(stats)}`);

    // Step 4: Test Dashboard (basic connectivity)
    console.log('\n🌐 Step 4: Testing Dashboard connectivity...');
    const dashboardResponse = await checkDashboardHealth();
    if (!dashboardResponse) {
      console.log('⚠️  Dashboard not accessible (may not be running, but that\'s OK)');
    } else {
      console.log('✅ Dashboard is accessible');
    }

    console.log('\n🎉 SUCCESS: Event logged, processed, and visible in API!');
    console.log('🏆 Golden Path test completed successfully.');

  } catch (error) {
    console.error('❌ Golden Path test failed:', error.message);
    console.error('💡 Check that all services are running and try individual task verifications.');
    process.exit(1);
  }
}

async function sendToWorker(event) {
  const postData = JSON.stringify(event);
  const options = {
    hostname: 'localhost',
    port: 8787,
    path: '/v1/projects/test-project/events',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-key',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: res.statusCode === 200, data: response });
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getClickHouseRowCount() {
  const host = process.env.CLICKHOUSE_HOST || 'localhost';
  const port = process.env.CLICKHOUSE_PORT || '8123';
  const user = process.env.CLICKHOUSE_USER || 'default';
  const password = process.env.CLICKHOUSE_PASSWORD || '';
  const database = process.env.CLICKHOUSE_DATABASE || 'watchllm';

  const query = 'SELECT count() FROM events WHERE project_id = \'test-project\'';
  const url = `http://${host}:${port}/?user=${user}&password=${password}&database=${database}&query=${encodeURIComponent(query)}`;

  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(parseInt(data.trim()));
        } else {
          resolve(0);
        }
      });
    });
    req.on('error', () => resolve(0));
    req.setTimeout(5000, () => resolve(0));
  });
}

async function getAnalyticsStats(projectId) {
  const options = {
    hostname: 'localhost',
    port: 8787,
    path: `/v1/analytics/stats?project_id=${projectId}`,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (e) {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.setTimeout(5000, () => resolve(null));
    req.end();
  });
}

async function checkDashboardHealth() {
  return new Promise((resolve) => {
    const req = https.get('https://localhost:3000/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => resolve(false));
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

runGoldenPathTest();