"use client";

import React from "react";
import { Briefcase, Compass, Feather, Layers, RotateCcw, Users } from "lucide-react";
import {
  EXPLORE_CONTENT_TABS,
  EXPLORE_DISCIPLINES,
  type ExploreContentType,
  type ExploreDiscipline,
} from "./exploreTypes";

interface ExploreFiltersProps {
  activeTab: ExploreContentType;
  onTabChange: (tab: ExploreContentType) => void;
  activeDiscipline: ExploreDiscipline;
  onDisciplineChange: (discipline: ExploreDiscipline) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  counts?: {
    creators: number;
    projects: number;
    posts: number;
    services: number;
  };
}

function getTabIcon(tabId: ExploreContentType) {
  switch (tabId) {
    case "creators":
      return <Users className="h-3.5 w-3.5" />;
    case "projects":
      return <Layers className="h-3.5 w-3.5" />;
    case "posts":
      return <Feather className="h-3.5 w-3.5" />;
    case "services":
      return <Briefcase className="h-3.5 w-3.5" />;
    default:
      return <Compass className="h-3.5 w-3.5" />;
  }
}

export function ExploreFilters({
  activeTab,
  onTabChange,
  activeDiscipline,
  onDisciplineChange,
  hasActiveFilters,
  onResetFilters,
  counts,
}: ExploreFiltersProps) {
  return (
    <div className="w-full space-y-6 pt-8 pb-4">
      {/* Category / Content Type Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#203B35]/12 pb-5">
        <div
          role="tablist"
          aria-label="Filter explore directory by content type"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1"
        >
          {EXPLORE_CONTENT_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            let countLabel: number | null = null;
            if (counts) {
              if (tab.id === "creators") countLabel = counts.creators;
              if (tab.id === "projects") countLabel = counts.projects;
              if (tab.id === "posts") countLabel = counts.posts;
              if (tab.id === "services") countLabel = counts.services;
              if (tab.id === "all")
                countLabel =
                  counts.creators +
                  counts.projects +
                  counts.posts +
                  counts.services;
            }

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  isActive
                    ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                    : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A]/80 hover:border-[#203B35]/30 hover:text-[#203B35]"
                }`}
              >
                {getTabIcon(tab.id)}
                <span>{tab.label}</span>
                {countLabel !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[10.5px] tabular-nums ${
                      isActive
                        ? "bg-[#F6F3EB]/20 text-[#F6F3EB]"
                        : "bg-[#EFECE2] text-[#203B35]"
                    }`}
                  >
                    {countLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Reset Filters Shortcut */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex w-fit items-center gap-1.5 text-[12px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Discipline Filter Strip */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
          <span>Filter by Discipline</span>
          <span className="font-mono text-[#92958F]">
            {activeDiscipline === "All" ? "All Disciplines" : activeDiscipline}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Filter by creative discipline"
          className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1"
        >
          {EXPLORE_DISCIPLINES.map((discipline) => {
            const isActive = activeDiscipline === discipline;
            return (
              <button
                key={discipline}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onDisciplineChange(discipline)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40 ${
                  isActive
                    ? "bg-[#203B35] text-[#F6F3EB] font-medium shadow-sm"
                    : "border border-[#203B35]/12 bg-[#FAF8F3] text-[#282B2A]/75 hover:border-[#203B35]/30 hover:text-[#203B35]"
                }`}
              >
                {discipline}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
