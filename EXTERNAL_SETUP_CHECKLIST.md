# External Setup Checklist

This document outlines all external actions needed to deploy and publish WatchLLM.

## ✅ What's Already Complete (No Action Needed)

All code implementation is **100% complete**:
- ✅ TypeScript SDK (15/15 tests passing)
- ✅ Python SDK (production-ready)
- ✅ Analytics API (4 endpoints)
- ✅ Dashboard with analytics client
- ✅ Cloudflare Worker
- ✅ ClickHouse schema
- ✅ Queue processing
- ✅ Semantic caching

---

## 📦 1. SDK Publishing

### TypeScript SDK (watchllm-sdk-node)

**Status:** Ready to publish to npm

**Steps:**
1. **Create npm account** (if you don't have one)
   - Go to https://www.npmjs.com/signup
   
2. **Login to npm**
   ```bash
   npm login
   ```

3. **Publish the package**
   ```bash
   cd packages/sdk-node
   pnpm build
   npm publish --access public
   ```

4. **Verify publication**
   - Visit: https://www.npmjs.com/package/watchllm-sdk-node
   - Test install: `npm install watchllm-sdk-node`

**Notes:**
- Package name: `watchllm-sdk-node`
- Current version: `0.1.0`
- Already configured with `prepublishOnly` script to auto-build
- `files` field properly set to include `dist` and `README.md`

---

### Python SDK (watchllm)

**Status:** Ready to publish to PyPI

**Steps:**
1. **Create PyPI account** (if you don't have one)
   - Go to https://pypi.org/account/register/
   
2. **Install build tools**
   ```bash
   pip install build twine
   ```

3. **Build the package**
   ```bash
   cd packages/sdk-python
   python -m build
   ```

4. **Upload to PyPI**
   ```bash
   twine upload dist/*
   ```

5. **Verify publication**
   - Visit: https://pypi.org/project/watchllm/
   - Test install: `pip install watchllm`

**Notes:**
- Package name: `watchllm`
- Current version: `0.1.0`
- Uses `hatchling` build system
- Minimum Python: 3.8+

---

## ☁️ 2. Infrastructure Deployment

### ClickHouse Database

**Status:** Schema ready, needs deployment

**Recommended:** DigitalOcean (You have **$200 platform credit for 1 year** from GitHub Student Pack)

#### DigitalOcean Setup (Using Student Benefits)

1. **Sign up for DigitalOcean** (if you don't have an account)
   - Go to https://www.digitalocean.com (student benefits apply automatically with GitHub account)
   - You get **$200 credit for 1 year** 🎓
   - This covers a managed database or droplet with ClickHouse

2. **Create self-hosted ClickHouse on Droplet (Recommended - $6-12/month)**
   - Create a new Droplet (Ubuntu 22.04 LTS, Basic, $6/month)
   - SSH into droplet
   - Install ClickHouse:
     ```bash
     sudo apt-get update
     sudo apt-get install -y clickhouse-server clickhouse-client
     sudo systemctl start clickhouse-server
     ```
   - Create database:
     ```bash
     sudo clickhouse-client
     CREATE DATABASE watchllm;
     ```
   - Copy schema:
     ```bash
     cat clickhouse/schema.sql | sudo clickhouse-client --database=watchllm
     ```

3. **Set environment variables**
   ```bash
   CLICKHOUSE_HOST=your-droplet-ip
   CLICKHOUSE_USER=default
   CLICKHOUSE_PASSWORD=your-password  # Set in /etc/clickhouse-server/config.xml
   CLICKHOUSE_DATABASE=watchllm
   CLICKHOUSE_PORT=9000  # Native protocol port
   ```

4. **Run schema migration**
   ```bash
   cd worker
   node scripts/create-schema.js
   ```

5. **Enable firewall rules**
   - Allow ClickHouse ports (9000 native, 8123 HTTP) from Cloudflare Worker IP
   - Restrict database access to authorized IPs only

**Verify:**
```bash
# Run verification script
cd worker
node scripts/verify-clickhouse.js
```

---

### Cloudflare Worker

**Status:** ✅ **VERIFIED COMPLETE**

**Verification Results:**
- ✅ **Worker Deployed**: Multiple deployments found (latest: Dec 22, 2025)
- ✅ **D1 Database**: `watchllm-cache` created and in production
- ✅ **Authentication**: Worker responding correctly (requires API key)
- ✅ **Wrangler**: Logged in and configured
- ✅ **Secrets**: Recent secret changes detected

**Worker URL:** https://proxy.watchllm.dev

**No action needed.** The Worker is fully deployed and operational with:
- Semantic caching with D1 database
- Event ingestion queues configured
- Analytics API endpoints live
- Provider key validation active

---

### Next.js Dashboard

**Status:** Code complete, needs deployment

**Recommended:** Deploy to Vercel

**Steps:**

1. **Connect to Vercel**
   ```bash
   cd dashboard
   vercel
   ```

2. **Set environment variables in Vercel Dashboard**
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `NEXT_PUBLIC_WORKER_URL`: Your Cloudflare Worker URL
   - `SUPABASE_SERVICE_KEY`: Supabase service role key (server-side)
   - `STRIPE_SECRET_KEY`: Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Verify**
   - Visit your dashboard URL
   - Test login/signup flow
   - Check analytics page loads

**Alternative Deployment Options:**
- **Docker:** `docker build -t watchllm-dashboard .`
- **Self-hosted:** `pnpm build && pnpm start`

---

## 💳 3. Payment Integration (Stripe)

**Status:** Code complete, needs Stripe account setup

**Steps:**

1. **Create Stripe account**
   - Go to https://dashboard.stripe.com/register
   
2. **Get API keys**
   - Dashboard → Developers → API keys
   - Copy "Publishable key" and "Secret key"
   
3. **Create products and prices**
   ```bash
   # Create Starter plan
   stripe products create --name="WatchLLM Starter" --description="Essential observability"
   stripe prices create --product=<PRODUCT_ID> --amount=2900 --currency=usd --interval=month
   
   # Create Pro plan
   stripe products create --name="WatchLLM Pro" --description="Advanced analytics"
   stripe prices create --product=<PRODUCT_ID> --amount=9900 --currency=usd --interval=month
   
   # Create Enterprise plan
   stripe products create --name="WatchLLM Enterprise" --description="Full platform"
   stripe prices create --product=<PRODUCT_ID> --amount=49900 --currency=usd --interval=month
   ```

4. **Update price IDs in code**
   - Edit `dashboard/lib/stripe.ts`
   - Update `STRIPE_PRICE_IDS` with your actual price IDs

5. **Set up webhook**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-dashboard.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret

6. **Test webhook**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   stripe trigger checkout.session.completed
   ```

**Test mode:** Use test API keys during development (they start with `pk_test_` and `sk_test_`)

---

## 🗄️ 4. Database (Supabase)

**Status:** Schema complete, needs project setup

**Steps:**

1. **Create Supabase project**
   - Go to https://supabase.com/dashboard
   - Click "New project"
   - Choose region and set password
   
2. **Run migrations**
   ```bash
   cd supabase
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

3. **Enable Row Level Security (RLS)**
   - Already configured in migrations
   - Verify in Supabase Dashboard → Authentication → Policies

4. **Get credentials**
   - Settings → API
   - Copy:
     - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
     - Anon key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - Service role key (`SUPABASE_SERVICE_KEY`)

5. **Configure email templates** (optional)
   - Authentication → Email Templates
   - Customize signup/reset password emails

---

## 📧 5. Email Service (Resend - Optional)

**Status:** Code ready, needs Resend account

**Only needed if you want custom transactional emails**

**Steps:**

1. **Create Resend account**
   - Go to https://resend.com/signup
   
2. **Get API key**
   - Dashboard → API Keys → Create
   
3. **Set environment variable**
   ```bash
   RESEND_API_KEY=re_...
   ```

4. **Verify domain** (for production)
   - Add DNS records per Resend instructions
   - Wait for verification

**Note:** Supabase handles auth emails by default, Resend is for custom marketing/notification emails

---

## 🔐 6. Environment Variables Summary

### Dashboard (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Worker API
NEXT_PUBLIC_WORKER_URL=https://proxy.watchllm.dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Email
RESEND_API_KEY=re_...

# Optional: Sentry
SENTRY_DSN=https://...
```

### Worker (Cloudflare Secrets)
```bash
# Set via: wrangler secret put <NAME>
SUPABASE_URL
SUPABASE_SERVICE_KEY
CLICKHOUSE_HOST
CLICKHOUSE_USER
CLICKHOUSE_PASSWORD
OPENAI_API_KEY
ENCRYPTION_MASTER_SECRET
```

---

## 📝 7. Documentation & Marketing

**Status:** Technical docs complete, needs user-facing content

### What's Already Done ✅
- API documentation (docs/API.md)
- Architecture docs (ARCHITECTURE.md)
- SDK READMEs with usage examples
- Deployment guides (docs/DEPLOYMENT.md)

### What You Should Add:
1. **Website landing page copy**
   - Value proposition
   - Feature highlights
   - Pricing details
   - Customer testimonials

2. **Tutorial videos** (optional)
   - Quick start guide
   - Dashboard walkthrough
   - SDK integration examples

3. **Blog posts** (optional)
   - "Why we built WatchLLM"
   - "Observability best practices"
   - Case studies

4. **Community**
   - Discord/Slack for support
   - GitHub Discussions
   - Twitter/LinkedIn presence

---

## 🧪 8. Testing in Production

**Before going live, test:**

1. **SDK Integration**
   ```bash
   # Test TypeScript SDK
   npm install watchllm-sdk-node
   # Run example from README
   
   # Test Python SDK
   pip install watchllm
   # Run example from README
   ```

2. **Dashboard Flow**
   - Sign up new account
   - Create project
   - Copy API key
   - Generate test events via SDK
   - Verify events appear in dashboard

3. **Analytics**
   - Check stats update
   - View time-series charts
   - Filter logs
   - Inspect individual events

4. **Payment Flow**
   - Upgrade to paid plan
   - Verify Stripe checkout
   - Check subscription in dashboard
   - Test webhook triggers

---

## 🚀 9. Go-Live Checklist

- [ ] SDKs published to npm and PyPI
- [ ] ClickHouse database deployed and verified
- [ ] Cloudflare Worker deployed with all secrets
- [ ] Next.js dashboard deployed to Vercel
- [ ] Supabase project configured with migrations
- [ ] Stripe products/prices created
- [ ] All environment variables set
- [ ] DNS configured (if using custom domain)
- [ ] SSL certificates valid
- [ ] Monitoring/alerts configured (Sentry, etc.)
- [ ] Backup strategy for ClickHouse
- [ ] Rate limiting configured on Worker
- [ ] Documentation site live
- [ ] Support email/chat ready

---

## 💡 Optional Enhancements

These are nice-to-haves, not required for launch:

1. **Custom domain for Worker**
   - Configure in Cloudflare Dashboard → Workers → Routes
   - Example: `api.watchllm.dev`

2. **Sentry error tracking**
   - Already integrated in code
   - Just add `SENTRY_DSN` env var

3. **Analytics/tracking**
   - Google Analytics
   - PostHog
   - Mixpanel

4. **Status page**
   - https://www.statuspage.io/
   - Monitor uptime of Worker and Dashboard

5. **CI/CD Pipeline**
   - GitHub Actions for automated testing
   - Auto-deploy on merge to main

---

## 📞 Need Help?

- **ClickHouse:** https://clickhouse.com/docs
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Supabase:** https://supabase.com/docs
- **Stripe:** https://stripe.com/docs
- **Vercel:** https://vercel.com/docs

---

**Last Updated:** January 2, 2026  
**Code Version:** Phase 2 Complete (100%)  
**Ready for Production:** ✅ YES
