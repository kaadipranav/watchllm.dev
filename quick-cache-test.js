/**
 * Quick Cache Test for WatchLLM
 */

const API_KEY = process.env.WATCHLLM_API_KEY || "lgw_proj_736654d6fa5db55ced40e67bde8b1818cdb293e91d21420bd6a1eb6fe46c7185";
const PROXY_URL = process.env.WATCHLLM_PROXY_URL || "https://proxy.watchllm.dev/v1/chat/completions";

let fetch;
try {
  fetch = globalThis.fetch;
} catch (e) {
  fetch = require("undici").fetch;
}

async function makeRequest(prompt, desc) {
  console.log(`📤 ${desc}: "${prompt}"`);
  const start = Date.now();

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 20
    })
  });

  const cache = res.headers.get('X-WatchLLM-Cache') || 'MISS';
  const latency = res.headers.get('X-WatchLLM-Latency-Ms');
  const cost = res.headers.get('X-WatchLLM-Cost-USD');
  const time = Date.now() - start;

  console.log(`   📥 Cache: ${cache} | Time: ${time}ms${latency ? ` | Latency: ${latency}ms` : ''}${cost ? ` | Cost: $${cost}` : ''}`);

  return { cache, time, latency: latency ? parseInt(latency) : null, cost };
}

async function testCache() {
  console.log('🧪 Testing WatchLLM Caching Functionality\n');

  // Test 1: Exact match caching
  console.log('1️⃣  EXACT MATCH CACHING TEST');
  await makeRequest('What is 2 + 2?', 'First request');
  await new Promise(r => setTimeout(r, 1000));
  await makeRequest('What is 2 + 2?', 'Identical request');

  console.log('\n2️⃣  SEMANTIC CACHING TEST (Normalization)');
  await new Promise(r => setTimeout(r, 2000));
  await makeRequest('What is 3 + 3?', 'Base question');
  await new Promise(r => setTimeout(r, 1000));
  await makeRequest('WHAT IS 3 + 3???', 'Uppercase + punctuation');
  await new Promise(r => setTimeout(r, 1000));
  await makeRequest('whats 3 + 3', 'Contraction + lowercase');

  console.log('\n3️⃣  FILLER WORDS TEST');
  await new Promise(r => setTimeout(r, 2000));
  await makeRequest('What is 4 + 4?', 'Base question');
  await new Promise(r => setTimeout(r, 1000));
  await makeRequest('Please tell me what is 4 + 4?', 'With filler words');

  console.log('\n✅ Cache testing complete!');
}

testCache().catch(console.error);