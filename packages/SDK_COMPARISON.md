# WatchLLM SDK Comparison Guide

## Overview

This guide compares the WatchLLM Node.js and Python SDKs, helping you choose the right implementation for your project and understand the differences in API design and usage patterns.

---

## Language-Specific Syntax

### Initialization

#### Node.js / TypeScript

```typescript
import { WatchLLMClient } from 'watchllm-sdk-node';

const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
  environment: 'production',
  batchSize: 10,
  flushIntervalSeconds: 5,
});
```

#### Python

```python
from watchllm import WatchLLMClient

watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID"),
    environment="production",
    batch_size=10,
    flush_interval_seconds=5
)
```

**Key Differences:**
- Node.js uses object parameter syntax
- Python uses keyword arguments
- Python supports context manager protocol (`with` statement)

---

### Logging Prompt Calls

#### Node.js / TypeScript

```typescript
const eventId = watchllm.logPromptCall({
  runId: 'run-123',
  prompt: 'What is AI?',
  model: 'gpt-4o',
  response: 'AI is...',
  tokensInput: 12,
  tokensOutput: 45,
  latencyMs: 1250,
  status: Status.SUCCESS,
  tags: ['ai', 'general-knowledge'],
});
```

#### Python

```python
event_id = watchllm.log_prompt_call(
    run_id='run-123',
    prompt='What is AI?',
    model='gpt-4o',
    response='AI is...',
    tokens_input=12,
    tokens_output=45,
    latency_ms=1250,
    status=Status.SUCCESS,
    tags=['ai', 'general-knowledge']
)
```

**Key Differences:**
- Node.js: camelCase parameter names (tokensInput, latencyMs)
- Python: snake_case parameter names (tokens_input, latency_ms)
- Return type: both return event ID string

---

### Logging Agent Steps

#### Node.js / TypeScript

```typescript
const stepId = watchllm.logAgentStep({
  runId: 'run-456',
  stepNumber: 1,
  stepName: 'Research Phase',
  stepType: StepType.REASONING,
  inputData: { query: 'climate change' },
  outputData: { findings: [...] },
  latencyMs: 5000,
  status: Status.SUCCESS,
  reasoning: 'Compiled research from multiple sources',
});
```

#### Python

```python
step_id = watchllm.log_agent_step(
    run_id='run-456',
    step_number=1,
    step_name='Research Phase',
    step_type=StepType.REASONING,
    input_data={'query': 'climate change'},
    output_data={'findings': [...]},
    latency_ms=5000,
    status=Status.SUCCESS,
    reasoning='Compiled research from multiple sources'
)
```

**Key Differences:**
- Parameter naming follows language conventions
- Both support same enums (StepType, Status)
- Identical event structure

---

### Error Logging

#### Node.js / TypeScript

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  watchllm.logError({
    runId: 'run-123',
    error: error as Error,
    context: { operation: 'someAsyncOperation' },
    tags: ['error'],
  });
}
```

#### Python

```python
try:
    some_operation()
except Exception as e:
    watchllm.log_error(
        run_id='run-123',
        error=e,
        context={'operation': 'some_operation'},
        tags=['error']
    )
```

**Key Differences:**
- Node.js requires type assertion for Error objects
- Python handles both Exception and dict types
- Both support rich error context

---

## Async/Await Handling

### Node.js / TypeScript

The Node.js SDK uses **async/await** for non-blocking operations:

```typescript
// Flushing is async
await watchllm.flush();

// Graceful shutdown is async
await watchllm.close();

// In Express middleware
app.post('/api/chat', async (req, res) => {
  // Async operations
  const response = await callLLM();
  watchllm.logPromptCall({...});
  
  // Flush before response (optional)
  await watchllm.flush();
  res.json(response);
});
```

### Python

The Python SDK uses **synchronous** and **threaded** approaches:

```python
# Flushing is synchronous
watchllm.flush()

# Graceful shutdown is synchronous
watchllm.close()

# Context manager for automatic cleanup
with WatchLLMClient(...) as watchllm:
    response = call_llm()
    watchllm.log_prompt_call(...)
    # Automatic cleanup on exit

# In FastAPI (can use async endpoints)
@app.post("/api/chat")
async def chat(request: Request):
    response = await call_llm()
    watchllm.log_prompt_call(...)  # Safe in async context
    return response
