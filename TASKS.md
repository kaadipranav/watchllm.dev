# TASKS.md - AI Agent Coding Instructions

> **FOR:** Non-coders using AI agents (Cursor, GitHub Copilot, etc.)  
> **PURPOSE:** Complete WatchLLM app development via AI agents  
> **YOUR ROLE:** Setup env vars, domains, external services only

---

## 📋 HOW TO USE THIS DOCUMENT

### Setup
1. Install Cursor or VS Code with GitHub Copilot
2. Create new workspace folder: `watchllm`
3. Open terminal in this folder
4. Copy-paste each task prompt to your AI agent
5. Let agent complete the task
6. Run verification commands
7. Move to next task only if verification passes

### Model Selection
- **Default:** Claude Sonnet 4.5 (1x cost, best quality/price)
- **Complex tasks:** Claude Opus 4.5 Preview (3x cost, maximum capability)
- **Simple tasks:** Claude Haiku 4.5 (0.33x cost, fast)

### Verification Rules
- ✅ **PASS:** 0 errors, proceed to next task
- ⚠️ **WARNING:** <5 errors, ask agent to fix, then proceed
- 🚨 **FAIL:** 5+ errors or build fails, DO NOT PROCEED, ask agent to debug

---

## 🎯 EXTERNAL SETUP (DO THESE FIRST)

### Before Task 1: Create Accounts

**YOU DO MANUALLY:**

1. **GitHub Student Developer Pack**
   - Go to: https://education.github.com/pack
   - Sign up with .edu email
   - Wait for approval (instant to 24 hours)

2. **Cloudflare**
   - Sign up: https://dash.cloudflare.com/sign-up
   - Save API token

3. **Supabase**
   - Sign up: https://supabase.com/dashboard
   - Create project: "watchllm-production"
   - Choose region closest to you
   - Save: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

4. **Upstash Redis**
   - Sign up: https://console.upstash.com/
   - Create Redis database
   - Save: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

5. **Vercel**
   - Sign up: https://vercel.com/signup
   - Connect GitHub account

6. **Stripe**
   - Sign up: https://dashboard.stripe.com/register
   - Get test API keys
   - Save: `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`

7. **Name.com**
   - Register domain (use Student Pack free coupon)
   - Get: `watchllm.dev` or similar
   - Save domain name

8. **Resend** (Optional - for emails)
   - Sign up: https://resend.com/signup
   - Create API key
   - Save: `RESEND_API_KEY`

**SAVE ALL THESE VALUES IN A SECURE PLACE (1Password, .env file)**

---

## 📦 TASK 0: Project Setup

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 5 minutes

### Prompt for AI Agent:

```
Create a new monorepo project structure for WatchLLM with the following:

1. Initialize a pnpm workspace with these packages:
   - `worker/` - Cloudflare Worker (proxy runtime)
   - `dashboard/` - Next.js 14 app (frontend)
   - `packages/shared/` - Shared TypeScript types

2. Set up the following in root:
   - pnpm-workspace.yaml
   - .gitignore (include .env*, node_modules, .DS_Store, .vercel, .wrangler)
   - README.md (basic project description)
   - package.json with workspace scripts

3. Initialize each package with:
   - TypeScript configuration
   - package.json with necessary scripts
   - Basic folder structure

4. Install core dependencies:
   - Worker: hono, @cloudflare/workers-types
   - Dashboard: next, react, react-dom, typescript
   - Shared: typescript

Use pnpm as the package manager. Follow modern best practices.
```

### Verification Commands:

```bash
# Install pnpm if not installed
npm install -g pnpm

# Verify structure
ls -R

# Install all dependencies
pnpm install

# Check no errors
echo "✅ If no errors above, proceed to Task 1"
```

**Expected Output:**
- Folder structure created
- All dependencies installed
- No errors in terminal

---

## 📦 TASK 1: Setup Cloudflare Worker (Backend Proxy)

**Model:** Claude Opus 4.5 Preview (complex infrastructure)  
**Estimated Time:** 30 minutes

### Prompt for AI Agent:

