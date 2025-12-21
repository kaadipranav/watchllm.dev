# Troubleshooting Guide - WatchLLM

> **Purpose:** A centralized guide to help you resolve common issues when integrating or using WatchLLM.

---

## 1. Authentication Issues

### `401 Unauthorized` - Invalid API Key
**Symptoms:** Your requests fail with a 401 status code.
- **Cause:** The provided API key is either missing, mistyped, or has been revoked.
- **Solution:** 
    1. Ensure your API key starts with `lgw_`.
    2. Check the `Authorization` header format: `Bearer lgw_your_key_here`. 
    3. Verify the key exists in your Dashboard under the specific project.

### Header Mismatch
**Symptoms:** Requests are rejected even with a valid key.
- **Cause:** Some SDKs or frameworks might add default headers that conflict with WatchLLM's requirements.
- **Solution:** Ensure `Content-Type: application/json` is explicitly set. Minimal headers required are `Authorization` and `Content-Type`.

---

## 2. Worker & Proxy Errors

### `500 Internal Server Error`
**Symptoms:** A generic error message from the proxy.
- **Cause:** Often related to background services like D1 (Database) or Redis (Cache) being unavailable.
- **Solution:**
    1. Check the [Service Status Page](https://status.WatchLLM.com).
    2. If you are self-hosting:
        - Verify `wrangler d1` credentials are correct.
        - Ensure Upstash Redis URL/Token is properly set in `wrangler.toml` secrets.

### `502 Bad Gateway` - Provider Error
**Symptoms:** WatchLLM is working, but the upstream AI provider is failing.
- **Cause:** OpenAI, Anthropic, or Groq is currently experiencing an outage.
- **Solution:** WatchLLM automatically attempts retries for most transient errors. Check the status of the specific provider:
    - [OpenAI Status](https://status.openai.com)
    - [Anthropic Status](https://status.anthropic.com)
    - [Groq Status](https://status.groq.com)

---

## 3. Caching & Persistence

### Cache Misses when Cache should be Hit
**Symptoms:** `x-WatchLLM-cached` header returns `false` repeatedly for the same query.
- **Cause:** 
    1. **Non-deterministic parameters:** If `temperature` is high, semantic caching might require a higher similarity threshold.
    2. **Streaming:** Caching behavior differs slightly for streaming responses.
- **Solution:** Check your `wrangler.toml` for `SEMANTIC_CACHE_THRESHOLD`. Lowering it (e.g., to `0.85`) increases hit rate but may reduce answer precision.

### D1 Connection Errors
**Symptoms:** Logs show "D1_ERROR" or "Database not found".
- **Cause:** The Cloudflare D1 database binding name does not match what is in `worker/src/lib/d1.ts`.
- **Solution:** Ensure your `wrangler.toml` has `[[d1_databases]]` with `binding = "DB"`.

---

## 4. Rate Limits & Quotas

### `429 Too Many Requests`
**Symptoms:** Plan limit reached.
- **Solution:** 
    1. Check `X-RateLimit-Remaining` header to see how close you are to the limit.
    2. Upgrade your plan in the Dashboard if you've outgrown the current tier.
    3. Implement exponential backoff in your application code.

---

## 5. Development & Local Debugging

### Wrangler Preview Issues
- **Problem:** Environmental variables (`OPENROUTER_API_KEY`, etc.) aren't loading locally.
- **Fix:** Create a `.dev.vars` file in the `worker` directory with your secrets (format: `KEY=VALUE`).

### Logs Tracking
To see live logs from your deployed worker:
```bash
wrangler tail
```
This is the fastest way to identify the exact line of code causing a `500` error.

---

## Still having issues?
- **GitHub Issues:** [WatchLLM/Issues](https://github.com/kaadipranav/WATCHLLM/issues)
- **Discord Support:** [Join our community](https://discord.gg/WatchLLM)
- **Email:** support@WatchLLM.com


