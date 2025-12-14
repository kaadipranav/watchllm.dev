# WatchLLM Architecture and Cost-Cutting Analysis

## How the App Works

WatchLLM is a **semantic caching proxy** for LLM APIs that sits between client applications and AI providers (OpenAI, Anthropic, Groq). It provides drop-in compatibility with OpenAI's API format while automatically caching responses to reduce costs by 40-70%.

### Core Architecture (from [ARCHITECTURE.md](ARCHITECTURE.md))

The app consists of three main layers:

1. **Edge Proxy** (Cloudflare Worker in `worker/src/index.ts`)
   - Receives `/v1/*` requests compatible with OpenAI API
   - Validates API keys against Supabase database
   - Performs semantic caching using Upstash Redis
   - Forwards uncached requests to AI providers
   - Logs all usage and costs

2. **Dashboard** (Next.js app in `dashboard/`)
   - User authentication and project management via Supabase
   - Real-time usage analytics and cost savings visualization
   - Stripe-powered billing with webhook handling
   - Public docs and landing page

3. **Data Infrastructure**
   - **Supabase**: User accounts, projects, API keys, usage logs
   - **Upstash Redis**: High-performance caching with TTL (1h for completions, 24h for embeddings)
   - **Stripe**: Subscription management and payments

## Middleware/Proxy Mechanism

The proxy functionality is implemented in the Cloudflare Worker (`worker/src/index.ts`) with a series of middleware layers:

### Authentication Middleware (`/v1/*` routes)

```typescript
// Extracts API key from Authorization header
function extractAPIKey(authHeader: string): string | null {
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return authHeader.trim();
}

// Validates key format and checks against Supabase
app.use('/v1/*', async (c, next) => {
  const apiKey = extractAPIKey(c.req.header('Authorization'));
  // Format validation: must start with lgw_proj_ or lgw_test_
  // Database lookup for active key and project details
});
```

### Rate Limiting Middleware

```typescript
// Checks Redis rate limit counters per project plan
const rateLimit = await redis.checkRateLimit(
  `ratelimit:${keyRecord.id}:minute`,
  planLimits.requestsPerMinute, // Free: 10/min, Starter: 50/min, Pro: 200/min
  60
);
```

### Request Processing Pipeline

Each API endpoint (`/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`) follows this flow:

1. **Request Validation** - Validates OpenAI-compatible request format
2. **Cache Check** - Looks up semantic cache in Redis
3. **Provider Call** - If cache miss, forwards to appropriate AI provider
4. **Response Caching** - Stores response in Redis with TTL
5. **Usage Logging** - Records tokens, cost, latency to Supabase
6. **Response Return** - With cache headers (`X-Cache: HIT/MISS`)

## Cost-Cutting Implementation

The cost reduction happens through **semantic caching** that identifies similar requests and serves cached responses instead of expensive API calls.

### Cache Key Generation (`worker/src/lib/cache.ts`)

```typescript
// Normalizes and hashes request content for consistent caching
function generateChatCacheKey(request: ChatCompletionRequest): string {
  const model = request.model;
  const temperature = (request.temperature ?? 1).toFixed(2);

  // Normalize messages: lowercase, trim, remove extra whitespace
  const messagesKey = request.messages
    .map((m) => `${m.role}:${normalizeText(m.content || '')}`)
    .join('|');

  // Include tools/functions if present
  const keyData = `${model}:${temperature}:${messagesKey}`;
  const hash = hashString(keyData);

  return `watchllm:cache:chat:${hash}`;
}
```

### Cost Calculation (`worker/src/types.ts`)

```typescript
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 0.005, output: 0.015 },      // $5/$15 per 1k tokens
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/$0.6 per 1k tokens
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  // ... etc for all supported models
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model] || { input: 0.001, output: 0.002 };
  return (inputTokens * pricing.input + outputTokens * pricing.output) / 1000;
}
```

### Cache Hit vs Miss Logic (`worker/src/handlers/chat.ts`)

```typescript
// Check cache first
const cachedResponse = await cache.getChatCompletion(request);
if (cachedResponse) {
  // CACHE HIT: Return instantly with $0 cost
  await supabase.logUsage({
    cost_usd: 0,  // No cost for cached responses
    cached: true,
    // ... other metadata
  });
  return c.json(cachedResponse.data, {
    headers: { 'X-Cache': 'HIT' }
  });
}

// CACHE MISS: Call provider and cache result
const response = await provider.chatCompletion(request);
const cost = calculateCost(response.model, response.usage.prompt_tokens, response.usage.completion_tokens);

await cache.setChatCompletion(request, response);  // Cache for future
await supabase.logUsage({
  cost_usd: cost,  // Actual provider cost
  cached: false,
  // ... other metadata
});
return c.json(response, {
  headers: { 'X-Cache': 'MISS', 'X-Cost-USD': cost.toFixed(6) }
});
```

### Savings Visualization (`dashboard/components/dashboard/usage-chart.tsx`)

The dashboard shows:
- **Cache hit rate** (percentage of requests served from cache)
- **Total savings** ($ amount saved vs. uncached costs)
- **Cost over time** charts comparing actual vs. hypothetical costs
- **Real-time metrics** from usage logs in Supabase

### Example Cost Reduction

For a typical chat completion request:
- **Without caching**: $0.0027 per request (150 input + 50 output tokens at GPT-4o-mini rates)
- **With caching**: $0.0027 for first request, $0 for subsequent identical/similar requests
- **Result**: 40-70% cost reduction depending on request similarity patterns

## Key Files Referenced

- `ARCHITECTURE.md` - High-level system overview
- `worker/src/index.ts` - Main proxy server with middleware
- `worker/src/handlers/chat.ts` - Chat completion handling with caching logic
- `worker/src/lib/cache.ts` - Cache key generation and management
- `worker/src/types.ts` - Cost calculation and model pricing
- `dashboard/components/dashboard/usage-chart.tsx` - Savings visualization
- `dashboard/app/(dashboard)/dashboard/page.tsx` - Dashboard with stats

## Conclusion

The system is designed for **zero code changes** - clients just swap their `baseURL` and API key, and benefit from automatic caching of semantically similar requests. This makes it particularly valuable for applications with repetitive prompts or chat interfaces.

The semantic caching approach normalizes request content (lowercasing, trimming whitespace) and generates deterministic hashes to identify similar requests, ensuring that slight variations in formatting don't prevent cache hits while avoiding false positives from completely different requests.</content>
<parameter name="filePath">d:\PRANAV APPS\WATCHLLM\WATCHLLM_ANALYSIS.md