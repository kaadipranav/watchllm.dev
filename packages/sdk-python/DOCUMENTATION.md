# WatchLLM Python SDK Documentation

> **Python SDK for AI Observability and LLM Monitoring**

Complete SDK for instrumenting Python applications with WatchLLM's semantic caching and cost optimization layer. Monitor LLM calls, agent steps, errors, and performance metrics with automatic PII redaction and intelligent batching.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Prerequisites
- Python 3.8+

### Using pip

```bash
pip install watchllm
```

### Using Poetry

```bash
poetry add watchllm
```

### Using pipenv

```bash
pipenv install watchllm
```

### From Source

```bash
git clone https://github.com/watchllm/watchllm.git
cd packages/sdk-python
pip install -e .
```

---

## Quick Start

### Basic Setup

```python
from watchllm import WatchLLMClient, Status

# Initialize the client
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id"
)

# Log a prompt call
event_id = watchllm.log_prompt_call(
    run_id="run-123",
    prompt="What is machine learning?",
    model="gpt-4o",
    response="Machine learning is a subset of AI...",
    tokens_input=12,
    tokens_output=45,
    latency_ms=1250,
    status=Status.SUCCESS
)

# Flush events before shutdown
watchllm.close()
```

### With FastAPI

```python
from fastapi import FastAPI, Request
from watchllm import WatchLLMClient, Status
import time

app = FastAPI()
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id"
)

@app.post("/api/chat")
async def chat(request: Request):
    run_id = request.headers.get("x-run-id", f"run-{int(time.time())}")
    start_time = time.time()
    body = await request.json()
    
    try:
        # Your LLM logic here
        response = await call_openai(body["prompt"])
        
        watchllm.log_prompt_call(
            run_id=run_id,
            prompt=body["prompt"],
            model="gpt-4o",
            response=response["text"],
            tokens_input=response["usage"]["prompt_tokens"],
            tokens_output=response["usage"]["completion_tokens"],
            latency_ms=int((time.time() - start_time) * 1000),
            status=Status.SUCCESS
        )
        
        return response
    except Exception as e:
        watchllm.log_error(
            run_id=run_id,
            error=e,
            context={"endpoint": "/api/chat"}
        )
        return {"error": str(e)}, 500

@app.on_event("shutdown")
async def shutdown():
    watchllm.close()
```

---

## Configuration

### WatchLLMClient Constructor

```python
client = WatchLLMClient(
    api_key: str,
    project_id: str,
    base_url: str = "https://proxy.watchllm.dev/v1",
    environment: str = "development",
    sample_rate: float = 1.0,
    redact_pii: bool = True,
    batch_size: int = 10,
    flush_interval_seconds: int = 5,
    timeout: int = 30
)
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `api_key` | `str` | Required | Your WatchLLM API key |
| `project_id` | `str` | Required | Your project ID |
| `base_url` | `str` | `https://proxy.watchllm.dev/v1` | API endpoint |
| `environment` | `str` | `development` | Environment (development/staging/production) |
| `sample_rate` | `float` | `1.0` | Sampling rate (0.0-1.0) |
| `redact_pii` | `bool` | `True` | Enable PII redaction |
| `batch_size` | `int` | `10` | Events per batch |
| `flush_interval_seconds` | `int` | `5` | Batch flush interval |
| `timeout` | `int` | `30` | Request timeout in seconds |

### Environment Variables

Use environment variables for sensitive configuration:

```bash
export WATCHLLM_API_KEY="your-api-key"
export WATCHLLM_PROJECT_ID="your-project-id"
export WATCHLLM_ENVIRONMENT="production"
export WATCHLLM_SAMPLE_RATE="1.0"
```

Load them in your code:

```python
import os
from watchllm import WatchLLMClient

watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID"),
    environment=os.getenv("WATCHLLM_ENVIRONMENT", "development"),
    sample_rate=float(os.getenv("WATCHLLM_SAMPLE_RATE", "1.0"))
)
```

