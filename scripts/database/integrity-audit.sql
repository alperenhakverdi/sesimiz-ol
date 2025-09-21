-- =============================================================================
-- Database Integrity Audit for Sesimiz Ol PostgreSQL Database
-- =============================================================================
-- This comprehensive audit script checks database integrity, constraints,
-- performance, and data consistency for production readiness.

-- Enable timing and expanded display for better output
\timing on
\x auto

-- =============================================================================
-- 1. DATABASE HEALTH OVERVIEW
-- =============================================================================

SELECT 'DATABASE HEALTH OVERVIEW' as audit_section;

-- Database size and connection info
SELECT
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'Total database size including indexes' as description
UNION ALL
SELECT
    'Active Connections',
    count(*)::text,
    'Current active database connections'
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT
    'Database Version',
    version(),
    'PostgreSQL version information'
UNION ALL
SELECT
    'Uptime',
    (now() - pg_postmaster_start_time())::text,
    'Database server uptime';

-- =============================================================================
-- 2. TABLE STATISTICS AND SIZES
-- =============================================================================

SELECT 'TABLE STATISTICS AND SIZES' as audit_section;

SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE
        WHEN n_live_tup > 0 THEN round((n_dead_tup::float / n_live_tup::float) * 100, 2)
        ELSE 0
    END as dead_row_percentage
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================================================
-- 3. FOREIGN KEY CONSTRAINT VERIFICATION
-- =============================================================================

SELECT 'FOREIGN KEY CONSTRAINT VERIFICATION' as audit_section;

-- Check for violated foreign key constraints
WITH fk_violations AS (
    SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
)
SELECT
    'Foreign Key Constraints' as check_type,
    count(*) as total_count,
    'Total foreign key constraints in database' as description
FROM fk_violations;

-- Detailed FK constraint check
SELECT
    fv.table_name,
    fv.constraint_name,
    fv.column_name,
    fv.foreign_table_name,
    fv.foreign_column_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc2
            WHERE tc2.constraint_name = fv.constraint_name
            AND tc2.constraint_type = 'FOREIGN KEY'
        ) THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM (
    SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
) fv
ORDER BY fv.table_name, fv.constraint_name;

-- =============================================================================
-- 4. ORPHANED RECORDS DETECTION
-- =============================================================================

SELECT 'ORPHANED RECORDS DETECTION' as audit_section;

-- Check for orphaned records in key relationships
-- Users without valid sessions (potential cleanup candidates)
SELECT
    'Users without sessions' as check_type,
    count(*) as count,
    'Users who have never logged in or have no active sessions' as description
FROM users u
LEFT JOIN user_sessions s ON u.id = s."userId"
WHERE s."userId" IS NULL;

-- Stories without authors (should not exist due to FK constraint)
SELECT
    'Stories without authors' as check_type,
    count(*) as count,
    'Stories with invalid author references (constraint violation)' as description
FROM stories s
LEFT JOIN users u ON s."authorId" = u.id
WHERE u.id IS NULL;

-- Comments without valid stories
SELECT
    'Comments without stories' as check_type,
    count(*) as count,
    'Comments referencing non-existent stories' as description
FROM comments c
LEFT JOIN stories s ON c."storyId" = s.id
WHERE s.id IS NULL;

-- Comments without valid authors
SELECT
    'Comments without authors' as check_type,
    count(*) as count,
    'Comments with invalid author references' as description
FROM comments c
LEFT JOIN users u ON c."authorId" = u.id
WHERE u.id IS NULL;

-- User sessions without valid users
SELECT
    'Sessions without users' as check_type,
    count(*) as count,
    'Sessions referencing deleted users' as description
FROM user_sessions s
LEFT JOIN users u ON s."userId" = u.id
WHERE u.id IS NULL;

-- Password reset tokens without valid users
SELECT
    'Password tokens without users' as check_type,
    count(*) as count,
    'Password reset tokens for non-existent users' as description
FROM password_reset_tokens t
LEFT JOIN users u ON t."userId" = u.id
WHERE u.id IS NULL;

-- =============================================================================
-- 5. DATA CONSISTENCY CHECKS
-- =============================================================================

