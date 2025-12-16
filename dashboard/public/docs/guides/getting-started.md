# Getting Started Fast

> Account setup, project creation, and your first cache hit in under five minutes.

![Getting started screenshot](https://via.placeholder.com/900x420.png?text=Getting+Started+Flow)

## 1. Prerequisites

- Node.js 18+ and pnpm installed.
- GitHub Student Developer Pack recommended for zero-cost hosting.
- `.env.local` copied from `.env.example` with Supabase, Stripe, and Resend secrets.

## 2. Sign up and onboard

1. Visit `https://watchllm.dev/signup` (or `http://localhost:3000/signup` in dev).
2. Verify your email; the dashboard automatically creates a default `Free` plan.

## 3. Create a project & API key

1. Navigate to **Projects → New Project**.
2. Name it (`Support Bot`, `Docs Assistant`, etc.) and choose a default provider (OpenAI, Anthropic, Groq).
3. Copy the generated `lgw_proj_...` key and safeguard it (use a secrets manager or 1Password). Do not paste it into front-end JS.

## 4. Configure your client

```javascript
const client = new OpenAI({
	apiKey: "lgw_proj_example",
	baseURL: "https://proxy.watchllm.dev/v1"
});
```

Set the `Authorization` header to `Bearer <lgw key>` and send the usual `messages`/`prompt` payloads.

## 5. Validate caching & dashboard insights

1. Send the same chat twice.
2. Confirm the second request returns `x-WatchLLM-cached: HIT`, `x-WatchLLM-cost-usd: 0.00`, and a positive `x-WatchLLM-tokens-saved` header.
3. Switch to the dashboard **Overview** tab to watch cache hit rate, savings, and provider latency update in real time.

## 6. Next steps

- Follow the [creating projects guide](./creating-projects.md) to manage teammates and projects.
- Read [understanding caching](./understanding-caching.md) to tune TTLs and normalization rules.
- Once you are happy, deploy the worker + dashboard via the [Deployment guide](../../DEPLOYMENT.md).
