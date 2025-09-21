-- =============================================================================
-- Database Maintenance Procedures for Sesimiz Ol
-- =============================================================================
-- This script contains maintenance procedures designed to keep the database
-- optimized and running efficiently in production environments.

\timing on

-- =============================================================================
-- 1. REGULAR MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function to clean up expired tokens and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
    cleanup_type TEXT,
    records_removed BIGINT,
    completion_time TIMESTAMP
) AS $$
DECLARE
    expired_tokens BIGINT;
    expired_sessions BIGINT;
    old_notifications BIGINT;
BEGIN
    -- Clean expired password reset tokens
    DELETE FROM password_reset_tokens
    WHERE "expiresAt" < now() - interval '24 hours'
    AND "consumedAt" IS NULL;

    GET DIAGNOSTICS expired_tokens = ROW_COUNT;

    -- Clean expired user sessions
    DELETE FROM user_sessions
    WHERE "expiresAt" < now() - interval '7 days'
    AND "revokedAt" IS NULL;

    GET DIAGNOSTICS expired_sessions = ROW_COUNT;

    -- Clean old read notifications (90 days)
    DELETE FROM notifications
    WHERE "createdAt" < now() - interval '90 days'
    AND "readAt" IS NOT NULL;

    GET DIAGNOSTICS old_notifications = ROW_COUNT;

    -- Return results
    RETURN QUERY VALUES
        ('expired_password_tokens', expired_tokens, now()),
        ('expired_user_sessions', expired_sessions, now()),
        ('old_notifications', old_notifications, now());

    -- Log cleanup activity
    RAISE NOTICE 'Cleanup completed: % tokens, % sessions, % notifications removed',
        expired_tokens, expired_sessions, old_notifications;
END;
$$ LANGUAGE plpgsql;

-- Function to update denormalized counters
CREATE OR REPLACE FUNCTION update_story_counters()
RETURNS TABLE(
    counter_type TEXT,
    stories_updated BIGINT,
    completion_time TIMESTAMP
) AS $$
DECLARE
    view_count_updates BIGINT;
    support_count_updates BIGINT;
BEGIN
    -- Update story view counts
    WITH view_counts AS (
        SELECT "storyId", count(*) as actual_count
        FROM story_views
        GROUP BY "storyId"
    ),
    updates AS (
        UPDATE stories
        SET "viewCount" = vc.actual_count
        FROM view_counts vc
        WHERE stories.id = vc."storyId"
        AND stories."viewCount" != vc.actual_count
        RETURNING stories.id
    )
    SELECT count(*) INTO view_count_updates FROM updates;

    -- Update story support counts
    WITH support_counts AS (
        SELECT "storyId", count(*) as actual_count
        FROM story_supports
        GROUP BY "storyId"
    ),
    updates AS (
        UPDATE stories
        SET "supportCount" = sc.actual_count
        FROM support_counts sc
        WHERE stories.id = sc."storyId"
        AND stories."supportCount" != sc.actual_count
        RETURNING stories.id
    )
    SELECT count(*) INTO support_count_updates FROM updates;

    -- Return results
    RETURN QUERY VALUES
        ('view_counts', view_count_updates, now()),
        ('support_counts', support_count_updates, now());

    RAISE NOTICE 'Counter updates completed: % view counts, % support counts',
        view_count_updates, support_count_updates;
END;
$$ LANGUAGE plpgsql;

-- Function to update tag usage counts
CREATE OR REPLACE FUNCTION update_tag_usage_counts()
RETURNS TABLE(
    tags_updated BIGINT,
    completion_time TIMESTAMP
) AS $$
DECLARE
    updated_count BIGINT;
