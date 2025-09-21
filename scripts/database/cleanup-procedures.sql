-- =============================================================================
-- Database Cleanup Procedures for Sesimiz Ol
-- =============================================================================
-- This script contains safe cleanup procedures for maintaining database
-- hygiene and performance in production environments.

\timing on

-- =============================================================================
-- 1. EXPIRED DATA CLEANUP
-- =============================================================================

-- Clean up expired password reset tokens
-- These should be cleaned up automatically but this ensures no accumulation
BEGIN;

-- Show what will be cleaned before deletion
SELECT
    'Expired Password Reset Tokens Cleanup' as cleanup_type,
    count(*) as tokens_to_remove,
    min("expiresAt") as oldest_expired,
    max("expiresAt") as newest_expired
FROM password_reset_tokens
WHERE "expiresAt" < now() - interval '24 hours'  -- Extra safety margin
AND "consumedAt" IS NULL;

-- Delete expired password reset tokens (older than 24 hours past expiry)
DELETE FROM password_reset_tokens
WHERE "expiresAt" < now() - interval '24 hours'
AND "consumedAt" IS NULL;

-- Log the cleanup
SELECT 'Password reset tokens cleanup completed at ' || now()::text as cleanup_status;

COMMIT;

-- =============================================================================
-- 2. EXPIRED SESSION CLEANUP
-- =============================================================================

BEGIN;

-- Show expired sessions to be cleaned
SELECT
    'Expired User Sessions Cleanup' as cleanup_type,
    count(*) as sessions_to_remove,
    min("expiresAt") as oldest_expired,
    max("expiresAt") as newest_expired
FROM user_sessions
WHERE "expiresAt" < now() - interval '7 days'  -- Keep for 7 days after expiry for auditing
AND "revokedAt" IS NULL;

-- Clean up expired user sessions (older than 7 days past expiry)
DELETE FROM user_sessions
WHERE "expiresAt" < now() - interval '7 days'
AND "revokedAt" IS NULL;

-- Log the cleanup
SELECT 'Expired sessions cleanup completed at ' || now()::text as cleanup_status;

COMMIT;

-- =============================================================================
-- 3. OLD NOTIFICATION CLEANUP
-- =============================================================================

BEGIN;

-- Show old notifications to be cleaned
SELECT
    'Old Notifications Cleanup' as cleanup_type,
    count(*) as notifications_to_remove,
    min("createdAt") as oldest_notification,
    max("createdAt") as newest_in_range
FROM notifications
WHERE "createdAt" < now() - interval '90 days'  -- Keep notifications for 90 days
AND "readAt" IS NOT NULL;  -- Only remove read notifications

-- Clean up old read notifications (older than 90 days)
DELETE FROM notifications
WHERE "createdAt" < now() - interval '90 days'
AND "readAt" IS NOT NULL;

-- Log the cleanup
SELECT 'Old notifications cleanup completed at ' || now()::text as cleanup_status;

COMMIT;

-- =============================================================================
-- 4. ORPHANED RECORDS CLEANUP
-- =============================================================================

-- Note: These cleanups should not be necessary if foreign key constraints
-- are properly implemented, but they serve as safety measures

BEGIN;

-- Clean up orphaned comment reactions (comments that no longer exist)
SELECT
    'Orphaned Comment Reactions Cleanup' as cleanup_type,
    count(*) as reactions_to_remove
FROM comment_reactions cr
LEFT JOIN comments c ON cr."commentId" = c.id
WHERE c.id IS NULL;

DELETE FROM comment_reactions
WHERE "commentId" NOT IN (SELECT id FROM comments);

-- Clean up orphaned story views for deleted stories
SELECT
    'Orphaned Story Views Cleanup' as cleanup_type,
    count(*) as views_to_remove
FROM story_views sv
LEFT JOIN stories s ON sv."storyId" = s.id
WHERE s.id IS NULL;

DELETE FROM story_views
WHERE "storyId" NOT IN (SELECT id FROM stories);

-- Clean up orphaned story supports for deleted stories
SELECT
    'Orphaned Story Supports Cleanup' as cleanup_type,
    count(*) as supports_to_remove
FROM story_supports ss
LEFT JOIN stories s ON ss."storyId" = s.id
WHERE s.id IS NULL;

DELETE FROM story_supports
WHERE "storyId" NOT IN (SELECT id FROM stories);

-- Clean up orphaned bookmarks for deleted stories
SELECT
    'Orphaned Bookmarks Cleanup' as cleanup_type,
    count(*) as bookmarks_to_remove
FROM user_bookmarks ub
LEFT JOIN stories s ON ub."storyId" = s.id
WHERE s.id IS NULL;

DELETE FROM user_bookmarks
WHERE "storyId" NOT IN (SELECT id FROM stories);

-- Log the cleanup
SELECT 'Orphaned records cleanup completed at ' || now()::text as cleanup_status;

COMMIT;

-- =============================================================================
-- 5. DUPLICATE DATA CLEANUP
-- =============================================================================

-- Clean up duplicate story views (should not happen with unique constraints)
BEGIN;

-- Identify and remove duplicate story views by same user
WITH duplicate_views AS (
    SELECT
        "storyId",
        "viewerId",
        array_agg(id ORDER BY "createdAt" DESC) as view_ids
    FROM story_views
    WHERE "viewerId" IS NOT NULL
    GROUP BY "storyId", "viewerId"
    HAVING count(*) > 1
),
views_to_keep AS (
    SELECT
        "storyId",
        "viewerId",
        view_ids[1] as keep_id
    FROM duplicate_views
),
views_to_delete AS (
    SELECT
        unnest(view_ids[2:]) as delete_id
    FROM duplicate_views
)
SELECT
    'Duplicate Story Views Cleanup' as cleanup_type,
    count(*) as duplicates_to_remove
