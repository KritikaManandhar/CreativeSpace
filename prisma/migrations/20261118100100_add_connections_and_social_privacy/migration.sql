-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('Pending', 'Accepted', 'Rejected');

-- CreateEnum
CREATE TYPE "SocialPrivacy" AS ENUM ('Public', 'ConnectionsOnly', 'Private');

-- AlterTable: Add socialPrivacy to users with backward-compatible default 'Public'
-- Existing users and socialLinks JSON payloads are preserved intact.
ALTER TABLE "users"
ADD COLUMN "socialPrivacy" "SocialPrivacy" NOT NULL DEFAULT 'Public';

-- CreateTable: connections (peer creator connections)
CREATE TABLE "connections" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "pairKey" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "connections_no_self_connection_check" CHECK ("requesterId" <> "receiverId"),
    CONSTRAINT "connections_pair_key_canonical_check" CHECK (
        "pairKey" = LEAST("requesterId", "receiverId") || ':' || GREATEST("requesterId", "receiverId")
    ),
    CONSTRAINT "connections_status_timestamps_check" CHECK (
        ("status" = 'Accepted' AND "acceptedAt" IS NOT NULL AND "rejectedAt" IS NULL)
        OR ("status" = 'Rejected' AND "rejectedAt" IS NOT NULL AND "acceptedAt" IS NULL)
        OR ("status" = 'Pending' AND "acceptedAt" IS NULL AND "rejectedAt" IS NULL)
    )
);

-- AlterTable: Add optional actor and connection links to notifications
ALTER TABLE "notifications"
ADD COLUMN "relatedUserId" TEXT,
ADD COLUMN "relatedConnectionId" TEXT;

-- CreateIndex: Prisma unique index on canonical pairKey
CREATE UNIQUE INDEX "connections_pairKey_key" ON "connections"("pairKey");

-- CreateIndex: PostgreSQL functional unique index enforcing unordered-pair uniqueness
-- Prevents duplicate records between two users regardless of request direction (A->B vs B->A)
CREATE UNIQUE INDEX "connections_unordered_pair_unique_idx"
ON "connections" (LEAST("requesterId", "receiverId"), GREATEST("requesterId", "receiverId"));

-- CreateIndex: Query indexes for incoming requests, outgoing requests, and accepted connections
CREATE INDEX "connections_receiverId_status_idx" ON "connections"("receiverId", "status");
CREATE INDEX "connections_requesterId_status_idx" ON "connections"("requesterId", "status");
CREATE INDEX "connections_status_idx" ON "connections"("status");
CREATE INDEX "notifications_relatedConnectionId_idx" ON "notifications"("relatedConnectionId");

-- AddForeignKey
ALTER TABLE "connections"
ADD CONSTRAINT "connections_requesterId_fkey"
FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connections"
ADD CONSTRAINT "connections_receiverId_fkey"
FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_relatedUserId_fkey"
FOREIGN KEY ("relatedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_relatedConnectionId_fkey"
FOREIGN KEY ("relatedConnectionId") REFERENCES "connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
