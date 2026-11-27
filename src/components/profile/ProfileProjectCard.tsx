"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bookmark,
  GitBranch,
  Heart,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { sanitizeExternalUrl } from "@/lib/features/profile";

export interface ProfileProjectCollaborator {
  name: string;
  username: string;
  initials: string;
  tone: string;
  accent: string;
  role: string;
  avatarUrl?: string | null;
  url?: string | null;
  urlLabel?: string | null;
}

export interface ProfileProjectVersionSummary {
  id?: string;
  version: string;
  label: string;
  date: string;
  status: string;
  note: string;
}

export interface ProfileProjectCreatorSummary {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  disciplines?: string[];
}

export interface ProfileDisplayProject {
  id: string;
  title: string;
  description: string;
  discipline: string;
  status: "Idea" | "InProgress" | "InReview" | "Completed" | "Archived";
  versionTag: string;
  featured: boolean;
  coverUrl: string | null;
  coverAlt: string;
  tags: string[];
  tools: string[];
  updatedAt: string;
  createdAt?: string;
  metadata?: Record<string, unknown> | null;
  likeCount: number;
  commentCount: number;
  hasLiked?: boolean;
  collaborators: ProfileProjectCollaborator[];
  versions: ProfileProjectVersionSummary[];
  creator?: ProfileProjectCreatorSummary;
}

export function resolveSafeCardMediaUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const external = sanitizeExternalUrl(trimmed);
  if (external) return external;

  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.includes("..") &&
    !trimmed.includes("\\")
  ) {
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith("/images/") ||
      lower.startsWith("/uploads/") ||
      lower.startsWith("/assets/") ||
      lower.startsWith("/thumbnails/") ||
      lower.startsWith("/media/")
    ) {
      return trimmed;
    }
  }

  return null;
}

interface ProfileProjectCardProps {
  project: ProfileDisplayProject;
  onSelectProject: (project: ProfileDisplayProject) => void;
  isLiked?: boolean;
  isSaved?: boolean;
  onToggleLike?: (projectId: string) => void;
  onToggleSave?: (projectId: string) => void;
  readOnly?: boolean;
}

export function ProfileProjectCard({
  project,
  onSelectProject,
  isLiked = false,
  isSaved = false,
  onToggleLike,
  onToggleSave,
  readOnly = false,
}: ProfileProjectCardProps) {
  const safeCoverUrl = resolveSafeCardMediaUrl(project.coverUrl);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [safeCoverUrl]);

  const initialLiked = Boolean(project.hasLiked);
  const likesDelta = isLiked === initialLiked ? 0 : isLiked ? 1 : -1;
  const likesDisplay = Math.max(0, project.likeCount + likesDelta);

  return (
    <article className="group flex flex-col rounded-[16px] border border-[#203B35]/15 bg-[#FAF8F3] p-3.5 transition-all duration-300 hover:border-[#203B35]/30 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.3)]">
      {/* Artwork Thumbnail Trigger */}
      <button
        type="button"
        onClick={() => onSelectProject(project)}
        className="relative block aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[#EFECE2] border border-[#203B35]/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
        aria-label={`Open project details for ${project.title}`}
      >
        {safeCoverUrl && !imageFailed ? (
          <img
            src={safeCoverUrl}
            alt={project.coverAlt || project.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FAF8F3] via-[#EFECE2] to-[#FAF8F3]">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#F6F3EB] text-[#203B35]/70">
              <Layers className="h-5 w-5 text-[#9DB5A5]" />
            </div>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
              {project.discipline}
            </p>
          </div>
        )}

        {/* Discipline Tag */}
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F6F3EB]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium text-[#203B35] border border-[#203B35]/10">
          {project.discipline}
        </span>

        {/* Version / Status Badge */}
        {project.versionTag && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#203B35]/85 backdrop-blur-sm px-2.5 py-1 font-mono text-[10px] text-[#F6F3EB]">
            <GitBranch className="h-2.5 w-2.5 text-[#9DB5A5]" />
            {project.versionTag}
          </span>
        )}

        {project.featured && (
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-[#FAF8F3]/95 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-[#203B35] border border-[#203B35]/10">
            <Sparkles className="h-2.5 w-2.5 text-[#9DB5A5]" />
            Featured
          </span>
        )}

        <span
          className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#203B35]/85 text-[#F6F3EB] opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
          aria-hidden="true"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </button>

      {/* Content */}
      <div className="mt-3.5 flex flex-1 flex-col justify-between px-0.5">
        <div>
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => onSelectProject(project)}
              className="text-left font-serif text-[1.4rem] leading-[1.15] text-[#203B35] group-hover:text-[#162A26] transition-colors focus:outline-none"
            >
              {project.title}
            </button>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#5D635F] opacity-60 group-hover:opacity-100 group-hover:text-[#203B35] transition-all" />
          </div>

          {project.description && (
            <p className="mt-2 text-[13px] leading-[1.6] text-[#282B2A]/80 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Tags */}
          {project.tags.length > 0 && (
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

        {/* Footer Metadata & Actions */}
        <div className="mt-4 pt-3 border-t border-[#203B35]/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {project.collaborators.length > 0 && (
              <div className="flex -space-x-1.5 shrink-0">
                {project.collaborators.slice(0, 2).map((col) => (
                  <FeedAvatar
                    key={col.username}
                    avatarUrl={col.avatarUrl}
                    initials={col.initials}
                    tone={col.tone}
                    accent={col.accent}
                    name={`${col.name} (${col.role})`}
                    size="xs"
                  />
                ))}
              </div>
            )}
            <span className="font-mono text-[11px] text-[#5D635F] truncate">
              {project.updatedAt}
            </span>
          </div>

          {readOnly ? (
            <div className="flex items-center gap-3 shrink-0 text-[12px] text-[#5D635F]">
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Heart className="h-3.5 w-3.5 text-[#9DB5A5]" />
                {likesDisplay}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleLike?.(project.id)}
                aria-pressed={isLiked}
                aria-label={
                  isLiked
                    ? `Remove appreciation from ${project.title}`
                    : `Appreciate ${project.title}`
                }
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  isLiked
                    ? "bg-[#203B35]/10 text-[#203B35] font-medium"
                    : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                }`}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    isLiked ? "fill-[#203B35] text-[#203B35]" : ""
                  }`}
                />
                <span className="tabular-nums">{likesDisplay}</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectProject(project)}
                aria-label={`Inspect project ${project.title}`}
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="tabular-nums">{project.commentCount}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleSave?.(project.id)}
                aria-pressed={isSaved}
                aria-label={
                  isSaved
                    ? `Remove ${project.title} from bookmarks`
                    : `Bookmark ${project.title}`
                }
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  isSaved
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : "text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35]"
                }`}
              >
                <Bookmark
                  className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
