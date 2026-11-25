"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, X, CornerDownRight, Heart } from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likeCount?: number;
  hasLiked?: boolean;
}

interface PostCommentsDrawerProps {
  projectId: string;
  versionId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function PostCommentsDrawer({
  projectId,
  versionId,
  isOpen,
  onClose,
  onCommentAdded,
}: PostCommentsDrawerProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build comments query. For public feed posts, if versionId is available, scope to version
      const url = versionId
        ? `/api/projects/${projectId}/comments?scope=version&versionId=${versionId}`
        : `/api/projects/${projectId}/comments?scope=project`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.comments)) {
        setComments(json.data.comments);
      } else {
        // Fallback or empty
        setComments([]);
      }
    } catch {
      setError("Unable to load feedback thread.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, projectId, versionId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        content: newComment.trim(),
      };
      if (versionId) {
        payload.versionId = versionId;
      }

      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error?.message || "Failed to post comment.");
        return;
      }

      // Append newly posted comment
      const created = json.data;
      const formatted: CommentItem = {
        id: created.id,
        content: created.content,
        createdAt: created.createdAt || new Date().toISOString(),
        author: {
          id: session?.user?.id || created.authorId,
          username: session?.user?.username || "you",
          displayName: session?.user?.displayName || "You",
          avatarUrl: session?.user?.avatarUrl || null,
        },
        likeCount: 0,
        hasLiked: false,
      };

      setComments((prev) => [formatted, ...prev]);
      setNewComment("");
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch {
      setError("Network error while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-3 pt-3.5 border-t border-[#203B35]/10 animate-fade-up">
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[#203B35]" />
          <span className="text-xs font-bold text-[#203B35] font-mono uppercase tracking-wider">
            Discussion & Feedback
          </span>
          <span className="rounded-full bg-[#203B35]/10 px-1.5 py-0.2 text-[10px] font-mono text-[#203B35]">
            {comments.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[#92958F] hover:text-[#203B35] p-1 rounded transition-colors"
          aria-label="Close comments panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmitComment} className="flex gap-2 items-start mt-1 mb-3">
        <textarea
          rows={2}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share constructive feedback or celebrate this work..."
          className="flex-1 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15 p-2.5 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white resize-none"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="h-9 px-3.5 rounded-xl bg-[#203B35] text-[#F6F3EB] text-xs font-semibold hover:bg-[#162A26] disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 self-end"
        >
          {isSubmitting ? (
            <span className="animate-spin text-[10px]">···</span>
          ) : (
            <>
              <span>Post</span>
              <Send className="h-3 w-3 text-[#9DB5A5]" />
            </>
          )}
        </button>
      </form>

      {error && (
        <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mb-2">
          {error}
        </p>
      )}

      {/* Comments list */}
      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="py-4 text-center text-xs text-[#5D635F]">
            Loading discussion...
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-2.5 rounded-xl bg-[#FAF8F3] border border-[#203B35]/8 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px]">
                <Link
                  href={`/profile/${comment.author.username}`}
                  className="font-semibold text-[#203B35] hover:underline"
                >
                  {comment.author.displayName}
                </Link>
                <span className="text-[10px] text-[#92958F]">
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-xs text-[#282B2A]/90 leading-relaxed break-words">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-xs text-[#5D635F]">
            No feedback comments yet. Be the first to share an encouraging note!
          </div>
        )}
      </div>
    </div>
  );
}
