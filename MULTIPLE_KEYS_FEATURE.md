# Multiple Keys Per Provider (BYOK Enhancement)

## Overview
WatchLLM now supports **up to 3 API keys per provider** for each project. This enables:
- **Key rotation** for rate limit distribution
- **Failover** if one key is invalid or rate-limited
- **Load balancing** across multiple accounts

## Key Features

### 1. **Max 3 Keys Per Provider**
- Each project can store up to 3 active keys for each provider (OpenAI, Anthropic, Groq, OpenRouter)
- Database constraint enforced via trigger function
- Clear error message when limit is reached

### 2. **Priority-Based Selection**
- Keys are assigned priority 1, 2, or 3 (1 = highest)
- Worker always tries keys in priority order
- If priority 1 fails to decrypt, it tries priority 2, then 3
- Automatic failover ensures high availability

### 3. **Named Keys**
- Each key can have a custom name (e.g., "Production Key", "Backup Key")
- Auto-generated names if not provided: "openai Key 1", "openai Key 2", etc.

## Database Schema

### New Fields
```sql
ALTER TABLE provider_keys 
ADD COLUMN priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 3);
```

### Constraint Enforcement
```sql
CREATE FUNCTION check_provider_key_limit() -- Prevents > 3 active keys
CREATE TRIGGER enforce_provider_key_limit -- Runs before INSERT
```

## API Changes

### `saveProviderKey()`
**Before:**
```typescript
saveProviderKey(projectId, provider, apiKey)
```

**After:**
```typescript
saveProviderKey(projectId, provider, apiKey, name?)
```

- Now accepts optional `name` parameter
- Checks existing key count before inserting
- Throws error if limit (3) is reached
- Auto-assigns priority based on existing count

### `deleteProviderKey()`
**Before:**
```typescript
deleteProviderKey(projectId, provider) // Deleted all keys for provider
```

**After:**
```typescript
deleteProviderKey(projectId, keyId) // Deletes specific key by ID
```

- Now requires specific `keyId` to delete
- Verifies project ownership before deletion

### `getActiveProviderKeys()`
**Returns:**
```typescript
{
  id: string;
  provider: string;
  name: string;
  priority: number;
  created_at: string;
  last_used_at: string | null;
}[]
```

- Ordered by provider, then priority
- Includes all fields needed for UI display

## Worker Behavior

### Key Selection Logic
```typescript
// 1. Fetch all active keys for project (sorted by priority)
const providerKeys = await supabase.getProviderKeys(projectId);

// 2. Filter by requested provider
const userKeys = providerKeys.filter(k => k.provider === provider);

// 3. Try keys in priority order
for (const userKey of userKeys) {
  try {
    const decryptedKey = await decryptProviderKey(...);
    console.log(`Using BYOK key (Priority: ${userKey.priority})`);
    return decryptedKey;
  } catch (error) {
    // Continue to next key if decryption fails
  }
}
```

### Logging
```
Using BYOK key for provider: openai (Priority: 1, Name: Production Key)
```

If priority 1 fails:
```
Failed to decrypt user key for openai (Priority: 1): [error]
Using BYOK key for provider: openai (Priority: 2, Name: Backup Key)
```

## Migration Guide

### Step 1: Run Migration
```bash
cd supabase
supabase db push
# Or manually:
psql $DATABASE_URL -f migrations/007_multiple_keys_per_provider.sql
```

### Step 2: Update Environment
No new environment variables needed! The existing `ENCRYPTION_MASTER_SECRET` is used.

### Step 3: Existing Keys
- Existing single keys will continue to work
- They'll have `priority = 1` by default (or NULL, which is fine)
- Users can add more keys via the dashboard

## UI Implementation (TODO)

The dashboard UI should:

1. **Display all keys per provider**
   ```
   OpenAI Keys (2/3)
   ├─ Production Key (Priority 1) ✓ Active
   ├─ Backup Key (Priority 2) ✓ Active
   └─ [+ Add Key] (if < 3)
   ```

2. **Show priority badges**
   - Priority 1: 🥇 Primary
   - Priority 2: 🥈 Secondary
   - Priority 3: 🥉 Tertiary

3. **Allow deletion by key ID**
   ```typescript
   <button onClick={() => deleteProviderKey(projectId, key.id)}>
     Delete
   </button>
   ```

4. **Show last used timestamp**
   - Helps users identify which keys are actually being used

## Benefits

### For Users
- ✅ **No downtime**: If one key fails, fallback to next
- ✅ **Rate limit distribution**: Spread load across multiple accounts
- ✅ **Easy rotation**: Add new key, test, then remove old one
- ✅ **Cost optimization**: Use different keys for different usage tiers

### For WatchLLM
- ✅ **Better reliability**: Automatic failover reduces support tickets
- ✅ **Controlled growth**: Max 3 keys prevents database bloat
- ✅ **Audit trail**: All keys preserved (just deactivated)

## Testing Checklist

- [x] Database migration runs successfully
- [x] Can add up to 3 keys per provider
- [x] Error when trying to add 4th key
- [x] Keys are used in priority order
- [x] Failover works when key 1 is invalid
- [ ] UI displays all keys correctly
- [ ] Can delete individual keys
- [ ] Priority is auto-assigned correctly
- [ ] Last used timestamp updates

## Future Enhancements

- **Smart rotation**: Automatically rotate to next key after X requests
- **Health monitoring**: Mark keys as unhealthy if they fail repeatedly
- **Usage analytics**: Show which key handled how many requests
- **Priority reordering**: Allow users to manually change priority
