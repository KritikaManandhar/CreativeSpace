-- Guard: Verify zero duplicate Asset.storagePath rows exist before creating the unique index.
-- Existing Asset records are NEVER silently deleted or overwritten.
DO $$
DECLARE
    dup_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dup_count
    FROM (
        SELECT "storagePath"
        FROM "assets"
        GROUP BY "storagePath"
        HAVING COUNT(*) > 1
    ) dup;

    IF dup_count > 0 THEN
        RAISE EXCEPTION 'Cannot enforce unique Asset.storagePath: % duplicate storagePath group(s) exist in "assets". Resolve duplicates manually before applying this migration.', dup_count;
    END IF;
END $$;

-- CreateIndex: Database-level uniqueness on Asset.storagePath (matches Prisma @unique)
CREATE UNIQUE INDEX IF NOT EXISTS "assets_storagePath_key" ON "assets"("storagePath");
