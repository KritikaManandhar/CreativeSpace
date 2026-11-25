"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Copy,
  Check,
  Plus,
  GitBranch,
  Users,
  Award,
  Sparkles,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { CollaboratorRole, ProjectStatus, Visibility } from "./projectTypes";

interface ProjectSocialActionsProps {
  projectId: string;
  projectTitle: string;
  hasLiked: boolean;
  likeCount: number;
  commentCount: number;
  isBookmarked: boolean;
  userRole?: CollaboratorRole | null;
  status: ProjectStatus;
  visibility: Visibility;
  isPortfolioFeatured?: boolean;
  onToggleLike: () => Promise<void>;
  onToggleBookmark: () => void;
  onScrollToComments: () => void;
  onOpenUploadModal?: () => void;
  onOpenNewVersionModal?: () => void;
  onOpenInviteModal?: () => void;
  onPublishToPortfolio?: () => void;
  isPublishingPortfolio?: boolean;
}

export function ProjectSocialActions({
  projectId,
  projectTitle,
  hasLiked,
  likeCount,
  commentCount,
  isBookmarked,
  userRole,
  status,
  visibility,
  isPortfolioFeatured,
  onToggleLike,
  onToggleBookmark,
  onScrollToComments,
  onOpenUploadModal,
  onOpenNewVersionModal,
  onOpenInviteModal,
  onPublishToPortfolio,
  isPublishingPortfolio = false,
}: ProjectSocialActionsProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const isOwner = userRole === "Owner";
  const isCollaborator = userRole === "Collaborator";
  const isClientReviewer = userRole === "ClientReviewer";
  const isProjectMember = isOwner || isCollaborator || isClientReviewer;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onToggleLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${projectTitle} — CreativeSpace`,
          url: window.location.href,
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
        return;
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
        return;
      }
    }
    handleCopyLink();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 sm:p-4 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/12 shadow-[0_2px_12px_rgba(32,59,53,0.03)]">
        {/* Left: Community Social Interactions */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
          {/* 1. Appreciate / Like Button */}
          <button
            type="button"
            disabled={isLiking}
            onClick={handleLike}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border ${
              hasLiked
                ? "bg-[#E85D3F]/12 text-[#E85D3F] border-[#E85D3F]/30 shadow-sm"
                : "bg-white text-[#203B35] border-[#203B35]/15 hover:border-[#203B35]/35 hover:bg-[#FAF8F3]"
            }`}
            aria-label={hasLiked ? "Unlike project" : "Appreciate project"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                hasLiked ? "text-[#E85D3F] fill-current scale-110" : "text-[#5D635F]"
              }`}
            />
            <span className="font-mono text-xs">{likeCount}</span>
            <span className="hidden xs:inline">{hasLiked ? "Appreciated" : "Appreciate"}</span>
          </button>

          {/* 2. Feedback / Comments Jump Button */}
          <button
            type="button"
            onClick={onScrollToComments}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#203B35] border border-[#203B35]/15 hover:border-[#203B35]/35 hover:bg-[#FAF8F3] transition-all"
            aria-label="View critique and comments"
          >
            <MessageSquare className="w-4 h-4 text-[#5D635F]" />
            <span className="font-mono text-xs">{commentCount}</span>
            <span className="hidden xs:inline">Feedback</span>
          </button>

          {/* 3. Bookmark / Save Button */}
          <button
            type="button"
            onClick={onToggleBookmark}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all border ${
              isBookmarked
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-sm"
                : "bg-white text-[#203B35] border-[#203B35]/15 hover:border-[#203B35]/35 hover:bg-[#FAF8F3]"
            }`}
            title={isBookmarked ? "Saved in your collection" : "Save to collection"}
            aria-label="Save project"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{isBookmarked ? "Saved" : "Save"}</span>
          </button>

          {/* 4. Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium bg-white text-[#203B35] border border-[#203B35]/15 hover:border-[#203B35]/35 hover:bg-[#FAF8F3] transition-all"
            title="Share project"
            aria-label="Share project"
          >
            <Share2 className="w-3.5 h-3.5 text-[#5D635F]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* 5. Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-white text-[#5D635F] hover:text-[#203B35] border border-[#203B35]/15 hover:border-[#203B35]/35 transition-all"
            title="Copy link to clipboard"
            aria-label="Copy link"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-mono text-[11px]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Studio Creator & Collaborator Actions (if member) */}
        {isProjectMember && (
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 border-t sm:border-t-0 sm:border-l border-[#203B35]/10 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto">
            {/* Edit Project (Owner only) */}
            {isOwner && (
              <Link
                href={`/projects/${projectId}/edit`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-xs"
                title="Edit project details, media, and publishing settings"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Work</span>
              </Link>
            )}

            {/* Upload Asset */}
            {(isOwner || isCollaborator) && onOpenUploadModal && (
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium hover:bg-[#E5E1D5] transition-colors"
                title="Upload creative asset to workspace"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Asset</span>
              </button>
            )}

            {/* New Version */}
            {(isOwner || isCollaborator) && onOpenNewVersionModal && (
              <button
                type="button"
                onClick={onOpenNewVersionModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium hover:bg-[#E5E1D5] transition-colors"
                title="Create a new draft version iteration"
              >
                <GitBranch className="w-3.5 h-3.5 text-[#203B35]" />
                <span>New Iteration</span>
              </button>
            )}

            {/* Invite Collaborator */}
            {isOwner && onOpenInviteModal && (
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFECE2] text-[#203B35] text-xs font-medium hover:bg-[#E5E1D5] transition-colors"
                title="Invite creators or client reviewers"
              >
                <Users className="w-3.5 h-3.5 text-[#203B35]" />
                <span>Invite</span>
              </button>
            )}

            {/* Publish / Feature in Portfolio */}
            {isOwner && status === "Completed" && visibility === "Public" && onPublishToPortfolio && (
              <button
                type="button"
                disabled={isPortfolioFeatured || isPublishingPortfolio}
                onClick={onPublishToPortfolio}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isPortfolioFeatured
                    ? "bg-[#203B35]/10 text-[#203B35] font-semibold cursor-default"
                    : "bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] shadow-sm"
                }`}
                title="Feature this work in your public creator portfolio"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {isPublishingPortfolio
                    ? "Publishing..."
                    : isPortfolioFeatured
                    ? "In Portfolio"
                    : "Feature in Portfolio"}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
