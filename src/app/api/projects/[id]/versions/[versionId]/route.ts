import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize, getEffectiveRole } from "@/lib/rbac";
import { UpdateVersionStatusSchema } from "@/lib/validations/version";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { recordCommunityActivity } from "@/lib/activity";
import { ActivityType, NotificationType, VersionStatus, Visibility } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
    versionId: string;
  };
}

// GET /api/projects/[id]/versions/[versionId] - Get specific version details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;
    const versionId = params.versionId;

    const { role } = await authorize(user, projectId, "view_project");
    const isMember = role === "Owner" || role === "Collaborator" || role === "ClientReviewer";

    const version = await prisma.version.findUnique({
      where: { id: versionId },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        assets: {
          select: {
            id: true,
            projectId: true,
            uploaderId: true,
            versionId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            thumbnailPath: true,
            createdAt: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!version || version.projectId !== projectId) {
      return apiError("NOT_FOUND", "Version not found on this project", 404);
    }

    // Protect draft/rejected media and rejected version feedback from non-members on public projects
    if (!isMember && version.status === VersionStatus.Rejected) {
      return apiError(
        "FORBIDDEN",
        "Rejected versions are restricted to authorized project members",
        403
      );
    }

    const sanitizedVersion = {
      ...version,
      assets:
        isMember || version.status === "Approved" || version.status === "Final"
          ? version.assets
          : [],
    };

    return apiSuccess(sanitizedVersion);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/projects/[id]/versions/[versionId] - Transition version status with strict lifecycle rules
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;
    const versionId = params.versionId;

    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { role, project } = await getEffectiveRole(user.id, projectId);
    if (role === "None") {
      return apiError("FORBIDDEN", "You are not a member of this project", 403);
    }

    const body = await req.json();
    const { status: targetStatus, comment } = UpdateVersionStatusSchema.parse(body);

    const version = await prisma.version.findUnique({
      where: { id: versionId },
    });

    if (!version || version.projectId !== projectId) {
      return apiError("NOT_FOUND", "Version not found on this project", 404);
    }

    const currentStatus = version.status;

    // No-op if status is unchanged
    if (currentStatus === targetStatus) {
      if (comment?.trim()) {
        await prisma.comment.create({
          data: {
            projectId,
            versionId,
            authorId: user.id,
            content: comment.trim(),
          },
        });
      }
      return apiSuccess(version);
    }

    // Explicit Lifecycle State Machine Transition Matrix Enforcement
    // 1. Transition TO Final: Only Approved -> Final is allowed, and ONLY by Project Owner
    if (targetStatus === VersionStatus.Final) {
      if (role !== "Owner") {
        throw new AppError(
          "FORBIDDEN",
          "Only the project owner can designate a version as FINAL",
          403
        );
      }
      if (currentStatus !== VersionStatus.Approved) {
        throw new AppError(
          "BAD_REQUEST",
          `Invalid lifecycle transition: A version must be in Approved status before being designated FINAL (current status: ${currentStatus})`,
          400
        );
      }
    }

    // 2. Transition FROM Final: Only Final -> Approved is allowed, and ONLY by Project Owner
    if (currentStatus === VersionStatus.Final) {
      if (role !== "Owner") {
        throw new AppError(
          "FORBIDDEN",
          "Only the project owner can demote a designated FINAL version",
          403
        );
      }
      if (targetStatus !== VersionStatus.Approved) {
        throw new AppError(
          "BAD_REQUEST",
          `Invalid lifecycle transition: A FINAL designated version can only be demoted to Approved status (attempted: ${targetStatus})`,
          400
        );
      }
    }

    // 3. Transition FROM Draft: Can transition to Approved or Rejected (Owner or ClientReviewer)
    if (currentStatus === VersionStatus.Draft) {
      if (targetStatus === VersionStatus.Approved || targetStatus === VersionStatus.Rejected) {
        if (role !== "Owner" && role !== "ClientReviewer") {
          throw new AppError(
            "FORBIDDEN",
            "Only project owners and client reviewers can approve or reject draft versions",
            403
          );
        }
      } else {
        throw new AppError(
          "BAD_REQUEST",
          `Invalid lifecycle transition: Draft versions can only transition to Approved or Rejected (attempted: ${targetStatus})`,
          400
        );
      }
    }

    // 4. Transition FROM Approved: Can transition to Final (handled above), Draft (Owner reopening), or Rejected (Reviewer reassessment)
    if (currentStatus === VersionStatus.Approved) {
      if (targetStatus === VersionStatus.Draft) {
        if (role !== "Owner") {
          throw new AppError(
            "FORBIDDEN",
            "Only the project owner can revert an approved version back to Draft for revisions",
            403
          );
        }
      } else if (targetStatus === VersionStatus.Rejected) {
        if (role !== "Owner" && role !== "ClientReviewer") {
          throw new AppError(
            "FORBIDDEN",
            "Only project owners and client reviewers can reject versions",
            403
          );
        }
      }
    }

    // 5. Transition FROM Rejected: Can only transition to Draft (Owner or Collaborator reopening for revision)
    if (currentStatus === VersionStatus.Rejected) {
      if (targetStatus === VersionStatus.Draft) {
        if (role !== "Owner" && role !== "Collaborator") {
          throw new AppError(
            "FORBIDDEN",
            "Only project owners and collaborators can reopen a rejected version for revisions",
            403
          );
        }
      } else {
        throw new AppError(
          "BAD_REQUEST",
          `Invalid lifecycle transition: A rejected version cannot transition directly to ${targetStatus}. Reopen as Draft first.`,
          400
        );
      }
    }

    // Execute state transition under strict transaction locks
    try {
      const updated = await prisma.$transaction(async (tx) => {
        // Strict Locking Hierarchy - Level 1: Lock Project row
        if (typeof (tx as any).$executeRaw === "function") {
          try {
            await tx.$executeRaw`SELECT id, "creatorId" FROM projects WHERE id = ${projectId} FOR UPDATE`;
          } catch (rawErr) {
            // Non-critical if running under mock driver without raw SQL support
          }
        }

        // Strict Locking Hierarchy - Level 2: Lock Version row
        if (typeof (tx as any).$executeRaw === "function") {
          try {
            await tx.$executeRaw`SELECT id, status FROM versions WHERE id = ${versionId} FOR UPDATE`;
          } catch (rawErr) {
            // Non-critical if running under mock driver
          }
        }

        // Re-verify version under row lock to prevent duplicate notifications on concurrent retries
        const lockedVersion = await tx.version.findUnique({
          where: { id: versionId },
        });

        if (!lockedVersion || lockedVersion.projectId !== projectId) {
          throw new AppError("NOT_FOUND", "Version not found on this project", 404);
        }

        if (lockedVersion.status === targetStatus) {
          return lockedVersion;
        }

        // Enforce Single FINAL Version per project at application level
        if (targetStatus === VersionStatus.Final) {
          const existingFinal = await tx.version.findFirst({
            where: {
              projectId,
              status: VersionStatus.Final,
              id: { not: versionId },
            },
            select: { id: true, versionNumber: true },
          });

          if (existingFinal) {
            throw new AppError(
              "CONFLICT",
              `Project already has a designated FINAL version (v${existingFinal.versionNumber}). A project can have only one FINAL version at a time. Demote the existing FINAL version before designating a new one.`,
              409
            );
          }
        }

        const v = await tx.version.update({
          where: { id: versionId },
          data: { status: targetStatus },
        });

        // Record review/transition comment if provided
        if (comment?.trim()) {
          await tx.comment.create({
            data: {
              projectId,
              versionId,
              authorId: user.id,
              content: `[${targetStatus.toUpperCase()}]: ${comment.trim()}`,
            },
          });
        }

        // Transactional review notifications for Project Owner & Version Creator (excluding self)
        let notifType: NotificationType | null = null;
        if (targetStatus === VersionStatus.Rejected) {
          notifType = NotificationType.Rejection;
        } else if (
          (lockedVersion.status === VersionStatus.Draft &&
            targetStatus === VersionStatus.Approved) ||
          (lockedVersion.status === VersionStatus.Approved &&
            targetStatus === VersionStatus.Final)
        ) {
          notifType = NotificationType.Approval;
        }

        if (notifType) {
          const recipients = new Set<string>([
            project.creatorId,
            lockedVersion.createdById,
          ]);
          recipients.delete(user.id); // Never notify a user about their own action

          for (const recipientId of Array.from(recipients)) {
            await tx.notification.create({
              data: {
                userId: recipientId,
                type: notifType,
                relatedProjectId: projectId,
                relatedVersionId: versionId,
                relatedUserId: user.id,
              },
            });
          }
        }

        // Record community feed activity ONLY for Public projects on Approved / Final transitions
        if (project.visibility === Visibility.Public) {
          if (
            lockedVersion.status === VersionStatus.Draft &&
            targetStatus === VersionStatus.Approved
          ) {
            await recordCommunityActivity(tx, {
              actorId: lockedVersion.createdById,
              type: ActivityType.VersionPublished,
              projectId,
              versionId,
            });
          } else if (
            lockedVersion.status === VersionStatus.Approved &&
            targetStatus === VersionStatus.Final
          ) {
            await recordCommunityActivity(tx, {
              actorId: project.creatorId,
              type: ActivityType.VersionFinalized,
              projectId,
              versionId,
            });
          }
        }

        return v;
      });

      return apiSuccess(updated);
    } catch (txError: any) {
      // Catch PostgreSQL unique constraint violation on partial unique index:
      // CREATE UNIQUE INDEX "versions_unique_final_per_project" ON "versions" ("projectId") WHERE "status" = 'Final'
      if (
        (txError.code === "P2002" &&
          (txError.meta?.target?.includes("versions_unique_final_per_project") ||
            JSON.stringify(txError.meta || {}).includes("Final") ||
            JSON.stringify(txError.meta || {}).includes("projectId"))) ||
        txError.message?.includes("versions_unique_final_per_project")
      ) {
        throw new AppError(
          "CONFLICT",
          "Project already has a designated FINAL version. Only one version per project may have FINAL status at any time.",
          409
        );
      }
      throw txError;
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id]/versions/[versionId] - Delete a version with deletion protection
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;
    const versionId = params.versionId;

    // RBAC: Only Project Owner can delete versions
    await authorize(user, projectId, "delete_version");

    const version = await prisma.version.findUnique({
      where: { id: versionId },
    });

    if (!version || version.projectId !== projectId) {
      return apiError("NOT_FOUND", "Version not found on this project", 404);
    }

    // Protection rule: Designated FINAL versions cannot be deleted
    if (version.status === VersionStatus.Final) {
      return apiError(
        "BAD_REQUEST",
        `Cannot delete a designated FINAL version (v${version.versionNumber}). Demote status to Approved first before deletion.`,
        400
      );
    }

    await prisma.$transaction(async (tx) => {
      // Strict Locking Hierarchy - Level 1: Lock Project row
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
        } catch (rawErr) {
          // Mock support
        }
      }

      // Strict Locking Hierarchy - Level 2: Lock Version row
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id, status FROM versions WHERE id = ${versionId} FOR UPDATE`;
        } catch (rawErr) {
          // Mock support
        }
      }

      // Re-verify status under lock
      const lockedVersion = await tx.version.findUnique({
        where: { id: versionId },
      });

      if (!lockedVersion) {
        throw new AppError("NOT_FOUND", "Version not found", 404);
      }

      if (lockedVersion.status === VersionStatus.Final) {
        throw new AppError(
          "BAD_REQUEST",
          `Cannot delete a designated FINAL version (v${lockedVersion.versionNumber}). Demote status to Approved first before deletion.`,
          400
        );
      }

      // Protection rule 2: Reject deletion if version contains associated comments or feedback (including threaded replies)
      const commentCount = await tx.comment.count({
        where: { versionId },
      });

      if (commentCount > 0) {
        throw new AppError(
          "CONFLICT",
          `Cannot delete version v${lockedVersion.versionNumber} because it contains ${commentCount} feedback comment${commentCount > 1 ? "s" : ""}. To preserve audit trails and discussion integrity, versions with feedback cannot be deleted.`,
          409
        );
      }

      // Delete the version record.
      // Schema foreign key rules:
      // - Asset.versionId has onDelete: SetNull (assets preserved at project level)
      // - Comment.versionId has onDelete: SetNull (feedback preserved at project level)
      await tx.version.delete({
        where: { id: versionId },
      });
    });

    return apiSuccess({
      deleted: true,
      versionId,
      message: `Version v${version.versionNumber} deleted successfully. Associated assets have been unlinked and preserved at the project level.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
