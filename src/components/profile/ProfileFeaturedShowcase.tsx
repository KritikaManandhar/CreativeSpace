"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  Heart,
  MessageSquare,
  Award,
  Layers,
  FileBox,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface ShowcaseProject {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  coverUrl?: string | null;
  previewImageUrl?: string | null;
  tags?: string[];
  metadata?: Record<string, any>;
  versionCount?: number;
  likeCount?: number;
  commentCount?: number;
  featured?: boolean;
}

interface ProfileFeaturedShowcaseProps {
  items: ShowcaseProject[];
  creatorName: string;
}

export function ProfileFeaturedShowcase({
  items,
  creatorName,
}: ProfileFeaturedShowcaseProps) {
  if (!items || items.length === 0) return null;

  const heroItem = items[0];
  const sideItems = items.slice(1, 3);

  return (
    <section className="mb-14">
      {/* Editorial Section Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#203B35]/10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#203B35]/10 text-[#203B35]">
            <Award className="w-3.5 h-3.5 text-[#203B35]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif text-[#203B35] font-semibold tracking-tight">
              Featured Creative Showcase
            </h2>
          </div>
        </div>
        <span className="text-xs font-mono text-[#5D635F] uppercase tracking-wider hidden sm:inline-block">
          Curated Works
        </span>
      </div>

      {/* Asymmetric Editorial Showcase Layout */}
      <div className={`grid grid-cols-1 ${sideItems.length > 0 ? "lg:grid-cols-12" : ""} gap-6`}>
        {/* Dominant Hero Feature Card */}
        <div className={sideItems.length > 0 ? "lg:col-span-7 xl:col-span-8" : "w-full"}>
          <Link
            href={`/projects/${heroItem.id}`}
            className="group block relative rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 overflow-hidden hover:border-[#203B35]/40 hover:shadow-2xl transition-all duration-300"
          >
            {/* Media Cover Preview */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#EFECE2] overflow-hidden">
              {heroItem.coverUrl || heroItem.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroItem.coverUrl || heroItem.previewImageUrl || ""}
                  alt={heroItem.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#203B35]/15 to-[#FAF8F3] p-8 text-center">
                  <CelestialSpark className="w-10 h-10 text-[#203B35]/40 mb-3" />
                  <p className="text-sm font-serif font-bold text-[#203B35]">
                    {heroItem.title}
                  </p>
                  <p className="text-xs text-[#5D635F] mt-1 font-mono uppercase tracking-wider">
                    {heroItem.category}
                  </p>
                </div>
              )}

              {/* Category & Featured Badge overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[11px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/15 shadow-sm">
                  {heroItem.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#203B35] text-[10px] font-mono text-[#F6F3EB] font-semibold shadow-sm">
                  <Award className="w-3 h-3 text-[#E5A93C]" />
                  Curated
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-3.5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl sm:text-3xl font-serif text-[#203B35] font-semibold group-hover:text-[#162A26] transition-colors leading-snug">
                  {heroItem.title}
                </h3>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#203B35]/10 text-[#203B35] group-hover:bg-[#203B35] group-hover:text-[#F6F3EB] transition-all shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#5D635F] line-clamp-2 leading-relaxed">
                {heroItem.description || "A completed creative milestone from the creator's workspace."}
              </p>

              {/* Tags / Metadata */}
              {heroItem.tags && heroItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {heroItem.tags.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#EFECE2] text-[#203B35]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Metrics Strip */}
              <div className="pt-3 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/30" />
                    <span>{heroItem.likeCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#5D635F]" />
                    <span>{heroItem.commentCount ?? 0}</span>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#203B35] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  View Project Detail →
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Companion Secondary Cards (if more than 1 featured item) */}
        {sideItems.length > 0 && (
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 justify-between">
            {sideItems.map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.id}`}
                className="group flex-1 flex flex-col justify-between rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 p-5 hover:border-[#203B35]/40 hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="relative aspect-[16/10] w-full bg-[#EFECE2] rounded-2xl overflow-hidden mb-4">
                    {item.coverUrl || item.previewImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.coverUrl || item.previewImageUrl || ""}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#EFECE2]">
                        <CelestialSpark className="w-6 h-6 text-[#203B35]/30" />
                      </div>
                    )}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#FAF8F3]/90 backdrop-blur-md text-[10px] font-mono uppercase text-[#203B35] font-semibold">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="text-base font-serif font-bold text-[#203B35] group-hover:text-[#162A26] transition-colors line-clamp-1 mb-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-[#5D635F] line-clamp-2 leading-relaxed">
                    {item.description || "Creative project portfolio work."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-[#203B35]/10 flex items-center justify-between text-xs text-[#5D635F]">
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600/30" />
                    <span>{item.likeCount ?? 0}</span>
                  </span>
                  <span className="font-mono text-[11px] text-[#203B35] font-semibold group-hover:translate-x-0.5 transition-transform">
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
