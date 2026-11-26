"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  Eye,
  GitBranch,
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { sanitizePreviewImageUrl } from "@/data/mockProfiles";
import {
  COMPOSER_MEDIA_PRESETS,
  FEED_DISCIPLINES,
  FEED_POST_KINDS,
  type FeedCreatorSummary,
  type FeedDiscipline,
  type FeedPostItem,
  type FeedPostKind,
} from "@/data/mockFeed";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { getFeedPostKindBadgeClass } from "@/components/feed/feedStyles";

interface PostComposerModalProps {
  isOpen: boolean;
  initialKind?: FeedPostKind;
  currentAuthor: FeedCreatorSummary;
  onClose: () => void;
  onPublishPreviewPost: (newPost: FeedPostItem) => void;
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const COMPOSER_DISCIPLINES = FEED_DISCIPLINES.filter(
  (item): item is FeedDiscipline => item !== "All"
);

/**
 * Editorial post creation dialog featuring a real-time frontend preview of text,
 * tags, project references, and local/selected media attachments.
 */
export function PostComposerModal({
  isOpen,
  initialKind = "Studio Note",
  currentAuthor,
  onClose,
  onPublishPreviewPost,
}: PostComposerModalProps) {
  const [kind, setKind] = useState<FeedPostKind>(initialKind);
  const [discipline, setDiscipline] = useState<FeedDiscipline>(
    currentAuthor.primaryDiscipline
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [projectVersion, setProjectVersion] = useState("v1.0");
  const [tagsRaw, setTagsRaw] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [mediaAlt, setMediaAlt] = useState("");
  const [mobileView, setMobileView] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    setKind(initialKind);
    setDiscipline(currentAuthor.primaryDiscipline);
    setMobileView("write");
    setError(null);
    setMediaError(null);
  }, [isOpen, initialKind, currentAuthor.primaryDiscipline]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const previewMediaUrl = sanitizePreviewImageUrl(mediaUrlInput);
  const selectedPreset = COMPOSER_MEDIA_PRESETS.find(
    (preset) => preset.imageUrl === mediaUrlInput
  );
  const parsedTags = tagsRaw
    .split(",")
    .map((item) => item.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .slice(0, 5);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setMediaError("Please choose a PNG, JPG, GIF, or WebP raster image.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setMediaError("Preview image size must be 5 MB or under.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setMediaUrlInput(reader.result);
        if (!mediaAlt.trim()) {
          setMediaAlt(file.name.replace(/\.[^.]+$/, ""));
        }
        setMediaError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setProjectTitle("");
    setProjectVersion("v1.0");
    setTagsRaw("");
    setMediaUrlInput("");
    setMediaAlt("");
    setError(null);
    setMediaError(null);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanedBody = content.trim();
    if (cleanedBody.length < 8) {
      setError("Please write at least 8 characters describing your studio update.");
      setMobileView("write");
      return;
    }

    if (mediaUrlInput.trim() && !previewMediaUrl) {
      setMediaError("Enter a valid image URL (https://...) or upload an image file.");
      setMobileView("write");
      return;
    }

    const newPost: FeedPostItem = {
      id: `local-feed-post-${Date.now()}`,
      kind,
      discipline,
      authorUsername: currentAuthor.username,
      title: title.trim() || undefined,
      content: cleanedBody,
      createdAt: "Just now",
      sortOrder: Date.now(),
      projectRef: projectTitle.trim()
        ? {
            id: `local-proj-${Date.now()}`,
            title: projectTitle.trim(),
            versionTag: projectVersion.trim() || undefined,
          }
        : undefined,
      imageUrl: previewMediaUrl,
      imageAlt: previewMediaUrl
        ? mediaAlt.trim() || title.trim() || "CreativeSpace local preview attachment"
        : undefined,
      tags: parsedTags.length > 0 ? parsedTags : [discipline.toLowerCase().replace(/\s+/g, "-")],
      likeCount: 0,
      comments: [],
    };

    onPublishPreviewPost(newPost);
    resetForm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-[#203B35]/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-4xl max-h-[92dvh] flex-col rounded-t-[24px] sm:rounded-[26px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] shadow-[0_28px_70px_-18px_rgba(32,59,53,0.3)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#203B35]/10 px-5 sm:px-7 py-4">
          <div className="flex items-center gap-2.5">
            <CelestialSpark className="h-4 w-4 text-[#9DB5A5]" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5D635F]">
                Community Composer · Local Frontend Preview
              </p>
              <h2 id={titleId} className="font-serif text-2xl text-[#203B35] leading-tight">
                Share with the Studio
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Form / Preview Toggle */}
            <div className="lg:hidden inline-flex rounded-full border border-[#203B35]/15 bg-[#F6F3EB] p-0.5">
              <button
                type="button"
                onClick={() => setMobileView("write")}
                className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  mobileView === "write"
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : "text-[#5D635F]"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setMobileView("preview")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  mobileView === "preview"
                    ? "bg-[#203B35] text-[#F6F3EB]"
                    : "text-[#5D635F]"
                }`}
              >
                <Eye className="h-3 w-3" />
                <span>Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close post composer"
              className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Two-Pane Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 sm:px-7 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Composer Inputs */}
            <div
              className={`lg:col-span-7 space-y-4 ${
                mobileView === "preview" ? "hidden lg:block" : "block"
              }`}
            >
              {/* Entry Kind & Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="feed-post-kind"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                  >
                    Post Kind
                  </label>
                  <select
                    id="feed-post-kind"
                    value={kind}
                    onChange={(e) => setKind(e.target.value as FeedPostKind)}
                    className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3 text-[13.5px] text-[#203B35] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  >
                    {FEED_POST_KINDS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="feed-post-discipline"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                  >
                    Creative Discipline
                  </label>
                  <select
                    id="feed-post-discipline"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as FeedDiscipline)}
                    className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3 text-[13.5px] text-[#203B35] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  >
                    {COMPOSER_DISCIPLINES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Headline */}
              <div>
                <label
                  htmlFor="feed-post-title"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                >
                  Headline (Optional)
                </label>
                <input
                  id="feed-post-title"
                  type="text"
                  placeholder="e.g., Balancing warm lantern tones on Frame 019"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3.5 text-[14px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                />
              </div>

              {/* Body Copy */}
              <div>
                <label
                  htmlFor="feed-post-content"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                >
                  Creative Note / Process Update
                </label>
                <textarea
                  id="feed-post-content"
                  rows={4}
                  placeholder="Share what you're experimenting with, ask the community for critique, or reflect on a completed plate..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 p-3.5 text-[14px] leading-relaxed text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                />
                {error && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#9F311D]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Media Attachment Controls */}
              <div className="rounded-2xl border border-[#203B35]/12 bg-[#F6F3EB]/75 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ImagePlus className="h-4 w-4 text-[#203B35]" />
                    <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#203B35]">
                      Media Attachment (Preview)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:border-[#203B35] transition-colors"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Upload Image</span>
                    </button>
                    {mediaUrlInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrlInput("");
                          setMediaAlt("");
                          setMediaError(null);
                        }}
                        aria-label="Remove attached image"
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] text-[#9F311D] hover:bg-[#9F311D]/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Image URL input */}
                <input
                  type="text"
                  inputMode="url"
                  placeholder="Or paste an image URL (https://...)"
                  value={
                    mediaUrlInput.startsWith("data:") || selectedPreset
                      ? ""
                      : mediaUrlInput
                  }
                  onChange={(e) => {
                    setMediaUrlInput(e.target.value);
                    if (mediaError) setMediaError(null);
                  }}
                  aria-label="Media image URL"
                  className="w-full h-9 rounded-xl border border-[#203B35]/15 bg-[#FAF8F3] px-3 text-[12.5px] text-[#282B2A] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                />

                {mediaUrlInput && (
                  <input
                    type="text"
                    placeholder="Image caption / alt description (optional)"
                    value={mediaAlt}
                    onChange={(e) => setMediaAlt(e.target.value)}
                    aria-label="Image caption or alt description"
                    className="w-full h-9 rounded-xl border border-[#203B35]/15 bg-[#FAF8F3] px-3 text-[12.5px] text-[#282B2A] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                )}

                {mediaError && (
                  <p className="text-[12px] text-[#9F311D]">{mediaError}</p>
                )}

                {/* Quick Sample Studio Plates */}
                <div>
                  <p className="text-[11px] text-[#5D635F] mb-1.5">
                    Or attach a studio sample plate:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {COMPOSER_MEDIA_PRESETS.slice(0, 4).map((preset) => {
                      const selected = mediaUrlInput === preset.imageUrl;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setMediaUrlInput(preset.imageUrl);
                            setMediaAlt(preset.alt);
                            setMediaError(null);
                          }}
                          className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                            selected
                              ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                              : "border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35] hover:border-[#203B35]/35"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Project Reference & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="feed-project-ref"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                  >
                    Linked Project (Optional)
                  </label>
                  <input
                    id="feed-project-ref"
                    type="text"
                    placeholder="e.g., Conservatory Dusk Study"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3.5 text-[13.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="feed-project-version"
                    className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                  >
                    Version Tag
                  </label>
                  <input
                    id="feed-project-version"
                    type="text"
                    placeholder="v1.0"
                    value={projectVersion}
                    onChange={(e) => setProjectVersion(e.target.value)}
                    className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3 text-[13.5px] font-mono text-[#203B35] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="feed-post-tags"
                  className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#203B35] mb-1.5"
                >
                  Tags (comma separated)
                </label>
                <input
                  id="feed-post-tags"
                  type="text"
                  placeholder="gouache, lighting, critique"
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/80 px-3.5 text-[13.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
                />
              </div>
            </div>

            {/* Right Column: Live Card Frontend Preview */}
            <div
              className={`lg:col-span-5 ${
                mobileView === "write" ? "hidden lg:block" : "block"
              }`}
            >
              <div className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#203B35]/10 pb-2.5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#203B35]">
                    <Eye className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span>Live Feed Card Preview</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#5D635F]">Session Only</span>
                </div>

                {/* Preview Card Surface */}
                <div className="rounded-[18px] border border-[#203B35]/12 bg-[#FAF8F3] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FeedAvatar
                        avatarUrl={currentAuthor.avatarUrl}
                        initials={currentAuthor.initials}
                        tone={currentAuthor.avatarTone}
                        accent={currentAuthor.avatarAccent}
                        name={currentAuthor.displayName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#203B35] truncate">
                          {currentAuthor.displayName}
                        </p>
                        <p className="font-mono text-[10.5px] text-[#5D635F] truncate">
                          @{currentAuthor.username} · Just now
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${getFeedPostKindBadgeClass(
                        kind
                      )}`}
                    >
                      {kind}
                    </span>
                  </div>

