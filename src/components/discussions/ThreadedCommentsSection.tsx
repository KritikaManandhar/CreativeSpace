"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Heart,
  CornerDownRight,
  Pencil,
  Trash2,
  Send,
  AlertCircle,
  Lock,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingState";

export interface ThreadedCommentAuthor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface ThreadedCommentItem {
  id: string;
  projectId: string;
  versionId: string | null;
  parentId: string | null;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ThreadedCommentAuthor;
  likeCount: number;
  hasLiked: boolean;
  replies?: ThreadedCommentItem[];
  replyCount?: number;
}

interface ThreadedCommentsSectionProps {
  projectId: string;
  scope: "project" | "version";
  versionId?: string | null;
  canPost: boolean;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  highlightedCommentId?: string | null;
  title: string;
  subtitle?: string;
  badgeText?: string;
  emptyMessage: string;
  placeholder: string;
}

export function ThreadedCommentsSection({
  projectId,
  scope,
  versionId = null,
  canPost,
  isAuthenticated,
  currentUserId = null,
  isAdmin = false,
  highlightedCommentId = null,
  title,
  subtitle,
  badgeText,
  emptyMessage,
  placeholder,
}: ThreadedCommentsSectionProps) {
  const [comments, setComments] = useState<ThreadedCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New top-level comment
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply state (1-level only, attached to a top-level comment ID)
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Per-comment busy map for likes/deletes
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  const fetchComments = useCallback(async () => {
    if (scope === "version" && !versionId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    try {
      const qs =
        scope === "project"
          ? "scope=project"
          : `scope=version&versionId=${encodeURIComponent(versionId!)}`;

      const res = await fetch(`/api/projects/${projectId}/comments?${qs}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setLoadError(json.error?.message || "Failed to load discussion");
        setComments([]);
        return;
      }

      setComments(Array.isArray(json.data) ? json.data : []);
    } catch {
      setLoadError("Network error while loading comments.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, scope, versionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const totalCount = comments.reduce(
    (sum, item) => sum + 1 + (item.replies?.length || 0),
    0
  );

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent.trim(),
          scope,
          versionId: scope === "version" ? versionId : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Failed to post comment");
        return;
      }
      setNewContent("");
      await fetchComments();
    } catch {
      setActionError("Network error while posting comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          scope,
          versionId: scope === "version" ? versionId : null,
          parentId,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Failed to post reply");
        return;
      }
      setReplyContent("");
      setReplyingToId(null);
      await fetchComments();
    } catch {
      setActionError("Network error while posting reply.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleToggleLike = async (comment: ThreadedCommentItem) => {
    if (!isAuthenticated || busyMap[comment.id]) return;
    setBusyMap((prev) => ({ ...prev, [comment.id]: true }));
    setActionError(null);

    try {
      const method = comment.hasLiked ? "DELETE" : "POST";
      const res = await fetch(
        `/api/projects/${projectId}/comments/${comment.id}/like`,
        { method }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not update like");
        return;
      }
      await fetchComments();
    } catch {
      setActionError("Network error while updating like.");
    } finally {
      setBusyMap((prev) => ({ ...prev, [comment.id]: false }));
    }
  };

  const handleSaveEdit = async (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!editContent.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Failed to edit comment");
        return;
      }
      setEditingId(null);
      setEditContent("");
      await fetchComments();
    } catch {
      setActionError("Network error while saving edit.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (busyMap[commentId]) return;
    setBusyMap((prev) => ({ ...prev, [commentId]: true }));
    setActionError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not delete comment");
        return;
      }
      await fetchComments();
    } catch {
      setActionError("Network error while deleting comment.");
    } finally {
      setBusyMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const renderCommentCard = (comment: ThreadedCommentItem, isReply: boolean) => {
    const isAuthor = Boolean(currentUserId && currentUserId === comment.authorId);
    const canDelete = isAuthor || Boolean(isAdmin);
    const isEditing = editingId === comment.id;
    const isBusy = Boolean(busyMap[comment.id]);
    const isHighlighted = highlightedCommentId === comment.id;
    const isEdited =
      comment.updatedAt &&
      new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() > 2000;

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`rounded-xl border p-3.5 transition-colors ${
          isHighlighted
            ? "border-violet-500 bg-violet-950/30 ring-1 ring-violet-500/40"
            : isReply
              ? "border-slate-800/70 bg-slate-950/60"
              : "border-slate-800/90 bg-slate-950/80"
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden">
              {comment.author?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.author.avatarUrl}
                  alt={comment.author.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                comment.author?.displayName?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/profile/${comment.author?.username}`}
                  className="text-xs font-semibold text-white hover:text-violet-300 transition-colors truncate"
                >
                  {comment.author?.displayName}
                </Link>
                <span className="text-[11px] text-slate-500 font-mono truncate">
                  @{comment.author?.username}
                </span>
                {isEdited && (
                  <span className="text-[10px] text-slate-500 italic">(edited)</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {(isAuthor || canDelete) && !isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                    setActionError(null);
                  }}
                  title="Edit comment"
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Delete comment"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={(e) => handleSaveEdit(e, comment.id)} className="mt-2 space-y-2">
            <textarea
              rows={2}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-violet-500 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingId(null);
                  setEditContent("");
                }}
                className="text-xs gap-1"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingEdit}
                className="text-xs gap-1"
              >
                <Check className="w-3 h-3" />
                Save
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words mt-1.5">
            {comment.content}
          </p>
        )}

        {/* Action Row: Like + Reply (only on top-level comments) */}
        {!isEditing && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center gap-3 text-xs">
            <button
              type="button"
              disabled={!isAuthenticated || isBusy}
              onClick={() => handleToggleLike(comment)}
              title={isAuthenticated ? (comment.hasLiked ? "Unlike" : "Like") : "Sign in to like"}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                comment.hasLiked
                  ? "text-rose-400 bg-rose-950/40 border border-rose-800/50"
                  : "text-slate-400 hover:text-rose-300 hover:bg-slate-800/70"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${comment.hasLiked ? "fill-rose-500 text-rose-500" : ""}`}
              />
              <span>{comment.likeCount}</span>
            </button>

            {!isReply && canPost && (
              <button
                type="button"
                onClick={() => {
                  setReplyingToId(replyingToId === comment.id ? null : comment.id);
                  setReplyContent("");
                  setActionError(null);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-400 hover:text-violet-300 hover:bg-slate-800/70 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            )}

            {!isReply && (comment.replies?.length || 0) > 0 && (
              <span className="text-[11px] text-slate-500 ml-auto">
                {comment.replies!.length}{" "}
                {comment.replies!.length === 1 ? "reply" : "replies"}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            {title}
            <span className="text-xs font-medium text-slate-400">({totalCount})</span>
          </h4>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {badgeText && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700">
            <Lock className="w-3 h-3 text-amber-400" />
            {badgeText}
          </span>
        )}
      </div>

      {/* Inline action error */}
      {actionError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner className="w-6 h-6 text-violet-500" />
        </div>
      ) : loadError ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between gap-2">
          <span>{loadError}</span>
          <Button variant="ghost" size="sm" onClick={fetchComments} className="text-xs">
            Retry
          </Button>
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-500 py-4 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-2">
              {renderCommentCard(comment, false)}

              {/* Threaded 1-level replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-5 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-slate-800 space-y-2">
                  {comment.replies.map((reply) => renderCommentCard(reply, true))}
                </div>
              )}

              {/* Inline reply composer */}
              {replyingToId === comment.id && canPost && (
                <form
                  onSubmit={(e) => handleCreateReply(e, comment.id)}
                  className="ml-5 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-violet-600/60 flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="text"
                    placeholder={`Reply to ${comment.author?.displayName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      isLoading={isSubmittingReply}
                      disabled={!replyContent.trim()}
                      className="gap-1 text-xs"
                    >
                      <Send className="w-3 h-3" />
                      Reply
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyContent("");
                      }}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top-level Comment Composer */}
      {canPost ? (
        <form onSubmit={handleCreateComment} className="pt-2 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!newContent.trim()}
            className="gap-1.5 sm:px-4"
          >
            <Send className="w-3.5 h-3.5" />
            Post
          </Button>
        </form>
      ) : !isAuthenticated && scope === "version" ? (
        <div className="pt-1 text-xs text-slate-400">
          <Link href="/login" className="text-violet-400 hover:underline font-medium">
            Sign in
          </Link>{" "}
          to post feedback, reply, or like comments.
        </div>
      ) : null}
    </div>
  );
}
