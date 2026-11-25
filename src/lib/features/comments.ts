import { parseApiResponse } from "./api-client";

export type CommentScope = "project" | "version";

export interface CommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ProjectComment {
  id: string;
  projectId: string;
  versionId: string | null;
  parentId: string | null;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  likeCount: number;
  hasLiked: boolean;
  replies?: ProjectComment[];
  replyCount?: number;
}

export async function fetchComments(
  projectId: string,
  scope: CommentScope,
  versionId?: string | null
): Promise<ProjectComment[]> {
  const params = new URLSearchParams({ scope });
  if (scope === "version" && versionId) {
    params.set("versionId", versionId);
  }
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/comments?${params.toString()}`,
    { cache: "no-store" }
  );
  const data = await parseApiResponse<
    ProjectComment[] | { comments?: ProjectComment[] }
  >(res, "Failed to load comments");

  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.comments)) return data.comments;
  return [];
}

export async function createComment(
  projectId: string,
  payload: {
    content: string;
    scope: CommentScope;
    versionId?: string | null;
    parentId?: string | null;
  }
): Promise<ProjectComment> {
  const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: payload.content.trim(),
      scope: payload.scope,
      ...(payload.scope === "version" && payload.versionId
        ? { versionId: payload.versionId }
        : {}),
      ...(payload.parentId ? { parentId: payload.parentId } : {}),
    }),
  });
  return parseApiResponse<ProjectComment>(res, "Failed to post comment");
}

export async function updateComment(
  projectId: string,
  commentId: string,
  content: string
): Promise<ProjectComment> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim() }),
    }
  );
  return parseApiResponse<ProjectComment>(res, "Failed to update comment");
}

export async function deleteComment(
  projectId: string,
  commentId: string
): Promise<{ deleted: boolean }> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE" }
  );
  return parseApiResponse<{ deleted: boolean }>(res, "Failed to delete comment");
}

export async function toggleCommentLike(
  projectId: string,
  commentId: string,
  currentlyLiked: boolean
): Promise<{ liked: boolean; likeCount?: number }> {
  const res = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/comments/${encodeURIComponent(commentId)}/like`,
    { method: currentlyLiked ? "DELETE" : "POST" }
  );
  return parseApiResponse<{ liked: boolean; likeCount?: number }>(
    res,
    currentlyLiked ? "Failed to unlike comment" : "Failed to like comment"
  );
}
