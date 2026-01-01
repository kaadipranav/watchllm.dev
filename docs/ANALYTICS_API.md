# Analytics API Integration Guide

This guide covers the new Analytics API endpoints that power the WatchLLM dashboard with real-time metrics from ClickHouse.

## 🎯 Overview

The Analytics API provides high-performance querying of observability data stored in ClickHouse. All endpoints require authentication and return JSON responses.

**Base URL**: `https://your-worker.workers.dev` (or `http://localhost:8787` for local dev)

## 🔐 Authentication

All requests require a valid API key passed in the `Authorization` header:

```bash
Authorization: Bearer YOUR_API_KEY
```

API keys are validated against Supabase and must have access to the requested project.

## 📊 Endpoints

### 1. Project Statistics

Get aggregated statistics for a project over a date range.

**Endpoint**: `GET /v1/analytics/stats`

**Query Parameters**:
- `project_id` (required): The project identifier
- `date_from` (optional): Start date in ISO8601 format (default: 30 days ago)
- `date_to` (optional): End date in ISO8601 format (default: now)

**Example Request**:
```bash
curl "https://your-worker.workers.dev/v1/analytics/stats?project_id=proj_123" \
  -H "Authorization: Bearer sk_test_abc123"
```

**Example Response**:
```json
{
  "project_id": "proj_123",
  "date_from": "2025-12-01T00:00:00.000Z",
  "date_to": "2026-01-01T00:00:00.000Z",
  "stats": {
    "total_requests": 15420,
    "successful_requests": 14893,
    "failed_requests": 527,
    "total_tokens_input": 450320,
    "total_tokens_output": 892140,
    "total_cost_usd": "23.4567",
    "avg_latency_ms": "342.56",
    "error_rate": "3.42",
    "unique_models": 4
  },
  "top_models": [
    {
      "model": "gpt-4o-mini",
      "request_count": 8932,
      "total_cost": "12.3456"
    },
    {
      "model": "gpt-4",
      "request_count": 3421,
      "total_cost": "8.7654"
    }
  ]
}
```

---

### 2. Time-Series Data

Get time-series data for charts and graphs.

**Endpoint**: `GET /v1/analytics/timeseries`

**Query Parameters**:
- `project_id` (required): The project identifier
- `period` (optional): Time period - `1h`, `6h`, `24h`, `7d`, `30d` (default: `24h`)
- `metric` (optional): Metric to track - `requests`, `cost`, `latency`, `errors` (default: `requests`)

**Example Request**:
```bash
curl "https://your-worker.workers.dev/v1/analytics/timeseries?project_id=proj_123&period=24h&metric=cost" \
  -H "Authorization: Bearer sk_test_abc123"
```

**Example Response**:
```json
{
  "project_id": "proj_123",
  "period": "24h",
  "metric": "cost",
  "date_from": "2025-12-31T00:00:00.000Z",
  "date_to": "2026-01-01T00:00:00.000Z",
  "data": [
    {
      "timestamp": "2025-12-31T00:00:00.000Z",
      "value": 0.45
    },
    {
      "timestamp": "2025-12-31T01:00:00.000Z",
      "value": 0.52
    },
    {
      "timestamp": "2025-12-31T02:00:00.000Z",
      "value": 0.38
    }
    // ... more data points
  ]
}
```

**Automatic Interval Selection**:
- `1h` period → 5-minute intervals
- `6h` period → 30-minute intervals
- `24h` period → 1-hour intervals
- `7d` period → 6-hour intervals
- `30d` period → 1-day intervals

---

### 3. Event Logs

Get paginated list of events with filtering options.

**Endpoint**: `GET /v1/analytics/logs`

**Query Parameters**:
- `project_id` (required): The project identifier
- `limit` (optional): Number of results (default: 100, max: 1000)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status - `success`, `error`, `timeout`, etc.
- `model` (optional): Filter by model name (e.g., `gpt-4`)
- `run_id` (optional): Filter by specific run identifier

**Example Request**:
```bash
curl "https://your-worker.workers.dev/v1/analytics/logs?project_id=proj_123&status=error&limit=10" \
  -H "Authorization: Bearer sk_test_abc123"
```

**Example Response**:
```json
{
  "project_id": "proj_123",
  "total": 127,
  "limit": 10,
  "offset": 0,
  "has_more": true,
  "logs": [
    {
      "event_id": "evt_abc123",
      "run_id": "run_xyz789",
      "timestamp": "2026-01-01T12:34:56.789Z",
      "model": "gpt-4",
      "prompt": "What is the capital of France?",
      "response": "The capital of France is Paris.",
      "tokens_input": 8,
      "tokens_output": 7,
      "cost_estimate_usd": 0.0023,
      "latency_ms": 342,
      "status": "success",
      "error_message": null,
      "user_id": "user_123",
      "tags": ["production", "chat"]
    }
    // ... more logs
  ]
}
```

