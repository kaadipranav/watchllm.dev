# Troubleshooting

Solutions to common issues when integrating or using WatchLLM.

## Authentication

### 401 Unauthorized
This usually means your API key is invalid or missing.
- **Check Key**: Ensure the key exists in your project settings and starts with `lgw_`.
- **Check Header**: Verify you're using the `Authorization: Bearer <key>` format.
- **Check Project**: If a project is archived or deleted, its keys will stop working immediately.

### BYOK Authentication Failed
If you're using Bring Your Own Key (BYOK) and getting auth errors:
- **Provider Key Missing**: Ensure you've added the API key for the specific provider (OpenAI/Anthropic/Groq) in your project settings.
- **Key Format**: Verify the key format matches the provider (OpenAI: `sk-`, Anthropic: `sk-ant-`, Groq: `gsk_`).
- **Provider Credits**: Check that your provider account has sufficient credits and the key is active.
- **Key Rotation**: Try generating a new API key from the provider if the current one seems invalid.

## Caching Issues

### Unexpected Cache Misses
If you expect a `HIT` but get a `MISS`:
- **Temperature**: High temperatures (e.g., `1.0`) might result in variations that miss the cache if the threshold is tight.
- **Normalization**: WatchLLM normalizes whitespace and casing, but major prompt changes will always trigger a miss.
- **Threshold**: You can adjust the `SEMANTIC_CACHE_THRESHOLD` in your project settings to be more or less permissive.

### Semantic Cache Not Working as Expected
For BYOK users experiencing semantic caching issues:
- **Model Compatibility**: Semantic caching works best with embedding models. Ensure your BYOK setup includes access to text-embedding-ada-002 or similar.
- **Threshold Tuning**: Start with a threshold of 0.8-0.9 for most use cases. Lower values (0.7) catch more similar prompts but may increase false positives.
- **Prompt Length**: Very short prompts (< 10 words) may not cache well semantically. Consider using exact matching for short prompts.
- **Language Mixing**: If mixing languages in prompts, the semantic similarity may be lower than expected.

## Performance

### High Latency
WatchLLM adds ~20ms of overhead for cache lookups. If you experience higher latency:
- **Provider Status**: Check if the upstream provider (OpenAI/Anthropic) is having issues.
- **Region**: The proxy runs at the edge, but database lookups might add latency if the project is far from a Supabase region.
- **BYOK vs OpenRouter**: BYOK typically has lower latency than OpenRouter for direct provider access.

### BYOK Performance Issues
If BYOK requests are slower than expected:
- **Provider Regions**: Your provider API key might be configured for a different region than your WatchLLM project.
- **Rate Limits**: Check if you've hit provider rate limits. WatchLLM doesn't add rate limiting beyond what providers enforce.
- **Model Selection**: Some models (like GPT-4) have higher latency than faster models (GPT-3.5, Claude Instant).

## Model Selection

### "Model not found" Error
- **BYOK Setup**: If using BYOK, ensure you've configured the correct provider key and are using native model names (e.g., `gpt-4o` not `openai/gpt-4o`).
- **OpenRouter Format**: For OpenRouter models, use the full format like `openai/gpt-4o` or `anthropic/claude-3-sonnet`.
- **Model Availability**: Some models may be in beta or limited availability. Check provider documentation for current model status.

### Inconsistent Model Behavior
- **BYOK vs OpenRouter**: Models accessed via BYOK use the provider's native parameters, while OpenRouter may apply different defaults.
- **Temperature Settings**: Ensure temperature and other parameters are set consistently across requests for better caching.

## Billing & Usage

### Unexpected Charges
- **BYOK Costs**: With BYOK, you pay providers directly. Monitor your provider dashboard for usage.
- **Cache Bypass**: Requests that bypass cache (due to high temperature or unique prompts) will always incur provider costs.
- **Rate Limits**: WatchLLM doesn't enforce rate limits beyond provider defaults. Monitor your usage to avoid overages.

### Usage Analytics Not Showing
- **Project Settings**: Ensure usage analytics is enabled in your project configuration.
- **Time Zones**: Usage data is aggregated by UTC. Check your timezone settings if data seems off.
- **BYOK Tracking**: BYOK usage is tracked separately from OpenRouter usage in analytics.

## Semantic Cache Optimization

