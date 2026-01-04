# Monitoring & Error Tracking Guide

This document explains the monitoring and error tracking setup for WatchLLM using Sentry and Datadog.

## Table of Contents
- [Sentry Error Tracking](#sentry-error-tracking)
- [Datadog Observability](#datadog-observability)
- [Alert Configuration](#alert-configuration)
- [Best Practices](#best-practices)

---

## Sentry Error Tracking

### Overview

Sentry provides real-time error tracking and monitoring for both the Next.js dashboard and Cloudflare Worker.

**Components:**
- **Dashboard**: `@sentry/nextjs` with client and server monitoring
- **Worker**: `@sentry/cloudflare` for edge error tracking
- **Session Replay**: Recording user sessions when errors occur (dashboard only)

### Setup

#### 1. Create Sentry Account

1. Go to [https://sentry.io/signup/](https://sentry.io/signup/)
2. Create a new organization
3. Create two projects:
   - **watchllm-dashboard** (Platform: Next.js)
   - **watchllm-worker** (Platform: Cloudflare Workers)

#### 2. Get DSN Keys

1. In Sentry dashboard, go to **Settings** → **Projects**
2. Select each project and copy the DSN
3. Add to environment variables:

**Dashboard (.env.local):**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://public_key@sentry.io/project_id
```

**Worker (.dev.vars):**
```bash
SENTRY_DSN=https://public_key@sentry.io/project_id
```

**Production (Cloudflare):**
```bash
wrangler secret put SENTRY_DSN
# Enter your production DSN when prompted
```

#### 3. Configuration

**Dashboard Configuration** (`sentry.server.config.ts` & `sentry.client.config.ts`):
- ✅ Environment tracking (development/production)
- ✅ Release tracking (from package.json version)
- ✅ Sample rate: 100% dev, 10% production
- ✅ Session replay on errors
- ✅ PII filtering (cookies, sensitive data)
- ✅ Ignore common errors (browser extensions, network issues)

**Worker Configuration** (`worker/src/lib/sentry.ts`):
- ✅ Dynamic import for Cloudflare compatibility
- ✅ Graceful error handling (never blocks requests)
- ✅ Extra context capture

### Verification

#### Test Dashboard Sentry

1. **Start the development server:**
   ```bash
   cd dashboard
   pnpm dev
   ```

2. **Trigger a test error:**
   ```bash
   curl http://localhost:3000/api/debug-sentry
   ```

3. **Verify in Sentry:**
   - Go to [https://sentry.io/](https://sentry.io/)
   - Navigate to **Issues** tab
   - You should see: "🔴 Test error from debug-sentry endpoint"
   - Check tags: `endpoint: debug-sentry`, `intentional: true`
   - Verify environment and release information

#### Test Worker Sentry

1. **Add test error to worker handler:**
   ```typescript
   import { captureException } from './lib/sentry';
   
   // In your handler
   try {
     throw new Error("Test worker error");
   } catch (error) {
     await captureException(error, {
       extra: { endpoint: '/test', intentional: true }
     });
   }
   ```

2. **Deploy and test:**
   ```bash
   cd worker
   pnpm deploy
   curl https://your-worker.workers.dev/test-error
   ```

3. **Verify in Sentry dashboard**

### Features

#### 1. Error Grouping
Sentry automatically groups similar errors by:
- Error message
- Stack trace
- File path
- Function name

#### 2. Release Tracking
Track errors by version:
```typescript
// Automatically set from package.json version
release: process.env.npm_package_version
```

View errors by release in Sentry dashboard to identify regression.

#### 3. Session Replay
Dashboard only - records user sessions when errors occur:
- Replays user interactions leading to error
- Masks sensitive text and media
- Helps reproduce bugs

#### 4. Performance Monitoring
Track transaction performance:
```typescript
import * as Sentry from "@sentry/nextjs";

const transaction = Sentry.startTransaction({
  name: "API Call",
  op: "http",
});

try {
  // Your code
} finally {
  transaction.finish();
}
```

#### 5. Breadcrumbs
Automatic logging of events leading to errors:
- Console logs
- Network requests
- User clicks (dashboard)
- Navigation events

### Best Practices

1. **Sample Rates**
   - Development: 100% (catch all errors)
   - Production: 10-20% (reduce quota usage)
   - Use `tracesSampler` for fine-grained control

2. **Ignore Errors**
   - Browser extensions: `top.GLOBALS`
   - Network errors: `Failed to fetch`
   - React hydration: `Text content does not match`

3. **Add Context**
   ```typescript
   Sentry.captureException(error, {
     tags: { endpoint: '/api/users', userId: user.id },
     extra: { requestBody: body, headers: headers },
     user: { id: user.id, email: user.email },
   });
   ```

4. **Disable in Development** (optional)
   ```typescript
   // Only send to Sentry in production
   if (process.env.NODE_ENV === 'production') {
     Sentry.captureException(error);
   }
   ```

5. **Security**
   - Never send passwords or API keys
   - Filter cookies and auth tokens
   - Use `beforeSend` to sanitize data

---

## Datadog Observability

### Overview

Datadog provides infrastructure monitoring, APM (Application Performance Monitoring), and log aggregation.

**What Datadog Monitors:**
- Server metrics (CPU, memory, disk, network)
- Application performance (traces, spans)
- Logs aggregation and search
- Custom metrics
- Real User Monitoring (RUM)

### Setup Options

#### Option 1: GitHub Student Pack (Recommended)

You have access to **Datadog Pro for 2 years free** via GitHub Student Pack:

1. Go to [https://www.datadoghq.com/](https://www.datadoghq.com/)
2. Sign up with your GitHub student account
3. Verify student status
4. Get Pro account with 10 servers free

**Features included:**
- ✅ Infrastructure monitoring
- ✅ APM (traces and profiling)
- ✅ Log management (15-day retention)
- ✅ Synthetic monitoring
- ✅ Real User Monitoring (RUM)

#### Option 2: Datadog Free Tier

If student pack is not needed:
- 1 host monitoring (free forever)
- 5 custom metrics
- 1-day log retention

### Integration

#### A. DigitalOcean Droplet (ClickHouse Server)

1. **Install Datadog Agent on your droplet:**

   ```bash
   # SSH into your DigitalOcean droplet
   ssh root@your-droplet-ip
   
   # Install Datadog agent
   DD_API_KEY=your-datadog-api-key DD_SITE="datadoghq.com" bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"
   ```

2. **Configure ClickHouse integration:**

   ```bash
   # Enable ClickHouse integration
   sudo cp /etc/datadog-agent/conf.d/clickhouse.d/conf.yaml.example \
      /etc/datadog-agent/conf.d/clickhouse.d/conf.yaml
   
   # Edit config
   sudo nano /etc/datadog-agent/conf.d/clickhouse.d/conf.yaml
   ```

   Add:
   ```yaml
   init_config:

   instances:
     - server: localhost
       port: 8123
       username: watchllm_user
       password: <your-password>
       connect_timeout: 10
       receive_timeout: 10
       tags:
         - env:production
         - service:clickhouse
   ```

3. **Restart agent:**
   ```bash
   sudo systemctl restart datadog-agent
   ```

4. **Verify in Datadog dashboard:**
   - Go to [https://app.datadoghq.com/](https://app.datadoghq.com/)
   - Navigate to **Infrastructure** → **Host Map**
   - Your droplet should appear within 5 minutes

#### B. Dashboard (Vercel Deployment)

Vercel integration with Datadog:

1. **Install Vercel integration:**
   - Go to Datadog dashboard → **Integrations** → **Vercel**
   - Click "Install Integration"
   - Authorize with Vercel account

2. **Add Datadog environment variables to Vercel:**
   ```bash
   DATADOG_API_KEY=your-api-key
   NEXT_PUBLIC_DD_APPLICATION_ID=your-app-id
   NEXT_PUBLIC_DD_CLIENT_TOKEN=your-client-token
   NEXT_PUBLIC_DD_SITE=datadoghq.com
   ```

3. **Add RUM initialization** (optional):
   ```typescript
   // dashboard/app/layout.tsx
   import { datadogRum } from '@datadog/browser-rum';
   
   if (typeof window !== 'undefined') {
     datadogRum.init({
       applicationId: process.env.NEXT_PUBLIC_DD_APPLICATION_ID!,
       clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
       site: 'datadoghq.com',
       service: 'watchllm-dashboard',
       env: process.env.NODE_ENV,
       version: process.env.npm_package_version,
       sessionSampleRate: 100,
       sessionReplaySampleRate: 20,
       trackUserInteractions: true,
       trackResources: true,
       trackLongTasks: true,
     });
   }
   ```

#### C. Cloudflare Worker

Cloudflare Workers Analytics (built-in):
- Go to Cloudflare dashboard → Workers → Your Worker → Metrics
- View requests, errors, CPU time, duration

For custom metrics:
```typescript
// worker/src/index.ts
export default {
  async fetch(request: Request, env: Env) {
    const start = Date.now();
    
    try {
      const response = await handleRequest(request, env);
      
      // Log metrics
      const duration = Date.now() - start;
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        status: response.status,
        path: new URL(request.url).pathname,
      }));
      
      return response;
    } catch (error) {
      // Error already captured by Sentry
      throw error;
    }
  }
};
```

---

## Alert Configuration

### Sentry Alerts

1. **Go to Sentry project settings** → **Alerts**
2. **Create alert rules:**

   **Example: High Error Rate**
   ```yaml
   When: The event count for a project
   Is: above 100
   In: 1 hour
   Then: Send notification to Slack/Email
   ```

   **Example: New Issue**
   ```yaml
   When: A new issue is created
   Filter: environment equals production
   Then: Send notification immediately
   ```

3. **Integration options:**
   - Email
   - Slack
   - Discord
   - PagerDuty
   - Custom webhooks

### Datadog Monitors

1. **Go to Datadog** → **Monitors** → **New Monitor**
2. **Create monitors:**

   **Example: High CPU Usage**
   ```yaml
   Metric: system.cpu.user
   Alert threshold: > 80%
   Warning threshold: > 60%
   Notify: your-email@example.com
   ```

   **Example: ClickHouse Down**
   ```yaml
   Service Check: clickhouse.can_connect
   Alert when: check fails
   For: 5 minutes
   Notify: on-call team
   ```

   **Example: High Error Rate**
   ```yaml
   Metric: trace.express.request.errors
   Alert threshold: > 5% of requests
   Time window: 5 minutes
   Notify: your-email@example.com
   ```

---

## Best Practices

### Error Handling

1. **Always add context:**
   ```typescript
   try {
     await processPayment(userId);
   } catch (error) {
     Sentry.captureException(error, {
       tags: { feature: 'payment', userId },
       extra: { paymentMethod, amount },
     });
     throw error;
   }
   ```

2. **Use fingerprints for grouping:**
   ```typescript
   Sentry.captureException(error, {
     fingerprint: ['{{ default }}', customGroupingKey],
   });
   ```

3. **Set user context:**
   ```typescript
   Sentry.setUser({
     id: user.id,
     email: user.email,
     username: user.name,
   });
   ```

### Performance Monitoring

1. **Monitor critical paths:**
   ```typescript
   const transaction = Sentry.startTransaction({
     name: 'Checkout Flow',
     op: 'workflow',
   });
   
   const span = transaction.startChild({ op: 'payment.process' });
   await processPayment();
   span.finish();
   
   transaction.finish();
   ```

2. **Set transaction names:**
   ```typescript
   // Use route patterns, not dynamic values
   ✅ transaction.setName('/api/users/:id');
   ❌ transaction.setName('/api/users/12345');
   ```

### Cost Optimization

1. **Sentry quota management:**
   - Set rate limits per project
   - Use `beforeSend` to filter unwanted errors
   - Adjust sample rates based on traffic

2. **Datadog cost control:**
   - Use metric aggregation
   - Set log retention periods
   - Filter noisy logs

### Security

1. **Sanitize sensitive data:**
   ```typescript
   beforeSend(event) {
     if (event.request) {
       delete event.request.cookies;
       delete event.request.headers?.['Authorization'];
     }
     return event;
   }
   ```

2. **Environment separation:**
   - Use different Sentry projects for dev/prod
   - Tag errors with environment
   - Filter alerts by environment

---

## Troubleshooting

### Sentry Not Receiving Events

1. **Check DSN configuration:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Verify network connectivity:**
   ```bash
   curl https://sentry.io/api/0/
   ```

3. **Check browser console** (dashboard):
   - Open DevTools → Console
   - Look for Sentry initialization messages

4. **Enable debug mode:**
   ```typescript
   Sentry.init({
     debug: true, // Enable console logging
     // ...
   });
   ```

### Datadog Agent Not Reporting

1. **Check agent status:**
   ```bash
   sudo systemctl status datadog-agent
   ```

2. **View agent logs:**
   ```bash
   sudo tail -f /var/log/datadog/agent.log
   ```

3. **Test configuration:**
   ```bash
   sudo datadog-agent configcheck
   ```

4. **Restart agent:**
   ```bash
   sudo systemctl restart datadog-agent
   ```

---

## Resources

### Sentry
- [Documentation](https://docs.sentry.io/)
- [Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Cloudflare Workers Guide](https://docs.sentry.io/platforms/javascript/guides/cloudflare/)
- [Best Practices](https://docs.sentry.io/product/best-practices/)

### Datadog
- [Documentation](https://docs.datadoghq.com/)
- [GitHub Student Pack](https://education.github.com/pack)
- [ClickHouse Integration](https://docs.datadoghq.com/integrations/clickhouse/)
- [Vercel Integration](https://docs.datadoghq.com/integrations/vercel/)

### Costs
- **Sentry Free Tier**: 5,000 errors/month, 10,000 transactions/month
- **Sentry Team Plan**: $26/month (50,000 errors, 100,000 transactions)
- **Datadog Free**: 1 host, 5 custom metrics
- **Datadog Student**: Pro plan free for 2 years (10 hosts)
