-- CreateEnum: InvitationStatus for ProjectCollaborator lifecycle
CREATE TYPE "InvitationStatus" AS ENUM ('Pending', 'Accepted', 'Rejected', 'Cancelled');

-- AlterTable: Extend project_collaborators with explicit lifecycle state & audit columns
ALTER TABLE "project_collaborators"
ADD COLUMN "invitedById" TEXT,
ADD COLUMN "status" "InvitationStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- Data Backfill: Preserve existing accepted collaborator records cleanly
UPDATE "project_collaborators"
SET "status" = 'Accepted'
WHERE "acceptedAt" IS NOT NULL;

-- AddCheckConstraint: Enforce mathematical equivalence between status and lifecycle timestamps
-- Guarantees Pending / Rejected / Cancelled rows can NEVER carry acceptedAt IS NOT NULL,
-- and Accepted rows MUST carry acceptedAt IS NOT NULL.
ALTER TABLE "project_collaborators"
ADD CONSTRAINT "project_collaborators_status_timestamps_check"
CHECK (
    ("status" = 'Accepted' AND "acceptedAt" IS NOT NULL AND "rejectedAt" IS NULL AND "cancelledAt" IS NULL)
    OR ("status" = 'Rejected' AND "rejectedAt" IS NOT NULL AND "acceptedAt" IS NULL)
    OR ("status" = 'Cancelled' AND "cancelledAt" IS NOT NULL AND "acceptedAt" IS NULL)
    OR ("status" = 'Pending' AND "acceptedAt" IS NULL AND "rejectedAt" IS NULL AND "cancelledAt" IS NULL)
);

-- CreateIndex: Efficient lookup indexes for incoming/outgoing invitee dashboards and project member queries
CREATE INDEX "project_collaborators_userId_status_idx" ON "project_collaborators"("userId", "status");
CREATE INDEX "project_collaborators_projectId_status_idx" ON "project_collaborators"("projectId", "status");

-- AddForeignKey: invitedById -> users(id) ON DELETE SET NULL (preserves membership if inviter account is removed)
ALTER TABLE "project_collaborators"
ADD CONSTRAINT "project_collaborators_invitedById_fkey"
FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
