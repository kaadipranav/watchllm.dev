# Developer Cheat Sheet

Quick reference for integrating and managing WatchLLM.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production  | `https://proxy.watchllm.dev/v1` |
| Local Dev   | `http://localhost:8787/v1` |

## Authentication

All requests require a Bearer token in the Authorization header.

```bash
Authorization: Bearer lgw_proj_...
```

## SDK Integration

### Node.js (OpenAI SDK)

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_your_key_here',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7
});
```

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_your_key_here",
    base_url="https://proxy.watchllm.dev/v1"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

## Response Headers

WatchLLM attaches metadata to every proxy response.

| Header | Description |
|--------|-------------|
| `x-watchllm-cached` | `HIT` or `MISS` |
| `x-watchllm-cost-usd` | Estimated cost of the request |
| `x-watchllm-latency-ms` | Total processing time |
| `x-watchllm-provider` | The upstream provider (openai, anthropic, groq) |
| `x-watchllm-tokens-saved` | Number of tokens served from cache |

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `invalid_api_key` | 401 | The API key is missing, invalid, or revoked. |
| `rate_limit_exceeded` | 429 | Your project or IP has reached its rate limit. |
| `insufficient_quota` | 403 | Your monthly usage limit has been reached. |
| `provider_error` | 502 | Upstream AI provider returned an error. |

## CLI / cURL Example

```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

