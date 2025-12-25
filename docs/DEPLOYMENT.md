# Going to Production

When you're ready to deploy your application using WatchLLM to production, follow these best practices to ensure reliability, security, and optimal performance.

---

## 1. Environment Variables

**Never hardcode your API keys.** Always use environment variables in your deployment platform (Vercel, AWS, Heroku, etc.).

- **Good:** `apiKey: process.env.WATCHLLM_API_KEY`
- **Bad:** `apiKey: "lgw_123456789"`

### Recommended Setup

| Variable | Description |
|----------|-------------|
| `WATCHLLM_API_KEY` | Your project-specific API Key. |
| `OPENAI_BASE_URL` | Set to `https://proxy.watchllm.dev/v1` to easily toggle caching on/off. |

---

## 2. Separate Development & Production

We strongly recommend creating separate **Projects** in the WatchLLM dashboard for different environments. This allows you to:

1. **Track costs separately** (know exactly what Prod vs. Dev is spending).
2. **Isolate keys** (if a Dev key leaks, your Prod app isn't compromised).
3. **Analyze cache hit rates** accurately (Dev testing often skews cache stats).

**Example:**
- Project: `MyApp (Prod)` -> Key: `lgw_prod_...`
- Project: `MyApp (Dev)` -> Key: `lgw_dev_...`

---

## 3. Handling Timeouts & Latency

WatchLLM adds minimal latency (typically <20ms) for proxying, and saves significant time (hundreds of ms) on cache hits. However, networks are unpredictable.

Ensure your HTTP client has appropriate timeout settings:

```typescript
const client = new OpenAI({
  apiKey: process.env.WATCHLLM_API_KEY,
  baseURL: "https://proxy.watchllm.dev/v1",
  timeout: 30000, // 30 seconds
  maxRetries: 2,
});
```

---

## 4. Reliability & Failover

WatchLLM is designed for high availability with global edge replication. However, for mission-critical applications, you may want to implement client-side failover.

If `proxy.watchllm.dev` returns a 5xx error (rare), your code can fallback to the direct OpenAI API:

```typescript
try {
  // Try WatchLLM first
  return await watchllmClient.chat.completions.create({...});
} catch (error) {
  // If 500/502/503, fallback to direct
  console.warn("WatchLLM unavailable, using direct fallback");
  return await directOpenAIClient.chat.completions.create({...});
}
```

---

## 5. Rate Limiting

WatchLLM enforces rate limits based on your plan (e.g., Free, Starter, Pro).
If you hit a limit, you will receive a `429 Too Many Requests` response.

**Best Practice:** Implement exponential backoff in your application to handle 429s gracefully, or upgrade your plan if you consistently hit limits.
