# WatchLLM Node.js SDK Documentation

> **TypeScript/Node.js SDK for AI Observability and LLM Monitoring**

Complete SDK for instrumenting Node.js applications with WatchLLM's semantic caching and cost optimization layer. Monitor LLM calls, agent steps, errors, and performance metrics with automatic PII redaction and intelligent batching.

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
- Node.js 14+
- TypeScript 4.5+ (for TypeScript support)

### NPM

```bash
npm install watchllm-sdk-node
```

### Yarn

```bash
yarn add watchllm-sdk-node
```

### pnpm

```bash
pnpm add watchllm-sdk-node
```

---

## Quick Start

### Basic Setup

```typescript
import { WatchLLMClient, EventType, Status } from 'watchllm-sdk-node';

// Initialize the client
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
});

// Log a prompt call
const eventId = watchllm.logPromptCall({
  runId: 'run-123',
  prompt: 'What is machine learning?',
  model: 'gpt-4o',
  response: 'Machine learning is a subset of AI...',
  tokensInput: 12,
  tokensOutput: 45,
  latencyMs: 1250,
  status: Status.SUCCESS,
});

// Flush events before shutdown
await watchllm.close();
```

### With Express.js

```typescript
import express from 'express';
import { WatchLLMClient, Status } from 'watchllm-sdk-node';

const app = express();
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
});

// Middleware to track requests
app.post('/api/chat', async (req, res) => {
  const runId = req.headers['x-run-id'] as string || 'run-' + Date.now();
  const startTime = Date.now();

  try {
    // Your LLM logic here
    const response = await callOpenAI(req.body.prompt);

    watchllm.logPromptCall({
      runId,
      prompt: req.body.prompt,
      model: 'gpt-4o',
      response: response.text,
      tokensInput: response.usage.prompt_tokens,
      tokensOutput: response.usage.completion_tokens,
      latencyMs: Date.now() - startTime,
      status: Status.SUCCESS,
    });

    res.json(response);
  } catch (error) {
    watchllm.logError({
      runId,
      error: error as Error,
      context: { endpoint: '/api/chat' },
    });
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await watchllm.close();
  process.exit(0);
});
```

---

## Configuration

### WatchLLMConfig Interface

```typescript
interface WatchLLMConfig {
  // Required
  apiKey: string;           // Your WatchLLM API key
  projectId: string;        // Your project ID

  // Optional
  baseUrl?: string;         // Default: 'https://proxy.watchllm.dev/v1'
  environment?: string;     // Default: 'development'
  sampleRate?: number;      // Default: 1.0 (0.0 - 1.0)
  redactPII?: boolean;      // Default: true
  batchSize?: number;       // Default: 10 (events per batch)
  flushIntervalSeconds?: number; // Default: 5
  timeout?: number;         // Default: 30000 (ms)
}
```

### Environment Variables

It's recommended to use environment variables for sensitive configuration:

```bash
WATCHLLM_API_KEY=<your-api-key>
WATCHLLM_PROJECT_ID=<your-project-id>
WATCHLLM_ENVIRONMENT=production
WATCHLLM_SAMPLE_RATE=1.0
```

Load them in your code:

```typescript
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  environment: process.env.WATCHLLM_ENVIRONMENT || 'development',
  sampleRate: parseFloat(process.env.WATCHLLM_SAMPLE_RATE || '1.0'),
});
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

```typescript
enum Status {
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  ASSERTION_FAILED = 'assertion_failed',
  WARNING = 'warning',
}
```

### Batching and Flushing

The SDK automatically batches events for efficiency:

- **Automatic flushing**: Triggered when batch size is reached or flush interval elapses
- **Manual flushing**: Call `await watchllm.flush()` before critical operations
- **Graceful shutdown**: Call `await watchllm.close()` to ensure all events are sent

```typescript
// Manual flush
await watchllm.flush();

