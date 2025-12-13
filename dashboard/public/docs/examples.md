# Code Examples

> Drop-in replacements for your existing OpenAI, Anthropic, or Groq calls.

![Example snippet](https://via.placeholder.com/900x360.png?text=Code+Examples)

## cURL
```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer lgw_proj_example" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{ "role": "user", "content": "Summarize my API" }],
    "temperature": 0.6
  }'
```

## JavaScript (OpenAI SDK)
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_example',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What changed in the last release?' }]
});

console.log(response.choices[0].message.content);
```

## Python (OpenAI SDK)
```python
from openai import OpenAI

client = OpenAI(
    api_key='lgw_proj_example',
    base_url='https://proxy.watchllm.dev/v1'
)

resp = client.chat.completions.create(
    model='gpt-4o',
    messages=[{'role': 'user', 'content': 'Generate the release notes.'}]
)

print(resp.choices[0].message.content)
```

Switching from OpenAI to WatchLLM requires no other code changes—only the `baseURL` and `apiKey` differ.
