# Creating Projects

> Projects are the central billing and quota boundary for WatchLLM.

1. **Navigate to Projects** from the left-hand nav.
2. **Click “New Project”** and give it a descriptive name (e.g., `Support Bot`, `Docs Assistant`).
3. **Choose a default provider** (OpenAI, Anthropic, Groq). You can override this per request via the `model` parameter.
4. **Generate API keys** per project—each key can have custom rate limits and descriptions for auditing.
5. **Assign teammates** by inviting them to your Supabase-authenticated workspace (via `Team` tab). All teammates can view project dashboards but only admins can rotate keys.
6. **Monitor usage** in the project card: requests, cache hit rate, savings, and last payment.
7. **Duplication**: Use the “Clone Project” action to bootstrap new regions or environments while keeping the previous config intact.

Projects are the quickest way to separate dev/test workloads, isolate billing, and track per-team quotas. Follow along with the [managing API keys guide](./managing-api-keys.md) to rotate keys safely.
