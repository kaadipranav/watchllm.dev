# Architecture Overview

WatchLLM is purpose-built for semantic caching at the edge. The architecture splits into three logical layers:

1. **Edge Proxy** (Cloudflare Worker + Hono)
   - Receives `/v1/*` OpenAI-compatible requests.
   - Validates keys via Supabase and rate limits using Upstash Redis counters.
   - Normalizes prompts, hashes payloads, and checks the semantic cache (embedded hashing + temperature + tool definitions).
   - For cache misses, forwards requests to OpenAI, Anthropic, or Groq, caches responses, and emits structured logs to Supabase and Datadog.
   - Instrumented with Sentry for errors and per-request metrics (latency, cache status, provider).

2. **Dashboard** (Next.js 14 App Router)
   - Supabase-powered auth and session management with server actions.
   - Billing flows wired to Stripe checkout + portal + webhook handlers for lifecycle events.
   - Real-time charts derived from usage logs, cache hit rates, and cost savings to help teams monitor ROI.
   - Public docs exposed under `/docs` (see `dashboard/public/docs`).
   - Simple Analytics for lightweight tracking and Sentry for error insight.

3. **Data & Infrastructure**
   - **Supabase** holds `projects`, `api_keys`, `usage_logs`, and forms the source of truth for plan limits.
   - **Upstash Redis** stores cache entries with TTLs (1h for completions, 24h for embeddings) and rate-limiting counters.
   - **Stripe** manages products (Free, Starter, Pro) and notifies the dashboard via secure webhooks.
   - **Mailgun** sends transactional emails (payment failed, usage alerts) through the shared `@watchllm/emails` package.

### Workflow diagram
```
Client App
   ↓ Authorization: Bearer lgw_key
WatchLLM Worker (Edge)
   ├─ Validate API key (Supabase)
   ├─ Check cache (Upstash Redis)
   │    └─ Cache hit? Return immediately
   └─ Provider call (OpenAI/Anthropic/Groq)
         └─ Cache result + log usage
Dashboard
   ├─ Manage projects & keys (Supabase)
   ├─ Billing (Stripe)
   └─ Docs & analytics
```

### Key guarantees
- **Zero code changes** for clients: swap `baseURL` + API key and benefit from caching.
- **Global edge execution** ensures <100ms cold-starts.
- **Structured logs** (`logEvent`) ready for Datadog ingestion.
- **Observability** via Sentry (worker + dashboard) plus Simple Analytics for privacy-first metrics.

### Scaling notes
- Rate limit configuration lives in Supabase for each plan.
- Adding a new AI provider requires wiring a new client + provider map entry.
- Monitoring and CI are enforced via GitHub Actions `.github/workflows/test.yml` to keep quality gates consistent.
