# TECH_STACK.md - WatchLLM Student Pack Optimized Architecture

> **Mission:** Build a $0/month infrastructure using GitHub Student Developer Pack benefits. Zero costs until $5k MRR.

---

## 🎯 Core Philosophy

**Every dollar saved on infrastructure = one more dollar in your pocket**

You have access to ~$10,000/year in free services. We're going to use EVERY SINGLE ONE.

---

## 🏗️ The Complete Architecture

### Frontend & Dashboard
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Framework** | Next.js 14 (App Router) | N/A | Industry standard, great DX | $0 |
| **Hosting** | Vercel | Free hobby plan | Auto-deploy from Git, edge functions | $0 |
| **UI Components** | Shadcn/ui + Tailwind | N/A | Beautiful, copy-paste, no bundle bloat | $0 |
| **State Management** | React Server Components | N/A | Minimize client JS, faster page loads | $0 |
| **Forms** | React Hook Form + Zod | N/A | Type-safe validation | $0 |

**Total Frontend Cost:** **$0/month**

---

### Backend & Proxy (Core Product)
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Proxy Runtime** | Hono + Cloudflare Workers | Free 100k req/day | Edge deployment, 0ms cold starts, global | $0 |
| **Database** | Supabase (Postgres) | Free tier (500MB, 50k MAU) | Auth built-in, realtime, generous limits | $0 |
| **Cache Layer** | Cloudflare KV | Free 100k reads/day | Edge caching, built into Workers | $0 |
| **Semantic Cache** | Upstash Redis | Free 10k commands/day | Serverless Redis, pay-per-request | $0 |
| **File Storage** | Cloudflare R2 | Free 10GB | For storing request logs (if needed) | $0 |

**Total Backend Cost:** **$0/month** (until 100k requests/day)

---

### DevOps & Infrastructure
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Domain** | Name.com | Free .dev/.app domain | Professional domain for credibility | $0 |
| **SSL** | Cloudflare | Automatic with CF Workers | Free SSL for proxy.watchllm.dev | $0 |
| **DNS** | Cloudflare | Free | Fast, reliable, DDoS protection | $0 |
| **Code Hosting** | GitHub | GitHub Pro (Student) | Private repos, advanced insights, Actions | $0 |
| **CI/CD** | GitHub Actions | 3000 minutes/month free | Auto-deploy Worker + Dashboard | $0 |
| **IDE** | JetBrains WebStorm/PyCharm | Free annual license | Best-in-class IDE | $0 ($500 value) |
| **Git Client** | GitKraken | Free for 6 months | Visual Git, easier merges | $0 ($100 value) |

**Total DevOps Cost:** **$0/month** (~$600/month value)

---

### Monitoring & Observability
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **APM** | Datadog | Free for 10 servers, 2 years | Full observability, traces, logs | $0 ($300 value) |
| **Error Tracking** | Sentry | 50k errors/month | Catch bugs in production | $0 ($26 value) |
| **Uptime Monitoring** | UptimeRobot | Free 50 monitors | 5-min checks on proxy endpoint | $0 |
| **Analytics** | SimpleAnalytics | Free for 1 year | Privacy-friendly, GDPR compliant | $0 ($9 value) |
| **Logs** | Cloudflare Logs | Free | Worker logs, built-in | $0 |

**Total Monitoring Cost:** **$0/month** (~$335/month value)

---

### Payments & Billing
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Payments** | Stripe | Waived fees on first $1,000 | Industry standard, webhook-driven | 2.9% + $0.30 |
| **Invoicing** | Stripe Billing | Built-in | Automated subscription billing | $0 |
| **Tax Calculation** | Stripe Tax | Built-in | Auto-calculate sales tax | 0.5% of transaction |

**Total Payment Cost:** ~3.4% of revenue (industry standard)

---

### Communication & Support
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Transactional Email** | Mailgun | 20k emails/month for 12 months | Reliable delivery, webhooks | $0 |
| **Email Templates** | React Email | N/A | JSX-based email templates | $0 |
| **Support** | Plain (alt: Crisp) | Free tier | Simple support inbox | $0 |
| **Docs** | Mintlify (alt: Bump.sh) | Bump.sh: Free for students | Beautiful API docs | $0 ($149 value) |

