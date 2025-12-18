# Understanding Caching Architecture (Deterministic + Semantic)

![Cache orchestration](https://via.placeholder.com/900x420.png?text=Cache+Architecture+Diagram)

WatchLLM sits between your client and the AI provider, performing two layers of caching for every non-streaming `/v1/*` request:

1. **Deterministic layer** – Normalize (lowercase, trim, collapse whitespace) + stable hash of model/temperature/messages/tools/functions. Fast exact hits via Upstash Redis.
2. **Semantic layer** – Generate embeddings (`text-embedding-3-small` via OpenAI), run cosine similarity search over a bounded per-project vector index stored in Redis, and return the closest result when similarity ≥ threshold (default `0.95`).
3. **Miss forwarding** – For misses, forward the request to OpenAI/Anthropic/Groq, store both deterministic and semantic entries, and return it.
4. **Logging & metrics** – Log every hit/miss into Supabase `usage_logs`, emit observability events, and surface metrics on the dashboard.

## TTLs & Semantics

- **Completions & chat**: Deterministic cache TTL = 1 hour. Semantic entries are bounded by count (default 50 per project) to keep Redis small.
- **Embeddings**: Deterministic cache for 24 hours.
- **Similarity threshold**: Configurable via `SEMANTIC_CACHE_THRESHOLD` (0.5–0.99, default 0.95). Headers include `X-Cache: HIT-SEM` and `X-Cache-Similarity`.

## Debugging cache health

1. Send a request twice and compare headers:
	```bash
	X-Cache: HIT            # deterministic
	X-Cache: HIT-SEM        # semantic vector hit
	X-Cache-Similarity: 0.9623
	```
2. Dashboard hit rate target: >40% combined.
3. If hits stay low, review:
	- Prompts highly unique? Lower similarity threshold slightly (e.g., 0.9) or batch prompts.
	- Are you changing tools/functions/temperature each call? These affect deterministic hashing.
	- Streaming requests are intentionally bypassed (not cached).

## Advanced tips (Student Pack aware)

- **Vector backend options**: Default semantic index uses Redis (JSON blob) with in-worker cosine search. For larger scales, move vectors to a dedicated DB:
  - **MongoDB Atlas (Student Pack $50 credits)** – Enable Atlas Vector Search for higher-scale, server-side similarity.
  - **DigitalOcean ($200 credits)** – Run a managed Redis Stack or a Qdrant container for larger indexes.
- **Input batching**: Group similar prompts in one call; both deterministic and semantic caches will reuse them.
- **Selective caching**: Add `stream: true` (skip cache) or set a higher `SEMANTIC_CACHE_THRESHOLD` for stricter matches.

Every cache event is visible in Supabase and the dashboard so you can correlate cache hits with cost savings and plan upgrades.
