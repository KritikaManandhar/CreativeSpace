"use client";

import React from "react";
import { Briefcase, Feather, Layers, Users, X } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import type { ExploreContentType } from "./exploreTypes";

interface ExploreHeaderProps {
  searchQuery: string;
  onClearSearch: () => void;
  activeTab: ExploreContentType;
  onTabChange: (tab: ExploreContentType) => void;
}

const SECTION_SHORTCUTS: Array<{
  id: ExploreContentType;
  number: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "creators", number: "01", label: "Creators", icon: Users },
  { id: "projects", number: "02", label: "Projects", icon: Layers },
  { id: "posts", number: "03", label: "Studio Posts", icon: Feather },
  { id: "services", number: "04", label: "Services", icon: Briefcase },
];

export function ExploreHeader({
  searchQuery,
  onClearSearch,
  activeTab,
  onTabChange,
}: ExploreHeaderProps) {
  return (
    <section
      aria-label="Explore Discovery Header"
      className="relative w-full overflow-hidden border-b border-[#203B35]/10 bg-[#F6F3EB] pt-10 pb-10 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-16"
    >
      {/* Restrained Atmospheric Background Tints */}
      <div
        className="pointer-events-none absolute -top-24 right-[12%] h-[340px] w-[340px] rounded-full bg-[#C8BDE0]/20 blur-[100px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 -left-20 h-[300px] w-[300px] rounded-full bg-[#9DB5A5]/18 blur-[90px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1320px] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 mb-4">
            <CelestialSpark className="h-3.5 w-3.5 text-[#9DB5A5]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#203B35]/80">
              Curated Discovery Atelier
            </span>
            <span className="hidden sm:inline-block h-[1px] w-8 bg-[#9DB5A5]/60" />
          </div>

          {/* Editorial Headline */}
          <h1 className="font-serif text-[2.6rem] sm:text-[3.4rem] lg:text-[4rem] font-normal leading-[1.04] tracking-[-0.025em] text-[#203B35]">
            Explore <span className="italic font-normal">creators</span>, exhibited works &amp; studio services.
          </h1>

          {/* Description */}
          <p className="mt-3.5 text-[15px] sm:text-[16px] leading-[1.7] text-[#282B2A]/80 max-w-2xl">
            A calm editorial space to discover independent makers, explore works in progress,
            read studio process notes, and commission bespoke creative services.
          </p>

          {/* Quick Discovery Navigation Pills */}
          <div className="mt-7 flex flex-wrap items-center gap-2 pt-2">
            <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#92958F] mr-1">
              Explore:
            </span>
            {SECTION_SHORTCUTS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                    isSelected
                      ? "bg-[#203B35] text-[#F6F3EB] font-medium shadow-sm"
                      : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/85 hover:border-[#203B35]/35 hover:text-[#203B35]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                  <span className="font-mono text-[10.5px] opacity-75">{item.number}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Global Search Query Notification Banner */}
          {searchQuery && (
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-4 py-1.5 text-[13px] text-[#203B35] shadow-sm">
              <span className="text-[#5D635F]">Active search:</span>
              <strong className="font-medium">&ldquo;{searchQuery}&rdquo;</strong>
              <button
                type="button"
                onClick={onClearSearch}
                aria-label="Clear active search query"
                className="flex h-5 w-5 items-center justify-center rounded-full text-[#5D635F] hover:bg-[#203B35]/10 hover:text-[#203B35] transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
