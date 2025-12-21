# Integration Examples

Ready-to-use snippets to start caching your LLM requests.

## Node.js

Using the official `openai` package.

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_your_key",
  baseURL: "https://proxy.watchllm.dev/v1"
});

const response = await client.chat.completions.create({
  model: "gpt-4o",
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
    model="gpt-4o",
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
    "model": "gpt-4o",
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