BEGIN
    WITH tag_counts AS (
        SELECT "tagId", count(*) as actual_count
        FROM story_tags
        GROUP BY "tagId"
    ),
    updates AS (
        UPDATE tags
        SET "usageCount" = tc.actual_count
        FROM tag_counts tc
        WHERE tags.id = tc."tagId"
        AND tags."usageCount" != tc.actual_count
        RETURNING tags.id
    )
    SELECT count(*) INTO updated_count FROM updates;

    -- Also set usage count to 0 for tags with no stories
    UPDATE tags
    SET "usageCount" = 0
    WHERE id NOT IN (SELECT DISTINCT "tagId" FROM story_tags)
    AND "usageCount" != 0;

    GET DIAGNOSTICS updated_count = updated_count + ROW_COUNT;

    RETURN QUERY VALUES (updated_count, now());

    RAISE NOTICE 'Tag usage counts updated for % tags', updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. INDEX MAINTENANCE PROCEDURES
-- =============================================================================

-- Function to identify and suggest index optimizations
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    analysis_type TEXT,
    table_name TEXT,
    index_name TEXT,
    usage_count BIGINT,
    index_size TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Unused indexes
    SELECT
        'unused_index'::TEXT,
        schemaname::TEXT,
        indexname::TEXT,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid))::TEXT,
        'Consider dropping this unused index'::TEXT
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND pg_relation_size(indexrelid) > 1024

    UNION ALL

    -- Low usage indexes
    SELECT
        'low_usage_index'::TEXT,
        schemaname::TEXT,
        indexname::TEXT,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid))::TEXT,
        'Review if this index is necessary'::TEXT
    FROM pg_stat_user_indexes
    WHERE idx_scan > 0 AND idx_scan < 100
    AND pg_relation_size(indexrelid) > 1024

    UNION ALL

    -- Missing indexes on foreign keys
    SELECT
        'missing_fk_index'::TEXT,
        tc.table_name::TEXT,
        ('idx_' || tc.table_name || '_' || kcu.column_name)::TEXT,
        0::BIGINT,
        'N/A'::TEXT,
        ('CREATE INDEX ON ' || tc.table_name || ' (' || kcu.column_name || ')')::TEXT
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
        SELECT 1
        FROM pg_index i
        JOIN pg_class t ON t.oid = i.indrelid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
        WHERE t.relname = tc.table_name
        AND a.attname = kcu.column_name
    )

    ORDER BY 1, 4 DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. PERFORMANCE MONITORING PROCEDURES
-- =============================================================================

-- Function to analyze table performance metrics
CREATE OR REPLACE FUNCTION analyze_table_performance()
RETURNS TABLE(
    table_name TEXT,
    total_size TEXT,
    live_rows BIGINT,
    dead_rows BIGINT,
    dead_row_percentage NUMERIC,
    seq_scans BIGINT,
    idx_scans BIGINT,
    scan_ratio NUMERIC,
    performance_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (schemaname || '.' || tablename)::TEXT,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))::TEXT,
        n_live_tup,
        n_dead_tup,
        CASE
            WHEN n_live_tup > 0 THEN round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
            ELSE 0
        END,
        seq_scan,
        idx_scan,
        CASE
            WHEN (seq_scan + idx_scan) > 0
            THEN round((seq_scan::numeric / (seq_scan + idx_scan)::numeric) * 100, 2)
            ELSE 0
        END,
        CASE
            WHEN n_live_tup > 1000 AND seq_scan > idx_scan THEN 'NEEDS_INDEXING'
            WHEN n_dead_tup > n_live_tup * 0.2 THEN 'NEEDS_VACUUM'
            WHEN n_dead_tup > n_live_tup * 0.1 THEN 'VACUUM_RECOMMENDED'
            ELSE 'OK'
        END::TEXT
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check cache hit ratios
CREATE OR REPLACE FUNCTION check_cache_performance()
RETURNS TABLE(
    metric_type TEXT,
    table_name TEXT,
    hit_ratio NUMERIC,
    status TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Overall cache hit ratio
    RETURN QUERY
    SELECT
        'overall_cache'::TEXT,
        'database'::TEXT,
        round(
            (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2
        ),
        CASE
            WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) >= 95
            THEN 'EXCELLENT'
            WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) >= 90
            THEN 'GOOD'
            ELSE 'POOR'
        END::TEXT,
        CASE
            WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) < 95
            THEN 'Consider increasing shared_buffers'
            ELSE 'Cache performance is optimal'
        END::TEXT
    FROM pg_statio_user_tables

    UNION ALL

    -- Per-table cache hit ratios
    SELECT
        'table_cache'::TEXT,
        (schemaname || '.' || tablename)::TEXT,
        CASE
            WHEN (heap_blks_hit + heap_blks_read) > 0
            THEN round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2)
            ELSE 0
        END,
        CASE
            WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 'NO_ACCESS'
            WHEN round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2) >= 95 THEN 'EXCELLENT'
            WHEN round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2) >= 90 THEN 'GOOD'
            ELSE 'POOR'
        END::TEXT,
        CASE
            WHEN round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2) < 90
            THEN 'Table may benefit from more frequent access or query optimization'
            ELSE 'Table cache performance is good'
        END::TEXT
    FROM pg_statio_user_tables
    WHERE (heap_blks_hit + heap_blks_read) > 0
    ORDER BY 3 ASC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. AUTOMATED MAINTENANCE PROCEDURES