**Total Communication Cost:** **$0/month** (~$150/month value)

---

### Security & Secrets
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Secrets Management** | 1Password | Free for 1 year | Store API keys, credentials securely | $0 ($36 value) |
| **Environment Vars** | Cloudflare Secrets | Built-in | Encrypted env vars for Workers | $0 |
| **DDoS Protection** | Cloudflare | Free | Automatic DDoS mitigation | $0 |
| **Rate Limiting** | Cloudflare Workers | Built-in | Prevent abuse | $0 |

**Total Security Cost:** **$0/month** (~$40/month value)

---

### Testing & QA
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Unit Tests** | Vitest | N/A | Fast, compatible with Vite | $0 |
| **E2E Tests** | Playwright | N/A | Cross-browser testing | $0 |
| **Browser Testing** | BrowserStack | Free for 1 year | Test on real devices | $0 ($30 value) |
| **API Testing** | Bruno (alt: Insomnia) | N/A | Lightweight, local-first | $0 |

**Total Testing Cost:** **$0/month** (~$30/month value)

---

### Collaboration & Docs
| Component | Tool | Student Pack Benefit | Why | Monthly Cost |
|-----------|------|---------------------|-----|--------------|
| **Documentation** | Notion | Education plan + AI | Planning, roadmap, internal docs | $0 ($10 value) |
| **Design** | Figma | Free tier | Design mockups (if needed) | $0 |
| **Screenshots** | CleanShot X / ShareX | N/A | Product screenshots for marketing | $0 |

**Total Collaboration Cost:** **$0/month** (~$10/month value)

---

## 📊 Cost Breakdown Summary

| Category | Tools Used | Monthly Value | Your Cost |
|----------|------------|---------------|-----------|
| **Frontend & Hosting** | Vercel, Next.js | ~$20 | $0 |
| **Backend & Database** | Cloudflare Workers, Supabase | ~$50 | $0 |
| **DevOps & Tools** | GitHub Pro, JetBrains, GitKraken | ~$600 | $0 |
| **Monitoring** | Datadog, Sentry, SimpleAnalytics | ~$335 | $0 |
| **Communication** | Mailgun, Bump.sh | ~$150 | $0 |
| **Security** | 1Password, Cloudflare | ~$40 | $0 |
| **Testing** | BrowserStack | ~$30 | $0 |
| **Collaboration** | Notion | ~$10 | $0 |
| **TOTAL** | 25+ services | **~$1,235/month** | **$0** |

**You're capturing $1,235/month in value for FREE until you hit scale.**

---

## 🚀 The Recommended Stack (My Expert Opinion)

After analyzing all Student Pack benefits, here's the OPTIMAL stack for WatchLLM:

### 🏆 Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Cloudflare DNS      │  (Free, DDoS protection)
         │   watchllm.dev        │
         └───────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────────────┐
│   Vercel     │   │  Cloudflare Workers  │
│  Dashboard   │   │   (Proxy Runtime)    │
│  Next.js 14  │   │   Hono Framework     │
└──────┬───────┘   └──────┬───────────────┘
       │                  │
       │                  ├─────┐
       │                  │     │
       ▼                  ▼     ▼
┌──────────────┐   ┌─────────┐ ┌──────────┐
│  Supabase    │   │Upstash  │ │ OpenAI   │
│  (Auth + DB) │   │ Redis   │ │Anthropic │
│  Postgres    │   │ Cache   │ │  Groq    │
└──────────────┘   └─────────┘ └──────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         Monitoring Layer                 │
│  Datadog, Sentry, SimpleAnalytics        │
└──────────────────────────────────────────┘
```

---

## 💻 Development Environment Setup

### Required Software
```bash
# Install these (one-time setup)
1. VS Code or JetBrains WebStorm (FREE with Student Pack)
2. Node.js v20+ (via nvm or direct install)
3. pnpm (faster than npm)
4. Git + GitKraken (FREE with Student Pack)
5. Wrangler CLI (Cloudflare)
6. Supabase CLI
```

### Setup Script
```bash
# Install Node.js 20
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install Wrangler (Cloudflare CLI)
pnpm install -g wrangler

