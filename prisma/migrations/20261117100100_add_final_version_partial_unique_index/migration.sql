-- CreateIndex: Enforce exactly one FINAL version per project at PostgreSQL level
-- Because 'Final' was committed in the preceding migration, referencing it here
-- is 100% safe and complies with PostgreSQL's enum commit requirements.
CREATE UNIQUE INDEX IF NOT EXISTS "versions_unique_final_per_project" 
ON "versions" ("projectId") 
WHERE "status" = 'Final';