```
I'm building WatchLLM - an AI API cost optimization proxy. Create a Cloudflare Worker that:

REQUIREMENTS:
1. Framework: Use Hono for routing
2. Endpoints:
   - POST /v1/chat/completions (OpenAI compatible)
   - POST /v1/completions (OpenAI compatible)
   - POST /v1/embeddings (OpenAI compatible)
   - GET /health (health check)

3. Features:
   - API key validation (check against Supabase database)
   - Semantic caching using Upstash Redis
   - Request forwarding to OpenAI/Anthropic/Groq
   - Usage logging to Supabase
   - Rate limiting per API key
   - CORS headers

4. Environment Variables (I'll set these):
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
   - OPENAI_API_KEY
   - ANTHROPIC_API_KEY (optional)

5. Caching Logic:
   - Generate cache key from: model + messages + temperature (normalized)
   - Case-insensitive prompt matching
   - Default TTL: 1 hour
   - Return cached response if similarity > 95%

6. Error Handling:
   - Return proper HTTP status codes
   - Log errors to console
   - Never expose internal errors to users

7. File Structure:
   worker/
   ├── src/
   │   ├── index.ts (main entry point)
   │   ├── handlers/
   │   │   ├── chat.ts
   │   │   ├── embeddings.ts
   │   │   └── completions.ts
   │   ├── lib/
   │   │   ├── cache.ts (caching logic)
   │   │   ├── supabase.ts (database client)
   │   │   ├── redis.ts (Redis client)
   │   │   └── providers.ts (OpenAI, Anthropic clients)
   │   └── types.ts
   ├── wrangler.toml (Cloudflare config)
   ├── package.json
   └── tsconfig.json

Install all necessary dependencies. Use TypeScript strict mode. Add comprehensive error handling.
```

### Verification Commands:

```bash
cd worker

# Install dependencies
pnpm install

# Type check
pnpm tsc --noEmit

# Build (if applicable)
pnpm build

# Check for errors
echo "✅ If no TypeScript errors, proceed"
```

**Expected Output:**
- All files created in `worker/` directory
- TypeScript compiles without errors
- Dependencies installed

**STOP HERE if there are errors. Ask agent to fix them.**

---

## 📦 TASK 2: Create Supabase Database Schema

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 15 minutes

### YOU DO MANUALLY:

1. Go to Supabase dashboard
2. Open SQL Editor
3. Copy the SQL from what the agent generates
4. Run it

### Prompt for AI Agent:

```
Create a Supabase database schema for WatchLLM with the following tables:

1. **api_keys**
   - id (UUID, primary key)
   - key (TEXT, unique, indexed)
   - project_id (UUID, foreign key to projects)
   - name (TEXT, optional)
   - created_at (TIMESTAMPTZ)
   - last_used_at (TIMESTAMPTZ, nullable)
   - is_active (BOOLEAN, default true)

2. **projects**
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - name (TEXT)
   - plan (TEXT, default 'free') - values: 'free', 'starter', 'pro'
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

3. **usage_logs**
   - id (UUID, primary key)
   - project_id (UUID, foreign key to projects)
   - api_key_id (UUID, foreign key to api_keys)
   - model (TEXT)
   - provider (TEXT) - 'openai', 'anthropic', 'groq'
   - tokens_input (INTEGER)
   - tokens_output (INTEGER)
   - tokens_total (INTEGER)
   - cost_usd (DECIMAL(10,6))
   - cached (BOOLEAN)
   - latency_ms (INTEGER)
   - created_at (TIMESTAMPTZ)

4. **subscriptions**
   - id (UUID, primary key)
   - user_id (UUID, foreign key to auth.users)
   - stripe_customer_id (TEXT, unique)
   - stripe_subscription_id (TEXT, unique, nullable)
   - plan (TEXT) - 'free', 'starter', 'pro'
   - status (TEXT) - 'active', 'canceled', 'past_due'
   - current_period_start (TIMESTAMPTZ)
   - current_period_end (TIMESTAMPTZ)
   - created_at (TIMESTAMPTZ)
   - updated_at (TIMESTAMPTZ)

Requirements:
- Add proper indexes for performance (project_id, created_at, user_id)
- Add Row Level Security (RLS) policies
- Add database functions for common queries (get usage stats, check rate limits)
- Include proper foreign key constraints
- Add triggers for updated_at fields

Generate the complete SQL migration file that I can run in Supabase SQL Editor.
Save it to: supabase/migrations/001_initial_schema.sql
```

### Verification:

