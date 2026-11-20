import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import {
  CollaboratorLifecycleActionSchema,
  UpdateCollaboratorRoleSchema,
} from "@/lib/validations/collaboration";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import {
  CollaboratorRole,
  InvitationStatus,
  NotificationType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
    userId: string;
  };
}

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

function resolveStatus(record: {
  status?: InvitationStatus | null;
  acceptedAt: Date | null;
}): InvitationStatus {
  if (record.status) return record.status;
  return record.acceptedAt ? InvitationStatus.Accepted : InvitationStatus.Pending;
}

// PATCH /api/projects/[id]/collaborators/[userId]
// Supports:
//  - { action: "accept" }  (intended invitee only, Pending -> Accepted)
//  - { action: "reject" }  (intended invitee only, Pending -> Rejected)
//  - { action: "cancel" }  (project owner only, Pending -> Cancelled; NEVER removes Accepted)
//  - { role: "Collaborator" | "ClientReviewer" } (project owner only; blocks Owner escalation)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const projectId = params.id;
    const targetUserId = params.userId;
    const body = await req.json();

    // Normalize legacy { accept: true } payload into action="accept"
    const rawAction =
      body?.action !== undefined
        ? body.action
        : body?.accept === true
          ? "accept"
          : undefined;

    // 1. Invitation Lifecycle Actions: accept | reject | cancel
    if (rawAction !== undefined) {
      const { action } = CollaboratorLifecycleActionSchema.parse({
        action: rawAction,
      });

      const updated = await prisma.$transaction(async (tx) => {
        // Strict Lock Order: Level 1 Project -> Level 2 ProjectCollaborator
        if (typeof (tx as any).$executeRaw === "function") {
          try {
            await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
            await tx.$executeRaw`SELECT id FROM project_collaborators WHERE "projectId" = ${projectId} AND "userId" = ${targetUserId} FOR UPDATE`;
          } catch {
            // Mock compatibility
          }
        }

        const project = await tx.project.findUnique({
          where: { id: projectId },
          select: { id: true, creatorId: true, title: true },
        });

        if (!project) {
          throw new AppError("NOT_FOUND", "Project not found", 404);
        }

        // Authorization before exposing row existence where possible
        if (action === "accept" || action === "reject") {
          if (user.id !== targetUserId) {
            throw new AppError(
              "FORBIDDEN",
              `Only the intended invitee can ${action} this project invitation`,
              403
            );
          }
        } else if (action === "cancel") {
          if (project.creatorId !== user.id) {
            throw new AppError(
              "FORBIDDEN",
              "Only the project owner can cancel pending invitations",
              403
            );
          }
        }

        const existing = await tx.projectCollaborator.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId: targetUserId,
            },
          },
        });

        if (!existing) {
          throw new AppError("NOT_FOUND", "Invitation not found", 404);
        }

        const currentStatus = resolveStatus(existing);

        if (currentStatus !== InvitationStatus.Pending) {
          if (action === "cancel" && currentStatus === InvitationStatus.Accepted) {
            throw new AppError(
              "CONFLICT",
              "Cannot cancel invitation because it has already been accepted. Remove the collaborator explicitly instead.",
              409
            );
          }
          throw new AppError(
            "CONFLICT",
            `Invitation is already ${currentStatus.toLowerCase()} and cannot be ${action === "accept" ? "accepted" : action === "reject" ? "rejected" : "cancelled"}`,
            409
          );
        }

        const now = new Date();

        if (action === "accept") {
          const accepted = await tx.projectCollaborator.update({
            where: {
              projectId_userId: { projectId, userId: targetUserId },
            },
            data: {
              status: InvitationStatus.Accepted,
              acceptedAt: now,
              rejectedAt: null,
              cancelledAt: null,
            },
            include: {
              user: { select: SAFE_USER_SELECT },
              invitedBy: { select: SAFE_USER_SELECT },
            },
          });

          const notifyTarget = existing.invitedById || project.creatorId;
          if (notifyTarget && notifyTarget !== user.id) {
            await tx.notification.create({
              data: {
                userId: notifyTarget,
                type: NotificationType.InvitationAccepted,
                relatedProjectId: projectId,
                relatedUserId: user.id,
              },
            });
          }

          return accepted;
        }

        if (action === "reject") {
          const rejected = await tx.projectCollaborator.update({
            where: {
              projectId_userId: { projectId, userId: targetUserId },
            },
            data: {
              status: InvitationStatus.Rejected,
              rejectedAt: now,
              acceptedAt: null,
              cancelledAt: null,
            },
            include: {
              user: { select: SAFE_USER_SELECT },
              invitedBy: { select: SAFE_USER_SELECT },
            },
          });

          const notifyTarget = existing.invitedById || project.creatorId;
          if (notifyTarget && notifyTarget !== user.id) {
            await tx.notification.create({
              data: {
                userId: notifyTarget,
                type: NotificationType.InvitationRejected,
                relatedProjectId: projectId,
                relatedUserId: user.id,
              },
            });
          }

          return rejected;
        }

        // action === "cancel"
        const cancelled = await tx.projectCollaborator.update({
          where: {
            projectId_userId: { projectId, userId: targetUserId },
          },
          data: {
            status: InvitationStatus.Cancelled,
            cancelledAt: now,
            acceptedAt: null,
            rejectedAt: null,
          },
          include: {
            user: { select: SAFE_USER_SELECT },
            invitedBy: { select: SAFE_USER_SELECT },
          },
        });

        if (targetUserId !== user.id) {
          await tx.notification.create({
            data: {
              userId: targetUserId,
              type: NotificationType.InvitationCancelled,
              relatedProjectId: projectId,
              relatedUserId: user.id,
            },
          });
        }

        return cancelled;
      });

      return apiSuccess(updated);
    }

    // 2. Collaborator Role Change (Owner only)
    const { project } = await authorize(user, projectId, "manage_collaborator");

    if (targetUserId === project.creatorId) {
      return apiError(
        "BAD_REQUEST",
        "The project owner's role cannot be modified via this endpoint",
        400
      );
    }

    const { role } = UpdateCollaboratorRoleSchema.parse(body);

    if (role === CollaboratorRole.Owner) {
      return apiError(
        "BAD_REQUEST",
        "Cannot promote to Owner via this endpoint. Project ownership is governed by Project.creatorId.",
        400
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
          await tx.$executeRaw`SELECT id FROM project_collaborators WHERE "projectId" = ${projectId} AND "userId" = ${targetUserId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const existing = await tx.projectCollaborator.findUnique({
        where: {
          projectId_userId: { projectId, userId: targetUserId },
        },
      });

      if (!existing) {
        throw new AppError("NOT_FOUND", "Collaborator record not found", 404);
      }

      const currentStatus = resolveStatus(existing);
      if (
        currentStatus !== InvitationStatus.Accepted &&
        currentStatus !== InvitationStatus.Pending
      ) {
        throw new AppError(
          "CONFLICT",
          `Cannot change role for a ${currentStatus.toLowerCase()} invitation`,
          409
        );
      }

      return tx.projectCollaborator.update({
        where: {
          projectId_userId: { projectId, userId: targetUserId },
        },
        data: { role },
        include: {
          user: { select: SAFE_USER_SELECT },
          invitedBy: { select: SAFE_USER_SELECT },
        },
      });
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id]/collaborators/[userId]
// Removes an accepted collaborator (Owner or self-leave), or cancels/declines a pending invitation.
// Protects Project Owner from removal and guards ?intent=cancel against removing Accepted collaborators.
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const projectId = params.id;
    const targetUserId = params.userId;
    const intent = new URL(req.url).searchParams.get("intent");

    const result = await prisma.$transaction(async (tx) => {
      // Strict Lock Order: Level 1 Project -> Level 2 ProjectCollaborator
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
          await tx.$executeRaw`SELECT id FROM project_collaborators WHERE "projectId" = ${projectId} AND "userId" = ${targetUserId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const project = await tx.project.findUnique({
        where: { id: projectId },
        select: { id: true, creatorId: true },
      });

      if (!project) {
        throw new AppError("NOT_FOUND", "Project not found", 404);
      }

      // Owner removal protection
      if (targetUserId === project.creatorId) {
        throw new AppError(
          "BAD_REQUEST",
          "The project owner cannot be removed from the project",
          400
        );
      }

      const isOwner = project.creatorId === user.id;
      const isSelfLeaving = user.id === targetUserId;

      if (intent === "cancel" && !isOwner) {
        throw new AppError(
          "FORBIDDEN",
          "Only the project owner can cancel pending invitations",
          403
        );
      }

      if (!isOwner && !isSelfLeaving) {
        throw new AppError(
          "FORBIDDEN",
          "Only project owners or the collaborator themselves can perform this action",
          403
        );
      }

      const existing = await tx.projectCollaborator.findUnique({
        where: {
          projectId_userId: { projectId, userId: targetUserId },
        },
      });

      if (!existing) {
        throw new AppError("NOT_FOUND", "Collaborator record not found", 404);
      }

      const currentStatus = resolveStatus(existing);

      // Explicit cancel intent must NEVER remove an already accepted collaborator
      if (intent === "cancel") {
        if (currentStatus !== InvitationStatus.Pending) {
          throw new AppError(
            "CONFLICT",
            currentStatus === InvitationStatus.Accepted
              ? "Cannot cancel invitation because it has already been accepted. Remove the collaborator explicitly instead."
              : `Invitation is already ${currentStatus.toLowerCase()}`,
            409
          );
        }

        await tx.projectCollaborator.update({
          where: { projectId_userId: { projectId, userId: targetUserId } },
          data: {
            status: InvitationStatus.Cancelled,
            cancelledAt: new Date(),
            acceptedAt: null,
            rejectedAt: null,
          },
        });

        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: NotificationType.InvitationCancelled,
            relatedProjectId: projectId,
            relatedUserId: user.id,
          },
        });

        return {
          action: "cancelled" as const,
          message: "Pending invitation cancelled successfully",
        };
      }

      if (currentStatus === InvitationStatus.Pending) {
        if (isOwner) {
          await tx.projectCollaborator.update({
            where: { projectId_userId: { projectId, userId: targetUserId } },
            data: {
              status: InvitationStatus.Cancelled,
              cancelledAt: new Date(),
              acceptedAt: null,
              rejectedAt: null,
            },
          });

          await tx.notification.create({
            data: {
              userId: targetUserId,
              type: NotificationType.InvitationCancelled,
              relatedProjectId: projectId,
              relatedUserId: user.id,
            },
          });

          return {
            action: "cancelled" as const,
            message: "Pending invitation cancelled successfully",
          };
        }

        // Self declining a pending invitation
        await tx.projectCollaborator.update({
          where: { projectId_userId: { projectId, userId: targetUserId } },
          data: {
            status: InvitationStatus.Rejected,
            rejectedAt: new Date(),
            acceptedAt: null,
            cancelledAt: null,
          },
        });

        const notifyTarget = existing.invitedById || project.creatorId;
        if (notifyTarget && notifyTarget !== user.id) {
          await tx.notification.create({
            data: {
              userId: notifyTarget,
              type: NotificationType.InvitationRejected,
              relatedProjectId: projectId,
              relatedUserId: user.id,
            },
          });
        }

        return {
          action: "rejected" as const,
          message: "Invitation declined successfully",
        };
      }

      if (currentStatus === InvitationStatus.Accepted) {
        await tx.projectCollaborator.delete({
          where: { projectId_userId: { projectId, userId: targetUserId } },
        });

        if (isOwner && !isSelfLeaving) {
          await tx.notification.create({
            data: {
              userId: targetUserId,
              type: NotificationType.CollaboratorRemoved,
              relatedProjectId: projectId,
              relatedUserId: user.id,
            },
          });
        }

        return {
          action: isSelfLeaving ? ("left" as const) : ("removed" as const),
          message: isSelfLeaving
            ? "You have left the project workspace"
            : "Collaborator removed successfully",
        };
      }

      throw new AppError(
        "CONFLICT",
        `Invitation is already ${currentStatus.toLowerCase()}`,
        409
      );
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
