"use client";

import React from "react";
import { Sparkles, SlidersHorizontal, Flame, Clock, RefreshCw } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ExploreProject } from "./exploreData";
import { ExploreProjectCard } from "./ExploreProjectCard";

export type FilterOption =
  | "All"
  | "Popular"
  | "Recent"
  | "Photography"
  | "Design"
  | "Illustration"
  | "Digital Art";

interface ExploreTrendingGalleryProps {
  projects: ExploreProject[];
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
  onSelectProject: (project: ExploreProject) => void;
  onToggleLike: (projectId: string, e: React.MouseEvent) => void;
  onToggleBookmark: (projectId: string, e: React.MouseEvent) => void;
  searchQuery: string;
  selectedCategory: string | null;
  onResetFilters: () => void;
}

const FILTER_TABS: { label: FilterOption; icon?: React.ReactNode }[] = [
  { label: "All" },
  { label: "Popular", icon: <Flame className="w-3.5 h-3.5" /> },
  { label: "Recent", icon: <Clock className="w-3.5 h-3.5" /> },
  { label: "Photography" },
  { label: "Design" },
  { label: "Illustration" },
  { label: "Digital Art" },
];

export function ExploreTrendingGallery({
  projects,
  activeFilter,
  onFilterChange,
  onSelectProject,
  onToggleLike,
  onToggleBookmark,
  searchQuery,
  selectedCategory,
  onResetFilters,
}: ExploreTrendingGalleryProps) {
  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== null || activeFilter !== "All";

  return (
    <section id="trending-gallery" className="mt-12 sm:mt-16">
      {/* Section Header & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#203B35]/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
              Curated Gallery
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9DB5A5]" />
            <span className="text-xs text-[#92958F]">Exhibited Works</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#203B35] font-normal tracking-tight">
            Trending Projects
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[#5D635F] max-w-md md:text-right font-sans">
          An asymmetrical showcase of standout projects, editorial portfolios, and collaborative drafts.
        </p>
      </div>

      {/* Filter Navigation Bar */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.label;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => onFilterChange(tab.label)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#203B35] text-[#FAF8F3] shadow-sm font-semibold"
                    : "bg-[#FAF8F3] text-[#5D635F] hover:text-[#203B35] hover:bg-white border border-[#203B35]/10"
                }`}
              >
                {tab.icon && (
                  <span className={isActive ? "text-[#9DB5A5]" : "text-[#5D635F]"}>
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Count & Reset Filter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs font-mono text-[#5D635F]">
            Showing <strong className="text-[#203B35]">{projects.length}</strong> {projects.length === 1 ? "work" : "works"}
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 text-xs text-[#203B35] hover:text-[#162A26] font-medium underline underline-offset-4 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Asymmetrical Masonry-Style Gallery Grid */}
      {projects.length > 0 ? (
        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
          {projects.map((project) => (
            <ExploreProjectCard
              key={project.id}
              project={project}
              onSelectProject={onSelectProject}
              onToggleLike={onToggleLike}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-10 py-16 px-4 rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 text-center max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-full bg-[#EFECE2] text-[#203B35] flex items-center justify-center mx-auto mb-3">
            <CelestialSpark className="w-6 h-6 text-[#203B35]" />
          </div>
          <h3 className="text-lg font-serif text-[#203B35]">No projects found</h3>
          <p className="mt-1 text-xs text-[#5D635F] max-w-xs mx-auto">
            We couldn&apos;t find any creative works matching your current filter criteria.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 px-4 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-medium hover:bg-[#162A26] transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}