FROM views_to_delete;

-- Delete duplicate views (keep the most recent one)
WITH duplicate_views AS (
    SELECT
        "storyId",
        "viewerId",
        array_agg(id ORDER BY "createdAt" DESC) as view_ids
    FROM story_views
    WHERE "viewerId" IS NOT NULL
    GROUP BY "storyId", "viewerId"
    HAVING count(*) > 1
),
views_to_delete AS (
    SELECT
        unnest(view_ids[2:]) as delete_id
    FROM duplicate_views
)
DELETE FROM story_views
WHERE id IN (SELECT delete_id FROM views_to_delete);

-- Log the cleanup
SELECT 'Duplicate data cleanup completed at ' || now()::text as cleanup_status;

COMMIT;

-- =============================================================================
-- 6. VACUUM AND ANALYZE MAINTENANCE
-- =============================================================================

-- Note: These are manual VACUUM and ANALYZE commands
-- In production, these should be handled by autovacuum, but manual execution
-- can be beneficial after large cleanup operations

-- Vacuum tables that were cleaned up
VACUUM ANALYZE password_reset_tokens;
VACUUM ANALYZE user_sessions;
VACUUM ANALYZE notifications;
VACUUM ANALYZE comment_reactions;
VACUUM ANALYZE story_views;
VACUUM ANALYZE story_supports;
VACUUM ANALYZE user_bookmarks;

-- =============================================================================
-- 7. UPDATE STATISTICS AND COUNTERS
-- =============================================================================

-- Update story view counts to match actual views
BEGIN;

UPDATE stories
SET "viewCount" = (
    SELECT count(*)
    FROM story_views sv
    WHERE sv."storyId" = stories.id
)
WHERE id IN (
    SELECT DISTINCT s.id
    FROM stories s
    JOIN story_views sv ON s.id = sv."storyId"
    GROUP BY s.id, s."viewCount"
    HAVING s."viewCount" != count(sv.id)
);

-- Update story support counts to match actual supports
UPDATE stories
SET "supportCount" = (
    SELECT count(*)
    FROM story_supports ss
    WHERE ss."storyId" = stories.id
)
WHERE id IN (
    SELECT DISTINCT s.id
    FROM stories s
    LEFT JOIN story_supports ss ON s.id = ss."storyId"
    GROUP BY s.id, s."supportCount"
    HAVING s."supportCount" != count(ss.id)
);

-- Update tag usage counts
UPDATE tags
SET "usageCount" = (
    SELECT count(*)
    FROM story_tags st
    WHERE st."tagId" = tags.id
)
WHERE id IN (
    SELECT DISTINCT t.id
    FROM tags t
    LEFT JOIN story_tags st ON t.id = st."tagId"
    GROUP BY t.id, t."usageCount"
    HAVING t."usageCount" != count(st.id)
);

-- Log the updates
SELECT 'Statistics and counters updated at ' || now()::text as update_status;

COMMIT;

-- =============================================================================
-- 8. SECURITY CLEANUP
-- =============================================================================

-- Clean up failed login attempts older than 30 days
BEGIN;

UPDATE users
SET
    "failedLoginCount" = 0,
    "lastFailedLoginAt" = NULL,
    "lockedUntil" = NULL
WHERE "lastFailedLoginAt" < now() - interval '30 days'
AND ("failedLoginCount" > 0 OR "lockedUntil" IS NOT NULL);

-- Log security cleanup
SELECT 'Security data cleanup completed at ' || now()::text as security_cleanup_status;

COMMIT;

-- =============================================================================
-- 9. CLEANUP SUMMARY AND STATISTICS
-- =============================================================================

-- Generate cleanup summary
SELECT 'DATABASE CLEANUP SUMMARY' as summary_section;

-- Show current database statistics after cleanup
SELECT
    'Post-Cleanup Database Statistics' as statistic_type,
    schemaname,
    tablename,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    CASE
        WHEN n_live_tup > 0 THEN round((n_dead_tup::numeric / n_live_tup::numeric) * 100, 2)
        ELSE 0
    END as dead_row_percentage,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show tables that might benefit from vacuum after cleanup
SELECT
    'Tables Needing Vacuum After Cleanup' as recommendation_type,
    schemaname,
    tablename,
    n_dead_tup as dead_rows,
    'Consider manual VACUUM for optimal performance' as recommendation
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- =============================================================================
-- 10. MAINTENANCE SCHEDULE RECOMMENDATIONS
-- =============================================================================

SELECT 'MAINTENANCE SCHEDULE RECOMMENDATIONS' as recommendation_section;

SELECT
    'Daily Cleanup Tasks' as schedule_type,
    unnest(ARRAY[
        'Clean expired password reset tokens',
        'Monitor and clean expired sessions',
        'Update view and support counters'
    ]) as task,
    'Automated via cron job' as implementation;

SELECT
    'Weekly Cleanup Tasks' as schedule_type,
    unnest(ARRAY[
        'Clean old read notifications',
        'Vacuum analyze frequently updated tables',
        'Check for orphaned records'
    ]) as task,
    'Scheduled maintenance window' as implementation;

SELECT
    'Monthly Cleanup Tasks' as schedule_type,
    unnest(ARRAY[
        'Deep analysis of unused indexes',
        'Review and optimize query performance',
        'Archive old data if needed'
    ]) as task,
    'Manual review and optimization' as implementation;

-- Final completion message
SELECT 'DATABASE CLEANUP PROCEDURES COMPLETE - ' || now()::text as final_status;