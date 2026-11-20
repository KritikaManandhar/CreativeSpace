import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { assertCanViewDiscussionScope } from "@/lib/discussion-access";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    commentId: string;
  };
}

// POST /api/projects/[id]/comments/[commentId]/like - Like a visible comment (once per user)
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required to like a comment", 401);
    }

    const projectId = params.id;
    const commentId = params.commentId;

    // Verify project view permission
    const { role, project } = await authorize(user, projectId, "view_project");

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        include: {
          version: { select: { id: true, projectId: true, status: true } },
        },
      });

      if (!comment || comment.projectId !== projectId) {
        throw new AppError("NOT_FOUND", "Comment not found on this project", 404);
      }

      // Enforce comment scope visibility (likes cannot bypass project discussion or restricted version visibility)
      assertCanViewDiscussionScope({
        project,
        role,
        scope: comment.versionId ? "version" : "project",
        version: comment.version,
        isAdmin: false,
      });

      const existing = await tx.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId,
          },
        },
      });

      if (existing) {
        throw new AppError("CONFLICT", "You have already liked this comment", 409);
      }

      // Create like FIRST so unique constraint (userId, commentId) guards against concurrent duplicates
      await tx.commentLike.create({
        data: {
          userId: user.id,
          commentId,
        },
      });

      // Notify comment author AFTER like succeeds, skipping self-likes and avoiding duplicate notifications
      if (comment.authorId !== user.id) {
        const existingNotif = await tx.notification.findFirst({
          where: {
            userId: comment.authorId,
            type: NotificationType.Like,
            relatedUserId: user.id,
            relatedCommentId: commentId,
          },
          select: { id: true },
        });

        if (!existingNotif) {
          await tx.notification.create({
            data: {
              userId: comment.authorId,
              type: NotificationType.Like,
              relatedProjectId: projectId,
              relatedVersionId: comment.versionId ?? null,
              relatedCommentId: commentId,
              relatedUserId: user.id,
            },
          });
        }
      }

      const likeCount = await tx.commentLike.count({ where: { commentId } });
      return { liked: true, likeCount };
    });

    return apiSuccess(result, 201);
  } catch (error: any) {
    if (error?.code === "P2002" || error?.code === "23505") {
      return apiError("CONFLICT", "You have already liked this comment", 409);
    }
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id]/comments/[commentId]/like - Unlike a visible comment
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required to unlike a comment", 401);
    }

    const projectId = params.id;
    const commentId = params.commentId;

    const { role, project } = await authorize(user, projectId, "view_project");

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        include: {
          version: { select: { id: true, projectId: true, status: true } },
        },
      });

      if (!comment || comment.projectId !== projectId) {
        throw new AppError("NOT_FOUND", "Comment not found on this project", 404);
      }

      assertCanViewDiscussionScope({
        project,
        role,
        scope: comment.versionId ? "version" : "project",
        version: comment.version,
        isAdmin: false,
      });

      await tx.commentLike.deleteMany({
        where: {
          userId: user.id,
          commentId,
        },
      });

      const likeCount = await tx.commentLike.count({ where: { commentId } });
      return { liked: false, likeCount };
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