1. Copy SQL from generated file
2. Paste in Supabase SQL Editor
3. Run it
4. Check for errors in Supabase dashboard
5. Verify tables exist in Table Editor

**Expected Output:**
- SQL file created
- When run in Supabase: "Success. No rows returned"
- All tables visible in Supabase Table Editor

---

## 📦 TASK 3: Build Next.js Dashboard (Frontend)

**Model:** Claude Opus 4.5 Preview (complex UI/UX)  
**Estimated Time:** 45 minutes

### Prompt for AI Agent:

```
Create a Next.js 14 dashboard for WatchLLM with the following specifications:

TECH STACK:
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Shadcn/ui components
- Supabase (auth + database)
- Recharts (for analytics)
- Stripe (for payments)

FOLDER STRUCTURE:
dashboard/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx (sidebar, header)
│   │   ├── page.tsx (main dashboard)
│   │   ├── projects/
│   │   │   ├── page.tsx (list projects)
│   │   │   ├── [id]/page.tsx (project details)
│   │   │   └── new/page.tsx (create project)
│   │   ├── api-keys/page.tsx
│   │   ├── usage/page.tsx
│   │   ├── billing/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── generate-key/route.ts
│   ├── layout.tsx (root layout)
│   └── page.tsx (landing page)
├── components/
│   ├── ui/ (Shadcn components)
│   ├── dashboard/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── stats-card.tsx
│   │   ├── usage-chart.tsx
│   │   ├── api-key-list.tsx
│   │   └── project-card.tsx
│   └── landing/
│       ├── hero.tsx
│       ├── pricing.tsx
│       ├── features.tsx
│       └── faq.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts (browser)
│   │   ├── server.ts (server components)
│   │   └── middleware.ts
│   ├── stripe.ts
│   └── utils.ts
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json

FEATURES TO IMPLEMENT:

1. Landing Page:
   - Hero section with value prop
   - Pricing table (Free $0, Starter $29, Pro $49)
   - Features section
   - FAQ
   - CTA buttons

2. Auth Pages:
   - Email/password login
   - Sign up form
   - Password reset
   - Use Supabase Auth

3. Dashboard (Main):
   - Total requests (last 30 days)
   - Cache hit rate
   - Estimated savings (in USD)
   - Recent activity chart
   - Quick actions (create project, generate key)

4. Projects Page:
   - List all projects
   - Create new project
   - View project details (usage, keys, settings)
   - Delete project

5. API Keys Page:
   - Generate new API key (format: lgw_xxxx)
   - List all keys with last used date
   - Copy key to clipboard
   - Revoke key
   - Usage stats per key

6. Usage Page:
   - Filterable logs (by date, model, cached/uncached)
   - Charts: requests over time, cost breakdown
   - Export to CSV

7. Billing Page:
   - Current plan
   - Usage limits (show progress bars)
   - Upgrade/downgrade buttons
   - Stripe Checkout integration
   - Payment history

8. Settings Page:
   - Profile settings
   - Email preferences
   - Delete account

REQUIREMENTS:
- Use Server Components by default
- Use Client Components only when needed ('use client')
- Implement proper loading states
- Error boundaries for error handling
- Responsive design (mobile-friendly)
- Dark mode support
- Form validation with Zod
- Toast notifications for actions
- Proper TypeScript types

ENVIRONMENT VARIABLES (I'll set these):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

Install all necessary dependencies including Shadcn/ui components.
```

### Verification Commands:

```bash
cd dashboard

# Install dependencies
pnpm install

# Add Shadcn/ui (if agent didn't do it)
# pnpm dlx shadcn-ui@latest init

# Type check
pnpm tsc --noEmit

# Build
pnpm build

# Check output
echo "✅ If build succeeds, proceed"
```

**Expected Output:**
- Build completes successfully
- `.next` folder created
- No TypeScript errors
- No build errors

**If build fails, ask agent to fix errors before proceeding.**

---

## 📦 TASK 4: Implement Stripe Integration

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 20 minutes

### Prompt for AI Agent:

