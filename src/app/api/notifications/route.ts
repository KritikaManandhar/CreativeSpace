import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import {
  InvitationStatus,
  NotificationType,
  VersionStatus,
  Visibility,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/notifications - List notifications for authenticated user with private project payload protection
export async function GET(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const [rawNotifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.id },
        include: {
          relatedProject: {
            select: {
              id: true,
              title: true,
              category: true,
              visibility: true,
              creatorId: true,
              collaborators: {
                where: { userId: user.id },
                select: { acceptedAt: true, status: true },
              },
            },
          },
          relatedUser: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          relatedConnection: {
            select: {
              id: true,
              status: true,
              requesterId: true,
              receiverId: true,
            },
          },
          relatedVersion: {
            select: {
              id: true,
              projectId: true,
              versionNumber: true,
              status: true,
            },
          },
          relatedComment: {
            select: {
              id: true,
              projectId: true,
              versionId: true,
              parentId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    // Sanitize notifications:
    // 1. Never expose private project titles/versions/comments to users who do not currently have access.
    // 2. Validate relatedVersion / relatedComment belong to relatedProject.
    // 3. Gracefully preserve notifications even if related records were deleted (null).
    const notifications = rawNotifications.map((n: any) => {
      const proj = n.relatedProject;
      let canSeeProject = false;
      let isAcceptedMember = false;

      if (proj) {
        const isCreator = proj.creatorId === user.id;
        const membership = Array.isArray(proj.collaborators) ? proj.collaborators[0] : null;
        const memberAccepted = Boolean(
          membership?.acceptedAt &&
            (!membership.status || membership.status === InvitationStatus.Accepted)
        );
        const memberPending = Boolean(
          membership &&
            !membership.acceptedAt &&
            (!membership.status || membership.status === InvitationStatus.Pending)
        );

        isAcceptedMember = isCreator || memberAccepted;
        const isPendingInviteeForInviteNotif =
          n.type === NotificationType.Invitation && memberPending;

        canSeeProject =
          proj.visibility === Visibility.Public ||
          isAcceptedMember ||
          isPendingInviteeForInviteNotif ||
          Boolean(user.isAdmin);
      }

      const safeProject =
        proj && canSeeProject
          ? {
              id: proj.id,
              title: proj.title,
              category: proj.category,
            }
          : null;

      // Validate relatedVersion belongs to the project and is visible to the user
      let safeVersion = null;
      if (
        n.relatedVersion &&
        safeProject &&
        n.relatedVersion.projectId === safeProject.id
      ) {
        const versionVisible =
          isAcceptedMember ||
          Boolean(user.isAdmin) ||
          n.relatedVersion.status !== VersionStatus.Rejected;
        if (versionVisible) {
          safeVersion = {
            id: n.relatedVersion.id,
            versionNumber: n.relatedVersion.versionNumber,
            status: n.relatedVersion.status,
          };
        }
      }

      // Validate relatedComment belongs to the project and respects internal project discussion visibility
      let safeComment = null;
      if (
        n.relatedComment &&
        safeProject &&
        n.relatedComment.projectId === safeProject.id
      ) {
        const isProjectDiscussion = n.relatedComment.versionId === null;
        const commentVisible =
          isAcceptedMember ||
          Boolean(user.isAdmin) ||
          (!isProjectDiscussion &&
            (!n.relatedVersion || n.relatedVersion.status !== VersionStatus.Rejected));
        if (commentVisible) {
          safeComment = {
            id: n.relatedComment.id,
            projectId: n.relatedComment.projectId,
            versionId: n.relatedComment.versionId,
            parentId: n.relatedComment.parentId,
          };
        }
      }

      return {
        id: n.id,
        userId: n.userId,
        type: n.type,
        relatedProjectId: safeProject ? n.relatedProjectId : null,
        relatedUserId: n.relatedUserId ?? null,
        relatedConnectionId: n.relatedConnectionId ?? null,
        relatedVersionId: safeVersion ? n.relatedVersionId : null,
        relatedCommentId: safeComment ? n.relatedCommentId : null,
        isRead: n.isRead,
        createdAt: n.createdAt,
        relatedProject: safeProject,
        relatedUser: n.relatedUser ?? null,
        relatedConnection: n.relatedConnection ?? null,
        relatedVersion: safeVersion,
        relatedComment: safeComment,
      };
    });

    const response = apiSuccess({
      notifications,
      unreadCount,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/notifications - Mark all notifications as read
export async function POST(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return apiSuccess({ message: "All notifications marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
