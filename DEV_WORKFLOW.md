# Development Workflow Guide

## 🚀 Quick Start

### For Dashboard Development (Most Common)

```bash
# From root directory
pnpm dev
```

This starts **only the dashboard** at `http://localhost:3000`. The worker proxy is handled by Next.js rewrites in development.

---

## 📦 Available Dev Commands

### Dashboard Only (Default)
```bash
pnpm dev
```
- Starts Next.js dashboard at `http://localhost:3000`
- Auto-reloads on file changes
- Uses Next.js rewrites for `/v1/*` API routes

### Dashboard + SDK Development
```bash
pnpm dev:all
```
- Starts dashboard + SDK package in watch mode
- Useful when developing both simultaneously

### Standalone Worker (Node.js)
```bash
pnpm dev:worker
```
- Starts worker server at `http://localhost:8080`
- Uses Node.js runtime (not Cloudflare Workers)
- Auto-reloads with `tsx watch`
- **Use this for local API testing without Docker**

### Worker (Cloudflare Workers Runtime)
```bash
pnpm dev:worker:cf
```
- Uses Wrangler dev server
- **⚠️ May have issues on Windows** (requires Visual C++ Redistributable)
- For production-like Cloudflare Workers environment

---

## 🔧 Why `pnpm dev` Was Failing from Root

**The Problem:**
- Old command: `pnpm --parallel --stream dev`
- Tried to run `dev` script in **all workspaces** simultaneously
- Worker's `dev` script uses `wrangler dev` (Cloudflare Workers runtime)
- Wrangler has runtime issues on Windows (access violation error)

**The Fix:**
- New command: `pnpm --filter @watchllm/dashboard dev`
- Only runs dashboard by default
- Separate commands for worker development

---

## 🛠 Full Development Setup

### Option 1: Dashboard Only (Simplest)
```bash
pnpm dev
```
✅ Dashboard at `http://localhost:3000`
✅ All features work (projects, API keys, analytics)
⚠️ Actual API proxying requires worker or production deployment

### Option 2: Full Stack (Dashboard + Standalone Worker)

**Terminal 1 - Dashboard:**
```bash
pnpm dev
```

**Terminal 2 - Worker:**
```bash
pnpm dev:worker
```

✅ Dashboard at `http://localhost:3000`
✅ Worker API at `http://localhost:8080`
✅ Full proxy functionality with semantic caching

### Option 3: Self-Hosted Docker (Complete System)

```bash
cd self-hosted
docker-compose up -d
```

✅ Dashboard at `http://localhost:3000`
✅ Worker at `http://localhost:8080`
✅ PostgreSQL, Redis, ClickHouse all running
✅ Production-like environment

---

## 🧪 Testing Commands

```bash
# All tests
pnpm test:all

# Standalone worker tests
pnpm test:standalone
pnpm test:standalone:quick
pnpm test:standalone:load

# E2E tests
pnpm test:e2e

# Mock data for screenshots
pnpm seed:mock
```

---

## 📋 Workspace Structure

```
WATCHLLM/
├── dashboard/        # Next.js dashboard (pnpm dev)
├── worker/           # Hono API worker (pnpm dev:worker)
├── packages/
│   ├── emails/       # Email templates (no dev server)
│   ├── sdk-node/     # TypeScript SDK (pnpm dev = watch mode)
│   ├── sdk-python/   # Python SDK (no package.json)
│   └── shared/       # Shared types (no dev server)
└── scripts/          # Utility scripts
```

---

## 💡 Common Workflows

### Working on Dashboard Features
```bash
pnpm dev
# Edit files in dashboard/
# Browser auto-reloads
```

### Working on Worker Logic
```bash
pnpm dev:worker
# Edit files in worker/src/
# Server auto-restarts via tsx watch
# Test API: curl http://localhost:8080/health
```

### Working on SDK
```bash
pnpm dev:all
# Edit SDK files
# TypeScript compiles in watch mode
# Import changes immediately available
```

### Taking Screenshots for Product Hunt
```bash
pnpm seed:mock      # Create realistic data
pnpm dev            # Start dashboard
# Go to http://localhost:3000/dashboard
# Take screenshots 📸
```

---

## 🐛 Troubleshooting

### "Command failed with exit code 1" when running `pnpm dev`
✅ **Fixed!** Now uses `pnpm --filter @watchllm/dashboard dev`

### Wrangler access violation on Windows
💡 Use `pnpm dev:worker` instead of `pnpm dev:worker:cf`

### Port 3000 already in use
```bash
# Find and kill process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### Port 8080 already in use
```bash
# Find and kill process
netstat -ano | findstr :8080
taskkill /PID <process_id> /F
```

### Changes not reflecting
```bash
# Hard refresh browser
Ctrl + Shift + R

# Restart dev server
Ctrl + C (stop)
pnpm dev (restart)
```

---

## 📚 Related Docs

- [Self-Hosted Setup](self-hosted/README.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Mock Data Guide](docs/MOCK_DATA_GUIDE.md)
- [Testing Guide](worker/TESTING.md)
