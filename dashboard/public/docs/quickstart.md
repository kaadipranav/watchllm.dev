# Quickstart in 2 Minutes

> Clone, run, and cache your first request before the coffee cools down.

![Quickstart console](https://via.placeholder.com/900x360.png?text=Quickstart+Console)

1. **Clone the repo and install**

```bash
git clone https://github.com/kaadipranav/WATCHLLM.git
cd WATCHLLM
pnpm install
```

2. **Run the worker + dashboard locally**

```bash
pnpm --filter @watchllm/worker dev        # Cloudflare Worker proxy (use :node fallback on Windows if needed)
pnpm --filter @watchllm/dashboard dev     # Next.js dashboard (opens on http://localhost:3000)
```

3. **Create a project and API key**
-+- Sign up at `http://localhost:3000/signup` and complete the onboarding flow.
- Copy the `lgw_proj_...` key (store it securely in your secrets manager).

4. **Point your client to WatchLLM**

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_example",
  baseURL: "http://localhost:8787/v1"
});
```

5. **Confirm caching works**
- Send the same prompt twice.
- Inspect the response headers: `x-WatchLLM-cached: HIT` and `x-WatchLLM-cost-usd: 0.00` on the second call.

6. **Prep for production**
- Copy `.env.example` and fill in Supabase/Stripe/Resend secrets (see `DEPLOYMENT.md`).
- Deploy the worker via `pnpm --filter @watchllm/worker deploy` and dashboard via Vercel.

When you’re ready to go live, sync Supabase, Stripe, and Resend by following the [Deployment guide](../../DEPLOYMENT.md).
