"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Share2,
  Sparkles,
  Calendar,
  Layers,
  ArrowUpRight,
  Play,
  FileBox,
} from "lucide-react";
import { FeedPostData } from "@/components/feed/PostCard";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface ProfilePostsTabProps {
  posts: FeedPostData[];
  creatorUsername: string;
  onToggleLike: (projectId: string) => Promise<void>;
  onOpenComments: (projectId: string, versionId?: string | null) => void;
  onSharePost: (title: string, url: string) => void;
  busyLikeIds: Record<string, boolean>;
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

export function ProfilePostsTab({
  posts,
  creatorUsername,
  onToggleLike,
  onOpenComments,
  onSharePost,
  busyLikeIds,
}: ProfilePostsTabProps) {
  if (posts.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto rounded-3xl bg-[#FAF8F3] border border-[#203B35]/10 p-8 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-[#EFECE2] flex items-center justify-center text-[#203B35]">
          <Sparkles className="w-5 h-5 text-[#203B35]" />
        </div>
        <h3 className="text-base font-serif font-bold text-[#203B35]">
          No Published Posts Yet
        </h3>
        <p className="text-xs text-[#5D635F] leading-relaxed">
          When @{creatorUsername} shares creative updates, version milestones, or announcements to the community feed, they will be archived here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => {
        const isBusy = Boolean(busyLikeIds[post.project.id]);

        return (
          <article
            key={post.id}
            className="group flex flex-col justify-between rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 overflow-hidden hover:border-[#203B35]/35 hover:shadow-xl transition-all duration-300"
          >
            <div>
              {/* Media Preview Box */}
              <Link
                href={`/projects/${post.project.id}`}
                className="block relative aspect-[16/10] w-full bg-[#EFECE2] overflow-hidden"
              >
                {post.project.previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.project.previewImageUrl}
                    alt={post.project.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#EFECE2] to-[#FAF8F3]">
                    <CelestialSpark className="w-8 h-8 text-[#203B35]/25" />
                  </div>
                )}

                {/* Category & Status Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10 shadow-sm">
                    {post.project.category}
                  </span>
                  {post.version && (
                    <span className="px-2 py-0.5 rounded-full bg-[#203B35] text-[10px] font-mono text-[#F6F3EB] font-semibold shadow-sm">
                      v{post.version.versionNumber} {post.version.status}
                    </span>
                  )}
                </div>
              </Link>

              {/* Post Content */}
              <div className="p-5 sm:p-6 space-y-2.5">
                {/* Publication Summary / Activity Header */}
                <div className="flex items-center justify-between text-[11px] text-[#5D635F]">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#9DB5A5]">
                    {formatRelativeDate(post.createdAt)}
                  </span>
                  {post.summary && (
                    <span className="text-[11px] text-[#5D635F] italic truncate max-w-[180px]">
                      {post.summary}
                    </span>
                  )}
                </div>

                <Link href={`/projects/${post.project.id}`} className="block group/title">
                  <h4 className="text-lg font-serif font-semibold text-[#203B35] group-hover/title:text-[#162A26] transition-colors line-clamp-1">
                    {post.project.title}
                  </h4>
                </Link>

                <p className="text-xs text-[#5D635F] line-clamp-2 leading-relaxed">
                  {post.project.description || "Shared creative work on CreativeSpace."}
                </p>

                {/* Tags */}
                {post.project.tags && post.project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {post.project.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EFECE2] text-[#203B35]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Post Interaction Footer */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F]">
              <div className="flex items-center gap-3">
                {/* Like Button */}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onToggleLike(post.project.id)}
                  className={`flex items-center gap-1.5 transition-colors focus:outline-none ${
                    post.project.hasLiked
                      ? "text-rose-600 font-semibold"
                      : "hover:text-[#203B35]"
                  }`}
                  aria-label={post.project.hasLiked ? "Unlike post" : "Like post"}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      post.project.hasLiked ? "fill-rose-600 text-rose-600" : ""
                    }`}
                  />
                  <span>{post.project.likeCount}</span>
                </button>

                {/* Comments Button */}
                <button
                  type="button"
                  onClick={() => onOpenComments(post.project.id, post.version?.id)}
                  className="flex items-center gap-1.5 hover:text-[#203B35] transition-colors focus:outline-none"
                  aria-label="View comments"
                >
                  <MessageSquare className="w-4 h-4 text-[#5D635F]" />
                  <span>{post.project.commentCount}</span>
                </button>
              </div>

              {/* Share & View Links */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSharePost(
                      post.project.title,
                      typeof window !== "undefined"
                        ? `${window.location.origin}/projects/${post.project.id}`
                        : `/projects/${post.project.id}`
                    )
                  }
                  className="p-1.5 rounded-full hover:bg-[#203B35]/10 text-[#5D635F] hover:text-[#203B35] transition-colors"
                  aria-label="Share post"
                  title="Share post"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>

                <Link
                  href={`/projects/${post.project.id}`}
                  className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#203B35] hover:text-[#162A26] transition-colors"
                >
                  <span>Workspace</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
