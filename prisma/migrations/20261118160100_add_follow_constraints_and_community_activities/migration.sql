-- CreateEnum: Meaningful community activity types
CREATE TYPE "ActivityType" AS ENUM (
    'ProjectPublished',
    'VersionPublished',
    'VersionFinalized',
    'PortfolioPublished'
);

-- Clean up any invalid legacy self-follow rows if present before adding CHECK constraint
DELETE FROM "follows" WHERE "followerId" = "followingId";

-- AddCheckConstraint: Prevent self-following at the PostgreSQL database level
ALTER TABLE "follows"
ADD CONSTRAINT "follows_no_self_follow_check"
CHECK ("followerId" <> "followingId");

-- CreateIndex: Efficient cursor/paginated follower and following list queries
CREATE INDEX "follows_followingId_createdAt_idx" ON "follows"("followingId", "createdAt");
CREATE INDEX "follows_followerId_createdAt_idx" ON "follows"("followerId", "createdAt");

-- CreateTable: activities (lightweight, reference-only community activity records)
-- Stores NO copied private content; live project & version visibility is enforced on every feed query.
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionId" TEXT,
    "dedupKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Deduplication and keyset-cursor pagination indexes
CREATE UNIQUE INDEX "activities_dedupKey_key" ON "activities"("dedupKey");
CREATE INDEX "activities_createdAt_id_idx" ON "activities"("createdAt", "id");
CREATE INDEX "activities_actorId_createdAt_id_idx" ON "activities"("actorId", "createdAt", "id");
CREATE INDEX "activities_projectId_idx" ON "activities"("projectId");
CREATE INDEX "activities_versionId_idx" ON "activities"("versionId");

-- AddForeignKey: Cascade clean-up when actor, project, or version is deleted
ALTER TABLE "activities"
ADD CONSTRAINT "activities_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activities"
ADD CONSTRAINT "activities_versionId_fkey"
FOREIGN KEY ("versionId") REFERENCES "versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Safe Idempotent Backfill: Seed community activities for existing Public projects and published/final versions
INSERT INTO "activities" ("id", "actorId", "type", "projectId", "versionId", "dedupKey", "createdAt")
SELECT
    'act-proj-' || p."id",
    p."creatorId",
    'ProjectPublished'::"ActivityType",
    p."id",
    NULL,
    'ProjectPublished:' || p."id",
    p."createdAt"
FROM "projects" p
WHERE p."visibility" = 'Public'
ON CONFLICT ("dedupKey") DO NOTHING;

INSERT INTO "activities" ("id", "actorId", "type", "projectId", "versionId", "dedupKey", "createdAt")
SELECT
    'act-ver-' || v."id",
    v."createdById",
    CASE WHEN v."status" = 'Final' THEN 'VersionFinalized'::"ActivityType" ELSE 'VersionPublished'::"ActivityType" END,
    v."projectId",
    v."id",
    (CASE WHEN v."status" = 'Final' THEN 'VersionFinalized:' ELSE 'VersionPublished:' END) || v."id",
    v."createdAt"
FROM "versions" v
INNER JOIN "projects" p ON p."id" = v."projectId"
WHERE p."visibility" = 'Public'
  AND v."status" IN ('Approved', 'Final')
ON CONFLICT ("dedupKey") DO NOTHING;
