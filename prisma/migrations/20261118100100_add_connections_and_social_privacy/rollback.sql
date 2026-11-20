-- Rollback script for 20261118100100_add_connections_and_social_privacy
-- WARNING:
-- 1. Dropping the connections table permanently deletes all peer connection records.
-- 2. Dropping users."socialPrivacy" removes per-user social privacy preferences (socialLinks JSON is preserved).
-- 3. PostgreSQL does NOT support dropping individual values ('ConnectionRequest', 'ConnectionAccepted')
--    from an existing enum type ("NotificationType") without recreating the enum type.
--    Before rolling back the enum manually, delete or migrate any notifications with those types.

-- Remove connection notifications referencing connections
DELETE FROM "notifications"
WHERE "type" IN ('ConnectionRequest', 'ConnectionAccepted')
   OR "relatedConnectionId" IS NOT NULL;

-- Drop foreign keys and indexes on notifications
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_relatedConnectionId_fkey";
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_relatedUserId_fkey";
DROP INDEX IF EXISTS "notifications_relatedConnectionId_idx";
ALTER TABLE "notifications"
DROP COLUMN IF EXISTS "relatedConnectionId",
DROP COLUMN IF EXISTS "relatedUserId";

-- Drop connections table (also drops its check constraints, foreign keys, and indexes)
DROP TABLE IF EXISTS "connections";

-- Drop socialPrivacy column from users (preserves socialLinks JSON data)
ALTER TABLE "users" DROP COLUMN IF EXISTS "socialPrivacy";

-- Drop newly created enum types
DROP TYPE IF EXISTS "SocialPrivacy";
DROP TYPE IF EXISTS "ConnectionStatus";
