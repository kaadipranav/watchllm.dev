# Managing API Keys

![Key management](https://via.placeholder.com/900x360.png?text=Key+Management+Center)

> Every WatchLLM key begins with `lgw_`. Keep them secret and rotate regularly.

## Create & label keys

1. In your project, click **API Keys → + New key**.
2. Choose a descriptive name (`cli-batch-job`, `staging-webhook`) and note its scope (read-only analytics vs. full proxy access).
3. Copy the key immediately—it will only show once. Persist it in a secret vault (1Password, Vault, Cloudflare Secrets). Do not paste it into frontend bundles.

## Rotation & revocation

- Rotate monthly by creating a new key, delaying traffic cutover until the new key works, then deleting the old key.
- Revoke immediately if a key leaks. The proxy stops honoring it across all environments.

## Storage guidelines

| Practice | Why it matters |
|---|---|
| One key per environment | Prevents a staging leak from affecting production and keeps rate limits manageable. |
| Secrets manager only | Avoid using `.env` in shared repos or frontend code. |
| Monitor `last_used_at` | Supabase logs show when a key ages out—clean up unused ones monthly. |
| Tag keys by service | `backend-dispatch`, `lambda-notifier`, `playwright-tests` make audits faster. |

## Troubleshooting & automation

- **Frequent `invalid_api_key` errors?** Create a brand-new key and swap it across callers before revoking the old one.
- **Need a temporary key?** Generate a `lgw_test_...` key, share with contractors, delete immediately after use.
- **Automation tip**: Use the API to rotate keys programmatically.

```bash
curl https://dashboard-api.watchllm.dev/api/projects/{projectId}/keys \
	-H "Authorization: Bearer admin_token" \
	-X POST
```

Remember: once revoked, a key cannot be resurrected. Always update services before revoking.
