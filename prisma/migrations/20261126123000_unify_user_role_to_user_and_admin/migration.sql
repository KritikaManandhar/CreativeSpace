-- Migration: Unify UserRole from ('CREATOR', 'VIEWER') to ('USER', 'ADMIN')
-- Preserves all existing accounts, projects, portfolios, assets, comments, collaborations, and bookings.
-- Prepared only: DO NOT execute until logical backup verification is complete and migration is approved.

-- 1. Create replacement enum with unified account model
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');

-- 2. Drop legacy default prior to altering column type
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- 3. Convert existing rows safely:
--    - Accounts with isAdmin = true become ADMIN
--    - All other accounts (legacy CREATOR or VIEWER with isAdmin = false) become USER
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "isAdmin" = true THEN 'ADMIN'::"UserRole_new"
      ELSE 'USER'::"UserRole_new"
    END
  );

-- 4. Synchronize temporary compatibility column isAdmin with authoritative role
UPDATE "users"
SET "isAdmin" = ("role" = 'ADMIN'::"UserRole_new")
WHERE "isAdmin" IS DISTINCT FROM ("role" = 'ADMIN'::"UserRole_new");

-- 5. Set new default role to USER
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole_new";

-- 6. Drop legacy enum and rename replacement enum to UserRole
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
