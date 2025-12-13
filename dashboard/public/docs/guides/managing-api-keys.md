# Managing API Keys

> Keys start with `lgw_` and last until you revoke them.

## Key Actions
- **Create** new keys per project for staging, production, bots, or team members.
- **Describe** each key so you remember what it powers (e.g., `cli-batch-job`, `dev-cli`).
- **Rotate** keys monthly by creating a new one, switching your services, and deleting the old key once traffic stabilizes.
- **Revoke** compromised keys immediately—the dashboard blocks them instantly across the proxy.

## Best Practices
| Practice | Why it matters |
|---|---|
| Use separate keys per environment | Limits blast radius and rate limits per tier.
| Store keys in a secrets manager | Avoid leaking keys in frontend bundles.
| Monitor `last_used_at` and team activity | Detect unused keys and clean them up.
| Combine with project tags | Group keys by service, region, or customer.

## Troubleshooting
- If you see frequent `invalid_api_key` errors, issue a new key and update callers before revoking the old one.
- Need temporary access? Create a `lgw_test_` key and share it with your contractor; it expires on demand.

## Automation Tip
Use the [dashboard API](../api-reference.md#authentication) to programmatically list, rotate, or revoke keys when deploying new services.