// Graceful shutdown
await watchllm.close();
```

### PII Redaction

By default, the SDK automatically redacts:
- Email addresses
- Credit card numbers
- You can disable this with `redactPII: false` if needed

```typescript
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY,
  projectId: process.env.WATCHLLM_PROJECT_ID,
  redactPII: false, // Disable redaction
});
```

---

## API Reference

### WatchLLMClient

#### Constructor

```typescript
constructor(config: WatchLLMConfig)
```

Creates a new WatchLLM client instance with automatic event batching and flushing.

#### Methods

### logPromptCall

Logs a language model API call with tokens and cost information.

```typescript
logPromptCall(params: {
  runId: string;
  prompt: string;
  model: string;
  response: string;
  tokensInput: number;
  tokensOutput: number;
  latencyMs: number;
  
  // Optional
  status?: Status | string;
  error?: { message: string; type?: string; stack?: string };
  promptTemplateId?: string;
  modelVersion?: string;
  responseMetadata?: Record<string, any>;
  toolCalls?: ToolCallEvent[];
  tags?: string[];
  userId?: string;
  release?: string;
}): string // Returns eventId
```

**Example:**

```typescript
const eventId = watchllm.logPromptCall({
  runId: 'run-abc-123',
  prompt: 'Summarize this article: ...',
  model: 'gpt-4o',
  response: 'The article discusses...',
  tokensInput: 150,
  tokensOutput: 200,
  latencyMs: 2500,
  status: Status.SUCCESS,
  tags: ['summarization', 'article'],
  userId: 'user-456',
  release: '1.2.0',
});
```

---

### logAgentStep

Logs a step in an agentic workflow.

```typescript
logAgentStep(params: {
  runId: string;
  stepNumber: number;
  stepName: string;
  stepType: StepType | string;
  inputData: Record<string, any>;
  outputData: Record<string, any>;
  latencyMs: number;
  
  // Optional
  status?: Status | string;
  reasoning?: string;
  context?: Record<string, any>;
  error?: { message: string; type?: string; stack?: string };
  tags?: string[];
  userId?: string;
  release?: string;
}): string // Returns eventId
```

**Example:**

```typescript
const stepEventId = watchllm.logAgentStep({
  runId: 'run-xyz-789',
  stepNumber: 1,
  stepName: 'Research Phase',
  stepType: 'reasoning',
  inputData: { query: 'climate change solutions' },
  outputData: { findings: [...] },
  reasoning: 'Searched for relevant research papers and compiled findings',
  latencyMs: 5000,
  status: Status.SUCCESS,
  context: { model: 'gpt-4o', temperature: 0.7 },
});
```

---

### logError

Logs an error or exception that occurred during execution.

```typescript
logError(params: {
  runId: string;
  error: Error | { message: string; type?: string; stack?: string };
  
  // Optional
  context?: Record<string, any>;
  tags?: string[];
  userId?: string;
  release?: string;
}): string // Returns eventId
```

**Example:**

```typescript
try {
  // Some operation
  await callLLM();
} catch (error) {
  watchllm.logError({
    runId: 'run-123',
    error: error as Error,
    context: {
      operation: 'callLLM',
      retryAttempt: 2,
    },
    tags: ['error', 'openai'],
  });
}
```

---

### flush

Manually flush all queued events to the API.

```typescript
flush(): Promise<void>
```

**Example:**

```typescript
// Before a critical operation
await watchllm.flush();

// Or periodically
setInterval(() => watchllm.flush(), 30000); // Every 30 seconds
```

---

### close

Gracefully shutdown the client, flushing all remaining events.

```typescript
close(): Promise<void>
```

**Example:**

```typescript
// On application shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await watchllm.close();
  process.exit(0);
});
```

---

## Usage Examples

### Example 1: OpenAI Integration

```typescript
import OpenAI from 'openai';
import { WatchLLMClient, Status } from 'watchllm-sdk-node';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
});

async function generateContent(prompt: string): Promise<string> {
  const runId = 'run-' + Date.now();
  const startTime = Date.now();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content || '';
    const latencyMs = Date.now() - startTime;

    watchllm.logPromptCall({
      runId,
      prompt,
      model: 'gpt-4o',
      response,
      tokensInput: completion.usage?.prompt_tokens || 0,
      tokensOutput: completion.usage?.completion_tokens || 0,
      latencyMs,
      status: Status.SUCCESS,
    });

    return response;
  } catch (error) {
    watchllm.logError({
      runId,
      error: error as Error,
      context: { model: 'gpt-4o', prompt },
    });
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await watchllm.close();
  process.exit(0);
});
```

---

### Example 2: Agent Workflow

```typescript
import { WatchLLMClient, Status, StepType } from 'watchllm-sdk-node';

const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
});

async function runResearchAgent(topic: string) {
  const runId = 'agent-run-' + Date.now();

  try {
    // Step 1: Research
    const researchStart = Date.now();
    const research = await performWebSearch(topic);
    watchllm.logAgentStep({
      runId,
      stepNumber: 1,
      stepName: 'Web Search',
      stepType: 'tool_call',
      inputData: { query: topic },
      outputData: { results: research },
      latencyMs: Date.now() - researchStart,
      status: Status.SUCCESS,
    });

    // Step 2: Analysis
    const analysisStart = Date.now();
    const analysis = await analyzeResults(research);
    watchllm.logAgentStep({
      runId,
      stepNumber: 2,
      stepName: 'Analysis',
      stepType: 'reasoning',
      inputData: { research },
      outputData: { analysis },
      latencyMs: Date.now() - analysisStart,
      status: Status.SUCCESS,
      reasoning: 'Synthesized search results into coherent insights',
    });

    // Step 3: Summarization
    const summaryStart = Date.now();
    const summary = await generateSummary(analysis);
    watchllm.logAgentStep({
      runId,
      stepNumber: 3,
      stepName: 'Summary Generation',
      stepType: 'output',
      inputData: { analysis },
      outputData: { summary },
      latencyMs: Date.now() - summaryStart,
      status: Status.SUCCESS,
    });

    return summary;
  } catch (error) {
    watchllm.logError({
      runId,
      error: error as Error,
      context: { topic },
      tags: ['agent', 'research'],
    });
    throw error;
  }
}
```

---

### Example 3: Error Handling with Context

```typescript
import { WatchLLMClient, Severity } from 'watchllm-sdk-node';