```

**Key Differences:**
- Node.js: async/await first, always must await flush/close
- Python: synchronous operations with threading for batch flushing
- Python: context manager support for automatic cleanup

---

## Event Type Enums

Both SDKs support the same event types:

| Type | Node.js | Python | Purpose |
|------|---------|--------|---------|
| Prompt Call | `EventType.PROMPT_CALL` | `EventType.PROMPT_CALL` | LLM API calls |
| Agent Step | `EventType.AGENT_STEP` | `EventType.AGENT_STEP` | Workflow steps |
| Error | `EventType.ERROR` | `EventType.ERROR` | Exception logging |
| Assertion Failed | `EventType.ASSERTION_FAILED` | `EventType.ASSERTION_FAILED` | Validation errors |
| Hallucination Detected | `EventType.HALLUCINATION_DETECTED` | `EventType.HALLUCINATION_DETECTED` | Model hallucinations |
| Performance Alert | `EventType.PERFORMANCE_ALERT` | `EventType.PERFORMANCE_ALERT` | Performance issues |

---

## Configuration Comparison

### Naming Convention

| Node.js | Python | Purpose |
|---------|--------|---------|
| `apiKey` | `api_key` | API authentication |
| `projectId` | `project_id` | Project identification |
| `baseUrl` | `base_url` | API endpoint |
| `environment` | `environment` | Deployment environment |
| `sampleRate` | `sample_rate` | Event sampling (0-1) |
| `redactPII` | `redact_pii` | PII redaction toggle |
| `batchSize` | `batch_size` | Events per batch |
| `flushIntervalSeconds` | `flush_interval_seconds` | Flush interval (seconds) |

### Default Values

All defaults are identical across SDKs:

| Parameter | Default |
|-----------|---------|
| `baseUrl` | `https://proxy.watchllm.dev/v1` |
| `environment` | `development` |
| `sampleRate` | `1.0` (100%) |
| `redactPII` | `true` |
| `batchSize` | `10` |
| `flushIntervalSeconds` | `5` |
| `timeout` | `30000` (ms) / `30` (seconds) |

---

## PII Redaction

Both SDKs support identical PII redaction:

### Redacted Patterns

1. **Email addresses**: `user@example.com` → `[REDACTED_EMAIL]`
2. **Credit card numbers**: `1234-5678-9012-3456` → `[REDACTED_CC]`

### Implementation

#### Node.js / TypeScript

```typescript
// Automatic (enabled by default)
const watchllm = new WatchLLMClient({
  apiKey: 'xxx',
  projectId: 'xxx',
  redactPII: true,  // Default
});

// Manual redaction
import * as crypto from 'crypto';
const hash = crypto.createHash('sha256').update(sensitiveData).digest('hex');
```

#### Python

```python
# Automatic (enabled by default)
watchllm = WatchLLMClient(
    api_key='xxx',
    project_id='xxx',
    redact_pii=True  # Default
)

# Manual redaction
import hashlib
hash = hashlib.sha256(sensitive_data.encode()).hexdigest()
```

---

## Batch Configuration

Both SDKs support intelligent batching:

### Event Batching Logic

| Trigger | Behavior |
|---------|----------|
| Batch size reached | Immediate flush |
| Flush interval elapses | Automatic flush |
| Manual `flush()` call | Explicit flush |
| `close()` / `__exit__()` | Final flush |
| Process signal (SIGTERM) | Best-effort final flush |

### Tuning for Your Use Case

**Low Volume (< 100 events/day):**
```typescript
// Node.js
const watchllm = new WatchLLMClient({
  batchSize: 5,
  flushIntervalSeconds: 30,
});

// Python
watchllm = WatchLLMClient(
    batch_size=5,
    flush_interval_seconds=30
)
```

**High Volume (> 10,000 events/day):**
```typescript
// Node.js
const watchllm = new WatchLLMClient({
  batchSize: 100,
  flushIntervalSeconds: 10,
  sampleRate: 0.1,  // Log 10% of events
});

// Python
watchllm = WatchLLMClient(
    batch_size=100,
    flush_interval_seconds=10,
    sample_rate=0.1  # Log 10% of events
)
```

---

## Integration Patterns

### OpenAI Integration

#### Node.js

```typescript
import OpenAI from 'openai';
import { WatchLLMClient } from 'watchllm-sdk-node';

const openai = new OpenAI();
const watchllm = new WatchLLMClient({...});

async function chat(prompt: string) {
  const start = Date.now();
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
  });
  
  watchllm.logPromptCall({
    runId: `run-${Date.now()}`,
    prompt,
    model: 'gpt-4o',
    response: response.choices[0].message.content || '',
    tokensInput: response.usage?.prompt_tokens || 0,
    tokensOutput: response.usage?.completion_tokens || 0,
    latencyMs: Date.now() - start,
  });
}
```

#### Python

```python
import openai
import time
from watchllm import WatchLLMClient

openai.api_key = os.getenv("OPENAI_API_KEY")
watchllm = WatchLLMClient(...)

def chat(prompt: str):
    start = time.time()
    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}]
    )
    
    watchllm.log_prompt_call(
        run_id=f"run-{int(time.time())}",
        prompt=prompt,
        model="gpt-4o",
        response=response.choices[0].message.content,
        tokens_input=response.usage.prompt_tokens,
        tokens_output=response.usage.completion_tokens,
        latency_ms=int((time.time() - start) * 1000)
    )
```

### Framework Integration

#### Express.js (Node.js)

