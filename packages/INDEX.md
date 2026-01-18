# WatchLLM SDK Documentation - Complete Index

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Status**: ✅ Complete

---

## 🎯 Start Here

New to WatchLLM SDKs? Start with one of these:

1. **Just want to code?** → [Quick Reference](QUICK_REFERENCE.md) (2 min read)
2. **Building with Node.js?** → [Node.js Documentation](sdk-node/DOCUMENTATION.md) (15 min read)
3. **Building with Python?** → [Python Documentation](sdk-python/DOCUMENTATION.md) (15 min read)
4. **Choosing between SDKs?** → [SDK Comparison](SDK_COMPARISON.md) (10 min read)
5. **Need detailed types?** → [Type Reference](TYPE_REFERENCE.md) (20 min read)

---

## 📚 Complete Documentation

### SDK Guides (Get Started)

| Document | Purpose | Read Time |
|----------|---------|-----------|
| [Quick Reference](QUICK_REFERENCE.md) | Fast lookup for common operations | 2-3 min |
| [Node.js Documentation](sdk-node/DOCUMENTATION.md) | Complete Node.js/TypeScript guide | 15-20 min |
| [Python Documentation](sdk-python/DOCUMENTATION.md) | Complete Python guide | 15-20 min |
| [SDK Comparison](SDK_COMPARISON.md) | Compare Node.js vs Python SDKs | 10-15 min |

### Reference Materials (Look Things Up)

| Document | Purpose | Use When |
|----------|---------|----------|
| [Type Reference](TYPE_REFERENCE.md) | All types, enums, interfaces | Need exact API signatures |
| [Main README](README.md) | Feature overview, quick start | Want high-level overview |
| [This Index](INDEX.md) | Navigation guide | Navigating documentation |

---

## 🚀 Getting Started by Use Case

### I want to log LLM calls

**Node.js**
```typescript
watchllm.logPromptCall({
  runId: 'run-1',
  prompt: 'Your prompt',
  model: 'gpt-4o',
  response: 'Model response',
  tokensInput: 10,
  tokensOutput: 50,
  latencyMs: 2000
});
```

**Python**
```python
watchllm.log_prompt_call(
    run_id='run-1',
    prompt='Your prompt',
    model='gpt-4o',
    response='Model response',
    tokens_input=10,
    tokens_output=50,
    latency_ms=2000
)
```

