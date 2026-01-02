# WatchLLM Expansion Tasks

This document outlines the step-by-step plan to expand WatchLLM from its current prototype state to the full vision described in `docs/CONTEXT (2).md`.

**Current Codebase Context:**
* Event schemas: `packages/shared/src/observability/types.ts` (BaseEvent, PromptCallEvent, etc.)
* Existing logging routes: `worker/src/observability/routes.ts` (`/v1/projects/:projectId/events`, `/v1/events/batch`)
* Current ingestion: `worker/src/observability/ingestion.ts` (uses Supabase)
* Worker structure: `worker/src/index.ts` with Hono routes
* **Verification Scripts:** All referenced scripts in `scripts/` directory are now created and ready to use.

---

## Phase 1: Infrastructure Foundation (The "Plumbing")

The goal is to establish the high-volume data pipeline without breaking the current synchronous ingestion.

- [ ] **Task 1.1: ClickHouse Setup**
    *   **Action:** Set up a ClickHouse instance (Self-hosted on DigitalOcean as per plan, or ClickHouse Cloud for dev).
    *   **Deliverable:** Connection string and credentials added to `.dev.vars` (Worker) and `.env.local` (Dashboard).
    *   **Verification:** Create and run `scripts/verify-clickhouse.js`.
        ```bash
        # Expected output: "Successfully connected to ClickHouse! Version: ..."
        node scripts/verify-clickhouse.js
        ```

- [x] **Task 1.2: ClickHouse Schema Design**
    *   **Action:** Create the initial SQL schema for `events`, `spans`, and `traces` based on `packages/shared/src/observability/types.ts`.
    *   **Reference:** Use BaseEvent + specific event types (PromptCallEvent, ToolCallEvent, etc.) to create tables.
    *   **Deliverable:** `clickhouse/schema.sql` file with tables:
        - `events` (main table with all BaseEvent fields + event_type discriminator)
        - `tool_calls` (nested table for tool call details)
        - `agent_steps` (for agent step tracking)
    *   **Schema Example:**
        ```sql
        CREATE TABLE events (
            event_id String,
            project_id String,
            run_id String,
            timestamp DateTime64(3),
            user_id Nullable(String),
            tags Array(String),
            release Nullable(String),
            env Enum('production', 'staging', 'development'),
            client_hostname Nullable(String),
            client_sdk_version Nullable(String),
            client_platform Nullable(String),
            event_type Enum('prompt_call', 'tool_call', 'agent_step', 'error', 'assertion_failed', 'hallucination_detected', 'cost_threshold_exceeded', 'performance_alert'),
            -- PromptCallEvent fields
            prompt Nullable(String),
            model Nullable(String),
            tokens_input Nullable(Int32),
            tokens_output Nullable(Int32),
            cost_estimate_usd Nullable(Float64),
            response Nullable(String),
            latency_ms Nullable(Int32),
            status Nullable(Enum('success', 'error', 'timeout', 'assertion_failed', 'warning')),
            INDEX idx_project_timestamp (project_id, timestamp) TYPE minmax GRANULARITY 1
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(timestamp)
        ORDER BY (project_id, timestamp, event_id);
        ```
    *   **Verification:** Run a query to list tables.
        ```bash
        # Expected output: Lists 'events', 'tool_calls', etc.
        node scripts/check-tables.js
        ```

- [x] **Task 1.3: Cloudflare Queues Setup**
    *   **Action:** Configure Cloudflare Queues in `worker/wrangler.toml`.
    *   **Config:** Add `[[queues.producers]]` and `[[queues.consumers]]`.
    *   **Deliverable:** Updated `wrangler.toml`.
    *   **Verification:** Check configuration validity.
        ```bash
        # Expected output: No validation errors
        npx wrangler types
        ```

- [x] **Task 1.4: Worker Queue Producer**
    *   **Action:** Modify `worker/src/observability/ingestion.ts` to write incoming events to the Queue *asynchronously* instead of (or in addition to) current processing.
    *   **Note:** Keep the current Supabase write for now as a fallback/double-write until ClickHouse is proven.
    *   **Code Location:** Update `createObservabilityIngestion` function to call `c.env.OBSERVABILITY_QUEUE.send(event)`.
    *   **Deliverable:** Modified ingestion logic that queues events.
    *   **Verification:** Run local worker and send a request.
        ```bash
        # Start worker
        npm run dev --prefix worker
        # In another terminal, send a curl request. Check worker logs for "Queued event..."
        curl -X POST http://localhost:8787/v1/projects/test/events \
          -H "Authorization: Bearer test-key" \
          -H "Content-Type: application/json" \
          -d '{"event_id":"test","event_type":"prompt_call","project_id":"test","run_id":"test","timestamp":"2024-01-01T00:00:00Z","tags":[],"env":"development","client":{},"prompt":"test","model":"gpt-4","tokens_input":10,"tokens_output":20,"cost_estimate_usd":0.01,"response":"test","response_metadata":{},"status":"success","latency_ms":100}'
        ```