---

## Core Concepts

### Event Types

WatchLLM supports multiple event types for comprehensive monitoring:

| Event Type | Use Case | Class |
|-----------|----------|-------|
| `PROMPT_CALL` | LLM API calls (OpenAI, Anthropic, etc.) | `PromptCallEvent` |
| `AGENT_STEP` | Individual steps in agentic workflows | `AgentStepEvent` |
| `ERROR` | Application errors and exceptions | `ErrorEvent` |
| `ASSERTION_FAILED` | Validation and assertion failures | `AssertionFailedEvent` |
| `HALLUCINATION_DETECTED` | Detected model hallucinations | `HallucinationDetectedEvent` |
| `PERFORMANCE_ALERT` | Performance anomalies | `PerformanceAlertEvent` |

### Status Values

```python
from watchllm import Status

Status.SUCCESS              # Successful execution
Status.ERROR               # Error occurred
Status.TIMEOUT             # Operation timed out
Status.ASSERTION_FAILED    # Assertion check failed
Status.WARNING             # Warning condition
```

### Step Types

```python
from watchllm import StepType

StepType.REASONING         # Reasoning step
StepType.TOOL_CALL        # Tool invocation
StepType.VALIDATION       # Validation step
StepType.OUTPUT           # Output generation
```

### Severity Levels

```python
from watchllm import Severity

Severity.LOW              # Low severity
Severity.MEDIUM           # Medium severity
Severity.HIGH             # High severity
Severity.CRITICAL         # Critical severity
```

### Batching and Flushing

The SDK automatically batches events for efficiency:

- **Automatic flushing**: Triggered when batch size is reached or flush interval elapses
- **Manual flushing**: Call `watchllm.flush()` before critical operations
- **Graceful shutdown**: Call `watchllm.close()` to ensure all events are sent

```python
# Manual flush
watchllm.flush()

# Graceful shutdown
watchllm.close()

# Context manager for automatic cleanup
with WatchLLMClient(api_key="...", project_id="...") as watchllm:
    event_id = watchllm.log_prompt_call(...)
    # Automatically calls close() on exit
```

### PII Redaction

By default, the SDK automatically redacts:
- Email addresses
- Credit card numbers

```python
# Disable redaction if needed
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id",
    redact_pii=False  # Disable redaction
)
```

---

## API Reference

### WatchLLMClient

#### Methods

### log_prompt_call

Logs a language model API call with tokens and cost information.

```python
event_id = watchllm.log_prompt_call(
    run_id: str,
    prompt: str,
    model: str,
    response: str,
    tokens_input: int,
    tokens_output: int,
    latency_ms: int,
    
    # Optional
    status: Union[Status, str] = Status.SUCCESS,
    error: Optional[Dict[str, str]] = None,
    prompt_template_id: Optional[str] = None,
    model_version: Optional[str] = None,
    response_metadata: Optional[Dict[str, Any]] = None,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str  # Returns event_id
```

**Example:**

```python
event_id = watchllm.log_prompt_call(
    run_id="run-abc-123",
    prompt="Summarize this article: ...",
    model="gpt-4o",
    response="The article discusses...",
    tokens_input=150,
    tokens_output=200,
    latency_ms=2500,
    status=Status.SUCCESS,
    tags=["summarization", "article"],
    user_id="user-456",
    release="1.2.0"
)
```

---

### log_agent_step

Logs a step in an agentic workflow.

```python
event_id = watchllm.log_agent_step(
    run_id: str,
    step_number: int,
    step_name: str,
    step_type: Union[StepType, str],
    input_data: Dict[str, Any],
    output_data: Dict[str, Any],
    latency_ms: int,
    
    # Optional
    status: Union[Status, str] = Status.SUCCESS,
    reasoning: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    error: Optional[Dict[str, str]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str  # Returns event_id
```

**Example:**

