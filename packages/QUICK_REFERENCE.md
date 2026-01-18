# WatchLLM SDK - Quick Reference

> Fast lookup guide for common SDK operations

---

## 📦 Installation

### Node.js
```bash
npm install watchllm-sdk-node
```

### Python
```bash
pip install watchllm
```

---

## ⚡ Basic Setup

### Node.js
```typescript
import { WatchLLMClient, Status } from 'watchllm-sdk-node';

const watchllm = new WatchLLMClient({
  apiKey: 'your-api-key',
  projectId: 'your-project-id'
});
```

### Python
```python
from watchllm import WatchLLMClient, Status

watchllm = WatchLLMClient(
    api_key='your-api-key',
    project_id='your-project-id'
)
```

---

## 🎯 Common Operations

### Log Prompt Call

**Node.js**
```typescript
watchllm.logPromptCall({
  runId: 'run-1',
  prompt: 'What is AI?',
  model: 'gpt-4o',
  response: 'AI is...',
  tokensInput: 10,
  tokensOutput: 50,
  latencyMs: 2000,
  status: Status.SUCCESS,
  tags: ['ai', 'general']
});
```

**Python**
```python
watchllm.log_prompt_call(
    run_id='run-1',
    prompt='What is AI?',
    model='gpt-4o',
    response='AI is...',
    tokens_input=10,
    tokens_output=50,
    latency_ms=2000,
    status=Status.SUCCESS,
    tags=['ai', 'general']
)
```

---

### Log Agent Step

**Node.js**
```typescript
watchllm.logAgentStep({
  runId: 'run-1',
  stepNumber: 1,
  stepName: 'Research',
  stepType: StepType.REASONING,
  inputData: { query: 'topic' },
  outputData: { findings: [...] },
  latencyMs: 5000,
  status: Status.SUCCESS
});
```

**Python**
```python
watchllm.log_agent_step(
    run_id='run-1',
    step_number=1,
    step_name='Research',
    step_type=StepType.REASONING,
    input_data={'query': 'topic'},
    output_data={'findings': [...]},
    latency_ms=5000,
    status=Status.SUCCESS
)
```

---

### Log Error

**Node.js**
```typescript
try {
  // operation
} catch (error) {
  watchllm.logError({
    runId: 'run-1',
    error: error as Error,
    context: { operation: 'name' }
  });
}
```

**Python**
```python
try:
    # operation
except Exception as e:
    watchllm.log_error(
        run_id='run-1',
        error=e,
        context={'operation': 'name'}
    )
```

---

## 🔄 Lifecycle

### Flush Events

**Node.js**
```typescript
await watchllm.flush();
```

**Python**
```python
watchllm.flush()
```

---

### Graceful Shutdown

**Node.js**
```typescript
await watchllm.close();
```

**Python (Manual)**
```python
watchllm.close()
```

**Python (Context Manager - Recommended)**
```python
with WatchLLMClient(api_key='...', project_id='...') as watchllm:
    watchllm.log_prompt_call(...)
```

---

## 📊 Event Types

```typescript
// Node.js
import { EventType, Status, StepType, Severity } from 'watchllm-sdk-node';

EventType.PROMPT_CALL              // LLM call
EventType.AGENT_STEP               // Agent step
EventType.ERROR                    // Error
EventType.ASSERTION_FAILED         // Assertion failure
EventType.HALLUCINATION_DETECTED   // Hallucination
EventType.PERFORMANCE_ALERT        // Performance issue

Status.SUCCESS
Status.ERROR
Status.TIMEOUT
Status.ASSERTION_FAILED
Status.WARNING

StepType.REASONING
StepType.TOOL_CALL
StepType.VALIDATION
StepType.OUTPUT

Severity.LOW
Severity.MEDIUM
Severity.HIGH
Severity.CRITICAL
```

```python
# Python
from watchllm import EventType, Status, StepType, Severity

EventType.PROMPT_CALL              # LLM call
EventType.AGENT_STEP               # Agent step
EventType.ERROR                    # Error
EventType.ASSERTION_FAILED         # Assertion failure
EventType.HALLUCINATION_DETECTED   # Hallucination
EventType.PERFORMANCE_ALERT        # Performance issue

Status.SUCCESS
Status.ERROR
Status.TIMEOUT
Status.ASSERTION_FAILED
Status.WARNING

StepType.REASONING
StepType.TOOL_CALL
StepType.VALIDATION
StepType.OUTPUT

Severity.LOW
Severity.MEDIUM
Severity.HIGH
Severity.CRITICAL
```

---

## ⚙️ Configuration

```typescript
// Node.js - all options
new WatchLLMClient({
  apiKey: string,                    // Required
  projectId: string,                 // Required
  baseUrl?: string,                  // Default: 'https://proxy.watchllm.dev/v1'
  environment?: string,              // Default: 'development'
  sampleRate?: number,               // Default: 1.0 (0-1)
  redactPII?: boolean,               // Default: true
  batchSize?: number,                // Default: 10
  flushIntervalSeconds?: number,     // Default: 5
  timeout?: number,                  // Default: 30000 (ms)
})
```

```python
# Python - all options
WatchLLMClient(
    api_key: str,                          # Required
    project_id: str,                       # Required
    base_url: str = 'https://...',        # Default: production endpoint
    environment: str = 'development',      # Default: 'development'
    sample_rate: float = 1.0,             # Default: 1.0 (0-1)
    redact_pii: bool = True,              # Default: True
    batch_size: int = 10,                 # Default: 10
    flush_interval_seconds: int = 5,      # Default: 5
    timeout: int = 30                     # Default: 30 (seconds)
)
```

---

## 🔗 OpenAI Integration

**Node.js**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }]
});