```
Add Stripe payment integration to the WatchLLM dashboard:

REQUIREMENTS:

1. Create Stripe Products & Prices:
   - Write a script: dashboard/scripts/setup-stripe.ts
   - Create 3 products:
     - Free: $0/month
     - Starter: $29/month (recurring)
     - Pro: $49/month (recurring)
   - Script should use STRIPE_SECRET_KEY from env

2. Checkout Flow:
   - Create API route: dashboard/app/api/checkout/route.ts
   - Accept plan parameter
   - Create Stripe Checkout Session
   - Redirect to Stripe Checkout
   - Return URL: /dashboard?success=true

3. Webhook Handler:
   - Update existing: dashboard/app/api/webhooks/stripe/route.ts
   - Handle events:
     - checkout.session.completed → Create/update subscription
     - customer.subscription.updated → Update subscription status
     - customer.subscription.deleted → Downgrade to free
     - invoice.payment_failed → Send email, mark past_due
   - Verify webhook signature
   - Update Supabase subscriptions table

4. Billing Page Updates:
   - Show current plan with limits
   - Upgrade/downgrade buttons
   - Cancel subscription button
   - Payment history from Stripe

5. Usage Enforcement:
   - Create middleware to check plan limits
   - Free: 50k requests/month
   - Starter: 250k requests/month
   - Pro: 1M requests/month
   - Return 429 if exceeded

Use proper error handling. Log all Stripe events. Add TypeScript types for Stripe objects.
```

### Verification Commands:

```bash
cd dashboard

# Type check
pnpm tsc --noEmit

# Build
pnpm build

# Run setup script (YOU DO THIS MANUALLY after setting env vars)
# pnpm tsx scripts/setup-stripe.ts
```

**Expected Output:**
- Build succeeds
- No TypeScript errors
- Stripe API routes created

---

## 📦 TASK 5: Add Email Notifications

**Model:** Claude Haiku 4.5 (simple task)  
**Estimated Time:** 15 minutes

### Prompt for AI Agent:

```
Add email notifications to WatchLLM using Resend:

REQUIREMENTS:

1. Create email templates using React Email:
   - packages/emails/templates/welcome.tsx
   - packages/emails/templates/usage-alert.tsx (80% of limit)
   - packages/emails/templates/payment-failed.tsx
   - packages/emails/templates/weekly-report.tsx

2. Email Service:
   - Create: dashboard/lib/email.ts
   - Functions:
     - sendWelcomeEmail(email, name)
     - sendUsageAlert(email, project, usage, limit)
     - sendPaymentFailed(email, amount)
     - sendWeeklyReport(email, stats)
   - Use Resend API

3. Triggers:
   - Welcome email: After signup (in signup API route)
   - Usage alert: When usage > 80% of limit (in Worker after logging)
   - Payment failed: In Stripe webhook
   - Weekly report: Cron job (create API route)

4. Email Content:
   - Professional design
   - Include WatchLLM branding
   - Clear CTAs
   - Unsubscribe link

ENVIRONMENT VARIABLES (I'll set):
- RESEND_API_KEY

Install @react-email/components and resend dependencies.
```

### Verification Commands:

```bash
cd dashboard

# Install dependencies
pnpm install

# Type check
pnpm tsc --noEmit

# Build
pnpm build
```

**Expected Output:**
- No errors
- Email templates created
- Email service working

---

## 📦 TASK 6: Add Monitoring & Error Tracking

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 15 minutes

### Prompt for AI Agent:

```
Add monitoring and error tracking to WatchLLM:

REQUIREMENTS:

1. Sentry (Error Tracking):
   - Install @sentry/nextjs for dashboard
   - Install @sentry/cloudflare for worker
   - Configure both with DSN
   - Capture errors in try-catch blocks
   - Add breadcrumbs for debugging

2. Datadog (APM - Optional):
   - Add structured logging
   - Log format: JSON
   - Include: timestamp, level, message, context
   - Worker logs: Request ID, API key (partial), latency, cached status
   - Dashboard logs: User ID, action, result

3. Analytics:
   - Add Simple Analytics script to landing page
   - Track events: signup, upgrade, API key generation
   - Use data attributes for event tracking

4. Health Checks:
   - Worker: GET /health endpoint (check Supabase, Redis connectivity)
   - Dashboard: GET /api/health (check Supabase connectivity)

ENVIRONMENT VARIABLES (I'll set):
- NEXT_PUBLIC_SENTRY_DSN
- SENTRY_AUTH_TOKEN (for source maps)
- SENTRY_ORG
- SENTRY_PROJECT

Add comprehensive error handling throughout the app.
```