const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  environment: 'production',
});

async function processRequest(userId: string, request: any) {
  const runId = `request-${userId}-${Date.now()}`;

  try {
    // Your business logic
    return await executeBusinessLogic(request);
  } catch (error) {
    // Log with rich context
    await watchllm.logError({
      runId,
      error: error as Error,
      context: {
        userId,
        requestId: request.id,
        requestType: request.type,
        timestamp: new Date().toISOString(),
      },
      tags: ['error', 'processing', 'user-request'],
      userId,
    });

    // Ensure error is sent before handling
    await watchllm.flush();
    throw error;
  }
}
```

---

## Best Practices

### 1. **Use Consistent Run IDs**

Use consistent `runId` to correlate all events from a single execution:

```typescript
// Good: Single run ID for entire workflow
const runId = `workflow-${Date.now()}`;

watchllm.logPromptCall({ runId, ... });
watchllm.logAgentStep({ runId, ... });
watchllm.logPromptCall({ runId, ... });
```

### 2. **Tag Events for Better Filtering**

Use meaningful tags to organize and filter events:

```typescript
watchllm.logPromptCall({
  runId,
  tags: ['customer-support', 'urgent', 'gpt-4'],
  // ...
});
```

### 3. **Include User Context**

Track which user triggered an event for better debugging:

```typescript
watchllm.logPromptCall({
  runId,
  userId: req.user.id,
  // ...
});
```

### 4. **Set Appropriate Sample Rates for High-Volume Applications**

For high-traffic applications, use sampling to reduce costs:

```typescript
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  sampleRate: 0.1, // Log only 10% of events
});
```

### 5. **Always Gracefully Shutdown**

Ensure events are flushed before process termination:

```typescript
const gracefulShutdown = async () => {
  console.log('Flushing remaining events...');
  await watchllm.close();
  console.log('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
```

### 6. **Monitor Batch Configuration**

Adjust batch size and flush interval based on your event volume:

```typescript
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  batchSize: 50,           // Higher for high volume
  flushIntervalSeconds: 10, // Longer for less frequent flushing
});
```

### 7. **Use TypeScript for Type Safety**

Leverage TypeScript enums and types:

```typescript
import {
  WatchLLMClient,
  EventType,
  Status,
  StepType,
  Severity,
} from 'watchllm-sdk-node';

const eventId = watchllm.logPromptCall({
  runId,
  status: Status.SUCCESS, // Autocomplete
  // ...
});
```

---

## Troubleshooting

### Events Not Being Sent

**Problem:** Events are queued but not being delivered to the API.

**Solutions:**
1. Verify your `apiKey` and `projectId` are correct
2. Check that `await watchllm.close()` is called before process exit
3. Verify network connectivity to `https://proxy.watchllm.dev`
4. Check server logs for errors: `console.error()` messages

```typescript
// Add error handling
watchllm.flush().catch((error) => {
  console.error('Failed to flush events:', error);
});
```

### High Memory Usage

**Problem:** The SDK is consuming significant memory.

**Solutions:**
1. Reduce `batchSize` (default is 10)
2. Increase `flushIntervalSeconds` (default is 5)
3. Use `sampleRate` to reduce event volume
4. Check for event queue backlog

### Timeout Errors

**Problem:** Events are timing out when sending to the API.

**Solutions:**
1. Increase `timeout` setting (default is 30000ms)
2. Check network latency to the proxy
3. Verify API key has proper permissions
4. Reduce batch size for smaller payloads

```typescript
const watchllm = new WatchLLMClient({
  apiKey: process.env.WATCHLLM_API_KEY!,
  projectId: process.env.WATCHLLM_PROJECT_ID!,
  timeout: 60000, // Increase to 60 seconds
});
```

### PII Not Being Redacted

**Problem:** Sensitive data is appearing in events.

**Solutions:**
1. Ensure `redactPII: true` (default)
2. For custom PII patterns, manually sanitize before logging
3. Check redaction patterns in source code

```typescript
// Manual redaction
const sanitize = (data: string) => {
  return data
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
    .replace(/\b\d{16}\b/g, '[REDACTED_CC]');
};

watchllm.logPromptCall({
  runId,
  prompt: sanitize(prompt),
  // ...
});
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
