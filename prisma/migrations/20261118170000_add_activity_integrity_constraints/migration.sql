-- 1. Reconcile ONLY Migration 11's historical backfilled VersionFinalized rows
--    (deterministically identified by id = 'act-ver-' || versionId) so actorId aligns
--    with Project.creatorId (matching runtime owner-only Final designation) without
--    ever overwriting runtime-generated UUID activity attribution.
UPDATE "activities" a
SET "actorId" = p."creatorId"
FROM "projects" p
WHERE a."projectId" = p."id"
  AND a."type" = 'VersionFinalized'
  AND a."versionId" IS NOT NULL
  AND a."id" = 'act-ver-' || a."versionId"
  AND a."actorId" <> p."creatorId";

-- 2. Normalize any pre-existing project/portfolio-scoped activities carrying a stray
--    versionId so valid rows are preserved and cannot violate activities_type_version_check.
UPDATE "activities"
SET "versionId" = NULL
WHERE "type" IN ('ProjectPublished', 'PortfolioPublished')
  AND "versionId" IS NOT NULL;

-- 3. Recover versionId for any pre-existing version-scoped activity missing versionId
--    ONLY when its dedupKey strictly matches '<ActivityType>:<versionId>' for an
--    existing version belonging to the exact same project (prevents cross-project mismatch).
UPDATE "activities" a
SET "versionId" = v."id"
FROM "versions" v
WHERE a."type" IN ('VersionPublished', 'VersionFinalized')
  AND a."versionId" IS NULL
  AND v."projectId" = a."projectId"
  AND length(v."id") > 0
  AND a."dedupKey" = a."type"::TEXT || ':' || v."id";

-- 4. Remove only unrecoverable corrupted version-scoped rows that still lack versionId
--    so adding the CHECK constraint is guaranteed safe on databases with existing data.
DELETE FROM "activities"
WHERE "type" IN ('VersionPublished', 'VersionFinalized')
  AND "versionId" IS NULL;

-- 5. AddCheckConstraint (idempotent for safe retry after interrupted execution):
--    Guarantee version-scoped activities always carry a versionId and
--    project/portfolio-scoped activities never carry a stray versionId.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'activities_type_version_check'
          AND conrelid = '"activities"'::regclass
    ) THEN
        ALTER TABLE "activities"
        ADD CONSTRAINT "activities_type_version_check"
        CHECK (
            ("type" IN ('VersionPublished', 'VersionFinalized') AND "versionId" IS NOT NULL)
            OR ("type" IN ('ProjectPublished', 'PortfolioPublished') AND "versionId" IS NULL)
        );
    END IF;
END $$;
