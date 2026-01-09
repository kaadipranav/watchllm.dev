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

## Model Names

### BYOK (Bring Your Own Key) Models
When using your own API keys, use native provider model names:

| Provider | Model Examples |
|----------|----------------|
| **OpenAI** | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| **Anthropic** | `claude-3-opus-20240229`, `claude-3-sonnet-20240229`, `claude-3-haiku-20240307` |
| **Groq** | `llama2-70b-4096`, `mixtral-8x7b-32768`, `gemma-7b-it` |

### OpenRouter Models
For broader access without BYOK setup:

| Provider | Model Examples |
|----------|----------------|
| **OpenAI** | `openai/gpt-4o`, `openai/gpt-3.5-turbo` |
| **Anthropic** | `anthropic/claude-3-opus`, `anthropic/claude-3-sonnet` |
| **Others** | `meta-llama/llama-2-70b`, `google/gemini-pro` |

## SDK Integration

### Node.js (OpenAI SDK)

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_your_key_here',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

// BYOK models (requires provider keys configured)
const response = await client.chat.completions.create({
  model: 'gpt-4o', // Direct OpenAI
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7
});

// OpenRouter models (works without BYOK)
const orResponse = await client.chat.completions.create({
  model: 'anthropic/claude-3-sonnet',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_your_key_here",
    base_url="https://proxy.watchllm.dev/v1"
)

# BYOK models
response = client.chat.completions.create(
    model="claude-3-sonnet-20240229",  # Direct Anthropic
    messages=[{"role": "user", "content": "Hello"}]
)

# OpenRouter models
or_response = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Hello"}]
)
```

## Response Headers

WatchLLM attaches metadata to every proxy response.

| Header | Description |
|--------|-------------|
| `X-WatchLLM-Cache` | `HIT`, `HIT-SEMANTIC`, or `MISS`. |
| `X-WatchLLM-Cost-USD` | Estimated cost of the request. |
| `X-WatchLLM-Latency-Ms` | Total processing time in milliseconds. |
| `X-WatchLLM-Provider` | The upstream provider (openai, anthropic, groq). |
| `X-WatchLLM-Tokens-Saved` | Number of tokens served from cache. |

## Semantic Caching Configuration

### Threshold Settings
Adjust similarity thresholds in project settings:

| Use Case | Threshold | Description |
|----------|-----------|-------------|
| **Strict** | `0.95` | Only near-identical prompts match |
| **Balanced** | `0.85` | Good balance of hits vs accuracy |
| **Permissive** | `0.75` | Catches more variations |

### Prompt Normalization Features
WatchLLM automatically normalizes:
- **Case**: `HELLO` → `hello`
- **Whitespace**: Multiple spaces → single space
- **Punctuation**: Smart removal of filler punctuation
- **Questions**: `What is X?` → `what is x`
- **Math**: `2 + 2 = ?` → `2+2=?`

## Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `invalid_api_key` | 401 | The API key is missing, invalid, or revoked. |
| `rate_limit_exceeded` | 429 | Your project or IP has reached its rate limit. |
| `insufficient_quota` | 403 | Your monthly usage limit has been reached. |
| `provider_error` | 502 | Upstream AI provider returned an error. |
| `model_not_found` | 404 | Model name not recognized (check BYOK setup). |

## CLI / cURL Examples

### BYOK Request
```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello from BYOK"}]
  }'
```

### OpenRouter Request
```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_..." \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3-sonnet",
    "messages": [{"role": "user", content": "Hello from OpenRouter"}]
  }'
```

### Check Cache Status
```bash
curl -I https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_..." \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o", "messages": [{"role": "user", "content": "Test"}]}'
# Look for X-WatchLLM-Cache header in response
```

