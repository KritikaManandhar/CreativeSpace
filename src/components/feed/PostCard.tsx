"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  MoreHorizontal,
  Check,
  Plus,
  Play,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flag,
  Copy,
  Briefcase,
  Sparkles,
  Pencil,
} from "lucide-react";
import { PostCommentsDrawer } from "./PostCommentsDrawer";

export interface FeedPostData {
  id: string;
  type?: string;
  summary?: string;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    disciplines: string[];
    isFollowing: boolean;
  };
  project: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    status: string; // "Idea" | "InProgress" | "InReview" | "Completed"
    previewImageUrl: string | null;
    likeCount: number;
    commentCount: number;
    hasLiked: boolean;
    tags?: string[];
    mediaType?: "image" | "gallery" | "video";
    galleryImages?: string[];
    videoDuration?: string;
  };
  version?: {
    id: string;
    versionNumber: number;
    status: string;
  } | null;
}

interface PostCardProps {
  post: FeedPostData;
  onToggleLike: (projectId: string) => Promise<void>;
  onToggleFollow: (creatorId: string, currentlyFollowing: boolean) => Promise<void>;
  onToggleSave: (projectId: string) => void;
  isSaved?: boolean;
  isLikeBusy?: boolean;
  isFollowBusy?: boolean;
  onCopyShareLink?: (title: string, url: string) => void;
  index?: number;
}

function formatRelativeDate(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "Recently";
  }
}

