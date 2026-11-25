"use client";

import React from "react";
import {
  GitBranch,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Plus,
  FileBox,
  Eye,
  Calendar,
} from "lucide-react";
import {
  ProjectVersion,
  ProjectAsset,
  formatRelativeDate,
  getCategoryArtwork,
} from "./projectTypes";

interface ProjectVersionTimelineProps {
  versions: ProjectVersion[];
  selectedVersionId: string | null;
  onSelectVersion: (versionId: string | null) => void;
  canCreateVersion?: boolean;
  onOpenNewVersionModal?: () => void;
  category: string;
}

export function ProjectVersionTimeline({
  versions,
  selectedVersionId,
  onSelectVersion,
  canCreateVersion = false,
  onOpenNewVersionModal,
  category,
}: ProjectVersionTimelineProps) {
  if (!versions || versions.length === 0) {
    return null;
  }

  // Sort versions by versionNumber descending (latest first)
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const fallbackImg = getCategoryArtwork(category);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-10">
      <div className="space-y-6">
        {/* Section Title & Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#203B35]/10 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-[#203B35]" />
              <h2 className="text-xs font-mono uppercase tracking-[0.16em] text-[#203B35] font-semibold">
                Version Exploration & Process
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#5D635F]">
              Explore how this creative deliverable evolved from initial concept to completed work.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View All / Latest Toggle */}
            <button
              type="button"
              onClick={() => onSelectVersion(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                selectedVersionId === null
                  ? "bg-[#203B35] text-[#FAF8F3] shadow-sm"
                  : "bg-[#EFECE2] text-[#203B35] hover:bg-[#E5E1D5]"
              }`}
            >
              Latest Exhibition
            </button>

            {/* Creator "New Iteration" button */}
            {canCreateVersion && onOpenNewVersionModal && (
              <button
                type="button"
                onClick={onOpenNewVersionModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-xs font-medium hover:bg-[#162A26] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Iteration</span>
              </button>
            )}
          </div>
        </div>

        {/* Versions Gallery Grid / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVersions.map((version) => {
            const isSelected = selectedVersionId === version.id;
            const isFinal = version.status === "Final";
            const isApproved = version.status === "Approved";
            const isDraft = version.status === "Draft";

            const primaryAsset = version.assets?.[0];
            const previewUrl = primaryAsset?.downloadUrl || fallbackImg;
            const assetCount = version.assets?.length || 0;

            return (
              <article
                key={version.id}
                onClick={() => onSelectVersion(version.id)}
                className={`group relative rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-200 border text-left flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#FAF8F3] border-[#203B35] ring-2 ring-[#203B35]/20 shadow-md"
                    : "bg-[#FAF8F3]/60 border-[#203B35]/12 hover:border-[#203B35]/35 hover:bg-[#FAF8F3] hover:shadow-sm"
                }`}
              >
                <div>
                  {/* Top: Version Label & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-[#203B35]">
                      Version {version.versionNumber}
                    </span>

                    {isFinal ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#203B35] text-[#FAF8F3] text-[10px] font-mono font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#9DB5A5]" />
                        <span>FINAL</span>
                      </span>
                    ) : isApproved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#9DB5A5]/40 text-[#203B35] text-[10px] font-mono font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#203B35]" />
                        <span>APPROVED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C8BDE0]/40 text-[#203B35] text-[10px] font-mono font-semibold">
                        <Clock className="w-2.5 h-2.5 text-[#203B35]" />
                        <span>DRAFT IN REVIEW</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview */}
                  <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-[#162A26] mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={`Version ${version.versionNumber} preview`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Quick Select Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#203B35] text-xs font-medium shadow-md">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Viewing Version" : "View This Iteration"}</span>
                      </span>
                    </div>

                    {assetCount > 1 && (
                      <div className="absolute bottom-2 right-2">
                        <span className="rounded-full bg-[#203B35]/85 px-2 py-0.5 text-[9.5px] font-mono text-[#FAF8F3]">
                          {assetCount} assets
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes / Critique description */}
                  {version.notes ? (
                    <p className="text-xs text-[#282B2A]/85 line-clamp-2 leading-relaxed mb-3">
                      {version.notes}
                    </p>
                  ) : (
                    <p className="text-xs italic text-[#92958F] mb-3">
                      Iteration v{version.versionNumber} milestones recorded in studio timeline.
                    </p>
                  )}
                </div>

                {/* Bottom: Date & Active Marker */}
                <div className="pt-2 border-t border-[#203B35]/10 flex items-center justify-between text-[11px] font-mono text-[#5D635F]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#92958F]" />
                    <span>{formatRelativeDate(version.createdAt)}</span>
                  </span>

                  <span
                    className={`font-semibold transition-colors ${
                      isSelected ? "text-[#203B35]" : "text-[#92958F] group-hover:text-[#203B35]"
                    }`}
                  >
                    {isSelected ? "Active View ✓" : "Inspect →"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
