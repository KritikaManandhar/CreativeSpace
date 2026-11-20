import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { InviteCollaboratorSchema } from "@/lib/validations/collaboration";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { InvitationStatus, NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

// GET /api/projects/[id]/collaborators - List collaborators (and pending invitations for Owner)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Check permission to view project
    const { role } = await authorize(user, projectId, "view_project");
    const isOwner = role === "Owner";

    const { searchParams } = new URL(req.url);
    const includeHistory = searchParams.get("includeHistory") === "true";

    // Owner sees accepted collaborators + pending invitations (or full history when requested);
    // Non-owners ONLY see accepted members.
    const whereClause = isOwner
      ? includeHistory
        ? { projectId }
        : {
            projectId,
            status: { in: [InvitationStatus.Accepted, InvitationStatus.Pending] },
          }
      : {
          projectId,
          status: InvitationStatus.Accepted,
          acceptedAt: { not: null },
        };

    const collaborators = await prisma.projectCollaborator.findMany({
      where: whereClause,
      include: {
        user: { select: SAFE_USER_SELECT },
        invitedBy: { select: SAFE_USER_SELECT },
      },
      orderBy: { invitedAt: "asc" },
    });

    const response = apiSuccess(collaborators);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects/[id]/collaborators - Invite a collaborator/reviewer (Owner only)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Only Project Owner can invite collaborators
    const { project } = await authorize(user, projectId, "invite_collaborator");

    const body = await req.json();
    const { userIdentifier, role } = InviteCollaboratorSchema.parse(body);

    const identifier = userIdentifier.toLowerCase().trim();

    // Find the invited user by email or username
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return apiError(
        "NOT_FOUND",
        `No user found with email or username "${userIdentifier}". Make sure they have registered on CreativeSpace.`,
        404
      );
    }

    if (targetUser.id === user?.id || targetUser.id === project.creatorId) {
      return apiError(
        "BAD_REQUEST",
        "The project owner cannot be invited as a collaborator",
        400
      );
    }

    // Transaction: Lock Project (Level 1) -> ProjectCollaborator (Level 2) + synchronous Notification
    const result = await prisma.$transaction(async (tx) => {
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
        } catch {
          // Mock compatibility
        }
      }

      const existing = await tx.projectCollaborator.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUser.id,
          },
        },
      });

      if (existing) {
        const effectiveStatus =
          existing.status ||
          (existing.acceptedAt ? InvitationStatus.Accepted : InvitationStatus.Pending);

        if (effectiveStatus === InvitationStatus.Accepted || existing.acceptedAt) {
          throw new AppError(
            "CONFLICT",
            `User @${targetUser.username} is already an accepted ${existing.role} on this project`,
            409
          );
        }

        if (effectiveStatus === InvitationStatus.Pending) {
          throw new AppError(
            "CONFLICT",
            `User @${targetUser.username} already has a pending invitation as ${existing.role} on this project`,
            409
          );
        }

        // Re-inviting after Rejected or Cancelled reuses the single canonical (projectId, userId) row
        const reopened = await tx.projectCollaborator.update({
          where: {
            projectId_userId: {
              projectId,
              userId: targetUser.id,
            },
          },
          data: {
            role,
            status: InvitationStatus.Pending,
            invitedById: user!.id,
            invitedAt: new Date(),
            acceptedAt: null,
            rejectedAt: null,
            cancelledAt: null,
          },
          include: {
            user: { select: SAFE_USER_SELECT },
            invitedBy: { select: SAFE_USER_SELECT },
          },
        });

        await tx.notification.create({
          data: {
            userId: targetUser.id,
            type: NotificationType.Invitation,
            relatedProjectId: projectId,
            relatedUserId: user!.id,
          },
        });

        return reopened;
      }

      const collaborator = await tx.projectCollaborator.create({
        data: {
          projectId,
          userId: targetUser.id,
          invitedById: user!.id,
          role,
          status: InvitationStatus.Pending,
          acceptedAt: null, // Membership is NEVER active until accepted
          rejectedAt: null,
          cancelledAt: null,
        },
        include: {
          user: { select: SAFE_USER_SELECT },
          invitedBy: { select: SAFE_USER_SELECT },
        },
      });

      await tx.notification.create({
        data: {
          userId: targetUser.id,
          type: NotificationType.Invitation,
          relatedProjectId: projectId,
          relatedUserId: user!.id,
        },
      });

      return collaborator;
    });

    return apiSuccess(result, 201);
  } catch (error: any) {
    if (error?.code === "P2002" || error?.code === "23505") {
      return apiError(
        "CONFLICT",
        "An invitation or membership record already exists for this user on this project",
        409
      );
    }
    return handleApiError(error);
  }
}
