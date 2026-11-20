-- AlterEnum: Add Follow notification type
-- Isolated in its own migration so PostgreSQL enum expansion commits safely
-- before downstream queries or DDL reference the new value.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'Follow';
