"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Check,
  CornerDownRight,
  GitBranch,
  Heart,
  MessageCircle,
  Send,
  Share2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { FeedCreatorSummary, FeedPostItem } from "@/data/mockFeed";
import { sanitizePreviewImageUrl } from "@/data/mockProfiles";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import {
  countPostDiscussionEntries,
  getFeedPostKindBadgeClass,
} from "@/components/feed/feedStyles";

export interface FeedPostCardProps {
  post: FeedPostItem;
  author: FeedCreatorSummary;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowingAuthor: boolean;
  isHighlighted?: boolean;
  priorityMedia?: boolean;
  likedCommentIds: Record<string, boolean>;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onToggleFollow: (username: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onAddReply: (postId: string, commentId: string, content: string) => void;
  onToggleCommentLike: (commentId: string) => void;
  onSelectTag?: (tag: string) => void;
  onSelectDiscipline?: (discipline: FeedPostItem["discipline"]) => void;
}

/**
 * Editorial community post card supporting visual artwork plates, thoughtful typography-first notes,
 * profile navigation, bookmarking, sharing, and nested local comment threads.
 */
export function FeedPostCard({
  post,
  author,
  isLiked,
  isBookmarked,
  isFollowingAuthor,
  isHighlighted = false,
  priorityMedia = false,
  likedCommentIds,
  onToggleLike,
  onToggleBookmark,
  onToggleFollow,
  onAddComment,
  onAddReply,
  onToggleCommentLike,
  onSelectTag,
  onSelectDiscipline,
}: FeedPostCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [activeReplyTargetId, setActiveReplyTargetId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sharedRecently, setSharedRecently] = useState(false);
  const [mediaFailed, setMediaFailed] = useState(false);

  const safeImageUrl = !mediaFailed ? sanitizePreviewImageUrl(post.imageUrl) : null;
  const isLocalStaticAsset = Boolean(safeImageUrl && safeImageUrl.startsWith("/images/"));
  const displayLikes = post.likeCount + (isLiked ? 1 : 0);
  const discussionCount = countPostDiscussionEntries(post.comments);

  useEffect(() => {
    setMediaFailed(false);
  }, [post.imageUrl]);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = commentDraft.trim();
    if (!cleaned) return;
    onAddComment(post.id, cleaned);
    setCommentDraft("");
    setCommentsOpen(true);
  };

  const handleSubmitReply = (commentId: string) => {
    const cleaned = (replyDrafts[commentId] || "").trim();
    if (!cleaned) return;
    onAddReply(post.id, commentId, cleaned);
    setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    setActiveReplyTargetId(null);
  };

