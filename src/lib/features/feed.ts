import { parseApiResponse } from "./api-client";
import type { CreateProjectInput, WorkspaceProjectSummary } from "./workspace";

export type FeedTabType = "following" | "discover";

export interface FeedActorDTO {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  disciplines: string[];
  isFollowing: boolean;
}

export interface FeedProjectDTO {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  previewImageUrl: string | null;
  likeCount: number;
  commentCount: number;
  hasLiked: boolean;
}

export interface FeedPostData {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
  relevanceScore: number;
  actor: FeedActorDTO;
  project: FeedProjectDTO;
  version: {
    id: string;
    versionNumber: number;
    status: string;
  } | null;
}

export interface TrendingCreatorItem {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  disciplines: string[];
  followerCount: number;
  publicProjectCount: number;
  isFollowing: boolean;
}

export interface CommunityFeedResponse {
  tab: FeedTabType;
  items: FeedPostData[];
  followingCount: number;
  hasMore: boolean;
  nextCursor: string | null;
  suggestedCreators: TrendingCreatorItem[];
}

export interface FeedCategoryOption {
  id: string;
  name: string;
}

const SAVED_PROJECTS_STORAGE_KEY = "creativespace_saved_projects";

export function readSavedProjectIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toggleSavedProjectId(projectId: string): string[] {
  const existing = new Set(readSavedProjectIds());
  if (existing.has(projectId)) {
    existing.delete(projectId);
  } else {
    existing.add(projectId);
  }
  const updated = Array.from(existing);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SAVED_PROJECTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors in restricted environments
    }
  }
  return updated;
}

export async function fetchCommunityFeed(params: {
  tab?: FeedTabType;
  category?: string;
  cursor?: string | null;
  limit?: number;
} = {}): Promise<CommunityFeedResponse> {
  const query = new URLSearchParams();
  query.set("tab", params.tab || "discover");
  query.set("limit", String(params.limit ?? 12));
  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params.cursor) {
    query.set("cursor", params.cursor);
  }

  const res = await fetch(`/api/feed?${query.toString()}`, { cache: "no-store" });
  return parseApiResponse<CommunityFeedResponse>(res, "Failed to load community feed");
}

export async function fetchFeedCategories(): Promise<FeedCategoryOption[]> {
  const res = await fetch("/api/admin/categories", { cache: "no-store" });
  return parseApiResponse<FeedCategoryOption[]>(res, "Failed to load categories");
}

export async function createFeedProject(
  input: CreateProjectInput
): Promise<WorkspaceProjectSummary> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<WorkspaceProjectSummary>(res, "Failed to create project");
}

export async function searchCommunityProjects(
  queryText: string,
  limit = 12
): Promise<{ projects: unknown[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
  const params = new URLSearchParams({
    q: queryText.trim(),
    limit: String(limit),
  });
  const res = await fetch(`/api/search?${params.toString()}`, { cache: "no-store" });
  return parseApiResponse(res, "Failed to search projects");
}