### Verification Commands:

```bash
# Worker
cd worker
pnpm install
pnpm tsc --noEmit

# Dashboard
cd ../dashboard
pnpm install
pnpm tsc --noEmit
pnpm build
```

**Expected Output:**
- No errors
- Sentry configured
- Logging added

---

## 📦 TASK 7: Add Testing

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 30 minutes

### Prompt for AI Agent:

```
Add testing to WatchLLM:

REQUIREMENTS:

1. Unit Tests (Vitest):
   - Worker tests:
     - worker/src/lib/__tests__/cache.test.ts (cache key generation)
     - worker/src/lib/__tests__/providers.test.ts (API forwarding)
   - Dashboard tests:
     - dashboard/lib/__tests__/utils.test.ts
   - Test coverage: >70%

2. Integration Tests:
   - worker/src/__tests__/integration/proxy.test.ts
   - Test full request flow (API key → cache → provider)
   - Use MSW for mocking external APIs

3. E2E Tests (Playwright - Optional):
   - dashboard/tests/e2e/auth.spec.ts (login/signup)
   - dashboard/tests/e2e/dashboard.spec.ts (create project, generate key)

4. Test Scripts:
   - Add to package.json:
     - "test": "vitest"
     - "test:coverage": "vitest --coverage"
     - "test:e2e": "playwright test"

5. CI Configuration:
   - Create .github/workflows/test.yml
   - Run tests on every PR
   - Check test coverage

Write meaningful tests. Mock external services. Use proper assertions.
```

### Verification Commands:

```bash
# Worker tests
cd worker
pnpm test

# Dashboard tests
cd ../dashboard
pnpm test

# Check coverage
pnpm test:coverage
```

**Expected Output:**
- All tests pass
- Coverage >70%
- No test errors

---

## 📦 TASK 8: Create Documentation

**Model:** Claude Haiku 4.5 (simple task)  
**Estimated Time:** 20 minutes

### Prompt for AI Agent:

```
Create comprehensive documentation:

REQUIREMENTS:

1. API Documentation (dashboard/public/docs/):
   - api-reference.md (complete API reference)
   - quickstart.md (2-minute setup guide)
   - examples.md (code examples in JS, Python, cURL)
   - errors.md (error codes and solutions)

2. User Guides:
   - dashboard/public/docs/guides/
     - getting-started.md
     - creating-projects.md
     - managing-api-keys.md
     - understanding-caching.md
     - upgrading-plans.md

3. Developer Docs:
   - CONTRIBUTING.md (for open source contributors)
   - DEPLOYMENT.md (how to deploy)
   - ARCHITECTURE.md (system design)

4. README Updates:
   - Update main README.md with:
     - Clear value proposition
     - Quick start guide
     - Feature list
     - Tech stack
     - License

Use clear language. Include code examples. Add screenshots (placeholders).
```

### Verification:

1. Read through generated docs
2. Check for clarity and completeness
3. Fix any typos or errors

**Expected Output:**
- All documentation files created
- Clear and well-structured

---

## 📦 TASK 9: Add Security Features

**Model:** Claude Opus 4.5 Preview (security is critical)  
**Estimated Time:** 25 minutes

### Prompt for AI Agent:

```
Add security features to WatchLLM:

REQUIREMENTS:

1. Rate Limiting:
   - Worker: Implement rate limiting per API key
   - Use Upstash Redis for distributed rate limiting
   - Limits by plan:
     - Free: 10 requests/minute
     - Starter: 50 requests/minute
     - Pro: 200 requests/minute
   - Return 429 Too Many Requests when exceeded

2. API Key Security:
   - Generate cryptographically secure keys (32 bytes)
   - Prefix: lgw_proj_ or lgw_test_
   - Hash keys before storing (use bcrypt or similar)
   - Never log full keys
   - Implement key rotation

3. Input Validation:
   - Validate all API inputs (model, messages, parameters)
   - Reject suspicious payloads
   - Sanitize user inputs
   - Max request size: 1MB

4. CORS Configuration:
   - Worker: Allow specific origins only
   - Dashboard: Proper CORS headers
   - No wildcard (*) in production

5. Security Headers:
   - Add security headers to all responses
   - CSP, X-Frame-Options, etc.
   - Use helmet.js in dashboard

6. Secrets Management:
   - Never commit .env files
   - Use Cloudflare Secrets for Worker env vars
   - Use Vercel env vars for Dashboard
   - Add .env.example files

7. SQL Injection Prevention:
   - Use parameterized queries
   - Validate UUIDs
   - Use Supabase RLS

Implement defense in depth. Follow OWASP best practices.
```

