-- Rollback script for 20261118120100_add_threaded_comments_comment_likes_and_review_notifications
-- WARNING:
-- 1. Dropping comments."parentId" flattens any existing replies into top-level comments (or they must be deleted beforehand).
-- 2. Dropping "comment_likes" permanently removes all comment like records.
-- 3. PostgreSQL does NOT support dropping individual enum values ('Reply', 'Like') from
--    "NotificationType" without recreating the enum type. Delete or migrate rows with those
--    types before attempting manual enum recreation.

-- Remove notifications specifically created for Reply / Like if rolling back enum usage
DELETE FROM "notifications"
WHERE "type" IN ('Reply', 'Like');

-- Drop notification FKs, indexes, and columns
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_relatedCommentId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_relatedVersionId_fkey";
DROP INDEX IF EXISTS "notifications_relatedCommentId_idx";
DROP INDEX IF EXISTS "notifications_relatedVersionId_idx";
ALTER TABLE "notifications"
DROP COLUMN IF EXISTS "relatedCommentId",
DROP COLUMN IF EXISTS "relatedVersionId";

-- Drop comment_likes table (drops its FKs and indexes automatically)
DROP TABLE IF EXISTS "comment_likes";

-- Drop self-referential FK, check constraint, indexes, and columns on comments
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_parentId_fkey";
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_no_self_parent_check";
DROP INDEX IF EXISTS "comments_projectId_versionId_parentId_idx";
DROP INDEX IF EXISTS "comments_parentId_idx";
ALTER TABLE "comments"
DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "parentId";
