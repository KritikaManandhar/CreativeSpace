"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Check,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Plus,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  formatServicePrice,
  type ProfileServiceItem,
  type ServiceAvailabilityStatus,
} from "@/data/mockProfiles";
import { getAvailabilityStyle } from "@/components/profile/ProfileServicesTab";

interface MyServicesSectionProps {
  services: ProfileServiceItem[];
  onCreateService: () => void;
  onTogglePublication: (serviceId: string) => void;
  onEditService?: (service: ProfileServiceItem) => void;
}

export function MyServicesSection({
  services,
  onCreateService,
  onTogglePublication,
  onEditService,
}: MyServicesSectionProps) {
  const [filter, setFilter] = useState<"all" | "published" | "drafts">("all");

  const publishedCount = useMemo(
    () => services.filter((s) => s.isPublished).length,
    [services]
  );
  const draftCount = services.length - publishedCount;

  const filteredServices = useMemo(() => {
    if (filter === "published") return services.filter((s) => s.isPublished);
    if (filter === "drafts") return services.filter((s) => !s.isPublished);
    return services;
  }, [services, filter]);

  return (
    <section id="services" aria-label="My Services" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3.5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-[#203B35]">
              My Services
            </h2>
            <span className="inline-flex items-center rounded-full bg-[#EFECE2] px-2.5 py-0.5 font-mono text-[11px] font-medium text-[#203B35]">
              {services.length}
            </span>
          </div>
          <p className="mt-0.5 text-xs sm:text-[13px] text-[#5D635F]">
            Overview of services created by you and their live publication status.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateService}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#203B35] px-4 py-2 text-xs font-semibold text-[#FAF8F3] hover:bg-[#162A26] transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Service</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "all"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <span>All Services</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("published")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "published"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <Globe className="h-3 w-3" />
          <span>Published</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {publishedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("drafts")}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            filter === "drafts"
              ? "bg-[#203B35] text-[#FAF8F3]"
              : "bg-[#EFECE2]/70 text-[#203B35]/80 hover:bg-[#EFECE2]"
          }`}
        >
          <Lock className="h-3 w-3" />
          <span>Drafts</span>
          <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
            {draftCount}
          </span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const avail = getAvailabilityStyle(service.availabilityStatus);
          const isLive = service.isPublished;

          return (
            <div
              key={service.id}
              className={`group flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
                isLive
                  ? "border-[#203B35]/12 bg-[#FAF8F3] hover:border-[#203B35]/30 hover:shadow-md"
                  : "border-dashed border-[#203B35]/20 bg-[#FAF8F3]/60"
              }`}
            >
              <div>
                {/* Top bar: Category + Publication status badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#203B35]/80 bg-[#EFECE2] px-2.5 py-0.5 rounded-full">
                      {service.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${avail.pillClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${avail.dotClass}`} />
                      {service.availabilityStatus}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      isLive
                        ? "bg-[#9DB5A5]/25 text-[#203B35] border border-[#9DB5A5]/60"
                        : "bg-[#EFECE2] text-[#5D635F] border border-[#203B35]/15"
                    }`}
                  >
                    {isLive ? (
                      <>
                        <Globe className="h-3 w-3 text-[#4E9F76]" />
                        <span>Published</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 text-[#5D635F]" />
                        <span>Draft</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Service Title & Pricing */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-2">
                  <h3 className="font-serif text-lg sm:text-xl font-normal text-[#203B35] group-hover:text-[#162A26] transition-colors">
                    {service.title}
                  </h3>
                  <div className="shrink-0 text-left sm:text-right">
                    <span className="font-serif text-xl sm:text-2xl font-medium text-[#203B35]">
                      {formatServicePrice(service)}
                    </span>
                    <span className="ml-1 text-[11px] text-[#5D635F]">
                      {service.pricingModel}
                    </span>
                  </div>
                </div>

                {/* Short description */}
                <p className="text-xs sm:text-[13px] text-[#5D635F] leading-relaxed line-clamp-2">
                  {service.shortDescription}
                </p>

                {/* Key metadata pills */}
                <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs text-[#5D635F]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EFECE2] px-2.5 py-1 text-[11px]">
                    <Clock className="h-3 w-3 text-[#203B35]/70" />
                    <span>{service.estimatedDuration}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#EFECE2] px-2.5 py-1 text-[11px]">
                    <Briefcase className="h-3 w-3 text-[#203B35]/70" />
                    <span className="truncate max-w-[200px]">{service.sessionFormat}</span>
                  </span>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="mt-5 pt-3.5 border-t border-[#203B35]/08 flex flex-wrap items-center justify-between gap-3">
                {/* Instant Publication Toggle */}
                <button
                  type="button"
                  onClick={() => onTogglePublication(service.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isLive
                      ? "bg-[#9DB5A5]/20 text-[#203B35] hover:bg-[#9DB5A5]/35"
                      : "bg-[#EFECE2] text-[#5D635F] hover:bg-[#EFECE2]/90"
                  }`}
                  title={isLive ? "Unpublish to draft" : "Publish to profile"}
                >
                  {isLive ? (
                    <>
                      <ToggleRight className="h-4 w-4 text-[#4E9F76]" />
                      <span>Live on Profile</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4 text-[#5D635F]" />
                      <span>Draft Mode</span>
                    </>
                  )}
                </button>

                {/* Edit & Manage */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEditService?.(service)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3.5 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                  >
                    <span>Edit</span>
                  </button>
                  <Link
                    href={`/profile/anya_art?tab=services`}
                    className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-xs font-medium text-[#203B35] hover:bg-[#203B35] hover:text-[#FAF8F3] hover:border-[#203B35] transition-all"
                  >
                    <span>Preview</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
