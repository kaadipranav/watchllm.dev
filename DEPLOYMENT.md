# Deployment Guide

Deploying WatchLLM involves a Cloudflare Worker proxy and a Next.js dashboard. Both rely on `pnpm` and the GitHub workspace.

## Worker (Cloudflare)
1. Install Wrangler and login if you haven’t: `pnpm --filter @watchllm/worker install wrangler` then `wrangler login`.
2. Configure `wrangler.toml` (copy the sample from the repo) with `name = "watchllm-proxy"`, `compatibility_date`, and bindings for `SUPABASE_*`, `UPSTASH_*`, `OPENAI_*`, and `SENTRY_DSN`.
3. Publish dry run: `pnpm --filter @watchllm/worker build`.
4. Deploy: `pnpm --filter @watchllm/worker deploy` or `wrangler deploy --env production`.
5. Add a custom domain in the Cloudflare dashboard (e.g., `proxy.watchllm.dev`).
6. Verify health: `curl https://proxy.watchllm.dev/health` returns `status: ok`.

## Dashboard (Next.js)
1. Copy `.env.example` to `.env.local` and fill in Supabase, Stripe, Resend, Sentry, and `NEXT_PUBLIC_APP_URL`.
2. Build locally for sanity: `pnpm --filter @watchllm/dashboard build`.
3. Deploy via Vercel: connect the repo, set Environment Variables, and run `pnpm --filter @watchllm/dashboard build`.
4. Populate Stripe webhook secrets under `dashboard/app/api/webhooks/stripe/route.ts` and verify in Stripe dashboard.
5. Enable Sentry DSN using `NEXT_PUBLIC_SENTRY_DSN` for release tracking.
6. After deployment, test the sign-up flow and checkout (Stripe) before announcing.

## Shared Services
- **Supabase**: ensure `api_keys`, `projects`, `usage_logs` tables exist; use Supabase CLI or SQL editor.
- **Upstash Redis**: configure `UPSTASH_REDIS_REST_URL`/`TOKEN` in both worker and test environments.
- **Stripe**: add webhook for `/api/webhooks/stripe` with secret in both `dashboard/.env` and Stripe dashboard.

## Continuous Deployment
- GitHub Actions run tests via `.github/workflows/test.yml` on every PR.
- Merge triggers `pnpm build` (worker + dashboard) from the root `build` script.
- Tag releases with `vX.Y.Z` to track Sentry deployments.
