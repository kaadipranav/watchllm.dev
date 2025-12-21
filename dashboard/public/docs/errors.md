# Error Codes & Resolution

> Diagnosing runtime issues faster with reproducible checks and screenshots.



| Code | HTTP Status | What Happens | How to Fix it |
|---|---|---|---|
| `invalid_api_key` | 401 | Missing/rotated key or revoked project. | Generate a fresh `lgw_proj_...` key and update the `Authorization` header; revoke the old key. |
| `rate_limit_exceeded` | 429 | Plan quota reached (per minute). | Upgrade to Starter/Pro or slow down the client; check `x-WatchLLM-plan-limit` headers. |
| `invalid_request_error` | 400 | Payload malformed (missing model/messages). | Validate `JSON.parse`, ensure `model` matches `GET /v1/models`, and `messages` is a non-empty array. |
| `api_error` | 500 | Worker threw before returning a response. | Inspect worker logs, Sentry breadcrumbs, and retry; the worker auto-retries in case of transient provider failure. |
| `subscription_canceled` | 403 | Billing plan moved back to Free due to payment failure or cancellation. | Ask the customer to complete Stripe Checkout or send an invoice link. |
| `signature_verification_failed` | 400 (webhook) | Stripe webhook secret mismatch. | `STRIPE_WEBHOOK_SECRET` changed—update it in both Stripe dashboard and `dashboard/.env`. |

### Step-by-step debugging checklist

1. **Check headers**: Every response emits `x-WatchLLM-*`. Look for `cached`, `cost-usd`, `latency-ms`, and provider info before blaming the API.
2. **Rate limits**: Inspect `x-WatchLLM-plan-limit` and `x-WatchLLM-plan-remaining`. Your plan (`Free/Starter/Pro`) dictates the throttle ceiling.
3. **Logs & monitoring**: Search Sentry (worker + dashboard) with the request ID from the headers, or query Supabase’s `usage_logs` for the same project.
4. **Stripe webhooks**: If webhook retries fail, replay the last event from Stripe’s dashboard after updating the secret.
5. **Email notifications**: Resend errors are logged under `packages/emails/src`. The worker will create a toast for each failure, and Resend provides a delivery trace.

### Learnings and scripts

Use the `dashboard/scripts/sentry-verify.ts` (or your own script) to confirm Sentry releases match the deployed worker version. Example snippet:

```ts
import Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });
Sentry.captureMessage("Docs walk-through check", { level: "info" });
```

### Prevention tips

- Enable Stripe webhooks in both staging and production (`dashboard/app/api/webhooks/stripe/route.ts`).
- Keep `STRIPE_WEBHOOK_SECRET` and `RESEND_API_KEY` in your `.env` file and never commit them.
- Use feature flags (Supabase `projects.flags`) to gate critical caching changes.

Every incident emits traces in Datadog and Sentry, so you can replay the issue with the exact payload that failed.


