# Task 1.2: ClickHouse Schema Design - Complete

## ✅ What Was Created

### 1. Schema File: `clickhouse/schema.sql`

A comprehensive ClickHouse schema with:

#### **Main Tables**

1. **`events`** - Primary observability events table
   - Stores all event types using discriminator pattern
   - Optimized for time-series queries
   - Monthly partitioning (`PARTITION BY toYYYYMM(timestamp)`)
   - 90-day TTL (configurable)
   - Supports all event types:
     - `prompt_call` - LLM API calls
     - `tool_call` - Tool/function calls
     - `agent_step` - Multi-step agent workflows
     - `error` - Error events
     - `assertion_failed` - Failed assertions
     - `hallucination_detected` - Detected hallucinations
     - `cost_threshold_exceeded` - Cost alerts
     - `performance_alert` - Performance issues

2. **`tool_calls`** - Nested tool call data
   - Linked to events via `event_id`
   - Stores individual tool call details
   - Separate table for better query performance

3. **`agent_steps`** - Detailed agent workflow tracking
   - Tracks multi-step agent executions
   - Ordered by `step_number` for workflow replay
   - Linked to events via `event_id` and `run_id`

#### **Materialized Views** (Pre-computed Aggregations)

1. **`hourly_metrics`** - Hourly aggregated metrics
   - Request counts, token usage, costs
   - Grouped by project, model, status
   - Fast dashboard queries

2. **`daily_metrics`** - Daily aggregated metrics
   - Daily summaries per project
   - Success/failure rates
   - Cost and latency trends

3. **`project_summary`** - Real-time project overview
   - Total events, costs, errors
   - First and last event timestamps
   - Quick health check view

### 2. Helper Scripts

1. **`scripts/create-schema.js`** - Automated schema deployment
   - Reads `clickhouse/schema.sql`
   - Executes each CREATE statement
   - Handles "already exists" gracefully
   - Provides detailed progress output

2. **`scripts/check-tables.js`** - Table verification (enhanced)
   - Lists all tables with row counts and sizes
   - Displays table schemas
   - Checks for missing expected tables
   - Shows materialized views

## 🎯 Schema Design Decisions

### Why This Structure?

1. **Single Events Table with Discriminator**
   - ✅ Easier to query across all event types
   - ✅ Simpler schema management
   - ✅ Better for time-series analytics
   - ✅ Nullable fields for type-specific data

2. **Separate Tool Calls & Agent Steps Tables**
   - ✅ Avoid array columns (better performance)
   - ✅ Enable efficient filtering on tool/step details
   - ✅ Cleaner schema for complex queries

3. **Monthly Partitioning**
   - ✅ Efficient data management
   - ✅ Easy to drop old partitions
   - ✅ Faster queries on recent data

4. **Materialized Views**
   - ✅ Pre-computed aggregations
   - ✅ Sub-second dashboard queries
   - ✅ Automatic updates on insert

### Indexes

The schema includes optimized indexes:

- **`idx_project_timestamp`** - Primary query pattern (project + time range)
- **`idx_run_id`** - Trace/workflow queries
- **`idx_user_id`** - User-specific queries
- **`idx_model`** - Model comparison queries
- **`idx_status`** - Error filtering
- **`idx_event_type`** - Event type filtering

### Storage Optimization

- **Compression**: ClickHouse automatically compresses data (typically 10:1 ratio)
- **TTL**: 90-day default retention (configurable per table)
- **Granularity**: 8192 rows per granule (balanced for performance)

## 📊 Schema Mapping

### TypeScript → ClickHouse Type Mapping

| TypeScript Type | ClickHouse Type | Notes |
|----------------|-----------------|-------|
| `string` | `String` | UTF-8 strings |
| `number` (int) | `Int32` | 32-bit integers |
| `number` (float) | `Float64` | 64-bit floats |
| `boolean` | `UInt8` | 0 or 1 |
| `string[]` | `Array(String)` | Array of strings |
| `Date` / ISO8601 | `DateTime64(3)` | Millisecond precision |
| `enum` | `Enum8` | 8-bit enum (up to 256 values) |
| `Record<string, any>` | `String` (JSON) | Stored as JSON string |
| `optional` | `Nullable(Type)` | NULL support |

### Event Type Fields

Each event type has specific fields in the `events` table:

