"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Briefcase, Clock } from "lucide-react";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { deriveInitials } from "@/data/mockProfiles";
import type { ExploreServiceItem } from "./exploreTypes";

interface ExploreServiceCardProps {
  service: ExploreServiceItem;
}

export function getExploreAvailabilityStyle(
  status: ExploreServiceItem["availabilityStatus"]
): {
  pillClass: string;
  dotClass: string;
} {
  switch (status) {
    case "Available":
      return {
        pillClass: "bg-[#9DB5A5]/25 text-[#203B35] border-[#9DB5A5]/55",
        dotClass: "bg-[#4E9F76]",
      };
    case "Limited Slots":
      return {
        pillClass: "bg-[#C8BDE0]/30 text-[#203B35] border-[#C8BDE0]/60",
        dotClass: "bg-[#203B35]",
      };
    default:
      return {
        pillClass: "bg-[#EFECE2] text-[#5D635F] border-[#203B35]/20",
        dotClass: "bg-[#5D635F]",
      };
  }
}

export function ExploreServiceCard({ service }: ExploreServiceCardProps) {
  const serviceDetailHref = `/profile/${encodeURIComponent(service.creatorUsername)}?tab=services`;
  const creatorHref = `/profile/${encodeURIComponent(service.creatorUsername)}`;
  const initials = deriveInitials(service.creatorDisplayName || service.creatorUsername);
  const availability = getExploreAvailabilityStyle(service.availabilityStatus);

  return (
    <article className="group flex flex-col justify-between rounded-[16px] border border-[#203B35]/12 bg-[#FAF8F3] p-3.5 transition-all duration-300 hover:border-[#203B35]/25 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.28)]">
      <div>
        {/* Cover Thumbnail / Atelier Plate */}
        <Link
          href={serviceDetailHref}
          className="relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-[#EFECE2] border border-[#203B35]/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
          aria-label={`View service ${service.title} by ${service.creatorDisplayName}`}
        >
          {service.coverUrl ? (
            <Image
              src={service.coverUrl}
              alt={service.coverAlt || service.title}
              fill
              sizes="(max-width: 640px) 94vw, (max-width: 1024px) 46vw, 32vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#FAF8F3] via-[#EFECE2] to-[#FAF8F3]">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#203B35]/15 bg-[#F6F3EB] text-[#203B35]/70">
                <Briefcase className="h-5 w-5 text-[#9DB5A5]" />
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
                Studio Service
              </p>
            </div>
          )}

          {/* Top-Left Category Tag */}
          <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F6F3EB]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium text-[#203B35] border border-[#203B35]/10 shadow-sm">
            {service.category}
          </span>

          {/* Top-Right Availability Status */}
          <span
            className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full border bg-[#FAF8F3]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium shadow-sm ${availability.pillClass}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClass}`} />
            <span>{service.availabilityStatus}</span>
          </span>
        </Link>

        {/* Service Details */}
        <div className="mt-3.5 px-0.5">
          <Link
            href={serviceDetailHref}
            className="block font-serif text-[1.35rem] leading-[1.2] text-[#203B35] group-hover:text-[#162A26] transition-colors line-clamp-1"
          >
            {service.title}
          </Link>

          <p className="mt-2 text-[13px] leading-[1.6] text-[#282B2A]/80 line-clamp-2">
            {service.shortDescription}
          </p>

          {/* Creator Attribution */}
          <Link
            href={creatorHref}
            className="mt-3 flex items-center gap-2 group/creator w-fit"
            aria-label={`Creator profile of ${service.creatorDisplayName}`}
          >
            <FeedAvatar
              avatarUrl={service.creatorAvatarUrl}
              initials={initials}
              tone="#203B35"
              accent="#9DB5A5"
              name={service.creatorDisplayName}
              size="xs"
            />
            <span className="text-[12px] text-[#5D635F] group-hover/creator:text-[#203B35] group-hover/creator:underline truncate">
              by <strong className="font-medium text-[#203B35]">{service.creatorDisplayName}</strong>
            </span>
          </Link>
        </div>
      </div>

      {/* Pricing, Turnaround & CTA */}
      <div className="mt-4 pt-3.5 border-t border-[#203B35]/10 space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/90 px-3.5 py-2.5">
          <div>
            {service.pricingModel && (
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                {service.pricingModel}
              </p>
            )}
            <p className="font-serif text-[1.35rem] leading-none text-[#203B35] tabular-nums mt-0.5">
              {service.priceDisplay}
            </p>
          </div>

          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
              Duration
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#203B35]">
              <Clock className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span>{service.estimatedDuration}</span>
            </p>
          </div>
        </div>

        <Link
          href={serviceDetailHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-2.5 text-[13px] font-medium text-[#203B35] hover:bg-[#203B35] hover:text-[#F6F3EB] hover:border-[#203B35] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
        >
          <span>View Service Details</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
