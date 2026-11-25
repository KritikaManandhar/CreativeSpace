"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Tag as TagIcon,
  Plus,
  X,
  FileText,
  Sliders,
  HelpCircle,
  Hash,
  Layers,
  Wand2,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import {
  ALL_CATEGORIES,
  getCategoryConfig,
  EditProjectFormData,
} from "./editTypes";

export interface MainContentEditorProps {
  formData: EditProjectFormData;
  onChange: (fields: Partial<EditProjectFormData>) => void;
  onMetadataChange: (key: string, value: any) => void;
  titleError?: string | null;
}

export function MainContentEditor({
  formData,
  onChange,
  onMetadataChange,
  titleError,
}: MainContentEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const activeCategoryConfig = getCategoryConfig(formData.category);

  // Handle adding tag
  const handleAddTag = (tagToAdd: string) => {
    const cleanTag = tagToAdd
      .toLowerCase()
      .trim()
      .replace(/^#/, "")
      .replace(/[^a-z0-9-_]/g, "");

    if (!cleanTag) return;
    if (formData.tags.includes(cleanTag)) {
      setTagInput("");
      return;
    }

    onChange({
      tags: [...formData.tags, cleanTag],
    });
    setTagInput("");
  };

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Handle removing tag
  const handleRemoveTag = (tagToRemove: string) => {
    onChange({
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  return (
    <div className="space-y-8">
      {/* ============================================================ */}
      {/* 1. PROJECT TITLE & EDITORIAL HEADLINE                        */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-7 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-[#203B35]/8 text-[#203B35] flex items-center justify-center font-mono text-xs font-semibold">
              01
            </span>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Project Title & Identity
            </h2>
          </div>
          <span
            className={`text-xs font-mono ${
              formData.title.length > 120
                ? "text-rose-600 font-bold"
                : "text-[#92958F]"
            }`}
          >
            {formData.title.length} / 120
          </span>
        </div>

        <div>
          <label
            htmlFor="project-title-input"
            className="block text-xs font-semibold text-[#203B35] mb-1.5"
          >
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="project-title-input"
            type="text"
            required
            maxLength={120}
            value={formData.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Celestial Horizon: Botanical Monograph"
            className={`w-full px-4 py-3 rounded-2xl bg-[#F6F3EB] border text-sm sm:text-base text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:bg-white transition-colors ${
              titleError
                ? "border-rose-400 focus:border-rose-500 ring-2 ring-rose-100"
                : "border-[#203B35]/15 focus:border-[#203B35]"
            }`}
          />
          {titleError ? (
            <p className="mt-1.5 text-xs text-rose-600">{titleError}</p>
          ) : (
            <p className="mt-1 text-[11px] text-[#5D635F]">
              A striking, memorable headline representing your work across feeds and galleries.
            </p>
          )}
        </div>

        {/* Short Caption / Subtitle */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="project-caption-input"
              className="text-xs font-semibold text-[#203B35]"
            >
              Exhibition Caption / Editorial Teaser (Optional)
            </label>
            <span className="text-[11px] font-mono text-[#92958F]">
              {(formData.caption || "").length} / 280
            </span>
          </div>
          <input
            id="project-caption-input"
            type="text"
            maxLength={280}
            value={formData.caption || ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="A short punchy teaser or summary displayed on card previews..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs sm:text-sm text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
          />
          <p className="mt-1 text-[11px] text-[#5D635F]">
            Appears in the feed summary, social shares, and as the introductory callout.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CONCEPT NOTE & ARTIST STATEMENT                          */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-7 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-[#203B35]/8 text-[#203B35] flex items-center justify-center font-mono text-xs font-semibold">
              02
            </span>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Artist Statement & Concept Note
            </h2>
          </div>
          <span
            className={`text-xs font-mono ${
              formData.description.length > 2000
                ? "text-rose-600 font-bold"
                : "text-[#92958F]"
            }`}
          >
            {formData.description.length} / 2000
          </span>
        </div>

        <div>
          <label
            htmlFor="project-description-input"
            className="block text-xs font-semibold text-[#203B35] mb-1.5"
          >
            Concept Description
          </label>
          <textarea
            id="project-description-input"
            rows={5}
            maxLength={2000}
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Share the inspiration, medium, technique, conceptual motivation, or creative journey behind this work..."
            className="w-full p-4 rounded-2xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs sm:text-sm text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white resize-y transition-colors leading-relaxed"
          />
          <p className="mt-1.5 text-[11px] text-[#5D635F]">
            Detailed artist statements foster deeper engagement and higher appreciation from peers and clients.
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. DISCIPLINE & CATEGORY SELECTION                          */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-7 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-[#203B35]/8 text-[#203B35] flex items-center justify-center font-mono text-xs font-semibold">
              03
            </span>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Creative Discipline & Category
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5D635F]">
            Select Primary Medium
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#203B35] mb-2">
            Primary Discipline
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {ALL_CATEGORIES.map((catName) => {
              const isSelected = formData.category === catName;
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => onChange({ category: catName })}
                  className={`flex flex-col text-left p-3 rounded-2xl border text-xs transition-all ${
                    isSelected
                      ? "bg-[#203B35] text-[#FAF8F3] border-[#203B35] shadow-md scale-[1.02]"
                      : "bg-[#F6F3EB] text-[#282B2A] border-[#203B35]/12 hover:border-[#203B35]/30 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <CelestialSpark
                      className={`w-3 h-3 ${
                        isSelected ? "text-[#9DB5A5]" : "text-[#203B35]/60"
                      }`}
                    />
                    <span className="truncate">{catName}</span>
                  </div>
                  <span
                    className={`text-[10px] mt-1 line-clamp-1 ${
                      isSelected ? "text-[#9DB5A5]" : "text-[#5D635F]"
                    }`}
                  >
                    {getCategoryConfig(catName).description || ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Category Technical Specifications */}
        {activeCategoryConfig.fields && activeCategoryConfig.fields.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[#203B35]/10 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              <Sliders className="w-3.5 h-3.5 text-[#203B35]" />
              <span>{formData.category} Technical Specifications (Metadata)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCategoryConfig.fields.map((field) => {
                const val = formData.metadata?.[field.key] ?? "";
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-[11.5px] font-semibold text-[#203B35]">
                      {field.label}
                    </label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      value={val}
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        onMetadataChange(
                          field.key,
                          field.type === "number"
                            ? e.target.value === ""
                              ? ""
                              : Number(e.target.value)
                            : e.target.value
                        )
                      }
                      className="w-full h-10 px-3.5 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. TAGS & DISCOVERY TAXONOMY                                 */}
      {/* ============================================================ */}
      <div className="rounded-3xl bg-[#FAF8F3] border border-[#203B35]/12 p-6 sm:p-7 shadow-[0_2px_12px_rgba(32,59,53,0.03)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-xl bg-[#203B35]/8 text-[#203B35] flex items-center justify-center font-mono text-xs font-semibold">
              04
            </span>
            <h2 className="text-sm font-mono uppercase tracking-wider text-[#203B35] font-semibold">
              Tags & Discovery Taxonomy
            </h2>
          </div>
          <span className="text-[11px] font-mono text-[#5D635F]">
            {formData.tags.length} active tags
          </span>
        </div>

        {/* Active Tag Chips */}
        <div className="flex flex-wrap items-center gap-2 min-h-10 p-2.5 rounded-2xl bg-[#F6F3EB] border border-[#203B35]/12">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] text-xs font-mono font-medium text-[#203B35] border border-[#203B35]/15 shadow-xs"
            >
              <Hash className="w-3 h-3 text-[#92958F]" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="p-0.5 rounded-full hover:bg-rose-100 hover:text-rose-700 text-[#92958F] transition-colors"
                title={`Remove #${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {/* Add Tag Input */}
          <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDownTag}
              placeholder={
                formData.tags.length === 0
                  ? "Type a tag and press Enter or comma..."
                  : "Add more tags..."
              }
              className="w-full bg-transparent px-2 py-1 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none"
            />
            {tagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-2.5 py-1 rounded-full bg-[#203B35] text-[#FAF8F3] text-[11px] font-medium shrink-0 shadow-xs"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Suggested Tags */}
        {activeCategoryConfig.suggestedTags && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-[#5D635F] block mb-2">
              Suggested for {formData.category}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeCategoryConfig.suggestedTags.map((suggested) => {
                const isAlreadyAdded = formData.tags.includes(suggested);
                if (isAlreadyAdded) return null;
                return (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => handleAddTag(suggested)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#EFECE2] text-[#203B35] text-[11px] font-mono border border-[#203B35]/12 transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5 text-[#5D635F]" />
                    <span>#{suggested}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
