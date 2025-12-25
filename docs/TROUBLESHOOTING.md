# Troubleshooting Guide

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

## 2. API & Proxy Errors

### `500 Internal Server Error`
**Symptoms:** A generic error message from the proxy.
- **Cause:** A temporary issue with the WatchLLM edge network or upstream provider connectivity.
- **Solution:**
    1. Check our [Service Status Page](https://status.watchllm.dev).
    2. Retry the request with exponential backoff.
    3. If persistent, contact support.

### `502 Bad Gateway` - Provider Error
**Symptoms:** WatchLLM is working, but the upstream AI provider is failing.
- **Cause:** OpenAI, Anthropic, or Groq is currently experiencing an outage.
- **Solution:** WatchLLM automatically attempts retries for most transient errors. Check the status of the specific provider:
    - [OpenAI Status](https://status.openai.com)
    - [Anthropic Status](https://status.anthropic.com)
    - [Groq Status](https://status.groq.com)

---

## 3. Caching Issues

### Cache Misses when Cache should be Hit
**Symptoms:** `x-watchllm-cached` header returns `MISS` repeatedly for the same query.
- **Cause:** 
    1. **Exact Matching:** If you are using simple caching, even a single whitespace difference causes a miss.
    2. **Semantic Threshold:** If utilizing semantic caching (Pro plan), the queries might not be "similar" enough (default threshold is 0.95).
    3. **Streaming:** Caching behavior differs slightly for streaming responses (we cache the full stream after completion).
- **Solution:** 
    - Verify your prompt inputs are identical.
    - Check the `x-watchllm-cache-similarity` header on the response to see how close the match was.

---

## 4. Rate Limits & Quotas

### `429 Too Many Requests`
**Symptoms:** Plan limit reached.
- **Solution:** 
    1. Check `X-RateLimit-Remaining` header to see how close you are to the limit.
    2. Upgrade your plan in the Dashboard if you've outgrown the current tier.
    3. Implement exponential backoff in your application code.

---

## 5. Debugging

### Inspecting Headers
To confirm WatchLLM is working, inspect the response headers in your application logs or browser DevTools network tab.

Look for:
- `x-watchllm-cache`: `HIT`, `MISS`, or `HIT-SEMANTIC`
- `x-watchllm-latency-ms`: How long the request took.
- `x-watchllm-cost-usd`: The estimated cost of the request.

---

## Still having issues?
- **Discord Support:** [Join our community](https://discord.gg/watchllm)
- **Email:** support@watchllm.dev
