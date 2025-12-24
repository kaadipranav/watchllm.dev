# Understanding Your Analytics

Monitor your AI usage, costs, and cache performance in real-time.

## Key Metrics

### Cache Hit Rate
The percentage of requests served from the semantic cache. A higher hit rate directly correlates to higher cost savings and lower latency.
- **Typical range**: 40-70% for repeat usage patterns.
- **Optimization tip**: Keep temperatures consistently low for repeatable tasks to improve cache hits.

### Potential Cost vs. Actual Cost
- **Potential Cost**: What you would have paid to the provider (e.g., OpenAI) without WatchLLM.
- **Actual Cost**: What you actually paid for non-cached requests.
- **Savings**: The difference between potential and actual cost.

### Latency
WatchLLM tracks the end-to-end latency of your requests.
- **Cache Hit Latency**: Typically <50ms.
- **Cache Miss Latency**: Provider latency + ~20ms overhead.

## BYOK Analytics

### Provider-Specific Tracking
When using Bring Your Own Key (BYOK), analytics are tracked separately for each provider:

- **Direct Provider Costs**: Monitor costs billed directly to your provider accounts
- **BYOK vs OpenRouter**: Compare performance and costs between BYOK and OpenRouter usage
- **Provider Distribution**: See which providers you're using most and optimize accordingly

### BYOK Cache Performance
- **Semantic Cache Hits**: Track how often BYOK requests benefit from semantic caching
- **Provider Latency**: Compare latency between direct provider access vs OpenRouter routing
- **Cost Transparency**: See exact costs per provider without intermediary fees

## Advanced Analytics

### Semantic Cache Insights
- **Similarity Scores**: View average semantic similarity scores for cache hits
- **Threshold Effectiveness**: Monitor how your semantic cache threshold affects hit rates
- **Prompt Patterns**: Identify which types of prompts cache best for optimization

### Cost Forecasting
WatchLLM uses historical usage patterns to predict your end-of-month spend. This helps in budgeting and avoiding surprises.

### A/B Testing Results
If you have A/B testing enabled for a project, the analytics dashboard will show:
- **Variant Performance**: Cost and latency comparison between different models.
- **Significance**: Statistical confidence in the performance difference.

### Anomaly Detection
The system automatically flags unusual spikes in cost or request volume. This is often an indicator of bot abuse or infinite loops in your application logic.

## Improving Your Hit Rates

To maximize the value of WatchLLM, consider the following strategies:

1. **Deterministic Prompts**: Use lower temperatures (e.g., 0-0.3) for extraction, summarization, or classification tasks.
2. **System Prompt Stability**: Keep your system prompts consistent across versions unless necessary. Minor wording changes can trigger cache misses.
3. **Threshold Tuning**: Adjust the `SEMANTIC_CACHE_THRESHOLD` in your project settings. A lower threshold (e.g., 0.85) is more permissive and increases hit rate but may result in less precise matches for creative tasks.
4. **Prompt Normalization**: WatchLLM handles whitespace and casing, but using consistent JSON structures or bulleted lists helps the semantic engine find better matches.
5. **BYOK Optimization**: With BYOK, you have full control over model selection. Use faster models for cache-friendly tasks and premium models only when needed.

## BYOK-Specific Optimization

### Provider Selection Strategy
- **Cost Optimization**: Use Groq for fast, cache-friendly tasks; reserve OpenAI/Anthropic for complex reasoning
- **Latency Optimization**: Choose geographically closer provider regions when possible
- **Cache-First Approach**: Route simple, repetitive tasks through cached models to maximize savings

### Multi-Provider Load Balancing
- **Automatic Routing**: Configure fallback providers for high-availability
- **Cost-Based Routing**: Automatically route to cheaper providers during peak hours
- **Performance-Based**: Route to fastest provider based on real-time latency metrics

## Exporting Data
You can export your raw usage logs as CSV for custom analysis in Excel or Google Sheets. Navigate to the **Projects > [Project Name] > Logs** tab to generate an export.

## Setting Up Alerts
Configure cost and usage alerts in your Project Settings to receive notifications via email or webhook when certain thresholds are reached.

### BYOK Alerts
- **Provider Limits**: Get notified when approaching provider rate limits or quotas
- **Cost Thresholds**: Set alerts for direct provider costs separate from WatchLLM fees
- **Performance Degradation**: Monitor for increased latency from specific providers
