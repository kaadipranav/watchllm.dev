# SYSTEM.md - Development Guidelines

> **Purpose:** Coding standards, development workflow, and best practices for building WatchLLM.

---

## Table of Contents
1. [Development Environment Setup](#1-development-environment-setup)
2. [Project Structure](#2-project-structure)
3. [Coding Standards](#3-coding-standards)
4. [Git Workflow](#4-git-workflow)
5. [Testing Strategy](#5-testing-strategy)
6. [Building & Compilation](#6-building--compilation)
7. [Deployment Process](#7-deployment-process)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Development Environment Setup

### Prerequisites

```bash
# Required
node >= 18.0.0
pnpm >= 8.0.0 (use pnpm, not npm)
git >= 2.40.0

# Install pnpm globally
npm install -g pnpm

# Install Wrangler (Cloudflare CLI)
pnpm install -g wrangler

# Install Supabase CLI
brew install supabase/tap/supabase
```

### Initial Setup

```bash
# Clone repo
git clone https://github.com/yourusername/WatchLLM.git
cd WatchLLM

# Install dependencies for all packages
pnpm install

# Copy environment files
cp .env.example .env.local

# Start Supabase locally
supabase start

# Run database migrations
supabase db reset

# Start dev servers
pnpm dev
```

This starts:
- Worker: `localhost:8787` (Cloudflare Worker dev server)
- Dashboard: `localhost:3000` (Next.js)
- Supabase Studio: `localhost:54323`

---

## 2. Project Structure

```
WatchLLM/
├── worker/                      # Cloudflare Worker (proxy)
│   ├── src/
│   │   ├── index.ts             # Main entry point
│   │   ├── handlers/
│   │   │   ├── chat.ts          # /v1/chat/completions
│   │   │   ├── embeddings.ts    # /v1/embeddings
│   │   │   └── completions.ts   # /v1/completions
│   │   ├── middleware/
│   │   │   ├── auth.ts          # API key validation
│   │   │   ├── ratelimit.ts     # Rate limiting
│   │   │   └── cors.ts          # CORS headers
│   │   ├── lib/
│   │   │   ├── cache.ts         # Semantic caching logic
│   │   │   ├── providers.ts     # OpenAI/Anthropic/Groq clients
│   │   │   ├── crypto.ts        # Encryption/decryption
│   │   │   └── logging.ts       # Structured logging
│   │   └── types/
│   │       └── index.ts         # TypeScript types
│   ├── wrangler.toml            # Cloudflare config
│   ├── package.json
│   └── tsconfig.json
│
├── dashboard/                   # Next.js dashboard
│   ├── app/
│   │   ├── (auth)/              # Auth routes (login, signup)
│   │   ├── (dashboard)/         # Dashboard routes (requires auth)
│   │   └── api/                 # API routes (webhooks, etc.)
│   ├── components/
│   │   ├── ui/                  # Shadcn components
│   │   └── dashboard/           # Custom dashboard components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client
│   │   │   └── server.ts        # Server client
│   │   ├── stripe.ts
│   │   └── utils.ts
│   ├── public/
│   ├── package.json
│   └── next.config.js
│
├── supabase/                    # Database & auth
│   ├── migrations/              # SQL migrations
│   │   └── 001_initial.sql
│   ├── functions/               # Edge functions (if needed)
│   └── config.toml
│
├── packages/                    # Shared packages
│   ├── shared/                  # Shared types, utils
│   │   ├── src/
│   │   │   ├── types.ts         # Shared TypeScript types
│   │   │   └── constants.ts     # Shared constants
│   │   └── package.json
│   └── emails/                  # React Email templates
│       ├── emails/
│       │   ├── welcome.tsx
│       │   ├── usage-alert.tsx
│       │   └── weekly-report.tsx
│       └── package.json
│
├── scripts/                     # Utility scripts
│   ├── generate-api-key.ts     # Generate lgw_xxx keys
│   ├── seed-db.ts              # Seed test data
│   └── migrate-prod.sh         # Production migration script
│
├── docs/                        # Documentation
│   ├── CONTEXT.md              # Product context
│   ├── ARCHITECTURE.md         # System design
│   ├── SYSTEM.md               # This file
│   └── API.md                  # API documentation
│
├── .github/
│   └── workflows/
│       ├── deploy-worker.yml   # Deploy Cloudflare Worker
│       └── deploy-dashboard.yml # Deploy Next.js to Vercel
│
├── pnpm-workspace.yaml         # pnpm monorepo config
├── turbo.json                  # Turborepo config (optional)
├── .env.example
└── README.md
```

---

## 3. Coding Standards

### 3.1 TypeScript Guidelines

**Use strict mode:**
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**Naming conventions:**
```typescript
// Types: PascalCase
type ApiKey = { ... };

// Interfaces: PascalCase with 'I' prefix (optional)
interface IUserProfile { ... };

// Enums: PascalCase
enum Plan {
  Free = 'free',
  Starter = 'starter',
  Pro = 'pro'
}

// Functions: camelCase
async function validateApiKey(key: string) { ... }

// Constants: UPPER_SNAKE_CASE
const MAX_REQUESTS_PER_MINUTE = 60;

// Variables: camelCase
const userProjects = [...];
```

**Avoid `any`, use `unknown` if needed:**
```typescript
// ❌ Bad
function parseJson(str: string): any {
  return JSON.parse(str);
}

// ✅ Good
function parseJson<T>(str: string): T {
  return JSON.parse(str) as T;
}
```

### 3.2 Error Handling

**Always use try-catch for async operations:**
```typescript
// ❌ Bad
async function getProject(id: string) {
  const project = await supabase.from('projects').select().eq('id', id).single();
  return project.data;
}

// ✅ Good
async function getProject(id: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select()
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return null;
  }
}
```

**Use custom error classes:**
```typescript
class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Usage
if (requestCount > limit) {
  throw new RateLimitError('Rate limit exceeded');
}
```

### 3.3 Logging

**Use structured logging:**
```typescript
// ❌ Bad
console.log('User logged in');

// ✅ Good
console.log(JSON.stringify({
  level: 'info',
  event: 'user_login',
  user_id: user.id,
  timestamp: new Date().toISOString()
}));
```

**Log levels:**
- `debug` - Verbose info for debugging
- `info` - Normal operations
- `warn` - Something unusual but not an error
- `error` - Something failed

**Never log sensitive data:**
```typescript
// ❌ NEVER do this
console.log('API key:', apiKey);
console.log('User password:', password);

// ✅ Do this
console.log('API key:', apiKey.slice(0, 8) + '...');
```

### 3.4 Code Comments

**Write self-documenting code, use comments sparingly:**
```typescript
// ❌ Bad: Obvious comment
// Increment counter
count++;

// ✅ Good: Explain WHY, not WHAT
// Use sliding window rate limiting to prevent burst abuse
// while allowing sustained usage within plan limits
const windowStart = Date.now() - WINDOW_SIZE_MS;
```

**Use JSDoc for public functions:**
```typescript
/**
 * Validates an API key and returns the associated project.
 * 
 * @param key - The API key to validate (format: lgw_xxx)
 * @returns The project if valid, null otherwise
 * @throws {DatabaseError} If database connection fails
 */
async function validateApiKey(key: string): Promise<Project | null> {
  // ...
}
```

### 3.5 React/Next.js Guidelines

**Use Server Components by default:**
```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Fetch data directly in Server Component
  const stats = await getStats();
  
  return <StatsDisplay stats={stats} />;
}
```

**Use Client Components only when needed:**
```typescript
'use client'; // Only add this if you need useState, useEffect, etc.

export function InteractiveChart({ data }: Props) {
  const [selected, setSelected] = useState(0);
  // ...
}
```

**Co-locate components with their routes:**
```
app/
└── dashboard/
    ├── page.tsx             # Dashboard page
    ├── _components/          # Components used only in this route
    │   ├── stats-card.tsx
    │   └── usage-chart.tsx
    └── projects/
        └── page.tsx
```

---

## 4. Git Workflow

### 4.1 Branch Naming

```
main          # Production (auto-deploys)
staging       # Staging environment
feature/xxx   # New features
fix/xxx       # Bug fixes
chore/xxx     # Maintenance tasks
```

### 4.2 Commit Messages

Use conventional commits:
```
feat: add semantic caching to proxy
fix: resolve rate limit race condition
chore: update dependencies
docs: add API documentation
refactor: simplify cache key generation
```

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Example:**
```
feat(proxy): add support for Anthropic Claude

- Implement Anthropic API client
- Add Claude models to pricing calculator
- Update documentation

Closes #42
```

### 4.3 Pull Request Process

1. Create feature branch from `main`
2. Make changes, commit frequently
3. Push and open PR
4. Request review (if working with team)
5. Address feedback
6. Merge via squash commit
7. Delete feature branch

**PR Template:**
```markdown
## Description
Brief description of changes.

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested in staging

## Screenshots (if UI changes)
[Add screenshots]

## Breaking Changes
None / List breaking changes
```

---

## 5. Testing Strategy

### 5.1 Unit Tests

**Tool:** Vitest

**Location:** `__tests__` folder next to source file

**Example:**
```typescript
// worker/src/lib/__tests__/cache.test.ts
import { describe, it, expect } from 'vitest';
import { generateCacheKey } from '../cache';

describe('generateCacheKey', () => {
  it('should generate same key for case-insensitive prompts', () => {
    const key1 = generateCacheKey({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7
    });
    
    const key2 = generateCacheKey({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'hello' }],
      temperature: 0.7
    });
    
    expect(key1).toBe(key2);
  });
  
  it('should generate different keys for different temperatures', () => {
    const key1 = generateCacheKey({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7
    });
    
    const key2 = generateCacheKey({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.9
    });
    
    expect(key1).not.toBe(key2);
  });
});
```

**Run tests:**
```bash
pnpm test
pnpm test:watch  # Watch mode
pnpm test:coverage  # With coverage
```

### 5.2 Integration Tests

**Test critical flows end-to-end:**

```typescript
// worker/src/__tests__/integration/proxy.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Proxy Integration', () => {
  let apiKey: string;
  
  beforeAll(async () => {
    // Setup: Create test user, project, API key
    apiKey = await createTestApiKey();
  });
  
  afterAll(async () => {
    // Cleanup: Delete test data
    await cleanupTestData();
  });
  
  it('should proxy request to OpenAI and return response', async () => {
    const response = await fetch('http://localhost:8787/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Say "test"' }]
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.choices[0].message.content).toContain('test');
  });
});
```

### 5.3 Manual Testing Checklist

Before deploying to production:

**Proxy:**
- [ ] Can create API key
- [ ] Can make successful request
- [ ] Cache hit works (second identical request is instant)
- [ ] Rate limiting works (exceeding limit returns 429)
- [ ] Invalid API key returns 401

**Dashboard:**
- [ ] Can sign up
- [ ] Can log in
- [ ] Can create project
- [ ] Can view usage stats
- [ ] Can upgrade plan
- [ ] Can cancel subscription

**Webhooks:**
- [ ] Stripe webhook creates subscription
- [ ] Failed payment triggers email
- [ ] Cancellation downgrades user

---

## 6. Building & Compilation

### 6.1 Monorepo Build

**Build all packages:**
```bash
pnpm build
```

This runs in sequence:
1. Packages (TypeScript compilation)
2. Worker (Cloudflare Wrangler build)
3. Dashboard (Next.js production build)

**Partial builds:**
```bash
# Build only email package
pnpm --filter @watchllm/emails build

# Build only dashboard
pnpm --filter @watchllm/dashboard build

# Build only worker
pnpm --filter @watchllm/worker build
```

### 6.2 Email System

**Package:** `packages/emails/`

Handles all transactional emails using React Email + Resend.

**Templates:**
- `welcome.tsx` - Sent after signup
- `usage-alert.tsx` - Sent when usage exceeds 80% of plan
- `payment-failed.tsx` - Sent when payment fails
- `weekly-report.tsx` - Sent weekly with usage statistics

**Key Configuration:**
```env
RESEND_API_KEY=re_your_resend_api_key
EMAIL_FROM_ADDRESS=WatchLLM <no-reply@watchllm.dev>
EMAIL_TRIGGER_SECRET=random_secret_for_webhook_auth
CRON_SECRET=random_secret_for_cron_jobs
```

**Triggering Emails:**
- **Welcome:** Called in `/api/auth/welcome` after signup
- **Usage Alert:** Called from worker when usage > 80% limit
- **Payment Failed:** Called from `/api/webhooks/stripe` on `invoice.payment_failed`
- **Weekly Report:** Called from `/api/cron/weekly-report` (scheduled)

**Testing Emails Locally:**
```bash
# Resend provides test mode - emails log to console in development
# Set RESEND_API_KEY to your test key
```

### 6.3 Build Troubleshooting

**TypeScript Errors in Email Package:**
```bash
# Ensure @types/react is installed
pnpm add -D @types/react @types/react-dom

# Clear cache and rebuild
pnpm install
pnpm build
```

**React Email Component Issues:**
- Use only exported components from `@react-email/components`
- Available: `Body`, `Button`, `Container`, `Head`, `Heading`, `Html`, `Link`, `Preview`, `Section`, `Text`
- Not available: `Table`, `Row`, `Column` (use `Section` instead)
- Style padding with `padding` prop in style object, not `pX`/`pY` attributes
- Render functions are async: must `await render(<Component />)`

**Resend Initialization:**
```typescript
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: "WatchLLM <no-reply@watchllm.dev>",
  to: email,
  subject: "Welcome to WatchLLM",
  html: "<p>Welcome!</p>",
});
```

---

## 7. Deployment Process

### 7.1 Cloudflare Worker

**Deploy to production:**
```bash
cd worker
wrangler deploy --env production
```

**Deploy to staging:**
```bash
wrangler deploy --env staging
```

**Rollback:**
```bash
wrangler rollback --env production
```

### 7.2 Next.js Dashboard

**Vercel auto-deploys:**
- Push to `main` → Deploys to production
- Open PR → Deploys preview environment

**Manual deploy:**
```bash
cd dashboard
vercel --prod
```

### 7.3 Database Migrations

**Staging:**
```bash
supabase db push --db-url $STAGING_DATABASE_URL
```

**Production:**
```bash
# Always backup first!
pg_dump $PROD_DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migration
supabase db push --db-url $PROD_DATABASE_URL
```

### 7.4 Deployment Checklist

Before deploying:
- [ ] All tests pass
- [ ] Code reviewed (if team)
- [ ] Database migrations tested in staging
- [ ] Environment variables updated
- [ ] Changelog updated
- [ ] Datadog alerts configured
- [ ] Rollback plan documented

After deploying:
- [ ] Smoke test in production
- [ ] Check error rates in Datadog
- [ ] Monitor #alerts Slack channel
- [ ] Announce in changelog

---

## 8. Troubleshooting

### 7.1 Common Issues

**Issue: Worker returns 500 error**
```bash
# Check logs
wrangler tail --env production

# Look for error in logs
# Common causes:
# - Missing environment variable
# - Supabase connection failed
# - Redis timeout
```

**Issue: Cache not working**
```bash
# Test Redis connection
curl -X POST $UPSTASH_REDIS_REST_URL \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["PING"]'

# Should return: ["PONG"]
```

**Issue: Rate limiting not working**
```bash
# Check Redis keys
curl -X POST $UPSTASH_REDIS_REST_URL \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" \
  -d '["KEYS", "rate:*"]'

# Should see rate limit keys
```

**Issue: Dashboard not loading**
```bash
# Check Supabase connection
NEXT_PUBLIC_SUPABASE_URL=... node -e "
  import { createClient } from '@supabase/supabase-js';
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, '...');
  supabase.from('profiles').select('count').then(console.log);
"
```

### 7.2 Debug Mode

**Enable verbose logging:**
```typescript
// worker/src/index.ts
const DEBUG = true;

if (DEBUG) {
  console.log('Request received:', request.url);
  console.log('API key:', apiKey.slice(0, 8) + '...');
  console.log('Cache lookup:', cacheKey);
}
```

**Test locally with ngrok:**
```bash
# Start worker locally
cd worker
pnpm dev

# In another terminal
ngrok http 8787

# Use ngrok URL for testing webhooks
```

### 7.3 Performance Debugging

**Measure latency:**
```typescript
const start = Date.now();
const response = await fetch(providerUrl, ...);
const latency = Date.now() - start;

console.log(JSON.stringify({
  event: 'provider_request',
  provider: 'openai',
  latency_ms: latency
}));
```

**Identify slow queries:**
```sql
-- In Supabase SQL editor
EXPLAIN ANALYZE
SELECT * FROM usage_logs
WHERE project_id = 'proj_123'
AND created_at > NOW() - INTERVAL '7 days';

-- Look for "Seq Scan" (bad) vs "Index Scan" (good)
```

---

## Development Best Practices

1. **Test locally first** - Always test in dev before staging
2. **Use staging** - Never test in production
3. **Monitor after deploy** - Watch Datadog for 30min post-deploy
4. **Rollback fast** - If errors spike, rollback immediately
5. **Document decisions** - Update CHANGELOG.md and API.md
6. **Keep it simple** - Avoid premature optimization
7. **Security first** - Never commit secrets, always encrypt sensitive data
8. **Automate** - If you do it twice, script it

---

This document should be updated as the codebase evolves. When in doubt, refer to existing code patterns and ask questions early.