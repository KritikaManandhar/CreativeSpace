"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  Compass,
  Feather,
  Flame,
  Heart,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type {
  CommunityHighlightItem,
  FeedCreatorSummary,
  FeedDiscipline,
  FeedDisciplineFilter,
  FeedPostItem,
} from "@/data/mockFeed";
import { FeedAvatar } from "@/components/feed/FeedAvatar";

interface FeedSidebarProps {
  suggestedCreators: FeedCreatorSummary[];
  trendingPosts: Array<{
    post: FeedPostItem;
    author: FeedCreatorSummary;
    displayLikes: number;
  }>;
  categoryCounts: Array<{ discipline: FeedDiscipline; count: number }>;
  highlights: CommunityHighlightItem[];
  activeDiscipline: FeedDisciplineFilter;
  followedMap: Record<string, boolean>;
  onToggleFollow: (username: string) => void;
  onSelectDiscipline: (discipline: FeedDisciplineFilter) => void;
  onJumpToPost: (postId: string) => void;
}

/**
 * Editorial community sidebar pairing Suggested Creators, Trending Creative Posts,
 * Popular Disciplines, and calm Community Highlights without analytics clutter.
 */
export function FeedSidebar({
  suggestedCreators,
  trendingPosts,
  categoryCounts,
  highlights,
  activeDiscipline,
  followedMap,
  onToggleFollow,
  onSelectDiscipline,
  onJumpToPost,
}: FeedSidebarProps) {
  const leadHighlight = highlights[0];
  const secondaryHighlight = highlights[1];

  return (
    <aside
      aria-label="Community highlights, creators, and discovery"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-5 sm:gap-6"
    >
      {/* 1. Community Highlight Editorial Card */}
      {leadHighlight && (
        <section
          aria-labelledby="sidebar-highlight-heading"
          className="relative overflow-hidden rounded-[22px] border border-[#203B35]/20 bg-[#203B35] p-5 sm:p-6 text-[#F6F3EB] shadow-[0_20px_48px_-24px_rgba(32,59,53,0.45)]"
        >
          {/* Delicate cosmic orbital arc matching Landing/Profile visual identity */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-[#C8BDE0]/20 blur-[50px]"
            aria-hidden="true"
          />
          <svg
            viewBox="0 0 360 200"
            fill="none"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
            aria-hidden="true"
          >
            <ellipse
              cx="230"
              cy="90"
              rx="155"
              ry="72"
              transform="rotate(-14 230 90)"
              stroke="#9DB5A5"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <circle cx="316" cy="48" r="2.5" fill="#C8BDE0" />
            <circle cx="58" cy="156" r="2" fill="#9DB5A5" />
          </svg>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#9DB5A5]">
                <CelestialSpark className="h-3 w-3 text-[#C8BDE0]" />
                <span>{leadHighlight.eyebrow}</span>
              </span>
              <span className="rounded-full bg-[#F6F3EB]/12 px-2.5 py-0.5 text-[10.5px] font-medium text-[#C8BDE0]">
                {leadHighlight.discipline}
              </span>
            </div>

            <h2
              id="sidebar-highlight-heading"
              className="font-serif text-[1.45rem] font-normal leading-[1.18] text-[#F6F3EB]"
            >
              {leadHighlight.title}
            </h2>

            <p className="text-[13px] leading-[1.65] text-[#F6F3EB]/80">
              {leadHighlight.summary}
            </p>

            <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#F6F3EB]/15">
              <Link
                href={`/profile/${encodeURIComponent(leadHighlight.creatorUsername)}`}
                className="group inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#9DB5A5] hover:text-[#F6F3EB] transition-colors"
              >
                <span>{leadHighlight.creatorLabel}</span>
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 2. Suggested Creators */}
      <section
        aria-labelledby="sidebar-creators-heading"
        className="rounded-[22px] border border-[#203B35]/14 bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-[0_4px_22px_-12px_rgba(32,59,53,0.06)]"
      >
        <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5D635F]">
              Kindred Makers
            </p>
            <h2
              id="sidebar-creators-heading"
              className="font-serif text-[1.35rem] text-[#203B35] leading-tight"
            >
              Suggested Creators
            </h2>
          </div>
          <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
        </div>

        <ul className="space-y-3.5">
          {suggestedCreators.map((creator) => {
            const isFollowing = Boolean(followedMap[creator.username]);
            return (
              <li
                key={creator.username}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    href={`/profile/${encodeURIComponent(creator.username)}`}
                    aria-label={`View ${creator.displayName}'s profile`}
                    className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                  >
                    <FeedAvatar
                      avatarUrl={creator.avatarUrl}
                      initials={creator.initials}
                      tone={creator.avatarTone}
                      accent={creator.avatarAccent}
                      name={creator.displayName}
                      size="sm"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${encodeURIComponent(creator.username)}`}
                      className="block text-[13.5px] font-medium text-[#203B35] hover:underline underline-offset-4 decoration-[#9DB5A5] truncate"
                    >
                      {creator.displayName}
                    </Link>
                    <p className="text-[11.5px] text-[#5D635F] truncate">
                      {creator.primaryDiscipline} · @{creator.username}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleFollow(creator.username)}
                  aria-pressed={isFollowing}
                  className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    isFollowing
                      ? "bg-[#EFECE2] text-[#203B35] border border-[#203B35]/15"
                      : "bg-[#203B35] text-[#F6F3EB] hover:bg-[#162A26]"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 text-[#4E9F76]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 text-[#9DB5A5]" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 3. Trending Creative Posts */}
      <section
        aria-labelledby="sidebar-trending-heading"
        className="rounded-[22px] border border-[#203B35]/14 bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-[0_4px_22px_-12px_rgba(32,59,53,0.06)]"
      >
        <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5D635F]">
              Resonating Now
            </p>
            <h2
              id="sidebar-trending-heading"
              className="font-serif text-[1.35rem] text-[#203B35] leading-tight"
            >
              Trending Posts
            </h2>
          </div>
          <Flame className="h-4 w-4 text-[#9DB5A5]" />
        </div>

        <ol className="space-y-3.5">
          {trendingPosts.map(({ post, author, displayLikes }, index) => (
            <li
              key={post.id}
              className="group flex items-start gap-3 pb-3 last:pb-0 border-b last:border-b-0 border-[#203B35]/8"
            >
              {post.imageUrl ? (
                <button
                  type="button"
                  onClick={() => onJumpToPost(post.id)}
                  aria-label={`Jump to ${post.title || author.displayName}'s post`}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-[#203B35]/12 bg-[#EFECE2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                >
                  {post.imageUrl.startsWith("/images/") ? (
                    <Image
                      src={post.imageUrl}
                      alt={post.imageAlt || post.title || author.displayName}
                      fill
                      sizes="48px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.imageUrl}
                      alt={post.imageAlt || post.title || author.displayName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#203B35]/12 bg-[#EFECE2] font-mono text-[11px] text-[#203B35]">
                  0{index + 1}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onJumpToPost(post.id)}
                  className="text-left text-[13px] font-medium leading-snug text-[#203B35] hover:underline underline-offset-4 decoration-[#9DB5A5] line-clamp-2 focus:outline-none"
                >
                  {post.title || post.content}
                </button>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#5D635F]">
                  <Link
                    href={`/profile/${encodeURIComponent(author.username)}`}
                    className="font-mono hover:text-[#203B35]"
                  >
                    @{author.username}
                  </Link>
                  <span>·</span>
                  <span>{post.discipline}</span>
                  <span className="inline-flex items-center gap-0.5 ml-auto font-mono tabular-nums text-[#203B35]">
                    <Heart className="h-2.5 w-2.5 text-[#9DB5A5]" />
                    {displayLikes}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Popular Creative Categories + Secondary Highlight */}
      <section
        aria-labelledby="sidebar-categories-heading"
        className="rounded-[22px] border border-[#203B35]/14 bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-[0_4px_22px_-12px_rgba(32,59,53,0.06)]"
      >
        <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5D635F]">
              Browse Disciplines
            </p>
            <h2
              id="sidebar-categories-heading"
              className="font-serif text-[1.35rem] text-[#203B35] leading-tight"
            >
              Popular Categories
            </h2>
          </div>
          <Compass className="h-4 w-4 text-[#9DB5A5]" />
        </div>

        <div className="flex flex-wrap gap-2">
          {categoryCounts.map(({ discipline, count }) => {
            const active = activeDiscipline === discipline;
            return (
              <button
                key={discipline}
                type="button"
                onClick={() =>
                  onSelectDiscipline(active ? "All" : discipline)
                }
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  active
                    ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                    : "border border-[#203B35]/12 bg-[#F6F3EB] text-[#282B2A] hover:border-[#203B35]/35 hover:text-[#203B35]"
                }`}
              >
                <span>{discipline}</span>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    active ? "text-[#9DB5A5]" : "text-[#92958F]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {secondaryHighlight && (
          <div className="pt-3 border-t border-[#203B35]/10 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-[0.16em] text-[#5D635F]">
              <Feather className="h-3 w-3 text-[#9DB5A5]" />
              <span>{secondaryHighlight.eyebrow}</span>
            </div>
            <p className="font-serif italic text-[15.5px] leading-snug text-[#203B35]">
              {secondaryHighlight.title}
            </p>
            <Link
              href={`/profile/${encodeURIComponent(secondaryHighlight.creatorUsername)}`}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#203B35] hover:underline underline-offset-4 decoration-[#9DB5A5]"
            >
              <span>{secondaryHighlight.creatorLabel}</span>
              <ArrowUpRight className="h-3 w-3 text-[#9DB5A5]" />
            </Link>
          </div>
        )}
      </section>
    </aside>
  );
}
