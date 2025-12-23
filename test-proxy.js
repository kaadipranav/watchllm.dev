
/**
 * WatchLLM Proxy Test Script
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

async function makeRequest(i) {
    console.log(`\n--- Request ${i} ---`);
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
                messages: [{ role: "user", content: "What is 2+2?" }], // Identical message for deterministic cache test
                temperature: 0 // Deterministic for caching
            })
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parsing JSON. Raw response:");
            console.error(text);
            return;
        }

        const cacheHeader = res.headers.get('X-WatchLLM-Cache');
        const latency = res.headers.get('X-WatchLLM-Latency-Ms');
        const cost = res.headers.get('X-WatchLLM-Cost-USD');
        
        console.log(`Status: ${res.status} | Cache: ${cacheHeader || 'MISS'} | Time: ${Date.now() - start}ms`);
        if (cost) console.log(`Cost: $${cost}`);
        if (latency) console.log(`Latency: ${latency}ms`);
        
        const responseText = data.choices?.[0]?.message?.content || data.error?.message || 'No response';
        console.log(`Response: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
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
    } catch (e) {
        console.error("Health check failed:", e.message);
    }
}

async function run() {
    await checkHealth();

    console.log("\n--- Testing Deterministic Caching ---");

    // Request 1: First request (should be MISS)
    console.log("Sending first request...");
    await makeRequest(1);

    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

    // Request 2: Identical request (should be HIT)
    console.log("\nSending identical request...");
    await makeRequest(2);
}

run();