### Improving Cache Hit Rates
- **Prompt Consistency**: Use consistent prompt formatting, casing, and structure across similar requests.
- **Threshold Adjustment**: Experiment with different semantic thresholds (0.7-0.95) based on your use case.
- **Prompt Templates**: Pre-normalize prompts in your application before sending to reduce normalization overhead.
- **Batch Similar Requests**: Group similar prompts together to maximize cache benefits.

### Cache Invalidation Issues
- **Manual Clearing**: Use the dashboard to clear cache for specific prompts or entire projects when needed.
- **Version Updates**: Clear cache when updating prompt templates or model versions to ensure fresh responses.
- **Stale Responses**: If cached responses become outdated, temporarily disable caching or use exact matching.

## Integration Issues

### "Connection refused" or Network Errors
If you're getting connection errors when making requests:
- **CORS Issues**: Ensure your requests include the proper headers. WatchLLM supports CORS for web applications.
- **Firewall/Proxy**: Check if your network or corporate firewall is blocking requests to `proxy.watchllm.dev`.
- **HTTPS Required**: All requests must use HTTPS. HTTP requests will be rejected.
- **Rate Limiting**: If you're making too many requests too quickly, you may hit rate limits. Implement exponential backoff.

### SDK Integration Problems
- **OpenAI SDK Version**: Ensure you're using OpenAI SDK v4+ for best compatibility.
- **Base URL Configuration**: Double-check that `baseURL` is set to `https://proxy.watchllm.dev/v1` (note the `/v1`).
- **Environment Variables**: Make sure your API key is loaded correctly in your environment.

## Data & Analytics

### Analytics Data Not Appearing
- **Project Selection**: Ensure you're viewing analytics for the correct project.
- **Time Range**: Analytics data may take a few minutes to appear after the first requests.
- **BYOK Tracking**: BYOK requests are tracked separately from OpenRouter requests.
- **Cache Metrics**: Cache hit/miss data is calculated in real-time but may have slight delays.

### Usage Limits and Quotas
- **Free Tier Limits**: 50k requests/month, 10 requests/minute.
- **Starter Plan**: 250k requests/month, 50 requests/minute.
- **Pro Plan**: 1M requests/month, 200 requests/minute.
- **Rate Limit Behavior**: Exceeding rate limits returns HTTP 429. Implement proper retry logic.

## Advanced Configuration

### Custom Cache TTL Settings
- **Default TTL**: Completions cache for 1 hour, embeddings for 24 hours.
- **Custom TTL**: Can be configured per project in advanced settings.
- **Cache Invalidation**: Use the dashboard to manually clear cache when needed.

### Environment-Specific Setup
- **Development**: Use test keys and monitor usage carefully.
- **Staging**: Test with production-like data volumes.
- **Production**: Enable all monitoring and set up proper error handling.

## Common BYOK Setup Mistakes

### Provider Key Configuration
- **Wrong Key Format**: Each provider has specific key formats (OpenAI: `sk-`, Anthropic: `sk-ant-`, Groq: `gsk_`).
- **Key Permissions**: Ensure your API keys have the necessary permissions for the models you want to use.
- **Account Verification**: Some providers require account verification before certain models are accessible.

### Model Name Confusion
```javascript
// ✅ Correct BYOK usage
const client = new OpenAI({
  apiKey: "lgw_proj_your_key",
  baseURL: "https://proxy.watchllm.dev/v1"
});

// Use native model names
await client.chat.completions.create({
  model: "gpt-4o", // ✅ Direct OpenAI
  messages: [...]
});

// ❌ Wrong - mixing OpenRouter format with BYOK
await client.chat.completions.create({
  model: "openai/gpt-4o", // ❌ Don't use this with BYOK
  messages: [...]
});
```

## Performance Optimization

### Maximizing Cache Hit Rates
- **Prompt Normalization**: Use consistent formatting, casing, and structure.
- **Temperature Settings**: Lower temperatures (0.0-0.3) cache better than high temperatures.
- **Prompt Length**: Longer, more descriptive prompts cache better semantically.
- **Batch Processing**: Group similar requests to improve cache efficiency.

### Monitoring & Alerting
- **Response Times**: WatchLLM adds ~20-50ms overhead for cache lookups.
- **Error Rates**: Monitor for increased error rates that might indicate provider issues.
- **Usage Patterns**: Set up alerts for unusual usage spikes or drops.