- [x] **Task 1.5: Worker Queue Consumer**
    *   **Action:** Create a `queue` handler in `worker/src/index.ts`.
    *   **Logic:** Read batches from Queue -> Insert into ClickHouse (via HTTP interface or client).
    *   **Deliverable:** `queue` export in `worker/src/index.ts`.
    *   **Verification:** End-to-end local test.
        ```bash
        # Trigger a queue message manually (if possible via wrangler) or rely on Task 1.4 verification extending to see data appear in ClickHouse.
        # Run: node scripts/count-clickhouse-rows.js
        # Expected: Row count increases after sending request.
        ```

---

## Phase 2: SDK & Ingestion Hardening

Ensure the data entering the system is rich, typed, and reliable.

- [x] **Task 2.1: Python SDK Verification**
    *   **Action:** Audit `packages/sdk-python/src/watchllm/client.py`.
    *   **Check:** Does it match the `Event` schema expected by the Worker?
    *   **Improvement:** Add automatic batching and retry logic if missing.
    *   **Deliverable:** Updated `client.py` and a `tests/test_client.py` script.
    *   **Verification:** Run the Python test suite.
        ```bash
        python packages/sdk-python/tests/test_client.py
        # Expected: All tests passed.
        ```

- [ ] **Task 2.2: TypeScript/Node SDK**
    *   **Action:** Create `packages/sdk-node` (or check `packages/shared`).
    *   **Logic:** Port the Python SDK logic to TypeScript.
    *   **Deliverable:** A working Node.js SDK package.
    *   **Verification:** Run the Node test suite.
        ```bash
        cd packages/sdk-node
        npm test
        # Expected: All tests passed.
        ```

- [x] **Task 2.3: Ingestion Validation**
    *   **Action:** Enhance `worker/src/lib/validation.ts` to strictly validate payloads against the schema before queuing.
    *   **Deliverable:** Stronger Zod schemas in Worker.
    *   **Verification:** Send invalid payloads.
        ```bash
        # Enhanced validation now provides detailed error messages
        npx tsx scripts/verify-task-2-3.js
        # Expected: All 7/7 validation tests pass with detailed error reporting
        ```

---

## Phase 3: Analytics Engine (The "Brain")

Build the query layer that the dashboard will consume.

- [x] **Task 3.1: Analytics API Routes** ✅ *Completed: 2026-01-01*
    *   **Action:** Create new Hono routes in `worker/src/handlers/analytics.ts` (create this file).
    *   **Endpoints:**
        *   `GET /v1/analytics/stats?project_id=...` (aggregates: total_requests, total_cost, avg_latency)
        *   `GET /v1/analytics/timeseries?project_id=...&period=1h` (time-series data for charts)
        *   `GET /v1/analytics/logs?project_id=...&limit=100` (recent events list)
        *   `GET /v1/analytics/event/:eventId` (detailed event view with tool calls)
    *   **Logic:** Query ClickHouse using HTTP interface, return JSON.
    *   **Deliverable:** New analytics routes mounted in `worker/src/index.ts`.
    *   **Implementation Notes:**
        *   Created comprehensive analytics handler with 4 endpoints
        *   Includes API key validation and project access control
        *   Supports filtering by status, model, run_id
        *   Implements pagination for logs endpoint
        *   Calculates top models by usage
        *   Time-series with configurable periods (1h, 6h, 24h, 7d, 30d)
    *   **Verification:** Test endpoints with curl.
        ```bash
        curl http://localhost:8787/v1/analytics/stats?project_id=test \
          -H "Authorization: Bearer YOUR_API_KEY"
        # Expected: JSON response with { total_requests: X, total_cost: Y, ... }
        ```

- [ ] **Task 3.2: Materialized Views (Optional/Performance)**
    *   **Action:** If queries are slow, create ClickHouse Materialized Views for common aggregations (e.g., `hourly_usage_by_project`).
    *   **Deliverable:** SQL migration files.
    *   **Verification:** Compare query times (optional).

