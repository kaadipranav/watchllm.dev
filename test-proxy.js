
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
const PROXY_URL = process.env.WATCHLLM_PROXY_URL || "https://watchllm-worker.kiwi092020.workers.dev/v1/chat/completions";
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
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "identity" // Disable compression for debugging
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free", // Using a lighter, faster free model
                messages: [{ role: "user", content: "What is 2+2?" }],
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

        const duration = Date.now() - start;

        // Check headers for cache hit

        const cacheStatus = res.headers.get("x-cache") || "MISS";
        const requestId = res.headers.get("x-request-id");
        const usage = res.headers.get("x-watchllm-usage");
        const debug = res.headers.get("x-watchllm-debug");

        console.log(`Status: ${res.status}`);
        console.log(`Time: ${duration}ms`);
        console.log(`Cache: ${cacheStatus} ${cacheStatus === 'HIT' ? '✅ (MONEY SAVED)' : '❌ (COST INCURRED)'}`);
        if (usage) console.log(`Usage: ${usage}`);
        if (requestId) console.log(`Request ID: ${requestId}`);
        if (debug) console.log(`Debug: ${debug}`);

        console.log("Full Response Body:", JSON.stringify(data, null, 2));

        console.log(`Response: ${data.choices?.[0]?.message?.content}`);

    } catch (e) {
        if (e.cause && e.cause.code === 'ECONNREFUSED') {
            console.error("Error: Connection refused. Is the proxy server running on " + PROXY_URL + "?");
            console.error("Tip: Run 'pnpm run dev' in the worker directory to start the server.");
        } else {
            console.error("Error:", e.message);
        }
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

    console.log("\n--- Testing Semantic Caching ---");

    // Request 1: Fresh prompt
    console.log("Sending: 'Calculate 5 times 3'");
    await makeRequestCustom("Calculate 5 times 3");

    await new Promise(r => setTimeout(r, 2000)); // Wait for D1 write

    // Request 2: Semantically similar variant
    console.log("\nSending: 'What is 5 multiplied by 3?'");
    await makeRequestCustom("What is 5 multiplied by 3?");
}

async function makeRequestCustom(prompt) {
    const start = Date.now();
    try {
        const res = await fetchFn(PROXY_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct:free",
                messages: [
                    { role: "system", content: `Current time: ${Date.now()}` }, // Bypass simple cache
                    { role: "user", content: prompt }
                ],
                temperature: 0
            })
        });

        const data = await res.json();
        const duration = Date.now() - start;
        const cacheStatus = res.headers.get("x-cache") || "MISS";
        const debug = res.headers.get("x-watchllm-debug");

        console.log(`Status: ${res.status} | Cache: ${cacheStatus} | Time: ${duration}ms`);
        if (debug) console.log(`Debug: ${debug}`);
        console.log(`Response: ${data.choices?.[0]?.message?.content}`);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

run();