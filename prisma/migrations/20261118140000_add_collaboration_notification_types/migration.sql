-- AlterEnum: Add collaboration lifecycle notification types
-- Isolated in its own migration so PostgreSQL enum expansion commits safely
-- before downstream queries or DDL reference the new values.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'InvitationAccepted';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'InvitationRejected';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'InvitationCancelled';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CollaboratorRemoved';
