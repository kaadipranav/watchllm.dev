# ConfigCat Feature Flag Configuration Guide

This document explains how to set up and manage feature flags for WatchLLM using ConfigCat.

## Quick Start

### 1. Create ConfigCat Account

1. Go to [https://app.configcat.com/](https://app.configcat.com/)
2. Sign up for a free account
3. Create a new product named "WatchLLM"
4. Create two configs: "Dashboard" and "Worker"

### 2. Get SDK Keys

1. In ConfigCat dashboard, go to your product
2. Click on "SDK Keys" in the left sidebar
3. Copy the SDK key for each config
4. Add to environment variables:
   - Dashboard: `CONFIGCAT_SDK_KEY=<your-dashboard-sdk-key>`
   - Worker: `CONFIGCAT_SDK_KEY=<your-worker-sdk-key>` (via `wrangler secret put`)

### 3. Create Feature Flags

Create the following boolean feature flags in your ConfigCat dashboard:

#### Dashboard Flags

| Flag Key | Default Value | Description |
|----------|---------------|-------------|
| `guardianMode` | `false` | Enable AI-powered hallucination detection and assertion validation |
| `advancedAnalytics` | `true` | Enable advanced analytics features and visualizations |
| `costForecasting` | `false` | Enable predictive cost analysis and budget alerts |
| `anomalyDetection` | `false` | Enable real-time anomaly alerts for unusual patterns |
| `exportFeatures` | `true` | Enable CSV/JSON export of logs and analytics |
| `webhooks` | `false` | Enable custom webhook notifications for events |
| `teamCollaboration` | `false` | Enable multi-user project access and roles |

#### Worker Flags

| Flag Key | Default Value | Description |
|----------|---------------|-------------|
| `guardianMode` | `false` | Enable AI-powered validation and hallucination detection |
| `rateLimiting` | `true` | Enforce usage quotas and rate limits |
| `costAlerts` | `false` | Enable real-time cost threshold monitoring |
| `advancedCaching` | `false` | Enable enhanced semantic caching strategies |
| `debugLogging` | `false` | Enable verbose logging for troubleshooting |
| `maintenanceMode` | `false` | Disable non-critical features during maintenance |

## Usage Examples

### Dashboard (Server Components)

```typescript
import { isFeatureEnabled, FeatureFlags } from '@/lib/feature-flags';

export default async function AnalyticsPage() {
  const advancedEnabled = await isFeatureEnabled(
    FeatureFlags.ADVANCED_ANALYTICS,
    false // default value
  );

  return (
    <div>
      {advancedEnabled && (
        <AdvancedAnalyticsDashboard />
      )}
      <BasicAnalyticsDashboard />
    </div>
  );
}
```

### Worker

```typescript
import { createWorkerFeatureFlagClient, isWorkerFeatureEnabled, WorkerFeatureFlags } from './lib/feature-flags';

export default {
  async fetch(request: Request, env: Env) {
    const featureFlagClient = createWorkerFeatureFlagClient(env.CONFIGCAT_SDK_KEY);
    
    const guardianEnabled = await isWorkerFeatureEnabled(
      featureFlagClient,
      WorkerFeatureFlags.GUARDIAN_MODE,
      false
    );

    if (guardianEnabled) {
      // Perform hallucination detection
    }

    featureFlagClient.dispose();
    // ...rest of handler
  }
}
```

## Targeting & Rollouts

ConfigCat supports:

1. **Percentage Rollouts**: Gradually roll out features to X% of users
2. **User Targeting**: Enable features for specific user IDs
3. **Segment Targeting**: Target based on user attributes (email domain, plan, etc.)

### Example: Progressive Rollout

```typescript
// Enable feature for 10% of users
const userId = user.id;
const enabled = await isFeatureEnabled(
  FeatureFlags.GUARDIAN_MODE,
  false,
  userId // Used for consistent hashing in percentage rollouts
);
```

### Example: Plan-Based Targeting

In ConfigCat dashboard:
1. Create a user attribute: `plan` (text)
2. Add targeting rule: If `plan` equals "pro", then `true`
3. In code:

```typescript
const client = getFeatureFlagClient();
const enabled = await client.getValueAsync(
  FeatureFlags.TEAM_COLLABORATION,
  false,
  {
    identifier: user.id,
    custom: {
      plan: user.plan, // "starter" or "pro"
      email: user.email,
    }
  }
);
```

## Best Practices

1. **Default to False**: New features should default to `false` until ready
2. **Use Descriptive Names**: Feature flag keys should be clear and self-documenting
3. **Clean Up Old Flags**: Remove unused flags after features are stable
4. **Monitor Usage**: Track which flags are actively checked in code
5. **Test Both States**: Always test code with flag enabled AND disabled
6. **Graceful Degradation**: Ensure app works when ConfigCat is unavailable

## Deployment Workflow

### Development
```bash
# Dashboard
CONFIGCAT_SDK_KEY=your-dev-sdk-key pnpm dev

# Worker
# Add to .dev.vars
echo "CONFIGCAT_SDK_KEY=your-dev-sdk-key" >> worker/.dev.vars
pnpm dev --prefix worker
```

### Production
```bash
# Dashboard (Vercel)
vercel env add CONFIGCAT_SDK_KEY

# Worker (Cloudflare)
cd worker
wrangler secret put CONFIGCAT_SDK_KEY
# Enter your production SDK key when prompted
```

## Testing Feature Flags

### Manual Testing
1. Go to [ConfigCat dashboard](https://app.configcat.com/)
2. Toggle a feature flag
3. Wait ~1 minute for polling to pick up changes (or force refresh)
4. Verify feature appears/disappears in UI

### Automated Testing
```typescript
// Mock ConfigCat in tests
jest.mock('configcat-js-ssr', () => ({
  getClient: jest.fn().mockReturnValue({
    getValueAsync: jest.fn().mockResolvedValue(true),
    forceRefreshAsync: jest.fn(),
    dispose: jest.fn(),
  }),
}));
```

## Troubleshooting

### Flag Not Updating
- Check polling interval (default: 60s)
- Force refresh: `await refreshFeatureFlags()`
- Verify SDK key is correct
- Check ConfigCat dashboard for flag status

### Missing SDK Key
- App will use demo key in development
- All flags will default to their default values
- Check environment variables are set correctly

### Performance Concerns
- ConfigCat caches flags locally
- Minimal network overhead (60s polling interval)
- Consider ManualPoll mode for Workers to control timing

## Cost Optimization

ConfigCat free tier includes:
- ✅ Unlimited feature flags
- ✅ Unlimited config fetches
- ✅ 1000 MAU (Monthly Active Users)
- ✅ 30-day flag history

For higher usage, consider:
- Pro plan: $39/mo for 10K MAU
- Enterprise: Custom pricing

## Resources

- [ConfigCat Documentation](https://configcat.com/docs/)
- [Node.js SDK Reference](https://configcat.com/docs/sdk-reference/node/)
- [Best Practices](https://configcat.com/blog/feature-flag-best-practices/)
- [Targeting Examples](https://configcat.com/docs/advanced/targeting/)