export function PostCard({
  post,
  onToggleLike,
  onToggleFollow,
  onToggleSave,
  isSaved = false,
  isLikeBusy = false,
  isFollowBusy = false,
  onCopyShareLink,
  index = 0,
}: PostCardProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const isOwnPost = currentUserId === post.actor.id;

  // Local state for comments drawer & menus
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.project.commentCount);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Derive status badge
  const isFinal =
    post.version?.status === "Final" ||
    post.project.status === "Completed" ||
    post.type === "VersionFinalized";
  const isInProgress =
    post.project.status === "InProgress" ||
    post.project.status === "InReview" ||
    post.type === "VersionPublished";
  const isDraft =
    post.project.status === "Idea" || post.version?.status === "Draft";

  // Gallery images support
  const galleryImages =
    post.project.galleryImages ||
    (post.project.previewImageUrl ? [post.project.previewImageUrl] : []);
  const hasMultipleImages = galleryImages.length > 1;

  // Aspect ratio variations for editorial masonry feel
  const aspectClass =
    index % 3 === 0
      ? "aspect-[4/5]"
      : index % 3 === 1
      ? "aspect-[16/10]"
      : "aspect-[1/1]";

  const currentMediaUrl =
    galleryImages[galleryIndex] || post.project.previewImageUrl;

  const handleShareClick = () => {
    const url = `${window.location.origin}/projects/${post.project.id}`;
    if (onCopyShareLink) {
      onCopyShareLink(post.project.title, url);
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  return (
    <article className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/12 p-4 sm:p-5 shadow-[0_2px_8px_rgba(32,59,53,0.03)] hover:border-[#203B35]/25 transition-all group">
      {/* ============================================================ */}
      {/* 1. CREATOR INFORMATION HEADER                                */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/profile/${post.actor.username}`}
            className="flex items-center gap-2.5 min-w-0 group/creator focus:outline-none"
          >
            <div className="h-9 w-9 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0 ring-1 ring-[#203B35]/15">
              {post.actor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.actor.avatarUrl}
                  alt={post.actor.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                post.actor.displayName.charAt(0) || "C"
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-[#203B35] group-hover/creator:text-[#162A26] truncate">
                  {post.actor.displayName}
                </span>
                {/* Stage Indicator Badge */}
                {isFinal && (
                  <span className="rounded-full bg-[#203B35]/10 px-2 py-0.2 text-[9.5px] font-mono font-semibold text-[#203B35] tracking-wide shrink-0">
                    FINAL
                  </span>
                )}
                {isInProgress && !isFinal && (
                  <span className="rounded-full bg-[#C8BDE0]/40 px-2 py-0.2 text-[9.5px] font-mono font-semibold text-[#203B35] tracking-wide shrink-0">
                    IN PROGRESS
                  </span>
                )}
                {isDraft && !isInProgress && !isFinal && (
                  <span className="rounded-full bg-[#EFECE2] px-2 py-0.2 text-[9.5px] font-mono text-[#5D635F] tracking-wide shrink-0">
                    CONCEPT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#5D635F] truncate">
                @{post.actor.username} · {formatRelativeDate(post.createdAt)}
              </p>
            </div>
          </Link>
        </div>

        {/* Top Right: Follow Button & More Options */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOwnPost && (
            <button
              type="button"
              disabled={isFollowBusy}
              onClick={() => onToggleFollow(post.actor.id, post.actor.isFollowing)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                post.actor.isFollowing
                  ? "bg-[#EFECE2] text-[#203B35] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-[#203B35]/15"
                  : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26] shadow-sm"
              }`}
            >
              {isFollowBusy ? (
                <span className="animate-spin text-[10px]">···</span>
              ) : post.actor.isFollowing ? (
                <>
                  <Check className="h-2.5 w-2.5" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Plus className="h-2.5 w-2.5" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}

          {/* More Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded-full text-[#92958F] hover:text-[#203B35] hover:bg-[#EFECE2] transition-colors"
              aria-label="Post options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#FAF8F3] border border-[#203B35]/15 py-1 shadow-xl z-30">
                <Link
                  href={`/projects/${post.project.id}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-[#5D635F]" />
                  <span>View Project</span>
                </Link>
                {(isOwnPost || session?.user?.isAdmin) && (
                  <Link
                    href={`/projects/${post.project.id}/edit`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#203B35] font-semibold hover:bg-[#EFECE2] transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#203B35]" />
                    <span>Edit Work</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleShareClick();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[#282B2A] hover:bg-[#EFECE2] transition-colors"
                >
                  <Copy className="h-3.5 w-3.5 text-[#5D635F]" />
                  <span>Copy Link</span>
                </button>
                <div className="border-t border-[#203B35]/10 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    alert("Thank you. Content flagged for editorial review.");
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50 transition-colors"
                >
                  <Flag className="h-3.5 w-3.5" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CREATIVE MEDIA ARTWORK FRAME                              */}
      {/* ============================================================ */}
      {currentMediaUrl ? (
        <div className="relative w-full overflow-hidden rounded-xl bg-[#EFECE2] border border-[#203B35]/10 group/media">
          <Link
            href={`/projects/${post.project.id}`}
            className={`relative block w-full overflow-hidden ${aspectClass} focus:outline-none`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentMediaUrl}
              alt={post.project.title}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/media:scale-[1.03]"
              loading="lazy"
            />
          </Link>

          {/* Top-left category tag badge */}
          <div className="absolute top-3 left-3 pointer-events-none">
            <span className="inline-flex items-center rounded-full bg-[#FAF8F3]/92 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium tracking-[0.03em] text-[#203B35] border border-[#203B35]/12 shadow-sm">
              {post.project.category}
            </span>
          </div>

          {/* Video Preview Indicator */}
          {post.project.mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-12 w-12 rounded-full bg-[#203B35]/85 backdrop-blur-sm flex items-center justify-center text-[#F6F3EB] shadow-lg transition-transform group-hover/media:scale-110">
                <Play className="h-5 w-5 fill-[#F6F3EB] ml-0.5" />
              </div>
            </div>
          )}

          {/* Multi-Image Gallery Controls & Counter */}
          {hasMultipleImages && (
            <>
              <div className="absolute top-3 right-3 pointer-events-none">
                <span className="rounded-full bg-[#203B35]/80 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono text-[#F6F3EB]">
                  {galleryIndex + 1} / {galleryImages.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FAF8F3]/90 text-[#203B35] flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity shadow-md hover:bg-white"
                aria-label="Previous artwork image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-[#FAF8F3]/90 text-[#203B35] flex items-center justify-center opacity-0 group-hover/media:opacity-100 transition-opacity shadow-md hover:bg-white"
                aria-label="Next artwork image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ) : null}

      {/* ============================================================ */}
      {/* 3. POST DETAILS & CAPTION                                    */}
      {/* ============================================================ */}
      <div className="mt-3.5 space-y-1.5">
        <Link
          href={`/projects/${post.project.id}`}
          className="block text-base sm:text-lg font-bold tracking-tight text-[#203B35] hover:text-[#162A26] transition-colors"
        >
          {post.project.title}
        </Link>

        {post.project.description && (
          <p className="text-xs sm:text-sm text-[#282B2A]/85 leading-relaxed">
            {isDescExpanded
              ? post.project.description
              : `${post.project.description.slice(0, 140)}${
                  post.project.description.length > 140 ? "..." : ""
                }`}
            {post.project.description.length > 140 && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                className="ml-1.5 text-xs font-semibold text-[#203B35] hover:underline"
              >
                {isDescExpanded ? "less" : "more"}
              </button>
            )}
          </p>
        )}

        {/* Tags and Services Discovery Path */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {post.project.tags && post.project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-mono text-[#5D635F] hover:text-[#203B35] transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Subtle Services Discovery Path (Section 9) */}
          {post.actor.disciplines && post.actor.disciplines.length > 0 && (
            <Link
              href={`/profile/${post.actor.username}#services`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#203B35] hover:text-[#162A26] transition-colors ml-auto"
            >
              <Briefcase className="h-3 w-3 text-[#9DB5A5]" />
              <span>View Services</span>
            </Link>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. ENGAGEMENT TOOLBAR                                        */}
      {/* ============================================================ */}
      <div className="mt-4 pt-3 border-t border-[#203B35]/10 flex items-center justify-between">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Like Button */}
          <button
            type="button"
            disabled={isLikeBusy}
            onClick={() => onToggleLike(post.project.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              post.project.hasLiked
                ? "bg-rose-50 text-rose-700"
                : "text-[#5D635F] hover:text-rose-600 hover:bg-[#EFECE2]"
            }`}
            aria-label={post.project.hasLiked ? "Unlike post" : "Like post"}
          >
            <Heart
              className={`h-4 w-4 transition-transform active:scale-125 ${
                post.project.hasLiked ? "fill-rose-600 text-rose-600" : ""
              }`}
            />
            <span>{post.project.likeCount}</span>
          </button>

          {/* Comments Button */}
          <button
            type="button"
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isCommentsOpen
                ? "bg-[#203B35]/10 text-[#203B35]"
                : "text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2]"
            }`}
            aria-label="Discussion comments"
          >
            <MessageSquare className="h-4 w-4" />
            <span>{commentCount}</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={() => onToggleSave(post.project.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isSaved
                ? "bg-[#203B35] text-[#F6F3EB]"
                : "text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2]"
            }`}
            aria-label={isSaved ? "Saved to collection" : "Save post"}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>

        {/* Share Action */}
        <button
          type="button"
          onClick={handleShareClick}
          className="inline-flex items-center gap-1 p-2 rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2] transition-colors"
          aria-label="Share creative work"
          title="Share link"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 5. EXPANDABLE DISCUSSION DRAWER                              */}
      {/* ============================================================ */}
      <PostCommentsDrawer
        projectId={post.project.id}
        versionId={post.version?.id}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        onCommentAdded={() => setCommentCount((prev) => prev + 1)}
      />
    </article>
  );
}
