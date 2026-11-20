-- CreateEnum: Lifecycle states for atomic upload registration & orphan cleanup fencing
CREATE TYPE "UploadIntentStatus" AS ENUM (
    'Pending',
    'Registered',
    'CleaningUp',
    'CleanedUp'
);

-- CreateTable: upload_intents (coordinates single-use upload registration & race-free orphan cleanup)
CREATE TABLE "upload_intents" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "status" "UploadIntentStatus" NOT NULL DEFAULT 'Pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_intents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "upload_intents_file_size_positive_check" CHECK ("fileSize" > 0)
);

-- CreateIndex: Enforce unique storagePath per upload intent + efficient lookup/sweep indexes
CREATE UNIQUE INDEX "upload_intents_storagePath_key" ON "upload_intents"("storagePath");
CREATE INDEX "upload_intents_projectId_status_idx" ON "upload_intents"("projectId", "status");
CREATE INDEX "upload_intents_uploaderId_status_idx" ON "upload_intents"("uploaderId", "status");
CREATE INDEX "upload_intents_status_expiresAt_idx" ON "upload_intents"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "upload_intents"
ADD CONSTRAINT "upload_intents_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "upload_intents"
ADD CONSTRAINT "upload_intents_uploaderId_fkey"
FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
