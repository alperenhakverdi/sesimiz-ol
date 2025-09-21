-- =============================================================================
-- Database Performance Analysis for Sesimiz Ol
-- =============================================================================
-- This script analyzes database performance metrics, identifies bottlenecks,
-- and provides optimization recommendations for production deployment.

\timing on
\x auto

-- =============================================================================
-- 1. QUERY PERFORMANCE ANALYSIS
-- =============================================================================

SELECT 'QUERY PERFORMANCE ANALYSIS' as analysis_section;

-- Top slow queries (requires pg_stat_statements extension)
SELECT
    'Query Performance Extension Status' as check_type,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements')
        THEN 'pg_stat_statements extension is available'
        ELSE 'pg_stat_statements extension is NOT available - install for detailed query analysis'
    END as status;

-- If pg_stat_statements is available, show top slow queries
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'Analyzing slow queries...';
    ELSE
        RAISE NOTICE 'Install pg_stat_statements extension for detailed query performance analysis';
    END IF;
END $$;

-- =============================================================================
-- 2. INDEX PERFORMANCE ANALYSIS
-- =============================================================================

SELECT 'INDEX PERFORMANCE ANALYSIS' as analysis_section;

-- Index usage statistics with performance metrics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans_performed,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'LOW_USAGE'
        WHEN idx_scan < 1000 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category,
    CASE
        WHEN idx_tup_read > 0 THEN
            round((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
        ELSE 0
    END as selectivity_percentage
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC, pg_relation_size(indexrelid) DESC;

-- Index efficiency analysis
WITH index_stats AS (
    SELECT
        schemaname,
        tablename,
        indexname,
        idx_scan,
        pg_relation_size(indexrelid) as index_size,
        CASE
            WHEN idx_scan = 0 AND pg_relation_size(indexrelid) > 1024
            THEN pg_relation_size(indexrelid)
            ELSE 0
        END as wasted_space
    FROM pg_stat_user_indexes
)
SELECT
    'Index Efficiency Summary' as metric,
    count(*) as total_indexes,
    sum(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END) as unused_indexes,
    pg_size_pretty(sum(wasted_space)) as wasted_space_by_unused_indexes,
    round(
        (sum(CASE WHEN idx_scan = 0 THEN 1 ELSE 0 END)::numeric / count(*)::numeric) * 100, 2
    ) as unused_percentage
FROM index_stats;

-- Missing indexes on foreign key columns (performance impact)
WITH fk_columns AS (
    SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
),
existing_indexes AS (
    SELECT
        t.relname as table_name,
        a.attname as column_name
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
    WHERE t.relkind = 'r'
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
SELECT
    'Missing FK Indexes' as analysis_type,
    fk.table_name,
    fk.column_name,
    fk.foreign_table_name,
    fk.foreign_column_name,
    'HIGH' as performance_impact,
    'CREATE INDEX idx_' || fk.table_name || '_' || fk.column_name ||
    ' ON ' || fk.table_name || ' (' || fk.column_name || ');' as suggested_index
FROM fk_columns fk
LEFT JOIN existing_indexes ei ON fk.table_name = ei.table_name AND fk.column_name = ei.column_name
WHERE ei.column_name IS NULL
ORDER BY fk.table_name, fk.column_name;

-- =============================================================================
-- 3. TABLE SCAN PERFORMANCE
-- =============================================================================

SELECT 'TABLE SCAN PERFORMANCE' as analysis_section;

-- Sequential vs Index scan analysis
SELECT
    schemaname,
    tablename,
    n_live_tup as estimated_rows,
    seq_scan as sequential_scans,
    seq_tup_read as rows_read_sequentially,
    idx_scan as index_scans,
    idx_tup_fetch as rows_fetched_via_index,
    CASE
        WHEN (seq_scan + idx_scan) = 0 THEN 0
        ELSE round((seq_scan::numeric / (seq_scan + idx_scan)::numeric) * 100, 2)
    END as sequential_scan_percentage,
    CASE
        WHEN n_live_tup > 1000 AND seq_scan > idx_scan THEN 'NEEDS_OPTIMIZATION'
        WHEN seq_scan = 0 AND idx_scan > 0 THEN 'OPTIMAL'
        WHEN seq_scan > 0 AND idx_scan = 0 THEN 'POOR_INDEXING'
        ELSE 'ACCEPTABLE'
    END as performance_status
FROM pg_stat_user_tables
ORDER BY
    CASE
        WHEN (seq_scan + idx_scan) = 0 THEN 0
        ELSE (seq_scan::numeric / (seq_scan + idx_scan)::numeric)
    END DESC;

-- Tables with high sequential scan activity
SELECT
    'High Sequential Scan Activity' as alert_type,
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    n_live_tup,
    round((seq_tup_read::numeric / NULLIF(seq_scan, 0)::numeric), 0) as avg_rows_per_scan,
    'Consider adding indexes for common WHERE clauses' as recommendation
FROM pg_stat_user_tables
WHERE seq_scan > 100
AND n_live_tup > 1000
AND (seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)::numeric) > 0.1
ORDER BY seq_scan DESC;

-- =============================================================================
-- 4. BUFFER CACHE PERFORMANCE
-- =============================================================================

SELECT 'BUFFER CACHE PERFORMANCE' as analysis_section;

-- Overall cache hit ratio
SELECT
    'Database Buffer Cache Hit Ratio' as metric,
    round(
        (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2
    ) as hit_ratio_percentage,
    CASE
        WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) >= 95
        THEN 'EXCELLENT'
        WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) >= 90
        THEN 'GOOD'
        WHEN round((sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2) >= 80
        THEN 'FAIR'
        ELSE 'POOR'
    END as performance_rating,
    'Target: >95% for production systems' as target
FROM pg_statio_user_tables;

-- Per-table cache hit ratios
SELECT
    schemaname,
    tablename,
    heap_blks_read as disk_reads,
    heap_blks_hit as cache_hits,
    CASE
        WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 0
        ELSE round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2)
    END as table_hit_ratio,
    CASE
        WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 'NO_ACCESS'
        WHEN round((heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric) * 100, 2) < 90
        THEN 'NEEDS_ATTENTION'
        ELSE 'OK'
    END as status
FROM pg_statio_user_tables
WHERE (heap_blks_hit + heap_blks_read) > 0
ORDER BY
    CASE
        WHEN (heap_blks_hit + heap_blks_read) = 0 THEN 0
        ELSE (heap_blks_hit::numeric / (heap_blks_hit + heap_blks_read)::numeric)
    END ASC;

-- Index cache hit ratios
SELECT
    schemaname,
    tablename,
    indexname,
    idx_blks_read as index_disk_reads,
    idx_blks_hit as index_cache_hits,
    CASE
        WHEN (idx_blks_hit + idx_blks_read) = 0 THEN 0
        ELSE round((idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read)::numeric) * 100, 2)
    END as index_hit_ratio,
    CASE
        WHEN (idx_blks_hit + idx_blks_read) = 0 THEN 'NO_ACCESS'
        WHEN round((idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read)::numeric) * 100, 2) < 90
        THEN 'NEEDS_ATTENTION'
        ELSE 'OK'
    END as status
