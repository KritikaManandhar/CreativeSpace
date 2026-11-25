import { parseApiResponse } from "./api-client";
import type { ProjectAsset } from "./assets";

export type ProjectStatus = "Idea" | "InProgress" | "InReview" | "Completed" | "Archived";
export type Visibility = "Public" | "Private" | "Unlisted";
export type CollaboratorRole = "Owner" | "Collaborator" | "ClientReviewer";
export type VersionStatus = "Draft" | "Approved" | "Final" | "Rejected";

export interface ProjectCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface ProjectCollaborator {
  id: string;
  projectId: string;
  userId: string;
  role: CollaboratorRole;
  status?: "Pending" | "Accepted" | "Rejected" | "Cancelled";
  invitedAt: string;
  acceptedAt: string | null;
  user: ProjectCreator;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  versionNumber: number;
  notes?: string | null;
  status: VersionStatus;
  createdById: string;
  createdAt: string;
  createdBy?: ProjectCreator;
  assets: ProjectAsset[];
  comments?: unknown[];
}

export interface ProjectDetailData {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: ProjectStatus;
  visibility: Visibility;
  creatorId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  creator: ProjectCreator;
  collaborators: ProjectCollaborator[];
  assets: ProjectAsset[];
  versions: ProjectVersion[];
  comments: unknown[];
  tags?: string[];
  currentUserRole: CollaboratorRole | "Viewer" | "Public";
  isLikedByCurrentUser?: boolean;
  _count?: {
    likes?: number;
  };
}

/**
 * Fetches project details together with signed asset download URLs and
 * merges signed downloadUrls onto each version's asset list.
 */
export async function fetchProjectWithAssets(projectId: string): Promise<ProjectDetailData> {
  const [projectRes, assetsRes] = await Promise.all([
    fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" }),
    fetch(`/api/projects/${encodeURIComponent(projectId)}/assets`, { cache: "no-store" }),
  ]);

  const project = await parseApiResponse<ProjectDetailData>(
    projectRes,
    "Failed to load project"
  );

  let signedAssets: ProjectAsset[] = project.assets || [];
  if (assetsRes.ok) {
    try {
      signedAssets = await parseApiResponse<ProjectAsset[]>(
        assetsRes,
        "Failed to load signed assets"
      );
    } catch {
      signedAssets = project.assets || [];
    }
  }

  const signedUrlByAssetId = new Map<string, string>();
  for (const asset of signedAssets) {
    if (asset.downloadUrl) {
      signedUrlByAssetId.set(asset.id, asset.downloadUrl);
    }
  }

  const enrichedVersions = (project.versions || []).map((version) => ({
    ...version,
    assets: (version.assets || []).map((asset) => ({
      ...asset,
      downloadUrl: asset.downloadUrl || signedUrlByAssetId.get(asset.id) || null,
    })),
  }));

  return {
    ...project,
    assets: signedAssets,
    versions: enrichedVersions,
  };
}

export async function createProjectVersion(
  projectId: string,
  assetIds: string[],
  notes?: string
): Promise<ProjectVersion> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/versions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assetIds, notes: notes?.trim() || undefined }),
  });
  return parseApiResponse<ProjectVersion>(res, "Failed to create version");
}

export async function updateVersionStatus(
  projectId: string,
  versionId: string,
  status: VersionStatus,
  comment?: string
): Promise<ProjectVersion> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, comment: comment?.trim() || undefined }),
    }
  );
  return parseApiResponse<ProjectVersion>(res, "Failed to update version status");
}

export async function inviteProjectCollaborator(
  projectId: string,
  userIdentifier: string,
  role: "Collaborator" | "ClientReviewer"
): Promise<ProjectCollaborator> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIdentifier: userIdentifier.trim(), role }),
  });
  return parseApiResponse<ProjectCollaborator>(res, "Failed to invite collaborator");
}

export async function removeProjectCollaborator(
  projectId: string,
  userId: string
): Promise<unknown> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  return parseApiResponse<unknown>(res, "Failed to remove collaborator");
}

export async function featureProjectInPortfolio(
  projectId: string,
  featured = true
): Promise<unknown> {
  const res = await fetch("/api/portfolio/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, featured }),
  });
  return parseApiResponse<unknown>(res, "Failed to add project to portfolio");
}
