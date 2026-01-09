# Getting Started with WatchLLM

Welcome to WatchLLM! This guide will help you integrate semantic caching into your LLM application in under 5 minutes.

## What is WatchLLM?

WatchLLM is an edge proxy that sits between your application and AI providers (OpenAI, Anthropic, Groq). It automatically caches repetitive queries, reducing costs by 30-50% without code changes.

## Quick Start (2 Minutes)

### 1. Sign Up & Create a Project

1. Go to [watchllm.dev](https://watchllm.dev) and sign up
2. Create a new project in the dashboard
3. Generate an API key (starts with `lgw_proj_`)

### 2. Choose Your Integration Method

**Option A: Bring Your Own Key (BYOK)** *(Recommended)*
- You keep your existing OpenAI/Anthropic/Groq accounts
- WatchLLM acts as a caching layer
- You control billing directly with providers

**Option B: OpenRouter**
- Use OpenRouter for unified access to multiple models
- Single integration point
- Simpler setup for prototyping

### 3. Update Your Code (3 Lines)

**Node.js Example (BYOK):**
```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_YOUR_KEY_HERE",  // Your WatchLLM key
  baseURL: "https://proxy.watchllm.dev/v1"  // Point to proxy
});

// Use normally - caching is automatic
const response = await client.chat.completions.create({
  model: "gpt-4o",  // Direct provider model name
  messages: [{ role: "user", content: "Hello!" }],
});
```

**Python Example (BYOK):**
```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_YOUR_KEY_HERE",
    base_url="https://proxy.watchllm.dev/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

### 4. Configure Provider Keys (BYOK Only)

If using BYOK, add your provider API keys in the dashboard:
1. Go to **Settings → AI Providers**
2. Add your OpenAI key (starts with `sk-`)
3. Add your Anthropic key (starts with `sk-ant-`)
4. Add your Groq key (starts with `gsk_`)

That's it! Your requests now automatically cache at the edge.

## How Caching Works

WatchLLM uses **semantic similarity** to match queries:
- "What is Python?" and "Explain Python programming" → **Cache Hit**
- "What is Python?" and "What is JavaScript?" → **Cache Miss**

You can adjust the similarity threshold in project settings.

## View Savings & Analytics

1. Go to **Dashboard → Analytics**
2. See real-time metrics:
   - Total requests vs cached requests
   - Money saved (estimated)
   - Cache hit rate
   - Average latency

## Next Steps

- [Code Examples](/docs/EXAMPLES) - More integration patterns
- [API Reference](/docs/API) - Complete endpoint documentation
- [Troubleshooting](/docs/TROUBLESHOOTING) - Common issues & fixes
- [BYOK Setup](/docs/BYOK) - Detailed BYOK configuration guide

## Need Help?

- **Email:** kiwi092020@gmail.com
- **Discord:** Join our community (link in dashboard)
- **GitHub:** Report issues or contribute

---

**Pro Tip:** Start with the free tier (50k requests/month) to validate savings before upgrading. Most users see 30-40% cost reduction in the first week.
