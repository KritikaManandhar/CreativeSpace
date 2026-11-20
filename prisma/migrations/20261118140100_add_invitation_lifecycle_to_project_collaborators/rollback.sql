-- Rollback script for 20261118140100_add_invitation_lifecycle_to_project_collaborators
-- WARNING:
-- 1. Dropping "status" collapses Rejected/Cancelled invitation records into acceptedAt IS NULL rows;
--    we remove Rejected/Cancelled rows first so they are not accidentally treated as Pending invites.
-- 2. PostgreSQL does NOT support dropping individual enum values ('InvitationAccepted',
--    'InvitationRejected', 'InvitationCancelled', 'CollaboratorRemoved') from "NotificationType"
--    without recreating the enum type.

DELETE FROM "notifications"
WHERE "type" IN ('InvitationAccepted', 'InvitationRejected', 'InvitationCancelled', 'CollaboratorRemoved');

-- Remove terminal Rejected / Cancelled invitation rows so they do not revert to Pending
DELETE FROM "project_collaborators"
WHERE "status" IN ('Rejected', 'Cancelled');

ALTER TABLE "project_collaborators" DROP CONSTRAINT IF EXISTS "project_collaborators_invitedById_fkey";
ALTER TABLE "project_collaborators" DROP CONSTRAINT IF EXISTS "project_collaborators_status_timestamps_check";
DROP INDEX IF EXISTS "project_collaborators_projectId_status_idx";
DROP INDEX IF EXISTS "project_collaborators_userId_status_idx";

ALTER TABLE "project_collaborators"
DROP COLUMN IF EXISTS "cancelledAt",
DROP COLUMN IF EXISTS "rejectedAt",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "invitedById";

DROP TYPE IF EXISTS "InvitationStatus";
