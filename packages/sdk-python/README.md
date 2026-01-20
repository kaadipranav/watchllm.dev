# WatchLLM Python SDK

Python SDK for the WatchLLM AI Observability platform.

## Installation

```bash
pip install watchllm

# For LangChain integration (optional)
pip install watchllm[langchain]
```

## Quick Start

```python
from watchllm import WatchLLMClient, Status, StepType

# Initialize the client
client = WatchLLMClient(
    api_key='your-api-key',
    project_id='your-project-id',
    environment='production',
)

# Log a prompt call
event_id = client.log_prompt_call(
    run_id='run-123',
    prompt='What is the capital of France?',
    model='gpt-4o-mini',
    response='The capital of France is Paris.',
    tokens_input=8,
    tokens_output=7,
    latency_ms=342,
    status=Status.SUCCESS,
    tags=['production', 'chat'],
)

# Log an agent step
client.log_agent_step(
    run_id='run-123',
    step_number=1,
    step_name='Analyze Query',
    step_type=StepType.REASONING,
    input_data={'query': 'user question'},
    output_data={'analysis': 'needs search'},
    latency_ms=150,
    reasoning='Query requires external knowledge',
)

# Log an error
client.log_error(
    run_id='run-123',
    error=Exception('API timeout'),
    context={'provider': 'openai', 'model': 'gpt-4'},
)

# Flush events manually (optional - auto-flushes on batch size or interval)
client.flush()

# Close the client (flushes remaining events)
client.close()
```

## 🔗 LangChain Integration

Integrate WatchLLM with your LangChain agents, chains, and LLMs with **one line of code**:

```python
from watchllm import WatchLLMClient
from watchllm.langchain import WatchLLMCallbackHandler
from langchain_openai import ChatOpenAI
from langchain.agents import initialize_agent, AgentType, load_tools

# Initialize WatchLLM
client = WatchLLMClient(
    api_key="your-watchllm-api-key",
    project_id="your-project-id"
)

# Create the callback handler - this is the one-line integration!
handler = WatchLLMCallbackHandler(client)

# Use with any LangChain component
llm = ChatOpenAI(model="gpt-4", callbacks=[handler])

# Or with agents
tools = load_tools(["serpapi", "llm-math"], llm=llm)
agent = initialize_agent(
    tools,
    llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    callbacks=[handler]  # All agent actions automatically logged!
)

# All LLM calls, tool uses, and agent decisions are now automatically captured
result = agent.run("What is the square root of the year Python was created?")
```

### What Gets Captured

The `WatchLLMCallbackHandler` automatically captures:

- **LLM Calls**: Prompts, responses, tokens, latency, costs
- **Agent Actions**: Tool selection, reasoning, decisions
- **Tool Executions**: Inputs, outputs, timing
- **Chain Runs**: Full chain execution with inputs/outputs
- **Retriever Calls**: RAG queries and retrieved documents
- **Errors**: Full stack traces and context

### Privacy Options

For sensitive applications, you can disable logging of prompts and responses:

```python
handler = WatchLLMCallbackHandler(
    client,
    log_prompts=False,    # Prompts logged as "[REDACTED]"
    log_responses=False,  # Responses logged as "[REDACTED]"
)
```

### Advanced Configuration

```python
handler = WatchLLMCallbackHandler(
    client,
    run_id="my-custom-run-id",  # Group all events under a custom run ID
    user_id="user-123",          # Associate with a specific user
    tags=["production", "v2"],   # Add tags to all events
    metadata={"version": "2.0"}, # Add custom metadata
)
```

## Configuration

```python
client = WatchLLMClient(
    api_key='your-key',              # Required: Your WatchLLM API key
    project_id='your-project-id',    # Required: Your project ID
    base_url='https://...',          # Optional: API base URL (default: https://proxy.watchllm.dev/v1)
    environment='production',        # Optional: Environment name (default: 'development')
    sample_rate=1.0,                 # Optional: Sampling rate 0.0-1.0 (default: 1.0)
    redact_pii=True,                 # Optional: Auto-redact PII (default: True)
    batch_size=10,                   # Optional: Batch size before auto-flush (default: 10)
    flush_interval_seconds=5,        # Optional: Auto-flush interval (default: 5)
    timeout=30,                      # Optional: Request timeout in seconds (default: 30)
)
```

