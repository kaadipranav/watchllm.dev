# Agent Debugger Testing Guide

## Overview

The Agent Debugger V1 feature provides observability into agent runs with step-by-step debugging, cost attribution, and automated anomaly detection.

## Prerequisites

1. **Feature Flag**: Ensure `AGENT_DEBUGGER_V1=true` in your `.env.local`
2. **Dashboard Running**: Start the Next.js dashboard with `pnpm dev`
3. **Database**: Supabase tables must be initialized (migrations 008)

## Testing Methods

### Method 1: Using Fixture Data (Recommended for Quick Testing)

The agent debugger comes with 3 pre-built fixture runs for testing:

#### Available Fixtures:
- `normal` - A successful order assistant run with tool calls
- `loop` - A run with retry/loop issues (demonstrates anomaly detection)
- `high-cost` - A run with expensive operations (triggers cost warnings)

#### Steps:

1. **Start the dashboard**:
   ```bash
   cd dashboard
   pnpm dev
   ```

2. **View fixtures in browser**:
   - Navigate to: http://localhost:3000/dashboard/observability/agent-runs
   - Click "Demo Fixtures" or similar UI element
   - Or directly access: http://localhost:3000/dashboard/observability/agent-runs/fixture/normal

3. **Test via API**:
   ```bash
   # Run the test script
   node scripts/test-agent-debugger.js
   ```

4. **Manual API testing**:
   ```bash
   # Get normal run fixture
   curl http://localhost:3000/api/agent-runs/fixture/normal
   
   # Get loop run fixture
   curl http://localhost:3000/api/agent-runs/fixture/loop
   
   # Get high-cost run fixture
   curl http://localhost:3000/api/agent-runs/fixture/high-cost
   
   # List available fixtures
   curl -X OPTIONS http://localhost:3000/api/agent-runs/fixture/normal
   ```

### Method 2: Testing with Real Agent Data

To test with actual agent runs, you need to instrument your agents to send data.

#### Data Format

The agent debugger expects data in this format:

```json
{
  "run_id": "uuid",
  "started_at": "2026-01-10T10:00:00Z",
  "ended_at": "2026-01-10T10:00:08Z",
  "user_id": "user-123",
  "project_id": "proj-456",
  "agent_name": "order-assistant-v1",
  "status": "completed",
  "steps": [
    {
      "step_index": 0,
      "timestamp": "2026-01-10T10:00:00Z",
      "type": "user_input",
      "summary": "User asked to place an order for 2 pizzas",
      "raw": "Hi, I'd like to order 2 large margherita pizzas"
    },
    {
      "step_index": 1,
      "timestamp": "2026-01-10T10:00:01Z",
      "type": "decision",
      "decision": "call_tool",
      "tool": "menu_search",
      "tool_args": {"query": "margherita pizza large"},
      "token_cost": 45,
      "api_cost_usd": 0.000135,
      "cache_hit": false
    }
  ],
  "total_cost_usd": 0.0152
}
```

#### Step Types:
- `user_input` - User message
- `decision` - Agent decision point
- `tool_call` - Tool execution
- `tool_result` - Tool output
- `model_response` - LLM response
- `retry` - Retry attempt
- `error` - Error occurrence

#### Inserting Test Data

Since there's no POST endpoint (this is a display-only feature), you can insert test data directly into the database:

```bash
cd dashboard
pnpm tsx scripts/insert-agent-run.ts
```

Or manually insert via Supabase SQL:

```sql
-- Insert a test run
INSERT INTO agent_debug_logs (
  run_id, user_id, project_id, agent_name, status,
  started_at, ended_at, total_cost_usd, total_steps
) VALUES (
  gen_random_uuid(),
  'test-user',
  'test-project',
  'test-agent',
  'completed',
  NOW() - INTERVAL '5 minutes',
  NOW(),
  0.015,
  5
);

-- Insert steps
INSERT INTO agent_debug_steps (
  run_id, step_index, timestamp, type, summary,
  token_cost, api_cost_usd, cache_hit
) VALUES (
  (SELECT run_id FROM agent_debug_logs WHERE agent_name = 'test-agent' LIMIT 1),
  0,
  NOW() - INTERVAL '5 minutes',
  'user_input',
  'Test user input',
  0,
  0,
  false
);
```

### Method 3: Integration with Your Agent Framework

For production use, integrate the agent debugger with your agent framework:

#### Example: LangChain Integration