👉 See [Quick Reference - Log Prompt Call](QUICK_REFERENCE.md#log-prompt-call)

---

### I want to log agent steps

**Node.js**
```typescript
watchllm.logAgentStep({
  runId: 'run-1',
  stepNumber: 1,
  stepName: 'Research',
  stepType: StepType.REASONING,
  inputData: { query: 'topic' },
  outputData: { findings: [...] },
  latencyMs: 5000
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
    latency_ms=5000
)
```

👉 See [Quick Reference - Log Agent Step](QUICK_REFERENCE.md#log-agent-step)

---

### I want to capture errors

**Node.js**
```typescript
try {
  await operation();
} catch (error) {
  watchllm.logError({
    runId: 'run-1',
    error: error as Error,
    context: { operation: 'operation_name' }
  });
}
```

**Python**
```python
try:
    operation()
except Exception as e:
    watchllm.log_error(
        run_id='run-1',
        error=e,
        context={'operation': 'operation_name'}
    )
```

👉 See [Quick Reference - Log Error](QUICK_REFERENCE.md#log-error)

---

### I want to integrate with OpenAI

👉 See [SDK Documentation - OpenAI Integration](sdk-node/DOCUMENTATION.md#example-1-openai-integration) (Node.js) or [SDK Documentation - OpenAI Integration](sdk-python/DOCUMENTATION.md#example-1-openai-integration) (Python)

---

### I want to integrate with Express.js

👉 See [SDK Documentation - Express.js Example](sdk-node/DOCUMENTATION.md#example-2-agent-workflow) (Node.js only)

---

### I want to integrate with FastAPI

👉 See [SDK Documentation - FastAPI Example](sdk-python/DOCUMENTATION.md#example-2-agent-workflow) (Python only)

---

### I want to optimize for high-volume

👉 See [Performance Optimization](README.md#-performance-optimization)

---

### I want to enable/disable PII redaction

**Node.js**
```typescript
new WatchLLMClient({
  redactPII: false,  // Default: true
  ...
});
```

**Python**
```python
WatchLLMClient(
    redact_pii=False,  # Default: True
    ...
)
```

👉 See [Type Reference - PII Redaction](TYPE_REFERENCE.md#pii-redaction)

---

## 📊 Feature Matrix

| Feature | Node.js | Python | Reference |
|---------|---------|--------|-----------|
| Prompt logging | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#logpromptcall) |
| Agent steps | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#logagentstep) |
| Error logging | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#logerror) |
| Automatic batching | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#batching-and-flushing) |
| PII redaction | ✅ | ✅ | [Docs](TYPE_REFERENCE.md#pii-redaction) |
| Event sampling | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#set-appropriate-sample-rates-for-high-volume-applications) |
| Manual flush | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#flush) |
| Graceful shutdown | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#close) |
| Context manager | ❌ | ✅ | [Docs](sdk-python/DOCUMENTATION.md#use-context-managers-for-cleanup) |
| Async/await | ✅ | ✅* | [Comparison](SDK_COMPARISON.md#asyncawait-handling) |
| Automatic retry | ❌ | ✅ | [Comparison](SDK_COMPARISON.md#feature-matrix) |
| TypeScript types | ✅ | ✅ | [Docs](sdk-node/DOCUMENTATION.md#use-typescript-for-type-safety) |

---

## 🔧 Configuration Reference

### Required Settings

Both SDKs require:
- `apiKey` - Your WatchLLM API key
- `projectId` - Your project ID

👉 See [Type Reference - Configuration](TYPE_REFERENCE.md#client-configuration)

### Optional Settings

All defaults are reasonable, but you can customize:

| Setting | Default | Purpose |
|---------|---------|---------|
| `baseUrl` | Production endpoint | API endpoint |
| `environment` | `development` | Environment name |
| `sampleRate` | `1.0` | Event sampling (0-1) |
| `redactPII` | `true` | Auto-redact sensitive data |
| `batchSize` | `10` | Events per batch |
| `flushIntervalSeconds` | `5` | Batch flush interval |
| `timeout` | `30000` (Node.js) / `30` (Python) | Request timeout |

👉 See [Quick Reference - Configuration](QUICK_REFERENCE.md#-configuration)

---

## 🎓 Learning Path

### Beginner (30 minutes)
1. Read [Quick Reference](QUICK_REFERENCE.md) (5 min)
2. Read SDK-specific getting started (15 min)
3. Try basic example from documentation (10 min)

### Intermediate (1 hour)
1. Review [Type Reference](TYPE_REFERENCE.md) (20 min)
2. Study advanced examples in SDK docs (20 min)
3. Set up in your project (20 min)

### Advanced (2+ hours)
1. Read full SDK documentation (45 min)
2. Study integration examples (30 min)
3. Read [SDK Comparison](SDK_COMPARISON.md) (20 min)
4. Optimize configuration for your use case (20 min)

---

## 🆘 Troubleshooting Guide

### Problem: Events not being sent

**Quick Fixes**:
1. ✅ Verify `apiKey` and `projectId` are correct
2. ✅ Ensure `close()` is called before shutdown
3. ✅ Check network connectivity

👉 See [Node.js Troubleshooting](sdk-node/DOCUMENTATION.md#troubleshooting) or [Python Troubleshooting](sdk-python/DOCUMENTATION.md#troubleshooting)

---

### Problem: High memory usage

**Quick Fixes**:
1. ✅ Reduce `batchSize` 
2. ✅ Increase `flushIntervalSeconds`
3. ✅ Use `sampleRate` for high-volume

👉 See [Performance Tuning](QUICK_REFERENCE.md#-performance-tuning)

---

### Problem: Timeout errors

**Quick Fixes**:
1. ✅ Increase `timeout` setting
2. ✅ Check network latency
3. ✅ Reduce payload size

👉 See [Node.js Troubleshooting](sdk-node/DOCUMENTATION.md#timeout-errors) or [Python Troubleshooting](sdk-python/DOCUMENTATION.md#timeout-errors)

---

## 📈 Common Patterns

### Pattern: Consistent run IDs

Track all events from a single execution:

```typescript
const runId = `workflow-${Date.now()}`;
watchllm.logPromptCall({ runId, ... });
watchllm.logAgentStep({ runId, ... });
watchllm.logPromptCall({ runId, ... });
```

👉 See [Best Practices](sdk-node/DOCUMENTATION.md#1-use-consistent-run-ids)

---

### Pattern: Rich context tagging

Organize and filter events:

```typescript
watchllm.logPromptCall({
  tags: ['customer-support', 'urgent', 'gpt-4'],
  userId: 'user-123',
  release: '1.2.3',
  ...
});
```

👉 See [Best Practices](sdk-node/DOCUMENTATION.md#2-tag-events-for-better-filtering)

---

### Pattern: Error tracking

Capture rich error context:

```typescript
watchllm.logError({
  runId,
  error,
  context: {
    operation: 'name',
    userId: request.user.id,
    retryAttempt: 2
  },
  tags: ['error', 'critical']
});
```

👉 See [SDK Documentation - Error Handling](sdk-node/DOCUMENTATION.md#example-3-error-handling-with-context)

---

## 🔗 Cross-References

### By Event Type

- **PROMPT_CALL** - [PromptCallEvent](TYPE_REFERENCE.md#promptcallevent) | [Log Method](sdk-node/DOCUMENTATION.md#logpromptcall)
- **AGENT_STEP** - [AgentStepEvent](TYPE_REFERENCE.md#agentstepevnt) | [Log Method](sdk-node/DOCUMENTATION.md#logagentstep)
- **ERROR** - [ErrorEvent](TYPE_REFERENCE.md#errorevent) | [Log Method](sdk-node/DOCUMENTATION.md#logerror)
- **ASSERTION_FAILED** - [AssertionFailedEvent](TYPE_REFERENCE.md#assertionfailedevent) | Example: [Type Reference](TYPE_REFERENCE.md#assertionfailedevent)
- **HALLUCINATION_DETECTED** - [HallucinationDetectedEvent](TYPE_REFERENCE.md#hallucinationdetectedevent) | Example: [Type Reference](TYPE_REFERENCE.md#hallucinationdetectedevent)
- **PERFORMANCE_ALERT** - [PerformanceAlertEvent](TYPE_REFERENCE.md#performancealertevent) | Example: [Type Reference](TYPE_REFERENCE.md#performancealertevent)

---

### By Enum Type

- **EventType** - [Reference](TYPE_REFERENCE.md#eventtype) | [Usage](sdk-node/DOCUMENTATION.md#event-types)
- **Status** - [Reference](TYPE_REFERENCE.md#status) | [Usage](sdk-node/DOCUMENTATION.md#status-values)
- **StepType** - [Reference](TYPE_REFERENCE.md#steptype) | [Usage](sdk-node/DOCUMENTATION.md#core-concepts)
- **Severity** - [Reference](TYPE_REFERENCE.md#severity) | [Usage](sdk-node/DOCUMENTATION.md#core-concepts)
- **AlertType** - [Reference](TYPE_REFERENCE.md#alerttype) | [Usage](TYPE_REFERENCE.md#alerttype)
- **DetectionMethod** - [Reference](TYPE_REFERENCE.md#detectionmethod) | [Usage](TYPE_REFERENCE.md#detectionmethod)
- **AssertionType** - [Reference](TYPE_REFERENCE.md#assertiontype) | [Usage](TYPE_REFERENCE.md#assertiontype)

---

### By Language

- **Node.js / TypeScript** - [Documentation](sdk-node/DOCUMENTATION.md) | [Examples](sdk-node/DOCUMENTATION.md#usage-examples)
- **Python** - [Documentation](sdk-python/DOCUMENTATION.md) | [Examples](sdk-python/DOCUMENTATION.md#usage-examples)
- **Comparison** - [SDK Comparison](SDK_COMPARISON.md)

---

### By Framework

- **Express.js** - [Integration Example](sdk-node/DOCUMENTATION.md#with-expressjs) (Node.js)
- **FastAPI** - [Integration Example](sdk-python/DOCUMENTATION.md#with-fastapi) (Python)
- **OpenAI** - [Integration Example](QUICK_REFERENCE.md#-openai-integration)
- **Langchain** - [Integration Example](sdk-python/DOCUMENTATION.md#example-4-langchain-integration) (Python)

---

## 📖 Document Map

```
packages/
├── README.md                        ← Start here for overview
├── QUICK_REFERENCE.md              ← Fast lookup guide
├── SDK_COMPARISON.md               ← Compare Node.js vs Python
├── TYPE_REFERENCE.md               ← All types and interfaces
├── INDEX.md                        ← This file (navigation)
├── sdk-node/
│   ├── DOCUMENTATION.md            ← Node.js full guide
│   ├── src/                        ← Source code
│   └── ...
└── sdk-python/
    ├── DOCUMENTATION.md            ← Python full guide
    ├── src/                        ← Source code
    └── ...
```

---

## 🎯 Quick Decision Tree

```
Start here
    │
    ├─ "I just want code" → Quick Reference
    │
    ├─ "I'm building with Node.js" → Node.js Documentation
    │
    ├─ "I'm building with Python" → Python Documentation
    │
    ├─ "Should I use Node or Python?" → SDK Comparison
    │
    ├─ "I need exact type definitions" → Type Reference
    │
    └─ "I'm lost, help!" → Read README.md
```

---

## 📞 Support & Resources

| Resource | Purpose |
|----------|---------|
| **GitHub Issues** | Bug reports, feature requests |
| **Email** | General support (support@watchllm.dev) |
| **Website** | Product info, pricing (watchllm.dev) |
| **Documentation** | This folder (you're reading it!) |

---

## ✅ Documentation Checklist

- ✅ Quick Reference Guide (QUICK_REFERENCE.md)
- ✅ Node.js Full Documentation (sdk-node/DOCUMENTATION.md)
- ✅ Python Full Documentation (sdk-python/DOCUMENTATION.md)
- ✅ SDK Comparison Guide (SDK_COMPARISON.md)
- ✅ Type Reference (TYPE_REFERENCE.md)
- ✅ Package README (README.md)
- ✅ Documentation Index (INDEX.md)

---

## 🎓 Tips for Success

1. **Bookmark [Quick Reference](QUICK_REFERENCE.md)** - You'll reference it frequently
2. **Read your SDK's full documentation first** - Takes 15-20 minutes, saves hours later
3. **Study integration examples** - See how SDKs work in real code
4. **Use TypeScript/type hints** - Leverage IDE autocomplete
5. **Enable PII redaction** - Keep your data secure (default is on)
6. **Test graceful shutdown** - Ensure events are flushed on exit
7. **Monitor your batching** - Adjust for your event volume

---

## 📝 Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| Quick Reference | 1.0.0 | Jan 2026 |
| Node.js Documentation | 1.0.0 | Jan 2026 |
| Python Documentation | 1.0.0 | Jan 2026 |
| SDK Comparison | 1.0.0 | Jan 2026 |
| Type Reference | 1.0.0 | Jan 2026 |
| Main README | 1.0.0 | Jan 2026 |
| This Index | 1.0.0 | Jan 2026 |

---

## 🚀 Ready to Code?

Pick your language and get started:

### Node.js / TypeScript
```bash
npm install watchllm-sdk-node
```
👉 [Node.js Documentation](sdk-node/DOCUMENTATION.md)

### Python
```bash
pip install watchllm
```
👉 [Python Documentation](sdk-python/DOCUMENTATION.md)

---

**Happy monitoring! 🎉**

For questions, issues, or feedback: support@watchllm.dev
