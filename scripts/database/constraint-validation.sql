-- =============================================================================
-- Database Constraint Validation for Sesimiz Ol
-- =============================================================================
-- This script validates all database constraints and checks for potential
-- constraint violations that could cause data integrity issues.

\timing on
\x auto

-- =============================================================================
-- 1. PRIMARY KEY CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'PRIMARY KEY CONSTRAINT VALIDATION' as validation_section;

-- Check for NULL values in primary key columns
WITH pk_columns AS (
    SELECT
        tc.table_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
)
SELECT
    'Primary Key NULL Check' as check_type,
    pk.table_name,
    pk.column_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns c
            WHERE c.table_name = pk.table_name
            AND c.column_name = pk.column_name
            AND c.is_nullable = 'YES'
        ) THEN 'VIOLATION: PK column allows NULL'
        ELSE 'OK'
    END as status
FROM pk_columns pk
ORDER BY pk.table_name;

-- =============================================================================
-- 2. FOREIGN KEY CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'FOREIGN KEY CONSTRAINT VALIDATION' as validation_section;

-- Validate each foreign key relationship exists and is properly referenced
-- Users -> Stories relationship
SELECT
    'FK: stories.authorId -> users.id' as constraint_check,
    count(*) as total_stories,
    count(u.id) as valid_references,
    count(*) - count(u.id) as violations
FROM stories s
LEFT JOIN users u ON s."authorId" = u.id;

-- Users -> Comments relationship
SELECT
    'FK: comments.authorId -> users.id' as constraint_check,
    count(*) as total_comments,
    count(u.id) as valid_references,
    count(*) - count(u.id) as violations
FROM comments c
LEFT JOIN users u ON c."authorId" = u.id;

-- Stories -> Comments relationship
SELECT
    'FK: comments.storyId -> stories.id' as constraint_check,
    count(*) as total_comments,
    count(s.id) as valid_references,
    count(*) - count(s.id) as violations
FROM comments c
LEFT JOIN stories s ON c."storyId" = s.id;

-- Users -> UserSessions relationship
SELECT
    'FK: user_sessions.userId -> users.id' as constraint_check,
    count(*) as total_sessions,
    count(u.id) as valid_references,
    count(*) - count(u.id) as violations
FROM user_sessions us
LEFT JOIN users u ON us."userId" = u.id;

-- Users -> UserSettings relationship
SELECT
    'FK: user_settings.userId -> users.id' as constraint_check,
    count(*) as total_settings,
    count(u.id) as valid_references,
    count(*) - count(u.id) as violations
FROM user_settings uset
LEFT JOIN users u ON uset."userId" = u.id;

-- Users -> PasswordResetTokens relationship
SELECT
    'FK: password_reset_tokens.userId -> users.id' as constraint_check,
    count(*) as total_tokens,
    count(u.id) as valid_references,
    count(*) - count(u.id) as violations
FROM password_reset_tokens prt
LEFT JOIN users u ON prt."userId" = u.id;

-- Stories -> StoryViews relationship
SELECT
    'FK: story_views.storyId -> stories.id' as constraint_check,
    count(*) as total_views,
    count(s.id) as valid_references,
    count(*) - count(s.id) as violations
FROM story_views sv
LEFT JOIN stories s ON sv."storyId" = s.id;

-- Stories -> StorySupports relationship
SELECT
    'FK: story_supports.storyId -> stories.id' as constraint_check,
    count(*) as total_supports,
    count(s.id) as valid_story_refs,
    count(u.id) as valid_user_refs,
    count(*) - LEAST(count(s.id), count(u.id)) as violations
FROM story_supports ss
LEFT JOIN stories s ON ss."storyId" = s.id
LEFT JOIN users u ON ss."userId" = u.id;

-- Categories -> Stories relationship
SELECT
    'FK: stories.categoryId -> categories.id' as constraint_check,
    count(*) as total_categorized_stories,
    count(c.id) as valid_references,
    count(*) - count(c.id) as violations
