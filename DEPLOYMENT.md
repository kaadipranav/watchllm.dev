# Deployment Guide

![Deployment flow](https://via.placeholder.com/900x360.png?text=Deployment+Flow)

Deploying WatchLLM requires the Cloudflare Worker proxy, the Next.js dashboard, and consistent environment variable management.

## Environment variables

| Service | Required vars |
|---|---|
| Worker | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SENTRY_DSN`, `EMAIL_TRIGGER_SECRET` |
| Dashboard | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`, `RESEND_API_KEY` |

## Worker (Cloudflare)

1. Install Wrangler (`pnpm --filter @watchllm/worker install wrangler`) and login (`wrangler login`). On Windows, if `wrangler dev` crashes, install the latest Visual C++ redistributable or fall back to `pnpm --filter @watchllm/worker dev:node`.
2. Configure `wrangler.toml` with `name`, `compatibility_date`, KV/secret bindings, and the env vars above.
3. Build locally: `pnpm --filter @watchllm/worker build`.
4. Deploy: `pnpm --filter @watchllm/worker deploy --env production`.
5. Add a custom domain (e.g., `proxy.watchllm.dev`) and route it to the worker.
6. Verify health: `curl https://proxy.watchllm.dev/health` should return JSON with `status: ok` and dependency statuses.

## Dashboard (Next.js)

1. Run `pnpm --filter @watchllm/dashboard build` locally to find issues before deploy.
2. Deploy on Vercel: connect the repo, set the required env vars, and ensure the build step runs `pnpm --filter @watchllm/dashboard build`.
3. Configure Stripe webhook secrets inside `dashboard/app/api/webhooks/stripe/route.ts` and register the same secret in the Stripe dashboard.
4. Set `NEXT_PUBLIC_SENTRY_DSN` to capture client-side errors.
5. After deployment, test sign-up, Stripe checkout (use `4242 4242 4242 4242`), and rate limits.

## Continuous deployment

- GitHub Actions (`.github/workflows/test.yml`) runs lint, tests, and builds for both packages on every PR.
- Merges to `main` trigger `pnpm build` at the repo root covering worker and dashboard.
- Tag releases with `vX.Y.Z` for Sentry and changelog correlation.

## Verification

```bash
# Worker
cd worker
pnpm install
pnpm tsc --noEmit

# Dashboard
cd ../dashboard
pnpm install
pnpm tsc --noEmit
pnpm build
```

Successful verification commands ensure both services can compile before deployment.
