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

## Advanced Analytics

### Cost Forecasting
WatchLLM uses historical usage patterns to predict your end-of-month spend. This helps in budgeting and avoiding surprises.

### A/B Testing Results
If you have A/B testing enabled for a project, the analytics dashboard will show:
- **Variant Performance**: Cost and latency comparison between different models.
- **Significance**: Statistical confidence in the performance difference.

### Anomaly Detection
The system automatically flags unusual spikes in cost or request volume. This is often an indicator of bot abuse or infinite loops in your application logic.

## Exporting Data
You can export your raw usage logs as CSV for custom analysis in Excel or Google Sheets. Navigate to the **Projects > [Project Name] > Logs** tab to generate an export.

## Setting Up Alerts
Configure cost and usage alerts in your Project Settings to receive notifications via email or webhook when certain thresholds are reached.