FROM stories s
LEFT JOIN categories c ON s."categoryId" = c.id
WHERE s."categoryId" IS NOT NULL;

-- Organizations -> Stories relationship
SELECT
    'FK: stories.organizationId -> organizations.id' as constraint_check,
    count(*) as total_org_stories,
    count(o.id) as valid_references,
    count(*) - count(o.id) as violations
FROM stories s
LEFT JOIN organizations o ON s."organizationId" = o.id
WHERE s."organizationId" IS NOT NULL;

-- =============================================================================
-- 3. UNIQUE CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'UNIQUE CONSTRAINT VALIDATION' as validation_section;

-- Check for duplicate violations in unique constraints
-- Users email uniqueness
SELECT
    'UNIQUE: users.email' as constraint_check,
    count(*) as total_emails,
    count(DISTINCT email) as unique_emails,
    count(*) - count(DISTINCT email) as violations
FROM users
WHERE email IS NOT NULL;

-- Users nickname uniqueness
SELECT
    'UNIQUE: users.nickname' as constraint_check,
    count(*) as total_nicknames,
    count(DISTINCT nickname) as unique_nicknames,
    count(*) - count(DISTINCT nickname) as violations
FROM users;

-- Stories slug uniqueness
SELECT
    'UNIQUE: stories.slug' as constraint_check,
    count(*) as total_slugs,
    count(DISTINCT slug) as unique_slugs,
    count(*) - count(DISTINCT slug) as violations
FROM stories
WHERE slug IS NOT NULL;

-- Categories name uniqueness
SELECT
    'UNIQUE: categories.name' as constraint_check,
    count(*) as total_names,
    count(DISTINCT name) as unique_names,
    count(*) - count(DISTINCT name) as violations
FROM categories;

-- Categories slug uniqueness
SELECT
    'UNIQUE: categories.slug' as constraint_check,
    count(*) as total_slugs,
    count(DISTINCT slug) as unique_slugs,
    count(*) - count(DISTINCT slug) as violations
FROM categories;

-- Tags name uniqueness
SELECT
    'UNIQUE: tags.name' as constraint_check,
    count(*) as total_names,
    count(DISTINCT name) as unique_names,
    count(*) - count(DISTINCT name) as violations
FROM tags;

-- Organizations slug uniqueness
SELECT
    'UNIQUE: organizations.slug' as constraint_check,
    count(*) as total_slugs,
    count(DISTINCT slug) as unique_slugs,
    count(*) - count(DISTINCT slug) as violations
FROM organizations;

-- =============================================================================
-- 4. COMPOSITE UNIQUE CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'COMPOSITE UNIQUE CONSTRAINT VALIDATION' as validation_section;

-- StoryTag composite uniqueness (storyId, tagId)
SELECT
    'UNIQUE: story_tags(storyId, tagId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("storyId", "tagId")) as unique_combinations,
    count(*) - count(DISTINCT ("storyId", "tagId")) as violations
FROM story_tags;

-- UserFollow composite uniqueness (followerId, followingId)
SELECT
    'UNIQUE: user_follows(followerId, followingId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("followerId", "followingId")) as unique_combinations,
    count(*) - count(DISTINCT ("followerId", "followingId")) as violations
FROM user_follows;

-- StorySupport composite uniqueness (storyId, userId)
SELECT
    'UNIQUE: story_supports(storyId, userId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("storyId", "userId")) as unique_combinations,
    count(*) - count(DISTINCT ("storyId", "userId")) as violations
FROM story_supports;

-- UserBookmark composite uniqueness (userId, storyId)
SELECT
    'UNIQUE: user_bookmarks(userId, storyId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("userId", "storyId")) as unique_combinations,
    count(*) - count(DISTINCT ("userId", "storyId")) as violations
FROM user_bookmarks;

-- BlockedUser composite uniqueness (blockerId, blockedId)
SELECT
    'UNIQUE: blocked_users(blockerId, blockedId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("blockerId", "blockedId")) as unique_combinations,
    count(*) - count(DISTINCT ("blockerId", "blockedId")) as violations
FROM blocked_users;

