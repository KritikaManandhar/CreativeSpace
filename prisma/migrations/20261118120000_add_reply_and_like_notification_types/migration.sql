-- AlterEnum: Add Reply and Like values to NotificationType
-- Isolated in its own migration so PostgreSQL enum expansion commits cleanly
-- before any downstream DDL or queries reference the new values.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Reply';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Like';