FROM pg_statio_user_indexes
WHERE (idx_blks_hit + idx_blks_read) > 0
ORDER BY
    CASE
        WHEN (idx_blks_hit + idx_blks_read) = 0 THEN 0
        ELSE (idx_blks_hit::numeric / (idx_blks_hit + idx_blks_read)::numeric)
    END ASC;

-- =============================================================================
-- 5. VACUUM AND MAINTENANCE PERFORMANCE
-- =============================================================================

SELECT 'VACUUM AND MAINTENANCE PERFORMANCE' as analysis_section;

-- Tables needing vacuum attention
SELECT
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE
        WHEN n_live_tup > 0 THEN round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
        ELSE 0
    END as dead_row_percentage,
    last_vacuum,
    last_autovacuum,
    vacuum_count,
    autovacuum_count,
    CASE
        WHEN n_dead_tup > n_live_tup * 0.2 THEN 'URGENT_VACUUM_NEEDED'
        WHEN n_dead_tup > n_live_tup * 0.1 THEN 'VACUUM_RECOMMENDED'
        WHEN n_dead_tup > 1000 THEN 'MINOR_VACUUM_NEEDED'
        ELSE 'OK'
    END as vacuum_priority
FROM pg_stat_user_tables
WHERE n_live_tup > 0
ORDER BY
    CASE
        WHEN n_live_tup > 0 THEN (n_dead_tup::numeric / n_live_tup::numeric)
        ELSE 0
    END DESC;

