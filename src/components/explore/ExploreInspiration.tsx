"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, Sparkles, BookOpen, Layers } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { ExploreCollection } from "./exploreData";

interface ExploreInspirationProps {
  collections: ExploreCollection[];
  onSelectCollection: (collection: ExploreCollection) => void;
}

export function ExploreInspiration({
  collections,
  onSelectCollection,
}: ExploreInspirationProps) {
  return (
    <section className="mt-14 sm:mt-20 mb-12 sm:mb-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#203B35]/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#5D635F] font-semibold">
              Thematic Anthologies
            </span>
            <span className="h-1 w-1 rounded-full bg-[#9DB5A5]" />
            <span className="text-xs text-[#92958F]">Editor&apos;s Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#203B35] font-normal tracking-tight">
            Recommended Inspiration
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-[#5D635F] max-w-md md:text-right font-sans">
          Curated creative projects and collections crafted to spark new horizons in your studio practice.
        </p>
      </div>

      {/* Editorial Collection Showcases */}
      <div className="mt-8 space-y-6 sm:space-y-8">
        {collections.map((col, idx) => {
          // Alternate layout direction for editorial variety
          const isReversed = idx % 2 === 1;

          return (
            <article
              key={col.id}
              className={`rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-8 lg:p-10 hover:border-[#203B35]/30 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col ${
                isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-8 lg:gap-12`}
            >
              {/* Left/Right Text Narrative Content */}
              <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-5">
                <div>
                  {/* Tags & Count */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#EFECE2] text-[10.5px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10">
                      <Layers className="w-3 h-3 text-[#203B35]" />
                      {col.projectCount} Works Included
                    </span>

                    {col.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono text-[#5D635F] px-2 py-0.5 rounded-full bg-white/70 border border-[#203B35]/8"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Collection Title */}
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#203B35] font-medium leading-tight">
                    {col.title}
                  </h3>

                  {/* Curator Narrative Quote */}
                  <blockquote className="mt-4 pl-4 border-l-2 border-[#9DB5A5] italic text-[#282B2A]/85 text-sm sm:text-base leading-relaxed font-serif">
                    &ldquo;{col.curatorNote}&rdquo;
                  </blockquote>
                </div>

                {/* Curator Signature & Button */}
                <div className="pt-4 border-t border-[#203B35]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#203B35] text-[#FAF8F3] flex items-center justify-center font-serif text-xs font-bold">
                      CS
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#203B35]">{col.curatorName}</p>
                      <p className="text-[11px] font-mono text-[#5D635F]">{col.curatorRole}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectCollection(col)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-semibold hover:bg-[#162A26] transition-colors shadow-sm self-start sm:self-auto"
                  >
                    <span>Browse Collection</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#9DB5A5]" />
                  </button>
                </div>
              </div>

              {/* Asymmetrical Artwork Collage Display */}
              <div className="w-full lg:w-1/2 grid grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Main Hero Artwork in Collection */}
                <div className="col-span-8 relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#EFECE2] shadow-md border border-[#203B35]/10 group">
                  <Image
                    src={col.primaryImage}
                    alt={col.title}
                    fill
                    sizes="(max-width: 1024px) 70vw, 35vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Secondary Overlapping Stacked Artworks */}
                <div className="col-span-4 space-y-3 sm:space-y-4">
                  {col.secondaryImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden bg-[#EFECE2] shadow-sm border border-[#203B35]/10 group"
                    >
                      <Image
                        src={img}
                        alt={`${col.title} detail ${i + 1}`}
                        fill
                        sizes="(max-width: 1024px) 30vw, 15vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
