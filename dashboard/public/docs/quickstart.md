# 2-Minute Quickstart

> Ship WatchLLM in the time it takes to make a coffee.

![Quick setup hero](https://via.placeholder.com/900x360.png?text=Quick+Start)

1. **Install dependencies**
    ```bash
    git clone https://github.com/kaadipranav/WATCHLLM.git
    cd WATCHLLM
    pnpm install
    ```
2. **Start local dev experience**
    ```bash
    pnpm --filter worker dev        # Cloudflare Worker proxy
    pnpm --filter dashboard dev     # Next.js dashboard
    ```
3. **Create a project & API key**
    - Open `http://localhost:3000/signup`, complete onboarding, and generate a key.
4. **Swap your client base URL**
    ```javascript
    const client = new OpenAI({
      apiKey: 'lgw_YOUR_KEY',
      baseURL: 'http://localhost:8787/v1'
    });
    ```
5. **Verify cache hit**
    - Send the same prompt twice. Second response returns with `x-WatchLLM-cached: HIT` and zero cost.

Make it production-ready by connecting Supabase, Stripe, and Resend (see [Architecture](../../ARCHITECTURE.md)).
