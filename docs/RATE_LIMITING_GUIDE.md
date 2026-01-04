# Rate Limiting & Quota Enforcement Guide

This document explains how billing gates, rate limiting, and quota enforcement work in WatchLLM.

## Table of Contents
- [Overview](#overview)
- [Plan Limits](#plan-limits)
- [Implementation](#implementation)
- [Testing](#testing)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

---

## Overview

WatchLLM enforces usage limits based on subscription plans to ensure fair resource allocation and prevent abuse. The system uses **Redis-based counters** with two types of limits:

1. **Rate Limiting**: Per-minute request limits (prevents bursts)
2. **Quota**: Monthly request quotas (prevents sustained overuse)

### Architecture

```
Request → Auth → Rate Limit Check → Quota Check → Process → Increment Usage → Response
                    ↓ (Redis)          ↓ (Redis)                 ↓ (Redis)
                 429 if exceeded    429 if exceeded          Track usage
```

### Key Features

- ✅ **Sliding window rate limiting** - Smooth request distribution
- ✅ **Monthly quota tracking** - Automatic reset on 1st of each month
- ✅ **Plan-based limits** - Free, Starter, and Pro tiers
- ✅ **Graceful degradation** - Fails open if Redis unavailable
- ✅ **Detailed error messages** - User-friendly responses with upgrade links
- ✅ **Response headers** - Real-time limit/quota status

---

## Plan Limits

### Free Plan
```typescript
{
  requestsPerMonth: 50_000,    // 50K requests/month
  requestsPerMinute: 10,       // 10 requests/minute
  price: $0
}
```

### Starter Plan ($29/month)
```typescript
{
  requestsPerMonth: 250_000,   // 250K requests/month
  requestsPerMinute: 50,       // 50 requests/minute
  price: $29
}
```

### Pro Plan ($49/month)
```typescript
{
  requestsPerMonth: 1_000_000, // 1M requests/month
  requestsPerMinute: 200,      // 200 requests/minute
  price: $49
}
```

### Limits Comparison

| Metric | Free | Starter | Pro |
|--------|------|---------|-----|
| Monthly Requests | 50,000 | 250,000 | 1,000,000 |
| Requests/Minute | 10 | 50 | 200 |
| Price | $0 | $29 | $49 |
| Cost per 1K requests | - | $0.116 | $0.049 |

---

## Implementation

### 1. Rate Limiting Middleware

Located in [worker/src/lib/rate-limiting.ts](../worker/src/lib/rate-limiting.ts):

```typescript
import { checkRateLimit, checkQuota, incrementUsage } from './lib/rate-limiting';

// In request handler
const rateLimitResult = await checkRateLimit(env, projectId, plan);

if (!rateLimitResult.allowed) {
  return c.json({
    error: {
      message: `Rate limit exceeded. You can make ${rateLimitResult.limit} requests per minute on the ${plan} plan.`,
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded',
      details: {
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        resetAt: rateLimitResult.resetAt,
        retryAfter: rateLimitResult.retryAfter,
      },
    },
  }, 429);
}
```

### 2. Quota Enforcement

```typescript
const quotaResult = await checkQuota(env, projectId, plan);

if (!quotaResult.allowed) {
  return c.json({
    error: {
      message: `Monthly quota exceeded. Upgrade your plan or wait until quota resets.`,
      type: 'quota_exceeded_error',
      code: 'quota_exceeded',
      details: {
        used: quotaResult.used,
        limit: quotaResult.limit,
        resetAt: quotaResult.resetAt,
        upgradeUrl: 'https://watchllm.dev/dashboard/billing',
      },
    },
  }, 429);
}
```

### 3. Usage Tracking

```typescript
// After successful checks
await incrementUsage(env, projectId);
```

### 4. Response Headers

Every request includes headers:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1736001600

X-Quota-Limit: 50000
X-Quota-Remaining: 48523
X-Quota-Reset: 1738368000
```

### 5. Redis Keys

**Rate Limiting:**
```
ratelimit:{projectId}:{window}
```
- `window` = `Math.floor(Date.now() / 60000)` (minute-based)
- TTL: 60 seconds
- Value: Request count for current minute

**Quota Tracking:**
```
quota:{projectId}:{YYYY-MM}
```
- `YYYY-MM` = Current month (e.g., `2026-01`)
- TTL: Until end of next month
- Value: Total requests this month

---

## Testing

### Unit Tests

Run the test suite:

```bash
cd worker
pnpm test rate-limiting
```

Tests include:
- ✅ Plan limits configuration (13 tests)
- ✅ Rate limiting logic
- ✅ Monthly quota calculations
- ✅ Time window handling
- ✅ Error response formatting

**Results:** 69/69 tests passing

### Integration Testing

Manual verification script:

```bash
# Terminal 1: Start worker
cd worker
pnpm dev

# Terminal 2: Run verification
npx tsx scripts/verify-rate-limiting.js
```

The script will:
1. Make normal requests (within limits)
2. Track usage across multiple requests
3. Test rate limit enforcement (hits 429)
4. Verify response headers
5. Display comprehensive results

**Expected Output:**
```
🔍 WatchLLM Rate Limiting & Quota Verification

Test 1: Normal request within limits
──────────────────────────────────────────────────
✅ Status: 200
   Rate Limit: 9/10 remaining
   Quota: 49999/50000 remaining

Test 2: Multiple requests (tracking)
──────────────────────────────────────────────────
Request 2: 8/10 remaining
Request 3: 7/10 remaining
Request 4: 6/10 remaining

Test 3: Rate limit exhaustion
──────────────────────────────────────────────────
Sending requests until rate limit is hit...
Request 11: 0 remaining (status: 200)
✅ Rate limit enforced after 11 requests
   Error: Rate limit exceeded. You can make 10 requests per minute on the free plan.
   Retry-After: 47 seconds

Test 4: Response headers
──────────────────────────────────────────────────
Rate Limit Headers:
  X-RateLimit-Limit: 10
  X-RateLimit-Remaining: 0
  X-RateLimit-Reset: 1736001720 (2026-01-04T11:22:00.000Z)
Quota Headers:
  X-Quota-Limit: 50000
  X-Quota-Remaining: 49989
  X-Quota-Reset: 1738368000 (2026-02-01T00:00:00.000Z)

📊 Verification Summary
══════════════════════════════════════════════════
✅ Rate limiting is working correctly
✅ Quota tracking is enabled
✅ Response headers are present
✅ Error messages are user-friendly

🎉 All tests passed!
```

### Simulating Quota Exceeded

For testing quota limits in development:

```typescript
import { setUsageForTesting } from './lib/rate-limiting';

// Set usage to exceed free plan limit
await setUsageForTesting(env, projectId, 50001);

// Next request will return 429 quota_exceeded
```

---

## Usage

### Client-Side Handling

**JavaScript/TypeScript:**

```typescript
const response = await fetch('https://proxy.watchllm.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer lgw_proj_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ model: 'gpt-4', messages: [...] }),
});

// Check rate limit headers
const rateLimit = {
  limit: response.headers.get('X-RateLimit-Limit'),
  remaining: response.headers.get('X-RateLimit-Remaining'),
  reset: response.headers.get('X-RateLimit-Reset'),
};

if (response.status === 429) {
  const error = await response.json();
  
  if (error.error.code === 'rate_limit_exceeded') {
    // Wait and retry
    const retryAfter = error.error.details.retryAfter;
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    await sleep(retryAfter * 1000);
    // Retry request...
  }
  
  if (error.error.code === 'quota_exceeded') {
    // Show upgrade prompt
    console.log(`Quota exceeded. Upgrade at ${error.error.details.upgradeUrl}`);
    window.location.href = error.error.details.upgradeUrl;
  }
}
```

**Python:**

```python
import requests
import time

response = requests.post(
    'https://proxy.watchllm.dev/v1/chat/completions',
    headers={'Authorization': 'Bearer lgw_proj_...'},
    json={'model': 'gpt-4', 'messages': [...]}
)

# Check rate limit
rate_limit = {
    'limit': response.headers.get('X-RateLimit-Limit'),
    'remaining': response.headers.get('X-RateLimit-Remaining'),
    'reset': response.headers.get('X-RateLimit-Reset'),
}

if response.status_code == 429:
    error = response.json()
    
    if error['error']['code'] == 'rate_limit_exceeded':
        retry_after = error['error']['details']['retryAfter']
        print(f'Rate limited. Retrying after {retry_after}s')
        time.sleep(retry_after)
        # Retry request...
    
    elif error['error']['code'] == 'quota_exceeded':
        print(f"Quota exceeded. Upgrade at {error['error']['details']['upgradeUrl']}")
```

### Best Practices

1. **Monitor Headers**: Always check `X-RateLimit-Remaining` and `X-Quota-Remaining`
2. **Implement Backoff**: Use exponential backoff when rate limited
3. **Cache Responses**: Reduce duplicate requests with client-side caching
4. **Batch Requests**: Combine multiple operations when possible
5. **Upgrade Proactively**: Monitor usage and upgrade before hitting limits

---

## Error Responses

### Rate Limit Exceeded (429)

```json
{
  "error": {
    "message": "Rate limit exceeded. You can make 10 requests per minute on the free plan.",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded",
    "details": {
      "limit": 10,
      "remaining": 0,
      "resetAt": 1736001720,
      "retryAfter": 47
    }
  }
}
```

### Quota Exceeded (429)

```json
{
  "error": {
    "message": "Monthly quota exceeded. You've used 50000 of 50000 requests on the free plan. Upgrade your plan or wait until 2/1/2026.",
    "type": "quota_exceeded_error",
    "code": "quota_exceeded",
    "details": {
      "used": 50000,
      "limit": 50000,
      "remaining": 0,
      "resetAt": 1738368000,
      "resetDate": "2026-02-01T00:00:00.000Z",
      "upgradeUrl": "https://watchllm.dev/dashboard/billing"
    }
  }
}
```

---

## Troubleshooting

### High Rate Limit Usage

**Problem:** Frequently hitting rate limits

**Solutions:**
1. Upgrade to Starter or Pro plan for higher limits
2. Implement request batching
3. Add client-side caching
4. Reduce polling frequency
5. Use webhooks instead of polling

### Quota Exceeded Mid-Month

**Problem:** Running out of monthly quota before month ends

**Solutions:**
1. Upgrade to higher tier plan
2. Optimize request patterns (cache, deduplicate)
3. Monitor daily usage trends
4. Set up usage alerts

### Redis Connection Issues

**Problem:** Rate limiting not working (Redis unavailable)

**Behavior:** System fails open - allows all requests

**Solution:**
1. Check Redis connection in Cloudflare dashboard
2. Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Check Upstash Redis instance status
4. Review Worker logs for connection errors

### Incorrect Limits Applied

**Problem:** Wrong plan limits being enforced

**Diagnosis:**
```bash
# Check project plan in database
SELECT id, name, plan FROM projects WHERE id = 'your-project-id';
```

**Solution:**
1. Verify project plan in dashboard
2. Check Stripe subscription status
3. Ensure webhook processed subscription update
4. Clear Redis cache and retry

### Usage Counter Not Resetting

**Problem:** Monthly quota didn't reset on 1st of month

**Diagnosis:**
```bash
# Check Redis key
redis-cli GET "quota:your-project-id:2026-01"
```

**Solution:**
1. Verify system time is correct (UTC)
2. Check Redis TTL is set correctly
3. Manually reset if needed:
   ```typescript
   await resetUsage(env, projectId);
   ```

---

## Admin Tools

### Reset Usage (Testing Only)

```typescript
import { resetUsage } from './lib/rate-limiting';

// Reset all counters for a project
await resetUsage(env, projectId);
```

### Set Usage (Testing Only)

```typescript
import { setUsageForTesting } from './lib/rate-limiting';

// Manually set usage (for testing limits)
await setUsageForTesting(env, projectId, 45000);
```

### Get Usage Stats

```typescript
import { getUsageStats } from './lib/rate-limiting';

const stats = await getUsageStats(env, projectId, plan);
console.log('Rate Limit:', stats.rateLimit);
console.log('Quota:', stats.quota);
```

---

## Security Considerations

1. **API Key Validation**: Rate limits are per API key (project-level)
2. **Redis Security**: Use Upstash TLS connections
3. **Fail Open**: System allows requests if Redis is down (prevents service disruption)
4. **No Client Trust**: All enforcement happens server-side
5. **Audit Logging**: All quota exceeded events are logged

---

## Future Enhancements

- [ ] Per-endpoint rate limits (different limits for chat vs embeddings)
- [ ] Custom rate limits per customer
- [ ] Burst allowances for brief spikes
- [ ] Soft limits with warnings before hard limits
- [ ] Real-time usage dashboard
- [ ] Webhook notifications for approaching limits
- [ ] Grace period for accidental overages

---

## Resources

- **Code**: [worker/src/lib/rate-limiting.ts](../worker/src/lib/rate-limiting.ts)
- **Middleware**: [worker/src/index.ts](../worker/src/index.ts#L264-L370)
- **Tests**: [worker/src/lib/__tests__/rate-limiting.test.ts](../worker/src/lib/__tests__/rate-limiting.test.ts)
- **Verification**: [scripts/verify-rate-limiting.js](../scripts/verify-rate-limiting.js)
- **Billing Setup**: [dashboard/PAYMENT_SETUP.md](../dashboard/PAYMENT_SETUP.md)