-- =============================================================================

-- Function to perform daily maintenance tasks
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS TABLE(
    task_name TEXT,
    status TEXT,
    details TEXT,
    execution_time TIMESTAMP
) AS $$
DECLARE
    cleanup_result RECORD;
    counter_result RECORD;
BEGIN
    -- 1. Clean up expired data
    FOR cleanup_result IN SELECT * FROM cleanup_expired_data() LOOP
        RETURN QUERY VALUES (
            ('cleanup_' || cleanup_result.cleanup_type)::TEXT,
            'COMPLETED'::TEXT,
            (cleanup_result.records_removed || ' records removed')::TEXT,
            cleanup_result.completion_time
        );
    END LOOP;

    -- 2. Update story counters
    FOR counter_result IN SELECT * FROM update_story_counters() LOOP
        RETURN QUERY VALUES (
            ('update_' || counter_result.counter_type)::TEXT,
            'COMPLETED'::TEXT,
            (counter_result.stories_updated || ' stories updated')::TEXT,
            counter_result.completion_time
        );
    END LOOP;

    -- 3. Update tag usage counts
    SELECT * INTO counter_result FROM update_tag_usage_counts();
    RETURN QUERY VALUES (
        'update_tag_counts'::TEXT,
        'COMPLETED'::TEXT,
        (counter_result.tags_updated || ' tags updated')::TEXT,
        counter_result.completion_time
    );

    -- 4. Analyze table statistics for heavily used tables
    ANALYZE users;
    ANALYZE stories;
    ANALYZE comments;
    ANALYZE user_sessions;

    RETURN QUERY VALUES (
        'analyze_statistics'::TEXT,
        'COMPLETED'::TEXT,
        'Key tables analyzed'::TEXT,
        now()
    );

    RAISE NOTICE 'Daily maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to perform weekly maintenance tasks
CREATE OR REPLACE FUNCTION weekly_maintenance()
RETURNS TABLE(
    task_name TEXT,
    status TEXT,
    details TEXT,
    execution_time TIMESTAMP
) AS $$
BEGIN
    -- 1. Vacuum analyze all user tables
    PERFORM vacuum_all_tables();

    RETURN QUERY VALUES (
        'vacuum_all_tables'::TEXT,
        'COMPLETED'::TEXT,
        'All tables vacuumed and analyzed'::TEXT,
        now()
    );

    -- 2. Reindex heavily used indexes
    REINDEX INDEX CONCURRENTLY users_email_key;
    REINDEX INDEX CONCURRENTLY users_nickname_key;
    REINDEX INDEX CONCURRENTLY stories_pkey;
    REINDEX INDEX CONCURRENTLY comments_pkey;

    RETURN QUERY VALUES (
        'reindex_critical_indexes'::TEXT,
        'COMPLETED'::TEXT,
        'Critical indexes rebuilt'::TEXT,
        now()
    );

    -- 3. Update all table statistics
    ANALYZE;

    RETURN QUERY VALUES (
        'update_all_statistics'::TEXT,
        'COMPLETED'::TEXT,
        'Database statistics updated'::TEXT,
        now()
    );

    RAISE NOTICE 'Weekly maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Helper function to vacuum all user tables
