# Deployment Guide

![Deployment flow](https://via.placeholder.com/900x360.png?text=Deployment+Flow)

Deploying WatchLLM requires the Cloudflare Worker proxy, the Next.js dashboard, and consistent environment variable management.

## Environment variables

| Service | Required vars |
|---|---|
| Worker | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `MONGODB_DATA_API_URL`, `MONGODB_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `SENTRY_DSN`, `EMAIL_TRIGGER_SECRET` |
| Dashboard | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SENTRY_DSN`, `RESEND_API_KEY` |

## MongoDB Atlas Setup (for Caching)

WatchLLM uses MongoDB Atlas for semantic caching to reduce API costs. Students get $50 credits + Compass + University access via GitHub Student Developer Pack.

### Quick Setup

1. **Sign up with GitHub Student Pack**:
   - Go to https://www.mongodb.com/atlas/database
   - Sign in with GitHub
   - Verify student status to get benefits

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to your users
   - Name: `Cluster0` (default)

3. **Enable Data API**:
   - Go to Data API in cluster settings
   - Enable "Data API"
   - Create API Key (copy both URL and key)

4. **Configure Secrets**:
   ```bash
   cd worker
   node ../setup-mongodb.js
   # OR manually:
   wrangler secret put MONGODB_DATA_API_URL
   wrangler secret put MONGODB_API_KEY
   wrangler secret put MONGODB_DATA_SOURCE  # (optional, defaults to Cluster0)
   ```

5. **Deploy & Test**:
   ```bash
   wrangler deploy
   cd ..
   node test-proxy.js  # Should show cache hits on identical requests
   ```

### Manual Setup

If the setup script doesn't work:

1. Get your Data API URL from MongoDB Atlas dashboard
2. Create an API key in Data API settings
3. Set secrets manually as shown above
4. The database `watchllm` and collection `cache` will be created automatically

### Troubleshooting

- **No cache hits**: Check MongoDB Atlas logs for API errors
- **Connection failed**: Verify Data API is enabled and API key has correct permissions
- **Student credits**: Ensure you verified your GitHub Student status

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
