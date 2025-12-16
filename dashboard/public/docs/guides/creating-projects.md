# Creating Projects

> Projects organize billing, keys, and rate-limited quotas per team or initiative.

![Projects overview](https://via.placeholder.com/900x420.png?text=Projects+Overview)

## Steps to create and scale

1. Open **Projects** from the left navigation and click **New Project**.
2. Enter a descriptive name (`Support Bot`, `Docs Assistant`, etc.) and select your default provider (OpenAI, Anthropic, or Groq). You can override the provider on a per-request basis using the `model` parameter.
3. After creation, generate scoped API keys (`lgw_proj_*`). Add a label (e.g., `cli-batch-job`) so your team knows what each key powers.
4. Invite teammates via **Team → Add member**. Everyone can view project dashboards, but only admins rotate keys.
5. Monitor usage, cache hit rates, and savings directly from the project card.

## Templates and cloning

- Use the **Clone project** action to snapshot configuration, TTLs, and description for new regions or environments.
- Duplicate keys when spinning up staging/testing to avoid hitting production rate limits.

## Best practices

- **One key per environment** keeps the blast radius small (dev, staging, prod).
- **Tag keys** with roles (`frontend`, `backend`, `aws-lambda`) for quick audits.
- **Rotate monthly** by creating a new key, updating services, and deleting the old key once traffic stabilizes (see [key rotation guide](./managing-api-keys.md)).

## Automate provisioning

Use the dashboard API (see [API reference – Authentication](../api-reference.md#authentication)) to script bulk project creation or keys. Here’s a sample curl to list projects:

```bash
curl https://dashboard-api.watchllm.dev/projects \
	-H "Authorization: Bearer admin_token" \
	-H "Content-Type: application/json"
```

Projects let you separate customers, experiments, or regions while keeping billing and usage metrics neatly grouped.
