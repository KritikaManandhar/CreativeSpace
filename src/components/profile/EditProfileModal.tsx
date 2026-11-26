"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Check, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { sanitizeExternalUrl } from "@/lib/features/profile";
import {
  AVATAR_PRESETS,
  COVER_PRESETS,
  deriveInitials,
  PROFILE_DISCIPLINE_OPTIONS,
  sanitizePreviewImageUrl,
  SOCIAL_LINK_FIELDS,
  type CoverThemeId,
  type UserProfileRecord,
} from "@/data/mockProfiles";
import { ProfileAvatarBadge, ProfileCoverArtwork } from "./ProfileVisualMedia";

interface EditProfileModalProps {
  isOpen: boolean;
  profile: UserProfileRecord;
  onClose: () => void;
  onApplyChanges: (updated: Partial<UserProfileRecord>) => void;
}

interface EditErrors {
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  socialLinks?: Record<string, string>;
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onApplyChanges,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [studioStatus, setStudioStatus] = useState(profile.studioStatus);
  const [openToCollab, setOpenToCollab] = useState(profile.openToCollab);
  const [avatarUrl, setAvatarUrl] = useState<string>(profile.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState<string>(profile.coverUrl ?? "");
  const [coverPreset, setCoverPreset] = useState<CoverThemeId>(profile.coverPreset);
  const [disciplines, setDisciplines] = useState<string[]>(profile.disciplines);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(profile.socialLinks);
  const [errors, setErrors] = useState<EditErrors>({});

  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(profile.displayName);
    setUsername(profile.username);
    setHeadline(profile.headline);
    setBio(profile.bio);
    setLocation(profile.location);
    setStudioStatus(profile.studioStatus);
    setOpenToCollab(profile.openToCollab);
    setAvatarUrl(profile.avatarUrl ?? "");
    setCoverUrl(profile.coverUrl ?? "");
    setCoverPreset(profile.coverPreset);
    setDisciplines(profile.disciplines);
    setSocialLinks({ ...profile.socialLinks });
    setErrors({});
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  const previewAvatarUrl = sanitizePreviewImageUrl(avatarUrl);
  const previewCoverUrl = sanitizePreviewImageUrl(coverUrl);
  const previewInitials = deriveInitials(displayName || profile.displayName);

  const handleLocalFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      setErrors((prev) => ({
        ...prev,
        [target === "avatar" ? "avatarUrl" : "coverUrl"]:
          "Please select a PNG, JPG, GIF, or WebP image file.",
      }));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setErrors((prev) => ({
        ...prev,
        [target === "avatar" ? "avatarUrl" : "coverUrl"]:
          "Image preview must be 5 MB or smaller.",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (target === "avatar") {
          setAvatarUrl(reader.result);
          setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
        } else {
          setCoverUrl(reader.result);
          setErrors((prev) => ({ ...prev, coverUrl: undefined }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleDiscipline = (disc: string) => {
    setDisciplines((prev) => {
      if (prev.includes(disc)) return prev.filter((item) => item !== disc);
      if (prev.length >= 5) return prev;
      return [...prev, disc];
    });
  };

  const validateAndApply = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: EditErrors = {};

    const cleanName = displayName.trim();
    const cleanHandle = username.trim().replace(/^@+/, "");
    const cleanBio = bio.trim();

    if (cleanName.length < 2) {
      nextErrors.displayName = "Display name must be at least 2 characters.";
    } else if (cleanName.length > 60) {
      nextErrors.displayName = "Display name must be 60 characters or fewer.";
    }

    if (cleanHandle.length < 3) {
      nextErrors.username = "Username must be at least 3 characters.";
    } else if (cleanHandle.length > 30) {
      nextErrors.username = "Username cannot exceed 30 characters.";
    } else if (!USERNAME_PATTERN.test(cleanHandle)) {
      nextErrors.username = "Use only letters, numbers, underscores, and hyphens.";
    }

    if (cleanBio.length > 500) {
      nextErrors.bio = "Bio cannot exceed 500 characters.";
    }

    const trimmedAvatar = avatarUrl.trim();
    if (trimmedAvatar && !sanitizePreviewImageUrl(trimmedAvatar)) {
      nextErrors.avatarUrl = "Enter a valid https:// image URL or upload an image file.";
    }

    const trimmedCover = coverUrl.trim();
    if (trimmedCover && !sanitizePreviewImageUrl(trimmedCover)) {
      nextErrors.coverUrl = "Enter a valid https:// image URL or choose a cover preset.";
    }

    const socialErrors: Record<string, string> = {};
    const sanitizedSocials: Record<string, string> = {};

    for (const field of SOCIAL_LINK_FIELDS) {
      const rawVal = (socialLinks[field.key] || "").trim();
      if (!rawVal) continue;
      const safe = sanitizeExternalUrl(rawVal);
      if (!safe) {
        socialErrors[field.key] = "Please enter a full http:// or https:// URL.";
      } else {
        sanitizedSocials[field.key] = safe;
      }
    }

    if (Object.keys(socialErrors).length > 0) {
      nextErrors.socialLinks = socialErrors;
    }

    if (
      nextErrors.displayName ||
      nextErrors.username ||
      nextErrors.bio ||
      nextErrors.avatarUrl ||
      nextErrors.coverUrl ||
      nextErrors.socialLinks
    ) {
      setErrors(nextErrors);
      return;
    }

    onApplyChanges({
      displayName: cleanName,
      username: cleanHandle,
      avatarInitials: previewInitials,
      headline: headline.trim(),
      bio: cleanBio,
      location: location.trim(),
      studioStatus: studioStatus.trim(),
      openToCollab,
      avatarUrl: previewAvatarUrl,
      coverUrl: previewCoverUrl,
      coverPreset,
      disciplines,
      socialLinks: sanitizedSocials,
    });

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#203B35]/45 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Sheet */}
      <form
        onSubmit={validateAndApply}
        noValidate
        className="relative z-10 flex w-full max-w-2xl max-h-[92dvh] sm:max-h-[88vh] flex-col rounded-t-[24px] sm:rounded-[26px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] shadow-[0_28px_70px_-18px_rgba(32,59,53,0.28)] overflow-hidden"
      >
        {/* Sticky Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#203B35]/10 px-5 sm:px-7 py-4 sm:py-5 bg-[#FAF8F3]">
          <div>
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#5D635F]">
              <CelestialSpark className="h-3 w-3 text-[#9DB5A5]" />
              <span>Studio Profile Preview</span>
            </div>
            <h2
              id={titleId}
              className="mt-0.5 font-serif text-2xl sm:text-[1.75rem] font-normal text-[#203B35] leading-tight"
            >
              Edit Profile
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit profile dialog"
            className="rounded-full p-2 text-[#5D635F] hover:bg-[#203B35]/5 hover:text-[#203B35] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          {/* 1. Live Visual Preview Card */}
          <div className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] overflow-hidden">
            <ProfileCoverArtwork
              coverUrl={previewCoverUrl}
              coverPreset={coverPreset}
              displayName={displayName || profile.displayName}
              className="h-[115px] sm:h-[130px]"
            >
              <span className="relative z-10 m-3 inline-flex items-center gap-1 rounded-full bg-[#FAF8F3]/95 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#203B35]">
                Live Preview
              </span>
            </ProfileCoverArtwork>
            <div className="px-4 pb-4 flex items-end gap-3.5">
              <div className="-mt-9 relative z-10">
                <ProfileAvatarBadge
                  avatarUrl={previewAvatarUrl}
                  displayName={displayName || profile.displayName}
                  initials={previewInitials}
                  tone={profile.avatarTone}
                  accent={profile.avatarAccent}
                  size="md"
                />
              </div>
              <div className="min-w-0 pt-1">
                <p className="font-serif text-xl text-[#203B35] leading-tight truncate">
                  {displayName.trim() || "Display Name"}
                </p>
                <p className="font-mono text-[11.5px] text-[#5D635F] truncate">
                  @{username.trim().replace(/^@+/, "") || "username"}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Cover Image & Presets */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
                Cover / Banner Image
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => handleLocalFileSelect(e, "cover")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Cover</span>
                </button>
                {coverUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverUrl("")}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] text-[#5D635F] hover:text-[#203B35]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Use Gradient</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cover Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COVER_PRESETS.map((preset) => {
                const isSelected =
                  preset.imageUrl !== null
                    ? coverUrl === preset.imageUrl
                    : !coverUrl && coverPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setCoverPreset(preset.id);
                      setCoverUrl(preset.imageUrl ?? "");
                      setErrors((prev) => ({ ...prev, coverUrl: undefined }));
                    }}
                    className={`rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                        : "border-[#203B35]/15 bg-[#F6F3EB] text-[#282B2A] hover:border-[#203B35]/35"
                    }`}
                  >
                    <div
                      className="h-7 w-full rounded-md border border-black/10 bg-cover bg-center"
                      style={{
                        backgroundImage: preset.imageUrl
                          ? `url(${preset.imageUrl})`
                          : preset.gradient,
                      }}
                    />
                    <p className="mt-1.5 text-[11px] font-medium truncate">
                      {preset.label}
                    </p>
                  </button>
                );
              })}
            </div>

