# Quick Start

Get started with WatchLLM semantic caching in under 2 minutes.

## 1. Get your API Key

Sign up for a WatchLLM account and create a new project. You'll receive an API key starting with `lgw_`.

## 2. Choose Your Integration Method

### Option A: Use OpenRouter (Easiest)
No additional setup required. Access 100+ models through a unified API.

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_your_key',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

// Works with any OpenRouter model
const response = await client.chat.completions.create({
  model: 'anthropic/claude-3-haiku', // or openai/gpt-4o, meta/llama-2-70b, etc.
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Option B: Bring Your Own Keys (BYOK)
For direct provider access with your own API keys.

1. **Add Provider Keys** in your project settings:
   - OpenAI API Key
   - Anthropic API Key (optional)
   - Groq API Key (optional)

2. **Use Direct Provider Models**:
```javascript
const client = new OpenAI({
  apiKey: 'lgw_proj_your_key',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

// Now works with native provider models
const response = await client.chat.completions.create({
  model: 'gpt-4o', // Direct OpenAI access
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## 3. Verify Caching

Send a request, wait for the response, and send the exact same request again.

Check the response headers:
- `x-watchllm-cache: HIT` (on the second request)
- `x-watchllm-cost-usd: 0.00` (on the second request)

You are now saving money on every repeat request!

## 4. Test Semantic Caching

Try sending semantically similar but differently worded requests:

```javascript
// These will all hit the same cache entry due to normalization:
await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is 5 + 3?' }]
});

await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'what is 5 + 3?' }]
});

await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What\'s 5 plus 3?' }]
});
```

All three requests should return `x-watchllm-cache: HIT-SEMANTIC`!


