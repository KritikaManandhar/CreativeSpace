import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/api-response";
import { CollaboratorRole, InvitationStatus, Visibility } from "@prisma/client";

export type ProjectAction =
  | "view_project"
  | "manage_settings"
  | "delete_project"
  | "invite_collaborator"
  | "manage_collaborator"
  | "upload_asset"
  | "delete_asset"
  | "create_version"
  | "approve_reject_version"
  | "designate_final_version"
  | "delete_version"
  | "create_comment"
  | "publish_portfolio";

export interface AuthUser {
  id: string;
  email?: string | null;
  username?: string | null;
  isAdmin?: boolean;
  emailVerified?: Date | string | boolean | null;
  suspendedAt?: Date | string | null;
  isSuspended?: boolean | null;
}

function isEligibleAuthUser(user: AuthUser | null | undefined): user is AuthUser {
  if (!user || !user.id) return false;
  if (user.suspendedAt || user.isSuspended) return false;
  if (
    Object.prototype.hasOwnProperty.call(user, "emailVerified") &&
    user.emailVerified !== undefined &&
    !user.emailVerified
  ) {
    return false;
  }
  return true;
}

export interface AuthorizationResult {
  authorized: boolean;
  role: CollaboratorRole | "None";
  project: {
    id: string;
    creatorId: string;
    visibility: Visibility;
    status: string;
    title: string;
    metadata?: any;
  };
}

/**
 * Resolves user's effective role for a project:
 * Owner (if creatorId == userId)
 * Collaborator or ClientReviewer (if record in ProjectCollaborator exists)
 * None otherwise
 */
export async function getEffectiveRole(
  userId: string | undefined | null,
  projectId: string
): Promise<{
  role: CollaboratorRole | "None";
  project: any;
}> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: userId
        ? {
            where: { userId, acceptedAt: { not: null } },
          }
        : false,
    },
  });

  if (!project) {
    throw new AppError("NOT_FOUND", "Project not found", 404);
  }

  if (!userId) {
    return { role: "None", project };
  }

  if (project.creatorId === userId) {
    return { role: "Owner", project };
  }

  const membership = project.collaborators?.[0];
  if (
    membership &&
    membership.acceptedAt !== null &&
    (!membership.status || membership.status === InvitationStatus.Accepted) &&
    membership.role !== CollaboratorRole.Owner
  ) {
    return { role: membership.role, project };
  }

  return { role: "None", project };
}

/**
 * Enforces strict object-level access control: (userId, projectId, action)
 * Prevents Insecure Direct Object Reference (IDOR) attacks per TRD Section 12 & 13.
 */
export async function authorize(
  user: AuthUser | null | undefined,
  projectId: string,
  action: ProjectAction
): Promise<AuthorizationResult> {
  const activeUser = isEligibleAuthUser(user) ? user : null;
  const { role, project } = await getEffectiveRole(activeUser?.id, projectId);

  // Platform Admin override for viewing and moderation
  if (activeUser?.isAdmin && action === "view_project") {
    return { authorized: true, role, project };
  }

  // 1. Viewing Project
  if (action === "view_project") {
    if (project.visibility === Visibility.Public) {
      return { authorized: true, role, project };
    }
    if (role === "Owner" || role === "Collaborator" || role === "ClientReviewer") {
      return { authorized: true, role, project };
    }
    throw new AppError(
      "FORBIDDEN",
      "You do not have permission to view this private project",
      403
    );
  }

  // All other actions require an active, verified authenticated user
  if (!activeUser) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  // Role permissions per PRD Section 18 & TRD Section 13
  switch (action) {
    case "manage_settings":
      if (role !== "Owner" && !activeUser.isAdmin) {
        throw new AppError(
          "FORBIDDEN",
          `Only the project owner or authorized administrator can perform this action: ${action}`,
          403
        );
      }
      break;

    case "delete_project":
    case "invite_collaborator":
    case "manage_collaborator":
    case "publish_portfolio":
    case "designate_final_version":
    case "delete_version":
      if (role !== "Owner" && !activeUser.isAdmin) {
        throw new AppError(
          "FORBIDDEN",
          `Only the project owner can perform this action: ${action}`,
          403
        );
      }
      break;

    case "upload_asset":
    case "create_version":
      if (role !== "Owner" && role !== "Collaborator") {
        throw new AppError(
          "FORBIDDEN",
          "Only project owners and collaborators can upload assets or create versions",
          403
        );
      }
      break;

    case "delete_asset":
      // Owner can delete any asset, collaborator can delete only if owner permits (or their own)
      if (role !== "Owner" && role !== "Collaborator") {
        throw new AppError(
          "FORBIDDEN",
          "You do not have permission to delete assets from this project",
          403
        );
      }
      break;

    case "approve_reject_version":
      // Client/Reviewer and Owner can approve or reject versions
      if (role !== "Owner" && role !== "ClientReviewer") {
        throw new AppError(
          "FORBIDDEN",
          "Only owners and client reviewers can approve or reject draft versions",
          403
        );
      }
      break;

    case "create_comment":
      // On public projects, any authenticated user can leave feedback
      if (project.visibility === Visibility.Public) {
        break;
      }
      // On private or collaborators-only projects, must be Owner, Collaborator, or ClientReviewer
      if (role !== "Owner" && role !== "Collaborator" && role !== "ClientReviewer") {
        throw new AppError(
          "FORBIDDEN",
          "You must be a member of this project to post comments in this private workspace",
          403
        );
      }
      break;

    default:
      throw new AppError("BAD_REQUEST", `Unknown action: ${action}`, 400);
  }

  return { authorized: true, role, project };
}
