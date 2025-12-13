# Upgrading Plans

> Upgrade instantly from the dashboard with zero downtime.

| Tier | Price | Requests / minute | Projects | When to upgrade |
|---|---|---|---|---|
| Free | $0 | 10 | 3 | Testing, early adoption, prototypes |
| Starter | $29 / month | 50 | 10 | Production chatbots, small teams, audit logs |
| Pro | $49 / month | 200 | Unlimited | Agencies, high-scale customers, multiple regions |

## Upgrade steps
1. Open `Settings > Billing` and click “Upgrade plan”.
2. Confirm payment via Stripe—no PCI handling because the dashboard uses Stripe Checkout.
3. The worker picks up the new rate limit immediately via Supabase flags.
4. All current API keys stay active; no re-issuing required.

## What changes when you upgrade
- **Scale**: Rate limits increase, letting you burst with higher concurrency.
- **Insights**: New analytics cards appear (cost saved, cache hit thresholds, exports).
- **Support**: Starter and Pro plans include priority email support.

## Need custom limits?
Contact the team via `support@watchllm.dev` (or create a GitHub issue). We can add a dedicated plan with SLA boundaries, more history, or team seats.
