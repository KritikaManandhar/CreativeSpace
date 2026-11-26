"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, GitBranch, Heart, Sparkles, Layers } from "lucide-react";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { deriveInitials } from "@/data/mockProfiles";
import type { ExploreProjectItem } from "./exploreTypes";

interface ExploreProjectCardProps {
  project: ExploreProjectItem;
}

export function ExploreProjectCard({ project }: ExploreProjectCardProps) {
  const [liked, setLiked] = useState(false);
  const baseLikes = project.likesCount ?? 0;
  const currentLikes = baseLikes + (liked ? 1 : 0);

  const creatorName = project.creator.displayName || project.creator.username;
  const initials = deriveInitials(creatorName);

  return (
    <article className="group flex flex-col rounded-[16px] border border-[#203B35]/12 bg-[#FAF8F3] p-3.5 transition-all duration-300 hover:border-[#203B35]/25 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.28)]">
      {/* Artwork Media Frame */}
      <Link
        href={`/projects/${encodeURIComponent(project.id)}`}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[#EFECE2] border border-[#203B35]/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
        aria-label={`View project details for ${project.title}`}
      >
        {project.coverUrl ? (
          <Image
            src={project.coverUrl}
            alt={project.coverAlt || project.title}
            fill
            sizes="(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 32vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FAF8F3] via-[#EFECE2] to-[#FAF8F3]">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#F6F3EB] text-[#203B35]/70">
              <Layers className="h-5 w-5 text-[#9DB5A5]" />
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
              Artwork Canvas
            </p>
          </div>
        )}

        {/* Top-Left Discipline Tag */}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F6F3EB]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium text-[#203B35] border border-[#203B35]/10 shadow-sm">
          {project.discipline}
        </span>

        {/* Top-Right Version Badge */}
        {project.versionTag && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#203B35]/85 backdrop-blur-sm px-2.5 py-1 font-mono text-[10px] text-[#F6F3EB]">
            <GitBranch className="h-2.5 w-2.5 text-[#9DB5A5]" />
            <span>{project.versionTag}</span>
          </span>
        )}

        {/* Featured Ribbon Badge */}
        {project.isFeatured && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#FAF8F3]/95 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-[#203B35] border border-[#203B35]/10 shadow-sm">
            <Sparkles className="h-2.5 w-2.5 text-[#9DB5A5]" />
            <span>Featured</span>
          </span>
        )}

        {/* Subtle Hover Action Pill */}
        <div
          className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#203B35]/85 text-[#F6F3EB] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
          aria-hidden="true"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </Link>

      {/* Project Body */}
      <div className="mt-3.5 flex flex-1 flex-col justify-between px-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/projects/${encodeURIComponent(project.id)}`}
              className="text-left font-serif text-[1.35rem] leading-[1.2] text-[#203B35] group-hover:text-[#162A26] transition-colors focus:outline-none line-clamp-1"
            >
              {project.title}
            </Link>
          </div>

          {project.description && (
            <p className="mt-2 text-[13px] leading-[1.6] text-[#282B2A]/80 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#EFECE2]/85 px-2 py-0.5 font-mono text-[10.5px] text-[#5D635F]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Creator Attribution & Appreciation Footer */}
        <div className="mt-4 pt-3 border-t border-[#203B35]/10 flex items-center justify-between gap-2">
          <Link
            href={`/profile/${encodeURIComponent(project.creator.username)}`}
            className="flex items-center gap-2 min-w-0 group/creator focus:outline-none rounded-md py-0.5"
            aria-label={`View creator profile for ${creatorName}`}
          >
            <FeedAvatar
              avatarUrl={project.creator.avatarUrl}
              initials={initials}
              tone="#203B35"
              accent="#9DB5A5"
              name={creatorName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-[#203B35] truncate group-hover/creator:underline">
                {creatorName}
              </p>
              <p className="font-mono text-[10.5px] text-[#5D635F] truncate">
                @{project.creator.username}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setLiked((prev) => !prev)}
            aria-label={liked ? "Unlike project" : "Like project"}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
              liked
                ? "bg-[#203B35]/10 text-[#203B35] font-medium"
                : "text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35]"
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                liked ? "fill-[#203B35] text-[#203B35] scale-110" : "text-[#92958F]"
              }`}
            />
            <span className="tabular-nums font-mono text-[11px]">{currentLikes}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
