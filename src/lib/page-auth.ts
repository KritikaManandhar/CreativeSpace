import * as authModule from "@/lib/auth";
import type { AuthenticatedSessionUser } from "@/lib/auth";
import { authorize } from "@/lib/rbac";
import { AppError } from "@/lib/api-response";

export type ProtectedPageAccessResult =
  | { allowed: true; user: AuthenticatedSessionUser }
  | { allowed: false; status: 401; redirectTo: string };

export type AdminPageAccessResult =
  | { allowed: true; user: AuthenticatedSessionUser }
  | { allowed: false; status: 401 | 403; redirectTo?: string; message: string };

export type ProjectEditPageAccessResult =
  | { allowed: true; user: AuthenticatedSessionUser; project: any }
  | { allowed: false; status: 401 | 403 | 404; redirectTo?: string; message: string };

export function buildLoginRedirectUrl(callbackPath: string): string {
  return `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
}

export async function evaluateProtectedPageAccess(
  callbackPath: string
): Promise<ProtectedPageAccessResult> {
  const user = await authModule.getCurrentUser();
  if (!user) {
    return {
      allowed: false,
      status: 401,
      redirectTo: buildLoginRedirectUrl(callbackPath),
    };
  }
  return { allowed: true, user };
}

export async function evaluateAdminPageAccess(
  callbackPath: string = "/admin"
): Promise<AdminPageAccessResult> {
  const user = await authModule.getCurrentUser();
  if (!user) {
    return {
      allowed: false,
      status: 401,
      redirectTo: buildLoginRedirectUrl(callbackPath),
      message: "Authentication required",
    };
  }

  if (!user.isAdmin) {
    return {
      allowed: false,
      status: 403,
      message: "You do not have administrative privileges to access this area.",
    };
  }

  return { allowed: true, user };
}

export async function evaluateProjectEditPageAccess(
  projectId: string
): Promise<ProjectEditPageAccessResult> {
  const callbackPath = `/projects/${projectId}/edit`;
  const user = await authModule.getCurrentUser();
  if (!user) {
    return {
      allowed: false,
      status: 401,
      redirectTo: buildLoginRedirectUrl(callbackPath),
      message: "Authentication required",
    };
  }

  try {
    const authResult = await authorize(user, projectId, "manage_settings");
    return { allowed: true, user, project: authResult.project };
  } catch (err: any) {
    if (err instanceof AppError || err?.name === "AppError") {
      if (err.statusCode === 404) {
        return {
          allowed: false,
          status: 404,
          message: err.message || "Project not found",
        };
      }
      if (err.statusCode === 401) {
        return {
          allowed: false,
          status: 401,
          redirectTo: buildLoginRedirectUrl(callbackPath),
          message: err.message || "Authentication required",
        };
      }
      return {
        allowed: false,
        status: 403,
        message: err.message || "Only the project owner or authorized administrator can edit this project",
      };
    }
    throw err;
  }
}
