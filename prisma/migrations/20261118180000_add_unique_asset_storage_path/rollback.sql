-- Rollback script for 20261118180000_add_unique_asset_storage_path
-- Drops the unique index on assets."storagePath" safely without deleting any Asset records.
DROP INDEX IF EXISTS "assets_storagePath_key";