            <input
              type="url"
              aria-label="Custom cover image URL"
              placeholder="Or paste cover image URL (https://...)"
              value={coverUrl.startsWith("data:") ? "" : coverUrl}
              onChange={(e) => {
                setCoverUrl(e.target.value);
                setErrors((prev) => ({ ...prev, coverUrl: undefined }));
              }}
              className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[13.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
            />
            {errors.coverUrl && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#9F311D]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.coverUrl}</span>
              </p>
            )}
          </div>

          {/* 3. Profile Picture & Presets */}
          <div className="space-y-3 pt-2 border-t border-[#203B35]/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
                Profile Picture
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(e) => handleLocalFileSelect(e, "avatar")}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#F6F3EB] px-3 py-1 text-[12px] font-medium text-[#203B35] hover:bg-[#EFECE2] transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Photo</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected =
                  (preset.imageUrl === null && !avatarUrl.trim()) ||
                  (preset.imageUrl !== null && avatarUrl === preset.imageUrl);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.imageUrl ?? "");
                      setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
                    }}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      isSelected
                        ? "border-[#203B35] bg-[#203B35] text-[#F6F3EB]"
                        : "border-[#203B35]/15 bg-[#F6F3EB] text-[#282B2A] hover:border-[#203B35]/35"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-[#9DB5A5]" />}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="url"
              aria-label="Custom profile picture URL"
              placeholder="Or paste avatar image URL (https://...)"
              value={avatarUrl.startsWith("data:") ? "" : avatarUrl}
              onChange={(e) => {
                setAvatarUrl(e.target.value);
                setErrors((prev) => ({ ...prev, avatarUrl: undefined }));
              }}
              className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[13.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
            />
            {errors.avatarUrl && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#9F311D]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errors.avatarUrl}</span>
              </p>
            )}
          </div>

          {/* 4. Display Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#203B35]/10">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-display-name"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Display Name
              </label>
              <input
                id="edit-display-name"
                type="text"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errors.displayName) {
                    setErrors((prev) => ({ ...prev, displayName: undefined }));
                  }
                }}
                placeholder="Your full or studio name"
                className={`w-full h-11 rounded-xl border px-3.5 text-[14px] text-[#282B2A] bg-[#F6F3EB]/75 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                  errors.displayName
                    ? "border-[#B8422C]/70 focus:ring-[#B8422C]/20"
                    : "border-[#203B35]/15 focus:ring-[#9DB5A5]"
                }`}
              />
              {errors.displayName && (
                <p className="text-[12px] text-[#9F311D]">{errors.displayName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-username"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13.5px] text-[#5D635F]">
                  @
                </span>
                <input
                  id="edit-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) {
                      setErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  placeholder="handle"
                  className={`w-full h-11 rounded-xl border pl-8 pr-3.5 font-mono text-[13.5px] text-[#282B2A] bg-[#F6F3EB]/75 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                    errors.username
                      ? "border-[#B8422C]/70 focus:ring-[#B8422C]/20"
                      : "border-[#203B35]/15 focus:ring-[#9DB5A5]"
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-[12px] text-[#9F311D]">{errors.username}</p>
              )}
            </div>
          </div>

          {/* 5. Headline, Location & Collaboration Availability */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="edit-headline"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Creative Focus / Role
              </label>
              <input
                id="edit-headline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Editorial Illustrator & Printmaker"
                className="w-full h-11 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[14px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="edit-location"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Location
              </label>
              <input
                id="edit-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full h-11 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[14px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
            <div className="sm:col-span-7 space-y-1.5">
              <label
                htmlFor="edit-status"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Studio Availability Note
              </label>
              <input
                id="edit-status"
                type="text"
                value={studioStatus}
                onChange={(e) => setStudioStatus(e.target.value)}
                placeholder="e.g., Open to collaborative print editions"
                className="w-full h-10 rounded-xl border border-[#203B35]/15 bg-[#F6F3EB]/75 px-3.5 text-[13.5px] text-[#282B2A] focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 focus:ring-[#9DB5A5]"
              />
            </div>

            <div className="sm:col-span-5 pt-2 sm:pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-[#203B35]/15 bg-[#F6F3EB] px-3.5 py-2.5 text-[13px] font-medium text-[#203B35]">
                <input
                  type="checkbox"
                  checked={openToCollab}
                  onChange={(e) => setOpenToCollab(e.target.checked)}
                  className="h-4 w-4 rounded border-[#203B35]/30 accent-[#203B35]"
                />
                <span>Open to Collaborations</span>
              </label>
            </div>
          </div>

          {/* 6. Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="edit-bio"
                className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]"
              >
                Bio
              </label>
              <span
                className={`font-mono text-[11px] ${
                  bio.length > 500 ? "text-[#9F311D] font-semibold" : "text-[#5D635F]"
                }`}
              >
                {bio.length} / 500
              </span>
            </div>
            <textarea
              id="edit-bio"
              rows={3}
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                if (errors.bio) setErrors((prev) => ({ ...prev, bio: undefined }));
              }}
              placeholder="Tell visitors about your creative practice, mediums, and what you are building..."
              className={`w-full rounded-xl border p-3.5 text-[14px] leading-relaxed text-[#282B2A] bg-[#F6F3EB]/75 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                errors.bio
                  ? "border-[#B8422C]/70 focus:ring-[#B8422C]/20"
                  : "border-[#203B35]/15 focus:ring-[#9DB5A5]"
              }`}
            />
            {errors.bio && <p className="text-[12px] text-[#9F311D]">{errors.bio}</p>}
          </div>

          {/* 7. Creative Disciplines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
                Disciplines (Up to 5)
              </span>
              <span className="font-mono text-[11px] text-[#5D635F]">
                {disciplines.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PROFILE_DISCIPLINE_OPTIONS.map((disc) => {
                const selected = disciplines.includes(disc);
                return (
                  <button
                    key={disc}
                    type="button"
                    onClick={() => toggleDiscipline(disc)}
                    aria-pressed={selected}
                    className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                      selected
                        ? "bg-[#203B35] text-[#F6F3EB] font-medium"
                        : "border border-[#203B35]/15 bg-[#F6F3EB] text-[#282B2A] hover:border-[#203B35]/35"
                    }`}
                  >
                    {disc}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Social Media Links */}
          <div className="space-y-3 pt-2 border-t border-[#203B35]/10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#203B35]">
              Social Media Links
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {SOCIAL_LINK_FIELDS.map((field) => {
                const fieldErr = errors.socialLinks?.[field.key];
                return (
                  <div key={field.key} className="space-y-1">
                    <label
                      htmlFor={`social-${field.key}`}
                      className="block text-[11.5px] font-medium text-[#5D635F]"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`social-${field.key}`}
                      type="url"
                      placeholder={field.placeholder}
                      value={socialLinks[field.key] || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSocialLinks((prev) => ({ ...prev, [field.key]: val }));
                        if (fieldErr) {
                          setErrors((prev) => ({
                            ...prev,
                            socialLinks: {
                              ...prev.socialLinks,
                              [field.key]: "",
                            },
                          }));
                        }
                      }}
                      className={`w-full h-10 rounded-xl border px-3 text-[13px] text-[#282B2A] bg-[#F6F3EB]/75 focus:bg-[#FAF8F3] focus:outline-none focus:ring-2 ${
                        fieldErr
                          ? "border-[#B8422C]/70 focus:ring-[#B8422C]/20"
                          : "border-[#203B35]/15 focus:ring-[#9DB5A5]"
                      }`}
                    />
                    {fieldErr && (
                      <p className="text-[11.5px] text-[#9F311D]">{fieldErr}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#203B35]/10 bg-[#FAF8F3] px-5 sm:px-7 py-4">
          <p className="inline-flex items-center gap-1.5 text-[11.5px] text-[#5D635F]">
            <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5] shrink-0" />
            <span>Frontend preview only · Local browser state.</span>
          </p>

          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="whitespace-nowrap shrink-0 rounded-full px-4 py-2 text-[13px] font-medium text-[#5D635F] hover:text-[#203B35] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-[#203B35] px-5 py-2.5 text-[13.5px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
            >
              <Check className="h-4 w-4 text-[#9DB5A5] shrink-0" />
              <span>Apply Preview Changes</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
