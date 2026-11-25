"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Sparkles, Check } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { EXPLORE_CATEGORIES, ExploreCategory } from "./exploreData";

interface ExploreCategoriesProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryName: string) => void;
  onClearCategory: () => void;
}

export function ExploreCategories({
  selectedCategory,
  onSelectCategory,
  onClearCategory,
}: ExploreCategoriesProps) {
  return (
    <section className="mt-8 sm:mt-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
              Disciplines & Mediums
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9DB5A5]" />
            <span className="text-xs text-[#92958F]">10 Creative Realms</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#203B35] font-normal">
            Creative Categories
          </h2>
        </div>

        {selectedCategory && (
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[#5D635F]">Filtering by:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#203B35] text-[#F6F3EB] text-xs font-medium shadow-sm">
              <Check className="w-3 h-3 text-[#9DB5A5]" />
              <span>{selectedCategory}</span>
              <button
                type="button"
                onClick={onClearCategory}
                className="ml-1 text-[#9DB5A5] hover:text-[#FAF8F3]"
                aria-label="Remove category filter"
              >
                ×
              </button>
            </span>
          </div>
        )}
      </div>

      {/* Asymmetrical Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {EXPLORE_CATEGORIES.map((cat, idx) => {
          const isSelected = selectedCategory === cat.name;

          // Asymmetrical layout styling:
          // Graphic Design (0) spans 2 columns on desktop
          // Digital Art (4) spans 2 columns on desktop
          const spanClass =
            cat.id === "cat-design"
              ? "sm:col-span-2 lg:col-span-2"
              : cat.id === "cat-digital"
              ? "sm:col-span-2 lg:col-span-2"
              : "col-span-1";

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`group relative text-left rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between ${
                cat.bgTone
              } ${spanClass} ${
                isSelected
                  ? "ring-2 ring-[#203B35] border-[#203B35] shadow-lg scale-[1.01]"
                  : `${cat.borderTone} hover:border-[#203B35]/40 hover:shadow-md hover:-translate-y-0.5`
              }`}
            >
              {/* Artwork Container */}
              <div className={`relative w-full overflow-hidden ${cat.aspectClass}`}>
                <Image
                  src={cat.artworkSrc}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Subtle gradient overlay to enhance text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/85 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10">
                    <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
                    {cat.count}
                  </span>

                  <div className="h-7 w-7 rounded-full bg-white/85 backdrop-blur-sm text-[#203B35] flex items-center justify-center opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Artwork bottom caption for featured wide cards */}
                {cat.featured && (
                  <div className="absolute bottom-3 left-3 right-3 hidden sm:block">
                    <p className="text-[11px] text-[#FAF8F3]/90 font-mono tracking-wide drop-shadow-sm">
                      {cat.tagline}
                    </p>
                  </div>
                )}
              </div>

              {/* Card Bottom Meta */}
              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-2">
                <div>
                  <h3 className={`text-base sm:text-lg font-medium tracking-tight ${cat.textColor} font-serif`}>
                    {cat.name}
                  </h3>
                  {!cat.featured && (
                    <p className="text-[11px] text-[#5D635F] line-clamp-1 mt-0.5">
                      {cat.tagline}
                    </p>
                  )}
                </div>

                {isSelected ? (
                  <span className="h-6 w-6 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-[#92958F] group-hover:text-[#203B35] transition-colors shrink-0">
                    Explore →
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