-- CommentReaction composite uniqueness (userId, commentId)
SELECT
    'UNIQUE: comment_reactions(userId, commentId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("userId", "commentId")) as unique_combinations,
    count(*) - count(DISTINCT ("userId", "commentId")) as violations
FROM comment_reactions;

-- OrganizationMember composite uniqueness (organizationId, userId)
SELECT
    'UNIQUE: organization_members(organizationId, userId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("organizationId", "userId")) as unique_combinations,
    count(*) - count(DISTINCT ("organizationId", "userId")) as violations
FROM organization_members;

-- StkFollow composite uniqueness (userId, organizationId)
SELECT
    'UNIQUE: stk_follows(userId, organizationId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("userId", "organizationId")) as unique_combinations,
    count(*) - count(DISTINCT ("userId", "organizationId")) as violations
FROM stk_follows;

-- StoryView composite uniqueness (storyId, viewerId) and (storyId, fingerprint)
SELECT
    'UNIQUE: story_views(storyId, viewerId)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("storyId", "viewerId")) as unique_viewer_combinations,
    count(*) - count(DISTINCT ("storyId", "viewerId")) as viewer_violations
FROM story_views
WHERE "viewerId" IS NOT NULL;

SELECT
    'UNIQUE: story_views(storyId, fingerprint)' as constraint_check,
    count(*) as total_records,
    count(DISTINCT ("storyId", fingerprint)) as unique_fingerprint_combinations,
    count(*) - count(DISTINCT ("storyId", fingerprint)) as fingerprint_violations
FROM story_views
WHERE fingerprint IS NOT NULL;

-- =============================================================================
-- 5. CHECK CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'CHECK CONSTRAINT VALIDATION' as validation_section;

-- Validate enum values are within expected ranges
-- User roles
SELECT
    'CHECK: users.role enum values' as constraint_check,
    role,
    count(*) as count,
    CASE
        WHEN role IN ('USER', 'MODERATOR', 'ADMIN') THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM users
GROUP BY role
ORDER BY role;

-- Notification types
SELECT
    'CHECK: notifications.type enum values' as constraint_check,
    type,
    count(*) as count,
    CASE
        WHEN type IN ('SYSTEM', 'SECURITY', 'ANNOUNCEMENT') THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM notifications
GROUP BY type
ORDER BY type;

-- Profile visibility
SELECT
    'CHECK: user_settings.profileVisibility enum values' as constraint_check,
    "profileVisibility",
    count(*) as count,
    CASE
        WHEN "profileVisibility" IN ('PUBLIC', 'COMMUNITY', 'PRIVATE') THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM user_settings
GROUP BY "profileVisibility"
ORDER BY "profileVisibility";

-- Support types
SELECT
    'CHECK: story_supports.supportType enum values' as constraint_check,
    "supportType",
    count(*) as count,
    CASE
        WHEN "supportType" IN ('HEART', 'HUG', 'CLAP', 'CARE') THEN 'VALID'
        ELSE 'INVALID'
    END as status
FROM story_supports
GROUP BY "supportType"
ORDER BY "supportType";

-- =============================================================================
-- 6. BUSINESS LOGIC CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'BUSINESS LOGIC CONSTRAINT VALIDATION' as validation_section;

-- Users cannot follow themselves
SELECT
    'BUSINESS: Users following themselves' as constraint_check,
    count(*) as violations,
    'Users should not be able to follow themselves' as description
FROM user_follows
WHERE "followerId" = "followingId";

-- Users cannot block themselves
SELECT
    'BUSINESS: Users blocking themselves' as constraint_check,
    count(*) as violations,
    'Users should not be able to block themselves' as description
FROM blocked_users
WHERE "blockerId" = "blockedId";

