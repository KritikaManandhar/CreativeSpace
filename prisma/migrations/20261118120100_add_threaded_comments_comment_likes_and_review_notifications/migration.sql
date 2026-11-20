-- AlterTable: Add nullable parentId and safe defaulted updatedAt to comments
-- Preserves all existing comments intact as top-level root comments (parentId IS NULL).
ALTER TABLE "comments"
ADD COLUMN "parentId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddCheckConstraint: Prevent a comment from referencing itself as its own parent
ALTER TABLE "comments"
ADD CONSTRAINT "comments_no_self_parent_check"
CHECK ("parentId" IS NULL OR "parentId" <> "id");

-- CreateTable: comment_likes (1-like-per-user-per-comment enforced at DB level)
CREATE TABLE "comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add optional version and comment links to notifications
-- Uses ON DELETE SET NULL so deleting a version or comment preserves notification history
-- and never breaks notification API queries.
ALTER TABLE "notifications"
ADD COLUMN "relatedVersionId" TEXT,
ADD COLUMN "relatedCommentId" TEXT;

-- CreateIndex: Threading and scope-filtering indexes on comments
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");
CREATE INDEX "comments_projectId_versionId_parentId_idx" ON "comments"("projectId", "versionId", "parentId");

-- CreateIndex: Uniqueness and lookup indexes on comment_likes
CREATE UNIQUE INDEX "comment_likes_userId_commentId_key" ON "comment_likes"("userId", "commentId");
CREATE INDEX "comment_likes_commentId_idx" ON "comment_likes"("commentId");
CREATE INDEX "comment_likes_userId_idx" ON "comment_likes"("userId");

-- CreateIndex: Notification reference lookup indexes
CREATE INDEX "notifications_relatedVersionId_idx" ON "notifications"("relatedVersionId");
CREATE INDEX "notifications_relatedCommentId_idx" ON "notifications"("relatedCommentId");

-- AddForeignKey: Self-referential comment reply relation with ON DELETE RESTRICT
-- Prevents silently orphaning or reclassifying replies when a parent comment is deleted.
ALTER TABLE "comments"
ADD CONSTRAINT "comments_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: comment_likes -> comments & users
ALTER TABLE "comment_likes"
ADD CONSTRAINT "comment_likes_commentId_fkey"
FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_likes"
ADD CONSTRAINT "comment_likes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: notifications -> versions & comments (ON DELETE SET NULL)
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_relatedVersionId_fkey"
FOREIGN KEY ("relatedVersionId") REFERENCES "versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_relatedCommentId_fkey"
FOREIGN KEY ("relatedCommentId") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