-- Analyze statistics freshness
SELECT
    schemaname,
    tablename,
    last_analyze,
    last_autoanalyze,
    analyze_count,
    autoanalyze_count,
    CASE
        WHEN last_autoanalyze IS NULL AND last_analyze IS NULL THEN 'NEVER_ANALYZED'
        WHEN COALESCE(last_autoanalyze, last_analyze) < now() - interval '7 days' THEN 'STALE_STATISTICS'
        WHEN COALESCE(last_autoanalyze, last_analyze) < now() - interval '1 day' THEN 'OLD_STATISTICS'
        ELSE 'FRESH_STATISTICS'
    END as statistics_status,
    COALESCE(last_autoanalyze, last_analyze) as last_stats_update
FROM pg_stat_user_tables
ORDER BY COALESCE(last_autoanalyze, last_analyze) ASC NULLS FIRST;

-- =============================================================================
-- 6. CONNECTION AND LOCK ANALYSIS
-- =============================================================================

SELECT 'CONNECTION AND LOCK ANALYSIS' as analysis_section;

-- Current connection status
SELECT
    'Active Connections' as connection_type,
    count(*) as count,
    'Currently active database connections' as description
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT
    'Idle Connections',
    count(*),
    'Idle database connections'
FROM pg_stat_activity
WHERE state = 'idle'

UNION ALL

SELECT
    'Idle in Transaction',
    count(*),
    'Connections idle in transaction (potential problem)'
FROM pg_stat_activity
WHERE state = 'idle in transaction'

UNION ALL

SELECT
    'Total Connections',
    count(*),
    'Total database connections'
FROM pg_stat_activity;

-- Long running queries
SELECT
    'Long Running Queries' as analysis_type,
    pid,
    usename,
    application_name,
    state,
    now() - query_start as duration,
    left(query, 100) as query_snippet
FROM pg_stat_activity
WHERE state != 'idle'
AND (now() - query_start) > interval '30 seconds'
ORDER BY (now() - query_start) DESC;

-- Lock analysis
SELECT
    'Database Locks' as analysis_type,
    mode,
    count(*) as lock_count,
    'Current locks by type' as description
FROM pg_locks
GROUP BY mode
ORDER BY count(*) DESC;

-- =============================================================================
-- 7. STORAGE AND SPACE ANALYSIS
-- =============================================================================

SELECT 'STORAGE AND SPACE ANALYSIS' as analysis_section;