CREATE OR REPLACE FUNCTION vacuum_all_tables()
RETURNS VOID AS $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN
        SELECT schemaname, tablename
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('VACUUM ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
        RAISE NOTICE 'Vacuumed table: %.%', table_record.schemaname, table_record.tablename;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. MONITORING AND ALERTING PROCEDURES
-- =============================================================================

-- Function to check for maintenance alerts
CREATE OR REPLACE FUNCTION maintenance_alerts()
RETURNS TABLE(
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Check for tables with high dead row percentage
    SELECT
        'high_dead_rows'::TEXT,
        'WARNING'::TEXT,
        (tablename || ' has ' || round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2) || '% dead rows')::TEXT,
        ('VACUUM ' || tablename)::TEXT
    FROM pg_stat_user_tables
    WHERE n_live_tup > 100
    AND n_dead_tup > n_live_tup * 0.2

    UNION ALL

    -- Check for tables never vacuumed
    SELECT
        'never_vacuumed'::TEXT,
        'WARNING'::TEXT,
        (tablename || ' has never been vacuumed')::TEXT,
        ('VACUUM ANALYZE ' || tablename)::TEXT
    FROM pg_stat_user_tables
    WHERE last_vacuum IS NULL
    AND last_autovacuum IS NULL
    AND n_live_tup > 100

    UNION ALL

    -- Check for poor cache hit ratio
    SELECT
        'poor_cache_ratio'::TEXT,
        'CRITICAL'::TEXT,
        ('Database cache hit ratio is ' ||
         round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) || '%')::TEXT,
        'Increase shared_buffers setting'::TEXT
    FROM pg_statio_user_tables
    GROUP BY 1, 2, 4
    HAVING round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) < 90

    UNION ALL

    -- Check for tables with high sequential scan ratio
    SELECT
        'high_seq_scan_ratio'::TEXT,
        'WARNING'::TEXT,
        (tablename || ' has high sequential scan ratio: ' ||
         round((seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)::numeric) * 100, 2) || '%')::TEXT,
        ('Consider adding indexes to ' || tablename)::TEXT
    FROM pg_stat_user_tables
    WHERE (seq_scan + idx_scan) > 100
    AND n_live_tup > 1000
    AND (seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)::numeric) > 0.1

    ORDER BY 2, 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. USAGE EXAMPLES AND SCHEDULING
-- =============================================================================

-- Example usage of maintenance functions

-- Run daily maintenance (should be scheduled via cron)
-- SELECT * FROM daily_maintenance();

-- Run weekly maintenance (should be scheduled via cron)
-- SELECT * FROM weekly_maintenance();

-- Check for maintenance alerts
-- SELECT * FROM maintenance_alerts();

-- Analyze index usage
-- SELECT * FROM analyze_index_usage();

-- Check table performance
-- SELECT * FROM analyze_table_performance();

-- Check cache performance
-- SELECT * FROM check_cache_performance();

-- Manual cleanup of expired data
-- SELECT * FROM cleanup_expired_data();

-- Update counters manually
-- SELECT * FROM update_story_counters();
-- SELECT * FROM update_tag_usage_counts();

-- =============================================================================
-- MAINTENANCE PROCEDURES COMPLETE
-- =============================================================================

SELECT 'DATABASE MAINTENANCE PROCEDURES INSTALLED - ' || now()::text as installation_status;

-- Show available maintenance functions
SELECT
    'Available Maintenance Functions' as info_type,
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'cleanup_expired_data',
    'update_story_counters',
    'update_tag_usage_counts',
    'analyze_index_usage',
    'analyze_table_performance',
    'check_cache_performance',
    'daily_maintenance',
    'weekly_maintenance',
    'maintenance_alerts',
    'vacuum_all_tables'
)
ORDER BY routine_name;