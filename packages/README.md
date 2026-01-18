# WatchLLM SDK Documentation

Welcome to the WatchLLM SDK documentation. This folder contains comprehensive guides for both the Node.js and Python SDKs.

## 📚 Documentation Index

### SDK-Specific Guides

- **[Node.js SDK Documentation](sdk-node/DOCUMENTATION.md)** - Complete guide for TypeScript/Node.js SDK
  - Installation and setup
  - Configuration options
  - Event logging methods with examples
  - Framework integrations (Express.js, Fastify)
  - Best practices and troubleshooting

- **[Python SDK Documentation](sdk-python/DOCUMENTATION.md)** - Complete guide for Python SDK
  - Installation and setup
  - Configuration options
  - Event logging methods with examples
  - Framework integrations (FastAPI, Django)
  - Best practices and troubleshooting

### Cross-SDK Resources

- **[SDK Comparison Guide](SDK_COMPARISON.md)** - Compare Node.js and Python SDKs
  - Language-specific syntax differences
  - Feature matrix
  - Migration guide between SDKs
  - Integration pattern examples
  - Performance characteristics

- **[Type Reference](TYPE_REFERENCE.md)** - Complete type definitions
  - All enums (EventType, Status, StepType, etc.)
  - Event interfaces and data structures
  - Method signatures and parameters
  - Type compatibility matrix
  - Pricing calculation reference

---

## 🚀 Quick Start

### Node.js / TypeScript

```typescript
import { WatchLLMClient, Status } from 'watchllm-sdk-node';

const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
});

// Log a prompt call
watchllm.logPromptCall({
  runId: 'run-123',
  prompt: 'What is AI?',
  model: 'gpt-4o',
  response: 'AI is...',
  tokensInput: 12,
  tokensOutput: 45,
  latencyMs: 1250,
  status: Status.SUCCESS,
});

// Always close gracefully
await watchllm.close();
```

### Python

```python
from watchllm import WatchLLMClient, Status

watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id"
)

# Log a prompt call
event_id = watchllm.log_prompt_call(
    run_id="run-123",
    prompt="What is AI?",
    model="gpt-4o",
    response="AI is...",
    tokens_input=12,
    tokens_output=45,
    latency_ms=1250,
    status=Status.SUCCESS
)

# Always close gracefully
watchllm.close()
```

---

## 📖 Common Use Cases

### Logging LLM Calls

Track every interaction with language models:

- **Event Type**: `PROMPT_CALL`
- **Includes**: Prompt, response, tokens, model, latency, cost
- **Use For**: Monitoring costs, analyzing model performance, debugging