```typescript
import { AgentDebugLogger } from '@/lib/agent-debugger';

const logger = new AgentDebugLogger({
  userId: 'user-123',
  projectId: 'proj-456',
  agentName: 'my-agent-v1'
});

// Start run
const runId = logger.startRun();

// Log user input
logger.logStep({
  type: 'user_input',
  summary: userMessage
});

// Log tool calls
logger.logStep({
  type: 'tool_call',
  tool: 'search',
  tool_args: { query: 'pizza' },
  tool_output_summary: 'Found 3 results'
});

// End run
await logger.endRun('completed');
```

## What the Tests Verify

The test script (`test-agent-debugger.js`) verifies:

1. ✅ **Fixture endpoints work** - Can fetch pre-built test runs
2. ✅ **Debug view structure** - Contains all required fields
3. ✅ **Cost calculations** - Total cost, cache savings computed correctly
4. ✅ **Flag detection** - Anomalies like loops/high-cost flagged
5. ✅ **Step parsing** - All step types parsed correctly
6. ✅ **Database queries** - Can list and fetch runs from database

## Expected Output

When running `node scripts/test-agent-debugger.js`:

```
🧪 Agent Debugger Test Suite
==============================
Base URL: http://localhost:3000
Feature Flag: AGENT_DEBUGGER_V1=true

--- FIXTURE TESTS ---

📊 Testing fixture: normal
✅ PASSED: Valid debug view structure
   Run ID: 550e8400-e29b-41d4-a716-446655440001
   Agent: order-assistant-v1
   Status: completed
   Steps: 8
   Flags: 0
   Total Cost: $0.000905
   Cache Hit Rate: 12.5%
   📝 Step types:
      - user_input: 1
      - decision: 3
      - tool_call: 3
      - model_response: 1

📊 Testing fixture: loop
✅ PASSED: Valid debug view structure
   Run ID: 550e8400-e29b-41d4-a716-446655440002
   Agent: retry-agent-v1
   Status: failed
   Steps: 12
   Flags: 2
   🚩 Flags detected:
      - loop_detected (error): Step type 'tool_call' repeated 4 times
      - repeated_tool (warning): Tool 'validate_order' called 4 times
   Total Cost: $0.002145
   Cache Hit Rate: 0%

📊 Testing fixture: high-cost
✅ PASSED: Valid debug view structure
   Flags: 1
   🚩 Flags detected:
      - high_cost_step (warning): Step cost $0.125 exceeds threshold

--- DATABASE TESTS ---

📋 Testing: List agent runs
✅ PASSED: Retrieved 0 runs (total: 0)

🔍 Testing: Get debug view for run 550e8400-e29b-41d4-a716-446655440001
✅ PASSED: Retrieved debug view

==============================

📊 Results: 5/5 tests passed (100%)
✅ All tests passed!

💡 Agent Debugger is working correctly!
   View the UI at: http://localhost:3000/dashboard/observability/agent-runs
```

## Viewing in the UI

1. Start dashboard: `cd dashboard && pnpm dev`
2. Navigate to: http://localhost:3000/dashboard/observability/agent-runs
3. You'll see:
   - List of all agent runs (from database)
   - Filter by status, agent name, date range
   - Click any run to see detailed debug view with:
     - Timeline of all steps
     - Cost breakdown per step
     - Detected anomalies/flags
     - Cache hit statistics
     - Tool usage patterns

## Key Features to Test

### 1. Cost Attribution
- Verify total cost matches sum of step costs
- Check "Amount Saved" for cache hits
- Validate "Wasted Spend" for retries

### 2. Anomaly Detection
- Loop detection (same step 3+ times)
- High-cost warnings (>$0.05 per step)
- Repeated tool calls
- Empty tool outputs

### 3. Cache Analytics
- Cache hit rate percentage
- Cost savings from cache
- Which steps were cached

### 4. Privacy & Security
- PII sanitization working
- API keys redacted
- Raw payloads truncated

## Troubleshooting

### Dashboard not starting
```bash
cd dashboard
pnpm install
pnpm dev
```

### Feature flag not enabled
Check `dashboard/.env.local`:
```bash
AGENT_DEBUGGER_V1=true
```

### Database tables missing
Run migrations:
```bash
cd supabase
supabase db push
```

### Fixtures not loading
Check that fixture JSON files exist:
```bash
ls dashboard/lib/agent-debugger/fixtures/
# Should show: normal_run.json, loop_run.json, high_cost_run.json
```

## Production Usage

**Note**: The Agent Debugger is currently a **read-only visualization tool**. It does not accept POST requests from external agents.

To use in production:
1. Your agents must log data directly to the `agent_debug_logs` and `agent_debug_steps` tables
2. Use the SDK/library methods (when available) or direct database inserts
3. The dashboard then reads this data and displays it

This is **NOT** an agent execution platform - it's purely for observability of agents you run elsewhere.
