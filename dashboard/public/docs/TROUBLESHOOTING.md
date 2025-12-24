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

## Still need help?

If you can't find the answer here, reach out to us:
- **Discord**: Join our developer community for real-time support.
- **Email**: Send us a message at support@watchllm.dev for billing or account issues.
- **GitHub**: Report bugs or request features on our public repository.