```python
step_event_id = watchllm.log_agent_step(
    run_id="run-xyz-789",
    step_number=1,
    step_name="Research Phase",
    step_type="reasoning",
    input_data={"query": "climate change solutions"},
    output_data={"findings": [...]},
    reasoning="Searched for relevant research papers and compiled findings",
    latency_ms=5000,
    status=Status.SUCCESS,
    context={"model": "gpt-4o", "temperature": 0.7}
)
```

---

### log_error

Logs an error or exception that occurred during execution.

```python
event_id = watchllm.log_error(
    run_id: str,
    error: Union[Exception, Dict[str, str]],
    
    # Optional
    context: Optional[Dict[str, Any]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str  # Returns event_id
```

**Example:**

```python
try:
    # Some operation
    result = await call_llm()
except Exception as e:
    watchllm.log_error(
        run_id="run-123",
        error=e,
        context={
            "operation": "call_llm",
            "retry_attempt": 2
        },
        tags=["error", "openai"]
    )
```

---

### flush

Manually flush all queued events to the API.

```python
watchllm.flush()
```

**Example:**

```python
# Before a critical operation
watchllm.flush()

# Or periodically in a background task
import asyncio

async def periodic_flush():
    while True:
        await asyncio.sleep(30)
        watchllm.flush()
```

---

### close

Gracefully shutdown the client, flushing all remaining events.

```python
watchllm.close()
```

**Example:**

```python
# Using context manager (recommended)
with WatchLLMClient(api_key="...", project_id="...") as watchllm:
    event_id = watchllm.log_prompt_call(...)
    # Automatically calls close() on exit

# Or manual shutdown
try:
    # Your code here
    pass
finally:
    watchllm.close()
```

---

## Usage Examples

### Example 1: OpenAI Integration

```python
import os
import time
import openai
from watchllm import WatchLLMClient, Status

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID")
)

def generate_content(prompt: str) -> str:
    run_id = f"run-{int(time.time())}"
    start_time = time.time()
    
    try:
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        
        response = completion.choices[0].message.content or ""
        latency_ms = int((time.time() - start_time) * 1000)
        
        watchllm.log_prompt_call(
            run_id=run_id,
            prompt=prompt,
            model="gpt-4o",
            response=response,
            tokens_input=completion.usage.prompt_tokens,
            tokens_output=completion.usage.completion_tokens,
            latency_ms=latency_ms,
            status=Status.SUCCESS
        )
        
        return response
    except Exception as e:
        watchllm.log_error(
            run_id=run_id,
            error=e,
            context={"model": "gpt-4o", "prompt": prompt}
        )
        raise
    finally:
        watchllm.flush()

# Graceful shutdown
try:
    result = generate_content("What is machine learning?")
    print(result)
finally:
    watchllm.close()
```

---

### Example 2: Agent Workflow

```python
import os
import time
from watchllm import WatchLLMClient, Status, StepType

watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID")
)

async def run_research_agent(topic: str) -> str:
    run_id = f"agent-run-{int(time.time())}"
    
    try:
        # Step 1: Research
        research_start = time.time()
        research = await perform_web_search(topic)
        watchllm.log_agent_step(
            run_id=run_id,
            step_number=1,
            step_name="Web Search",
            step_type=StepType.TOOL_CALL,
            input_data={"query": topic},
            output_data={"results": research},
            latency_ms=int((time.time() - research_start) * 1000),
            status=Status.SUCCESS
        )
        
        # Step 2: Analysis
        analysis_start = time.time()
        analysis = await analyze_results(research)
        watchllm.log_agent_step(
            run_id=run_id,
            step_number=2,
            step_name="Analysis",
            step_type=StepType.REASONING,
            input_data={"research": research},
            output_data={"analysis": analysis},
            latency_ms=int((time.time() - analysis_start) * 1000),
            status=Status.SUCCESS,
            reasoning="Synthesized search results into coherent insights"
        )
        
        # Step 3: Summarization
        summary_start = time.time()
        summary = await generate_summary(analysis)
        watchllm.log_agent_step(
            run_id=run_id,
            step_number=3,
            step_name="Summary Generation",
            step_type=StepType.OUTPUT,
            input_data={"analysis": analysis},
            output_data={"summary": summary},
            latency_ms=int((time.time() - summary_start) * 1000),
            status=Status.SUCCESS
        )
        
        return summary
    except Exception as e:
        watchllm.log_error(
            run_id=run_id,
            error=e,
            context={"topic": topic},
            tags=["agent", "research"]
        )
        raise

# Usage
import asyncio

try:
    result = asyncio.run(run_research_agent("climate change solutions"))
    print(result)
finally:
    watchllm.close()
```

