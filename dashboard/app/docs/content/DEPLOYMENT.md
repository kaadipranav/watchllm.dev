# Deployment Guide

Deploy your own instance of WatchLLM at the edge.

## Edge Worker (Cloudflare)

The proxy runs on Cloudflare Workers for global low-latency execution.

1. **Prerequisites**: Install Wrangler and login:
   ```bash
   pnpm --filter @watchllm/worker install wrangler
   wrangler login
   ```
2. **Configuration**: Copy the `wrangler.toml` sample and define your bindings:
   - `SUPABASE_URL` & `SUPABASE_ANON_KEY`
   - `UPSTASH_REDIS_REST_URL` & `TOKEN`
   - `OPENROUTER_API_KEY`
   - `SENTRY_DSN` (Optional)
3. **Deployment**: Run the deploy command:
   ```bash
   pnpm --filter @watchllm/worker deploy
   ```
4. **Custom Domain**: Assign a domain (e.g., `proxy.yourdomain.com`) in the Cloudflare dashboard under **Workers > Triggers**.

## Dashboard (Next.js)

The management console for projects, API keys, and analytics.

1. **Environment**: Sync your `.env.local` using `.env.example`.
2. **Setup Services**:
   - **Stripe**: Configure webhooks for `/api/webhooks/stripe`.
   - **Resend**: Add your API key for transactional emails.
3. **Vercel Deployment**: 
   - Connect your repository.
   - Set the Root Directory to `dashboard`.
   - Add all environment variables.
   - Deploy.

## Database Optimization

WatchLLM uses Supabase (PostgreSQL) for persistence.

- **Migrations**: Ensure you've run the scripts in `/supabase/migrations`.
- **RLS**: Row-Level Security is enabled by default to protect project data.
- **Indexes**: Critical indexes are provided for `usage_logs` to ensure fast analytics.
