"use client";

import React, { useRef } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { SEARCH_SUGGESTIONS } from "./exploreData";

interface ExploreHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
  onClearSearch: () => void;
}

export function ExploreHeader({
  searchQuery,
  onSearchChange,
  onSelectSuggestion,
  onClearSearch,
}: ExploreHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section className="relative pt-8 pb-4 sm:pt-12 sm:pb-6 text-center max-w-4xl mx-auto px-4">
      {/* Editorial Category Eyebrow with Celestial Ornament */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFECE2] border border-[#203B35]/10 mb-3.5 shadow-sm">
        <CelestialSpark className="w-3.5 h-3.5 text-[#203B35]" />
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#203B35] font-semibold">
          Curated Creative Universe
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-[#203B35] font-serif">
        Explore
      </h1>

      {/* Subtitle */}
      <p className="mt-2.5 text-sm sm:text-base md:text-lg text-[#5D635F] max-w-2xl mx-auto font-normal leading-relaxed">
        Discover ideas, meet creators, and find inspiration in every corner of creativity.
      </p>

      {/* Prominent Search Bar */}
      <div className="mt-6 sm:mt-7 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-4.5 w-4.5 text-[#5D635F] group-focus-within:text-[#203B35] transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search projects, creators, categories..."
              className="w-full h-12 sm:h-13 pl-11 pr-10 rounded-full bg-[#FAF8F3] border border-[#203B35]/15 text-sm sm:text-base text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white focus:ring-4 focus:ring-[#203B35]/10 transition-all shadow-[0_2px_12px_rgba(32,59,53,0.04)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onClearSearch();
                  inputRef.current?.focus();
                }}
                className="absolute right-3.5 p-1 rounded-full text-[#92958F] hover:text-[#282B2A] hover:bg-[#203B35]/5 transition-colors"
                aria-label="Clear search text"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#92958F] mr-1 hidden sm:inline">
            Trending Searches:
          </span>
          {SEARCH_SUGGESTIONS.slice(0, 5).map((suggestion) => {
            const isActive = searchQuery.toLowerCase() === suggestion.toLowerCase();
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  isActive
                    ? "bg-[#203B35] text-[#F6F3EB] border-[#203B35]"
                    : "bg-[#FAF8F3]/80 hover:bg-[#FAF8F3] text-[#5D635F] hover:text-[#203B35] border-[#203B35]/10 hover:border-[#203B35]/25"
                }`}
              >
                {suggestion}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
