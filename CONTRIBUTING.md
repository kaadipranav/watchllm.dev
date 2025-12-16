# Contributing to WatchLLM

![Screenshot placeholder](https://via.placeholder.com/900x360.png?text=Contribution+Flow)

Thanks for helping improve WatchLLM. Follow this checklist to collaborate effectively.

## 1. Pick a task

- Browse [TASKS.md](./TASKS.md) for curated work.
- Have an idea? Open an issue with the change, motivation, and approach.

## 2. Local setup

```bash
pnpm install
pnpm --filter @watchllm/worker dev    # Worker proxy (use :node fallback on Windows)
pnpm --filter @watchllm/dashboard dev   # Dashboard (Next.js app)
```

Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for production-like requirements.

## 3. Testing

- Run `pnpm test` for unit and integration suites.
- For coverage, use `pnpm test:coverage` in both worker and dashboard.
- Add regression tests when touching billing, caching, or API contracts.

## 4. Standards & style

- TypeScript only (strict mode across the workspace).
- Use `pnpm lint` and `pnpm format` (if available) before committing.
- Instruments should emit structured logs (JSON) for Datadog ingestion.
- Document new features in `dashboard/public/docs` and update `README.md` when APIs change.

## 5. Submit a PR

1. Branch off `main`, include a clear summary, and link TASKS/issues.
2. One feature per PR keeps reviews fast.
3. Include screenshots, API payloads, or recording links for UI/API changes.
4. GitHub will run lint/test builds; ensure they pass locally first.

Need help? Mention us in repo discussions or Slack; we love thoughtful contributions.
