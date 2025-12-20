# Usage Analytics Implementation Guide

## Overview
This migration adds comprehensive usage analytics features to WatchLLM:
1. **Cache Cost Savings Tracking** - Track potential vs actual costs to show ROI
2. **Pre-calculated Aggregations** - Hourly and daily stats for fast dashboard loading

## Features Implemented

### 1. Cache Cost Savings (`potential_cost_usd`)

**What it does**: Tracks what each request *would have cost* without caching, allowing calculation of savings.

**How it works**:
- **Cached requests**: `cost_usd = 0`, `potential_cost_usd = calculated_cost`
- **Non-cached requests**: `cost_usd = calculated_cost`, `potential_cost_usd = calculated_cost`
- **Savings**: `potential_cost_usd - cost_usd`

**Example**:
```sql
-- Get total savings for a project
SELECT 
  SUM(potential_cost_usd - cost_usd) as total_savings_usd,
  COUNT(*) FILTER (WHERE cached = true) as cached_requests,
  COUNT(*) as total_requests
FROM usage_logs
WHERE project_id = 'xxx';
```

### 2. Hourly Aggregations

**Table**: `usage_aggregations_hourly`

**Columns**:
- Request counts (total, cached, cache hit rate)
- Token usage (input, output, total)
- Cost tracking (total cost, potential cost, savings)
- Performance (avg latency)
- Breakdowns (by provider, by model)

**Benefits**:
- Fast dashboard queries (read from aggregations instead of scanning millions of logs)
- Pre-calculated cache hit rates and savings
- Historical trend analysis

### 3. Daily Aggregations

**Table**: `usage_aggregations_daily`

**Same structure as hourly**, but aggregated by day for longer-term analytics.

### 4. Database Functions

#### `aggregate_usage_hourly(project_id, hour_start)`
Aggregates all usage logs for a specific hour into the hourly aggregations table.

```sql
-- Aggregate the last hour
SELECT aggregate_usage_hourly(
  'project-uuid',
  DATE_TRUNC('hour', NOW() - INTERVAL '1 hour')
);
```

#### `aggregate_usage_daily(project_id, date)`
Aggregates all usage logs for a specific day into the daily aggregations table.

```sql
-- Aggregate yesterday
SELECT aggregate_usage_daily(
  'project-uuid',
  CURRENT_DATE - 1
);
```

#### `get_dashboard_stats(project_id, days)`
Fast query to get pre-aggregated stats for the dashboard.

```sql
-- Get last 30 days of stats
SELECT * FROM get_dashboard_stats('project-uuid', 30);
```

Returns:
- Daily breakdown of requests, costs, savings
- Cache hit rates
- Provider and model distributions
- Average latency

## Setup

### Step 1: Run Migration
```bash
# Using Supabase CLI
supabase db push

# Or manually
psql $DATABASE_URL -f supabase/migrations/004_usage_analytics.sql
```

### Step 2: Backfill Existing Data (Optional)

If you have existing usage logs without `potential_cost_usd`:

```sql
-- Update existing cached logs
UPDATE usage_logs 
SET potential_cost_usd = (
  -- Calculate what it would have cost
  SELECT (tokens_input * pricing.input + tokens_output * pricing.output) / 1000
  FROM (VALUES 
    -- Add your model pricing here
    ('gpt-4o', 0.005, 0.015),
    ('gpt-4o-mini', 0.00015, 0.0006)
    -- ... more models
  ) AS pricing(model, input, output)
  WHERE pricing.model = usage_logs.model
)
WHERE cached = true AND potential_cost_usd = 0;

-- For non-cached, potential = actual
UPDATE usage_logs
SET potential_cost_usd = cost_usd
WHERE cached = false AND potential_cost_usd = 0;
```

### Step 3: Set Up Scheduled Aggregation

You have two options:

#### Option A: Real-time Trigger (Not Recommended for High Volume)
```sql
-- Enable the trigger (disabled by default)
CREATE TRIGGER update_aggregations_on_insert
    AFTER INSERT ON usage_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_aggregations();
```

**Pros**: Real-time updates
**Cons**: Slows down inserts, not suitable for high traffic

#### Option B: Scheduled Jobs (Recommended)

Use a cron job or Supabase Edge Functions to aggregate periodically:

```typescript
// Cloudflare Worker Cron (add to wrangler.toml)
export default {
  async scheduled(event, env, ctx) {
    const supabase = createSupabaseClient(env);
    
    // Get all active projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id');
    
    // Aggregate last hour for each project
    const lastHour = new Date();
    lastHour.setHours(lastHour.getHours() - 1);
    lastHour.setMinutes(0, 0, 0);
    
    for (const project of projects) {
      await supabase.rpc('aggregate_usage_hourly', {
        p_project_id: project.id,
        p_hour_start: lastHour.toISOString(),
      });
    }
  },
};
```

Add to `wrangler.toml`:
```toml
[triggers]
crons = ["0 * * * *"]  # Run every hour
```

## Dashboard Integration

### Fast Stats Query

Instead of querying `usage_logs` directly (slow for large datasets):

```typescript
// ❌ Slow - scans all logs
const { data } = await supabase
  .from('usage_logs')
  .select('*')
  .eq('project_id', projectId)
  .gte('created_at', thirtyDaysAgo);

// ✅ Fast - uses pre-aggregated data
const { data } = await supabase
  .rpc('get_dashboard_stats', {
    p_project_id: projectId,
    p_days: 30
  });
```

### Display Savings

```typescript
// Calculate total savings
const totalSavings = stats.reduce(
  (sum, day) => sum + parseFloat(day.total_savings_usd),
  0
);

// Display
<div>
  <h3>Total Savings</h3>
  <p>${totalSavings.toFixed(2)}</p>
  <small>Saved by caching</small>
</div>
```

### Cache Hit Rate Chart

```typescript
const chartData = stats.map(day => ({
  date: day.date,
  cacheHitRate: day.cache_hit_rate,
  requests: day.total_requests,
}));

// Use with recharts, chart.js, etc.
<LineChart data={chartData}>
  <Line dataKey="cacheHitRate" name="Cache Hit Rate %" />
</LineChart>
```

### Provider Breakdown

```typescript
// Get provider distribution
const providerStats = stats[0].requests_by_provider;
// { "openai": 1500, "anthropic": 300, "groq": 200 }

// Display as pie chart
const pieData = Object.entries(providerStats).map(([provider, count]) => ({
  name: provider,
  value: count,
}));
```

## Monitoring

### Check Aggregation Status

```sql
-- See latest aggregations
SELECT 
  project_id,
  MAX(hour_start) as latest_hour,
  COUNT(*) as total_hours
FROM usage_aggregations_hourly
GROUP BY project_id;

-- Check for gaps
SELECT 
  project_id,
  hour_start,
  LAG(hour_start) OVER (PARTITION BY project_id ORDER BY hour_start) as prev_hour
FROM usage_aggregations_hourly
WHERE hour_start - LAG(hour_start) OVER (PARTITION BY project_id ORDER BY hour_start) > INTERVAL '1 hour';
```

### Verify Savings Calculation

```sql
-- Compare raw logs vs aggregations
SELECT 
  'raw_logs' as source,
  SUM(potential_cost_usd - cost_usd) as total_savings
FROM usage_logs
WHERE project_id = 'xxx'
  AND DATE(created_at) = '2025-12-20'

UNION ALL

SELECT 
  'aggregation' as source,
  total_savings_usd
FROM usage_aggregations_daily
WHERE project_id = 'xxx'
  AND date = '2025-12-20';
```

## Performance Comparison

### Before (Scanning Raw Logs)
```sql
-- Query time: ~2-5 seconds for 1M rows
SELECT 
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(cost_usd) as cost
FROM usage_logs
WHERE project_id = 'xxx'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at);
```