### Verification Commands:

```bash
# Worker
cd worker
pnpm tsc --noEmit
pnpm build

# Dashboard
cd ../dashboard
pnpm tsc --noEmit
pnpm build

# Security audit
pnpm audit
```

**Expected Output:**
- No vulnerabilities in audit
- Build succeeds
- Security features implemented

---

## 📦 TASK 10: Optimize Performance

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 20 minutes

### Prompt for AI Agent:

```
Optimize WatchLLM for performance:

REQUIREMENTS:

1. Worker Optimizations:
   - Minimize cold start time
   - Use streaming for chat completions
   - Implement connection pooling
   - Cache OpenAI API responses efficiently
   - Add request/response compression

2. Dashboard Optimizations:
   - Image optimization (next/image)
   - Code splitting
   - Lazy loading for heavy components
   - Memoization for expensive computations
   - Debounce API calls
   - Use React Server Components where possible

3. Database Optimizations:
   - Add database indexes (already done in schema)
   - Implement pagination for large datasets
   - Use materialized views for analytics
   - Limit query results (max 1000 rows)

4. Caching Strategy:
   - Browser caching headers
   - SWR for data fetching
   - Static page generation where possible
   - Incremental Static Regeneration for dynamic pages

5. Bundle Size:
   - Analyze bundle size (pnpm next build --analyze)
   - Remove unused dependencies
   - Use dynamic imports for large libraries
   - Target: <200KB initial JS bundle

6. Lighthouse Score:
   - Performance: >90
   - Accessibility: >95
   - Best Practices: >90
   - SEO: >90

Add performance monitoring. Implement proper loading states.
```

### Verification Commands:

```bash
cd dashboard

# Build and analyze
pnpm build

# Check bundle size
du -sh .next/

# Type check
pnpm tsc --noEmit

echo "✅ Check that bundle size is reasonable (<5MB total)"
```

**Expected Output:**
- Build succeeds
- Bundle size optimized
- No performance warnings

---

## 📦 TASK 11: Add CI/CD Pipelines

**Model:** Claude Sonnet 4.5  
**Estimated Time:** 15 minutes

### Prompt for AI Agent:

```
Create CI/CD pipelines for WatchLLM:

REQUIREMENTS:

1. GitHub Actions:
   - .github/workflows/test.yml
     - Run on: push, pull_request
     - Jobs: lint, type-check, test, build
     - Run for both worker and dashboard
   
   - .github/workflows/deploy-worker.yml
     - Trigger: push to main
     - Deploy to Cloudflare Workers
     - Use Wrangler
   
   - .github/workflows/deploy-dashboard.yml
     - Trigger: push to main
     - Deploy to Vercel
     - Use Vercel CLI

2. Deployment Scripts:
   - worker/deploy.sh (deploy to Cloudflare)
   - dashboard/deploy.sh (deploy to Vercel)

3. Environment Variables:
   - Document required secrets in GitHub
   - Add .env.example files
   - CI should fail if required vars missing

4. Pre-commit Hooks (Husky):
   - Lint staged files
   - Run type check
   - Run unit tests
   - Prevent commits if errors

5. Release Process:
   - Semantic versioning
   - Changelog generation
   - Git tags for releases

Use proper error handling in CI. Cache dependencies for speed.
```

### Verification:

1. Commit and push code
2. Check GitHub Actions tab
3. Verify workflows run

**Expected Output:**
- CI workflows created
- All checks pass

---

## 📦 TASK 12: Final Polish & Bug Fixes

**Model:** Claude Opus 4.5 Preview (thorough review)  
**Estimated Time:** 30 minutes

### Prompt for AI Agent:

