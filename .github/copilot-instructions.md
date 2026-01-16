# WatchLLM Copilot Instructions

You are an expert AI coding assistant working in the WatchLLM codebase. WatchLLM is an AI API cost optimization proxy that uses semantic caching to reduce costs.

## 🏗 Architecture Overview

The project is a **monorepo** managed by **pnpm**.
- **`worker/`**: Cloudflare Worker + Hono. The core proxy engine. Handles request validation, caching logic (Redis), and upstream forwarding (OpenAI/Anthropic).
- **`dashboard/`**: Next.js 14 (App Router) + Supabase. User interface for managing projects, API keys, and viewing analytics.
- **`packages/`**: Shared libraries (emails, SDKs).
- **`scripts/`**: Custom maintenance and testing scripts.

## 🛠 Critical Workflows & Commands

- **Package Manager**: ALWAYS use `pnpm`. Never use `npm` or `yarn`.
- **Development**: `pnpm dev` starts all services (worker, dashboard) in parallel.
- **Build**: `pnpm build` builds the entire workspace.
- **Testing**:
  - `pnpm test:all` runs linting, type-checking, unit tests (Vitest), and dashboard E2E (Playwright).
  - `pnpm --filter @watchllm/worker test` runs worker unit tests.
  - `pnpm --filter @watchllm/dashboard test:e2e` runs Playwright tests.
  - **Custom Scripts**: Use `node scripts/test-*.js` for specific integration tests (e.g., `scripts/test-proxy.js`).

## 🧩 Coding Conventions

### General
- **TypeScript**: Strict mode is enabled. Ensure full type safety.
- **Path Aliases**: Use `@/` imports where configured (e.g., in Dashboard).

### Worker (Proxy)
- **Runtime**: Cloudflare Workers (Edge). **DO NOT** use Node.js specific APIs (fs, child_process) inside `worker/`.
- **Framework**: Uses **Hono** for routing and middleware.
- **State**: `Upstash Redis` for caching/rate-limiting, `Supabase` for persistent data.

### Dashboard (Frontend)
- **Framework**: Next.js 14 App Router.
- **Data Fetching**: Use **Server Components** for data fetching (`@supabase/ssr`).
- **Mutations**: Use **Server Actions** for form submissions and data mutations.
- **UI**: Tailwind CSS + Shadcn/ui components.
- **Auth**: Supabase Auth helpers.

## 📚 Key Integrations & Patterns
- **Database**: Supabase (Postgres). Schema is managed via migrations in `supabase/migrations`.
- **Analytics**: ClickHouse is used for high-volume log ingestion.
- **Payments**: Whop/Stripe integration handles subscriptions (webhooks in `dashboard/app/api/webhooks/stripe`).

## ⚠️ Important Considerations
- **Environment**: This project relies heavily on environment variables (`.env`, `.dev.vars`). Check `env.d.ts` or `next-env.d.ts` for type definitions.
- **Cost**: The core value prop is cost reduction. Code in the hot path (proxy) must be highly optimized for latency and efficiency.
