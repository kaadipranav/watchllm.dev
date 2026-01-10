# Agent Debugger

The Agent Debugger is an observability feature that surfaces a readable timeline of agent runs, showing per-step decisions, cost attribution, and explanations for each decision.

## Feature Flag

This feature is controlled by the `AGENT_DEBUGGER_V1` environment variable. Set it to `true` to enable.

```bash
AGENT_DEBUGGER_V1=true
```

Optionally, enable the LLM-based explainer:
```bash
EXPLAINER_ENABLED=true
```

## Instrumentation Schema

When instrumenting agent runs, use the following JSON schema:

```json
{
  "run_id": "uuid",
  "started_at": "2026-01-01T12:00:00Z",
  "ended_at": "2026-01-01T12:00:05Z",
  "user_id": "user-123",
  "project_id": "proj-456",
  "agent_name": "order-assistant-v1",
  "status": "completed",
  "steps": [
    {
      "step_index": 0,
      "timestamp": "2026-01-01T12:00:00Z",
      "type": "user_input",
      "summary": "User asked to place an order for 2 pizzas",
      "raw": "full-text-or-payload-if-needed"
    },
    {
      "step_index": 1,
      "timestamp": "2026-01-01T12:00:01Z",
      "type": "decision",
      "decision": "call_tool",
      "tool": "menu_search",
      "tool_args": {"query": "pizza margherita"},
      "tool_output_summary": "Found 3 matches, best match id=42",
      "token_cost": 12,
      "api_cost_usd": 0.0042,
      "cache_hit": false
    },
    {
      "step_index": 2,
      "timestamp": "2026-01-01T12:00:02Z",
      "type": "model_response",
      "summary": "Agent suggested 'Margherita, 2x'",
      "token_cost": 32,
      "api_cost_usd": 0.011
    }
  ],
  "total_cost_usd": 0.0152,
  "meta": {"region": "in", "env": "prod"}
}
```

### Step Types

| Type | Description |
|------|-------------|
| `user_input` | User message or input that starts the interaction |
| `decision` | Agent decision point (e.g., which tool to call) |
| `tool_call` | Execution of a tool/function |
| `tool_result` | Result returned from a tool |
| `model_response` | LLM-generated response |
| `retry` | Retry attempt after failure |
| `error` | Error occurrence |

### Required Fields

- `run_id`: Unique identifier for the run (UUID recommended)
- `started_at`: ISO 8601 timestamp
- `user_id`: User identifier
- `agent_name`: Name of the agent
- `status`: One of `running`, `completed`, `failed`, `cancelled`
- `steps`: Array of step objects

### Optional but Recommended Fields

- `api_cost_usd`: Cost of the step in USD (enables accurate cost tracking)
- `token_cost`: Number of tokens used
- `cache_hit`: Boolean indicating if result was cached
- `tool`: Name of tool used (for decision/tool_call steps)
- `tool_args`: Arguments passed to the tool
- `tool_output_summary`: Summary of tool output

## Cost Calculations

### Total Run Cost
Sum of `api_cost_usd` from all steps. If not available, estimated from `token_cost` using provider pricing.

### Wasted Spend
Cost attributed to:
- Retry steps
- Repeated tool calls producing identical outputs
- Cache misses immediately following failed attempts

### Amount Saved
For cache hits (`cache_hit: true`), the full `api_cost_usd` of that step is counted as saved.

### Cache Hit Rate
Percentage of cacheable steps (tool_call, decision, model_response) that had `cache_hit: true`.

## Flag Detection

The debugger automatically detects and flags anomalies:

| Flag | Description | Severity |
|------|-------------|----------|
| `loop_detected` | Same step type repeated 3+ times within 30 seconds | error |
| `high_cost_step` | Step cost exceeds $0.05 (configurable) | warning |
| `repeated_tool` | Same tool called 3+ times | warning |
| `cache_miss_retry` | Retry occurred without cache hit | info |
| `error_fallback` | Error triggered fallback behavior | error |
| `prompt_mutation` | Prompt changed between retries | info |
| `empty_tool_output` | Tool returned empty output | warning |

## API Endpoints

### List Agent Runs
```
GET /api/agent-runs?limit=20&offset=0&status=completed&project_id=...
```

### Get Debug View
```
GET /api/agent-runs/:run_id/debug
```

### View Fixture (for testing)
```
GET /api/agent-runs/fixture/normal
GET /api/agent-runs/fixture/loop
GET /api/agent-runs/fixture/high-cost
```

## Database Schema

Three tables are used:

1. **agent_debug_logs**: Run-level information (summary, status, cost totals)
2. **agent_debug_steps**: Individual step data within a run
3. **agent_debug_explanations**: LLM-generated explanations (for auditability)

See `supabase/migrations/008_agent_debug_logs.sql` for the full schema.

## Privacy & Security

- PII and API keys are automatically sanitized before storage
- Raw payloads are truncated to 5000 characters by default
- LLM explainer is disabled by default (enable with `EXPLAINER_ENABLED=true`)
- All data access is protected by Row Level Security (RLS)

## Development

### Run Tests
```bash
cd dashboard
pnpm test -- lib/agent-debugger
```

### View Fixtures Locally
1. Set `AGENT_DEBUGGER_V1=true` in `.env.local`
2. Run `pnpm dev`
3. Navigate to `/dashboard/observability/agent-runs`
4. Click "Demo Fixtures" to view sample runs

## Next Steps

- [ ] Hook up real instrumentation in production agents
- [ ] Add export to CSV functionality
- [ ] Implement cost forecasting based on historical patterns
- [ ] Add comparison view for A/B testing agent versions
- [ ] Integrate with alerting system for anomaly notifications