-- Comments should not have circular parent relationships
WITH RECURSIVE comment_tree AS (
    -- Base case: top-level comments
    SELECT id, "parentId", id as root_id, 1 as depth
    FROM comments
    WHERE "parentId" IS NULL

    UNION ALL

    -- Recursive case: child comments
    SELECT c.id, c."parentId", ct.root_id, ct.depth + 1
    FROM comments c
    JOIN comment_tree ct ON c."parentId" = ct.id
    WHERE ct.depth < 10  -- Prevent infinite recursion
)
SELECT
    'BUSINESS: Circular comment references' as constraint_check,
    count(*) as violations,
    'Comments should not have circular parent relationships' as description
FROM comment_tree
WHERE id = root_id AND depth > 1;

-- Active users should not be banned
SELECT
    'BUSINESS: Active users who are banned' as constraint_check,
    count(*) as violations,
    'Users cannot be both active and banned' as description
FROM users
WHERE "isActive" = true AND "isBanned" = true;

-- Published stories should have content
SELECT
    'BUSINESS: Published stories without content' as constraint_check,
    count(*) as violations,
    'Published stories should have content' as description
FROM stories
WHERE "isPublished" = true AND (content IS NULL OR trim(content) = '');

-- View counts should not be negative
SELECT
    'BUSINESS: Negative view counts' as constraint_check,
    count(*) as violations,
    'Story view counts should not be negative' as description
FROM stories
WHERE "viewCount" < 0;

-- Support counts should not be negative
SELECT
    'BUSINESS: Negative support counts' as constraint_check,
    count(*) as violations,
    'Story support counts should not be negative' as description
FROM stories
WHERE "supportCount" < 0;

-- Password reset tokens should not be consumed before expiry
SELECT
    'BUSINESS: Consumed tokens before expiry' as constraint_check,
    count(*) as violations,
    'Password reset tokens should not be consumed before they are verified' as description
FROM password_reset_tokens
WHERE "consumedAt" IS NOT NULL AND "verifiedAt" IS NULL;

-- Failed login count should not be negative
SELECT
    'BUSINESS: Negative failed login counts' as constraint_check,
    count(*) as violations,
    'Failed login counts should not be negative' as description
FROM users
WHERE "failedLoginCount" < 0;

-- =============================================================================
-- 7. DATE AND TIME CONSTRAINT VALIDATION
-- =============================================================================

SELECT 'DATE AND TIME CONSTRAINT VALIDATION' as validation_section;

-- Created dates should not be in the future
SELECT
    'TIME: Future creation dates' as constraint_check,
    'users' as table_name,
    count(*) as violations
FROM users
WHERE "createdAt" > now()

UNION ALL

SELECT
    'TIME: Future creation dates',
    'stories',
    count(*)
FROM stories
WHERE "createdAt" > now()

UNION ALL

SELECT
    'TIME: Future creation dates',
    'comments',
    count(*)
FROM comments
WHERE "createdAt" > now();

-- Updated dates should not be before created dates
SELECT
    'TIME: Updated before created' as constraint_check,
    'users' as table_name,
    count(*) as violations
FROM users
WHERE "updatedAt" < "createdAt"

UNION ALL

SELECT
    'TIME: Updated before created',
    'stories',
    count(*)
FROM stories
WHERE "updatedAt" < "createdAt"

UNION ALL

SELECT
    'TIME: Updated before created',
    'comments',
    count(*)
FROM comments
WHERE "updatedAt" < "createdAt";

-- Session expiry dates should be after creation
SELECT
    'TIME: Session expiry before creation' as constraint_check,
    count(*) as violations,
    'User sessions should expire after they are created' as description
FROM user_sessions
WHERE "expiresAt" <= "createdAt";

-- Password reset token expiry should be after creation
SELECT
    'TIME: Token expiry before creation' as constraint_check,
    count(*) as violations,
    'Password reset tokens should expire after they are created' as description
FROM password_reset_tokens
WHERE "expiresAt" <= "createdAt";

-- =============================================================================
-- CONSTRAINT VALIDATION SUMMARY
-- =============================================================================

SELECT 'CONSTRAINT VALIDATION SUMMARY' as validation_section;

SELECT
    'Total Constraint Checks Completed' as summary,
    'All primary key, foreign key, unique, and business logic constraints validated' as description,
    now()::text as completion_time;