SELECT 'DATA CONSISTENCY CHECKS' as audit_section;

-- Check for duplicate emails (should be prevented by unique constraint)
SELECT
    'Duplicate emails' as check_type,
    count(*) as violations,
    'Users with duplicate email addresses' as description
FROM (
    SELECT email, count(*) as cnt
    FROM users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING count(*) > 1
) dup_emails;

-- Check for duplicate nicknames (should be prevented by unique constraint)
SELECT
    'Duplicate nicknames' as check_type,
    count(*) as violations,
    'Users with duplicate nicknames' as description
FROM (
    SELECT nickname, count(*) as cnt
    FROM users
    GROUP BY nickname
    HAVING count(*) > 1
) dup_nicknames;

-- Check story view counts vs actual views
SELECT
    'Inconsistent story view counts' as check_type,
    count(*) as violations,
    'Stories where viewCount does not match actual story_views records' as description
FROM (
    SELECT
        s.id,
        s."viewCount",
        count(sv.id) as actual_views
    FROM stories s
    LEFT JOIN story_views sv ON s.id = sv."storyId"
    GROUP BY s.id, s."viewCount"
    HAVING s."viewCount" != count(sv.id)
) inconsistent_views;

-- Check story support counts vs actual supports
SELECT
    'Inconsistent story support counts' as check_type,
    count(*) as violations,
    'Stories where supportCount does not match actual story_supports records' as description
FROM (
    SELECT
        s.id,
        s."supportCount",
        count(ss.id) as actual_supports
    FROM stories s
    LEFT JOIN story_supports ss ON s.id = ss."storyId"
    GROUP BY s.id, s."supportCount"
    HAVING s."supportCount" != count(ss.id)
) inconsistent_supports;

-- Check for users with settings but invalid relationships
SELECT
    'Users without settings' as check_type,
    count(*) as count,
    'Active users without user_settings records' as description
FROM users u
LEFT JOIN user_settings us ON u.id = us."userId"
WHERE us."userId" IS NULL AND u."isActive" = true;

-- =============================================================================
-- 6. INDEX ANALYSIS AND PERFORMANCE
-- =============================================================================

SELECT 'INDEX ANALYSIS AND PERFORMANCE' as audit_section;

-- Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    CASE
        WHEN idx_tup_read > 0 THEN round((idx_tup_fetch::float / idx_tup_read::float) * 100, 2)
        ELSE 0
    END as hit_ratio_percentage
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Unused indexes (potential candidates for removal)
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    'Unused index - candidate for removal' as recommendation
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND pg_relation_size(indexrelid) > 1024 -- Only show indexes > 1KB
ORDER BY pg_relation_size(indexrelid) DESC;

-- Missing indexes on foreign key columns
WITH fk_columns AS (
    SELECT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
),
indexed_columns AS (
    SELECT
        t.relname as table_name,
        a.attname as column_name
    FROM pg_index i
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
    WHERE t.relkind = 'r'
)
SELECT
    fk.table_name,
    fk.column_name,
    'Missing index on foreign key column' as recommendation
FROM fk_columns fk
LEFT JOIN indexed_columns ic ON fk.table_name = ic.table_name AND fk.column_name = ic.column_name
WHERE ic.column_name IS NULL
ORDER BY fk.table_name, fk.column_name;

-- =============================================================================
-- 7. SECURITY AND DATA INTEGRITY CHECKS
-- =============================================================================

SELECT 'SECURITY AND DATA INTEGRITY CHECKS' as audit_section;

-- Check for weak or default passwords (look for patterns)
SELECT
    'Users with potentially weak passwords' as check_type,
    count(*) as count,
    'Users who might have weak password patterns' as description
FROM users
WHERE length(password) < 60  -- bcrypt hashes should be ~60 chars
   OR password IS NULL;

-- Check for inactive but not banned users
SELECT
    'Inactive but not banned users' as check_type,
    count(*) as count,
    'Users marked inactive but not banned (potential data inconsistency)' as description
FROM users
WHERE "isActive" = false AND "isBanned" = false;