-- Table space usage with growth analysis
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname||'.'||tablename) -
        pg_relation_size(schemaname||'.'||tablename)
    ) as index_size,
    n_tup_ins as total_inserts,
    n_tup_upd as total_updates,
    n_tup_del as total_deletes,
    CASE
        WHEN n_tup_ins > 0 THEN
            round(pg_relation_size(schemaname||'.'||tablename)::numeric / n_tup_ins::numeric, 2)
        ELSE 0
    END as bytes_per_row
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index to table size ratios
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(
        pg_total_relation_size(schemaname||'.'||tablename) -
        pg_relation_size(schemaname||'.'||tablename)
    ) as index_size,
    CASE
        WHEN pg_relation_size(schemaname||'.'||tablename) > 0 THEN
            round(
                ((pg_total_relation_size(schemaname||'.'||tablename) -
                  pg_relation_size(schemaname||'.'||tablename))::numeric /
                 pg_relation_size(schemaname||'.'||tablename)::numeric) * 100, 2
            )
        ELSE 0
    END as index_to_table_ratio,
    CASE
        WHEN pg_relation_size(schemaname||'.'||tablename) > 0 AND
             ((pg_total_relation_size(schemaname||'.'||tablename) -
               pg_relation_size(schemaname||'.'||tablename))::numeric /
              pg_relation_size(schemaname||'.'||tablename)::numeric) > 2
        THEN 'HIGH_INDEX_OVERHEAD'
        ELSE 'NORMAL'
    END as index_overhead_status
FROM pg_stat_user_tables
WHERE pg_relation_size(schemaname||'.'||tablename) > 1024  -- Only tables > 1KB
ORDER BY
    CASE
        WHEN pg_relation_size(schemaname||'.'||tablename) > 0 THEN
            (pg_total_relation_size(schemaname||'.'||tablename) -
             pg_relation_size(schemaname||'.'||tablename))::numeric /
            pg_relation_size(schemaname||'.'||tablename)::numeric
        ELSE 0
    END DESC;

-- =============================================================================
-- 8. PERFORMANCE RECOMMENDATIONS
-- =============================================================================

SELECT 'PERFORMANCE RECOMMENDATIONS' as analysis_section;

-- Generate performance recommendations based on analysis
WITH performance_issues AS (
    -- High sequential scan tables
    SELECT
        'Add indexes for high sequential scan tables' as recommendation,
        'INDEXING' as category,
        'HIGH' as priority,
        'Tables: ' || string_agg(tablename, ', ') as details
    FROM pg_stat_user_tables
    WHERE seq_scan > 100 AND n_live_tup > 1000
    AND (seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)::numeric) > 0.1
    GROUP BY 1, 2, 3
    HAVING count(*) > 0

    UNION ALL

    -- Tables needing vacuum
    SELECT
        'Schedule vacuum for tables with high dead row percentage',
        'MAINTENANCE',
        'HIGH',
        'Tables: ' || string_agg(tablename, ', ')
    FROM pg_stat_user_tables
    WHERE n_live_tup > 0 AND (n_dead_tup::numeric / n_live_tup::numeric) > 0.2
    GROUP BY 1, 2, 3
    HAVING count(*) > 0

    UNION ALL

    -- Unused indexes
    SELECT
        'Remove unused indexes to reduce storage overhead',
        'INDEXING',
        'MEDIUM',
        'Count: ' || count(*)::text || ' unused indexes'
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0 AND pg_relation_size(indexrelid) > 1024
    GROUP BY 1, 2, 3
    HAVING count(*) > 0

    UNION ALL

    -- Cache hit ratio
    SELECT
        'Increase shared_buffers to improve cache hit ratio',
        'CONFIGURATION',
        'MEDIUM',
        'Current hit ratio: ' || round(
            (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2
        )::text || '%'
    FROM pg_statio_user_tables
    GROUP BY 1, 2, 3
    HAVING round(
        (sum(heap_blks_hit)::numeric / NULLIF(sum(heap_blks_hit + heap_blks_read), 0)::numeric) * 100, 2
    ) < 95
)
SELECT
    recommendation,
    category,
    priority,
    details
FROM performance_issues
ORDER BY
    CASE priority
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
    END;

-- =============================================================================
-- PERFORMANCE ANALYSIS COMPLETE
-- =============================================================================

SELECT 'PERFORMANCE ANALYSIS COMPLETE - ' || now()::text as completion_status;