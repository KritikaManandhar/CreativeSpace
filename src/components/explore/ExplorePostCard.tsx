"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Feather, Heart, MessageCircle } from "lucide-react";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { deriveInitials } from "@/data/mockProfiles";
import type { ExplorePostItem } from "./exploreTypes";

interface ExplorePostCardProps {
  post: ExplorePostItem;
}

function getPostBadgeStyle(kind: string): string {
  switch (kind) {
    case "Process Log":
      return "bg-[#9DB5A5]/25 text-[#203B35] border-[#9DB5A5]/50";
    case "Critique Request":
      return "bg-[#C8BDE0]/30 text-[#203B35] border-[#C8BDE0]/60";
    case "Milestone":
      return "bg-[#203B35] text-[#F6F3EB] border-[#203B35]";
    case "Studio Note":
      return "bg-[#F6F3EB] text-[#203B35] border-[#203B35]/25";
    default:
      return "bg-[#EFECE2] text-[#203B35] border-[#203B35]/15";
  }
}

export function ExplorePostCard({ post }: ExplorePostCardProps) {
  const [liked, setLiked] = useState(false);
  const baseLikes = post.likesCount ?? 0;
  const currentLikes = baseLikes + (liked ? 1 : 0);

  const authorInitials = deriveInitials(post.authorDisplayName || post.authorUsername);
  const authorProfileHref = `/profile/${encodeURIComponent(post.authorUsername)}`;
  const postFeedHref = `/feed`;

  return (
    <article className="group flex flex-col justify-between rounded-[16px] border border-[#203B35]/12 bg-[#FAF8F3] p-4 transition-all duration-300 hover:border-[#203B35]/25 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.28)]">
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono text-[10.5px] font-medium tracking-tight ${getPostBadgeStyle(
                post.kind
              )}`}
            >
              {post.kind}
            </span>

            {post.discipline && (
              <span className="rounded-full bg-[#EFECE2] border border-[#203B35]/10 px-2.5 py-0.5 text-[10.5px] font-medium text-[#203B35]">
                {post.discipline}
              </span>
            )}
          </div>

          {post.createdAt && (
            <span className="font-mono text-[10px] text-[#5D635F] shrink-0">
              {post.createdAt}
            </span>
          )}
        </div>

        {/* Optional Media Preview */}
        {post.coverUrl && (
          <Link
            href={postFeedHref}
            className="relative block aspect-[16/9] w-full overflow-hidden rounded-[10px] bg-[#EFECE2] border border-[#203B35]/10 mb-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
            aria-label={`View post media for ${post.title || "post"}`}
          >
            <Image
              src={post.coverUrl}
              alt={post.coverAlt || post.title || "Post media"}
              fill
              sizes="(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 32vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          </Link>
        )}

        {/* Title & Excerpt */}
        <div>
          {post.title && (
            <Link
              href={postFeedHref}
              className="block font-serif text-[1.25rem] leading-[1.2] text-[#203B35] group-hover:text-[#162A26] transition-colors mb-1.5 line-clamp-1"
            >
              {post.title}
            </Link>
          )}

          <p className="text-[13px] leading-[1.65] text-[#282B2A]/85 line-clamp-3">
            {post.content}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.slice(0, 3).map((tag) => (
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
      </div>

      {/* Author Byline & Interactions Footer */}
      <div className="mt-4 pt-3 border-t border-[#203B35]/10 flex items-center justify-between gap-2">
        <Link
          href={authorProfileHref}
          className="flex items-center gap-2 min-w-0 group/author focus:outline-none rounded-md py-0.5"
          aria-label={`View profile for ${post.authorDisplayName}`}
        >
          <FeedAvatar
            avatarUrl={post.authorAvatarUrl}
            initials={authorInitials}
            tone="#203B35"
            accent="#C8BDE0"
            name={post.authorDisplayName}
            size="sm"
          />
          <div className="min-w-0">
            <p className="text-[12.5px] font-medium text-[#203B35] truncate group-hover/author:underline">
              {post.authorDisplayName}
            </p>
            <p className="font-mono text-[10.5px] text-[#5D635F] truncate">
              @{post.authorUsername}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {post.commentsCount !== undefined && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F]">
              <MessageCircle className="h-3 w-3 text-[#9DB5A5]" />
              <span className="tabular-nums">{post.commentsCount}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setLiked((prev) => !prev)}
            aria-label={liked ? "Unlike post" : "Like post"}
            aria-pressed={liked}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
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

          <Link
            href={postFeedHref}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors"
            aria-label="View in feed"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