-- Check for expired password reset tokens that haven't been cleaned up
SELECT
    'Expired password reset tokens' as check_type,
    count(*) as count,
    'Expired password reset tokens that should be cleaned up' as description
FROM password_reset_tokens
WHERE "expiresAt" < now() AND "consumedAt" IS NULL;

-- Check for expired user sessions
SELECT
    'Expired user sessions' as check_type,
    count(*) as count,
    'Expired sessions that should be cleaned up' as description
FROM user_sessions
WHERE "expiresAt" < now() AND "revokedAt" IS NULL;

-- =============================================================================
-- 8. PERFORMANCE METRICS
-- =============================================================================

SELECT 'PERFORMANCE METRICS' as audit_section;

-- Table scan vs index scan ratios
SELECT
    schemaname,
    tablename,
    seq_scan as table_scans,
    seq_tup_read as rows_read_by_scans,
    idx_scan as index_scans,
    idx_tup_fetch as rows_fetched_by_index,
    CASE
        WHEN (seq_scan + idx_scan) > 0
        THEN round((seq_scan::float / (seq_scan + idx_scan)::float) * 100, 2)
        ELSE 0
    END as table_scan_percentage
FROM pg_stat_user_tables
WHERE (seq_scan + idx_scan) > 0
ORDER BY table_scan_percentage DESC;

-- Cache hit ratios
SELECT
    'Buffer Cache Hit Ratio' as metric,
    round(
        (sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)) * 100, 2
    ) as percentage,
    CASE
        WHEN round((sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0)) * 100, 2) >= 95
        THEN 'GOOD'
        ELSE 'NEEDS_ATTENTION'
    END as status
FROM pg_statio_user_tables;

-- =============================================================================
-- 9. VACUUM AND ANALYZE STATUS
-- =============================================================================

SELECT 'VACUUM AND ANALYZE STATUS' as audit_section;

-- Last vacuum and analyze times
SELECT
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count,
    CASE
        WHEN last_autovacuum IS NULL AND last_vacuum IS NULL THEN 'NEVER_VACUUMED'
        WHEN last_autovacuum < now() - interval '7 days' AND last_vacuum < now() - interval '7 days' THEN 'NEEDS_VACUUM'
        ELSE 'OK'
    END as vacuum_status
FROM pg_stat_user_tables
ORDER BY COALESCE(last_autovacuum, last_vacuum, '1970-01-01'::timestamp) ASC;

-- =============================================================================
-- 10. RECOMMENDATIONS SUMMARY
-- =============================================================================

SELECT 'RECOMMENDATIONS SUMMARY' as audit_section;

-- Generate automated recommendations based on the checks above
WITH recommendations AS (
    -- Vacuum recommendations
    SELECT 'Vacuum old tables' as recommendation, 'MAINTENANCE' as category, 'HIGH' as priority
    FROM pg_stat_user_tables
    WHERE (last_autovacuum IS NULL OR last_autovacuum < now() - interval '7 days')
    AND (last_vacuum IS NULL OR last_vacuum < now() - interval '7 days')
    AND n_dead_tup > 100
    LIMIT 1

    UNION ALL

    -- Index recommendations
    SELECT 'Remove unused indexes to save space' as recommendation, 'PERFORMANCE' as category, 'MEDIUM' as priority
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
    AND pg_relation_size(indexrelid) > 1024
    LIMIT 1

    UNION ALL

    -- Cleanup recommendations
    SELECT 'Clean up expired sessions and tokens' as recommendation, 'SECURITY' as category, 'HIGH' as priority
    WHERE EXISTS (
        SELECT 1 FROM user_sessions WHERE "expiresAt" < now() AND "revokedAt" IS NULL
        UNION
        SELECT 1 FROM password_reset_tokens WHERE "expiresAt" < now() AND "consumedAt" IS NULL
    )
)
SELECT * FROM recommendations
ORDER BY
    CASE priority
        WHEN 'HIGH' THEN 1
        WHEN 'MEDIUM' THEN 2
        WHEN 'LOW' THEN 3
    END;

-- =============================================================================
-- AUDIT COMPLETE
-- =============================================================================

SELECT 'AUDIT COMPLETE - ' || now()::text as final_status;