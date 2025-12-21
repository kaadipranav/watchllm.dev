# Troubleshooting

Solutions to common issues when integrating or using WatchLLM.

## Authentication

### 401 Unauthorized
This usually means your API key is invalid or missing.
- **Check Key**: Ensure the key exists in your project settings and starts with `lgw_`.
- **Check Header**: Verify you're using the `Authorization: Bearer <key>` format.
- **Check Project**: If a project is archived or deleted, its keys will stop working immediately.

## Caching Issues

### Unexpected Cache Misses
If you expect a `HIT` but get a `MISS`:
- **Temperature**: High temperatures (e.g., `1.0`) might result in variations that miss the cache if the threshold is tight.
- **Normalization**: WatchLLM normalizes whitespace and casing, but major prompt changes will always trigger a miss.
- **Threshold**: You can adjust the `SEMANTIC_CACHE_THRESHOLD` in your project settings to be more or less permissive.

## Performance

### High Latency
WatchLLM adds ~20ms of overhead for cache lookups. If you experience higher latency:
- **Provider Status**: Check if the upstream provider (OpenAI/Anthropic) is having issues.
- **Region**: The proxy runs at the edge, but database lookups might add latency if the project is far from a Supabase region.

## Still need help?

If you can't find the answer here, reach out to us:
- **Discord**: Join our developer community for real-time support.
- **Email**: Send us a message at support@watchllm.dev for billing or account issues.
- **GitHub**: Report bugs or request features on our public repository.
