# WatchLLM Database Schema - Quick Reference

## Tables Summary

### 📦 projects
```sql
id              UUID PRIMARY KEY
user_id         UUID → auth.users
name            TEXT (1-100 chars)
plan            TEXT (free|starter|pro)
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ (auto-updated)
```

**Indexes:** user_id, created_at, plan

---

### 🔑 api_keys
```sql
id              UUID PRIMARY KEY
key             TEXT UNIQUE (format: lgw_proj_xxx or lgw_test_xxx)
project_id      UUID → projects
name            TEXT (optional, 1-100 chars)
created_at      TIMESTAMPTZ
last_used_at    TIMESTAMPTZ (nullable, updated on use)
is_active       BOOLEAN (default: true)
```

**Indexes:** project_id, key (where active), is_active, last_used_at

---

### 📊 usage_logs
```sql
id              UUID PRIMARY KEY
project_id      UUID → projects
api_key_id      UUID → api_keys
model           TEXT
provider        TEXT (openai|anthropic|groq)
tokens_input    INTEGER (≥0)
tokens_output   INTEGER (≥0)
tokens_total    INTEGER (≥0)
cost_usd        DECIMAL(10,6) (≥0)
cached          BOOLEAN
latency_ms      INTEGER (≥0)
created_at      TIMESTAMPTZ
```

**Indexes:** project_id, api_key_id, created_at DESC, (project_id + created_at), cached, provider, model

**Note:** Immutable - no updates/deletes allowed

---

### 💳 subscriptions
```sql
id                      UUID PRIMARY KEY
user_id                 UUID → auth.users (UNIQUE)
stripe_customer_id      TEXT UNIQUE
stripe_subscription_id  TEXT UNIQUE (nullable)
plan                    TEXT (free|starter|pro)
status                  TEXT (active|canceled|past_due|...)
current_period_start    TIMESTAMPTZ
current_period_end      TIMESTAMPTZ
cancel_at_period_end    BOOLEAN (default: false)
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ (auto-updated)
```

**Indexes:** user_id, stripe_customer_id, stripe_subscription_id, status, plan

**Note:** One subscription per user

---

## Functions

### 📈 get_project_usage_stats(project_id, start_date, end_date)
Returns comprehensive usage statistics:
- total_requests
- cached_requests
- cache_hit_rate (percentage)
- total_tokens
- total_cost_usd
- avg_latency_ms
- requests_by_provider (JSONB)

### 📅 get_monthly_request_count(project_id)
Returns total requests for current month.

### ⚡ check_rate_limit(api_key_id, limit, window_minutes)
Returns:
- is_allowed (boolean)
- current_count
- reset_at (timestamp)

### 👤 get_user_subscription(user_id)
Returns active subscription details.

---

## RLS Policies

### Projects
- ✅ Users can SELECT/INSERT/UPDATE/DELETE their own projects

### API Keys
- ✅ Users can SELECT/INSERT/UPDATE/DELETE keys for their projects

### Usage Logs
- ✅ Users can SELECT logs for their projects
- ✅ Service role can INSERT (worker logging)
- ❌ No UPDATE/DELETE (immutable logs)

### Subscriptions
- ✅ Users can SELECT/INSERT/UPDATE their own subscription
- ✅ Service role can manage all (for Stripe webhooks)

---

## Key Constraints

- API key format: `^lgw_(proj|test)_[a-zA-Z0-9]{32,}$`
- Name length: 1-100 characters
- Plan values: 'free', 'starter', 'pro'
- Status values: 'active', 'canceled', 'past_due', etc.
- All token counts and costs must be ≥ 0
- Cascading deletes: Delete project → deletes keys & logs

---

## Usage Examples

```sql
-- Get last 7 days stats
SELECT * FROM get_project_usage_stats(
    'project-uuid',
    NOW() - INTERVAL '7 days',
    NOW()
);

-- Check monthly usage
SELECT get_monthly_request_count('project-uuid');

-- Get user's subscription
SELECT * FROM get_user_subscription(auth.uid());

-- List active API keys for a project
SELECT * FROM api_keys 
WHERE project_id = 'project-uuid' 
AND is_active = true;

-- Get usage logs for today
SELECT * FROM usage_logs 
WHERE project_id = 'project-uuid'
AND created_at >= CURRENT_DATE
ORDER BY created_at DESC;
```

---

## Plan Limits Reference

| Plan | Requests/Month | Requests/Minute | Price |
|------|----------------|-----------------|-------|
| Free | 50,000 | 10 | $0 |
| Starter | 250,000 | 50 | $29 |
| Pro | 1,000,000 | 200 | $49 |

---

## Maintenance Tasks

### Cleanup Old Logs (>90 days)
```sql
DELETE FROM usage_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Find Inactive API Keys
```sql
SELECT * FROM api_keys 
WHERE last_used_at < NOW() - INTERVAL '30 days'
OR last_used_at IS NULL;
```

### Monthly Cost Report
```sql
SELECT 
    DATE_TRUNC('month', created_at) as month,
    SUM(cost_usd) as total_cost,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE cached = true) as cached_requests
FROM usage_logs
WHERE project_id = 'project-uuid'
GROUP BY month
ORDER BY month DESC;
```
