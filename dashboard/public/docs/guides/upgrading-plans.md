# Upgrading Plans

![Billing upgrade](https://via.placeholder.com/900x420.png?text=Upgrade+Billing+Panel)

> Move from Free to Starter/Pro instantly with Stripe Checkout.

## Plan comparison

| Tier | Price | Requests / minute | Projects | Notes |
|---|---|---|---|---|
| Free | $0 | 10 | 3 | Testing, prototypes, auditing behavior. |
| Starter | $29 / month | 50 | 10 | Production for small teams with audit logs. |
| Pro | $49 / month | 200 | Unlimited | Agencies, multi-region deployments, premium support. |

## Upgrade process

1. Visit `Settings → Billing` and select a plan.
2. Stripe Checkout handles payments—no PCI scope for you.
3. After success, Supabase flags the plan change; the worker immediately enforces the new rate limit.
4. All existing API keys remain valid; no need to rotate unless desired.

## What improves with Starter/Pro

- **Higher limits** (per-minute requests increase while keeping cache behavior the same).
- **Analytics extras**: Additional cards for `cost saved`, `cache hit decay`, and `plan pacing` appear in the dashboard.
- **Support**: Starter and Pro subscribers get prioritized email/Discord response times.

## Need custom allowances?

- Email support@watchllm.dev or open an issue; we can craft enterprise or dedicated plans with SLA, extra logs, or custom rate limits.
- Use Supabase feature flags to gate beta features per project before upgrading an entire organization.

## Prevent billing disruptions

- Keep the same Stripe customer ID and webhook secret across environments.
- Monitor usage trends (requests, cost, hit rate) on the dashboard before the next billing cycle.
- Export a CSV of `usage_logs` monthly via Supabase for auditing.
