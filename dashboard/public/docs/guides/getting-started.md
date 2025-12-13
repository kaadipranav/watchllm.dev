# Getting Started

> Everything you need to go from signup to caching in under five minutes.

1. **Sign up** at https://watchllm.dev/signup and verify your email.
2. **Create a project** once you land in the dashboard; every project has a unique `lgw_proj_...` API key.
3. **Protect your keys**: Store the new key in 1Password and only expose it from your backend or serverless functions.
4. **Point your client** to `https://proxy.watchllm.dev/v1` and pass the key via `Authorization: Bearer <key>`.
5. **Check the dashboard**: The `Home` tab shows cache hit rate, cost savings, and top models.
6. **Run a smoke test**: Send the same chat request twice; confirm the second response is marked `x-WatchLLM-cached: HIT` and zero cost.

You now have a working project. Next, follow the [creating projects guide](./creating-projects.md) to manage team members and plan limits.
