# Supabase Configuration

This directory contains database migrations and configuration for WatchLLM.

## Quick Start

### 1. Run the Migration

Copy the contents of [`migrations/001_initial_schema.sql`](./migrations/001_initial_schema.sql) and run it in your Supabase SQL Editor:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Paste the migration SQL
5. Click **Run**

### 2. Verify Installation

Run [`migrations/verify_schema.sql`](./migrations/verify_schema.sql) to verify everything is set up correctly.

### 3. Get Your Credentials

You'll need these environment variables:

```bash
# Get these from: Settings > API
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Keep this secret!
```

## Database Schema

### Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| `projects` | User projects | Plan tiers (free/starter/pro) |
| `api_keys` | API keys | Prefix: `lgw_proj_` or `lgw_test_` |
| `usage_logs` | Request logs | Immutable, indexed for analytics |
| `subscriptions` | Stripe billing | Synced via webhooks |

### Functions

| Function | Purpose |
|----------|---------|
| `get_project_usage_stats()` | Analytics dashboard |
| `get_monthly_request_count()` | Usage quota tracking |
| `check_rate_limit()` | Backup rate limiting |
| `get_user_subscription()` | Billing info |

### Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Users can only access their own data
- ✅ Service role for worker/webhooks
- ✅ Usage logs are immutable

## Example Queries

### Get Project Stats

```sql
SELECT * FROM get_project_usage_stats(
    'your-project-id',
    NOW() - INTERVAL '7 days',
    NOW()
);
```

### Check Monthly Usage

```sql
SELECT get_monthly_request_count('your-project-id');
```

### List User Projects

```sql
SELECT * FROM projects WHERE user_id = auth.uid();
```

## Development

### Local Development (Optional)

If you want to run Supabase locally:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize
supabase init

# Start local instance
supabase start

# Apply migrations
supabase db push
```

### Testing RLS Policies

```sql
-- Test as a user
SET ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here"}';

-- Try to access projects
SELECT * FROM projects;

-- Reset
RESET ROLE;
```

## Troubleshooting

### "relation already exists"

Tables are already created. Either:
1. Drop them first (see rollback in README)
2. Skip migration if schema is correct

### "permission denied"

You need to be the database owner or have sufficient privileges.

### RLS blocking queries

If you're using the service role key, RLS is bypassed. For user queries, ensure:
1. User is authenticated
2. `auth.uid()` returns correct user ID
3. Data belongs to the user

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [WatchLLM Documentation](./migrations/README.md)
- [GitHub Issues](https://github.com/your-repo/issues)
