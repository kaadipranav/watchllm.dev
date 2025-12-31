# Task 1.6: End-to-End Verification Guide

## ✅ What We've Built

We have successfully implemented the high-volume data pipeline foundation:

1.  **ClickHouse Schema (`Task 1.2`)**: Optimized tables for events, tool calls, and agent steps.
2.  **Cloudflare Queues (`Task 1.3`)**: Configured queues for async ingestion.
3.  **Producer (`Task 1.4`)**: API endpoints now send events to the queue asynchronously.
4.  **Consumer (`Task 1.5`)**: Worker processes queue batches and inserts into ClickHouse.

## 🚀 How to Verify End-to-End

To verify the full pipeline, we need to send an event to the API and check if it appears in ClickHouse.

### 1. Prerequisites

- [ ] ClickHouse Droplet is running on DigitalOcean.
- [ ] You have updated `worker/.dev.vars` with your ClickHouse credentials.
- [ ] You are running the schema creation script: `node scripts/create-schema.js`.

### 2. Start Local Worker

Since Cloudflare Queues work locally with Wrangler, you can run the full stack on your machine.

```bash
cd worker
npm run dev
```

*Note: If you see "access violation" errors on Windows, try running in WSL or deploying to a Cloudflare Workers development environment (`npm run dev:remote`).*

### 3. Send a Test Event

Open a new terminal and send a request to the local API:

```bash
curl -X POST http://localhost:8787/v1/projects/proj-test/events \
  -H "Authorization: Bearer lgw_test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "verify-e2e-001",
    "event_type": "prompt_call",
    "project_id": "proj-test",
    "run_id": "run-verify-1",
    "timestamp": "2024-01-01T12:00:00Z",
    "tags": ["e2e-test"],
    "env": "development",
    "client": { "sdk_version": "1.0.0" },
    "prompt": "Hello via Queue!",
    "model": "gpt-4",
    "tokens_input": 15,
    "tokens_output": 25,
    "cost_estimate_usd": 0.002,
    "response": "Hello received.",
    "status": "success",
    "latency_ms": 120
  }'
```

**Expected Response:**
```json
{ "success": true, "event_id": "verify-e2e-001" }
```

**Check Worker Logs:**
You should see:
```
Queued event verify-e2e-001 for ingestion
Processing batch of 1 events for ClickHouse ingestion
Successfully ingested 1 events
```

### 4. Verify in ClickHouse

Run a query to confirm the data landed in the database:

```bash
# Option A: Use the verification script
node scripts/check-tables.js
# (It shows row counts - check if 'events' table has rows)

# Option B: Manual Query via SSH
ssh root@YOUR_DROPLET_IP
clickhouse-client --query "SELECT * FROM watchllm.events WHERE event_id = 'verify-e2e-001' FORMAT Vertical"
```

**Expected Output (Option B):**
```
Row 1:
──────
event_id:          verify-e2e-001
project_id:        proj-test
event_type:        prompt_call
prompt:            Hello via Queue!
model:             gpt-4
...
```

## 🛠️ Troubleshooting

- **Queue Binding Missing locally**: Ensure `wrangler.toml` has `[[queues]]` config.
- **ClickHouse Connection Failed**: Check the Worker logs for connection errors. Ensure your IP is whitelisted or firewall allows 8123.
- **Access Violation on Windows**: This is a known issue with Wrangler local dev on Windows.
    - **Workaround:** Run `npm run dev:remote` to use Cloudflare's infrastructure (requires actual Queue creation in Cloudflare dashboard via `npx wrangler queues create watchllm-observability-events`).

## 🎉 Done!

Once verified, you have a working high-scale ingestion pipeline. Proceed to **Phase 2: SDK & Ingestion Hardening**.
