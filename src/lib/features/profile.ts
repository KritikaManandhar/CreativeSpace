import { parseApiResponse } from "./api-client";

export type ViewerConnectionState =
  | "none"
  | "pending_incoming"
  | "pending_outgoing"
  | "accepted"
  | "rejected";

export interface NormalizedSocialLink {
  key: string;
  label: string;
  url: string;
}

export interface CreatorStats {
  publicProjects: number;
  followers: number;
  following: number;
  totalLikes: number;
}

export interface CreatorPortfolioProjectItem {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  status: string;
  visibility: string;
  tags?: string[];
  updatedAt?: string;
  createdAt?: string;
  featured?: boolean;
  _count?: {
    likes?: number;
    comments?: number;
  };
  assets?: Array<{
    id: string;
    thumbnailPath?: string | null;
    fileName?: string;
    mimeType?: string;
  }>;
}

export interface CreatorProfileResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    role: string;
    bio: string | null;
    avatarUrl: string | null;
    disciplines: string[];
    socialLinks: Record<string, unknown> | null;
    socialPrivacy?: string;
    createdAt: string;
  };
  stats: CreatorStats;
  viewerContext?: {
    isOwner: boolean;
    isFollowing: boolean;
    connectionState?: ViewerConnectionState;
    connectionId?: string | null;
  };
  featuredProjects?: CreatorPortfolioProjectItem[];
  publicProjects?: CreatorPortfolioProjectItem[];
  projects?: CreatorPortfolioProjectItem[];
  recentActivities?: unknown[];
}

export interface FollowListUser {
  id: string;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  disciplines?: string[];
}

export interface FollowListResponse {
  items: FollowListUser[];
  nextCursor: string | null;
  hasMore: boolean;
}

const SOCIAL_LABEL_MAP: Record<string, string> = {
  website: "Website",
  twitter: "X / Twitter",
  x: "X / Twitter",
  github: "GitHub",
  instagram: "Instagram",
  behance: "Behance",
  dribbble: "Dribbble",
  linkedin: "LinkedIn",
  youtube: "YouTube",
};

/**
 * Security helper: validates that external social URLs strictly use http: or https:
 * so javascript:/data:/vbscript: links can never execute from profile links.
 */
export function sanitizeExternalUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeSocialLinks(rawSocialLinks: unknown): NormalizedSocialLink[] {
  if (!rawSocialLinks || typeof rawSocialLinks !== "object" || Array.isArray(rawSocialLinks)) {
    return [];
  }

  const normalized: NormalizedSocialLink[] = [];
  for (const [key, value] of Object.entries(rawSocialLinks as Record<string, unknown>)) {
    const candidateUrl =
      typeof value === "string"
        ? value
        : value && typeof value === "object" && "url" in value
          ? (value as { url?: unknown }).url
          : null;

    const safeUrl = sanitizeExternalUrl(candidateUrl);
    if (!safeUrl) continue;

    normalized.push({
      key,
      label: SOCIAL_LABEL_MAP[key.toLowerCase()] || key,
      url: safeUrl,
    });
  }

  return normalized;
}

export function extractToolsFromProfile(
  disciplines: string[],
  projects: Array<{ metadata?: Record<string, unknown> | null }>
): string[] {
  const tools = new Set<string>(disciplines);
  const toolKeys = ["software", "daw", "designTool", "camera", "cameraRig"];
  for (const project of projects) {
    const meta = project.metadata;
    if (!meta || typeof meta !== "object") continue;
    for (const key of toolKeys) {
      const val = meta[key];
      if (typeof val === "string" && val.trim()) {
        tools.add(val.trim());
      }
    }
  }
  return Array.from(tools);
}

export async function fetchCreatorPortfolio(
  username: string
): Promise<CreatorProfileResponse> {
  const res = await fetch(`/api/portfolio/${encodeURIComponent(username)}`, {
    cache: "no-store",
  });
  return parseApiResponse<CreatorProfileResponse>(res, "Failed to load creator profile");
}

export async function fetchCreatorFollowList(
  creatorId: string,
  type: "followers" | "following",
  cursor?: string,
  limit = 20
): Promise<FollowListResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(
    `/api/users/${encodeURIComponent(creatorId)}/${type}?${params.toString()}`,
    { cache: "no-store" }
  );
  return parseApiResponse<FollowListResponse>(res, `Failed to load ${type}`);
}

export async function toggleFollowCreator(
  creatorId: string,
  currentlyFollowing: boolean
): Promise<{ following: boolean }> {
  const res = await fetch(`/api/users/${encodeURIComponent(creatorId)}/follow`, {
    method: currentlyFollowing ? "DELETE" : "POST",
  });
  return parseApiResponse<{ following: boolean }>(
    res,
    currentlyFollowing ? "Failed to unfollow creator" : "Failed to follow creator"
  );
}

export async function toggleProjectLike(
  projectId: string,
  currentlyLiked: boolean
): Promise<unknown> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/like`, {
    method: currentlyLiked ? "DELETE" : "POST",
  });
  return parseApiResponse<unknown>(
    res,
    currentlyLiked ? "Failed to unlike project" : "Failed to like project"
  );
}

export async function fetchOwnedProjectsForInvite(): Promise<
  Array<{ id: string; title: string; category: string }>
> {
  const res = await fetch("/api/projects?role=Owner", { cache: "no-store" });
  return parseApiResponse<Array<{ id: string; title: string; category: string }>>(
    res,
    "Failed to load owned projects"
  );
}

export async function inviteCreatorToProject(
  projectId: string,
  userIdentifier: string,
  role: "Collaborator" | "ClientReviewer"
): Promise<unknown> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/collaborators`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userIdentifier, role }),
  });
  return parseApiResponse<unknown>(res, "Failed to invite creator to project");
}

export async function reportCreator(creatorId: string, reason: string): Promise<unknown> {
  const res = await fetch("/api/admin/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetType: "User",
      targetId: creatorId,
      reason: reason.trim(),
    }),
  });
  return parseApiResponse<unknown>(res, "Failed to submit creator report");
}
