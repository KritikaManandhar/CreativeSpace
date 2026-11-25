"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Tag,
  Wrench,
  Calendar,
  Layers,
  Compass,
  CheckCircle2,
  Sliders,
  FileCode,
  Palette,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface ProjectMetadataSectionProps {
  description: string | null;
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function ProjectMetadataSection({
  description,
  category,
  tags,
  metadata = {},
  createdAt,
  updatedAt,
}: ProjectMetadataSectionProps) {
  // Normalize metadata entries, omitting internal ids or empty values
  const metadataEntries = Object.entries(metadata || {}).filter(([key, value]) => {
    if (value === null || value === undefined || value === "") return false;
    if (key === "previewAssetId" || key === "coverAssetId") return false;
    return true;
  });

  const hasTags = tags && tags.length > 0;
  const hasMetadata = metadataEntries.length > 0;

  // Format key label for editorial presentation
  const formatKeyLabel = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: About this Work / Statement */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#203B35]" />
            <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#203B35] font-semibold">
              About This Project
            </h2>
          </div>

          <div className="prose prose-slate max-w-none">
            {description ? (
              <p className="font-sans text-sm sm:text-base text-[#282B2A] leading-relaxed whitespace-pre-line font-normal">
                {description}
              </p>
            ) : (
              <p className="text-sm italic text-[#92958F]">
                The creator has not published an extended description for this work yet.
              </p>
            )}
          </div>

          {/* Tags */}
          {hasTags && (
            <div className="pt-3 border-t border-[#203B35]/10 space-y-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#92958F]">
                Exploration Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#203B35] bg-[#EFECE2]/80 hover:bg-[#EFECE2] border border-[#203B35]/10 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <span>#{tag}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Editorial Specifications & Technical Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl bg-[#FAF8F3] border border-[#203B35]/12 p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-3">
              <h3 className="text-xs font-mono uppercase tracking-[0.14em] text-[#203B35] font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#203B35]" />
                <span>Project Specifications</span>
              </h3>
              <span className="text-[10px] font-mono text-[#92958F]">Verified</span>
            </div>

            <dl className="divide-y divide-[#203B35]/8 text-xs">
              {/* Discipline / Category */}
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-[#5D635F] font-medium">Discipline</dt>
                <dd className="font-semibold text-[#203B35] flex items-center gap-1">
                  <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
                  <span>{category}</span>
                </dd>
              </div>

              {/* Published Date */}
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-[#5D635F] font-medium">Published</dt>
                <dd className="font-mono text-[#282B2A]">
                  {new Date(createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>

              {/* Last Updated */}
              {updatedAt && updatedAt !== createdAt && (
                <div className="py-2.5 flex items-center justify-between">
                  <dt className="text-[#5D635F] font-medium">Last Iteration</dt>
                  <dd className="font-mono text-[#282B2A]">
                    {new Date(updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </dd>
                </div>
              )}

              {/* Dynamic Metadata Attributes */}
              {hasMetadata &&
                metadataEntries.map(([k, val]) => (
                  <div key={k} className="py-2.5 flex items-center justify-between gap-3">
                    <dt className="text-[#5D635F] font-medium truncate max-w-[140px]">
                      {formatKeyLabel(k)}
                    </dt>
                    <dd className="font-mono text-[#282B2A] text-right truncate max-w-[190px]">
                      {typeof val === "boolean"
                        ? val
                          ? "Yes"
                          : "No"
                        : typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