---

## Phase 4: Dashboard Expansion (The "Face")

Update the Next.js dashboard to visualize the new data.

**Status:** Frontend structure ready, needs data integration layer

- [ ] **Task 4.1: Connect to Analytics API** ⏳ *Next Priority*
    *   **Action:** Create a data fetching layer in `dashboard/lib/analytics-api.ts` to talk to the Worker's new Analytics endpoints.
    *   **Deliverable:** Typed fetch functions with error handling and loading states.
    *   **Implementation Notes:**
        *   Create TypeScript interfaces matching Analytics API responses
        *   Implement retry logic for failed requests
        *   Add request/response caching where appropriate
        *   Handle authentication (API key in headers)
    *   **Verification:** Unit test the fetcher.
        ```bash
        npm test dashboard/lib/analytics-api.test.ts
        ```

- [ ] **Task 4.2: "Requests" (Log Explorer) Page**
    *   **Action:** Create `dashboard/app/(dashboard)/dashboard/requests/page.tsx`.
    *   **UI:** Table with columns: timestamp, model, status, latency, cost. Add filters for status/model.
    *   **Deliverable:** Working Log Explorer using data from analytics API.
    *   **Verification:** Manual UI check.
        ```bash
        npm run dev --prefix dashboard
        # Navigate to /dashboard/requests. Verify table loads data.
        ```

- [ ] **Task 4.3: "Trace" Detail View**
    *   **Action:** Create `dashboard/app/(dashboard)/dashboard/requests/[id]/page.tsx`.
    *   **UI:** Show full event details + tool calls in a structured view.
    *   **Deliverable:** Trace detail page.
    *   **Verification:** Manual UI check.
        ```bash
        # Click a row in Requests table. Verify detail view shows correct data.
        ```

- [ ] **Task 4.4: Dashboard Charts**
    *   **Action:** Update `dashboard/app/(dashboard)/dashboard/page.tsx` to use real data from the Analytics API (Recharts).
    *   **Deliverable:** Live charts for Token Usage, Latency, and Errors.
    *   **Verification:** Visual check.
        ```bash
        # Verify charts are not empty and match the data in ClickHouse.
        ```

---

## Phase 5: Advanced Features & Integrations

Add the "Enterprise" features.

- [ ] **Task 5.1: ConfigCat Integration**
    *   **Action:** Add ConfigCat SDK to `dashboard` and `worker`.
    *   **Usage:** Wrap new features (like "Guardian Mode") in feature flags.
    *   **Deliverable:** Feature flag implementation.
    *   **Verification:** Toggle flag in ConfigCat dashboard.
        ```bash
        # Verify feature appears/disappears in UI without redeploy.
        ```

- [ ] **Task 5.2: Datadog & Sentry**
    *   **Action:** Verify Sentry is capturing Worker and Dashboard errors. Add Datadog agent (if using VPS) or integration.
    *   **Deliverable:** Confirmed error reporting.
    *   **Verification:** Trigger a test error.
        ```bash
        # Visit /debug-sentry in dashboard. Check Sentry dashboard for new issue.
        ```

- [ ] **Task 5.3: Billing Gates (Stripe/Whop)**
    *   **Action:** Enforce limits in the Worker based on Plan (cached in Redis).
    *   **Logic:** Check `project_usage` vs `plan_limit` in Redis before processing.
    *   **Deliverable:** Rate limiting/Quota logic in Worker.
    *   **Verification:** Simulate quota exceeded.
        ```bash
        # Manually set usage > limit in Redis.
        # Send request. Expected: 429 Too Many Requests.
        ```

---

## Phase 6: Documentation & Polish

- [ ] **Task 6.1: Update Docs**
    *   **Action:** Update `docs/API.md` and `docs/QUICK_START.md` to reflect the new SDKs and endpoints.
    *   **Deliverable:** Updated documentation.
    *   **Verification:** Review for accuracy.

- [ ] **Task 6.2: Final E2E Test**
    *   **Action:** Run a full flow: Python Script -> Worker -> Queue -> ClickHouse -> Dashboard.
    *   **Deliverable:** Verification of the full loop.
    *   **Verification:** Run the "Golden Path" script.
        ```bash
        node scripts/golden-path-test.js
        # Should output: "Success: Event logged, processed, and visible in API."
        ```