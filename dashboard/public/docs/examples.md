# Examples

> Replace your existing AI calls with these snippets to start caching instantly.

![Code examples](https://via.placeholder.com/900x360.png?text=Code+Examples+Placeholder)

## cURL

```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_example" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{ "role": "user", "content": "Summarize my API." }],
    "temperature": 0.5
  }'
```

## JavaScript (OpenAI SDK compatible)

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "lgw_proj_example",
  baseURL: "https://proxy.watchllm.dev/v1"
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "You are WatchLLM." },
    { role: "user", content: "What changed in the last release?" }
  ],
  temperature: 0.2
});

console.log(response.choices[0].message.content);
```

## Python (OpenAI SDK compatible)

```python
from openai import OpenAI

client = OpenAI(
    api_key="lgw_proj_example",
    base_url="https://proxy.watchllm.dev/v1"
)

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "WatchLLM assistant."},
        {"role": "user", "content": "Draft the community update."}
    ]
)

print(resp.choices[0].message.content)
```

Use the same client libraries you already trust—just swap the base URL and API key, and WatchLLM handles semantic caching, rate limiting, and logging for you.
