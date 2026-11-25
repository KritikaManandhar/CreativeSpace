"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Sparkles, Plus, Image as ImageIcon, Check } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS = [
  "Illustration",
  "Photography",
  "Graphic Design",
  "UI/UX Design",
  "Digital Art",
  "Animation",
  "Writing",
  "Music",
  "3D & Spatial",
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Illustration");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"InProgress" | "Completed" | "Idea">("InProgress");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Public");
  const [tagsInput, setTagsInput] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const tagList = tagsInput
        .split(",")
        .map((t) => t.trim().replace(/^#/, ""))
        .filter(Boolean);

      const metadata: Record<string, any> = {};
      if (previewImageUrl.trim()) {
        metadata.previewImageUrl = previewImageUrl.trim();
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          status,
          visibility,
          tags: tagList,
          metadata,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Failed to create creative project.");
        return;
      }

      // Success
      setTitle("");
      setDescription("");
      setTagsInput("");
      setPreviewImageUrl("");
      onClose();

      if (onSuccess) {
        onSuccess();
      } else if (json.data?.id) {
        router.push(`/projects/${json.data.id}`);
      }
    } catch {
      setErrorMessage("Network error while creating project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-project-title"
    >
      {/* Warm Backdrop */}
      <div
        className="fixed inset-0 bg-[#162A26]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl rounded-2xl bg-[#FAF8F3] border border-[#203B35]/20 p-6 sm:p-7 shadow-2xl z-10 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#203B35]/12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#5D635F]">
              <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
              <span>Studio Publishing</span>
            </div>
            <h2 id="create-project-title" className="text-xl font-bold text-[#203B35] font-serif mt-0.5">
              Publish New Creative Work
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#92958F] hover:text-[#203B35] hover:bg-[#EFECE2] transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4.5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Celestial Horizon: Botanical Monograph"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-sm text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
            />
          </div>

          {/* Category & Status grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
                Primary Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
                Project Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
              >
                <option value="InProgress">Work In Progress</option>
                <option value="Completed">Final Deliverable</option>
                <option value="Idea">Initial Concept</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Description / Concept Note
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the community about your creative process, inspiration, or medium..."
              className="w-full p-3 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white resize-none transition-colors"
            />
          </div>

          {/* Preview Image URL */}
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Cover Artwork URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#92958F]" />
              <input
                type="url"
                value={previewImageUrl}
                onChange={(e) => setPreviewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
              />
            </div>
            <p className="text-[11px] text-[#5D635F] mt-1">
              You can also upload high-resolution version assets inside the project workspace.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#203B35] mb-1.5">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="vector, typography, brand, editorial"
              className="w-full h-10 px-3.5 rounded-xl bg-[#F6F3EB] border border-[#203B35]/15 text-xs text-[#282B2A] placeholder-[#92958F] focus:outline-none focus:border-[#203B35] focus:bg-white transition-colors"
            />
          </div>

          {/* Visibility Option */}
          <div className="pt-2 border-t border-[#203B35]/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#203B35] block">
                Visibility
              </span>
              <span className="text-[11px] text-[#5D635F]">
                {visibility === "Public"
                  ? "Public — Show in community feed & discovery"
                  : "Private — Studio draft only"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#EFECE2] p-1 border border-[#203B35]/10">
              <button
                type="button"
                onClick={() => setVisibility("Public")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  visibility === "Public"
                    ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                    : "text-[#5D635F] hover:text-[#203B35]"
                }`}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setVisibility("Private")}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  visibility === "Private"
                    ? "bg-[#203B35] text-[#F6F3EB] shadow-sm"
                    : "text-[#5D635F] hover:text-[#203B35]"
                }`}
              >
                Private
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-full border border-[#203B35]/15 text-xs font-medium text-[#5D635F] hover:bg-[#EFECE2] hover:text-[#203B35] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#203B35] text-xs font-semibold text-[#F6F3EB] hover:bg-[#162A26] disabled:opacity-40 transition-all shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin text-xs">···</span>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
                  <span>Publish to Community</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