```
Perform final review and polish of WatchLLM:

TASKS:

1. Code Review:
   - Check all files for TODOs
   - Remove console.logs in production code
   - Fix any TypeScript 'any' types
   - Add missing error handling
   - Ensure consistent code style

2. UI/UX Polish:
   - Consistent spacing and alignment
   - Proper loading states everywhere
   - Error messages are user-friendly
   - Success notifications for actions
   - Mobile responsive (test all breakpoints)
   - Accessibility (keyboard navigation, ARIA labels)

3. Bug Fixes:
   - Test all user flows
   - Fix any runtime errors
   - Handle edge cases
   - Validate all forms
   - Test error scenarios

4. Documentation:
   - Update all README files
   - Ensure API docs are accurate
   - Add inline code comments for complex logic
   - Update environment variable lists

5. Performance Check:
   - Run Lighthouse audit
   - Check bundle sizes
   - Verify page load times
   - Test API latency

6. Security Audit:
   - Check for exposed secrets
   - Verify authentication works
   - Test rate limiting
   - Validate input sanitization

Go through every file systematically. Create a checklist of issues found and fix them.
```

### Verification Commands:

```bash
# Full build test
cd worker
pnpm install
pnpm build

cd ../dashboard
pnpm install
pnpm build
pnpm lint

# Run all tests
pnpm test

# Security audit
pnpm audit --production

echo "✅ If everything passes, app is ready for deployment!"
```

**Expected Output:**
- Zero build errors
- Zero lint errors
- All tests pass
- No security vulnerabilities
- App ready to deploy

---

## 🚀 DEPLOYMENT TASKS (YOU DO THESE)

### Deploy Worker to Cloudflare

```bash
cd worker

# Login to Cloudflare
wrangler login

# Set environment variables (DO THIS FIRST)
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put UPSTASH_REDIS_REST_URL
wrangler secret put UPSTASH_REDIS_REST_TOKEN
wrangler secret put OPENAI_API_KEY

# Deploy
wrangler deploy --env production

# Add custom domain (in Cloudflare dashboard)
# Workers > Your Worker > Settings > Triggers
# Add: proxy.watchllm.dev
```

### Deploy Dashboard to Vercel

```bash
cd dashboard

# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables in Vercel dashboard:
# Settings > Environment Variables
# Add all NEXT_PUBLIC_* and other vars

# Deploy
vercel --prod

# Add custom domain (in Vercel dashboard)
# Settings > Domains
# Add: watchllm.dev
```

### Setup Domain DNS

1. Go to Cloudflare DNS
2. Add CNAME record:
   - Name: `proxy`
   - Target: `<your-worker>.workers.dev`
3. Add CNAME record:
   - Name: `@` (or `www`)
   - Target: `cname.vercel-dns.com`

### Setup Supabase Database

1. Already done in Task 2
2. Verify tables exist
3. Add initial data if needed

### Setup Stripe Products

```bash
cd dashboard
pnpm tsx scripts/setup-stripe.ts
```

### Test Everything

1. Visit `https://watchllm.dev`
2. Sign up
3. Create project
4. Generate API key
5. Test API call:

