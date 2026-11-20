-- AlterEnum: Add peer connection notification types
-- Isolated in its own migration so PostgreSQL enum expansion commits safely
-- before any downstream DDL or queries reference the new enum values.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ConnectionRequest';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ConnectionAccepted';
