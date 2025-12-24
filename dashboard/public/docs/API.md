# API Reference

Complete technical specification for the WatchLLM proxy API.

## Base URLs

WatchLLM provides a drop-in replacement for OpenAI-compatible base URLs.

| Environment | Base URL |
|-------------|----------|
| Production  | `https://proxy.watchllm.dev/v1` |
| Local Dev   | `http://localhost:8787/v1` |

## Authentication

All requests must include a Bearer token in the `Authorization` header.

```http
Authorization: Bearer lgw_proj_...
```

### API Key Types

| Type | Format | Description |
|------|--------|-------------|
| **Project Key** | `lgw_proj_...` | Standard API access with caching |
| **Test Key** | `lgw_test_...` | Sandbox testing (free, limited) |

## Provider Support

WatchLLM supports multiple AI providers through two integration methods:

### OpenRouter Integration (Default)
Access 100+ models through OpenRouter's unified API. No additional setup required.

**Supported Models:**
- `openai/gpt-4o`
- `anthropic/claude-3-opus`
- `meta/llama-2-70b`
- `google/gemini-pro`
- And 100+ more...

### Bring Your Own Key (BYOK)
Direct access to providers using your own API keys. Configure in project settings.

**Supported Providers:**
- **OpenAI**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
- **Anthropic**: `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
- **Groq**: `llama2-70b`, `mixtral-8x7b`, `gemma-7b`

**BYOK Setup:**
1. Go to Project Settings → Provider Keys
2. Add your API keys for desired providers
3. Use native model names (e.g., `gpt-4o` instead of `openai/gpt-4o`)

## Supported Endpoints

### Chat Completions
`POST /chat/completions`

Mirrors the OpenAI `/chat/completions` endpoint. Supports streaming, function calling, and tools.

### Text Completions
`POST /completions`

Legacy support for the OpenAI `/completions` endpoint.

### Embeddings
`POST /embeddings`

Caches embedding vectors to reduce costs for RAG applications.

## Semantic Caching

WatchLLM uses intelligent semantic caching to serve responses from cache even when prompts aren't identical.

### How It Works

1. **Prompt Normalization**: Prompts are normalized to canonical form:
   - Lowercase conversion
   - Whitespace normalization
   - Filler word removal ("please", "kindly", "could you")
   - Question pattern normalization ("what's" → "what is")
   - Math operator normalization ("times" → "×")

2. **Vector Similarity**: Normalized prompts are converted to embeddings and compared using cosine similarity

3. **Cache Hit Decision**: If similarity exceeds threshold (default 95%), cached response is returned

### Example Normalizations

| Original Prompt | Normalized Form |
|----------------|----------------|
| `"What's 5 times 3?"` | `"what is 5 × 3?"` |
| `"Please explain this"` | `"explain this"` |
| `"How do I calculate?"` | `"how to calculate?"` |

### Cache Hit Types

- **`HIT`**: Exact prompt match (fastest)
- **`HIT-SEMANTIC`**: Semantic similarity match (cost savings)
- **`MISS`**: New prompt, forwarded to provider

## Custom Response Headers

WatchLLM attaches metadata to every proxy response to help you track performance.

| Header | Description |
|--------|-------------|
| `X-WatchLLM-Cache` | `HIT`, `HIT-SEMANTIC`, or `MISS`. |
| `X-WatchLLM-Cache-Age` | Time in seconds since the entry was cached. |
| `X-WatchLLM-Cache-Similarity` | (For semantic hits) The similarity score (0.0 - 1.0). |
| `X-WatchLLM-Cost-USD` | The estimated cost of the request. |
| `X-WatchLLM-Latency-Ms` | Time taken to process the request in milliseconds. |
| `X-WatchLLM-Provider` | The upstream provider (openai, anthropic, groq). |
| `X-WatchLLM-Tokens-Saved` | Estimated prompt tokens served from cache. |

## Service Health
`GET /health`

Returns the current status of the proxy and its downstream dependencies (Redis, Supabase).