# Install Supabase CLI (Mac)
brew install supabase/tap/supabase

# Install Supabase CLI (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Login to Wrangler
wrangler login

# Login to Supabase
supabase login
```

---

## 🎯 Why This Stack Beats Everything Else

### ❌ Alternative Stacks I Considered (And Why They're Worse)

#### Option 1: Traditional VPS (DigitalOcean)
```
Cost: $12/month (droplet) + $15/month (managed Postgres) = $27/month
Why worse: You'd hit $324/year before making a single dollar
Latency: Single region (slow for global users)
Scaling: Manual (you have to manage servers)
```

#### Option 2: AWS/GCP
```
Cost: Complex pricing, easy to overspend
Why worse: $50-200/month for similar setup, billing surprises
Learning curve: Steeper than Cloudflare
Free tier: Expires after 12 months
```

#### Option 3: Heroku + Postgres
```
Cost: $7/month (dyno) + $5/month (postgres) = $12/month
Why worse: Not truly serverless, cold starts
Scaling: Limited on free tier
```

#### Option 4: Railway/Render
```
Cost: ~$10-20/month
Why worse: Startup risk (could shut down/change pricing)
Scaling: Not edge-deployed (latency issues)
```

### ✅ Why Cloudflare Workers + Supabase Wins

1. **$0/month until scale** - No fixed costs
2. **Global edge deployment** - 300+ data centers
3. **0ms cold starts** - Unlike Lambda/GCP Functions
4. **Built-in caching** - Cloudflare KV is included
5. **DDoS protection** - Automatic, enterprise-grade
6. **Student Pack alignment** - Maximizes free resources
7. **Production-grade** - Used by Discord, Shopify, etc.
8. **Simple pricing** - No surprise bills

---

## 📈 Scaling Plan (When You Hit Limits)

### At 100k requests/day (~3M/month):
```
Cloudflare Workers: Still FREE (100k req/day limit)
Supabase: Upgrade to Pro ($25/month) for more storage
Upstash Redis: Still FREE (10k commands/day)
Total cost: $25/month

Revenue at this point: ~$2,000/month (80 customers)
Margin: 98.75%
```

### At 1M requests/day (~30M/month):
```
Cloudflare Workers: $5/month (bundled + paid tier)
Supabase: $25/month (Pro tier)
Upstash Redis: $10/month (pay-as-go)
Total cost: $40/month

Revenue at this point: ~$8,000/month (200+ customers)
Margin: 99.5%
```

### At 10M requests/day (~300M/month):
```
Cloudflare Workers: $50/month
Supabase: $99/month (Team tier)
Upstash Redis: $50/month
Datadog: $300/month (graduate from student pack)
Total cost: $499/month

Revenue at this point: ~$30,000/month (1000+ customers)
Margin: 98.3%
```

**You won't hit infrastructure costs until you're VERY profitable.**

---

## 🔥 The "Deploy in 4 Hours" Checklist

### Hour 1: Foundation
- [ ] Create GitHub account (use Student email)
- [ ] Apply for GitHub Student Developer Pack
- [ ] Create Cloudflare account
- [ ] Create Supabase account
- [ ] Create Upstash account
- [ ] Register domain on Name.com (FREE with Student Pack)

### Hour 2: Backend
- [ ] Deploy Cloudflare Worker (proxy)
- [ ] Set up Supabase database
- [ ] Configure authentication
- [ ] Test API key validation

### Hour 3: Frontend
- [ ] Deploy Next.js to Vercel
- [ ] Connect Supabase
- [ ] Build login/signup flow
- [ ] Create basic dashboard

### Hour 4: Polish
- [ ] Set up Stripe
- [ ] Configure Mailgun
- [ ] Add Sentry error tracking
- [ ] Deploy to production

**You can have a working MVP in 4 hours.** No excuses.

---

## 🛠️ Detailed Implementation Guide

### 1. Cloudflare Worker Setup

```bash
# Create new Worker project
npm create cloudflare@latest watchllm-proxy
cd watchllm-proxy

