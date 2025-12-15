// test-proxy.js
const API_KEY = "lgw_proj_58d994d940463baec34830622f75f1af8d2d58bbcf95d319aee1f308b8c27974"; // We need a valid key format
const PROXY_URL = "https://watchllm-worker.kiwi092020.workers.dev/v1/chat/completions";

async function makeRequest(i) {
    console.log(`\n--- Request ${i} ---`);
    const start = Date.now();

    try {
        const res = await fetch(PROXY_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json",
                "Accept-Encoding": "identity" // Disable compression for debugging
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct:free", // Valid OpenRouter model
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
        const cacheStatus = res.headers.get("x-watchllm-cached") || "MISS";
        const requestId = res.headers.get("x-request-id");

        console.log(`Status: ${res.status}`);
        console.log(`Time: ${duration}ms`);
        console.log(`Cache: ${cacheStatus} ${cacheStatus === 'HIT' ? '✅ (MONEY SAVED)' : '❌ (COST INCURRED)'}`);
        if (res.status !== 200) {
            console.log("Full Response Body:", JSON.stringify(data, null, 2));
            console.log("Raw Text:", text); // Also print raw just in case
        }
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
        const res = await fetch(PROXY_URL.replace("/v1/chat/completions", "/health"), {
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

    // First request (Cache MISS)
    await makeRequest(1);

    // Wait a sec
    await new Promise(r => setTimeout(r, 1000));

    // Second request (Cache HIT)
    await makeRequest(2);
}

run();