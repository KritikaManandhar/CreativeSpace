"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Bookmark, ArrowUpRight, Eye } from "lucide-react";
import { CreatorAvatar, CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ExploreProject } from "./exploreData";

interface ExploreProjectCardProps {
  project: ExploreProject;
  onSelectProject: (project: ExploreProject) => void;
  onToggleLike: (projectId: string, e: React.MouseEvent) => void;
  onToggleBookmark: (projectId: string, e: React.MouseEvent) => void;
}

export function ExploreProjectCard({
  project,
  onSelectProject,
  onToggleLike,
  onToggleBookmark,
}: ExploreProjectCardProps) {
  return (
    <article
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#FAF8F3] border border-[#203B35]/10 hover:border-[#203B35]/30 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${project.colSpanClass}`}
    >
      {/* Artwork Container (Clicking opens Quick View) */}
      <div
        onClick={() => onSelectProject(project)}
        className={`relative w-full overflow-hidden cursor-pointer ${project.aspectClass} bg-[#EFECE2]`}
      >
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />

        {/* Subtle gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top-left: Category tag */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
            <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
            {project.category}
          </span>
        </div>

        {/* Top-right: Bookmark action button */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => onToggleBookmark(project.id, e)}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md shadow-sm ${
              project.hasBookmarked
                ? "bg-[#203B35] text-[#FAF8F3]"
                : "bg-[#FAF8F3]/85 text-[#282B2A] hover:bg-white hover:text-[#203B35]"
            }`}
            aria-label={project.hasBookmarked ? "Remove bookmark" : "Bookmark project"}
            title={project.hasBookmarked ? "Bookmarked" : "Save to collection"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${project.hasBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Hover Center Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#203B35]/85 text-[#FAF8F3] text-xs font-medium tracking-wide shadow-lg backdrop-blur-sm">
            <Eye className="w-3.5 h-3.5 text-[#9DB5A5]" />
            <span>Quick View</span>
          </span>
        </div>

        {/* Bottom overlay: Edition / Medium note */}
        {project.editionNote && (
          <div className="absolute bottom-3 left-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[11px] text-[#FAF8F3] font-mono tracking-wide drop-shadow-md">
              {project.editionNote}
            </span>
          </div>
        )}
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          {/* Project Title */}
          <button
            type="button"
            onClick={() => onSelectProject(project)}
            className="text-left w-full focus:outline-none"
          >
            <h3 className="text-base sm:text-lg font-medium text-[#203B35] hover:text-[#162A26] font-serif leading-snug line-clamp-2 transition-colors">
              {project.title}
            </h3>
          </button>

          {/* Tags */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10.5px] font-mono text-[#5D635F] bg-[#EFECE2]/70 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Row: Creator info & Like button */}
        <div className="pt-2.5 border-t border-[#203B35]/8 flex items-center justify-between gap-2">
          {/* Creator Profile Link */}
          <Link
            href={`/profile/${project.creator.username}`}
            className="flex items-center gap-2 min-w-0 group/creator hover:opacity-85 transition-opacity"
            title={`View ${project.creator.displayName}'s profile`}
          >
            {project.creator.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.creator.avatarUrl}
                alt={project.creator.displayName}
                className="w-6 h-6 rounded-full object-cover ring-1 ring-[#203B35]/15"
              />
            ) : (
              <CreatorAvatar
                initials={project.creator.avatarInitials}
                tone={project.creator.avatarTone}
                accent={project.creator.avatarAccent}
                name={project.creator.displayName}
                size="xs"
              />
            )}
            <span className="text-xs font-medium text-[#282B2A] group-hover/creator:text-[#203B35] truncate max-w-[130px]">
              {project.creator.displayName}
            </span>
          </Link>

          {/* Interactive Like Button */}
          <button
            type="button"
            onClick={(e) => onToggleLike(project.id, e)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              project.hasLiked
                ? "bg-[#E85D3F]/12 text-[#E85D3F] font-semibold"
                : "text-[#5D635F] hover:text-[#203B35] hover:bg-[#203B35]/5"
            }`}
            aria-label={project.hasLiked ? "Unlike project" : "Like project"}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                project.hasLiked ? "text-[#E85D3F] fill-current" : "text-[#5D635F]"
              }`}
            />
            <span className="font-mono text-[11px]">{project.likes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
