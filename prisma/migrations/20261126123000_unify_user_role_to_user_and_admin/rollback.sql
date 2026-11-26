-- Rollback script for 20261126123000_unify_user_role_to_user_and_admin
-- LIMITATION: Collapsing CREATOR and VIEWER into USER is lossy for distinguishing historical
-- CREATOR vs VIEWER values. Rolling back maps all USER and ADMIN accounts to CREATOR while
-- preserving isAdmin = true for ADMIN rows. To restore exact legacy VIEWER rows if any ever
-- existed, restore from the pre-migration logical backup.

CREATE TYPE "UserRole_legacy" AS ENUM ('CREATOR', 'VIEWER');

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_legacy"
  USING ('CREATOR'::"UserRole_legacy");

UPDATE "users"
SET "isAdmin" = false
WHERE "isAdmin" IS NULL;

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CREATOR'::"UserRole_legacy";

DROP TYPE "UserRole";
ALTER TYPE "UserRole_legacy" RENAME TO "UserRole";
