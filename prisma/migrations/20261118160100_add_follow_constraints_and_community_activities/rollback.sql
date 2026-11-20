-- Rollback script for 20261118160100_add_follow_constraints_and_community_activities
-- WARNING:
-- 1. Dropping "activities" removes community feed history (underlying projects and versions are preserved).
-- 2. Dropping follows_no_self_follow_check preserves all existing Follow rows.
-- 3. PostgreSQL does NOT support dropping individual enum values ('Follow') from
--    "NotificationType" without recreating the enum type.

DELETE FROM "notifications" WHERE "type" = 'Follow';

DROP TABLE IF EXISTS "activities";
DROP TYPE IF EXISTS "ActivityType";

DROP INDEX IF EXISTS "follows_followerId_createdAt_idx";
DROP INDEX IF EXISTS "follows_followingId_createdAt_idx";
ALTER TABLE "follows" DROP CONSTRAINT IF EXISTS "follows_no_self_follow_check";
