# Understanding Caching Architecture

![Cache orchestration](https://via.placeholder.com/900x420.png?text=Cache+Architecture+Diagram)

WatchLLM sits between your client and the AI provider, performing five deterministic steps for every `/v1/*` request:

1. **Normalization** – Trim, lowercase, normalize whitespace, and serialize structured payloads (messages, tools, functions) so semantically similar prompts hash the same way.
2. **Hashing** – Combine model, temperature, tools, and normalized payload into a stable hash key.
3. **Lookup** – Query Upstash Redis for the hash key. A hit returns instantly with `x-WatchLLM-cached: HIT` and `x-WatchLLM-cost-usd: 0.00`.
4. **Miss forwarding** – For cache misses, forward the request to OpenAI/Anthropic/Groq, store the response, and return it.
5. **Logging & metrics** – Log every hit/miss into Supabase `usage_logs`, emit Datadog/Sentry events, and surface metrics on the dashboard.

## TTLs & Semantics

- **Completions & chat**: Default TTL is 1 hour but can be extended by editing worker logic or wrapping the request proxy.
- **Embeddings**: Captured for 24 hours to avoid redundant vector computations.
- **Semantic tolerance**: Hashing tolerates paraphrased prompts—`"How do I reset"` and `"How to change password"` often deduplicate when similarity > 95%.

## Debugging cache health

1. Send a request twice and compare headers:
	```bash
	x-WatchLLM-cached: HIT
	x-WatchLLM-tokens-saved: 620
	x-WatchLLM-provider: openai
	```
2. Use the dashboard overview to monitor cache hit rate (aim for >40%).
3. If hits stay low, review:
	- Are prompts normalized the same way (no extra whitespace or random metadata)?
	- Is the temperature or tools array changing per request? Those inputs affect the hash.
	- Was the request marked `stream: true`? Streaming responses append new tokens that need to finish before caching.

## Advanced tips

- **Input batching**: Group similar prompts inside the same request—cached at the hash level.
- **Custom TTL**: Wrap the worker to set `cacheControl: "public, max-age=1800"` for time-sensitive responses.
- **Selective caching**: Add metadata like `cache: false` in the payload, and let the worker bypass caching for high-stakes requests.

Every cache event is visible in Supabase and the dashboard so you can correlate cache hits with cost savings and plan upgrades.
