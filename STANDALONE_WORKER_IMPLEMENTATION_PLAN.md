# WatchLLM Standalone Worker Server - Implementation Plan

## 📋 Problem Statement

### Current Situation
The WatchLLM worker (`worker/src/`) is built for **Cloudflare Workers** runtime:
- Uses Cloudflare-specific exports: `export default { fetch }`
- Depends on Cloudflare bindings: `Env` with D1, KV, R2, Queues
- Uses Cloudflare's `Request`/`Response` Web API
- Cannot run in a standard Node.js/Docker environment

### The Gap
The self-hosted Docker setup currently only runs:
- ✅ Next.js dashboard (port 3000)
- ✅ PostgreSQL, Redis, ClickHouse

But **NOT** the actual API proxy/caching layer, which is the core product.

### Impact
Customers who want self-hosted deployment **cannot use WatchLLM** because the proxy API doesn't work outside Cloudflare Workers.

---

## 🎯 Solution Overview

Build a **standalone Node.js server** that:
1. Runs the same Hono app from `worker/src/index.ts`
2. Replaces Cloudflare bindings with self-hosted equivalents
3. Runs in Docker alongside PostgreSQL/Redis
4. Maintains 100% feature parity with the Cloudflare version

### Architecture
```
┌─────────────────────────────────────────────┐
│  Self-Hosted Deployment                     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌─────────────────┐ │
│  │   Dashboard  │      │  Standalone     │ │
│  │   (Next.js)  │      │  Worker Server  │ │
│  │   Port 3000  │      │  (Node + Hono)  │ │
│  │              │      │  Port 8080      │ │
│  └──────┬───────┘      └────────┬────────┘ │
│         │                       │          │
│         │    ┌──────────────────┼────────┐ │
│         │    │                  │        │ │
│         ▼    ▼                  ▼        ▼ │
│    ┌─────────────┐      ┌──────────────┐  │
│    │ PostgreSQL  │      │    Redis     │  │
│    │  (Metadata) │      │  (Cache/RL)  │  │
│    └─────────────┘      └──────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🛠 Implementation Strategy

### Phase 1: Adapter Layer (Bindings Replacement)
Create adapters that translate Cloudflare bindings → Node.js services:

| Cloudflare Binding | Self-Hosted Replacement |
|-------------------|------------------------|
| `env.DB` (D1) | PostgreSQL with `pg` driver |
| `env.REDIS` (KV) | Redis with `ioredis` |
| `env.CLICKHOUSE_*` | Native ClickHouse client |
| `env.ANALYTICS_QUEUE` | In-memory queue or Bull/BullMQ |
| `env.VECTOR_INDEX` | PostgreSQL pgvector or Qdrant |

### Phase 2: Standalone Server Entry Point
Create `worker/standalone.ts`:
- Initialize Node.js HTTP server
- Load environment config
- Connect to databases
- Mount Hono app
- Handle graceful shutdown

### Phase 3: Docker Integration
Update Docker setup:
- Build both dashboard AND worker in Dockerfile
- Add worker service to docker-compose.yml
- Configure environment variables
- Set up inter-service networking

### Phase 4: Testing & Validation
- Test all API endpoints
- Verify caching works
- Validate rate limiting
- Check observability ingestion

---

## 📝 Task Breakdown

### ✅ Task 1: Create Environment Adapter
**File:** `worker/src/adapters/env-adapter.ts`

**Purpose:** Translate Cloudflare `Env` to Node.js services

**Subtasks:**
- [ ] 1.1: Create `SelfHostedEnv` interface matching Cloudflare `Env`
- [ ] 1.2: Implement PostgreSQL adapter (replaces D1)
- [ ] 1.3: Implement Redis adapter (replaces KV)
- [ ] 1.4: Implement ClickHouse adapter
- [ ] 1.5: Create in-memory queue adapter (replaces Cloudflare Queues)
- [ ] 1.6: Add environment variable loader

**Success Criteria:**
```typescript
const env = await createSelfHostedEnv();
// env.DB, env.REDIS work like Cloudflare bindings
```

---

### ✅ Task 2: Database Connection Pooling
**File:** `worker/src/adapters/database.ts`

**Purpose:** Efficient PostgreSQL connection management

**Subtasks:**
- [ ] 2.1: Install `pg` package
- [ ] 2.2: Create connection pool with configurable size
- [ ] 2.3: Implement D1-compatible query methods
- [ ] 2.4: Add transaction support
- [ ] 2.5: Handle connection errors gracefully
- [ ] 2.6: Add health check method

**Success Criteria:**
```typescript
const db = createDatabaseAdapter(process.env.DATABASE_URL);
const result = await db.prepare('SELECT * FROM users').all();
```

---

### ✅ Task 3: Redis Adapter
**File:** `worker/src/adapters/redis.ts`

**Purpose:** Redis client compatible with Upstash Redis SDK

**Subtasks:**
- [ ] 3.1: Install `ioredis` package
- [ ] 3.2: Create Redis client with retry logic
- [ ] 3.3: Implement KV-like methods (get, set, incr, expire)
- [ ] 3.4: Add JSON serialization/deserialization
- [ ] 3.5: Handle connection errors
- [ ] 3.6: Add graceful disconnect

**Success Criteria:**
```typescript
const redis = createRedisAdapter(process.env.REDIS_URL);
await redis.set('key', 'value', { ex: 60 });
```

---

### ✅ Task 4: ClickHouse Adapter
**File:** `worker/src/adapters/clickhouse.ts`

**Purpose:** ClickHouse client for analytics

**Subtasks:**
- [ ] 4.1: Install `@clickhouse/client` package
- [ ] 4.2: Create client with connection pooling
- [ ] 4.3: Implement batch insert method
- [ ] 4.4: Add query method
- [ ] 4.5: Handle connection errors
- [ ] 4.6: Make ClickHouse optional (graceful degradation)

**Success Criteria:**
```typescript
const ch = createClickHouseAdapter({
  host: process.env.CLICKHOUSE_HOST,
  database: process.env.CLICKHOUSE_DATABASE
});
await ch.insert('events', [{ event_id: '123', ... }]);
```

---

### ✅ Task 5: Queue Adapter
**File:** `worker/src/adapters/queue.ts`

**Purpose:** In-process queue for event processing

**Subtasks:**
- [ ] 5.1: Create in-memory queue with batch processing
- [ ] 5.2: Implement `send()` method (enqueue)
- [ ] 5.3: Implement `sendBatch()` method
- [ ] 5.4: Add worker thread for processing
- [ ] 5.5: Batch events every N seconds or M items
- [ ] 5.6: Handle processing errors with retry

**Success Criteria:**
```typescript
const queue = createQueueAdapter(async (batch) => {
  await insertToClickHouse(batch);
});
await queue.send({ event_id: '123', ... });
```

---

### ✅ Task 6: Standalone Server Entry Point
**File:** `worker/standalone.ts`

**Purpose:** Node.js HTTP server that runs the Hono app

**Subtasks:**
- [ ] 6.1: Install `@hono/node-server` package
- [ ] 6.2: Import main Hono app from `worker/src/index.ts`
- [ ] 6.3: Initialize adapters (DB, Redis, ClickHouse, Queue)
- [ ] 6.4: Create `SelfHostedEnv` and inject into Hono context
- [ ] 6.5: Start Node.js server on port 8080
- [ ] 6.6: Add graceful shutdown (SIGTERM, SIGINT)
- [ ] 6.7: Add startup health checks
- [ ] 6.8: Add request logging

**Success Criteria:**
```bash
node standalone.ts
# Server running on http://localhost:8080
curl http://localhost:8080/health
# {"status":"healthy"}
```

---

### ✅ Task 7: Update Hono App for Dual Runtime
**File:** `worker/src/index.ts`

**Purpose:** Make Hono app work in both Cloudflare + Node.js

**Subtasks:**
- [ ] 7.1: Export the Hono `app` instance (not just default export)
- [ ] 7.2: Keep Cloudflare Worker export for backward compatibility
- [ ] 7.3: Add runtime detection helper
- [ ] 7.4: Ensure all middleware works in both runtimes
- [ ] 7.5: Update env access to use generic `Env` type

**Success Criteria:**
```typescript
// Still works in Cloudflare
export default { fetch: app.fetch };

