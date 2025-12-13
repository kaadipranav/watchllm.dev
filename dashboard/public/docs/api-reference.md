# API Reference

> Wide picture of the WatchLLM proxy, its security model, and the payloads that power every customer request.

![API traffic overview](https://via.placeholder.com/900x360.png?text=API+Traffic+Dashboard)

## Authentication

| Header | Value |
|---|---|
| `Authorization` | `Bearer lgw_<project|test>_...` |
| `Content-Type` | `application/json` |

Your API key is bound to a project, not a person. Rotate the key anytime from the dashboard, but never expose it inside a browser bundle.

## Proxy Endpoints (Base URL: `https://proxy.watchllm.dev`)

### POST /v1/chat/completions
- OpenAI-compatible chat completion request.
- Supports streaming (`stream: true`), functions, tools, stop sequences, and metadata.
- Returns `x-WatchLLM-*` headers that describe cache hits, cost, provider, latency, and tokens saved.

**Sample body:**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are WatchLLM." },
    { "role": "user", "content": "Summarize my last release." }
  ],
  "temperature": 0.75,
  "max_tokens": 250
}
```

**Success response highlights:**
```json
{
  "choices": [ ... ],
  "usage": { ... }
  // headers: x-WatchLLM-cached, x-WatchLLM-cost-usd, x-WatchLLM-latency-ms, x-WatchLLM-provider
}
```

### POST /v1/completions
- Legacy endpoint that mirrors OpenAI text completions.
- Accepts `prompt`, `temperature`, `max_tokens`, `stop`.
- Cached responses still return the same headers as `/chat/completions`.

### POST /v1/embeddings
- OpenAI-compatible embeddings request with single or batch input.
- Always routed to OpenAI.
- Responses include normalized vectors and usage info.

### GET /health
- Lightweight health check for uptime monitoring.
- Returns service name, version, timestamp, and dependency statuses (`redis`, `supabase`).

### GET /v1/models
- Mirror of the OpenAI models list for compatibility.
- Use as a quick reference for provider availability.

## Headers injected by WatchLLM

| Header | Description |
|---|---|
| `x-WatchLLM-cached` | `HIT` or `MISS` depending on cache outcome |
| `x-WatchLLM-cost-usd` | Estimated provider cost for the request |
| `x-WatchLLM-latency-ms` | Total processing time (in milliseconds) |
| `x-WatchLLM-provider` | Provider that fulfilled the call (openai/anthropic/groq) |
| `x-WatchLLM-tokens-saved` | Tokens saved when the cache hits |

## Error responses

- `401 invalid_api_key`: API key not recognized or inactive.
- `429 rate_limit_exceeded`: Per-minute throttling enforced by plan limits.
- `400 invalid_request_error`: Bad payload (missing model/messages/prompt).
- `500 api_error`: Internal worker issue (Sentry + Datadog capture every stack trace).

## Webhooks

The dashboard exposes `POST /api/webhooks/stripe` for billing events such as `checkout.session.completed`, `customer.subscription.updated`, and `invoice.payment_failed`. Every call is signature-verified and logged into Supabase.

Use the manual endpoint to keep billing state, send emails, and notify team channels when payments fail.

## SDKs & Examples

- Drop-in compatible with the official OpenAI SDKs—simply swap the base URL.
- Refer to [examples](./examples.md) for Node.js, Python, and cURL snippets.
