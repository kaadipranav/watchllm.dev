# BYOK (Bring Your Own Key) Migration Guide

## Overview
This migration adds support for users to provide their own API keys for OpenAI, Anthropic, and Groq providers. Keys are encrypted using AES-GCM before storage and decrypted on-demand when making API requests.

## Database Migration

### Step 1: Run the Migration
```bash
# Apply the migration to your Supabase database
psql $DATABASE_URL -f supabase/migrations/003_add_provider_keys.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### Step 2: Set Environment Variable
Add the encryption master secret to your Cloudflare Worker environment:

```bash
# Generate a secure random secret (32+ characters recommended)
openssl rand -base64 32

# Add to wrangler.toml (for local dev)
[vars]
ENCRYPTION_MASTER_SECRET = "your-generated-secret-here"

# Add to Cloudflare Worker secrets (for production)
wrangler secret put ENCRYPTION_MASTER_SECRET
```

**⚠️ IMPORTANT**: Keep this secret safe! If lost, all encrypted keys become unrecoverable.

## How BYOK Works

### Priority Order
1. **User's Provider Key** (if configured) - Decrypted and used directly with the provider
2. **Global OpenRouter Key** (fallback) - Used if no user key is configured

### Encryption Details
- **Algorithm**: AES-GCM with 256-bit keys
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Storage**: Encrypted key + IV stored in `provider_keys` table
- **Security**: Each key has a unique salt and IV

## API Usage

### Adding a Provider Key (Dashboard)
Users can add their provider keys through the dashboard:

```typescript
// Example: Add OpenAI key
const { encryptedKey, iv } = await encryptProviderKey(
  'sk-...', // User's actual API key
  env.ENCRYPTION_MASTER_SECRET
);

await supabase.from('provider_keys').insert({
  project_id: projectId,
  provider: 'openai',
  encrypted_key: encryptedKey,
  encryption_iv: iv,
  name: 'My OpenAI Key',
  is_active: true,
});
```

### How It Works in the Worker
1. Request comes in with WatchLLM API key
2. Worker validates the key and gets the project ID
3. Worker checks for user-provided keys for the requested provider
4. If found, decrypts and uses the user's key
5. If not found, falls back to global OpenRouter key

### Example Flow
```
User Request → WatchLLM Proxy
  ↓
Check project_id for provider_keys
  ↓
If user has OpenAI key:
  → Decrypt key
  → Use api.openai.com directly
  → Return response
  
If no user key:
  → Use global OpenRouter key
  → Use openrouter.ai/api/v1
  → Return response
```

## Benefits

### For Users
- **Cost Control**: Use their own API keys with negotiated rates
- **Direct Billing**: Charges appear on their provider accounts
- **Provider Choice**: Mix and match providers per project
- **No Markup**: Avoid proxy markup fees

### For WatchLLM
- **Reduced Costs**: Users with BYOK don't consume global quota
- **Scalability**: No need to manage provider rate limits for BYOK users
- **Flexibility**: Support more providers without managing keys

## Security Considerations

1. **Encryption at Rest**: All keys encrypted in database
2. **Decryption in Memory**: Keys only decrypted when needed
3. **No Logging**: Decrypted keys never logged
4. **RLS Policies**: Users can only access their own keys
5. **Service Role Access**: Worker uses service role to read encrypted keys

## Testing

### Test Encryption/Decryption
```typescript
import { encryptProviderKey, decryptProviderKey } from './lib/crypto';

const testKey = 'sk-test123';
const secret = 'test-master-secret';

const { encryptedKey, iv } = await encryptProviderKey(testKey, secret);
const decrypted = await decryptProviderKey(encryptedKey, iv, secret);

console.assert(decrypted === testKey, 'Encryption/decryption failed');
```

### Test BYOK Flow
1. Create a test project
2. Add a provider key via dashboard
3. Make API request using WatchLLM key
4. Check logs for "Using BYOK key for provider: openai"
5. Verify request went to provider directly (not OpenRouter)

## Monitoring

### Logs to Watch
- `Using BYOK key for provider: <provider>` - User key being used
- `Failed to decrypt user key for <provider>` - Decryption error
- Check `X-Cache` headers to ensure caching still works

### Metrics to Track
- % of requests using BYOK vs global key
- BYOK decryption errors
- Provider-specific error rates

## Rollback Plan

If issues arise:
1. Remove `ENCRYPTION_MASTER_SECRET` from environment
2. BYOK will fail gracefully and fall back to global key
3. Revert migration: `DROP TABLE provider_keys;`

## Future Enhancements

- [ ] Key rotation support
- [ ] Multiple keys per provider (A/B testing)
- [ ] Key usage analytics per provider
- [ ] Automatic key validation on save
- [ ] Key expiration/refresh reminders