// Also works in Node.js
export { app }; // ← Can be imported by standalone.ts
```

---

### ✅ Task 8: Update Docker Compose
**File:** `self-hosted/docker-compose.yml`

**Purpose:** Add standalone worker service

**Subtasks:**
- [ ] 8.1: Add `watchllm-worker` service definition
- [ ] 8.2: Expose port 8080
- [ ] 8.3: Set environment variables
- [ ] 8.4: Add dependency on PostgreSQL and Redis
- [ ] 8.5: Add health check
- [ ] 8.6: Configure restart policy

**Success Criteria:**
```yaml
watchllm-worker:
  build: ...
  ports:
    - "8080:8080"
  depends_on:
    - postgres
    - redis
```

---

### ✅ Task 9: Update Dockerfile
**File:** `self-hosted/Dockerfile`

**Purpose:** Build and run both dashboard + worker

**Subtasks:**
- [ ] 9.1: Build worker TypeScript code
- [ ] 9.2: Install worker production dependencies
- [ ] 9.3: Copy worker build output
- [ ] 9.4: Add startup script to run both services
- [ ] 9.5: Or create separate Dockerfiles for dashboard/worker

**Success Criteria:**
```dockerfile
# Build worker
RUN pnpm --filter @watchllm/worker build

# Run worker
CMD ["node", "worker/dist/standalone.js"]
```

---

### ✅ Task 10: Environment Configuration
**File:** `self-hosted/.env.example`

**Purpose:** Document all required environment variables

**Subtasks:**
- [ ] 10.1: Add DATABASE_URL
- [ ] 10.2: Add REDIS_URL
- [ ] 10.3: Add CLICKHOUSE_* variables
- [ ] 10.4: Add OPENAI_API_KEY, ANTHROPIC_API_KEY
- [ ] 10.5: Add WORKER_PORT, NODE_ENV
- [ ] 10.6: Add comments explaining each variable

**Success Criteria:**
Complete `.env` file that "just works" when copied.

---

### ✅ Task 11: Update Proxy Forwarding
**File:** `dashboard/next.config.js` or `middleware.ts`

**Purpose:** Route `/v1/*` API calls to standalone worker

**Subtasks:**
- [ ] 11.1: Add Next.js rewrites for `/v1/*` → `http://watchllm-worker:8080/v1/*`
- [ ] 11.2: Handle CORS if needed
- [ ] 11.3: Add health check proxy

**Success Criteria:**
```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/v1/:path*',
      destination: 'http://watchllm-worker:8080/v1/:path*'
    }
  ];
}
```

---

### ✅ Task 12: Testing & Validation
**Files:** `worker/src/__tests__/standalone.test.ts`

**Purpose:** Ensure standalone mode works end-to-end

**Subtasks:**
- [ ] 12.1: Test database adapter with real PostgreSQL
- [ ] 12.2: Test Redis adapter
- [ ] 12.3: Test API endpoints (`/v1/chat/completions`)
- [ ] 12.4: Test caching behavior
- [ ] 12.5: Test rate limiting
- [ ] 12.6: Test observability ingestion
- [ ] 12.7: Load test (100 req/s)

**Success Criteria:**
All existing integration tests pass in standalone mode.

---

### ✅ Task 13: Documentation Updates
**Files:** 
- `self-hosted/README.md`
- `docs/DEPLOYMENT.md`

**Purpose:** Complete deployment guide

**Subtasks:**
- [ ] 13.1: Update architecture diagram
- [ ] 13.2: Add standalone worker setup instructions
- [ ] 13.3: Document port mappings
- [ ] 13.4: Add troubleshooting section
- [ ] 13.5: Performance tuning guide
- [ ] 13.6: Security hardening checklist

**Success Criteria:**
A non-technical person can deploy WatchLLM following the docs.

---

## 🤖 Can AI Code This?

**YES!** This is well-suited for AI-assisted development because:

✅ **Clear Requirements:** Each task has specific inputs/outputs  
✅ **Existing Patterns:** Similar adapters exist (e.g., Prisma → D1)  
✅ **Testable:** Each component can be tested independently  
✅ **Well-Scoped:** ~2-3 hours of focused coding per task  

### AI Implementation Approach

1. **Task-by-Task:** Complete each task in order
2. **Test-Driven:** Write tests first, then implementation
3. **Incremental:** Each task builds on the previous
4. **Validation:** Run tests after each task

---

## 📊 Estimated Effort

| Phase | Tasks | Complexity | Time Estimate |
|-------|-------|-----------|---------------|
| Adapters | 1-5 | Medium | 6-8 hours |
| Server Setup | 6-7 | Low | 2-3 hours |
| Docker Integration | 8-9 | Low | 1-2 hours |
| Configuration | 10-11 | Low | 1 hour |
| Testing | 12 | Medium | 3-4 hours |
| Documentation | 13 | Low | 1-2 hours |
| **TOTAL** | **13 tasks** | - | **14-20 hours** |

---

## 🎯 Success Criteria

When ALL tasks are complete, you should be able to:

```bash
# 1. Start self-hosted deployment
cd self-hosted
docker-compose up -d

# 2. Check health
curl http://localhost:8080/health
# {"status":"healthy","mode":"self_hosted"}

# 3. Make an API request
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer lgw_xxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'

# 4. Verify caching works (second request should be cached)

# 5. Check dashboard
open http://localhost:3000
```

---

## 🚀 Next Steps

1. Review this plan
2. Decide: Build all at once OR incrementally?
3. Start with **Task 1** (Environment Adapter)
4. Run tests after each task
5. Iterate until all 13 tasks complete

---

## 📌 Notes

- **Backward Compatibility:** Cloudflare Workers deployment MUST still work
- **Feature Parity:** Standalone mode should match Cloudflare 100%
- **Performance:** Target <10ms overhead vs Cloudflare Workers
- **Security:** Validate all environment inputs
- **Monitoring:** Add metrics for self-hosted deployments

---

**Ready to start coding?** Let me know which task to begin with! 🚀
