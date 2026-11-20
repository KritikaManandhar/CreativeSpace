-- Rollback: Drop the partial unique index enforcing single FINAL version per project
DROP INDEX IF EXISTS "versions_unique_final_per_project";
