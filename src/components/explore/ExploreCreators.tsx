"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { UserPlus, UserCheck, ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { CreatorAvatar, CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ExploreCreator } from "./exploreData";

interface ExploreCreatorsProps {
  creators: ExploreCreator[];
  onToggleFollow: (creatorId: string) => void;
}

export function ExploreCreators({
  creators,
  onToggleFollow,
}: ExploreCreatorsProps) {
  return (
    <section className="mt-14 sm:mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#203B35]/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
              Makers & Studios
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9DB5A5]" />
            <span className="text-xs text-[#92958F]">Peer Discovery</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#203B35] font-normal tracking-tight">
            Creators to Discover
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[#5D635F] max-w-md md:text-right font-sans">
          Connect with independent illustrators, architectural photographers, and creative directors.
        </p>
      </div>

      {/* Creator Cards Grid - Distinctive Horizontal / Card Composition */}
      <div className="mt-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {creators.map((creator) => (
          <article
            key={creator.id}
            className="group relative flex flex-col justify-between rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 hover:border-[#203B35]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div>
              {/* Card Top: Location & Discipline Badge */}
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-[#203B35]/8">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-mono uppercase tracking-wider text-[#5D635F]">
                  <MapPin className="w-3 h-3 text-[#9DB5A5]" />
                  {creator.location}
                </span>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFECE2] text-[10px] font-mono text-[#203B35] font-semibold">
                  {creator.disciplineBadge}
                </span>
              </div>

              {/* Creator Identity */}
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href={`/profile/${creator.username}`}
                  className="relative group/avatar shrink-0 focus:outline-none"
                  aria-label={`View ${creator.displayName}'s profile`}
                >
                  {creator.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-[#203B35]/15"
                    />
                  ) : (
                    <CreatorAvatar
                      initials={creator.avatarInitials}
                      tone={creator.avatarTone}
                      accent={creator.avatarAccent}
                      name={creator.displayName}
                      size="md"
                    />
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center ring-2 ring-[#FAF8F3]">
                    <CelestialSpark className="w-2.5 h-2.5 text-[#9DB5A5]" />
                  </span>
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/profile/${creator.username}`}
                    className="block text-base font-medium text-[#203B35] hover:underline truncate font-serif"
                  >
                    {creator.displayName}
                  </Link>
                  <p className="text-[11px] font-mono text-[#5D635F] truncate">
                    @{creator.username}
                  </p>
                </div>
              </div>

              {/* Creative Specialty */}
              <p className="mt-3 text-xs font-semibold text-[#203B35] line-clamp-1">
                {creator.specialty}
              </p>

              {/* Bio */}
              <p className="mt-1.5 text-xs text-[#282B2A]/75 leading-relaxed line-clamp-3">
                {creator.bio}
              </p>

              {/* Portfolio Miniature Strip (3 Works) */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden bg-[#EFECE2]/50 p-1">
                {creator.previewImages.slice(0, 3).map((imgSrc, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden bg-[#EFECE2]"
                  >
                    <Image
                      src={imgSrc}
                      alt={`${creator.displayName} sample work ${idx + 1}`}
                      fill
                      sizes="120px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row: Followers & Follow Button */}
            <div className="mt-5 pt-3.5 border-t border-[#203B35]/8 flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-[#5D635F]">
                <strong className="text-[#203B35]">
                  {creator.followerCount.toLocaleString()}
                </strong>{" "}
                followers
              </span>

              <button
                type="button"
                onClick={() => onToggleFollow(creator.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  creator.isFollowing
                    ? "bg-[#EFECE2] text-[#203B35] border border-[#203B35]/20 hover:bg-[#E5DFD1]"
                    : "bg-[#203B35] text-[#FAF8F3] hover:bg-[#162A26] shadow-sm"
                }`}
                aria-label={creator.isFollowing ? `Unfollow ${creator.displayName}` : `Follow ${creator.displayName}`}
              >
                {creator.isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#203B35]" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 text-[#9DB5A5]" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
