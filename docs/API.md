# API.md - WatchLLM API Specification

> **Purpose:** Complete API documentation for developers integrating with WatchLLM.

---

## Table of Contents
1. [Quick Start](#1-quick-start)
2. [Authentication](#2-authentication)
3. [Proxy API Endpoints](#3-proxy-api-endpoints)
4. [Dashboard API Endpoints](#4-dashboard-api-endpoints)
5. [Webhooks](#5-webhooks)
6. [Error Handling](#6-error-handling)
7. [Rate Limits](#7-rate-limits)
8. [SDKs & Examples](#8-sdks--examples)

---

## 1. Quick Start

### Get Your API Key

1. Sign up at https://WatchLLM.com/signup
2. Create a project
3. Copy your API key (starts with `lgw_`)

### Make Your First Request

**cURL:**
```bash
curl https://proxy.WatchLLM.com/v1/chat/completions \
  -H "Authorization: Bearer lgw_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Node.js (OpenAI SDK):**
```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'lgw_your_api_key_here', // Your WatchLLM key
  baseURL: 'https://proxy.WatchLLM.com/v1'
});

const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

console.log(response.choices[0].message.content);
```

**Python (OpenAI SDK):**
```python
from openai import OpenAI

client = OpenAI(
    api_key='lgw_your_api_key_here',
    base_url='https://proxy.WatchLLM.com/v1'
)

response = client.chat.completions.create(
    model='gpt-4',
    messages=[{'role': 'user', 'content': 'Hello!'}]
)

print(response.choices[0].message.content)
```

---

## 2. Authentication

### API Key Format

All proxy requests require an API key in the `Authorization` header:

```
Authorization: Bearer lgw_your_api_key_here
```

### API Key Types

| Type | Format | Use Case |
|------|--------|----------|
| **Project Key** | `lgw_proj_...` | Standard API access |
| **Test Key** | `lgw_test_...` | Sandbox testing (free, limited) |

### Security Best Practices

- **Never** expose API keys in client-side code
- Store keys in environment variables
- Rotate keys regularly
- Use separate keys for dev/staging/prod

---

## 3. Proxy API Endpoints

Base URL: `https://proxy.WatchLLM.com`

### 3.1 Chat Completions

**POST /v1/chat/completions**

OpenAI-compatible chat endpoint. Supports all OpenAI parameters.

**Request:**
```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 100,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-xyz123",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 10,
    "total_tokens": 25
  },
  "x-WatchLLM-cached": false,
  "x-WatchLLM-cost-usd": "0.000625",
  "x-WatchLLM-latency-ms": 1847
}
```

**Custom Response Headers:**

| Header | Description | Example |
|--------|-------------|---------|
| `x-WatchLLM-cached` | Was response cached? | `true` or `false` |
| `x-WatchLLM-cost-usd` | Estimated cost | `"0.000625"` |
| `x-WatchLLM-latency-ms` | Response time | `1847` |
| `x-WatchLLM-tokens-saved` | Tokens saved (if cached) | `25` |
| `x-WatchLLM-provider` | Which provider was used | `"openai"` |

**Supported Models:**

| Provider | Models |
|----------|--------|
| OpenAI | `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo` |
| Anthropic | `claude-3-haiku`, `claude-3-5-sonnet`, `claude-3-opus` |
| Groq | `llama-3-8b`, `llama-3-70b`, `mixtral-8x7b` |
| OpenRouter | All models (via `openrouter/` prefix or automatic mapping) |

**Streaming:**

Set `"stream": true` to receive Server-Sent Events (SSE):

```javascript
const response = await fetch('https://proxy.WatchLLM.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer lgw_xxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Write a story' }],
    stream: true
  })
});

const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

### 3.2 Completions (Legacy)

**POST /v1/completions**

OpenAI legacy completions endpoint.

**Request:**
```json
{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "Once upon a time",
  "max_tokens": 50,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "id": "cmpl-xyz123",
  "object": "text_completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
    {
      "text": " there was a kingdom...",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 4,
    "completion_tokens": 50,
    "total_tokens": 54
  }
}
```

### 3.3 Embeddings

**POST /v1/embeddings**

Generate text embeddings.

**Request:**
```json
{
  "model": "text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog"
}
```

**Response:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.123, 0.456, ..., 0.789],
      "index": 0
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

**Batch Embeddings:**

```json
{
  "model": "text-embedding-ada-002",
  "input": [
    "First sentence",
    "Second sentence",
    "Third sentence"
  ]
}
```

### 3.4 Health Check

**GET /health**

Check if proxy is operational.

**Response:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-12-12T10:30:00Z"
}
```

---

## 4. Dashboard API Endpoints

Base URL: `https://WatchLLM.com/api`

Authentication: Session cookie (automatically handled by Supabase)

### 4.1 Dashboard Stats

**GET /api/dashboard/stats**

Get overview statistics.

**Query Parameters:**
- `period` - Time period (`7d`, `30d`, `all`) - Default: `30d`

**Response:**
```json
{
  "requests_total": 125000,
  "requests_today": 4200,
  "cache_hit_rate": 0.42,
  "cost_this_month": 87.50,
  "cost_saved": 62.30,
  "top_models": [
    {"model": "gpt-4", "requests": 80000, "cost": 65.00},
    {"model": "gpt-3.5-turbo", "requests": 45000, "cost": 22.50}
  ],
  "chart_data": [
    {"date": "2024-12-01", "requests": 3500, "cost": 2.80},
    {"date": "2024-12-02", "requests": 4100, "cost": 3.20}
  ]
}
```

### 4.2 Projects

**GET /api/projects**

List all projects for authenticated user.

**Response:**
```json
{
  "projects": [
    {
      "id": "proj_abc123",
      "name": "My ChatGPT Wrapper",
      "provider": "openai",
      "created_at": "2024-01-15T10:00:00Z",
      "stats": {
        "requests_this_month": 50000,
        "cost_this_month": 45.00,
        "cache_hit_rate": 0.38
      }
    }
  ]
}
```

**POST /api/projects**

Create a new project.

**Request:**
```json
{
  "name": "Production App",
  "provider": "openai"
}
```

**Response:**
```json
{
  "id": "proj_xyz789",
  "name": "Production App",
  "provider": "openai",
  "api_key": "lgw_proj_newkey123abc...",
  "created_at": "2024-12-12T10:30:00Z"
}
```

**GET /api/projects/:id**

Get project details.

**Response:**
```json
{
  "id": "proj_abc123",
  "name": "My ChatGPT Wrapper",
  "provider": "openai",
  "created_at": "2024-01-15T10:00:00Z",
  "api_keys": [
    {
      "id": "key_123",
      "name": "Production Key",
      "key": "lgw_proj_abc...",
      "last_used_at": "2024-12-12T09:45:00Z",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "stats": {
    "requests_total": 125000,
    "requests_this_month": 50000,
    "cost_total": 450.00,
    "cost_this_month": 45.00,
    "cache_hit_rate": 0.38
  }
}
```

**DELETE /api/projects/:id**

Delete a project and all its API keys.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

### 4.3 API Keys

**POST /api/projects/:project_id/keys**

Create a new API key for a project.

**Request:**
```json
{
  "name": "Staging Key"
}
```

**Response:**
```json
{
  "id": "key_456",
  "name": "Staging Key",
  "key": "lgw_proj_newkey456def...",
  "created_at": "2024-12-12T10:30:00Z"
}
```

**⚠️ The `key` field is only returned once. Save it securely!**

**DELETE /api/projects/:project_id/keys/:key_id**

Revoke an API key.

**Response:**
```json
{
  "success": true,
  "message": "API key revoked"
}
```

### 4.4 Usage Logs

**GET /api/projects/:project_id/usage**

Get usage logs for a project.

**Query Parameters:**
- `from` - Start date (ISO 8601) - Default: 30 days ago
- `to` - End date (ISO 8601) - Default: now
- `limit` - Max results - Default: 100, Max: 1000
- `model` - Filter by model - Optional

**Response:**
```json
{
  "logs": [
    {
      "id": "log_abc123",
      "model": "gpt-4",
      "tokens_used": 150,
      "cost_usd": 0.0045,
      "cached": false,
      "latency_ms": 2100,
      "created_at": "2024-12-12T10:30:00Z"
    },
    {
      "id": "log_def456",
      "model": "gpt-4",
      "tokens_used": 0,
      "cost_usd": 0,
      "cached": true,
      "tokens_saved": 150,
      "latency_ms": 45,
      "created_at": "2024-12-12T10:31:00Z"
    }
  ],
  "total": 2,
  "summary": {
    "total_requests": 2,
    "total_tokens": 150,
    "total_cost": 0.0045,
    "cache_hits": 1,
    "cache_hit_rate": 0.5
  }
}
```

**GET /api/projects/:project_id/usage/export**

Export usage logs as CSV.

**Query Parameters:**
- Same as `/usage` endpoint

**Response:** CSV file download

```csv
date,model,tokens_used,cost_usd,cached,latency_ms
2024-12-12T10:30:00Z,gpt-4,150,0.0045,false,2100
2024-12-12T10:31:00Z,gpt-4,0,0,true,45
```

### 4.5 Provider Configuration

**POST /api/projects/:project_id/providers**

Add or update provider API key.

**Request:**
```json
{
  "provider": "openai",
  "api_key": "sk-your-actual-openai-key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Provider key updated",
  "provider": "openai"
}
```

**⚠️ Keys are encrypted and never returned in API responses.**

**DELETE /api/projects/:project_id/providers/:provider**

Remove provider API key.

**Response:**
```json
{
  "success": true,
  "message": "Provider key removed"
}
```

### 4.6 Billing

**POST /api/billing/create-checkout**

Create Stripe checkout session to upgrade plan.

**Request:**
```json
{
  "plan": "pro",
  "billing_period": "monthly"
}
```

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_xxx..."
}
```

**Redirect user to `checkout_url` to complete payment.**

**POST /api/billing/create-portal**

Create Stripe customer portal session (manage subscription).

**Response:**
```json
{
  "portal_url": "https://billing.stripe.com/p/session/xxx..."
}
```

**GET /api/billing/subscription**

Get current subscription details.

**Response:**
```json
{
  "plan": "pro",
  "status": "active",
  "current_period_end": "2025-01-12T10:30:00Z",
  "cancel_at_period_end": false,
  "usage": {
    "requests_this_month": 500000,
    "plan_limit": 1000000,
    "percentage_used": 0.5
  }
}
```

---

## 5. Webhooks

### 5.1 Stripe Webhooks

**Endpoint:** `https://WatchLLM.com/api/webhooks/stripe`

**Events Handled:**

#### checkout.session.completed
User completed checkout, subscription created.

**Payload:**
```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "customer": "cus_xxx",
      "subscription": "sub_xxx",
      "metadata": {
        "user_id": "user_abc123"
      }
    }
  }
}
```

**Action:** Create subscription record, upgrade user plan.

#### invoice.payment_succeeded
Recurring payment succeeded.

**Action:** Log payment, extend subscription period.

#### invoice.payment_failed
Payment failed.

**Action:** Send email alert, downgrade after 3 failures.

#### customer.subscription.deleted
User canceled subscription.

**Action:** Downgrade to free plan at period end.

### 5.2 Usage Alert Webhooks (Coming Soon)

Configure webhooks to receive alerts when usage thresholds are hit.

---

## 6. Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded your plan's rate limit",
    "details": {
      "plan": "starter",
      "limit": 60,
      "reset_at": "2024-12-12T10:31:00Z"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed |
| 400 | Bad Request | Invalid JSON |
| 401 | Unauthorized | Invalid API key |
| 402 | Payment Required | Subscription expired |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Internal error |
| 502 | Bad Gateway | Provider API down |
| 503 | Service Unavailable | Maintenance mode |

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `invalid_api_key` | API key not found or revoked | Check key, create new one |
| `rate_limit_exceeded` | Too many requests | Wait or upgrade plan |
| `quota_exceeded` | Monthly quota reached | Upgrade plan or wait for reset |
| `invalid_model` | Model not supported | Check supported models list |
| `provider_error` | Provider API error | Retry, check provider status |
| `cache_error` | Cache operation failed | Retry, contact support if persists |

### Retry Logic

For `502`, `503`, `429` errors, implement exponential backoff:

```javascript
async function makeRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.ok) return response;
    
    if ([502, 503, 429].includes(response.status)) {
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    throw new Error(`Request failed: ${response.status}`);
  }
  
  throw new Error('Max retries exceeded');
}
```

---

## 7. Rate Limits

### By Plan

| Plan | Requests/Minute | Requests/Month |
|------|-----------------|----------------|
| Free | 10 | 10,000 |
| Starter | 60 | 100,000 |
| Pro | 600 | 1,000,000 |
| Agency | 6,000 | 10,000,000 |

### Rate Limit Headers

Every response includes these headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1702377660
```

- `X-RateLimit-Limit` - Max requests per minute for your plan
- `X-RateLimit-Remaining` - Requests remaining in current window
- `X-RateLimit-Reset` - Unix timestamp when limit resets

### Handling Rate Limits

```javascript
const response = await fetch('https://proxy.WatchLLM.com/v1/chat/completions', {
  /* ... */
});

if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const waitSeconds = parseInt(resetTime) - Math.floor(Date.now() / 1000);
  
  console.log(`Rate limited. Retry in ${waitSeconds} seconds`);
  
  await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
  // Retry request
}
```

---

## 8. SDKs & Examples

### 8.1 JavaScript/TypeScript

**Install:**
```bash
npm install openai
```

**Usage:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.WatchLLM_API_KEY,
  baseURL: 'https://proxy.WatchLLM.com/v1'
});

// Chat completion
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Streaming
const stream = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Tell me a story' }],
  stream: true
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### 8.2 Python

**Install:**
```bash
pip install openai
```

**Usage:**
```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ['WatchLLM_API_KEY'],
    base_url='https://proxy.WatchLLM.com/v1'
)

# Chat completion
response = client.chat.completions.create(
    model='gpt-4',
    messages=[{'role': 'user', 'content': 'Hello!'}]
)

print(response.choices[0].message.content)

# Streaming
stream = client.chat.completions.create(
    model='gpt-4',
    messages=[{'role': 'user', 'content': 'Tell me a story'}],
    stream=True
)

for chunk in stream:
    print(chunk.choices[0].delta.content or '', end='')
```

### 8.3 cURL Examples

**Chat completion:**
```bash
curl https://proxy.WatchLLM.com/v1/chat/completions \
  -H "Authorization: Bearer $WatchLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

**Embeddings:**
```bash
curl https://proxy.WatchLLM.com/v1/embeddings \
  -H "Authorization: Bearer $WatchLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-ada-002",
    "input": "Hello world"
  }'
```

### 8.4 Next.js Example

**pages/api/chat.ts:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.WatchLLM_API_KEY,
  baseURL: 'https://proxy.WatchLLM.com/v1'
});

export default async function handler(req, res) {
  const { message } = req.body;
  
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }]
  });
  
  res.json({ 
    reply: response.choices[0].message.content,
    cached: response.x_WatchLLM_cached,
    cost: response.x_WatchLLM_cost_usd
  });
}
```

### 8.5 Go Example

**Install:**
```bash
go get github.com/sashabaranov/go-openai
```

**Usage:**
```go
package main

