"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  FileText,
  Music,
  Video as VideoIcon,
  Globe,
  Users,
  Lock,
  CheckCircle2,
  Layers,
  Calendar,
  Sliders,
  Hash,
  Eye,
} from "lucide-react";
import { CelestialSpark, CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { EditProjectFormData, getCategoryConfig } from "./editTypes";
import { ProjectAsset, getCategoryArtwork, formatFileSize } from "@/components/project-detail/projectTypes";

export interface ProjectLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: EditProjectFormData;
  creator: {
    displayName: string;
    username: string;
    avatarUrl?: string | null;
  };
  onSave?: () => void;
  isSubmitting?: boolean;
}

export function ProjectLivePreviewModal({
  isOpen,
  onClose,
  formData,
  creator,
  onSave,
  isSubmitting = false,
}: ProjectLivePreviewModalProps) {
  const [activeAssetIndex, setActiveAssetIndex] = useState(0);

  if (!isOpen) return null;

  const categoryConfig = getCategoryConfig(formData.category);
  const fallbackCoverUrl = getCategoryArtwork(formData.category);
  const effectiveCover = formData.coverImageUrl || fallbackCoverUrl;

  const displayAssets: ProjectAsset[] = formData.assets.length > 0
    ? formData.assets
    : [
        {
          id: "preview-cover",
          projectId: formData.id,
          versionId: null,
          fileName: "Cover Artwork Preview",
          mimeType: "image/jpeg",
          fileSize: 1024 * 1024,
          downloadUrl: effectiveCover,
          createdAt: new Date().toISOString(),
        },
      ];

  const activeAsset = displayAssets[activeAssetIndex] || displayAssets[0];
  const hasMultipleAssets = displayAssets.length > 1;

  // Asset type detection
  const getAssetType = (asset?: ProjectAsset): "image" | "video" | "audio" | "document" => {
    if (!asset) return "image";
    const mime = asset.mimeType?.toLowerCase() || "";
    const name = asset.fileName?.toLowerCase() || "";
    if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(name)) return "video";
    if (mime.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(name)) return "audio";
    if (
      mime.includes("pdf") ||
      mime.includes("document") ||
      mime.includes("zip") ||
      /\.(pdf|doc|docx|ai|psd|fig|zip)$/i.test(name)
    ) {
      return "document";
    }
    return "image";
  };

  const activeType = getAssetType(activeAsset);

  // Status badge
  const renderStatusBadge = () => {
    if (formData.status === "Completed") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#203B35] text-[#FAF8F3] text-[11px] font-mono tracking-wider font-semibold shadow-xs">
          <CheckCircle2 className="w-3 h-3 text-[#9DB5A5]" />
          <span>FINAL EXHIBITION</span>
        </span>
      );
    }
    if (formData.status === "InProgress" || formData.status === "InReview") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C8BDE0]/40 text-[#203B35] text-[11px] font-mono tracking-wider font-semibold border border-[#203B35]/15">
          <Sparkles className="w-3 h-3 text-[#203B35]" />
          <span>{formData.status === "InReview" ? "IN REVIEW" : "WORK IN PROGRESS"}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EFECE2] text-[#5D635F] text-[11px] font-mono tracking-wider border border-[#203B35]/10">
        <Layers className="w-3 h-3 text-[#5D635F]" />
        <span>CONCEPT DRAFT</span>
      </span>
    );
  };

  // Visibility badge
  const renderVisibilityBadge = () => {
    if (formData.visibility === "Public") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F]">
          <Globe className="w-3 h-3 text-[#203B35]" />
          <span>Public</span>
        </span>
      );
    }
    if (formData.visibility === "CollaboratorsOnly") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#5D635F]">
          <Users className="w-3 h-3 text-[#203B35]" />
          <span>Collaborators Only</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#92958F]">
        <Lock className="w-3 h-3 text-[#92958F]" />
        <span>Private</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[#162A26]/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-headline"
    >
      {/* Top Banner Toolbar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#FAF8F3] border-b border-[#203B35]/15 shadow-sm">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#203B35]" />
          <span className="text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
            Live Exhibition Preview
          </span>
          <span className="hidden sm:inline text-xs text-[#5D635F]">
            (Viewing changes before committing to database)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#203B35] hover:bg-[#162A26] text-xs font-semibold text-[#FAF8F3] shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9DB5A5]" />
              <span>{isSubmitting ? "Saving..." : "Save Now"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#5D635F] hover:text-[#203B35] hover:bg-[#EFECE2] transition-colors"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Body */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 my-4 space-y-10 bg-[#F6F3EB] rounded-3xl border border-[#203B35]/15 shadow-2xl">
        {/* ============================================================ */}
        {/* 1. EDITORIAL HEADER & METADATA OVERVIEW                      */}
        {/* ============================================================ */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF8F3] text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold border border-[#203B35]/15 shadow-xs">
              <CelestialSpark className="w-3 h-3 text-[#203B35]" />
              <span>{formData.category}</span>
            </span>

            {renderStatusBadge()}
            {renderVisibilityBadge()}
          </div>

          <h1
            id="preview-modal-headline"
            className="font-serif italic font-normal text-3xl sm:text-5xl md:text-6xl text-[#203B35] tracking-tight leading-[1.08] text-balance"
          >
            {formData.title || "Untitled Creative Work"}
          </h1>

          {/* Creator Byline */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-[#5D635F]">
            <div className="inline-flex items-center gap-2 text-[#203B35] font-semibold">
              <div className="h-7 w-7 rounded-full bg-[#203B35] text-[#F6F3EB] flex items-center justify-center text-xs overflow-hidden ring-1 ring-[#203B35]/15">
                {creator.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <CreatorAvatar
                    name={creator.displayName}
                    initials={creator.displayName.slice(0, 2).toUpperCase()}
                    tone="#203B35"
                    accent="#C8BDE0"
                    size="xs"
                  />
                )}
              </div>
              <span>{creator.displayName}</span>
              <span className="text-[11px] font-mono text-[#92958F]">
                @{creator.username}
              </span>
            </div>

            <span className="text-[#203B35]/20">•</span>

            <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">
              <Calendar className="w-3.5 h-3.5 text-[#92958F]" />
              <span>Updated just now</span>
            </span>

            <span className="text-[#203B35]/20">•</span>

            <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px]">
              <Layers className="w-3.5 h-3.5 text-[#92958F]" />
              <span>{formData.assets.length} work assets</span>
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. IMMERSIVE MEDIA VIEWPORT                                  */}
        {/* ============================================================ */}
        <div className="relative w-full rounded-3xl bg-[#FAF8F3] border border-[#203B35]/15 shadow-md overflow-hidden">
          {/* Top Stage Bar */}
          {hasMultipleAssets && (
            <div className="absolute top-4 left-4 z-20">
              <span className="rounded-full bg-[#FAF8F3]/90 backdrop-blur-md px-3 py-1 text-xs font-mono font-medium text-[#203B35] border border-[#203B35]/10 shadow-xs">
                {activeAssetIndex + 1} / {displayAssets.length}
              </span>
            </div>
          )}

          {/* Media Viewport */}
          <div className="relative w-full min-h-[340px] sm:min-h-[460px] md:min-h-[520px] max-h-[70vh] bg-[#162A26] flex items-center justify-center p-4 overflow-hidden">
            {activeType === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeAsset?.downloadUrl || effectiveCover}
                alt={activeAsset?.fileName || formData.title}
                className="max-h-[66vh] w-auto max-w-full object-contain rounded-xl shadow-xl"
              />
            )}

            {activeType === "video" && (
              <div className="text-center text-white space-y-3">
                <VideoIcon className="w-12 h-12 mx-auto text-[#9DB5A5]" />
                <p className="font-serif italic text-lg">{activeAsset.fileName}</p>
                <p className="text-xs font-mono text-white/70">
                  Video asset preview active
                </p>
              </div>
            )}

            {activeType === "audio" && (
              <div className="text-center text-white space-y-3">
                <Music className="w-12 h-12 mx-auto text-[#9DB5A5]" />
                <p className="font-serif italic text-lg">{activeAsset.fileName}</p>
                <p className="text-xs font-mono text-white/70">
                  Audio work preview active
                </p>
              </div>
            )}

            {activeType === "document" && (
              <div className="text-center text-white space-y-3">
                <FileText className="w-12 h-12 mx-auto text-[#9DB5A5]" />
                <p className="font-serif italic text-lg">{activeAsset.fileName}</p>
                <p className="text-xs font-mono text-white/70">
                  Deliverable file · {formatFileSize(activeAsset.fileSize)}
                </p>
              </div>
            )}

            {/* Prev / Next controls */}
            {hasMultipleAssets && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveAssetIndex((prev) =>
                      prev > 0 ? prev - 1 : displayAssets.length - 1
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#FAF8F3]/90 hover:bg-white text-[#203B35] flex items-center justify-center shadow transition-transform hover:scale-105"
                  aria-label="Previous artwork"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveAssetIndex((prev) =>
                      prev < displayAssets.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-[#FAF8F3]/90 hover:bg-white text-[#203B35] flex items-center justify-center shadow transition-transform hover:scale-105"
                  aria-label="Next artwork"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {hasMultipleAssets && (
            <div className="p-3 bg-[#FAF8F3] border-t border-[#203B35]/10 flex items-center justify-center gap-2 overflow-x-auto">
              {displayAssets.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onClick={() => setActiveAssetIndex(idx)}
                  className={`relative h-12 w-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    idx === activeAssetIndex
                      ? "border-[#203B35] scale-105 shadow-sm"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.downloadUrl || effectiveCover}
                    alt={item.fileName}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Short Caption Callout */}
        {formData.caption && (
          <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/15 flex items-start gap-3 shadow-xs">
            <CelestialSpark className="w-4 h-4 text-[#203B35] shrink-0 mt-0.5" />
            <p className="text-sm font-serif italic text-[#203B35] leading-relaxed">
              &ldquo;{formData.caption}&rdquo;
            </p>
          </div>
        )}

        {/* Artist Statement / Concept Description */}
        {formData.description && (
          <div className="max-w-3xl mx-auto space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#5D635F] text-center">
              Concept Statement
            </h3>
            <p className="font-sans text-base sm:text-lg text-[#282B2A] leading-relaxed text-center font-normal">
              {formData.description}
            </p>
          </div>
        )}

        {/* Technical Specifications */}
        {formData.metadata && Object.keys(formData.metadata).length > 0 && (
          <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-[#FAF8F3] border border-[#203B35]/12 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              <Sliders className="w-3.5 h-3.5 text-[#203B35]" />
              <span>Technical Medium & Metadata</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {Object.entries(formData.metadata).map(([key, val]) => {
                if (!val || typeof val === "object") return null;
                return (
                  <div key={key} className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#92958F] uppercase tracking-wider">
                      {key}
                    </span>
                    <p className="text-xs font-semibold text-[#203B35]">
                      {String(val)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {formData.tags && formData.tags.length > 0 && (
          <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-1.5 pt-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FAF8F3] text-xs font-mono text-[#203B35] border border-[#203B35]/15"
              >
                <Hash className="w-2.5 h-2.5 text-[#92958F]" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
