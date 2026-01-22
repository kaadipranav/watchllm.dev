# Standalone Worker Testing Guide

This guide covers all testing strategies for the WatchLLM standalone worker server.

## 📋 Test Categories

### 1. Adapter Tests (`adapters.test.ts`)
Tests individual adapters in isolation with real services.

**What it tests:**
- ✅ PostgreSQL D1 adapter (CRUD, transactions, health)
- ✅ Redis KV adapter (get/set, TTL, counters)
- ✅ ClickHouse adapter (insert, query, ping)
- ✅ In-memory queue adapter (batching, flushing, retries)

**How to run:**
```bash
# With Docker services running
pnpm test:standalone:adapters

# Or with custom environment
DATABASE_URL=postgresql://... pnpm test:standalone:adapters
```

**Prerequisites:**
- PostgreSQL running on localhost:5432
- Redis running on localhost:6379
- ClickHouse running on localhost:8123 (optional)

---

### 2. E2E API Tests (`e2e.test.ts`)
End-to-end tests of the full API with real upstream providers.

**What it tests:**
- ✅ Health endpoint
- ✅ Authentication (valid/invalid keys)
- ✅ Chat completions API
- ✅ Semantic caching (cache miss → hit)
- ✅ Rate limiting
- ✅ Observability ingestion
- ✅ Error handling
- ✅ Streaming responses

**How to run:**
```bash
# Requires OPENAI_API_KEY in environment
export OPENAI_API_KEY=sk-...
pnpm test:standalone:e2e

# Or with all variables
TEST_API_URL=http://localhost:8080 \
TEST_API_KEY=lgw_xxx \
OPENAI_API_KEY=sk-... \
pnpm test:standalone:e2e
```

**Prerequisites:**
- Standalone worker running at localhost:8080
- Valid OpenAI API key
- Test API key configured in database

**⚠️ Note:** These tests make real API calls and will incur costs!

---

### 3. Load Tests (`test-standalone-load.js`)
Performance and stability testing under high load.

**What it tests:**
- ✅ Throughput (target: 100 req/s)
- ✅ Latency (P50, P95, P99)
- ✅ Error rate under load
- ✅ Cache hit rate
- ✅ System stability

**How to run:**
```bash
# Default: 100 req/s for 60 seconds
pnpm test:standalone:load

# Custom parameters
LOAD_TEST_RPS=200 \
LOAD_TEST_DURATION=120 \
LOAD_TEST_CONCURRENT=20 \
pnpm test:standalone:load
```

**Environment Variables:**
- `TEST_API_URL`: Worker endpoint (default: `http://localhost:8080`)
- `TEST_API_KEY`: Valid API key
- `LOAD_TEST_RPS`: Target requests/second (default: `100`)
- `LOAD_TEST_DURATION`: Test duration in seconds (default: `60`)
- `LOAD_TEST_CONCURRENT`: Concurrent users (default: `10`)

**Success Criteria:**
- ✅ Success rate ≥ 95%
- ✅ P95 latency ≤ 2000ms

**⚠️ Note:** This will make ~6,000 API calls! Use with caution.

---

### 4. Quick Test (`test-standalone-quick.js`)
Fast sanity check for basic functionality.

**What it tests:**
- ✅ Health check
- ✅ Auth rejection
- ✅ Basic chat completion
- ✅ Cache hit/miss
- ✅ Rate limit headers

**How to run:**
```bash
# Assumes worker is running
pnpm test:standalone:quick

# With custom URL
API_URL=http://localhost:8080 \
API_KEY=lgw_xxx \
pnpm test:standalone:quick
```

**Use case:** Quick validation after deployment or code changes.

---

### 5. Full Integration Test (`test-standalone.ts`)
Complete test suite with automatic Docker orchestration.

**What it does:**
1. Starts Docker Compose services
2. Waits for health checks
3. Runs adapter tests
4. Runs E2E tests
5. Runs load tests (optional)
6. Tears down environment

**How to run:**
```bash
# Full test suite
pnpm test:standalone

# Skip load tests (faster)
pnpm test:standalone -- --skip-load

# Keep services running after tests
pnpm test:standalone -- --keep-running
```

**Prerequisites:**
- Docker and Docker Compose installed
- No conflicting services on ports 3000, 5432, 6379, 8080, 8123

**Duration:**
- With load tests: ~3-5 minutes
- Without load tests: ~1-2 minutes

---

## 🚀 Quick Start Guide

### Option 1: Manual Testing (Fastest)

