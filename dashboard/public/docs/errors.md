# Error Reference

Standardized error codes and resolution steps for WatchLLM.

## Proxy Errors

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `invalid_api_key` | 401 | API key is missing or invalid. | Check your Authorization header format. |
| `rate_limit_exceeded` | 429 | Project or IP limit reached. | Implement backoff or upgrade plan. |
| `insufficient_quota` | 403 | Monthly usage cap reached. | Check billing status in dashboard. |
| `provider_error` | 502 | Upstream AI provider failed. | Check OpenRouter status. |
| `invalid_model` | 400 | Requested model is not enabled. | Enable the model in project settings. |

## Integration Checklist

If you encounter persistent errors, verify the following:

1. **Headers**: Both `Authorization: Bearer <key>` and `Content-Type: application/json` must be present.
2. **Base URL**: Ensure you are pointing to the proxy URL (e.g., `.../v1`) and not the dashboard URL.
3. **Payload**: WatchLLM expects OpenAI-compatible JSON structure.

## Debugging Tools

- **Live Logs**: Run `wrangler tail` in the worker directory to see real-time proxy traffic and errors.
- **Usage Logs**: Visit the **Logs** tab in your dashboard to inspect individual request metadata and latencies.
- **Health Check**: Visit `/health` on your proxy URL to confirm connectivity to Redis and Supabase.
