"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Heart,
  Send,
  CornerDownRight,
  Pencil,
  Trash2,
  AlertCircle,
  Sparkles,
  Check,
  X,
  Layers,
  HelpCircle,
} from "lucide-react";
import { CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import {
  ProjectComment,
  formatRelativeDate,
} from "./projectTypes";

interface ProjectFeedbackSectionProps {
  projectId: string;
  selectedVersionId: string | null;
  selectedVersionNumber?: number;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
}

export function ProjectFeedbackSection({
  projectId,
  selectedVersionId,
  selectedVersionNumber,
  isAuthenticated,
  currentUserId,
  isAdmin = false,
}: ProjectFeedbackSectionProps) {
  const { data: session } = useSession();
  const [activeScope, setActiveScope] = useState<"project" | "version">(
    selectedVersionId ? "version" : "project"
  );

  // Sync active scope when selectedVersionId changes
  useEffect(() => {
    if (selectedVersionId) {
      setActiveScope("version");
    } else {
      setActiveScope("project");
    }
  }, [selectedVersionId]);

  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New Comment Form
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply State
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Busy map for like/delete
  const [busyMap, setBusyMap] = useState<Record<string, boolean>>({});

  // Feedback suggestion prompts
  const feedbackPills = [
    "Compelling color harmony",
    "Intriguing narrative mood",
    "Refined craftsmanship",
    "Iteration idea for next version",
  ];

  // Fetch comments based on active scope
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      let url = `/api/projects/${projectId}/comments?scope=${activeScope}`;
      if (activeScope === "version") {
        if (!selectedVersionId) {
          setComments([]);
          setIsLoading(false);
          return;
        }
        url += `&versionId=${selectedVersionId}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        setLoadError(json.error?.message || "Failed to load comments");
        return;
      }

      // json.data is an array of comments
      const items = Array.isArray(json.data)
        ? json.data
        : Array.isArray(json.data?.comments)
        ? json.data.comments
        : [];
      setComments(items);
    } catch {
      setLoadError("Network error loading discussion");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, activeScope, selectedVersionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Submit top-level comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    if (!isAuthenticated) {
      window.location.href = `/login?callbackUrl=/projects/${projectId}`;
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const payload: Record<string, any> = {
        content: newContent.trim(),
        scope: activeScope,
      };
      if (activeScope === "version" && selectedVersionId) {
        payload.versionId = selectedVersionId;
      }

      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not publish comment");
        return;
      }

      setNewContent("");
      await fetchComments();
    } catch {
      setActionError("Network error submitting comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit 1-level reply
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmittingReply) return;

    if (!isAuthenticated) {
      window.location.href = `/login?callbackUrl=/projects/${projectId}`;
      return;
    }

    setIsSubmittingReply(true);
    setActionError(null);

    try {
      const payload: Record<string, any> = {
        content: replyContent.trim(),
        scope: activeScope,
        parentId,
      };
      if (activeScope === "version" && selectedVersionId) {
        payload.versionId = selectedVersionId;
      }

      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setActionError(json.error?.message || "Could not send reply");
        return;
      }

      setReplyContent("");
      setReplyingToId(null);
      await fetchComments();
    } catch {
      setActionError("Network error submitting reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Toggle Like on Comment
  const handleToggleLike = async (commentId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      window.location.href = `/login?callbackUrl=/projects/${projectId}`;
      return;
    }

    if (busyMap[commentId]) return;
    setBusyMap((prev) => ({ ...prev, [commentId]: true }));

    // Optimistic UI update
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            hasLiked: !currentlyLiked,
            likeCount: currentlyLiked ? Math.max(0, c.likeCount - 1) : c.likeCount + 1,
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    hasLiked: !currentlyLiked,
                    likeCount: currentlyLiked
                      ? Math.max(0, r.likeCount - 1)
                      : r.likeCount + 1,
                  }
                : r
            ),
          };
        }
        return c;
      })
    );

    try {
      const method = currentlyLiked ? "DELETE" : "POST";
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentId}/like`,
        { method }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        // Revert on error
        await fetchComments();
      }
    } catch {
      await fetchComments();
    } finally {
      setBusyMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to remove this feedback comment?")) return;

    setBusyMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (json.success) {
        await fetchComments();
      } else {
        alert(json.error?.message || "Failed to delete comment");
      }
    } catch {
      alert("Error deleting comment");
    } finally {
      setBusyMap((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  // Save Edit
  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );
      const json = await res.json();
      if (json.success) {
        setEditingId(null);
        setEditContent("");
        await fetchComments();
      } else {
        alert(json.error?.message || "Failed to update comment");
      }
    } catch {
      alert("Error updating comment");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <section id="feedback-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-12">
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Section Header & Scope Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#203B35]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-[#203B35]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#203B35] font-semibold">
                Constructive Critique & Feedback
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5D635F]">
              Share peer insights, appreciate craftsmanship, or discuss iteration nuances.
            </p>
          </div>

          {/* Scope Pills (Project vs Version) */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#EFECE2]">
            <button
              type="button"
              onClick={() => setActiveScope("project")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                activeScope === "project"
                  ? "bg-[#203B35] text-[#FAF8F3] shadow-sm"
                  : "text-[#5D635F] hover:text-[#203B35]"
              }`}
            >
              Project Discussion
            </button>

            {selectedVersionId && (
              <button
                type="button"
                onClick={() => setActiveScope("version")}
                className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                  activeScope === "version"
                    ? "bg-[#203B35] text-[#FAF8F3] shadow-sm"
                    : "text-[#5D635F] hover:text-[#203B35]"
                }`}
              >
                v{selectedVersionNumber || "?"} Feedback
              </button>
            )}
          </div>
        </div>

        {/* Feedback Encouragement Banner */}
        <div className="rounded-2xl bg-[#EFECE2]/70 p-4 border border-[#203B35]/8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#203B35]">
            <Sparkles className="w-3.5 h-3.5 text-[#203B35]" />
            <span>CreativeSpace Feedback Philosophy</span>
          </div>
          <p className="text-xs text-[#5D635F] leading-relaxed">
            Thoughtful critique helps works flourish. Frame comments with respect, reference specific details (lighting, pacing, tonal balance), and offer constructive perspective.
          </p>

          {/* Prompt pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {feedbackPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() =>
                  setNewContent((prev) => (prev ? `${prev} · ${pill}` : pill))
                }
                className="text-[11px] font-mono bg-white hover:bg-[#FAF8F3] text-[#203B35] px-2.5 py-0.5 rounded-full border border-[#203B35]/10 transition-colors shadow-2xs"
              >
                + {pill}
              </button>
            ))}
          </div>
        </div>

        {/* New Comment Input Form */}
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0 mt-1">
              {session?.user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                session?.user?.name?.charAt(0) || "U"
              )}
            </div>

            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder={
                  isAuthenticated
                    ? activeScope === "version"
                      ? `Offer feedback on iteration v${selectedVersionNumber || ""}...`
                      : "Write constructive feedback or question for the creator..."
                    : "Sign in to join the conversation and offer constructive critique..."
                }
                className="w-full rounded-2xl border border-[#203B35]/15 bg-white p-3.5 text-xs sm:text-sm text-[#282B2A] placeholder:text-[#92958F] focus:border-[#203B35]/40 focus:outline-none focus:ring-1 focus:ring-[#203B35]/20 shadow-xs"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#92958F]">
                  Markdown formatting supported
                </span>

                <button
                  type="submit"
                  disabled={!newContent.trim() || isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-50 transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Posting..." : "Post Feedback"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {actionError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Comments List */}
        <div className="pt-4 border-t border-[#203B35]/10 space-y-6">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-[#5D635F]">
              <div className="animate-spin inline-block w-5 h-5 border-2 border-[#203B35] border-t-transparent rounded-full mb-2" />
              <p>Loading creative discussions...</p>
            </div>
          ) : loadError ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs text-center space-y-2">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={fetchComments}
                className="text-xs font-semibold underline"
              >
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="h-12 w-12 rounded-full bg-[#EFECE2] text-[#203B35] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-[#203B35]">No comments yet</h4>
              <p className="text-xs text-[#5D635F] max-w-sm mx-auto">
                Be the first to start the conversation and leave constructive feedback for the creator.
              </p>
            </div>
          ) : (
            <div className="space-y-6 divide-y divide-[#203B35]/8">
              {comments.map((comment) => {
                const isAuthor = currentUserId === comment.authorId;
                const canManage = isAuthor || isAdmin;
                const isReplying = replyingToId === comment.id;
                const isEditing = editingId === comment.id;

                return (
                  <div key={comment.id} className="pt-6 first:pt-0 space-y-3">
                    {/* Top-Level Comment Item */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <Link
                          href={`/profile/${comment.author.username}`}
                          className="h-8 w-8 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0 mt-0.5"
                        >
                          {comment.author.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={comment.author.avatarUrl}
                              alt={comment.author.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <CreatorAvatar
                              name={comment.author.displayName}
                              initials={comment.author.displayName.slice(0, 2).toUpperCase()}
                              tone="#203B35"
                              accent="#C8BDE0"
                              size="xs"
                            />
                          )}
                        </Link>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/profile/${comment.author.username}`}
                              className="text-xs font-bold text-[#203B35] hover:underline truncate"
                            >
                              {comment.author.displayName}
                            </Link>
                            <span className="text-[11px] font-mono text-[#92958F]">
                              @{comment.author.username}
                            </span>
                            <span className="text-[10px] text-[#203B35]/20">•</span>
                            <span className="text-[10px] font-mono text-[#92958F]">
                              {formatRelativeDate(comment.createdAt)}
                            </span>
                          </div>

                          {/* Comment Content or Edit Form */}
                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                rows={2}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full rounded-xl border border-[#203B35]/20 bg-white p-2.5 text-xs text-[#282B2A] focus:outline-none"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isSavingEdit}
                                  onClick={() => handleSaveEdit(comment.id)}
                                  className="px-3 py-1 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-1 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm text-[#282B2A] leading-relaxed whitespace-pre-line">
                              {comment.content}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Comment Actions (Edit / Delete) */}
                      {canManage && !isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditContent(comment.content);
                              }}
                              className="p-1 text-[#92958F] hover:text-[#203B35]"
                              title="Edit comment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 text-[#92958F] hover:text-rose-600"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Interaction Row (Like & Reply Toggle) */}
                    <div className="pl-11 flex items-center gap-3 text-xs">
                      {/* Like button */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(comment.id, comment.hasLiked)}
                        className={`inline-flex items-center gap-1 font-mono transition-colors ${
                          comment.hasLiked
                            ? "text-[#E85D3F] font-semibold"
                            : "text-[#5D635F] hover:text-[#203B35]"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            comment.hasLiked ? "fill-current" : ""
                          }`}
                        />
                        <span>{comment.likeCount || 0}</span>
                      </button>

                      {/* Reply button */}
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(isReplying ? null : comment.id);
                          setReplyContent("");
                        }}
                        className="inline-flex items-center gap-1 text-[#5D635F] hover:text-[#203B35] transition-colors"
                      >
                        <CornerDownRight className="w-3 h-3" />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Inline Reply Input Form */}
                    {isReplying && (
                      <div className="ml-11 mt-3 pl-3 border-l-2 border-[#9DB5A5]/50 space-y-2">
                        <textarea
                          rows={2}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to @${comment.author.username}...`}
                          className="w-full rounded-xl border border-[#203B35]/15 bg-white p-2.5 text-xs text-[#282B2A] focus:outline-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!replyContent.trim() || isSubmittingReply}
                            onClick={() => handleSubmitReply(comment.id)}
                            className="px-3.5 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-50"
                          >
                            {isSubmittingReply ? "Replying..." : "Send Reply"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setReplyingToId(null)}
                            className="px-3 py-1.5 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Nested Replies List (1-Level Indented) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-11 mt-3 space-y-3 pl-3 border-l-2 border-[#9DB5A5]/35">
                        {comment.replies.map((reply) => {
                          const isReplyAuthor = currentUserId === reply.authorId;
                          const canManageReply = isReplyAuthor || isAdmin;

                          return (
                            <div key={reply.id} className="space-y-1.5 pt-2 first:pt-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Link
                                    href={`/profile/${reply.author.username}`}
                                    className="h-6 w-6 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center text-[10px] font-semibold overflow-hidden shrink-0"
                                  >
                                    {reply.author.avatarUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={reply.author.avatarUrl}
                                        alt={reply.author.displayName}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      reply.author.displayName.charAt(0)
                                    )}
                                  </Link>
                                  <Link
                                    href={`/profile/${reply.author.username}`}
                                    className="text-xs font-bold text-[#203B35] hover:underline truncate"
                                  >
                                    {reply.author.displayName}
                                  </Link>
                                  <span className="text-[10px] font-mono text-[#92958F]">
                                    @{reply.author.username}
                                  </span>
                                  <span className="text-[10px] font-mono text-[#92958F]">
                                    · {formatRelativeDate(reply.createdAt)}
                                  </span>
                                </div>

                                {canManageReply && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="p-1 text-[#92958F] hover:text-rose-600"
                                    title="Delete reply"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              <p className="text-xs text-[#282B2A] pl-8 leading-relaxed">
                                {reply.content}
                              </p>

                              <div className="pl-8 flex items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleLike(reply.id, reply.hasLiked)
                                  }
                                  className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                                    reply.hasLiked
                                      ? "text-[#E85D3F] font-semibold"
                                      : "text-[#5D635F] hover:text-[#203B35]"
                                  }`}
                                >
                                  <Heart
                                    className={`w-3 h-3 ${
                                      reply.hasLiked ? "fill-current" : ""
                                    }`}
                                  />
                                  <span>{reply.likeCount || 0}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