watchllm.logPromptCall({
  runId,
  prompt,
  model: 'gpt-4o',
  response: response.choices[0].message.content,
  tokensInput: response.usage?.prompt_tokens || 0,
  tokensOutput: response.usage?.completion_tokens || 0,
  latencyMs: Date.now() - start,
  status: Status.SUCCESS
});
```

**Python**
```python
import openai

response = openai.ChatCompletion.create(
    model='gpt-4o',
    messages=[{'role': 'user', 'content': prompt}]
)

watchllm.log_prompt_call(
    run_id=run_id,
    prompt=prompt,
    model='gpt-4o',
    response=response.choices[0].message.content,
    tokens_input=response.usage.prompt_tokens,
    tokens_output=response.usage.completion_tokens,
    latency_ms=int((time.time() - start) * 1000),
    status=Status.SUCCESS
)
```

---

## 🌐 Framework Integration

### Express.js (Node.js)
```typescript
import express from 'express';
import { WatchLLMClient } from 'watchllm-sdk-node';

const app = express();
const watchllm = new WatchLLMClient({...});

app.post('/api/chat', async (req, res) => {
  const runId = `run-${Date.now()}`;
  try {
    const response = await callLLM(req.body.prompt);
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

### FastAPI (Python)
```python
from fastapi import FastAPI, Request
from watchllm import WatchLLMClient

app = FastAPI()
watchllm = WatchLLMClient(...)

@app.post("/api/chat")
async def chat(request: Request):
    run_id = f"run-{int(time.time())}"
    try:
        body = await request.json()
        response = await call_llm(body["prompt"])
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

## 💡 Best Practices

### 1. Use Consistent Run IDs
```typescript
// Node.js
const runId = `workflow-${Date.now()}`;
watchllm.logPromptCall({ runId, ... });
watchllm.logAgentStep({ runId, ... });
```

```python
# Python
run_id = f"workflow-{int(time.time())}"
watchllm.log_prompt_call(run_id=run_id, ...)
watchllm.log_agent_step(run_id=run_id, ...)
```

### 2. Tag Events
```typescript
// Node.js
watchllm.logPromptCall({
  tags: ['customer-support', 'urgent', 'gpt-4'],
  ...
});
```

```python
# Python
watchllm.log_prompt_call(
    tags=['customer-support', 'urgent', 'gpt-4'],
    ...
)
```

### 3. Include User Context
```typescript
// Node.js
watchllm.logPromptCall({
  userId: request.user.id,
  ...
});
```

```python
# Python
watchllm.log_prompt_call(
    user_id=request.user.id,
    ...
)
```

### 4. Release Tracking
```typescript
// Node.js
watchllm.logPromptCall({
  release: '1.2.3',
  ...
});
```

```python
# Python
watchllm.log_prompt_call(
    release='1.2.3',
    ...
)
```

### 5. High-Volume Sampling
```typescript
// Node.js - Log only 10% of events
new WatchLLMClient({
  sampleRate: 0.1,
  ...
});
```

```python
# Python - Log only 10% of events
WatchLLMClient(
    sample_rate=0.1,
    ...
)
```

---

## 🚨 Error Scenarios

### API Key Not Set
```bash
# Error: "apiKey is required"
# Solution: Set WATCHLLM_API_KEY environment variable
export WATCHLLM_API_KEY="your-key"
```

### Project ID Not Set
```bash
# Error: "projectId is required"
# Solution: Set WATCHLLM_PROJECT_ID environment variable
export WATCHLLM_PROJECT_ID="your-project"
```

### Events Not Being Sent
```typescript
// Solution 1: Ensure close() is called
process.on('SIGTERM', async () => {
  await watchllm.close();
  process.exit(0);
});

// Solution 2: Manual flush before critical operations
await watchllm.flush();
```

### Network Timeout
```typescript
// Increase timeout (in milliseconds)
new WatchLLMClient({
  timeout: 60000,  // 60 seconds
  ...
});
```

```python
# Increase timeout (in seconds)
WatchLLMClient(
    timeout=60,  # 60 seconds
    ...
)
```

---

## 📈 Performance Tuning

### Low-Volume Apps
```typescript
// Node.js
new WatchLLMClient({
  batchSize: 5,
  flushIntervalSeconds: 30,
  ...
});
```

```python
# Python
WatchLLMClient(
    batch_size=5,
    flush_interval_seconds=30,
    ...
)
```

### High-Volume Apps
```typescript
// Node.js
new WatchLLMClient({
  batchSize: 100,
  flushIntervalSeconds: 10,
  sampleRate: 0.1,
  ...
});
```

```python
# Python
WatchLLMClient(
    batch_size=100,
    flush_interval_seconds=10,
    sample_rate=0.1,
    ...
)
```

---

## 🔐 Security Checklist

- [ ] Never hardcode API keys
- [ ] Use environment variables
- [ ] Enable PII redaction (default: on)
- [ ] Use HTTPS endpoints (default)
- [ ] Rotate API keys periodically
- [ ] Restrict API key permissions
- [ ] Monitor access logs

---

## 📚 Documentation Links

- **Node.js Full Docs**: [sdk-node/DOCUMENTATION.md](sdk-node/DOCUMENTATION.md)
- **Python Full Docs**: [sdk-python/DOCUMENTATION.md](sdk-python/DOCUMENTATION.md)
- **SDK Comparison**: [SDK_COMPARISON.md](SDK_COMPARISON.md)
- **Type Reference**: [TYPE_REFERENCE.md](TYPE_REFERENCE.md)
- **Main README**: [README.md](README.md)

---

## 🤝 Support

- **GitHub Issues**: https://github.com/watchllm/watchllm/issues
- **Email**: support@watchllm.dev
- **Website**: https://watchllm.dev

---

**Quick Tip**: Bookmark this page for fast lookup during development!
