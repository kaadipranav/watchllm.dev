# Integration Examples

Ready-to-use snippets to start caching your LLM requests.

## Bring Your Own Key (BYOK) Examples

When you configure your own API keys, you can use native provider model names directly.

### Node.js with BYOK

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_your_watchllm_key",
  baseURL: "https://proxy.watchllm.dev/v1"
});

// Direct OpenAI models (requires OpenAI key in dashboard)
const gptResponse = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Analyze this code." }],
});

// Direct Anthropic models (requires Anthropic key in dashboard)
const claudeResponse = await client.chat.completions.create({
  model: "claude-3-sonnet-20240229",
  messages: [{ role: "user", content: "Explain semantic caching." }],
});

// Direct Groq models (requires Groq key in dashboard)
const groqResponse = await client.chat.completions.create({
  model: "llama2-70b-4096",
  messages: [{ role: "user", content: "Fast inference example." }],
});

console.log(gptResponse.choices[0].message.content);
```

### Python with BYOK

```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_your_watchllm_key",
    base_url="https://proxy.watchllm.dev/v1"
)

# OpenAI models
completion = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Explain semantic caching."}]
)

# Anthropic models
claude_completion = client.chat.completions.create(
    model="claude-3-opus-20240229",
    messages=[{"role": "user", "content": "Analyze this document."}]
)

# Groq models
groq_completion = client.chat.completions.create(
    model="mixtral-8x7b-32768",
    messages=[{"role": "user", "content": "Fast inference example."}]
)

print(completion.choices[0].message.content)
```

### cURL with BYOK

```bash
# OpenAI GPT-4
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello from GPT-4!"}]
  }'

# Anthropic Claude
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-3-sonnet-20240229",
    "messages": [{"role": "user", "content": "Hello from Claude!"}]
  }'

# Groq Llama
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama2-70b-4096",
    "messages": [{"role": "user", "content": "Hello from Groq!"}]
  }'
```

## OpenRouter Examples

For broader model access, use OpenRouter format (works without BYOK setup).

## Node.js

Using the official `openai` package.

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_your_key",
  baseURL: "https://proxy.watchllm.dev/v1"
});

const response = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Analyze this code." }],
});

console.log(response.choices[0].message.content);
```

## Python

Compatible with `openai-python` v1.0+.

```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_your_key",
    base_url="https://proxy.watchllm.dev/v1"
)

completion = client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": "Explain semantic caching."}]
)

print(completion.choices[0].message.content)
```

## cURL

Quick test from your terminal.

```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o",
    "messages": [{"role": "user", "content": "Ping"}]
  }'
```

## Go

Using simple HTTP requests.

```go
// Example using standard library
req, _ := http.NewRequest("POST", "https://proxy.watchllm.dev/v1/chat/completions", payload)
req.Header.Set("Authorization", "Bearer lgw_proj_your_key")
req.Header.Set("Content-Type", "application/json")
// ... execute request
```
