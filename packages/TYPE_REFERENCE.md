# WatchLLM SDK - Type Reference

## Complete Type Definitions and API Reference

This document provides a comprehensive reference for all types, enums, and interfaces available in the WatchLLM SDKs.

---

## Table of Contents

- [Enums](#enums)
- [Interfaces](#interfaces)
- [Event Types](#event-types)
- [Client Configuration](#client-configuration)
- [Method Reference](#method-reference)

---

## Enums

### EventType

Specifies the type of event being logged.

```typescript
// Node.js / TypeScript
enum EventType {
  PROMPT_CALL = 'prompt_call',
  TOOL_CALL = 'tool_call',
  AGENT_STEP = 'agent_step',
  ERROR = 'error',
  ASSERTION_FAILED = 'assertion_failed',
  HALLUCINATION_DETECTED = 'hallucination_detected',
  COST_THRESHOLD_EXCEEDED = 'cost_threshold_exceeded',
  PERFORMANCE_ALERT = 'performance_alert',
}
```

```python
# Python
class EventType(Enum):
    PROMPT_CALL = "prompt_call"
    TOOL_CALL = "tool_call"
    AGENT_STEP = "agent_step"
    ERROR = "error"
    ASSERTION_FAILED = "assertion_failed"
    HALLUCINATION_DETECTED = "hallucination_detected"
    COST_THRESHOLD_EXCEEDED = "cost_threshold_exceeded"
    PERFORMANCE_ALERT = "performance_alert"
```

**Usage:**
```typescript
// Node.js
import { EventType } from 'watchllm-sdk-node';
const type = EventType.PROMPT_CALL;

// Python
from watchllm import EventType
type = EventType.PROMPT_CALL
```

---

### Status

Indicates the execution status of an operation.

```typescript
// Node.js / TypeScript
enum Status {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  ASSERTION_FAILED = 'assertion_failed',
  WARNING = 'warning',
}
```

```python
# Python
class Status(Enum):
    SUCCESS = "success"
    ERROR = "error"
    TIMEOUT = "timeout"
    ASSERTION_FAILED = "assertion_failed"
    WARNING = "warning"
```

**Usage:**
```typescript
// Node.js
watchllm.logPromptCall({
  status: Status.SUCCESS,
  // ...
});

// Python
watchllm.log_prompt_call(
    status=Status.SUCCESS,
    # ...
)
```

---

### StepType

Categorizes the type of step in an agent workflow.

```typescript
// Node.js / TypeScript
enum StepType {
  REASONING = 'reasoning',
  TOOL_CALL = 'tool_call',
  VALIDATION = 'validation',
  OUTPUT = 'output',
}
```

```python
# Python
class StepType(Enum):
    REASONING = "reasoning"
    TOOL_CALL = "tool_call"
    VALIDATION = "validation"
    OUTPUT = "output"
```

**Usage:**
```typescript
// Node.js
watchllm.logAgentStep({
  stepType: StepType.REASONING,
  // ...
});

// Python
watchllm.log_agent_step(
    step_type=StepType.REASONING,
    # ...
)
```

---

### AssertionType

Specifies the kind of assertion that failed.

```typescript
// Node.js / TypeScript
enum AssertionType {
  RESPONSE_FORMAT = 'response_format',
  CONTENT_FILTER = 'content_filter',
  SAFETY_CHECK = 'safety_check',
  CUSTOM = 'custom',
}
```

```python
# Python
class AssertionType(Enum):
    RESPONSE_FORMAT = "response_format"
    CONTENT_FILTER = "content_filter"
    SAFETY_CHECK = "safety_check"
    CUSTOM = "custom"
```

---

### DetectionMethod

Indicates how a hallucination was detected.

```typescript
// Node.js / TypeScript
enum DetectionMethod {
  HEURISTIC = 'heuristic',
  MODEL_ENSEMBLE = 'model_ensemble',
  GROUND_TRUTH_VERIFICATION = 'ground_truth_verification',
}
```

```python
# Python
class DetectionMethod(Enum):
    HEURISTIC = "heuristic"
    MODEL_ENSEMBLE = "model_ensemble"
    GROUND_TRUTH_VERIFICATION = "ground_truth_verification"
```

---

### AlertType

Specifies the type of performance alert.

```typescript
// Node.js / TypeScript
enum AlertType {
  COST_SPIKE = 'cost_spike',
  LATENCY_SPIKE = 'latency_spike',
  ERROR_RATE_SPIKE = 'error_rate_spike',
  TOKEN_LIMIT = 'token_limit',
}
```

```python
# Python
class AlertType(Enum):
    COST_SPIKE = "cost_spike"
    LATENCY_SPIKE = "latency_spike"
    ERROR_RATE_SPIKE = "error_rate_spike"
    TOKEN_LIMIT = "token_limit"
```

---

### Severity

Indicates the severity level of an issue.

```typescript
// Node.js / TypeScript
enum Severity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

```python
# Python
class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
```

---

## Interfaces

### ClientInfo

Metadata about the SDK client.

```typescript
// Node.js / TypeScript
interface ClientInfo {
  sdk_version?: string;      // SDK version
  platform?: string;         // 'node' or 'python'
  hostname?: string;         // Host machine name
}
```

```python
# Python
@dataclass
class ClientInfo:
    sdk_version: Optional[str] = None
    platform: Optional[str] = None
    hostname: Optional[str] = None
```

---

### BaseEvent

Base interface for all events (automatically included).

```typescript
// Node.js / TypeScript
interface BaseEvent {
  event_id: string;          // UUID of the event
  project_id: string;        // Your project ID
  run_id: string;            // Run/execution ID
  timestamp: string;         // ISO 8601 timestamp
  user_id?: string;          // Optional user identifier
  tags?: string[];           // Optional tags for filtering
  release?: string;          // Optional release version
  env?: string;              // Environment (dev/prod/staging)
  client?: ClientInfo;       // SDK metadata
}
```

```python
# Python
@dataclass
class BaseEvent:
    event_id: str
    project_id: str
    run_id: str
    timestamp: str
    user_id: Optional[str] = None
    tags: List[str] = None
    release: Optional[str] = None
    env: str = "development"
    client: Dict[str, Any] = None
```

---

### ToolCallEvent

Represents a tool or function invocation.

```typescript
// Node.js / TypeScript
interface ToolCallEvent {
  tool_name: string;
  tool_id?: string;
  input: Record<string, any>;
  output: Record<string, any>;
  latency_ms: number;
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
}
```

```python
# Python
@dataclass
class ToolCallEvent:
    tool_name: str
    input: Dict[str, Any]
    output: Dict[str, Any]
    latency_ms: int
    status: Union[Status, str]
    tool_id: Optional[str] = None
    error: Optional[Dict[str, str]] = None
```

---

### PromptCallEvent

Event for logging LLM API calls.

```typescript
// Node.js / TypeScript
interface PromptCallEvent extends BaseEvent {
  event_type: EventType.PROMPT_CALL;
  prompt: string;
  prompt_template_id?: string;
  model: string;
  model_version?: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate_usd: number;
  response: string;
  response_metadata?: Record<string, any>;
  tool_calls?: ToolCallEvent[];
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
  latency_ms: number;
}
```

```python
# Python
@dataclass
class PromptCallEvent(BaseEvent):
    event_type: str = EventType.PROMPT_CALL.value
    prompt: str = ""
    prompt_template_id: Optional[str] = None
    model: str = ""
    model_version: Optional[str] = None
    tokens_input: int = 0
    tokens_output: int = 0
    cost_estimate_usd: float = 0.0
    response: str = ""
    response_metadata: Dict[str, Any] = None
    tool_calls: List[ToolCallEvent] = None
    status: Union[Status, str] = Status.SUCCESS
    error: Optional[Dict[str, str]] = None
    latency_ms: int = 0
```

---

### AgentStepEvent

Event for logging individual agent workflow steps.

```typescript
// Node.js / TypeScript
interface AgentStepEvent extends BaseEvent {
  event_type: EventType.AGENT_STEP;
  step_number: number;
  step_name: string;
  step_type: StepType | string;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  reasoning?: string;
  context?: Record<string, any>;
  latency_ms: number;
  status: Status | string;
  error?: {
    message: string;
    type?: string;
    stack?: string;
  };
}
```

```python
# Python
@dataclass
class AgentStepEvent(BaseEvent):
    event_type: str = EventType.AGENT_STEP.value
    step_number: int = 0
    step_name: str = ""
    step_type: Union[StepType, str] = StepType.REASONING
    input_data: Dict[str, Any] = None
    output_data: Dict[str, Any] = None
    reasoning: Optional[str] = None
    context: Dict[str, Any] = None
    latency_ms: int = 0
    status: Union[Status, str] = Status.SUCCESS
    error: Optional[Dict[str, str]] = None
```

---

### ErrorEvent

Event for logging errors and exceptions.

```typescript
// Node.js / TypeScript
interface ErrorEvent extends BaseEvent {
  event_type: EventType.ERROR;
  error: {
    message: string;
    type?: string;
    stack?: string;
  };
  context?: Record<string, any>;
  stack_trace?: string;
}
```

```python
# Python
@dataclass
class ErrorEvent(BaseEvent):
    event_type: str = EventType.ERROR.value
    error: Dict[str, str] = None
    context: Dict[str, Any] = None
    stack_trace: Optional[str] = None
```

---

### AssertionFailedEvent

Event for logging assertion failures.

```typescript
// Node.js / TypeScript
interface AssertionFailedEvent extends BaseEvent {
  event_type: EventType.ASSERTION_FAILED;
  assertion_name: string;
  assertion_type: AssertionType | string;
  expected: any;
  actual: any;
  severity: Severity | string;
}
```

```python
# Python
@dataclass
class AssertionFailedEvent(BaseEvent):
    event_type: str = EventType.ASSERTION_FAILED.value
    assertion_name: str = ""
    assertion_type: Union[AssertionType, str] = AssertionType.CUSTOM
    expected: Any = None
    actual: Any = None
    severity: Union[Severity, str] = Severity.MEDIUM
```

---

### HallucinationDetectedEvent

Event for logging detected model hallucinations.

```typescript
// Node.js / TypeScript
interface HallucinationDetectedEvent extends BaseEvent {
  event_type: EventType.HALLUCINATION_DETECTED;
  detection_method: DetectionMethod | string;
  confidence_score: number;  // 0.0 to 1.0
  flagged_content: string;
  ground_truth?: string;
  recommendations?: string[];
}
```

```python
# Python
@dataclass
class HallucinationDetectedEvent(BaseEvent):
    event_type: str = EventType.HALLUCINATION_DETECTED.value
    detection_method: Union[DetectionMethod, str] = DetectionMethod.HEURISTIC
    confidence_score: float = 0.0
    flagged_content: str = ""
    ground_truth: Optional[str] = None
    recommendations: List[str] = None
```

---

### PerformanceAlertEvent

Event for logging performance anomalies.

```typescript
// Node.js / TypeScript
interface PerformanceAlertEvent extends BaseEvent {
  event_type: EventType.PERFORMANCE_ALERT;
  alert_type: AlertType | string;
  threshold: number;
  actual_value: number;
  window_minutes: number;
  affected_models?: string[];
}
```

```python
# Python
@dataclass
class PerformanceAlertEvent(BaseEvent):
    event_type: str = EventType.PERFORMANCE_ALERT.value
    alert_type: Union[AlertType, str] = AlertType.COST_SPIKE
    threshold: float = 0.0
    actual_value: float = 0.0
    window_minutes: int = 0
    affected_models: List[str] = None
```

---

## Client Configuration

### WatchLLMConfig (Node.js)

```typescript
interface WatchLLMConfig {
  // Required
  apiKey: string;

  projectId: string;

  // Optional
  baseUrl?: string;                   // Default: 'https://proxy.watchllm.dev/v1'
  environment?: string;               // Default: 'development'
  sampleRate?: number;                // Default: 1.0 (range: 0.0-1.0)
  redactPII?: boolean;                // Default: true
  batchSize?: number;                 // Default: 10
  flushIntervalSeconds?: number;      // Default: 5
  timeout?: number;                   // Default: 30000 (milliseconds)
}
```

### WatchLLMClient Constructor (Python)

```python
def __init__(
    self,
    api_key: str,
    project_id: str,
    base_url: str = "https://proxy.watchllm.dev/v1",
    environment: str = "development",
    sample_rate: float = 1.0,
    redact_pii: bool = True,
    batch_size: int = 10,
    flush_interval_seconds: int = 5,
    timeout: int = 30
) -> None:
    """
    Initialize a WatchLLM client.

    Args:
        api_key: Your WatchLLM API key
        project_id: Your project ID
        base_url: API endpoint (default: production)
        environment: Environment name (default: development)
        sample_rate: Event sampling rate 0-1 (default: 1.0)
        redact_pii: Enable PII redaction (default: True)
        batch_size: Events per batch (default: 10)
        flush_interval_seconds: Batch flush interval (default: 5)
        timeout: Request timeout in seconds (default: 30)
    """
```

---

## Method Reference

### Node.js / TypeScript Methods

#### logPromptCall

```typescript
logPromptCall(params: {
  runId: string;
  prompt: string;
  model: string;
  response: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  status?: Status | string;
  error?: { message: string; type?: string; stack?: string };
  promptTemplateId?: string;
  modelVersion?: string;
  responseMetadata?: Record<string, any>;
  toolCalls?: ToolCallEvent[];
  tags?: string[];
  userId?: string;
  release?: string;
}): string
```

**Returns:** Event ID

---

#### logAgentStep

```typescript
logAgentStep(params: {
  runId: string;
  stepNumber: number;
  stepName: string;
  stepType: StepType | string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  latencyMs: number;
  status?: Status | string;
  reasoning?: string;
  context?: Record<string, any>;
  error?: { message: string; type?: string; stack?: string };
  tags?: string[];
  userId?: string;
  release?: string;
}): string
```

**Returns:** Event ID

---

#### logError

```typescript
logError(params: {
  runId: string;
  error: Error | { message: string; type?: string; stack?: string };
  context?: Record<string, any>;
  tags?: string[];
  userId?: string;
  release?: string;
}): string
```

**Returns:** Event ID

---

#### flush

```typescript
flush(): Promise<void>
```

Flushes all queued events to the API.

---

#### close

```typescript
close(): Promise<void>
```

Gracefully shuts down the client and flushes remaining events.

---

### Python Methods

#### log_prompt_call

```python
def log_prompt_call(
    self,
    run_id: str,
    prompt: str,
    model: str,
    response: str,
    tokens_input: int,
    tokens_output: int,
    latency_ms: int,
    status: Union[Status, str] = Status.SUCCESS,
    error: Optional[Dict[str, str]] = None,
    prompt_template_id: Optional[str] = None,
    model_version: Optional[str] = None,
    response_metadata: Optional[Dict[str, Any]] = None,
    tool_calls: Optional[List[Dict[str, Any]]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str:
```

**Returns:** Event ID

---

#### log_agent_step

```python
def log_agent_step(
    self,
    run_id: str,
    step_number: int,
    step_name: str,
    step_type: Union[StepType, str],
    input_data: Dict[str, Any],
    output_data: Dict[str, Any],
    latency_ms: int,
    status: Union[Status, str] = Status.SUCCESS,
    reasoning: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
    error: Optional[Dict[str, str]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str:
```

**Returns:** Event ID

---

#### log_error

```python
def log_error(
    self,
    run_id: str,
    error: Union[Exception, Dict[str, str]],
    context: Optional[Dict[str, Any]] = None,
    tags: Optional[List[str]] = None,
    user_id: Optional[str] = None,
    release: Optional[str] = None
) -> str:
```

**Returns:** Event ID

---

#### flush

```python
def flush(self) -> None:
```

Flushes all queued events to the API.

---

#### close

```python
def close(self) -> None:
```

Gracefully shuts down the client and flushes remaining events.

---

#### Context Manager Support

```python
def __enter__(self) -> 'WatchLLMClient':
    return self

def __exit__(self, exc_type, exc_val, exc_tb) -> None:
    self.close()
```

Usage:
```python
with WatchLLMClient(api_key="...", project_id="...") as watchllm:
    event_id = watchllm.log_prompt_call(...)
```

---

## Error Handling

### Node.js Exceptions

```typescript
try {
  await watchllm.flush();
} catch (error) {
  // HTTP errors, network timeouts, or JSON serialization errors
  console.error('Failed to flush:', error.message);
}
```

### Python Exceptions

```python
try:
    watchllm.flush()
except requests.exceptions.RequestException as e:
    # Network errors, timeouts
    print(f"Failed to flush: {e}")
except Exception as e:
    # Other errors
    print(f"Unexpected error: {e}")
```

---

## Type Compatibility

Both SDKs support the same data types:

| JavaScript/TypeScript | Python | Notes |
|----------------------|--------|-------|
| `string` | `str` | Text data |
| `number` | `int` / `float` | Numeric values |
| `boolean` | `bool` | True/false |
| `Record<string, any>` | `Dict[str, Any]` | Objects/dicts |
| `any[]` | `List[Any]` | Arrays/lists |
| `Date.toISOString()` | `datetime.isoformat()` | Timestamps (ISO 8601) |

---

## Pricing Calculation

Both SDKs use identical pricing models for cost estimation:

```typescript
// Node.js pricing model
const pricing = {
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
};

// Cost formula: (input_tokens * input_price + output_tokens * output_price) / 1000
```

```python
# Python pricing model (identical)
pricing = {
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "gpt-4o-mini": {"input": 0.00015, "output": 0.0006},
    "gpt-3.5-turbo": {"input": 0.0005, "output": 0.0015},
    "gpt-4-turbo": {"input": 0.01, "output": 0.03},
    "claude-3-5-sonnet-20241022": {"input": 0.003, "output": 0.015},
}

# Cost formula: (input_tokens * input_price + output_tokens * output_price) / 1000
```

For unlisted models, defaults are used:
- GPT-4 variants: `{input: 0.03, output: 0.06}`
- Other models: `{input: 0.001, output: 0.002}`

---

## Support and Resources

- **Node.js Documentation**: [DOCUMENTATION.md](sdk-node/DOCUMENTATION.md)
- **Python Documentation**: [DOCUMENTATION.md](sdk-python/DOCUMENTATION.md)
- **SDK Comparison**: [SDK_COMPARISON.md](SDK_COMPARISON.md)
- **GitHub**: https://github.com/watchllm/watchllm
- **Issues**: https://github.com/watchllm/watchllm/issues
