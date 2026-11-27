"use client";

import React, { useEffect, useId, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  EyeOff,
  Layers,
  Sparkles,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import {
  formatServicePrice,
  type ProfilePerspective,
  type ProfileServiceItem,
} from "@/data/mockProfiles";
import { EditorialModalShell } from "./ProfileModals";
import { getAvailabilityStyle } from "./ProfileServicesTab";
import { ClientBookingRequestFlow } from "./ClientBookingRequestFlow";

interface ServiceDetailModalProps {
  service: ProfileServiceItem | null;
  providerName: string;
  providerUsername: string;
  perspective: ProfilePerspective;
  initialMode?: "details" | "booking";
  onClose: () => void;
}

export function ServiceDetailModal({
  service,
  providerName,
  providerUsername,
  perspective,
  initialMode = "details",
  onClose,
}: ServiceDetailModalProps) {
  const [viewMode, setViewMode] = useState<"details" | "booking">("details");
  const titleId = useId();

  useEffect(() => {
    if (service) {
      setViewMode(initialMode || "details");
    }
  }, [service, initialMode]);

  if (!service) return null;

  const availability = getAvailabilityStyle(service.availabilityStatus);
  const isDraft = !service.isPublished;
  const priceDisplay = formatServicePrice(service);

  return (
    <EditorialModalShell
      isOpen={Boolean(service)}
      onClose={onClose}
      titleId={titleId}
      maxWidthClass="max-w-3xl"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 border-b border-[#203B35]/10 px-5 sm:px-7 py-4 bg-[#FAF8F3]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.15em] text-[#5D635F]">
            <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
            <span>{service.category}</span>
            <span>·</span>
            <span>@{providerUsername}</span>
            {viewMode === "booking" && (
              <>
                <span>·</span>
                <span className="text-[#203B35] font-semibold">
                  Booking Request Flow
                </span>
              </>
            )}
          </div>
          <h2
            id={titleId}
            className="mt-1 font-serif text-2xl sm:text-[1.95rem] leading-tight text-[#203B35] truncate"
          >
            {service.title}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {viewMode === "booking" && (
            <button
              type="button"
              onClick={() => setViewMode("details")}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#FAF8F3] px-3 py-1.5 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span className="hidden sm:inline">View Service Specs</span>
              <span className="sm:hidden">Specs</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* View Mode Switching: Details View vs Multi-step Client Booking Request Flow */}
      {viewMode === "booking" ? (
        <ClientBookingRequestFlow
          service={service}
          providerName={providerName}
          providerUsername={providerUsername}
          onCancel={onClose}
          onComplete={onClose}
          onViewServiceDetails={() => setViewMode("details")}
        />
      ) : (
        <>
          {/* Scrollable Details Body */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
            {isDraft && perspective === "owner" && (
              <div className="flex items-start gap-2.5 rounded-xl border border-[#203B35]/20 bg-[#EFECE2] p-3.5 text-[13px] text-[#203B35]">
                <EyeOff className="h-4 w-4 shrink-0 mt-0.5 text-[#203B35]" />
                <div>
                  <p className="font-medium">Unpublished Draft · Owner View Only</p>
                  <p className="text-[#5D635F] mt-0.5">
                    This service draft is hidden from public visitors and does not
                    accept booking requests until published.
                  </p>
                </div>
              </div>
            )}

            {/* Cover Preview & Badges */}
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]">
              <Image
                src={service.coverUrl}
                alt={service.coverAlt}
                fill
                sizes="(max-width: 768px) 95vw, 720px"
                className="object-cover"
              />
              <span
                className={`absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border bg-[#FAF8F3]/95 backdrop-blur-sm px-3 py-1 text-[11.5px] font-medium ${availability.pillClass}`}
              >
                <span className={`h-2 w-2 rounded-full ${availability.dotClass}`} />
                <span>{service.availabilityStatus}</span>
              </span>
            </div>

            {/* Key Specifications Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                  {service.pricingModel}
                </p>
                <p className="mt-1 font-serif text-[1.65rem] leading-none text-[#203B35] tabular-nums">
                  {priceDisplay}
                </p>
              </div>

              <div className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                  Estimated Duration
                </p>
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#203B35]">
                  <Clock className="h-4 w-4 text-[#9DB5A5]" />
                  <span>{service.estimatedDuration}</span>
                </p>
              </div>

              <div className="rounded-xl border border-[#203B35]/10 bg-[#F6F3EB] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                  Lead Notice
                </p>
                <p className="mt-1.5 text-[13.5px] font-medium text-[#203B35]">
                  {service.minNotice}
                </p>
              </div>
            </div>

            {/* Description & Deliverables */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-4">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-1.5">
                    About This Service
                  </p>
                  <p className="text-[14.5px] leading-[1.72] text-[#282B2A]/90">
                    {service.fullDescription}
                  </p>
                </div>

                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F] mb-2">
                    What Is Included
                  </p>
                  <ul className="space-y-2">
                    {service.deliverables.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-[13.5px] text-[#282B2A]/85 leading-snug"
                      >
                        <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#9DB5A5]/25 text-[#203B35]">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="md:col-span-5 space-y-3">
                <div className="rounded-2xl border border-[#203B35]/10 bg-[#F6F3EB] p-4 space-y-3.5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                      Availability Window
                    </p>
                    <p className="mt-1 text-[13.5px] font-medium text-[#203B35] leading-snug">
                      {service.availabilityDetail}
                    </p>
                  </div>

                  <div className="border-t border-[#203B35]/10 pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                      Format
                    </p>
                    <p className="mt-1 text-[13px] text-[#282B2A]/85">
                      {service.sessionFormat}
                    </p>
                  </div>

                  <div className="border-t border-[#203B35]/10 pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#5D635F]">
                      Revisions
                    </p>
                    <p className="mt-1 text-[13px] text-[#282B2A]/85">
                      {service.revisionsIncluded}
                    </p>
                  </div>
                </div>

                {/* Booking Policy Hint */}
                <div className="rounded-2xl border border-[#9DB5A5]/40 bg-[#9DB5A5]/10 p-3.5 text-[12px] text-[#203B35] space-y-1">
                  <p className="font-medium">Operational Booking Policy</p>
                  <p className="text-[#5D635F] leading-relaxed">
                    Multiple clients may request the same time slot. Selection
                    does not immediately reject other pending requests.
                    Alternative times may be negotiated separately.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#203B35]/10 px-5 sm:px-7 py-4 bg-[#FAF8F3]">
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#5D635F]">
              <Layers className="h-3.5 w-3.5 text-[#9DB5A5]" />
              <span>
                {isDraft
                  ? "Publish this draft to enable visitor booking requests."
                  : "Pure operational scheduling · Direct off-platform payments."}
              </span>
            </span>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35]"
              >
                Close
              </button>
              <button
                type="button"
                disabled={isDraft}
                onClick={() => setViewMode("booking")}
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm disabled:opacity-45 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <Calendar className="h-4 w-4 text-[#9DB5A5]" />
                <span>Request Booking</span>
              </button>
            </div>
          </div>
        </>
      )}
    </EditorialModalShell>
  );
}
