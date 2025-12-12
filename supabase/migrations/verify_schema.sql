-- ============================================================================
-- Verification Script for WatchLLM Database Schema
-- Run this after executing 001_initial_schema.sql
-- ============================================================================

-- Check that all tables were created
SELECT 'Tables Created:' AS check_type, COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('projects', 'api_keys', 'usage_logs', 'subscriptions');
-- Expected: count = 4

-- Check that all indexes were created
SELECT 'Indexes Created:' AS check_type, COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'api_keys', 'usage_logs', 'subscriptions');
-- Expected: count >= 15

-- Check that all functions were created
SELECT 'Functions Created:' AS check_type, COUNT(*) AS count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'update_updated_at_column',
        'get_project_usage_stats',
        'get_monthly_request_count',
        'check_rate_limit',
        'get_user_subscription'
    );
-- Expected: count = 5

-- Check that RLS is enabled on all tables
SELECT 'RLS Enabled:' AS check_type, COUNT(*) AS count
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'api_keys', 'usage_logs', 'subscriptions')
    AND rowsecurity = true;
-- Expected: count = 4

-- Check that policies were created
SELECT 'Policies Created:' AS check_type, COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public';
-- Expected: count >= 14

-- List all tables with their row counts
SELECT 
    tablename AS table_name,
    COALESCE((
        SELECT COUNT(*)
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = t.tablename
    ), 0) AS estimated_rows
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.tablename IN ('projects', 'api_keys', 'usage_logs', 'subscriptions')
ORDER BY t.tablename;

-- List all indexes
SELECT 
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'api_keys', 'usage_logs', 'subscriptions')
ORDER BY tablename, indexname;

-- List all functions
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.proname IN (
        'update_updated_at_column',
        'get_project_usage_stats',
        'get_monthly_request_count',
        'check_rate_limit',
        'get_user_subscription'
    )
ORDER BY p.proname;

-- List all RLS policies
SELECT 
    schemaname,
    tablename AS table_name,
    policyname AS policy_name,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test functions (these should not error)
DO $$
BEGIN
    -- Test get_project_usage_stats
    PERFORM * FROM get_project_usage_stats(
        '00000000-0000-0000-0000-000000000000'::UUID,
        NOW() - INTERVAL '30 days',
        NOW()
    );
    RAISE NOTICE 'Function get_project_usage_stats: OK';

    -- Test get_monthly_request_count
    PERFORM get_monthly_request_count('00000000-0000-0000-0000-000000000000'::UUID);
    RAISE NOTICE 'Function get_monthly_request_count: OK';

    -- Test check_rate_limit
    PERFORM * FROM check_rate_limit(
        '00000000-0000-0000-0000-000000000000'::UUID,
        100,
        1
    );
    RAISE NOTICE 'Function check_rate_limit: OK';

    -- Test get_user_subscription
    PERFORM * FROM get_user_subscription('00000000-0000-0000-0000-000000000000'::UUID);
    RAISE NOTICE 'Function get_user_subscription: OK';

    RAISE NOTICE 'All functions executed successfully';
END $$;

-- Summary
SELECT 
    '✅ Migration Verification Complete' AS status,
    'Check the output above to verify all components are installed correctly' AS message;