**Documentation**: See [PromptCallEvent](TYPE_REFERENCE.md#promptcallevent)

### Logging Agent Steps

Monitor multi-step agent workflows:

- **Event Type**: `AGENT_STEP`
- **Includes**: Step name, type, inputs, outputs, reasoning, latency
- **Use For**: Debugging agent logic, optimizing workflows, understanding decision paths

**Documentation**: See [AgentStepEvent](TYPE_REFERENCE.md#agentstepevnt)

### Error Tracking

Capture and analyze errors:

- **Event Type**: `ERROR`
- **Includes**: Error message, type, stack trace, context
- **Use For**: Bug debugging, error patterns, monitoring reliability

**Documentation**: See [ErrorEvent](TYPE_REFERENCE.md#errorevent)

---

## 🔧 Installation

### Node.js SDK

```bash
npm install watchllm-sdk-node
```

### Python SDK

```bash
pip install watchllm
```

---

## 🌟 Key Features

### ✅ Automatic Batching
Events are automatically batched for efficient API usage:
- Batch size: 10 events (configurable)
- Flush interval: 5 seconds (configurable)
- Manual flush: `await watchllm.flush()` (Node.js) or `watchllm.flush()` (Python)

### ✅ PII Redaction
Sensitive data is automatically redacted:
- Email addresses → `[REDACTED_EMAIL]`
- Credit card numbers → `[REDACTED_CC]`
- Customizable via `redactPII` / `redact_pii` option

### ✅ Event Sampling
Reduce event volume with sampling:
```typescript
sampleRate: 0.1  // Log 10% of events
```

### ✅ Cost Calculation
Automatic cost estimation for LLM calls:
- Supports GPT-4, GPT-3.5, Claude models
- Custom pricing support
- Per-token cost tracking

### ✅ Type Safety
Full type safety in both SDKs:
- TypeScript types for Node.js SDK
- Type hints for Python SDK (3.8+)
- IDE autocomplete support

---

## 📊 Event Types

| Type | Purpose | Use Case |
|------|---------|----------|
| `PROMPT_CALL` | LLM API calls | Monitor model performance |
| `AGENT_STEP` | Workflow steps | Debug agent execution |
| `ERROR` | Exceptions | Track errors |
| `ASSERTION_FAILED` | Validation failures | Monitor quality checks |
| `HALLUCINATION_DETECTED` | Model hallucinations | Detect false information |
| `PERFORMANCE_ALERT` | Performance issues | Trigger alerts on anomalies |

---

## 🔌 Framework Integration

Both SDKs integrate seamlessly with popular frameworks:

### Express.js (Node.js)
```typescript
app.post('/api/chat', async (req, res) => {
  try {
    const response = await callLLM(req.body.prompt);
    watchllm.logPromptCall({...});
    res.json(response);
  } catch (error) {
    watchllm.logError({...});
    res.status(500).json({error: error.message});
  }
});
```

### FastAPI (Python)
```python
@app.post("/api/chat")
async def chat(request: Request):
    try:
        response = await call_llm(await request.json())
        watchllm.log_prompt_call(...)
        return response
    except Exception as e:
        watchllm.log_error(...)
        return {"error": str(e)}, 500
```

---

## ⚙️ Configuration

### Required Settings

| Setting | Description |
|---------|-------------|
| `apiKey` | Your WatchLLM API key |
| `projectId` | Your project ID |

### Optional Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `baseUrl` | `https://proxy.watchllm.dev/v1` | API endpoint |
| `environment` | `development` | Deployment environment |
| `sampleRate` | `1.0` | Event sampling (0-1) |
| `redactPII` | `true` | Enable PII redaction |
| `batchSize` | `10` | Events per batch |
| `flushIntervalSeconds` | `5` | Batch flush interval |
| `timeout` | `30000` / `30` | Request timeout |

---

## 🐛 Troubleshooting

### Events Not Being Sent
1. Verify `apiKey` and `projectId` are correct
2. Ensure `close()` is called before process exit
3. Check network connectivity to API
4. Review error logs

### High Memory Usage
1. Reduce `batchSize`
2. Increase `flushIntervalSeconds`
3. Use `sampleRate` for high-volume applications
4. Monitor queue depth

### Timeout Errors
1. Increase `timeout` setting
2. Check network latency
3. Verify API key permissions
4. Reduce payload size

**Full Troubleshooting**: See SDK-specific documentation

---

## 🔐 Security Best Practices

1. **Never commit API keys**
   ```bash
   # Use environment variables
   export WATCHLLM_API_KEY="your-key-here"
   ```

2. **Use HTTPS only**
   - Default endpoint uses HTTPS
   - Ensure network policies allow HTTPS

3. **Enable PII Redaction**
   ```typescript
   // Default: enabled
   redactPII: true
   ```

4. **Monitor Access**
   - Review who has access to API keys
   - Rotate keys periodically
   - Use principle of least privilege

---

## 📈 Performance Optimization

### For High-Volume Applications

```typescript
// Node.js
const watchllm = new WatchLLMClient({
  apiKey: '...',
  projectId: '...',
  batchSize: 100,              // Larger batches
  flushIntervalSeconds: 10,    // Less frequent flushing
  sampleRate: 0.1,             // Sample 10% of events
});
```

```python
# Python
watchllm = WatchLLMClient(
    api_key='...',
    project_id='...',
    batch_size=100,              # Larger batches
    flush_interval_seconds=10,   # Less frequent flushing
    sample_rate=0.1              # Sample 10% of events
)
```

### Memory Efficiency
- Batch processing reduces memory overhead
- Events are processed in background threads (Python)
- Automatic queue management prevents memory bloat

---

## 🤝 Choosing Your SDK

### Choose Node.js SDK if you:
- ✅ Building with Node.js / TypeScript
- ✅ Using Express.js, Fastify, or similar
- ✅ Need tight async/await integration
- ✅ Want full TypeScript support
- ✅ Building serverless functions

### Choose Python SDK if you:
- ✅ Building with Python / FastAPI / Django
- ✅ Working with Langchain or LlamaIndex
- ✅ Data science / ML pipelines
- ✅ Need automatic retry with backoff
- ✅ Prefer context manager patterns

---

## 📚 Additional Resources

### Official Links
- **Website**: https://watchllm.dev
- **GitHub**: https://github.com/watchllm/watchllm
- **Issues**: https://github.com/watchllm/watchllm/issues
- **Email**: support@watchllm.dev

### Related Documentation
- [WatchLLM Dashboard Guide](../../docs/DEPLOYMENT.md)
- [Cost Optimization Guide](../../docs/CODEBASE_AUDIT_POTENTIAL_CACHE_HITS.md)
- [System Architecture](../../ARCHITECTURE.md)

---

## 📝 Examples

### Complete Node.js Example

```typescript
import { WatchLLMClient, Status, StepType } from 'watchllm-sdk-node';
import OpenAI from 'openai';

const openai = new OpenAI();
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
});

async function processQuery(query: string) {
  const runId = 'run-' + Date.now();

  try {
    // Step 1: Research
    const searchStart = Date.now();
    const search = await performSearch(query);
    watchllm.logAgentStep({
      runId,
      stepNumber: 1,
      stepName: 'Search',
      stepType: StepType.TOOL_CALL,
      inputData: { query },
      outputData: { results: search },
      latencyMs: Date.now() - searchStart,
      status: Status.SUCCESS,
    });

    // Step 2: Generate response
    const llmStart = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: `Based on these search results: ${JSON.stringify(search)}, answer: ${query}`,
        },
      ],
    });

    const response = completion.choices[0].message.content || '';
    watchllm.logPromptCall({
      runId,
      prompt: query,
      model: 'gpt-4o',
      response,
      tokensInput: completion.usage?.prompt_tokens || 0,
      tokensOutput: completion.usage?.completion_tokens || 0,
      latencyMs: Date.now() - llmStart,
      status: Status.SUCCESS,
    });

    return response;
  } catch (error) {
    watchllm.logError({
      runId,
      error: error as Error,
      context: { query },
    });
    throw error;
  } finally {
    await watchllm.close();
  }
}
```

### Complete Python Example

```python
from watchllm import WatchLLMClient, Status, StepType
import openai
import time

openai.api_key = "your-key"
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id"
)

def process_query(query: str) -> str:
    run_id = f"run-{int(time.time())}"

    try:
        # Step 1: Research
        search_start = time.time()
        search = perform_search(query)
        watchllm.log_agent_step(
            run_id=run_id,
            step_number=1,
            step_name="Search",
            step_type=StepType.TOOL_CALL,
            input_data={"query": query},
            output_data={"results": search},
            latency_ms=int((time.time() - search_start) * 1000),
            status=Status.SUCCESS
        )

        # Step 2: Generate response
        llm_start = time.time()
        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": f"Based on these search results: {search}, answer: {query}"
                }
            ]
        )

        content = response.choices[0].message.content
        watchllm.log_prompt_call(
            run_id=run_id,
            prompt=query,
            model="gpt-4o",
            response=content,
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            latency_ms=int((time.time() - llm_start) * 1000),
            status=Status.SUCCESS
        )

        return content
    except Exception as e:
        watchllm.log_error(
            run_id=run_id,
            error=e,
            context={"query": query}
        )
        raise
    finally:
        watchllm.close()
```

---

## 📄 License

All WatchLLM SDKs are licensed under the MIT License. See LICENSE file for details.

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../docs/CONTRIBUTING.md) for details.

---

**Last Updated**: January 2026  
**SDK Version**: 0.1.0  
**Documentation Version**: 1.0.0