import (
	"context"
	"fmt"
	"os"

	"github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig(os.Getenv("WatchLLM_API_KEY"))
	config.BaseURL = "https://proxy.WatchLLM.com/v1"

	client := openai.NewClientWithConfig(config)
	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: openai.GPT4,
			Messages: []openai.ChatCompletionMessage{
				{
					Role:    openai.ChatMessageRoleUser,
					Content: "Hello!",
				},
			},
		},
	)

	if err != nil {
		fmt.Printf("ChatCompletion error: %v\n", err)
		return
	}

	fmt.Println(resp.Choices[0].Message.Content)
}
```

### 8.6 Ruby Example

**Install:**
```bash
gem install ruby-openai
```

**Usage:**
```ruby
require 'openai'

client = OpenAI::Client.new(
    access_token: ENV['WatchLLM_API_KEY'],
    uri_base: "https://proxy.WatchLLM.com/v1"
)

response = client.chat(
    parameters: {
        model: "gpt-4",
        messages: [{ role: "user", content: "Hello!" }],
        temperature: 0.7,
    }
)

puts response.dig("choices", 0, "message", "content")
```

---

## Support

- **Documentation:** https://docs.WatchLLM.com
- **API Status:** https://status.WatchLLM.com
- **Email:** support@WatchLLM.com
- **Discord:** https://discord.gg/WatchLLM

---

## Changelog

### v1.0.0 (2024-12-12)
- Initial release
- Chat completions endpoint
- Embeddings endpoint
- Semantic caching
- Rate limiting
- Usage analytics