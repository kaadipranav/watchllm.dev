# Error Codes & Solutions

![Error tracking view](https://via.placeholder.com/900x360.png?text=Error+Overview)

| Code | Message | What to Check |
|---|---|---|
| `invalid_api_key` | `Missing API key` / `Invalid API key` | Ensure the `Authorization` header carries a `lgw_` key. Activate or rotate keys from the dashboard (`/settings/api-keys`).
| `rate_limit_exceeded` | 429 response | Upgrade the plan or slow down the client; each plan has per-minute limits (10, 50, 200 requests). Headers `X-RateLimit-*` explain remaining quota.
| `invalid_request_error` | `Invalid messages`, `missing model`, etc. | Validate that `messages` is a non-empty array and `model` is spelled correctly (use `GET /v1/models`).
| `api_error` | `Internal server error` | Check Sentry (dashboard/worker) or Datadog logs. Retest after a minute; infrastructure is serverless and redeploys quickly.
| `signature_verification_failed` (webhook) | Webhook signature mismatch | Confirm the Stripe webhook secret matches `STRIPE_WEBHOOK_SECRET`. Retry the webhook from Stripe dashboard once the secret is refreshed.
| `subscription_canceled` | `Plan downgraded to free` | Customer canceled or payment failed. Email is sent automatically; follow up manually if necessary.

### Troubleshooting tips
- **Cache hot paths:** Cache hit rate < 30%? Inspect payload normalization and ensure prompts are deterministic.
- **Stripe webhooks:** Duplicate events may be reprocessed; the worker dedupes via Supabase logs.
- **Email failures:** Verify Resend API key + trigger secret; check `emails` logs under `packages/emails` if needed.

Every runtime exception is captured by Sentry, so you can filter by release, environment, and request ID before investigating the stack trace.
