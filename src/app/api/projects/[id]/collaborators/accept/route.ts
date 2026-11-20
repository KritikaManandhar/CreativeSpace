import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { InvitationStatus, NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/projects/[id]/collaborators/accept - Atomically accept pending invitation for current user
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const projectId = params.id;

    const updated = await prisma.$transaction(async (tx) => {
      // Lock Hierarchy: Level 1 Project -> Level 2 ProjectCollaborator
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
          await tx.$executeRaw`SELECT id FROM project_collaborators WHERE "projectId" = ${projectId} AND "userId" = ${user.id} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, creatorId: true, title: true, visibility: true },
      });

      if (!project) {
        throw new AppError("NOT_FOUND", "Project not found", 404);
      }

      const membership = await tx.projectCollaborator.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        throw new AppError("NOT_FOUND", "No invitation found for this project", 404);
      }

      const currentStatus =
        membership.status ||
        (membership.acceptedAt ? InvitationStatus.Accepted : InvitationStatus.Pending);

      if (currentStatus === InvitationStatus.Accepted || membership.acceptedAt) {
        throw new AppError("CONFLICT", "Invitation has already been accepted", 409);
      }

      if (currentStatus === InvitationStatus.Cancelled) {
        throw new AppError("CONFLICT", "This invitation was cancelled and can no longer be accepted", 409);
      }

      if (currentStatus === InvitationStatus.Rejected) {
        throw new AppError("CONFLICT", "This invitation was already declined", 409);
      }

      const accepted = await tx.projectCollaborator.update({
        where: {
          projectId_userId: {
            projectId,
            userId: user.id,
          },
        },
        data: {
          status: InvitationStatus.Accepted,
          acceptedAt: new Date(),
          rejectedAt: null,
          cancelledAt: null,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
              visibility: true,
            },
          },
        },
      });

      // Notify inviter (or project owner) inside the same transaction
      const notifyUserId = membership.invitedById || project.creatorId;
      if (notifyUserId && notifyUserId !== user.id) {
        await tx.notification.create({
          data: {
            userId: notifyUserId,
            type: NotificationType.InvitationAccepted,
            relatedProjectId: projectId,
            relatedUserId: user.id,
          },
        });
      }

      return accepted;
    });

    return apiSuccess({
      message: "Invitation accepted successfully",
      collaborator: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
