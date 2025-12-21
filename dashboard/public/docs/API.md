# API Reference

> Everything you need to integrate the WatchLLM proxy with minimal code changes.



### Base URLs (choose the right environment)

| Environment | Base URL |
|---|---|
| Local development | `http://localhost:8787/v1` (worker)
| Production (managed) | `https://proxy.watchllm.dev/v1` |

### Authentication

WatchLLM uses project-scoped API keys that look like `lgw_proj_<slug>_<random>`. Every request must include the header below.

```
Authorization: Bearer lgw_proj_xxx
Content-Type: application/json
```

Rotate keys from the dashboard, revoke compromised keys instantly, and never embed them in client-side bundles.

## Key Endpoints

Each endpoint mirrors OpenAI semantics but adds caching metadata in headers.

### POST /v1/chat/completions  
The main multi-role chat endpoint. Supports function calling, streaming responses (`stream: true`), and delta delivery.

**Sample request**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "You are WatchLLM." },
    { "role": "user", "content": "Summarize today’s alerts." }
  ],
  "temperature": 0.3,
  "stream": true
}
```

**Response highlights (JSON + headers)**
```json
{
  "choices": [ ... ],
  "usage": { "prompt_tokens": 150, "completion_tokens": 60 }
}
```

Response headers:
```
x-WatchLLM-cached: HIT
x-WatchLLM-cost-usd: 0.00
x-WatchLLM-latency-ms: 95
x-WatchLLM-provider: openai
```

### POST /v1/completions  
Legacy text-completions endpoint. Works with OpenAI-style prompts and the same caching metadata as `/chat/completions`.

### POST /v1/embeddings  
Returns normalized vectors for single or batched inputs. Always routed to OpenAI but still logged and cached for 24 hours by default.

### GET /health  
Lightweight health check used by load balancers and monitors. Returns `dependencies.redis`, `dependencies.supabase`, and `uptime`.

### GET /v1/models  
Mirror of provider model list. Useful for verifying the currently enabled models without querying each provider.

## SDK Picks

Reuse the official OpenAI SDKs—only swap the base URL and API key. Refer to [EXAMPLES](/docs/EXAMPLES) for ready-to-run snippets.

## Caching Headers

| Header | Purpose |
|---|---|
| `x-WatchLLM-cached` | `HIT` or `MISS` so you can short-circuit scorecards. |
| `x-WatchLLM-cost-usd` | Estimated provider spend (includes streaming increments). |
| `x-WatchLLM-latency-ms` | Total end-to-end time, including cache lookups. |
| `x-WatchLLM-provider` | Provider that handled the miss (openai/anthropic/groq). |
| `x-WatchLLM-tokens-saved` | Zero when the cache misses; >0 when a cache hit saves tokens. |

## Error Model

| Code | Status | Description | Fix |
|---|---|---|---|
| `invalid_api_key` | 401 | API key missing or revoked. | Rotate key from the dashboard and retry; do not leak old keys. |
| `rate_limit_exceeded` | 429 | Plan limit reached (per minute). | Upgrade plan or slow down client; check `X-RateLimit-Remaining`. |
| `invalid_request_error` | 400 | Missing model/messages or invalid payload. | Validate `messages`, `model`, `temperature`, and JSON structure. |
| `api_error` | 500 | Unexpected worker exception. | Check Sentry + worker logs; automatic retries are safe. |
| `signature_verification_failed` | 400 (webhook) | Stripe webhook secret mismatch. | Verify `STRIPE_WEBHOOK_SECRET` is up-to-date. |
| `subscription_canceled` | 403 | Billing plan dropped to Free. | Invite the account owner to upgrade via Stripe Checkout. |

## Troubleshooting

- **Cache never hits?** Check that prompts normalize identically (trim, lowercase, consistent JSON).
- **Headers missing?** Disable any middleware that strips `x-*` headers (Cloudflare Workers preserve them by default).
- **Need metrics?** Every request emits structured logs to Supabase (`usage_logs`) and optional Datadog traces.

## Security Checklist

- Use TLS (HTTPS) for every client application.
- Store `lgw_` keys in secrets managers and rotate monthly.
- Use Supabase RLS + Stripe webhook verification to defend backend flows.

## Observability

All requests are tagged with `WatchLLM: <project>` so you can filter by project, plan, or environment. Combine Supabase dashboards with Datadog/Sentry to trace latency, cache hits, and provider costs.


