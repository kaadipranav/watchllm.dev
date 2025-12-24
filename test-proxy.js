
/**
 * WatchLLM Proxy Test Script - Enhanced for Prompt Normalization Testing
 *
 * 1. Copy your API key from the dashboard and paste it below.
 * 2. Set your deployed proxy endpoint below.
 * 3. Run: node test-proxy.js
 * 4. Check the output for cache hits/misses and verify usage in your dashboard.
 */

// TODO: Set your API key and proxy endpoint here:
const API_KEY = process.env.WATCHLLM_API_KEY || "lgw_proj_736654d6fa5db55ced40e67bde8b1818cdb293e91d21420bd6a1eb6fe46c7185";
const PROXY_URL = process.env.WATCHLLM_PROXY_URL || "https://proxy.watchllm.dev/v1/chat/completions";
const fetchFn = typeof fetch === "function" ? fetch : require("undici").fetch;

if (API_KEY.includes("<") || PROXY_URL.includes("your-proxy-endpoint")) {
    console.error("Please set WATCHLLM_API_KEY and WATCHLLM_PROXY_URL (or edit the top of test-proxy.js) before running the script.");
    process.exit(1);
}

// Test cases for prompt normalization - focused on rate limit friendly testing
const NORMALIZATION_TESTS = [
    {
        name: "Case and Punctuation Normalization",
        prompts: [
            "What is 5 + 3?",
            "WHAT IS 5 + 3???",
            "what is 5 + 3!!!",
            "What is 5   +   3..."
        ],
        delay: 2000 // 2 second delay between requests
    },
    {
        name: "Question Contractions",
        prompts: [
            "What's 5 + 3?",
            "What is 5 + 3?",
            "whats 5 + 3?",
            "what is 5 + 3?"
        ],
        delay: 2000
    },
    {
        name: "Filler Words",
        prompts: [
            "Please tell me what is 5 + 3",
            "Could you tell me what is 5 + 3?",
            "Tell me what is 5 + 3",
            "what is 5 + 3"
        ],
        delay: 3000 // Longer delay for these
    },
    {
        name: "Math Operators",
        prompts: [
            "What is 5 times 3?",
            "What is 5 x 3?",
            "What is 5 * 3?",
            "What is 5 multiplied by 3?"
        ],
        delay: 3000
    }
];

async function makeRequest(prompt, testName, requestNum) {
    console.log(`\n--- ${testName} - Request ${requestNum} ---`);
    console.log(`Prompt: "${prompt}"`);

    const start = Date.now();

    try {
        const res = await fetchFn(PROXY_URL, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "identity" // Disable compression for debugging
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free", // Using a lighter, faster free model
                messages: [{ role: "user", content: prompt }],
                temperature: 0, // Deterministic for caching
                max_tokens: 50 // Keep responses short for testing
            })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parsing JSON. Raw response:");
            console.error(text);
            return null;
        }

        const cacheHeader = res.headers.get('X-WatchLLM-Cache');
        const latency = res.headers.get('X-WatchLLM-Latency-Ms');
        const cost = res.headers.get('X-WatchLLM-Cost-USD');

        console.log(`Status: ${res.status} | Cache: ${cacheHeader || 'MISS'} | Time: ${Date.now() - start}ms`);
        if (cost) console.log(`Cost: $${cost}`);
        if (latency) console.log(`Latency: ${latency}ms`);

        const responseText = data.choices?.[0]?.message?.content || data.error?.message || 'No response';
        console.log(`Response: ${responseText.substring(0, 80)}${responseText.length > 80 ? '...' : ''}`);

        return { cacheHeader, responseText, status: res.status };

    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
    }
}

async function checkHealth() {
    console.log(`\n--- Checking Health ---`);
    try {
        const res = await fetchFn(PROXY_URL.replace("/v1/chat/completions", "/health"), {
            headers: { "Accept-Encoding": "identity" }
        });
        const text = await res.text();
        console.log(`Health Status: ${res.status}`);
        console.log(`Health Response: ${text.substring(0, 100)}...`);
        return res.status === 200;
    } catch (e) {
        console.error("Health check failed:", e.message);
        return false;
    }
}

async function runNormalizationTests() {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TESTING PROMPT NORMALIZATION FEATURE");
    console.log("=".repeat(80));

    let totalRequests = 0;
    let cacheHits = 0;
    let cacheMisses = 0;

    for (const test of NORMALIZATION_TESTS) {
        console.log(`\n📋 ${test.name}`);
        console.log("-".repeat(50));

        const results = [];

        // Send all prompts in the test group
        for (let i = 0; i < test.prompts.length; i++) {
            const result = await makeRequest(test.prompts[i], test.name, i + 1);
            if (result) {
                results.push(result);
                totalRequests++;

                if (result.cacheHeader === 'HIT') {
                    cacheHits++;
                } else if (result.cacheHeader === 'MISS') {
                    cacheMisses++;
                }
            }

            // Use test-specific delay between requests to avoid rate limits
            const delay = test.delay || 1000;
            await new Promise(r => setTimeout(r, delay));
        }

        // Analyze results for this test group
        const hits = results.filter(r => r.cacheHeader === 'HIT').length;
        const misses = results.filter(r => r.cacheHeader === 'MISS').length;

        console.log(`\n📊 ${test.name} Results:`);
        console.log(`   Cache Hits: ${hits}/${results.length}`);
        console.log(`   Cache Misses: ${misses}/${results.length}`);

        if (hits > 1) {
            console.log(`   ✅ Normalization working! ${hits} prompts hit the same cache entry.`);
        } else {
            console.log(`   ⚠️  Normalization may not be working - only ${hits} cache hits in group.`);
        }
    }

    // Overall summary
    console.log("\n" + "=".repeat(80));
    console.log("📈 OVERALL TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Cache Hits: ${cacheHits}`);
    console.log(`Cache Misses: ${cacheMisses}`);
    console.log(`Hit Rate: ${((cacheHits / totalRequests) * 100).toFixed(1)}%`);

    if (cacheHits > cacheMisses) {
        console.log("🎉 SUCCESS: Prompt normalization is significantly improving cache hit rates!");
    } else {
        console.log("⚠️  WARNING: Cache hit rate is low. Check if normalization is enabled.");
    }
}

async function runBasicCacheTest() {
    console.log("\n" + "=".repeat(80));
    console.log("🔄 BASIC CACHE TEST (Original functionality)");
    console.log("=".repeat(80));

    // Request 1: First request (should be MISS)
    console.log("Sending first request...");
    await makeRequest("What is 7+8?", "Basic Cache Test", 1);

    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

    // Request 2: Identical request (should be HIT)
    console.log("\nSending identical request...");
    await makeRequest("What is 7+8?", "Basic Cache Test", 2);
}

async function run() {
    const healthOk = await checkHealth();
    if (!healthOk) {
        console.error("❌ Health check failed. Aborting tests.");
        process.exit(1);
    }

    // Run basic cache test first
    await runBasicCacheTest();

    // Run comprehensive normalization tests
    await runNormalizationTests();

    console.log("\n" + "=".repeat(80));
    console.log("✨ Testing complete! Check your dashboard for usage analytics.");
    console.log("=".repeat(80));
}

run();