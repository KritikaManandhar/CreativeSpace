"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Settings } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type {
  DashboardBookingItem,
  DashboardIdeaItem,
} from "@/data/mockDashboard";
import type { UnifiedBookingItem } from "@/lib/bookingStore";
import type {
  ProfileProjectItem,
  ProfileServiceItem,
  ProfilePostItem,
} from "@/data/mockProfiles";

interface WelcomeOverviewSectionProps {
  user: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
    headline?: string;
    location?: string;
  };
  projects?: ProfileProjectItem[];
  services?: ProfileServiceItem[];
  bookings?: (UnifiedBookingItem | DashboardBookingItem)[];
  ideas?: DashboardIdeaItem[];
  posts?: ProfilePostItem[];
  onNavigateSection?: (sectionId: string) => void;
}

export function WelcomeOverviewSection({
  user,
  bookings,
}: WelcomeOverviewSectionProps) {
  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const activeBookingsCount = bookings ? bookings.length : 3;

  return (
    <section aria-label="Welcome Overview" className="space-y-6">
      {/* ======================================================== */}
      {/* Top Banner: Greeting & Creator Summary                   */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-[#203B35]/12 bg-gradient-to-br from-[#FAF8F3] via-[#FAF8F3] to-[#EFECE2]/70 p-6 sm:p-8 lg:p-10 shadow-[0_4px_24px_-8px_rgba(32,59,53,0.06)]">
        {/* Delicate background aura */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#9DB5A5]/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-1/3 h-56 w-56 rounded-full bg-[#C8BDE0]/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
          {/* Creator Profile Summary */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar with concentric ring & status dot */}
            <div className="relative shrink-0">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-2xl border-2 border-[#203B35]/15 bg-[#203B35] shadow-sm">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.displayName}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-serif text-2xl font-semibold text-[#F6F3EB]">
                    {user.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#FAF8F3] shadow"
                title="Studio Open"
              >
                <span className="h-3 w-3 rounded-full bg-[#4E9F76] ring-2 ring-[#FAF8F3]" />
              </span>
            </div>

            {/* Profile Info & Eyebrow */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2">
                <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#203B35]/75">
                  Private Studio Workspace
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#203B35]">
                {greeting},{" "}
                <span className="italic font-normal text-[#203B35]">
                  {user.displayName.split(" ")[0]}
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-[#5D635F]">
                <span className="font-medium text-[#203B35]">
                  @{user.username}
                </span>
                <span>•</span>
                <span>{user.headline || "Digital Illustrator & Concept Artist"}</span>
                {user.location && (
                  <>
                    <span>•</span>
                    <span>{user.location}</span>
                  </>
                )}
              </div>

              {/* Status pill & Public Link */}
              <div className="pt-1 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#9DB5A5]/50 bg-[#9DB5A5]/20 px-3 py-1 text-[11.5px] font-medium text-[#203B35]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4E9F76] animate-pulse" />
                  Studio Open for Commissions
                </span>
                <span className="inline-flex items-center rounded-full border border-[#203B35]/12 bg-[#FAF8F3] px-3 py-1 text-[11.5px] font-medium text-[#203B35]/80">
                  {activeBookingsCount} Bookings Active
                </span>
              </div>
            </div>
          </div>

          {/* Action links to Public Profile & Settings */}
          <div className="flex flex-wrap items-center gap-3 self-stretch sm:self-auto shrink-0">
            <Link
              href={`/profile/${user.username}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-2.5 text-xs font-semibold text-[#203B35] shadow-sm hover:bg-[#EFECE2] hover:border-[#203B35]/35 transition-all"
            >
              <span>View Public Profile</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-[#203B35]/70" />
            </Link>
            <Link
              href="/settings"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#EFECE2]/70 px-3.5 py-2.5 text-xs font-medium text-[#203B35]/80 hover:bg-[#FAF8F3] hover:text-[#203B35] transition-all"
              title="Studio Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