```bash
# 1. Start services
cd self-hosted
docker-compose up -d

# 2. Wait for health
sleep 10

# 3. Run quick test
cd ..
pnpm test:standalone:quick
```

### Option 2: Full Automated Testing

```bash
# Runs everything automatically
pnpm test:standalone
```

### Option 3: Individual Test Suites

```bash
# Test adapters only
pnpm test:standalone:adapters

# Test API only
pnpm test:standalone:e2e

# Load test only
pnpm test:standalone:load
```

---

## 🔧 Environment Setup

### For Local Development

Create `.env.test`:

```bash
# Database
DATABASE_URL=postgresql://watchllm:watchllm@localhost:5432/watchllm

# Redis
REDIS_URL=redis://localhost:6379

# ClickHouse (optional)
CLICKHOUSE_HOST=http://localhost:8123
CLICKHOUSE_DATABASE=watchllm
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Test Configuration
TEST_API_URL=http://localhost:8080
TEST_API_KEY=lgw_test_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
```

Then run:

```bash
source .env.test  # or `set -a; . .env.test; set +a`
pnpm test:standalone:e2e
```

### For CI/CD

Set these secrets in your CI environment:

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  TEST_API_KEY: ${{ secrets.TEST_API_KEY }}
```

---

## 📊 Understanding Test Output

### Adapter Tests

```
✓ should prepare and execute a query (45ms)
✓ should handle SELECT queries (12ms)
✓ should support transactions (67ms)
✓ should report healthy connection (8ms)
```

### E2E Tests

```
✓ should return healthy status (5ms)
✓ should proxy OpenAI request successfully (1234ms)
✓ should cache and return cached responses (2456ms)
  └─ First request: cache miss (1200ms)
  └─ Second request: cache hit (8ms) ← 150x faster!
✓ should enforce rate limits (345ms)
```

### Load Tests

```
📊 Test Results
==================================================
Total Requests:     6000
Successful:         5987 (99.78%)
Failed:             13
Cache Hits:         3421 (57.02%)

⚡ Latency (ms)
  Min:              5
  Median:           89
  Average:          124.50
  P95:              287
  P99:              456
  Max:              1234

📈 Throughput
  Target:           100 req/s
  Actual:           99.78 req/s
==================================================

🎯 Test Criteria
  Success Rate:     99.78% ✅ (>= 95%)
  P95 Latency:      287ms ✅ (<= 2000ms)

🎉 LOAD TEST PASSED!
```

---

## 🐛 Troubleshooting

### "Connection refused" errors

**Problem:** Services not running or not healthy.

**Solution:**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs watchllm-worker

# Restart services
docker-compose restart watchllm-worker
```

### "Invalid API key" errors

**Problem:** Test API key not in database.

**Solution:**
```bash
# Create test API key manually
docker-compose exec postgres psql -U watchllm -d watchllm -c "
INSERT INTO api_keys (id, key, project_id, name) 
VALUES ('test_key_id', 'lgw_test_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'test_project', 'Test Key');
"
```

### "Upstream provider error" in tests

**Problem:** Invalid or rate-limited API keys.

**Solution:**
- Use a valid OpenAI API key
- Check API key balance
- Use mock responses for CI (see `msw` mocks)

### Tests timeout

**Problem:** Services taking too long to respond.

**Solution:**
```bash
# Increase test timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000, // 60 seconds
  },
});
```

---

## ✅ Success Criteria Summary

| Test Type | Pass Criteria |
|-----------|---------------|
| Adapter Tests | All adapters connect and perform operations |
| E2E Tests | All API endpoints return correct responses |
| Load Tests | ≥95% success rate, P95 ≤2000ms |
| Quick Test | 5/5 basic checks pass |

---

## 🎯 Best Practices

1. **Run quick test first** - Catches obvious issues fast
2. **Run adapter tests** - Validates database connections
3. **Run E2E tests** - Confirms API behavior
4. **Run load tests last** - Expensive, use sparingly

**Before deployment:**
```bash
pnpm test:standalone:quick  # 30 seconds
```

**Before release:**
```bash
pnpm test:standalone  # Full suite, 3-5 minutes
```

**In CI/CD:**
```bash
pnpm test:standalone -- --skip-load  # Skip expensive load tests
```

---

## 📚 Additional Resources

- [Worker Architecture](../docs/Architecture/WORKER.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Self-Hosted Setup](../self-hosted/README.md)
- [Troubleshooting](../docs/Guides/TROUBLESHOOTING.md)

---

**Questions?** Open an issue or contact support@watchllm.dev