### After (Using Aggregations)
```sql
-- Query time: ~10-50ms for 30 rows
SELECT 
  date,
  total_requests as requests,
  total_cost_usd as cost
FROM usage_aggregations_daily
WHERE project_id = 'xxx'
  AND date >= CURRENT_DATE - 30;
```

**Speed improvement**: ~100-500x faster! 🚀

## Storage Considerations

### Aggregation Table Size

Assuming:
- 1000 projects
- 720 hours/month (30 days)
- ~1KB per row

**Hourly**: 1000 × 720 × 1KB = ~720MB/month
**Daily**: 1000 × 30 × 1KB = ~30MB/month

**Total**: ~750MB/month (negligible compared to raw logs)

### Retention Policy (Optional)

```sql
-- Delete hourly aggregations older than 90 days
DELETE FROM usage_aggregations_hourly
WHERE hour_start < NOW() - INTERVAL '90 days';

-- Keep daily aggregations forever (or 1 year)
DELETE FROM usage_aggregations_daily
WHERE date < CURRENT_DATE - 365;
```

## Troubleshooting

### Aggregations Not Updating

1. **Check cron job is running**:
   ```bash
   wrangler tail --format pretty
   ```

2. **Manually trigger aggregation**:
   ```sql
   SELECT aggregate_usage_hourly('project-id', DATE_TRUNC('hour', NOW()));
   ```

3. **Check for errors**:
   ```sql
   -- Look for NULL values or constraints
   SELECT * FROM usage_logs
   WHERE potential_cost_usd IS NULL
   LIMIT 10;
   ```

### Savings Showing as Zero

1. **Check potential_cost_usd is set**:
   ```sql
   SELECT cached, cost_usd, potential_cost_usd
   FROM usage_logs
   WHERE project_id = 'xxx'
   LIMIT 10;
   ```

2. **Verify cached requests have potential cost**:
   ```sql
   SELECT 
     COUNT(*) as cached_requests,
     AVG(potential_cost_usd) as avg_potential_cost
   FROM usage_logs
   WHERE cached = true AND project_id = 'xxx';
   ```

## Next Steps

1. **Dashboard UI**: Build charts using the aggregated data
2. **Email Reports**: Send weekly savings reports to users
3. **Alerts**: Notify when cache hit rate drops below threshold
4. **Cost Forecasting**: Use historical data to predict future costs
5. **A/B Testing**: Compare costs across different models/providers

## Example Dashboard Queries

### Monthly Summary
```sql
SELECT 
  SUM(total_requests) as total_requests,
  SUM(cached_requests) as cached_requests,
  ROUND(AVG(cache_hit_rate), 2) as avg_cache_hit_rate,
  SUM(total_cost_usd) as total_cost,
  SUM(total_savings_usd) as total_savings,
  ROUND(SUM(total_savings_usd) / NULLIF(SUM(total_potential_cost_usd), 0) * 100, 2) as savings_percentage
FROM usage_aggregations_daily
WHERE project_id = 'xxx'
  AND date >= DATE_TRUNC('month', CURRENT_DATE);
```

### Top Models by Cost
```sql
SELECT 
  jsonb_object_keys(requests_by_model) as model,
  SUM((requests_by_model->>jsonb_object_keys(requests_by_model))::int) as requests,
  SUM(total_cost_usd) as cost
FROM usage_aggregations_daily
WHERE project_id = 'xxx'
  AND date >= CURRENT_DATE - 30
GROUP BY model
ORDER BY cost DESC
LIMIT 10;
```

### Cache Performance Trend
```sql
SELECT 
  date,
  cache_hit_rate,
  total_requests,
  total_savings_usd
FROM usage_aggregations_daily
WHERE project_id = 'xxx'
  AND date >= CURRENT_DATE - 30
ORDER BY date ASC;
```
