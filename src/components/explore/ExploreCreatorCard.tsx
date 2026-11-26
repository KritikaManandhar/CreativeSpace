"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { deriveInitials } from "@/data/mockProfiles";
import type { ExploreCreatorItem } from "./exploreTypes";

interface ExploreCreatorCardProps {
  creator: ExploreCreatorItem;
}

export function ExploreCreatorCard({ creator }: ExploreCreatorCardProps) {
  const initials = deriveInitials(creator.displayName || creator.username);
  const profileHref = `/profile/${encodeURIComponent(creator.username)}`;

  return (
    <article className="group flex flex-col justify-between rounded-[16px] border border-[#203B35]/12 bg-[#FAF8F3] p-4 transition-all duration-300 hover:border-[#203B35]/25 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.28)]">
      <div>
        {/* Top Header & Avatar */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={profileHref}
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 rounded-lg"
            aria-label={`View profile of ${creator.displayName}`}
          >
            <FeedAvatar
              avatarUrl={creator.avatarUrl}
              initials={initials}
              tone="#203B35"
              accent="#C8BDE0"
              name={creator.displayName}
              size="md"
            />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold tracking-tight text-[#203B35] group-hover:underline truncate">
                {creator.displayName}
              </h3>
              <p className="font-mono text-[11px] text-[#5D635F] truncate">
                @{creator.username}
              </p>
            </div>
          </Link>

          {/* Availability / Verification Pill */}
          {creator.isAvailableForWork && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#9DB5A5]/20 border border-[#9DB5A5]/40 px-2.5 py-0.5 text-[10.5px] font-medium text-[#203B35]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4E9F76]" />
              <span>Available</span>
            </span>
          )}
        </div>

        {/* Location if present */}
        {creator.location && (
          <div className="mt-2.5 flex items-center gap-1 text-[11.5px] text-[#5D635F]">
            <MapPin className="h-3 w-3 text-[#9DB5A5] shrink-0" />
            <span className="truncate">{creator.location}</span>
          </div>
        )}

        {/* Disciplines */}
        {creator.disciplines && creator.disciplines.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {creator.disciplines.slice(0, 3).map((disc) => (
              <span
                key={disc}
                className="rounded-full bg-[#EFECE2] border border-[#203B35]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#203B35]"
              >
                {disc}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {creator.bio && (
          <p className="mt-3 text-[13px] leading-[1.6] text-[#282B2A]/80 line-clamp-2">
            {creator.bio}
          </p>
        )}
      </div>

      {/* Stats Row & Navigation Action */}
      <div className="mt-5 pt-3.5 border-t border-[#203B35]/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-[11.5px] text-[#5D635F]">
          {creator.projectsCount !== undefined && (
            <span>
              <strong className="font-medium text-[#203B35]">{creator.projectsCount}</strong>{" "}
              {creator.projectsCount === 1 ? "work" : "works"}
            </span>
          )}
          {creator.servicesCount !== undefined && creator.servicesCount > 0 && (
            <>
              <span className="text-[#9DB5A5]" aria-hidden="true">·</span>
              <span>
                <strong className="font-medium text-[#203B35]">{creator.servicesCount}</strong>{" "}
                services
              </span>
            </>
          )}
          {creator.followersCount !== undefined && (
            <>
              <span className="text-[#9DB5A5]" aria-hidden="true">·</span>
              <span>
                <strong className="font-medium text-[#203B35]">{creator.followersCount}</strong>{" "}
                followers
              </span>
            </>
          )}
        </div>

        <Link
          href={profileHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-[12px] font-medium text-[#203B35] transition-all hover:bg-[#203B35] hover:text-[#F6F3EB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
        >
          <span>View Profile</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}
