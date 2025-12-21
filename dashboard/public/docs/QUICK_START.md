# Quick Start

Get started with WatchLLM semantic caching in under 2 minutes.

## 1. Get your API Key

Sign up for a WatchLLM account and create a new project. You'll receive an API key starting with `lgw_`.

## 2. Update your Base URL

Replace your existing AI provider URL with the WatchLLM proxy URL.

| Provider | Original URL | WatchLLM Proxy URL |
|----------|--------------|-------------------|
| OpenAI   | `api.openai.com/v1` | `proxy.watchllm.dev/v1` |
| Anthropic| `api.anthropic.com/v1` | `proxy.watchllm.dev/v1` |

## 3. Implementation

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_your_key',
  baseURL: 'https://proxy.watchllm.dev/v1'
});
```

## 4. Verify Caching

Send a request, wait for the response, and send the exact same request again. 

Check the response headers:
- `x-watchllm-cached: HIT` (on the second request)
- `x-watchllm-cost-usd: 0.00` (on the second request)

You are now saving money on every repeat request!