## API Reference

### log_prompt_call(...)

Log an LLM prompt call event.

**Parameters:**
- `run_id` (str): Unique run identifier
- `prompt` (str): The input prompt
- `model` (str): Model name (e.g., 'gpt-4o-mini')
- `response` (str): Model response
- `tokens_input` (int): Input token count
- `tokens_output` (int): Output token count
- `latency_ms` (int): Request latency in milliseconds
- `status` (Status | str, optional): Request status (default: SUCCESS)
- `error` (dict, optional): Error details
- `prompt_template_id` (str, optional): Template identifier
- `model_version` (str, optional): Model version
- `response_metadata` (dict, optional): Additional response metadata
- `tool_calls` (list, optional): Associated tool calls
- `tags` (list[str], optional): Event tags
- `user_id` (str, optional): User identifier
- `release` (str, optional): Release version

**Returns:** Event ID (str)

### log_agent_step(...)

Log an agent step event.

**Parameters:**
- `run_id` (str): Unique run identifier
- `step_number` (int): Step sequence number
- `step_name` (str): Step name/description
- `step_type` (StepType | str): Step type (REASONING, TOOL_CALL, VALIDATION, OUTPUT)
- `input_data` (dict): Step input data
- `output_data` (dict): Step output data
- `latency_ms` (int): Step duration in milliseconds
- `status` (Status | str, optional): Step status
- `reasoning` (str, optional): Agent reasoning
- `context` (dict, optional): Additional context
- `error` (dict, optional): Error details
- `tags` (list[str], optional): Event tags
- `user_id` (str, optional): User identifier
- `release` (str, optional): Release version

**Returns:** Event ID (str)

### log_error(...)

Log an error event.

**Parameters:**
- `run_id` (str): Unique run identifier
- `error` (Exception | dict): Error object or error details
- `context` (dict, optional): Error context
- `tags` (list[str], optional): Event tags
- `user_id` (str, optional): User identifier
- `release` (str, optional): Release version

**Returns:** Event ID (str)

### flush()

Manually flush queued events to the API.

**Returns:** None

### close()

Close the client and flush all remaining events.

**Returns:** None

## Enums

### EventType
- `PROMPT_CALL`
- `TOOL_CALL`
- `AGENT_STEP`
- `ERROR`
- `ASSERTION_FAILED`
- `HALLUCINATION_DETECTED`
- `COST_THRESHOLD_EXCEEDED`
- `PERFORMANCE_ALERT`

### Status
- `SUCCESS`
- `ERROR`
- `TIMEOUT`
- `ASSERTION_FAILED`
- `WARNING`

### StepType
- `REASONING`
- `TOOL_CALL`
- `VALIDATION`
- `OUTPUT`

### AssertionType
- `RESPONSE_FORMAT`
- `CONTENT_FILTER`
- `SAFETY_CHECK`
- `CUSTOM`

### DetectionMethod
- `HEURISTIC`
- `MODEL_ENSEMBLE`
- `GROUND_TRUTH_VERIFICATION`

### AlertType
- `COST_SPIKE`
- `LATENCY_SPIKE`
- `ERROR_RATE_SPIKE`
- `TOKEN_LIMIT`

### Severity
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Features

✅ **Automatic batching** - Events are queued and sent in batches  
✅ **Background thread** - Non-blocking event processing  
✅ **Retry logic** - Automatic retries with exponential backoff  
✅ **PII redaction** - Automatic redaction of emails and credit cards  
✅ **Sampling** - Control event ingestion rate  
✅ **Cost estimation** - Automatic cost calculation for popular models  
✅ **Type safety** - Full type hints for better IDE support  

## Requirements

- Python 3.8+
- requests >= 2.25.0
- urllib3 >= 1.26.0

## License

MIT

## Links

- Homepage: https://watchllm.dev
- Documentation: https://watchllm.dev/docs
- GitHub: https://github.com/watchllm/watchllm
- PyPI: https://pypi.org/project/watchllm/
