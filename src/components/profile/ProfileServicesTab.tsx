"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Briefcase, Calendar, Clock, EyeOff, Sparkles } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import {
  formatServicePrice,
  type ProfilePerspective,
  type ProfileServiceItem,
  type ServiceAvailabilityStatus,
} from "@/data/mockProfiles";

interface ProfileServicesTabProps {
  services: ProfileServiceItem[];
  perspective: ProfilePerspective;
  ownerDisplayName: string;
  onSelectService: (service: ProfileServiceItem, initialMode?: "details" | "booking") => void;
}

export function getAvailabilityStyle(status: ServiceAvailabilityStatus): {
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

export function ProfileServicesTab({
  services,
  perspective,
  ownerDisplayName,
  onSelectService,
}: ProfileServicesTabProps) {
  const isOwner = perspective === "owner";
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Strictly exclude unpublished/draft services from Visitor View
  const visibleServices = useMemo(() => {
    return isOwner ? services : services.filter((s) => s.isPublished);
  }, [services, isOwner]);

  const publishedCount = useMemo(
    () => services.filter((s) => s.isPublished).length,
    [services]
  );
  const draftCount = services.length - publishedCount;

  const categories = useMemo(() => {
    const set = new Set<string>(visibleServices.map((s) => s.category));
    return ["All", ...Array.from(set)];
  }, [visibleServices]);

  const activeFilter = categories.includes(categoryFilter) ? categoryFilter : "All";

  const filteredServices = useMemo(() => {
    if (activeFilter === "All") return visibleServices;
    return visibleServices.filter((s) => s.category === activeFilter);
  }, [visibleServices, activeFilter]);

  return (
    <div
      id="panel-services"
      role="tabpanel"
      aria-labelledby="tab-services"
      className="mt-7 space-y-6"
    >
      {/* Category Filter Strip + Owner Visibility Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
          aria-label="Filter services by category"
        >
          {categories.map((cat) => {
            const active = activeFilter === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  active
                    ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                    : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {isOwner && draftCount > 0 && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-[12px] text-[#5D635F]">
            <EyeOff className="h-3.5 w-3.5 text-[#203B35]" />
            <span>
              <strong className="font-medium text-[#203B35]">{publishedCount}</strong>{" "}
              published ·{" "}
              <strong className="font-medium text-[#203B35]">{draftCount}</strong>{" "}
              unpublished draft (owner view only)
            </span>
          </div>
        )}
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-[#203B35]/15 bg-[#FAF8F3] px-6 py-14 text-center">
          <Briefcase className="h-5 w-5 text-[#9DB5A5] mx-auto mb-3" />
          <p className="font-serif text-2xl text-[#203B35]">
            No published services available right now
          </p>
          <p className="mt-2 text-[14px] text-[#5D635F] max-w-md mx-auto">
            {ownerDisplayName} does not have active offerings listed in this category yet.
          </p>
          {activeFilter !== "All" && (
            <button
              type="button"
              onClick={() => setCategoryFilter("All")}
              className="mt-5 rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
            >
              Show All Services
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredServices.map((service) => {
            const isDraft = !service.isPublished;
            const availability = getAvailabilityStyle(service.availabilityStatus);

            return (
              <article
                key={service.id}
                className={`group flex flex-col rounded-[16px] border p-3.5 transition-all duration-300 ${
                  isDraft
                    ? "border-dashed border-[#203B35]/30 bg-[#EFECE2]/55"
                    : "border-[#203B35]/15 bg-[#FAF8F3] hover:border-[#203B35]/30 hover:shadow-[0_18px_42px_-26px_rgba(32,59,53,0.3)]"
                }`}
              >
                {/* Cover Preview */}
                <button
                  type="button"
                  onClick={() => onSelectService(service, "details")}
                  className="relative block aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-[#EFECE2] border border-[#203B35]/10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                  aria-label={`View service details for ${service.title}`}
                >
                  <Image
                    src={service.coverUrl}
                    alt={service.coverAlt}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                    className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${
                      isDraft ? "opacity-80" : ""
                    }`}
                  />

                  {/* Top-left Service Category */}
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-[#F6F3EB]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium text-[#203B35] border border-[#203B35]/10">
                    {service.category}
                  </span>

                  {/* Top-right Draft or Availability Pill */}
                  {isDraft ? (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-[#203B35]/90 backdrop-blur-sm px-2.5 py-1 font-mono text-[10px] text-[#F6F3EB]">
                      <EyeOff className="h-3 w-3 text-[#C8BDE0]" />
                      <span>Unpublished Draft</span>
                    </span>
                  ) : (
                    <span
                      className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full border bg-[#FAF8F3]/95 backdrop-blur-sm px-2.5 py-1 text-[10.5px] font-medium ${availability.pillClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClass}`} />
                      <span>{service.availabilityStatus}</span>
                    </span>
                  )}
                </button>

                {/* Body */}
                <div className="mt-3.5 flex flex-1 flex-col justify-between px-0.5">
                  <div>
                    {isDraft && (
                      <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-[#C8BDE0]/25 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#203B35]">
                        <CelestialSpark className="h-2.5 w-2.5 text-[#203B35]" />
                        <span>Hidden from public visitors</span>
                      </div>
                    )}

                    <h3 className="font-serif text-[1.4rem] leading-[1.15] text-[#203B35]">
                      {service.title}
                    </h3>

                    <p className="mt-2 text-[13.5px] leading-[1.6] text-[#282B2A]/85 line-clamp-2">
                      {service.shortDescription}
                    </p>
                  </div>

                  {/* Pricing & Estimated Duration Box */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#203B35]/10 bg-[#F6F3EB]/90 px-3.5 py-2.5">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                          {service.pricingModel}
                        </p>
                        <p className="mt-0.5 font-serif text-[1.45rem] leading-none text-[#203B35] tabular-nums">
                          {formatServicePrice(service)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5D635F]">
                          Est. Duration
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#203B35]">
                          <Clock className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>{service.estimatedDuration}</span>
                        </p>
                      </div>
                    </div>

                    {/* Action CTAs: Details + Request Booking */}
                    {isDraft ? (
                      <button
                        type="button"
                        onClick={() => onSelectService(service, "details")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-[#203B35]/30 bg-[#FAF8F3] px-4 py-2.5 text-[12.5px] font-medium text-[#5D635F] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                      >
                        <EyeOff className="h-3.5 w-3.5 text-[#5D635F]" />
                        <span>View Draft Specs</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectService(service, "details")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-2 text-[12.5px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                          aria-label={`View details for ${service.title}`}
                        >
                          <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectService(service, "booking")}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#203B35] px-3 py-2 text-[12.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
                          aria-label={`Request booking for ${service.title}`}
                        >
                          <Calendar className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Book</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
