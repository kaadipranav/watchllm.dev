# Understanding Caching

![Cache flow](https://via.placeholder.com/900x420.png?text=Cache+Flow+Diagram)

WatchLLM intercepts every `/v1/*` request and performs:

1. **Normalization**: Prompts/messages are trimmed, lowercased, and whitespace-collapsed.
2. **Hashing**: A deterministic hash over the model, temperature, messages, tools, and functions becomes the cache key.
3. **Lookup**: Upstash Redis is queried with that key. Cache hits return instantly (`x-WatchLLM-cached: HIT`, cost `0`).
4. **Miss handling**: The proxy forwards the request to the chosen provider (OpenAI/Anthropic/Groq), stores the response with TTL, and returns it to you.
5. **Logging**: Each cache hit/miss logs to Supabase for dashboards, alerts, and guardrails.

**TTL defaults:** 1 hour for chat/completion responses, 24 hours for embeddings. You can customize TTL by wrapping the worker logic if you self-host.

**Cache hit rate** is surfaced on the dashboard’s Overview tab. Anything above 40–50% is considered healthy for high-frequency workloads.

**Advanced tip:** Send identical prompts with slight paraphrasing. WatchLLM’s semantic hashing frequently deduplicates similar intent, saving you money without rewriting client logic.