---

### Example 3: Error Handling with Context

```python
import os
from watchllm import WatchLLMClient
from datetime import datetime

watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID"),
    environment="production"
)

def process_request(user_id: str, request: dict) -> dict:
    run_id = f"request-{user_id}-{int(time.time())}"
    
    try:
        # Your business logic
        return execute_business_logic(request)
    except Exception as e:
        # Log with rich context
        watchllm.log_error(
            run_id=run_id,
            error=e,
            context={
                "user_id": user_id,
                "request_id": request.get("id"),
                "request_type": request.get("type"),
                "timestamp": datetime.utcnow().isoformat()
            },
            tags=["error", "processing", "user-request"],
            user_id=user_id
        )
        
        # Ensure error is sent before handling
        watchllm.flush()
        raise
```

---

### Example 4: Langchain Integration

```python
from langchain.llms import OpenAI
from langchain.agents import initialize_agent, Tool
from watchllm import WatchLLMClient, Status, StepType
import time

watchllm = WatchLLMClient(
    api_key=os.getenv("WATCHLLM_API_KEY"),
    project_id=os.getenv("WATCHLLM_PROJECT_ID")
)

# Create a callback to log Langchain operations
class WatchLLMCallback:
    def __init__(self, watchllm: WatchLLMClient):
        self.watchllm = watchllm
        self.run_id = f"langchain-{int(time.time())}"
    
    def on_llm_start(self, serialized, prompts, **kwargs):
        self.llm_start_time = time.time()
    
    def on_llm_end(self, response, **kwargs):
        latency_ms = int((time.time() - self.llm_start_time) * 1000)
        
        self.watchllm.log_prompt_call(
            run_id=self.run_id,
            prompt=response.prompt,
            model=response.model,
            response=response.text,
            tokens_input=response.usage.prompt_tokens,
            tokens_output=response.usage.completion_tokens,
            latency_ms=latency_ms,
            status=Status.SUCCESS
        )
    
    def on_tool_start(self, serialized, input_str, **kwargs):
        self.tool_start_time = time.time()
    
    def on_tool_end(self, output, **kwargs):
        latency_ms = int((time.time() - self.tool_start_time) * 1000)
        
        self.watchllm.log_agent_step(
            run_id=self.run_id,
            step_number=kwargs.get("step_number", 0),
            step_name=kwargs.get("tool_name", "Tool"),
            step_type=StepType.TOOL_CALL,
            input_data={"tool_input": kwargs.get("input", {})},
            output_data={"output": output},
            latency_ms=latency_ms,
            status=Status.SUCCESS
        )

# Use with Langchain agent
callback = WatchLLMCallback(watchllm)
llm = OpenAI(temperature=0, callbacks=[callback])
```

---

## Best Practices

### 1. **Use Consistent Run IDs**

Use consistent `run_id` to correlate all events from a single execution:

```python
import uuid

# Good: Single run ID for entire workflow
run_id = str(uuid.uuid4())

watchllm.log_prompt_call(run_id=run_id, ...)
watchllm.log_agent_step(run_id=run_id, ...)
watchllm.log_prompt_call(run_id=run_id, ...)
```