---

### 4. Event Detail

Get detailed information about a specific event, including tool calls.

**Endpoint**: `GET /v1/analytics/event/:eventId`

**Query Parameters**:
- `project_id` (required): The project identifier

**Example Request**:
```bash
curl "https://your-worker.workers.dev/v1/analytics/event/evt_abc123?project_id=proj_123" \
  -H "Authorization: Bearer sk_test_abc123"
```

**Example Response**:
```json
{
  "event": {
    "event_id": "evt_abc123",
    "project_id": "proj_123",
    "run_id": "run_xyz789",
    "timestamp": "2026-01-01T12:34:56.789Z",
    "event_type": "prompt_call",
    "model": "gpt-4",
    "prompt": "What is the weather in Paris?",
    "response": "I'll check the weather for you.",
    "tokens_input": 8,
    "tokens_output": 7,
    "cost_estimate_usd": 0.0023,
    "latency_ms": 342,
    "status": "success",
    "response_metadata": "{\"confidence\": 0.95}",
    // ... all event fields
  },
  "tool_calls": [
    {
      "event_id": "evt_abc123",
      "tool_name": "weather_api",
      "tool_id": "tool_1",
      "tool_input": "{\"city\": \"Paris\"}",
      "tool_output": "{\"temp\": 15, \"condition\": \"sunny\"}",
      "latency_ms": 123,
      "status": "success"
    }
  ]
}
```

---

## 🔒 Security & Access Control

### API Key Validation
1. Extract API key from `Authorization: Bearer <key>` header
2. Validate against Supabase `api_keys` table
3. Check project ownership/access
4. Return 401 for invalid keys, 403 for unauthorized projects

### Project Isolation
- All queries filter by `project_id`
- Users can only access their own projects
- Cross-project access is prevented at the database level

---

## 📈 Performance Considerations

### Query Optimization
- All queries use ClickHouse's native aggregations
- Indexes on `project_id`, `timestamp` for fast filtering
- Parameterized queries prevent SQL injection
- Monthly partitioning reduces scan size

### Response Times (Typical)
- Stats endpoint: 50-200ms
- Timeseries: 100-300ms (depending on period)
- Logs: 50-150ms (with pagination)
- Event detail: 30-100ms

### Rate Limiting
- Uses existing IP-based rate limiting from worker
- API key rate limits apply per project
- No specific analytics endpoint limits (yet)

---

## 🐛 Error Handling

### Common Errors

**400 Bad Request**
```json
{
  "error": "project_id query parameter is required"
}
```

**401 Unauthorized**
```json
{
  "error": "Missing or invalid Authorization header"
}
```

**403 Forbidden**
```json
{
  "error": "Unauthorized access to project"
}
```

**404 Not Found**
```json
{
  "error": "Event not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to fetch analytics stats"
}
```

All errors are logged to console with detailed context for debugging.

---

## 🧪 Testing

### Local Development
```bash
# Start the worker
npm run dev --prefix worker

# Run analytics tests
node scripts/test-analytics-api.js
```

### Environment Variables
Set these in `.dev.vars` (worker) for testing:
```env
CLICKHOUSE_HOST=your-clickhouse-host
CLICKHOUSE_PORT=8123
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=your-password
CLICKHOUSE_DATABASE=watchllm
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Manual Testing with cURL
```bash
# Replace these variables
export WORKER_URL="http://localhost:8787"
export API_KEY="your-test-api-key"
export PROJECT_ID="your-project-id"

# Test stats
curl "$WORKER_URL/v1/analytics/stats?project_id=$PROJECT_ID" \
  -H "Authorization: Bearer $API_KEY"

# Test timeseries
curl "$WORKER_URL/v1/analytics/timeseries?project_id=$PROJECT_ID&period=7d&metric=cost" \
  -H "Authorization: Bearer $API_KEY"

# Test logs
curl "$WORKER_URL/v1/analytics/logs?project_id=$PROJECT_ID&limit=5" \
  -H "Authorization: Bearer $API_KEY"
```

---

## 📚 Next Steps

After the Analytics API is working:

1. **Dashboard Integration (Phase 4)**
   - Update dashboard to fetch from Analytics API
   - Replace Supabase direct queries
   - Build real-time charts with Recharts

2. **Advanced Features (Phase 5)**
   - Materialized views for faster aggregations
   - Real-time WebSocket updates
   - Custom alerting based on thresholds

3. **Optimization**
   - Add caching layer (Redis) for frequent queries
   - Implement query result caching
   - Add more granular indexes

---

## 🤝 Contributing

When adding new analytics endpoints:

1. Add route in `worker/src/handlers/analytics.ts`
2. Include API key validation
3. Use parameterized queries
4. Add proper error handling
5. Update this documentation
6. Add test cases to `scripts/test-analytics-api.js`

---

## 📝 License

Part of the WatchLLM project. See root LICENSE file.