```typescript
import express from 'express';
import { WatchLLMClient } from 'watchllm-sdk-node';

const app = express();
const watchllm = new WatchLLMClient({...});

app.post('/api/chat', async (req, res) => {
  const runId = req.headers['x-run-id'] || `run-${Date.now()}`;
  try {
    const response = await processRequest(req.body);
    watchllm.logPromptCall({...});
    res.json(response);
  } catch (error) {
    watchllm.logError({...});
    res.status(500).json({error: error.message});
  }
});

process.on('SIGTERM', async () => {
  await watchllm.close();
  process.exit(0);
});
```

#### FastAPI (Python)

```python
from fastapi import FastAPI, Request
from watchllm import WatchLLMClient

app = FastAPI()
watchllm = WatchLLMClient(...)

@app.post("/api/chat")
async def chat(request: Request):
    run_id = request.headers.get("x-run-id") or f"run-{int(time.time())}"
    try:
        response = await process_request(await request.json())
        watchllm.log_prompt_call(...)
        return response
    except Exception as e:
        watchllm.log_error(...)
        return {"error": str(e)}, 500

@app.on_event("shutdown")
async def shutdown():
    watchllm.close()
```

---

## Performance Characteristics

### Memory Usage

- **Node.js**: ~10-20 MB baseline + event queue
- **Python**: ~15-25 MB baseline + event queue (threaded flush)

Both scale linearly with batch size and queue depth.

### Latency

- **Node.js**: <1ms to queue event, async flush doesn't block
- **Python**: <1ms to queue event, thread handles flushing

### Network Efficiency

Both SDKs batch events identically:
- Single event: HTTP POST to `/v1/events/batch`
- Batch: Multiple events in single request
- Automatic retry with exponential backoff (Python)

---

## Feature Matrix

| Feature | Node.js | Python |
|---------|---------|--------|
| Prompt call logging | ✅ | ✅ |
| Agent step logging | ✅ | ✅ |
| Error logging | ✅ | ✅ |
| Automatic batching | ✅ | ✅ |
| PII redaction | ✅ | ✅ |
| Event sampling | ✅ | ✅ |
| Manual flush | ✅ | ✅ |
| Graceful shutdown | ✅ | ✅ |
| Context manager | ❌ | ✅ |
| Async/await first | ✅ | ✅* |
| Automatic retry | ❌ | ✅ |
| Type safety | ✅ (TypeScript) | ✅ (type hints) |

*Python SDK is thread-safe but uses synchronous API with background flushing.

---

## Migration Guide

### From Node.js to Python

```typescript
// Node.js
const eventId = watchllm.logPromptCall({
  runId: 'run-123',
  prompt: 'Test',
  model: 'gpt-4o',
  response: 'Response',
  tokensInput: 10,
  tokensOutput: 20,
  latencyMs: 1000,
});
```

```python
# Python equivalent
event_id = watchllm.log_prompt_call(
    run_id='run-123',
    prompt='Test',
    model='gpt-4o',
    response='Response',
    tokens_input=10,
    tokens_output=20,
    latency_ms=1000
)
```

### From Python to Node.js

```python
# Python
event_id = watchllm.log_agent_step(
    run_id='run-456',
    step_number=1,
    step_name='Step 1',
    step_type='reasoning',
    input_data={},
    output_data={},
    latency_ms=500
)
```

```typescript
// Node.js equivalent
const eventId = watchllm.logAgentStep({
  runId: 'run-456',
  stepNumber: 1,
  stepName: 'Step 1',
  stepType: 'reasoning',
  inputData: {},
  outputData: {},
  latencyMs: 500,
});
```

---

## Recommendation Matrix

### Choose Node.js SDK if you:
- ✅ Building with Node.js / TypeScript
- ✅ Need tight integration with Express.js, Fastify, etc.
- ✅ Prefer async/await patterns
- ✅ Want TypeScript type safety
- ✅ Building serverless functions (AWS Lambda, Vercel)

### Choose Python SDK if you:
- ✅ Building with Python / FastAPI / Django
- ✅ Need automatic retry with backoff
- ✅ Prefer context manager patterns
- ✅ Working with data science / ML pipelines
- ✅ Using Langchain, LlamaIndex, or similar

---

## Troubleshooting Across SDKs

### Common Issue: Events Not Appearing

**Node.js:**
```typescript
// Ensure close() is called
process.on('SIGTERM', async () => {
  await watchllm.close();
  process.exit(0);
});
```

**Python:**
```python
# Ensure close() is called
try:
    # your code
finally:
    watchllm.close()
```

### Common Issue: High CPU Usage

**Both SDKs:**
- Reduce `sampleRate` if event volume is high
- Increase `flushIntervalSeconds` for less frequent flushing
- Increase `batchSize` to accumulate more events per batch

---

## Support

- **Node.js SDK**: https://github.com/watchllm/watchllm/tree/main/packages/sdk-node
- **Python SDK**: https://github.com/watchllm/watchllm/tree/main/packages/sdk-python
- **Issues**: https://github.com/watchllm/watchllm/issues
- **Email**: support@watchllm.dev

