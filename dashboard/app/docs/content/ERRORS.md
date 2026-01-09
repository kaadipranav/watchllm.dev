# Error Reference

Standardized error codes and resolution steps for WatchLLM.

## Proxy Errors

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `invalid_api_key` | 401 | API key is missing or invalid. | Check your Authorization header format. |
| `rate_limit_exceeded` | 429 | Project or IP limit reached. | Implement backoff or upgrade plan. |
| `insufficient_quota` | 403 | Monthly usage cap reached. | Check billing status in dashboard. |
| `provider_error` | 502 | Upstream AI provider failed. | Check OpenRouter status or provider API key. |
| `invalid_model` | 400 | Requested model is not enabled. | Enable the model in project settings or check BYOK configuration. |
| `byok_key_missing` | 403 | BYOK provider key not configured. | Add API key for the provider in project settings. |
| `byok_auth_failed` | 401 | Provider API key is invalid. | Verify key format and provider account status. |
| `model_not_found` | 404 | Model name not recognized. | Use correct model name format (BYOK: `gpt-4o`, OpenRouter: `openai/gpt-4o`). |

## BYOK-Specific Errors

### Provider Authentication Issues
| Error | Cause | Resolution |
|-------|-------|------------|
| `byok_key_missing` | No API key configured for provider | Add the provider's API key in project settings |
| `byok_auth_failed` | Invalid or expired provider key | Regenerate key from provider dashboard |
| `insufficient_provider_quota` | Provider account out of credits | Add credits to your provider account |

### Model Access Issues
| Error | Cause | Resolution |
|-------|-------|------------|
| `model_not_found` | Wrong model name format | Use native names for BYOK (`gpt-4o`) or full names for OpenRouter (`openai/gpt-4o`) |
| `model_not_available` | Model not supported by provider | Check provider documentation for available models |
| `byok_model_disabled` | Model disabled in provider account | Enable the model in your provider settings |

## Integration Checklist

If you encounter persistent errors, verify the following:

1. **Headers**: Both `Authorization: Bearer <key>` and `Content-Type: application/json` must be present.
2. **Base URL**: Ensure you are pointing to the proxy URL (e.g., `.../v1`) and not the dashboard URL.
3. **Payload**: WatchLLM expects OpenAI-compatible JSON structure.
4. **BYOK Setup**: If using BYOK, ensure provider API keys are configured and valid.
5. **Model Names**: Use correct model naming convention based on BYOK vs OpenRouter usage.

## Debugging Tools

- **Live Logs**: Run `wrangler tail` in the worker directory to see real-time proxy traffic and errors.
- **Usage Logs**: Visit the **Logs** tab in your dashboard to inspect individual request metadata and latencies.
- **Health Check**: Visit `/health` on your proxy URL to confirm connectivity to Redis and Supabase.
- **Provider Status**: Check provider status pages (OpenAI, Anthropic, Groq) for outages.

## Common BYOK Pitfalls

### Key Format Issues
- **OpenAI**: Must start with `sk-`
- **Anthropic**: Must start with `sk-ant-`
- **Groq**: Must start with `gsk_`

### Model Name Confusion
```javascript
// Correct BYOK usage
model: "gpt-4o"              // Direct OpenAI
model: "claude-3-sonnet-20240229"  // Direct Anthropic

// Correct OpenRouter usage
model: "openai/gpt-4o"       // Via OpenRouter
model: "anthropic/claude-3-sonnet" // Via OpenRouter
```

### Rate Limit Differences
- **BYOK**: Subject to your provider's rate limits directly
- **OpenRouter**: May have different rate limiting policies
- **WatchLLM**: Adds no additional rate limiting beyond provider defaults
