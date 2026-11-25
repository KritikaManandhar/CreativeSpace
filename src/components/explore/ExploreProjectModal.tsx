"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  Heart,
  Bookmark,
  ExternalLink,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  Share2,
} from "lucide-react";
import { CreatorAvatar, CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ExploreProject } from "./exploreData";

interface ExploreProjectModalProps {
  project: ExploreProject | null;
  onClose: () => void;
  onToggleLike: (projectId: string, e: React.MouseEvent) => void;
  onToggleBookmark: (projectId: string, e: React.MouseEvent) => void;
  onFollowCreator?: (creatorId: string) => void;
  isFollowingCreator?: boolean;
}

export function ExploreProjectModal({
  project,
  onClose,
  onToggleLike,
  onToggleBookmark,
  onFollowCreator,
  isFollowingCreator,
}: ExploreProjectModalProps) {
  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (project) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#FAF8F3] rounded-3xl border border-[#203B35]/20 shadow-2xl overflow-hidden z-10 my-auto flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center transition-colors backdrop-blur-md"
          aria-label="Close project view"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: High-Res Artwork Panel */}
        <div className="relative w-full md:w-3/5 bg-[#162A26] flex items-center justify-center min-h-[300px] sm:min-h-[420px] md:min-h-[520px] overflow-hidden">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain p-2 sm:p-4"
            priority
          />
        </div>

        {/* Right: Editorial Information & Actions */}
        <div className="w-full md:w-2/5 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[50vh] md:max-h-[85vh] bg-[#FAF8F3]">
          <div>
            {/* Category & Edition Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFECE2] text-[10.5px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10">
                <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
                {project.category}
              </span>
              {project.editionNote && (
                <span className="text-[11px] font-mono text-[#5D635F]">
                  {project.editionNote}
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-serif text-[#203B35] font-normal leading-tight">
              {project.title}
            </h2>

            {/* Creator Row */}
            <div className="mt-5 p-3.5 rounded-2xl bg-[#EFECE2]/70 border border-[#203B35]/10 flex items-center justify-between gap-3">
              <Link
                href={`/profile/${project.creator.username}`}
                onClick={onClose}
                className="flex items-center gap-2.5 min-w-0 group"
              >
                {project.creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.creator.avatarUrl}
                    alt={project.creator.displayName}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-[#203B35]/20"
                  />
                ) : (
                  <CreatorAvatar
                    initials={project.creator.avatarInitials}
                    tone={project.creator.avatarTone}
                    accent={project.creator.avatarAccent}
                    name={project.creator.displayName}
                    size="sm"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#203B35] group-hover:underline truncate">
                    {project.creator.displayName}
                  </p>
                  <p className="text-[11px] text-[#5D635F] truncate">
                    {project.creator.specialty}
                  </p>
                </div>
              </Link>

              {onFollowCreator && (
                <button
                  type="button"
                  onClick={() => onFollowCreator(project.creator.id)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors shrink-0 ${
                    isFollowingCreator
                      ? "bg-[#203B35]/10 text-[#203B35] border border-[#203B35]/20"
                      : "bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26]"
                  }`}
                >
                  {isFollowingCreator ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* Description */}
            <div className="mt-5">
              <h4 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold mb-1.5">
                About this Work
              </h4>
              <p className="text-sm text-[#282B2A]/85 leading-relaxed font-sans">
                {project.description ||
                  "A curated creative exploration produced in the CreativeSpace studio, representing experimental craftsmanship and editorial discipline."}
              </p>
            </div>

            {/* Tags */}
            <div className="mt-5 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono text-[#5D635F] bg-[#EFECE2] px-2.5 py-1 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Stats Bar */}
            <div className="mt-6 pt-4 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F] font-mono">
              <div className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#E85D3F]" />
                <span>{project.likes} appreciates</span>
              </div>
              {project.views && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{project.views.toLocaleString()} views</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{project.publishedAt}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-[#203B35]/10 flex items-center gap-2.5">
            <button
              type="button"
              onClick={(e) => onToggleLike(project.id, e)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-medium border transition-colors ${
                project.hasLiked
                  ? "bg-[#E85D3F]/12 text-[#E85D3F] border-[#E85D3F]/30 font-semibold"
                  : "bg-white text-[#203B35] border-[#203B35]/15 hover:border-[#203B35]/30"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  project.hasLiked ? "text-[#E85D3F] fill-current" : "text-[#5D635F]"
                }`}
              />
              <span>{project.hasLiked ? "Appreciated" : "Appreciate"}</span>
            </button>

            <button
              type="button"
              onClick={(e) => onToggleBookmark(project.id, e)}
              className={`p-2.5 rounded-full border transition-colors ${
                project.hasBookmarked
                  ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35]"
                  : "bg-white text-[#203B35] border-[#203B35]/15 hover:border-[#203B35]/30"
              }`}
              title={project.hasBookmarked ? "Remove bookmark" : "Save project"}
              aria-label="Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${project.hasBookmarked ? "fill-current" : ""}`} />
            </button>

            <Link
              href={`/projects/${project.id}`}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-sm"
            >
              <span>Full Project</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#9DB5A5]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
