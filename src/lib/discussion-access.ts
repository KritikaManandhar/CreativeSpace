import { AppError } from "@/lib/api-response";
import { AuthUser } from "@/lib/rbac";
import { CollaboratorRole, UserRole, VersionStatus, Visibility } from "@prisma/client";
import type { CommentScope } from "@/lib/validations/comment";

export interface DiscussionProjectContext {
  id: string;
  creatorId: string;
  visibility: Visibility;
}

export interface DiscussionVersionContext {
  id: string;
  projectId: string;
  status: VersionStatus;
}

export function isProjectMemberRole(role: CollaboratorRole | "None"): boolean {
  return (
    role === CollaboratorRole.Owner ||
    role === CollaboratorRole.Collaborator ||
    role === CollaboratorRole.ClientReviewer
  );
}

/**
 * Enforces read visibility rules for project discussions vs. version feedback:
 *
 * - Project scope (versionId === null):
 *   Strictly internal to authorized project members (Owner, Collaborator, ClientReviewer),
 *   even when project.visibility === Public.
 *
 * - Version scope (versionId !== null):
 *   - Must reference a version belonging to the requested project.
 *   - Authorized members may view feedback for any version status.
 *   - Non-members on Private / CollaboratorsOnly projects are rejected (403).
 *   - Non-members on Public projects may view feedback on Approved, Final, and Draft
 *     versions (preserving public feedback policy; draft media assets remain hidden).
 *   - Non-members are rejected (403) from Rejected version feedback.
 */
export function assertCanViewDiscussionScope(params: {
  project: DiscussionProjectContext;
  role: CollaboratorRole | "None";
  scope: CommentScope;
  version?: DiscussionVersionContext | null;
  userRole?: UserRole | string | null;
  isAdmin?: boolean;
}): void {
  const { project, role, scope, version, userRole, isAdmin } = params;
  const isMember = isProjectMemberRole(role);
  const actorIsAdmin = userRole === UserRole.ADMIN && isAdmin !== false;

  if (scope === "project") {
    if (!isMember && !actorIsAdmin) {
      throw new AppError(
        "FORBIDDEN",
        "Project discussions are restricted to authorized project members",
        403
      );
    }
    return;
  }

  // scope === "version"
  if (!version || version.projectId !== project.id) {
    throw new AppError("NOT_FOUND", "Specified version not found on this project", 404);
  }

  if (isMember || actorIsAdmin) {
    return;
  }

  if (project.visibility !== Visibility.Public) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have permission to view feedback on this private project",
      403
    );
  }

  if (version.status === VersionStatus.Rejected) {
    throw new AppError(
      "FORBIDDEN",
      "Feedback for rejected versions is restricted to authorized project members",
      403
    );
  }
}

/**
 * Enforces write access for posting comments, replies, or liking comments within a scope.
 */
export function assertCanMutateDiscussionScope(params: {
  user: AuthUser | null | undefined;
  project: DiscussionProjectContext;
  role: CollaboratorRole | "None";
  scope: CommentScope;
  version?: DiscussionVersionContext | null;
}): void {
  if (!params.user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }

  assertCanViewDiscussionScope({
    project: params.project,
    role: params.role,
    scope: params.scope,
    version: params.version,
    isAdmin: false,
  });
}

export function assertCanEditComment(
  user: AuthUser | null | undefined,
  commentAuthorId: string
): void {
  if (!user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (commentAuthorId !== user.id) {
    throw new AppError(
      "FORBIDDEN",
      "You can only edit your own comments",
      403
    );
  }
}

export function assertCanDeleteComment(
  user: AuthUser | null | undefined,
  commentAuthorId: string
): void {
  if (!user?.id) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  if (commentAuthorId !== user.id && user.role !== UserRole.ADMIN) {
    throw new AppError(
      "FORBIDDEN",
      "You can only delete your own comments",
      403
    );
  }
}
