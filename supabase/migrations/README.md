# Supabase Migrations

This directory contains SQL migration files for the WatchLLM database schema.

## Running Migrations

### Option 1: Supabase Dashboard (Recommended for initial setup)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the contents of `001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click **Run** or press `Ctrl+Enter`
6. Verify: You should see "Success. No rows returned"

### Option 2: Supabase CLI (For development)

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Option 3: Manual psql (For advanced users)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run migration
\i supabase/migrations/001_initial_schema.sql
```

## Verification

After running the migration, verify the setup:

1. **Check Tables**: Go to **Table Editor** in Supabase Dashboard
   - You should see: `projects`, `api_keys`, `usage_logs`, `subscriptions`

2. **Check Functions**: Go to **Database** → **Functions**
   - You should see 4 functions created

3. **Check RLS**: Go to **Authentication** → **Policies**
   - Each table should have multiple RLS policies enabled

4. **Test with SQL**:
   ```sql
   -- Check if all tables exist
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('projects', 'api_keys', 'usage_logs', 'subscriptions');
   
   -- Should return 4 rows
   ```

## Database Schema Overview

### Tables

1. **projects** - User projects for organizing API keys
   - Linked to `auth.users`
   - Supports plans: free, starter, pro

2. **api_keys** - API keys for authentication
   - Format: `lgw_proj_` or `lgw_test_` + 32+ chars
   - Linked to projects
   - Tracks last usage

3. **usage_logs** - Request logging and analytics
   - Immutable (no updates/deletes)
   - Indexed for fast queries
   - Tracks costs, tokens, latency

4. **subscriptions** - Stripe billing integration
   - One per user
   - Synced with Stripe webhooks

### Functions

- `get_project_usage_stats(project_id, start_date, end_date)` - Analytics
- `get_monthly_request_count(project_id)` - Usage tracking
- `check_rate_limit(api_key_id, limit, window_minutes)` - Rate limiting
- `get_user_subscription(user_id)` - Subscription info

### Security

- **RLS enabled** on all tables
- Users can only access their own data
- Service role can manage subscriptions (for webhooks)
- Usage logs are immutable

## Rollback

If you need to rollback this migration:

```sql
-- WARNING: This will delete all data!

DROP TABLE IF EXISTS usage_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS get_project_usage_stats CASCADE;
DROP FUNCTION IF EXISTS get_monthly_request_count CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS get_user_subscription CASCADE;
```

## Next Steps

After running this migration:

1. Test creating a project via the dashboard API
2. Generate an API key
3. Test the worker with the API key
4. Verify usage logs are being created

## Troubleshooting

### Error: "relation already exists"

If tables already exist, you have two options:
1. Drop existing tables (see Rollback section)
2. Skip the migration if schema is correct

### Error: "permission denied"

Make sure you're running as the database owner or have sufficient privileges.

### RLS Policies Not Working

1. Verify RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Check policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
3. Test with a non-admin user

## Support

For issues or questions:
- Check Supabase docs: https://supabase.com/docs
- WatchLLM docs: https://docs.watchllm.dev
- GitHub Issues: https://github.com/your-repo/issues