                  {projectTitle.trim() && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-2.5 py-0.5 font-mono text-[10px] text-[#203B35]">
                      <GitBranch className="h-2.5 w-2.5 text-[#9DB5A5]" />
                      <span>
                        {projectTitle.trim()}
                        {projectVersion.trim() ? ` · ${projectVersion.trim()}` : ""}
                      </span>
                    </span>
                  )}

                  {title.trim() && (
                    <h3 className="font-serif text-[1.25rem] leading-tight text-[#203B35]">
                      {title.trim()}
                    </h3>
                  )}

                  <p className="text-[13px] leading-relaxed text-[#282B2A]/85 whitespace-pre-wrap break-words">
                    {content.trim() ||
                      "Your studio update, process reflection, or critique question will preview cleanly here as you write."}
                  </p>

                  {previewMediaUrl && (
                    <div className="rounded-[16px] border border-[#203B35]/14 bg-[#F6F3EB]/90 p-2 shadow-[inset_0_1px_3px_rgba(32,59,53,0.05)]">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[10px] bg-[#EFECE2]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewMediaUrl}
                          alt={mediaAlt || "Attached media preview"}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      {mediaAlt && (
                        <div className="pt-1.5 px-1 flex items-center justify-between gap-2 font-mono text-[10.5px] text-[#5D635F]">
                          <p className="truncate">{mediaAlt}</p>
                          <span className="shrink-0 text-[9.5px] uppercase tracking-wider text-[#92958F]">
                            Plate · {discipline}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="rounded-full border border-[#203B35]/12 bg-[#F6F3EB] px-2 py-0.5 text-[10px] font-medium text-[#203B35]">
                      {discipline}
                    </span>
                    {parsedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-[#EFECE2] px-2 py-0.5 font-mono text-[10px] text-[#5D635F]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-[#9DB5A5]/45 bg-[#FAF8F3] p-3 text-[12px] leading-snug text-[#5D635F]">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#4E9F76] mt-0.5" />
                  <span>
                    Frontend preview only: publishing adds this card to your active React feed
                    state without writing to any database.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[#203B35]/10 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[12px] text-[#5D635F]">
              Posts stay in local browser state for preview.
            </span>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
              >
                <span>Publish Preview Post</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
