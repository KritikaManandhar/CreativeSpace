-- Rollback script for 20261118190000_add_upload_intents
-- Safely drops upload_intents table and UploadIntentStatus enum without modifying existing Asset records.
DROP TABLE IF EXISTS "upload_intents";
DROP TYPE IF EXISTS "UploadIntentStatus";