```typescript
// PromptCallEvent → events table
{
  event_type: 'prompt_call',
  prompt: String,
  model: String,
  tokens_input: Int32,
  tokens_output: Int32,
  cost_estimate_usd: Float64,
  response: String,
  latency_ms: Int32,
  status: Enum8,
  // ... other fields nullable
}

// AgentStepEvent → events table
{
  event_type: 'agent_step',
  step_number: Int32,
  step_name: String,
  step_type: Enum8,
  step_input_data: String (JSON),
  step_output_data: String (JSON),
  // ... other fields nullable
}
```

## 🚀 Usage

### 1. Apply Schema (First Time)

```bash
# Make sure ClickHouse is running and configured
node scripts/verify-clickhouse.js

# Create all tables and views
node scripts/create-schema.js
```

Expected output:
```
🔨 Creating ClickHouse Schema...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 Reading schema from: clickhouse/schema.sql
   Found 9 SQL statements

   1/9 Creating TABLE: events...
      ✅ Success
   2/9 Creating TABLE: tool_calls...
      ✅ Success
   3/9 Creating TABLE: agent_steps...
      ✅ Success
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Schema Creation Complete!
```

### 2. Verify Tables

```bash
node scripts/check-tables.js
```

Expected output:
```
🔍 Checking ClickHouse Tables...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Database: watchllm
   Host: YOUR_DROPLET_IP:8123

✅ Found 6 table(s):

✅ events
   Engine: MergeTree
   Rows: 0
   Size: 0 Bytes

✅ tool_calls
   Engine: MergeTree
   Rows: 0
   Size: 0 Bytes

✅ agent_steps
   Engine: MergeTree
   Rows: 0
   Size: 0 Bytes

✅ hourly_metrics
   Engine: SummingMergeTree
   Rows: 0
   Size: 0 Bytes

✅ daily_metrics
   Engine: SummingMergeTree
   Rows: 0
   Size: 0 Bytes

✅ project_summary
   Engine: View
   Rows: 0
   Size: 0 Bytes
```

### 3. Test Insert (Manual)

```bash
# Connect to ClickHouse
ssh root@YOUR_DROPLET_IP
clickhouse-client

# Insert test event
INSERT INTO watchllm.events (
  event_id, project_id, run_id, timestamp, event_type,
  env, tags, prompt, model, tokens_input, tokens_output,
  cost_estimate_usd, response, latency_ms, status
) VALUES (
  'test-001',
  'proj-test',
  'run-001',
  now(),
  'prompt_call',
  'development',
  ['test'],
  'Hello, world!',
  'gpt-4o-mini',
  10,
  20,
  0.0001,
  'Hi there!',
  150,
  'success'
);

# Query it back
SELECT * FROM watchllm.events WHERE event_id = 'test-001';
```

## 📝 Sample Queries

### Get Recent Events
```sql
SELECT 
  event_id, 
  timestamp, 
  event_type, 
  model, 
  status, 
  cost_estimate_usd
FROM events 
WHERE project_id = 'your-project'
ORDER BY timestamp DESC 
LIMIT 100;
```

### Cost Breakdown by Model
```sql
SELECT 
  model,
  count() as requests,
  sum(cost_estimate_usd) as total_cost,
  avg(latency_ms) as avg_latency
FROM events 
WHERE project_id = 'your-project' 
  AND event_type = 'prompt_call'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY model
ORDER BY total_cost DESC;
```

### Error Rate Over Time
```sql
SELECT 
  toStartOfHour(timestamp) as hour,
  countIf(status = 'error') as errors,
  count() as total,
  (errors / total * 100) as error_rate_pct
FROM events
WHERE project_id = 'your-project'
  AND event_type = 'prompt_call'
  AND timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour DESC;
```

### Agent Workflow Trace
```sql
SELECT 
  step_number,
  step_name,
  step_type,
  latency_ms,
  status
FROM agent_steps
WHERE run_id = 'your-run-id'
ORDER BY step_number;
```

## ✅ Task 1.2 Complete!

You now have:
- ✅ Comprehensive ClickHouse schema
- ✅ Optimized tables for high-volume data
- ✅ Materialized views for fast analytics
- ✅ Helper scripts for deployment and verification
- ✅ Sample queries for testing

## 📝 Next Steps

1. **Proceed to Task 1.3**: Cloudflare Queues Setup
2. **Continue with TASKS.md Phase 1**

## 🔗 Related Files

- `clickhouse/schema.sql` - Full schema definition
- `packages/shared/src/observability/types.ts` - TypeScript types
- `scripts/create-schema.js` - Schema deployment script
- `scripts/check-tables.js` - Table verification script
- `scripts/verify-clickhouse.js` - Connection test script
