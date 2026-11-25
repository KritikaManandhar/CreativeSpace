import { parseApiResponse } from "./api-client";

export interface DiscoverCreatorSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  disciplines: string[];
}

export interface DiscoverProjectAsset {
  id: string;
  projectId: string;
  versionId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  thumbnailPath: string | null;
  createdAt: string;
}

export interface DiscoverProjectItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  creator: DiscoverCreatorSummary;
  assets: DiscoverProjectAsset[];
  tags: string[];
  _count: {
    likes: number;
    comments: number;
    versions: number;
  };
}

export interface DiscoverProjectsResponse {
  projects: DiscoverProjectItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchDiscoverData(params: {
  category?: string;
  q?: string;
  sort?: "popular" | "newest";
  page?: number;
  limit?: number;
} = {}): Promise<DiscoverProjectsResponse> {
  const query = new URLSearchParams();
  if (params.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params.page) {
    query.set("page", String(params.page));
  }
  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const trimmedQuery = params.q?.trim();
  if (trimmedQuery) {
    query.set("q", trimmedQuery);
    const res = await fetch(`/api/search?${query.toString()}`, { cache: "no-store" });
    return parseApiResponse<DiscoverProjectsResponse>(res, "Failed to search public projects");
  }

  if (params.sort) {
    query.set("sort", params.sort);
  }

  const res = await fetch(`/api/discover?${query.toString()}`, { cache: "no-store" });
  return parseApiResponse<DiscoverProjectsResponse>(res, "Failed to load discovery projects");
}