### 2. **Tag Events for Better Filtering**

Use meaningful tags to organize and filter events:

```python
watchllm.log_prompt_call(
    run_id=run_id,
    tags=["customer-support", "urgent", "gpt-4"],
    # ...
)
```

### 3. **Include User Context**

Track which user triggered an event for better debugging:

```python
watchllm.log_prompt_call(
    run_id=run_id,
    user_id=request.user.id,
    # ...
)
```

### 4. **Use Context Managers for Cleanup**

Always use context managers for automatic resource cleanup:

```python
# Recommended
with WatchLLMClient(api_key="...", project_id="...") as watchllm:
    event_id = watchllm.log_prompt_call(...)
    # Automatically calls close() on exit

# Or
try:
    # Your code here
    pass
finally:
    watchllm.close()
```

### 5. **Set Appropriate Sample Rates**

For high-traffic applications, use sampling to reduce costs:

```python
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id",
    sample_rate=0.1  # Log only 10% of events
)
```

### 6. **Monitor Batch Configuration**

Adjust batch size and flush interval based on your event volume:

```python
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id",
    batch_size=50,              # Higher for high volume
    flush_interval_seconds=10   # Longer for less frequent flushing
)
```

### 7. **Include Release Information**

Track which version of your application generated events:

```python
watchllm.log_prompt_call(
    run_id=run_id,
    release="v1.2.3",  # Your application version
    # ...
)
```

---

## Troubleshooting

### Events Not Being Sent

**Problem:** Events are queued but not being delivered to the API.

**Solutions:**
1. Verify your `api_key` and `project_id` are correct
2. Check that `watchllm.close()` is called before application exit
3. Verify network connectivity to `https://proxy.watchllm.dev`
4. Check console output for error messages

```python
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("watchllm")
logger.setLevel(logging.DEBUG)
```

### High Memory Usage

**Problem:** The SDK is consuming significant memory.

**Solutions:**
1. Reduce `batch_size` (default is 10)
2. Increase `flush_interval_seconds` (default is 5)
3. Use `sample_rate` to reduce event volume
4. Check for event queue backlog

```python
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id",
    batch_size=5,               # Reduce batch size
    flush_interval_seconds=3    # More frequent flushing
)
```

### Timeout Errors

**Problem:** Events are timing out when sending to the API.

**Solutions:**
1. Increase `timeout` setting (default is 30 seconds)
2. Check network latency to the proxy
3. Verify API key has proper permissions
4. Reduce batch size for smaller payloads

```python
watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id",
    timeout=60  # Increase to 60 seconds
)
```

### PII Not Being Redacted

**Problem:** Sensitive data is appearing in events.

**Solutions:**
1. Ensure `redact_pii=True` (default)
2. For custom PII patterns, manually sanitize before logging
3. Check redaction patterns in source code

```python
import re

def sanitize(data: str) -> str:
    """Manually redact sensitive data"""
    data = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', data)
    data = re.sub(r'\b\d{16}\b', '[REDACTED_CC]', data)
    return data

watchllm.log_prompt_call(
    run_id=run_id,
    prompt=sanitize(prompt),
    # ...
)
```

### Thread Safety in Async Applications

**Problem:** Using WatchLLMClient in async context.

**Solution:** The SDK is thread-safe and designed for both sync and async applications:

```python
import asyncio
from watchllm import WatchLLMClient

watchllm = WatchLLMClient(
    api_key="your-api-key",
    project_id="your-project-id"
)

async def async_operation():
    # Safe to use from async context
    event_id = watchllm.log_prompt_call(...)
    return event_id

# Run
asyncio.run(async_operation())
watchllm.close()
```

---

## Support

- **Documentation:** https://watchllm.dev/docs
- **GitHub:** https://github.com/watchllm/watchllm
- **Issues:** https://github.com/watchllm/watchllm/issues
- **Email:** support@watchllm.dev

---

## License

MIT © WatchLLM
