
/**
 * WatchLLM Proxy Test Script - Comprehensive Semantic Cache Verification
 *
 * 1. Copy your API key from the dashboard and paste it below.
 * 2. Set your deployed proxy endpoint below.
 * 3. Run: node test-proxy.js
 */

const API_KEY = process.env.WATCHLLM_API_KEY || "lgw_proj_736654d6fa5db55ced40e67bde8b1818cdb293e91d21420bd6a1eb6fe46c7185";
const PROXY_URL = process.env.WATCHLLM_PROXY_URL || "https://proxy.watchllm.dev/v1/chat/completions";
const fetchFn = typeof fetch === "function" ? fetch : require("undici").fetch;

if (API_KEY.includes("<") || PROXY_URL.includes("your-proxy-endpoint")) {
    console.error("Please set WATCHLLM_API_KEY and WATCHLLM_PROXY_URL before running the script.");
    process.exit(1);
}

// Helper to delay between requests
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function makeRequest(params, label) {
    console.log(`\n🔹 ${label}`);
    const start = Date.now();

    try {
        const res = await fetchFn(PROXY_URL, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free",
                temperature: 0,
                max_tokens: 50,
                ...params
            })
        });

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = { error: text }; }

        const cacheStatus = res.headers.get('X-WatchLLM-Cache');
        const similarity = res.headers.get('X-WatchLLM-Cache-Similarity');
        const latency = Date.now() - start;

        console.log(`   Status: ${res.status}`);
        console.log(`   Cache: ${cacheStatus} ${similarity ? `(Sim: ${similarity})` : ''}`);
        console.log(`   Latency: ${latency}ms`);

        if (data.choices?.[0]?.message?.content) {
            console.log(`   Response: "${data.choices[0].message.content.substring(0, 60).replace(/\n/g, ' ')}..."`);
        }

        return { cacheStatus, status: res.status };
    } catch (e) {
        console.error(`   Error: ${e.message}`);
        return { status: 500 };
    }
}

async function runTests() {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 STARTING COMPREHENSIVE SEMANTIC CACHE TESTS");
    console.log("=".repeat(60));

    // Generate a random topic/suffix to ensure we don't hit previous run's cache
    const runId = Math.random().toString(36).substring(7);
    const entity = `France-${runId}`;
    console.log(`ℹ️  Run ID: ${runId} (Using entity "${entity}" to bypass existing cache)`);

    // 1. Baseline Request
    console.log("\n--- PHASE 1: Baseline ---");
    await makeRequest({
        messages: [{ role: "user", content: `What is the capital of ${entity}?` }]
    }, `Request 1: Baseline 'What is the capital of ${entity}?' (Should MISS)`);

    await delay(2000);

    // 2. Exact Match (Should HIT-SEMANTIC or HIT)
    console.log("\n--- PHASE 2: Exact Match ---");
    await makeRequest({
        messages: [{ role: "user", content: `What is the capital of ${entity}?` }]
    }, `Request 2: Exact Repeat (Should HIT/HIT-SEMANTIC)`);

    await delay(2000);

    // 3. Semantic Similarity (Should HIT-SEMANTIC)
    console.log("\n--- PHASE 3: Semantic Similarity ---");
    await makeRequest({
        messages: [{ role: "user", content: `tell me the capital city of ${entity} please` }]
    }, `Request 3: Paraphrased 'tell me the capital city of ${entity} please' (Should HIT-SEMANTIC)`);

    await delay(2000);

    // 4. System Prompt Difference (Should MISS)
    console.log("\n--- PHASE 4: Context Sensitivity (System Prompt) ---");
    await makeRequest({
        messages: [
            { role: "system", content: "You are a pirate." },
            { role: "user", content: `What is the capital of ${entity}?` }
        ]
    }, `Request 4: Same User Query, Different System Prompt (Should MISS)`);

    await delay(2000);

    // 5. Tools Difference (Should MISS due to Context Hash)
    console.log("\n--- PHASE 5: Context Sensitivity (Tools) ---");
    const tools = [{
        type: "function",
        function: {
            name: "get_weather",
            description: "Get weather",
            parameters: { type: "object", properties: {} }
        }
    }];

    await makeRequest({
        messages: [{ role: "user", content: `What is the capital of ${entity}?` }],
        tools: tools
    }, `Request 5: Same User Query, With Tools (Should MISS)`);

    await delay(2000);

    // 6. JSON Mode Difference (Should MISS due to Context Hash)
    console.log("\n--- PHASE 6: Context Sensitivity (JSON Mode) ---");
    await makeRequest({
        messages: [{ role: "user", content: `What is the capital of ${entity}?` }],
        response_format: { type: "json_object" }
    }, `Request 6: Same User Query, JSON Mode (Should MISS)`);

    await delay(2000);

    // 7. Verify Cache on Complex Context (Should HIT)
    console.log("\n--- PHASE 7: Complex Context Repeat ---");
    await makeRequest({
        messages: [{ role: "user", content: `What is the capital of ${entity}?` }],
        tools: tools
    }, `Request 7: Repeat of Request 5 (With Tools) (Should HIT/HIT-SEMANTIC)`);

    console.log("\n" + "=".repeat(60));
    console.log("✨ TESTS COMPLETE");
    console.log("=".repeat(60));
}

runTests();
