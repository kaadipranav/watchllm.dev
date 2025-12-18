# Semantic Caching Algorithm Files

This document identifies the exact files that contain the semantic caching algorithms in the WATCHLLM repository.

## Primary Implementation File

### `/worker/src/lib/cache.ts`

This is the **main file** containing all semantic caching algorithms and logic. It includes:

#### Key Components:

1. **Text Normalization Algorithm** (lines 28-30)
   - Function: `normalizeText(text: string): string`
   - Purpose: Normalizes text for consistent cache key generation
   - Algorithm: Converts to lowercase, removes extra whitespace, and trims

2. **Hash Generation Algorithm** (lines 36-45)
   - Function: `hashString(str: string): string`
   - Purpose: Creates deterministic hash for cache keys
   - Algorithm: Uses a simple but effective string hash algorithm (bitwise operations)

3. **Chat Completion Cache Key Generation** (lines 50-76)
   - Function: `generateChatCacheKey(request: ChatCompletionRequest): string`
   - Algorithm Details:
     - Extracts model name and temperature (fixed to 2 decimal places)
     - Normalizes and concatenates all messages (role:content format)
     - Includes function/tool definitions if present
     - Generates hash from combined key data
     - Returns prefixed cache key: `watchllm:cache:chat:{hash}`

4. **Completion Cache Key Generation** (lines 81-94)
   - Function: `generateCompletionCacheKey(request: CompletionRequest): string`
   - Algorithm Details:
     - Normalizes prompts (handles both string and array formats)
     - Combines model, temperature, and prompt
     - Returns prefixed cache key: `watchllm:cache:completion:{hash}`

5. **Embeddings Cache Key Generation** (lines 99-113)
   - Function: `generateEmbeddingsCacheKey(request: EmbeddingsRequest): string`
   - Algorithm Details:
     - Normalizes input text
     - Includes dimensions parameter if present
     - Returns prefixed cache key: `watchllm:cache:embedding:{hash}`

6. **CacheManager Class** (lines 118-248)
   - Main cache management interface
   - Methods for get/set operations for each request type
   - TTL management:
     - Chat completions: 1 hour (3600 seconds)
     - Completions: 1 hour (3600 seconds)
     - Embeddings: 24 hours (extended TTL because they're deterministic)
   - Automatic stream detection (streaming requests are never cached)

## Supporting Files (Cache Usage)

These files implement the semantic caching by using the algorithms defined in `cache.ts`:

### `/worker/src/handlers/chat.ts`
- **Line 20**: Import `createCacheManager`
- **Line 105**: Initialize cache manager
- **Lines 149-177**: Check cache before making API call
- **Lines 190-191**: Store response in cache after API call
- Adds cache headers: `X-Cache: HIT/MISS`, `X-Cache-Age`

### `/worker/src/handlers/completions.ts`
- **Line 19**: Import `createCacheManager`
- **Line 103**: Initialize cache manager
- **Lines 147-172**: Cache lookup and response
- **Lines 188-189**: Cache storage after API call

### `/worker/src/handlers/embeddings.ts`
- **Line 19**: Import `createCacheManager`
- **Line 105**: Initialize cache manager
- **Lines 144-169**: Cache lookup and response
- **Lines 185-186**: Cache storage (with 24-hour TTL)

## Test Files

### `/worker/src/lib/__tests__/cache.test.ts`
- Comprehensive tests for all cache key generation algorithms
- Tests for text normalization and deterministic key generation
- Tests for CacheManager operations (get/set/invalidate)
- Tests for streaming request handling (should not cache)

## Architecture Integration

The semantic caching system is integrated into the overall architecture as described in `/ARCHITECTURE.md`:

- Cache entries stored in **Upstash Redis** with TTLs
- Cache keys based on normalized prompts + hashing + temperature + tool definitions
- Edge execution ensures <100ms cold-starts
- Cache hit/miss metrics tracked in usage logs

## Key Semantic Caching Features

1. **Normalization**: Text is normalized (lowercase, whitespace removal) to increase cache hit rate
2. **Deterministic Hashing**: Same inputs always produce same cache keys
3. **Model & Temperature Awareness**: Different models or temperatures get different cache entries
4. **Tool-Aware**: Function/tool definitions are included in cache key calculation
5. **TTL Management**: Different TTLs based on request type (embeddings cached longer)
6. **Stream Detection**: Streaming requests bypass cache completely
7. **Zero-Cost Cache Hits**: Cached responses don't incur provider costs

## Summary

**The core semantic caching algorithms are exclusively in:**
- **`/worker/src/lib/cache.ts`** - All caching logic, key generation, and algorithms

**The algorithms are used by:**
- `/worker/src/handlers/chat.ts`
- `/worker/src/handlers/completions.ts`
- `/worker/src/handlers/embeddings.ts`

**Tested by:**
- `/worker/src/lib/__tests__/cache.test.ts`
