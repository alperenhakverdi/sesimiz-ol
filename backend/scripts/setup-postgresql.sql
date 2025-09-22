
-- PostgreSQL Production Database Setup
-- Run this after creating your PostgreSQL database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- Note: Prisma will create basic indexes, these are additional optimizations

-- User performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Story performance indexes
CREATE INDEX IF NOT EXISTS idx_stories_status_created ON stories(status, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_author_status ON stories(author_id, status);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);

-- Notification performance indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type_created ON notifications(type, created_at);

-- Comment performance indexes
CREATE INDEX IF NOT EXISTS idx_comments_story_created ON comments(story_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_author_created ON comments(author_id, created_at);

-- Message performance indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON messages(sender_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at);

-- Session management indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, revoked_at);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);

-- Organization indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status_type ON organizations(status, type);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_user ON organization_members(organization_id, user_id);

-- Full-text search setup (optional - uncomment if needed)
-- ALTER TABLE stories ADD COLUMN search_vector tsvector;
-- CREATE INDEX idx_stories_search ON stories USING gin(search_vector);
-- CREATE OR REPLACE FUNCTION update_story_search_vector() RETURNS trigger AS $$
-- BEGIN
--   NEW.search_vector := to_tsvector('turkish', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER trig_update_story_search BEFORE INSERT OR UPDATE ON stories
--   FOR EACH ROW EXECUTE FUNCTION update_story_search_vector();
