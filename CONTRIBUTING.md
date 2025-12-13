# Contributing to WatchLLM

Thanks for helping build the AI cost-saving stack! Follow these steps to keep contributions smooth and predictable.

## 1. Pick a Task
- Review [TASKS.md](./TASKS.md) for ready-to-code items.<br>
- If you have an idea, open an issue with: what you want to change, why, and how you might tackle it.

## 2. Setup Locally
```bash
pnpm install
pnpm --filter @watchllm/worker dev
pnpm --filter @watchllm/dashboard dev
```
Refer to [DEPLOYMENT.md](./DEPLOYMENT.md) for production-like setup.

## 3. Testing
- Run `pnpm test` to execute unit + integration suites.
- Coverage lives in `dashboard` and `worker` via `pnpm test:coverage` (see [TASK 7](./TASKS.md)).
- Add tests for critical logic before landing your change.

## 4. Coding Standards
- TypeScript only—keep `tsconfig.json` harmonized across packages (`pnpm` workspaces handle this).
- Keep logger output structured (JSON) when adding instrumentation.
- Add doc updates when you touch consumer-facing flows (signup, billing, API).

## 5. Submit a PR
- Branch off from `main` and rebase before merging.
- One feature per PR keeps reviews sharp.
- Include screenshots or API payloads in the PR description for visual changes.
- Use GitHub's review checklist to ensure tests, lint, and docs run.

_Got stuck? Ping us in the repo discussions or open an issue. We’re grateful for every improvement!_