```bash
curl https://proxy.watchllm.dev/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

6. Check dashboard for usage
7. Test upgrade flow
8. Verify emails work

---

## 🎯 QUALITY CHECKLIST

Before considering the app complete, verify:

### Functionality
- [ ] User can sign up and login
- [ ] User can create projects
- [ ] User can generate API keys
- [ ] Proxy forwards requests to OpenAI
- [ ] Caching works (second identical request is instant)
- [ ] Dashboard shows usage statistics
- [ ] Stripe checkout works
- [ ] Emails are sent
- [ ] Rate limiting works
- [ ] Error handling works

### Performance
- [ ] Page load <2 seconds
- [ ] API latency <100ms (cache hit)
- [ ] API latency <2s (cache miss)
- [ ] No memory leaks
- [ ] Bundle size <5MB

### Security
- [ ] No exposed secrets
- [ ] API keys are hashed
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] CORS configured
- [ ] No SQL injection vulnerabilities

### UI/UX
- [ ] Mobile responsive
- [ ] Accessible (WCAG AA)
- [ ] Loading states everywhere
- [ ] Error messages helpful
- [ ] Forms validate properly
- [ ] Dark mode works

### Code Quality
- [ ] TypeScript strict mode
- [ ] No console.logs in production
- [ ] Tests pass
- [ ] No lint errors
- [ ] Documentation complete

**If ALL boxes are checked, you have a production-ready app! 🎉**

---

## 📊 ESTIMATED TIMELINE

| Task | Model | Time | Complexity |
|------|-------|------|------------|
| 0. Project Setup | Sonnet 4.5 | 5 min | Easy |
| 1. Cloudflare Worker | Opus 4.5 | 30 min | Hard |
| 2. Database Schema | Sonnet 4.5 | 15 min | Medium |
| 3. Next.js Dashboard | Opus 4.5 | 45 min | Hard |
| 4. Stripe Integration | Sonnet 4.5 | 20 min | Medium |
| 5. Email Notifications | Haiku 4.5 | 15 min | Easy |
| 6. Monitoring | Sonnet 4.5 | 15 min | Easy |
| 7. Testing | Sonnet 4.5 | 30 min | Medium |
| 8. Documentation | Haiku 4.5 | 20 min | Easy |
| 9. Security | Opus 4.5 | 25 min | Hard |
| 10. Performance | Sonnet 4.5 | 20 min | Medium |
| 11. CI/CD | Sonnet 4.5 | 15 min | Easy |
| 12. Final Polish | Opus 4.5 | 30 min | Medium |

**Total Estimated Time: ~4.5 hours** (with AI agent doing all coding)

**Your Time: ~2 hours** (setup accounts, env vars, deployment)

**Total Project Time: ~6.5 hours** from start to production! 🚀

---

## 💡 TIPS FOR SUCCESS

### Working with AI Agents

1. **Be Specific:** The more detailed your prompt, the better the output
2. **Verify Often:** Run verification commands after EVERY task
3. **Ask for Fixes:** If something breaks, paste the error and ask agent to fix
4. **Use Context:** Remind agent of the overall project structure
5. **Save Prompts:** Keep a copy of prompts that worked well

### If You Get Stuck

1. **Read Error Messages:** They usually tell you what's wrong
2. **Google the Error:** Someone has likely seen it before
3. **Check Documentation:** Cloudflare, Supabase, Next.js docs
4. **Ask Agent:** "Explain this error and how to fix it"
5. **Join Communities:** Discord servers, Reddit, Stack Overflow

### Model Selection Strategy

- **Use Haiku for:** Simple tasks, documentation, basic components
- **Use Sonnet for:** Most tasks, good balance of quality and cost
- **Use Opus for:** Complex logic, security, architecture decisions

### Cost Optimization

- Start with Sonnet for everything
- Only use Opus when Sonnet struggles
- Use Haiku for docs and simple edits
- Estimated total cost: $5-15 for entire project

---

## 🚨 TROUBLESHOOTING COMMON ISSUES

### Build Errors

**Problem:** TypeScript errors  
**Solution:** Ask agent: "Fix all TypeScript errors in [file]"

**Problem:** Missing dependencies  
**Solution:** `pnpm install` or ask agent to add to package.json

**Problem:** Module not found  
**Solution:** Check imports, verify package is installed

### Runtime Errors

**Problem:** Supabase connection fails  
**Solution:** Verify env vars are set correctly

**Problem:** Stripe webhook fails  
**Solution:** Check webhook secret, verify signature

**Problem:** API key validation fails  
**Solution:** Check database schema, verify API key format

### Deployment Errors

**Problem:** Wrangler deploy fails  
**Solution:** Check wrangler.toml, verify account ID

**Problem:** Vercel deploy fails  
**Solution:** Check build command, verify env vars

**Problem:** Domain not working  
**Solution:** Wait for DNS propagation (up to 24 hours)

---

## 📞 FINAL NOTES

**You're Not Alone:**
- Join WatchLLM Discord (create one)
- Ask in Cloudflare/Supabase communities
- DM other indie hackers on Twitter

**This is a Learning Experience:**
- You'll learn Next.js, Cloudflare, Stripe, etc.
- You'll understand how SaaS apps work
- You'll build something real and valuable

**The Goal:**
- Ship in 48 hours
- Launch by Day 3
- Get first customer by Week 1
- Hit $2,500/month by Month 3

**You got this! 🚀**

Now, start with Task 0 and work your way through. Copy each prompt, paste into your AI agent, verify the output, and move on. By the end, you'll have a complete, production-ready SaaS application.

**Let's build! 💪**
