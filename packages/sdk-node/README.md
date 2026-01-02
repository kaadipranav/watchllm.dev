# WatchLLM Node.js SDK

TypeScript/Node.js SDK for the WatchLLM AI Observability platform.

## Installation

```bash
npm install watchllm-sdk-node
```

## Quick Start

```typescript
import { init, Status, StepType } from 'watchllm-sdk-node';

// Initialize the client
const watchllm = init({
  apiKey: 'your-api-key',
  projectId: 'your-project-id',
  environment: 'production',
});

// Log a prompt call
const eventId = watchllm.logPromptCall({
  runId: 'run-123',
  prompt: 'What is the capital of France?',
  model: 'gpt-4o-mini',
  response: 'The capital of France is Paris.',
  tokensInput: 8,
  tokensOutput: 7,
  latencyMs: 342,
  status: Status.SUCCESS,
  tags: ['production', 'chat'],
});

// Log an agent step
watchllm.logAgentStep({
  runId: 'run-123',
  stepNumber: 1,
  stepName: 'Analyze Query',
  stepType: StepType.REASONING,
  inputData: { query: 'user question' },
  outputData: { analysis: 'needs search' },
  latencyMs: 150,
  reasoning: 'Query requires external knowledge',
});

// Log an error
watchllm.logError({
  runId: 'run-123',
  error: new Error('API timeout'),
  context: { provider: 'openai', model: 'gpt-4' },
});

// Flush events manually (optional - auto-flushes on batch size or interval)
await watchllm.flush();

// Close the client (flushes remaining events)
await watchllm.close();
```

## Configuration

```typescript
const client = init({
  apiKey: string;              // Required: Your WatchLLM API key
  projectId: string;           // Required: Your project ID
  baseUrl?: string;            // Optional: API base URL (default: https://proxy.watchllm.dev/v1)
  environment?: string;        // Optional: Environment name (default: 'development')
  sampleRate?: number;         // Optional: Sampling rate 0.0-1.0 (default: 1.0)
  redactPII?: boolean;         // Optional: Auto-redact PII (default: true)
  batchSize?: number;          // Optional: Batch size before auto-flush (default: 10)
  flushIntervalSeconds?: number; // Optional: Auto-flush interval (default: 5)
  timeout?: number;            // Optional: Request timeout in ms (default: 30000)
});
```

## API Reference

### logPromptCall(params)

Log an LLM prompt call event.

**Parameters:**
- `runId` (string): Unique run identifier
- `prompt` (string): The input prompt
- `model` (string): Model name (e.g., 'gpt-4o-mini')
- `response` (string): Model response
- `tokensInput` (number): Input token count
- `tokensOutput` (number): Output token count
- `latencyMs` (number): Request latency in milliseconds
- `status` (Status | string, optional): Request status (default: SUCCESS)
- `error` (object, optional): Error details
- `promptTemplateId` (string, optional): Template identifier
- `modelVersion` (string, optional): Model version
- `responseMetadata` (object, optional): Additional response metadata
- `toolCalls` (ToolCallEvent[], optional): Associated tool calls
- `tags` (string[], optional): Event tags
- `userId` (string, optional): User identifier
- `release` (string, optional): Release version

**Returns:** Event ID (string)

### logAgentStep(params)

Log an agent step event.

**Parameters:**
- `runId` (string): Unique run identifier
- `stepNumber` (number): Step sequence number
- `stepName` (string): Step name/description
- `stepType` (StepType | string): Step type (REASONING, TOOL_CALL, VALIDATION, OUTPUT)
- `inputData` (object): Step input data
- `outputData` (object): Step output data
- `latencyMs` (number): Step duration in milliseconds
- `status` (Status | string, optional): Step status
- `reasoning` (string, optional): Agent reasoning
- `context` (object, optional): Additional context
- `error` (object, optional): Error details
- `tags` (string[], optional): Event tags
- `userId` (string, optional): User identifier
- `release` (string, optional): Release version

**Returns:** Event ID (string)

### logError(params)

Log an error event.

**Parameters:**
- `runId` (string): Unique run identifier
- `error` (Error | object): Error object or error details
- `context` (object, optional): Error context
- `tags` (string[], optional): Event tags
- `userId` (string, optional): User identifier
- `release` (string, optional): Release version

**Returns:** Event ID (string)

### flush()

Manually flush queued events to the API.

**Returns:** Promise<void>

### close()

Close the client and flush all remaining events.

**Returns:** Promise<void>

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

- **Automatic Batching**: Events are automatically batched and sent to reduce network overhead
- **Retry Logic**: Built-in retry mechanism with exponential backoff
- **PII Redaction**: Automatically redacts emails and credit card numbers
- **Sampling**: Control data volume with configurable sampling rates
- **Type Safety**: Full TypeScript support with type definitions
- **Cost Estimation**: Automatic cost calculation for common LLM providers

## Best Practices

1. **Use a single client instance** per application for optimal batching
2. **Set appropriate batch sizes** based on your event volume
3. **Always call close()** when shutting down to ensure events are flushed
4. **Use meaningful run IDs** to group related events together
5. **Add tags** for easier filtering and analysis
6. **Set the environment** to distinguish between dev/staging/production

## Example: Integration with OpenAI

```typescript
import OpenAI from 'openai';
import { init, Status } from 'watchllm-sdk-node';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const watchllm = init({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  environment: 'production',
});

async function chat(prompt: string) {
  const runId = `chat-${Date.now()}`;
  const startTime = Date.now();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - startTime;
    const message = response.choices[0].message.content || '';

    // Log to WatchLLM
    watchllm.logPromptCall({
      runId,
      prompt,
      model: 'gpt-4o-mini',
      response: message,
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      latencyMs,
      status: Status.SUCCESS,
      responseMetadata: {
        finish_reason: response.choices[0].finish_reason,
      },
    });

    return message;
  } catch (error) {
    // Log error to WatchLLM
    watchllm.logError({
      runId,
      error: error as Error,
      context: { model: 'gpt-4o-mini' },
    });
    throw error;
  }
}

// Don't forget to close when your app shuts down
process.on('SIGTERM', async () => {
  await watchllm.close();
  process.exit(0);
});
```

## License

MIT
