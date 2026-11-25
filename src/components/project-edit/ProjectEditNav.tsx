"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Eye,
  Check,
  RotateCcw,
  Save,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  CreativeSpaceWordmark,
  CelestialSpark,
} from "@/components/landing/CreativeSpaceBrand";

export interface ProjectEditNavProps {
  projectId: string;
  projectTitle: string;
  category: string;
  isDirty: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onSave: () => void;
  onTogglePreview: () => void;
  isPreviewOpen: boolean;
  canSave: boolean;
}

export function ProjectEditNav({
  projectId,
  projectTitle,
  category,
  isDirty,
  isSubmitting,
  onCancel,
  onSave,
  onTogglePreview,
  isPreviewOpen,
  canSave,
}: ProjectEditNavProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F3]/95 backdrop-blur-md border-b border-[#203B35]/12 shadow-[0_1px_6px_rgba(32,59,53,0.03)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Back & Breadcrumb */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#203B35]/70 hover:text-[#203B35] transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#203B35]/5 shrink-0"
            title="Return to work presentation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Work</span>
          </button>

          <span className="text-[#203B35]/20 hidden sm:inline">/</span>

          <div className="min-w-0 flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EFECE2] text-[10px] font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/10">
              <CelestialSpark className="w-2.5 h-2.5 text-[#203B35]" />
              <span>{category || "Editorial"}</span>
            </span>

            <span className="text-xs sm:text-sm font-serif italic text-[#203B35] truncate max-w-[140px] sm:max-w-[240px] md:max-w-xs font-semibold">
              {projectTitle || "Untitled Creative Work"}
            </span>

            <span className="text-[11px] font-mono text-[#5D635F] hidden lg:inline">
              (Editing)
            </span>
          </div>
        </div>

        {/* Center: Unsaved Edits Badge */}
        <div className="hidden sm:flex items-center gap-2">
          {isDirty ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[11px] font-mono text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-mono text-emerald-800">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>All changes saved</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Preview Toggle */}
          <button
            type="button"
            onClick={onTogglePreview}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              isPreviewOpen
                ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-sm"
                : "bg-white text-[#203B35] border-[#203B35]/15 hover:border-[#203B35]/30 hover:bg-[#F6F3EB]"
            }`}
            title="Preview how this work looks on CreativeSpace"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">
              {isPreviewOpen ? "Hide Preview" : "Preview Work"}
            </span>
          </button>

          {/* Cancel / Discard Button */}
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-full border border-[#203B35]/15 bg-white text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
          >
            Cancel
          </button>

          {/* Save Changes Primary Action */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSubmitting || !canSave}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#203B35] hover:bg-[#162A26] text-xs font-semibold text-[#FAF8F3] shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#9DB5A5]" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
