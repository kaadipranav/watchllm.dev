# ClickHouse Schema Quick Reference

## 📊 Tables Overview

| Table | Purpose | Engine | Key Fields |
|-------|---------|--------|------------|
| **events** | Main observability events | MergeTree | event_id, project_id, timestamp, event_type |
| **tool_calls** | Tool/function call details | MergeTree | event_id, tool_name, latency_ms |
| **agent_steps** | Multi-step agent workflows | MergeTree | run_id, step_number, step_type |
| **hourly_metrics** | Hourly aggregations | SummingMergeTree | project_id, hour, model |
| **daily_metrics** | Daily aggregations | SummingMergeTree | project_id, day |
| **project_summary** | Real-time project stats | View | project_id, total_events, total_cost |

## 🚀 Quick Start

```bash
# 1. Apply schema
node scripts/create-schema.js

# 2. Verify tables
node scripts/check-tables.js

# 3. Test insert (optional)
# See docs/TASK_1.2_SCHEMA_COMPLETE.md for examples
```

## 📝 Common Queries

### Recent Events
```sql
SELECT * FROM events 
WHERE project_id = 'YOUR_PROJECT' 
ORDER BY timestamp DESC LIMIT 100;
```

### Cost by Model (Last 7 Days)
```sql
SELECT model, sum(cost_estimate_usd) as cost, count() as requests
FROM events 
WHERE project_id = 'YOUR_PROJECT' 
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY model ORDER BY cost DESC;
```

### Error Rate (Last 24 Hours)
```sql
SELECT 
  toStartOfHour(timestamp) as hour,
  countIf(status = 'error') / count() * 100 as error_rate
FROM events
WHERE project_id = 'YOUR_PROJECT'
  AND timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour ORDER BY hour DESC;
```

### Agent Trace
```sql
SELECT step_number, step_name, latency_ms, status
FROM agent_steps
WHERE run_id = 'YOUR_RUN_ID'
ORDER BY step_number;
```

## 🔧 Maintenance

### Check Table Sizes
```sql
SELECT 
  table,
  formatReadableSize(sum(bytes)) as size,
  sum(rows) as rows
FROM system.parts
WHERE database = 'watchllm'
GROUP BY table;
```

### Drop Old Partitions (Manual Cleanup)
```sql
-- List partitions
SELECT partition, sum(rows) as rows
FROM system.parts
WHERE database = 'watchllm' AND table = 'events'
GROUP BY partition ORDER BY partition DESC;

-- Drop old partition (e.g., January 2024)
ALTER TABLE events DROP PARTITION '202401';
```

### Optimize Tables (Merge Parts)
```sql
OPTIMIZE TABLE events FINAL;
OPTIMIZE TABLE tool_calls FINAL;
OPTIMIZE TABLE agent_steps FINAL;
```

## 📈 Performance Tips

1. **Always filter by project_id** - It's the first column in ORDER BY
2. **Use time ranges** - Leverage partition pruning
3. **Limit results** - Add LIMIT to exploratory queries
4. **Use materialized views** - For dashboard queries
5. **Monitor query performance** - Check `system.query_log`

## 🔗 Files

- **Schema**: `clickhouse/schema.sql`
- **Types**: `packages/shared/src/observability/types.ts`
- **Scripts**: `scripts/create-schema.js`, `scripts/check-tables.js`
- **Docs**: `docs/TASK_1.2_SCHEMA_COMPLETE.md`