# Install Hono (lightweight framework)
pnpm add hono

# Install dependencies
pnpm add @supabase/supabase-js
pnpm add @upstash/redis
```

**worker/src/index.ts:**
```typescript
import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis/cloudflare';

const app = new Hono();

// Proxy endpoint
app.post('/v1/chat/completions', async (c) => {
  const apiKey = c.req.header('Authorization')?.replace('Bearer ', '');
  
  // 1. Validate API key via Supabase
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_ANON_KEY
  );
  
  const { data: key } = await supabase
    .from('api_keys')
    .select('project_id')
    .eq('key', apiKey)
    .single();
  
  if (!key) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  // 2. Check cache
  const redis = new Redis({
    url: c.env.UPSTASH_REDIS_URL,
    token: c.env.UPSTASH_REDIS_TOKEN,
  });
  
  const body = await c.req.json();
  const cacheKey = `cache:${JSON.stringify(body)}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return c.json(cached);
  }
  
  // 3. Forward to OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  
  const data = await response.json();
  
  // 4. Cache response
  await redis.set(cacheKey, data, { ex: 3600 }); // 1 hour
  
  // 5. Log usage
  await supabase.from('usage_logs').insert({
    project_id: key.project_id,
    model: body.model,
    tokens: data.usage.total_tokens,
    cached: false,
  });
  
  return c.json(data);
});

export default app;
```

**Deploy:**
```bash
wrangler deploy
```

---

### 2. Supabase Database Schema

```sql
-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  model TEXT NOT NULL,
  tokens INT NOT NULL,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_usage_logs_project_id ON usage_logs(project_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
```

---

### 3. Next.js Dashboard Setup

```bash
# Create Next.js app
npx create-next-app@latest watchllm-dashboard --typescript --tailwind --app
cd watchllm-dashboard

# Install dependencies
pnpm add @supabase/ssr
pnpm add @supabase/supabase-js
pnpm add shadcn-ui
pnpm add recharts
pnpm add stripe
```

**app/dashboard/page.tsx:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies }
  );
  
  // Get user's projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*');
  
  // Get usage stats
  const { data: stats } = await supabase
    .from('usage_logs')
    .select('tokens, cached')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  
  const totalTokens = stats?.reduce((sum, log) => sum + log.tokens, 0) || 0;
  const cachedTokens = stats?.filter(log => log.cached).reduce((sum, log) => sum + log.tokens, 0) || 0;
  const savings = (cachedTokens / totalTokens) * 100;
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Total Requests</h3>
          <p className="text-3xl font-bold">{stats?.length || 0}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Cache Hit Rate</h3>
          <p className="text-3xl font-bold">{savings.toFixed(1)}%</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm text-gray-500">Estimated Savings</h3>
          <p className="text-3xl font-bold text-green-600">
            ${((cachedTokens * 0.00002)).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎓 Learning Resources (FREE with Student Pack)

### Week 1: Build the Foundation
- [ ] **FrontendMasters** (6 months FREE): "Complete Intro to React" + "Intermediate Next.js"
- [ ] **Educative** (6 months FREE): "Grokking System Design" for caching strategies
- [ ] **JetBrains Academy**: TypeScript + Node.js courses

### Week 2: Advanced Patterns
- [ ] **FrontendMasters**: "Advanced TypeScript" + "API Design in Node.js"
- [ ] **Cloudflare Docs**: Workers tutorials (free)
- [ ] **Supabase Docs**: Auth + RLS tutorials (free)

### Week 3-4: Growth & Marketing
- [ ] **Educative**: "System Design for Beginners" - understand caching
- [ ] **DataCamp** (3 months FREE): SQL for analytics queries
- [ ] Free YouTube: "How to Launch on Product Hunt", "Cold DM strategies"

**You have 6 months of premium education content for FREE. Use it.**

---

## 🚨 Critical Student Pack Expiration Dates

| Benefit | Duration | Expires | Action Needed |
|---------|----------|---------|---------------|
| **GitHub Pro** | While student | Graduation | Keep student status |
| **DigitalOcean $200** | 1 year | Dec 2026 | Use for backups only |
| **Heroku $13/mo** | 24 months | Dec 2027 | Use for staging |
| **JetBrains** | Annual renewal | Dec 2026 | Renew yearly |
| **1Password** | 1 year | Dec 2026 | Migrate to personal plan |
| **Datadog** | 2 years | Dec 2027 | Graduate to paid or switch |
| **BrowserStack** | 1 year | Dec 2026 | Only use when needed |
| **Name.com domain** | 1 year | Dec 2026 | Pay $12/year after |

**Key Strategy:** Build on Cloudflare/Vercel (no expiration), use Student Pack for extras.

---

## ✅ Recommended Action Plan (Next 48 Hours)

### Today (4 hours):
1. ✅ Apply for GitHub Student Developer Pack (if not done)
2. ✅ Create accounts: Cloudflare, Supabase, Upstash, Vercel
3. ✅ Register domain on Name.com (FREE .dev or .app)
4. ✅ Clone starter repo (or create from scratch)
5. ✅ Deploy basic Worker to Cloudflare
6. ✅ Deploy Next.js to Vercel

### Tomorrow (6 hours):
7. ✅ Implement API key validation
8. ✅ Add semantic caching with Upstash
9. ✅ Create Supabase tables
10. ✅ Build signup/login flow
11. ✅ Add basic dashboard (show "You saved $X")
12. ✅ Connect Stripe

### Day 3 (2 hours):
13. ✅ Add Sentry error tracking
14. ✅ Configure Mailgun for emails
15. ✅ Test end-to-end
16. ✅ Launch free tier

**By Day 4, you're accepting signups.**

---

## 📝 Monthly Checklist (Stay Within Free Limits)

### Every Monday:
- [ ] Check Cloudflare Workers usage (should be <100k req/day)
- [ ] Check Supabase storage (should be <500MB)
- [ ] Check Upstash Redis usage (should be <10k commands/day)
- [ ] Review Datadog dashboard for errors

### Every Month:
- [ ] Verify Student Pack status (still active?)
- [ ] Check all free tiers (any approaching limits?)
- [ ] Review error rates in Sentry
- [ ] Backup Supabase database

### When You Hit 80% of Any Free Limit:
1. **Don't panic** - you're growing! 🎉
2. **Upgrade that service** - you have revenue now
3. **Optimize** - can you reduce usage?
4. **Scale horizontally** - multiple Workers, read replicas

---

## 💰 The Math (Why This Stack Wins)

**Traditional Stack Cost (AWS/Heroku):**
```
EC2 t3.small: $15/month
RDS Postgres: $25/month
Redis: $15/month
Domain: $12/year
SSL: $10/year
Total: $56/month = $672/year
```

**This Stack Cost (Student Pack):**
```
Cloudflare Workers: $0
Supabase: $0
Upstash Redis: $0
Name.com domain: $0 (year 1)
SSL: $0 (Cloudflare)
Total: $0/month = $0/year
```

**Savings:** $672/year = 23 paying customers at $29/month

**You need 23 FEWER customers to be profitable.**

---

## 🎯 Final Recommendation

**Use this EXACT stack:**

1. **Proxy:** Hono + Cloudflare Workers
2. **Database:** Supabase
3. **Cache:** Upstash Redis
4. **Frontend:** Next.js 14 + Vercel
5. **Payments:** Stripe
6. **Monitoring:** Datadog + Sentry
7. **Email:** Mailgun
8. **Docs:** Bump.sh
9. **Domain:** Name.com (.dev)

**Do NOT:**
- Use AWS (too complex, too expensive)
- Use DigitalOcean (fixed costs, single region)
- Use Heroku (not truly serverless)
- Build your own auth (use Supabase)
- Build your own analytics (use Datadog)

**Every hour spent on infrastructure is an hour NOT spent getting customers.**

---

*This stack will take you from $0 to $10k MRR without changing anything. Ship fast, iterate later.*
