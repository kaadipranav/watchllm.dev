/**
 * Test for False Positive Cache Hits
 */

const API_KEY = process.env.WATCHLLM_API_KEY || "lgw_proj_736654d6fa5db55ced40e67bde8b1818cdb293e91d21420bd6a1eb6fe46c7185";
const PROXY_URL = process.env.WATCHLLM_PROXY_URL || "https://proxy.watchllm.dev/v1/chat/completions";

let fetch;
try { fetch = globalThis.fetch; } catch(e) { fetch = require("undici").fetch; }

async function testUnrelated(prompt, desc) {
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
      max_tokens: 30
    })
  });

  const cache = res.headers.get('X-WatchLLM-Cache') || 'MISS';
  const cost = res.headers.get('X-WatchLLM-Cost-USD');
  const time = Date.now() - start;

  console.log(`   📥 Cache: ${cache} | Time: ${time}ms${cost ? ` | Cost: $${cost}` : ''}`);

  return cache;
}

async function testFalsePositives() {
  console.log('🧪 Testing for False Positive Cache Hits\n');

  // Test completely unrelated prompts
  const tests = [
    { prompt: 'What is the capital of France?', desc: 'Geography question' },
    { prompt: 'How do I bake a chocolate cake?', desc: 'Cooking recipe' },
    { prompt: 'Explain quantum physics', desc: 'Science topic' },
    { prompt: 'What are the best hiking trails in Colorado?', desc: 'Travel question' },
    { prompt: 'Write a haiku about autumn leaves', desc: 'Creative writing' },
    { prompt: 'How does photosynthesis work?', desc: 'Biology question' }
  ];

  let falsePositives = 0;
  let totalTests = 0;

  for (const test of tests) {
    totalTests++;
    const result = await testUnrelated(test.prompt, test.desc);

    if (result === 'HIT' || result === 'HIT-SEMANTIC') {
      console.log(`   ⚠️  FALSE POSITIVE! This should be MISS but got ${result}`);
      falsePositives++;
    } else {
      console.log(`   ✅ Correctly returned ${result}`);
    }

    // Longer delay to avoid rate limits
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n📊 Results: ${falsePositives}/${totalTests} false positives`);

  if (falsePositives === 0) {
    console.log('✅ No false positives detected - caching is working correctly!');
  } else {
    console.log('⚠️  False positives detected - semantic similarity threshold may be too low');
  }
}

testFalsePositives().catch(console.error);