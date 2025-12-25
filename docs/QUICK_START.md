# Quick Start Guide

Start caching your AI requests usage in less than 2 minutes. WatchLLM is a drop-in replacement for the OpenAI API, compatible with all major SDKs.

---

## 1. Get Your API Key

1. Log in to the [WatchLLM Dashboard](https://watchllm.dev/dashboard).
2. Go to **Projects** and create a new project (e.g., "My Startup Prod").
3. Navigate to **API Keys** and click **Create New Key**.
4. Copy your key (starts with `lgw_...`). You won't see it again.

> 🔒 **Security Tip:** Never commit your API keys to version control. Use environment variables (e.g., `WATCHLLM_API_KEY`).

---

## 2. Integrate with Your Code

WatchLLM works by simply changing the `baseURL` in your existing OpenAI SDK setup. No logic changes required.

### Node.js / TypeScript

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.WATCHLLM_API_KEY, // Your 'lgw_...' key
  baseURL: "https://proxy.watchllm.dev/v1", // <--- THE ONLY CHANGE
});

// Use exactly as before
const chatCompletion = await client.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: "Hello world" }],
});
```

### Python

```python
from openai import OpenAI
import os

client = OpenAI(
    api_key=os.environ.get("WATCHLLM_API_KEY"),
    base_url="https://proxy.watchllm.dev/v1" # <--- THE ONLY CHANGE
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Hello world"}]
)
```

---

## 3. Bring Your Own Key (Optional)

By default, WatchLLM uses its own fleet of managed keys. If you want to use your own negotiated rates, free tiers, or specific provider accounts (like OpenRouter), you can use the **BYOK** feature.

1. Go to **API Keys** in the dashboard.
2. Click the **Provider Keys (BYOK)** tab.
3. Add your key for **OpenAI**, **Anthropic**, **Groq**, or **OpenRouter**.

WatchLLM will now securely forward requests to your provider using *your* credentials, while still providing caching, logging, and analytics.

---

## 4. Verify It's Working

Check the response headers of your requests to confirm WatchLLM is active:

- `x-watchllm-cache`: `HIT` or `MISS`
- `x-watchllm-latency-ms`: Processing time (e.g., `45`)
- `x-watchllm-provider`: The upstream provider used (e.g., `openai`, `openrouter`)

Go to your **Dashboard Usage** page to see real-time logs and cost savings!
