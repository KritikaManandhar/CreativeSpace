-- Rollback script for 20261118170000_add_activity_integrity_constraints
-- Drops the CHECK constraint safely without deleting any activity records.
ALTER TABLE "activities" DROP CONSTRAINT IF EXISTS "activities_type_version_check";
