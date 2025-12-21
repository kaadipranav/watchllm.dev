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