  const handleShare = async () => {
    const sharePath =
      typeof window !== "undefined"
        ? `${window.location.origin}/profile/${author.username}#${post.id}`
        : `/profile/${author.username}#${post.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(sharePath);
      }
    } catch {
      // Clipboard may be restricted in headless/HTTP contexts
    }
    setSharedRecently(true);
    window.setTimeout(() => setSharedRecently(false), 2000);
  };

  return (
    <article
      id={`feed-post-${post.id}`}
      className={`group rounded-[22px] border bg-[#FAF8F3] p-5 sm:p-6 transition-all duration-300 ${
        isHighlighted
          ? "border-[#203B35] ring-2 ring-[#9DB5A5]/55 shadow-[0_22px_52px_-24px_rgba(32,59,53,0.3)]"
          : "border-[#203B35]/14 hover:border-[#203B35]/30 hover:shadow-[0_20px_46px_-24px_rgba(32,59,53,0.2)]"
      }`}
    >
      {/* Top Row: Creator Identity + Post Metadata */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/profile/${encodeURIComponent(author.username)}`}
            aria-label={`Open ${author.displayName}'s profile`}
            className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/50"
          >
            <FeedAvatar
              avatarUrl={author.avatarUrl}
              initials={author.initials}
              tone={author.avatarTone}
              accent={author.avatarAccent}
              name={author.displayName}
              size="md"
            />
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                href={`/profile/${encodeURIComponent(author.username)}`}
                className="text-[14.5px] font-semibold text-[#203B35] hover:underline underline-offset-4 decoration-[#9DB5A5] truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded"
              >
                {author.displayName}
              </Link>
              <Link
                href={`/profile/${encodeURIComponent(author.username)}`}
                className="font-mono text-[11.5px] text-[#5D635F] hover:text-[#203B35] transition-colors truncate"
              >
                @{author.username}
              </Link>
              <span className="hidden sm:inline text-[#9DB5A5]" aria-hidden="true">
                ·
              </span>
              <span className="hidden sm:inline font-mono text-[11px] text-[#5D635F]">
                {post.createdAt}
              </span>
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[#5D635F]">
              <span className="truncate max-w-[260px]">{author.headline}</span>
              <span className="sm:hidden text-[#9DB5A5]" aria-hidden="true">
                ·
              </span>
              <span className="sm:hidden font-mono text-[11px]">{post.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Post Type, Discipline & Subtle Follow Action */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${getFeedPostKindBadgeClass(
              post.kind
            )}`}
          >
            {post.kind}
          </span>

          <button
            type="button"
            onClick={() => onSelectDiscipline?.(post.discipline)}
            className="inline-flex items-center rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-2.5 py-0.5 text-[11px] font-medium text-[#203B35] hover:border-[#203B35]/35 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            {post.discipline}
          </button>

          <button
            type="button"
            onClick={() => onToggleFollow(author.username)}
            aria-pressed={isFollowingAuthor}
            aria-label={
              isFollowingAuthor ? `Unfollow ${author.displayName}` : `Follow ${author.displayName}`
            }
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
              isFollowingAuthor
                ? "bg-[#EFECE2] text-[#203B35] border border-[#203B35]/15"
                : "border border-[#203B35]/20 bg-transparent text-[#203B35] hover:bg-[#203B35] hover:text-[#F6F3EB]"
            }`}
          >
            {isFollowingAuthor ? (
              <>
                <UserCheck className="h-3 w-3 text-[#4E9F76]" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3" />
                <span>Follow</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Project Reference Pill (when linked to a work-in-progress or portfolio project) */}
      {post.projectRef && (
        <div className="mt-3.5">
          <Link
            href={`/profile/${encodeURIComponent(author.username)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-3 py-1 font-mono text-[11px] text-[#203B35] hover:border-[#203B35]/30 transition-colors"
          >
            <GitBranch className="h-3 w-3 text-[#9DB5A5]" />
            <span className="truncate max-w-[260px] sm:max-w-[380px]">
              {post.projectRef.title}
              {post.projectRef.versionTag ? ` · ${post.projectRef.versionTag}` : ""}
            </span>
          </Link>
        </div>
      )}

      {/* Editorial Body Copy */}
      <div className="mt-3.5 space-y-2.5">
        {post.title && (
          <h2 className="font-serif text-[1.45rem] sm:text-[1.72rem] font-normal leading-[1.16] tracking-[-0.015em] text-[#203B35]">
            {post.title}
          </h2>
        )}

        <p className="text-[14.5px] sm:text-[15px] leading-[1.72] text-[#282B2A]/90">
          {post.content}
        </p>

        {/* Quiet typographic pull-note for text-focused writing & critique posts */}
        {!safeImageUrl && post.excerptQuote && (
          <blockquote className="mt-3.5 rounded-r-2xl border-l-[3px] border-[#9DB5A5] bg-[#F6F3EB] px-4.5 py-3.5 font-serif italic text-[17px] sm:text-[18px] leading-[1.5] text-[#203B35] shadow-[0_2px_8px_-4px_rgba(32,59,53,0.06)]">
            &ldquo;{post.excerptQuote}&rdquo;
          </blockquote>
        )}
      </div>

      {/* Gallery-Framed Media Plate (when post has visual media) */}
      {safeImageUrl && (
        <div className="mt-4 rounded-[18px] border border-[#203B35]/14 bg-[#F6F3EB]/90 p-2 sm:p-2.5 shadow-[inset_0_1px_4px_rgba(32,59,53,0.05)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[12px] bg-[#EFECE2]">
            {isLocalStaticAsset ? (
              <Image
                src={safeImageUrl}
                alt={post.imageAlt || post.title || `${author.displayName}'s creative work`}
                fill
                priority={priorityMedia}
                sizes="(max-width: 1024px) 94vw, 760px"
                onError={() => setMediaFailed(true)}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={safeImageUrl}
                alt={post.imageAlt || post.title || `${author.displayName}'s creative work`}
                onError={() => setMediaFailed(true)}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.018]"
              />
            )}
          </div>
          {post.imageAlt && (
            <div className="pt-2 px-1.5 flex items-center justify-between gap-3 font-mono text-[11px] text-[#5D635F]">
              <p className="truncate">{post.imageAlt}</p>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-[#92958F]">
                Plate · {post.discipline}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hashtags / Craft Metadata */}
      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectTag?.(tag)}
              className="rounded-md bg-[#EFECE2]/85 px-2.5 py-0.5 font-mono text-[10.5px] text-[#5D635F] hover:bg-[#9DB5A5]/25 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Post Actions Footer */}
      <div className="mt-4 pt-3.5 border-t border-[#203B35]/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onToggleLike(post.id)}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Unlike post" : "Appreciate post"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
              isLiked
                ? "bg-[#203B35]/10 text-[#203B35] font-medium"
                : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                isLiked ? "fill-[#203B35] text-[#203B35] scale-110" : ""
              }`}
            />
            <span className="tabular-nums">{displayLikes}</span>
            <span className="hidden sm:inline text-[12px]">Appreciate</span>
          </button>

          <button
            type="button"
            onClick={() => setCommentsOpen((prev) => !prev)}
            aria-expanded={commentsOpen}
            aria-label={commentsOpen ? "Hide comments" : "Open comments"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
              commentsOpen
                ? "bg-[#EFECE2] text-[#203B35] font-medium"
                : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
            }`}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="tabular-nums">{discussionCount}</span>
            <span>{discussionCount === 1 ? "Comment" : "Comments"}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share post link"
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            {sharedRecently ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#4E9F76]" />
                <span className="font-medium text-[#203B35]">Link copied</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(post.id)}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
              isBookmarked
                ? "bg-[#203B35] text-[#F6F3EB]"
                : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* Expandable Comments & Nested Replies Section */}
      <AnimatePresence initial={false}>
        {commentsOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden border-t border-[#203B35]/10 mt-3.5 pt-4 space-y-3.5"
          >
            <div className="flex items-center justify-between text-[11px] font-mono text-[#5D635F]">
              <span className="uppercase tracking-[0.14em]">Studio Discussion</span>
              <span>Local session preview · not saved permanently</span>
            </div>

            {post.comments.length > 0 ? (
              <div className="space-y-3">
                {post.comments.map((comment) => {
                  const isCommentLiked = Boolean(likedCommentIds[comment.id]);
                  const commentLikes = comment.likeCount + (isCommentLiked ? 1 : 0);
                  const replyInputOpen = activeReplyTargetId === comment.id;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start gap-2.5">
                        <Link
                          href={`/profile/${encodeURIComponent(comment.authorHandle)}`}
                          className="shrink-0 mt-0.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                        >
                          <FeedAvatar
                            avatarUrl={comment.avatarUrl}
                            initials={comment.initials}
                            tone={comment.tone}
                            accent={comment.accent}
                            name={comment.authorName}
                            size="xs"
                          />
                        </Link>

                        <div className="min-w-0 flex-1 text-[13px]">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <Link
                              href={`/profile/${encodeURIComponent(comment.authorHandle)}`}
                              className="font-medium text-[#203B35] hover:underline"
                            >
                              {comment.authorName}
                            </Link>
                            <Link
                              href={`/profile/${encodeURIComponent(comment.authorHandle)}`}
                              className="font-mono text-[11px] text-[#5D635F] hover:text-[#203B35]"
                            >
                              @{comment.authorHandle}
                            </Link>
                            <span className="text-[#9DB5A5]" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-[11px] text-[#5D635F]">
                              {comment.createdAt}
                            </span>
                          </div>

                          <p className="mt-1 text-[#282B2A]/90 leading-relaxed">
                            {comment.content}
                          </p>

                          {/* Comment Micro-Actions */}
                          <div className="mt-2 flex items-center gap-3 text-[11.5px]">
                            <button
                              type="button"
                              onClick={() => onToggleCommentLike(comment.id)}
                              aria-pressed={isCommentLiked}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
                                isCommentLiked
                                  ? "bg-[#203B35]/10 text-[#203B35] font-medium"
                                  : "text-[#5D635F] hover:text-[#203B35]"
                              }`}
                            >
                              <Heart
                                className={`h-3 w-3 ${isCommentLiked ? "fill-[#203B35]" : ""}`}
                              />
                              <span className="tabular-nums">{commentLikes}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveReplyTargetId((prev) =>
                                  prev === comment.id ? null : comment.id
                                )
                              }
                              className="inline-flex items-center gap-1 text-[#5D635F] hover:text-[#203B35] font-medium transition-colors"
                            >
                              <CornerDownRight className="h-3 w-3" />
                              <span>{replyInputOpen ? "Cancel" : "Reply"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested Replies */}
                      {comment.replies.length > 0 && (
                        <div className="ml-6 sm:ml-8 pl-3 border-l border-[#203B35]/15 space-y-2">
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              className="flex items-start gap-2 rounded-lg bg-[#FAF8F3] p-2.5 border border-[#203B35]/8"
                            >
                              <Link
                                href={`/profile/${encodeURIComponent(reply.authorHandle)}`}
                                className="shrink-0 mt-0.5 rounded-full"
                              >
                                <FeedAvatar
                                  avatarUrl={reply.avatarUrl}
                                  initials={reply.initials}
                                  tone={reply.tone}
                                  accent={reply.accent}
                                  name={reply.authorName}
                                  size="xs"
                                />
                              </Link>
                              <div className="min-w-0 flex-1 text-[12.5px]">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Link
                                    href={`/profile/${encodeURIComponent(reply.authorHandle)}`}
                                    className="font-medium text-[#203B35] hover:underline"
                                  >
                                    {reply.authorName}
                                  </Link>
                                  <span className="font-mono text-[10.5px] text-[#5D635F]">
                                    @{reply.authorHandle}
                                  </span>
                                  <span className="text-[10.5px] text-[#5D635F]">
                                    · {reply.createdAt}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[#282B2A]/85 leading-relaxed">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Inline Reply Input */}
                      {replyInputOpen && (
                        <div className="ml-6 sm:ml-8 flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={`Reply to ${comment.authorName}...`}
                            value={replyDrafts[comment.id] || ""}
                            onChange={(e) =>
                              setReplyDrafts((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSubmitReply(comment.id);
                              }
                            }}
                            aria-label={`Reply to ${comment.authorName}`}
                            className="flex-1 h-8 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 text-[12.5px] text-[#282B2A] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                          />
                          <button
                            type="button"
                            onClick={() => handleSubmitReply(comment.id)}
                            aria-label="Post reply"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
                          >
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[13px] text-[#5D635F] italic font-serif">
                No comments yet — share your perspective with {author.displayName}.
              </p>
            )}

            {/* Add Top-Level Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add a thoughtful comment or critique note..."
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                aria-label={`Add a comment on ${post.title || `${author.displayName}'s post`}`}
                className="flex-1 h-10 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-4 text-[13px] text-[#282B2A] placeholder:text-[#92958F] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
              <button
                type="submit"
                aria-label="Submit comment"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#203B35] px-4 text-[12.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Comment</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
