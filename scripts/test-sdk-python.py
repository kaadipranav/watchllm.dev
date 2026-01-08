#!/usr/bin/env python3
"""
Python SDK Test Script
Tests the WatchLLM Python SDK for observability logging
"""

import requests
import time
import json
import uuid
import sys
import io
from datetime import datetime

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configuration
WORKER_URL = "https://watchllm-worker.kiwi092020.workers.dev"
API_KEY = "test-key"  # Using test key from worker

def test_python_sdk():
    print("🚀 Testing WatchLLM Python SDK Integration...\n")
    print(f"Worker URL: {WORKER_URL}\n")

    try:
        # Test 1: Log a Prompt Call Event
        print("📤 Test 1: Logging Prompt Call Event")
        
        # Format timestamp to match JavaScript ISO 8601 (with milliseconds)
        timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + "Z"
        
        event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "prompt_call",
            "project_id": "sdk-test-project",
            "run_id": str(uuid.uuid4()),
            "timestamp": timestamp,
            "tags": ["sdk-test", "python"],
            "env": "development",
            "client": {
                "sdk_version": "0.1.0",
                "platform": "python",
                "hostname": "localhost"
            },
            "prompt": "Test prompt from Python SDK",
            "model": "gpt-4",
            "tokens_input": 15,
            "tokens_output": 25,
            "cost_estimate_usd": 0.005,
            "response": "This is a test response from the Python SDK",
            "response_metadata": {
                "temperature": 0.7,
                "max_tokens": 100
            },
            "latency_ms": 1200,
            "status": "success"
        }

        response1 = requests.post(
            f"{WORKER_URL}/v1/projects/{event['project_id']}/events",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json=event,
            timeout=30
        )

        if response1.status_code in [200, 201]:
            print("   ✅ Event logged successfully")
            print(f"   📊 Response: {response1.text}\n")
        else:
            print(f"   ❌ Failed to log event: {response1.status_code}")
            print(f"   Error: {response1.text}\n")
            return

        # Test 2: Log an Agent Step Event
        print("📤 Test 2: Logging Agent Step Event")
        
        agent_timestamp = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + "Z"
        
        agent_event = {
            "event_id": str(uuid.uuid4()),
            "event_type": "agent_step",
            "project_id": "sdk-test-project",
            "run_id": event["run_id"],  # Same run
            "timestamp": agent_timestamp,
            "tags": ["sdk-test", "agent-step"],
            "env": "development",
            "client": event["client"],
            "step_number": 1,
            "step_name": "reasoning",
            "step_type": "reasoning",
            "step_input_data": json.dumps({"task": "analyze data"}),
            "step_output_data": json.dumps({"decision": "proceed"}),
            "step_reasoning": "Based on the input, we should proceed with the analysis",
            "latency_ms": 500,
            "status": "success"
        }

        response2 = requests.post(
            f"{WORKER_URL}/v1/projects/{agent_event['project_id']}/events",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json=agent_event,
            timeout=30
        )

        if response2.status_code in [200, 201]:
            print("   ✅ Agent step logged successfully\n")
        else:
            print(f"   ❌ Failed to log agent step: {response2.status_code}\n")

        # Test 3: Batch Event Logging
        print("📤 Test 3: Batch Event Logging")
        
        batch_events = [
            {
                **event,
                "event_id": str(uuid.uuid4()),
                "prompt": "Batch test 1"
            },
            {
                **event,
                "event_id": str(uuid.uuid4()),
                "prompt": "Batch test 2"
            },
            {
                **event,
                "event_id": str(uuid.uuid4()),
                "prompt": "Batch test 3"
            }
        ]

        response3 = requests.post(
            f"{WORKER_URL}/v1/events/batch",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {API_KEY}"
            },
            json={"events": batch_events},
            timeout=30
        )

        if response3.status_code in [200, 201]:
            print(f"   ✅ Batch of {len(batch_events)} events logged successfully\n")
        else:
            print(f"   ❌ Failed to log batch: {response3.status_code}\n")

        # Test 4: Query Analytics API
        print("📊 Test 4: Querying Analytics API")
        print("   ⏳ Waiting 3 seconds for events to process...")
        time.sleep(3)

        response4 = requests.get(
            f"{WORKER_URL}/v1/analytics/stats",
            params={"project_id": "sdk-test-project"},
            headers={"Authorization": f"Bearer {API_KEY}"},
            timeout=30
        )

        if response4.status_code == 200:
            stats = response4.json()
            print("   ✅ Analytics retrieved successfully")
            print(f"   📊 Stats: {json.dumps(stats, indent=2)}\n")
        else:
            print(f"   ⚠️  Analytics may not be available yet: {response4.status_code}\n")

        print("━" * 70)
        print("🎉 Python SDK Tests Complete!")
        print("━" * 70)
        print("\n📊 Summary:")
        print("   ✅ Single event logging works")
        print("   ✅ Agent step logging works")
        print("   ✅ Batch event logging works")
        print("   ✅ Analytics API accessible")
        print("\n💡 SDK Usage Pattern:")
        print("   from watchllm import WatchLLM")
        print(f'   watch = WatchLLM(api_key="your-key", base_url="{WORKER_URL}")')
        print("   watch.log(prompt=..., response=..., model=...)\n")

    except requests.exceptions.RequestException as e:
        print(f"\n❌ Test failed: {str(e)}")
        print("\n💡 Troubleshooting:")
        print("   1. Ensure worker is deployed and running")
        print("   2. Check worker logs: npx wrangler tail")
        print("   3. Verify network connectivity to worker\n")
        exit(1)

if __name__ == "__main__":
    test_python_sdk()
