# Bring Your Own Key (BYOK) Setup

Configure direct provider access using your own API keys for enhanced performance and cost optimization.

## Overview

BYOK allows you to use your existing OpenAI, Anthropic, and Groq API keys directly through WatchLLM. This provides:

- **Better Performance**: Direct provider access with lower latency
- **Cost Optimization**: Bypass intermediary pricing
- **Full Model Access**: Access to all provider models and features
- **Enhanced Privacy**: Your keys never leave your infrastructure

## Supported Providers

| Provider | Setup Required | Benefits |
|----------|----------------|----------|
| **OpenAI** | API Key | GPT-4, GPT-3.5, DALL-E, Whisper |
| **Anthropic** | API Key | Claude 3 models, best reasoning |
| **Groq** | API Key | Fast Llama/Mixtral inference |

## Setup Instructions

### 1. Obtain API Keys

**OpenAI:**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy the key (starts with `sk-`)

**Anthropic:**
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Navigate to API Keys
3. Create a new key
4. Copy the key (starts with `sk-ant-`)

**Groq:**
1. Go to [console.groq.com/keys](https://console.groq.com/keys)
2. Create a new API key
3. Copy the key (starts with `gsk_`)

### 2. Configure in WatchLLM

1. **Login** to your WatchLLM dashboard
2. **Navigate** to Project Settings → Provider Keys
3. **Add Keys** for each provider you want to use:
   ```
   OpenAI API Key: sk-...
   Anthropic API Key: sk-ant-...
   Groq API Key: gsk_...
   ```
4. **Save Changes**

### 3. Update Your Code

Once BYOK is configured, use native model names directly:

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'lgw_proj_your_watchllm_key',
  baseURL: 'https://proxy.watchllm.dev/v1'
});

// Now works with native provider models
const response = await client.chat.completions.create({
  model: 'gpt-4o', // Direct OpenAI
  messages: [{ role: 'user', content: 'Hello!' }]
});

// Anthropic models
const claudeResponse = await client.chat.completions.create({
  model: 'claude-3-sonnet-20240229', // Direct Anthropic
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Model Name Mapping

| Provider | OpenRouter Format | BYOK Format |
|----------|-------------------|-------------|
| OpenAI | `openai/gpt-4o` | `gpt-4o` |
| Anthropic | `anthropic/claude-3-opus` | `claude-3-opus-20240229` |
| Groq | `groq/llama2-70b` | `llama2-70b-4096` |

## Security & Encryption

- **End-to-End Encryption**: Keys are encrypted at rest using AES-256
- **Zero-Knowledge**: WatchLLM cannot access your provider accounts
- **Scoped Access**: Keys are project-specific and can be rotated anytime
- **Audit Logs**: All key usage is logged for security monitoring

## Billing & Costs

- **Direct Billing**: You pay providers directly for API usage
- **WatchLLM Fees**: Only pay for WatchLLM's caching infrastructure
- **Cost Transparency**: See exactly what each request costs via response headers

## Troubleshooting

### "Model not found" Error
- Ensure you've added the correct API key for that provider
- Check that the model name matches the BYOK format (not OpenRouter format)

### Authentication Failed
- Verify your API keys are valid and have sufficient credits
- Check that keys are entered correctly in project settings
- Try rotating the key if issues persist

### Still Using OpenRouter
- BYOK takes precedence over OpenRouter for configured providers
- Clear your browser cache if model selection seems stuck

## Migration from OpenRouter

If you're currently using OpenRouter models, here's how to migrate:

```javascript
// Before (OpenRouter)
const response = await client.chat.completions.create({
  model: 'openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello!' }]
});

// After (BYOK)
const response = await client.chat.completions.create({
  model: 'gpt-4o', // Direct OpenAI access
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

The caching behavior and response format remain identical.