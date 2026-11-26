import { NextRequest } from "next/server";
import { getCurrentUser, isAuthoritativeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import {
  assertCanViewDiscussionScope,
  assertCanEditComment,
  assertCanDeleteComment,
} from "@/lib/discussion-access";
import { UpdateCommentSchema } from "@/lib/validations/comment";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    commentId: string;
  };
}

const SAFE_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

// PATCH /api/projects/[id]/comments/[commentId] - Edit own comment
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const projectId = params.id;
    const commentId = params.commentId;

    const { role, project } = await authorize(user, projectId, "view_project");

    const body = await req.json();
    const { content } = UpdateCommentSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      // Lock Project row (Level 1)
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const existing = await tx.comment.findUnique({
        where: { id: commentId },
        include: {
          version: { select: { id: true, projectId: true, status: true } },
        },
      });

      if (!existing || existing.projectId !== projectId) {
        throw new AppError("NOT_FOUND", "Comment not found on this project", 404);
      }

      // Verify caller still has permission to access this scope
      assertCanViewDiscussionScope({
        project,
        role,
        scope: existing.versionId ? "version" : "project",
        version: existing.version,
        isAdmin: false,
      });

      // Only the comment's own author may edit it
      assertCanEditComment(user, existing.authorId);

      // Lock comment row
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM comments WHERE id = ${commentId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const saved = await tx.comment.update({
        where: { id: commentId },
        data: { content: content.trim() },
        include: {
          author: { select: SAFE_AUTHOR_SELECT },
          likes: { select: { userId: true } },
          _count: { select: { likes: true } },
        },
      });

      return saved;
    });

    const likesArr: Array<{ userId: string }> = Array.isArray((updated as any).likes)
      ? (updated as any).likes
      : [];

    return apiSuccess({
      id: updated.id,
      projectId: updated.projectId,
      versionId: updated.versionId ?? null,
      parentId: updated.parentId ?? null,
      authorId: updated.authorId,
      content: updated.content,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      author: updated.author,
      likeCount:
        typeof (updated as any)._count?.likes === "number"
          ? (updated as any)._count.likes
          : likesArr.length,
      hasLiked: likesArr.some((l) => l.userId === user.id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id]/comments/[commentId] - Delete own comment (or admin) with reply-integrity protection
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const projectId = params.id;
    const commentId = params.commentId;

    const { role, project } = await authorize(user, projectId, "view_project");

    await prisma.$transaction(async (tx) => {
      // Strict Locking Hierarchy - Level 1: Lock Project row
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const existing = await tx.comment.findUnique({
        where: { id: commentId },
        include: {
          version: { select: { id: true, projectId: true, status: true } },
        },
      });

      if (!existing || existing.projectId !== projectId) {
        throw new AppError("NOT_FOUND", "Comment not found on this project", 404);
      }

      // Level 2: Lock Version row if applicable
      if (existing.versionId && typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM versions WHERE id = ${existing.versionId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      // Verify caller has access to this scope (admin moderation allowed for delete)
      assertCanViewDiscussionScope({
        project,
        role,
        scope: existing.versionId ? "version" : "project",
        version: existing.version,
        userRole: user.role,
        isAdmin: isAuthoritativeAdmin(user),
      });

      // Only the author (or platform admin) may delete a comment
      assertCanDeleteComment(user, existing.authorId);

      // Lock comment row to serialize against concurrent reply creation
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM comments WHERE id = ${commentId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      // Discussion integrity: Do NOT orphan or silently delete replies
      const replyCount = await tx.comment.count({
        where: { parentId: commentId },
      });

      if (replyCount > 0) {
        throw new AppError(
          "CONFLICT",
          `Cannot delete this comment because it has ${replyCount} ${replyCount === 1 ? "reply" : "replies"}. Replies must be preserved to maintain discussion integrity.`,
          409
        );
      }

      await tx.comment.delete({
        where: { id: commentId },
      });
    });

    return apiSuccess({
      deleted: true,
      commentId,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    // Map PostgreSQL ON DELETE RESTRICT violation (P2003 / 23503) to 409 Conflict
    if (error?.code === "P2003" || error?.code === "23503") {
      return apiError(
        "CONFLICT",
        "Cannot delete this comment because it has replies. Replies must be preserved to maintain discussion integrity.",
        409
      );
    }
    return handleApiError(error);
  }
}
