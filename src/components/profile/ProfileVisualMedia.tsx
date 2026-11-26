"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { COVER_PRESETS, type CoverThemeId } from "@/data/mockProfiles";

interface ProfileCoverArtworkProps {
  coverUrl: string | null;
  coverPreset: CoverThemeId;
  displayName: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProfileCoverArtwork({
  coverUrl,
  coverPreset,
  displayName,
  className = "h-[180px] sm:h-[235px] lg:h-[275px]",
  children,
}: ProfileCoverArtworkProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [coverUrl]);

  const preset =
    COVER_PRESETS.find((item) => item.id === coverPreset) ?? COVER_PRESETS[0];
  const activeUrl = !imgFailed ? coverUrl : null;
  const isLocalStaticAsset = Boolean(activeUrl && activeUrl.startsWith("/images/"));

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#203B35] select-none ${className}`}
      style={{ background: preset.gradient }}
    >
      {/* Cover Image (static Next Image or custom preview upload/URL) */}
      {activeUrl &&
        (isLocalStaticAsset ? (
          <Image
            src={activeUrl}
            alt={`${displayName} studio cover`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 1320px"
            onError={() => setImgFailed(true)}
            className="object-cover object-center"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={`${displayName} studio cover`}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover object-center"
          />
        ))}

      {/* Restrained Atmospheric Cosmic Scrim & Orbital Geometry */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          activeUrl
            ? "bg-gradient-to-t from-[#162A26]/70 via-[#162A26]/20 to-[#162A26]/25"
            : "bg-gradient-to-t from-[#162A26]/35 via-transparent to-transparent"
        }`}
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 1200 320"
        fill="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <ellipse
          cx="820"
          cy="140"
          rx="420"
          ry="165"
          transform="rotate(-9 820 140)"
          stroke="#9DB5A5"
          strokeOpacity="0.45"
          strokeWidth="1"
        />
        <ellipse
          cx="460"
          cy="185"
          rx="360"
          ry="135"
          transform="rotate(7 460 185)"
          stroke="#C8BDE0"
          strokeOpacity="0.35"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle cx="1010" cy="84" r="3" fill="#C8BDE0" fillOpacity="0.85" />
        <circle cx="240" cy="210" r="2.5" fill="#9DB5A5" fillOpacity="0.8" />
      </svg>

      {/* Subtle Editorial Registration Corner Brackets */}
      <div
        className="pointer-events-none absolute top-4 left-4 h-4 w-4 border-t border-l border-[#F6F3EB]/35"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-4 right-4 h-4 w-4 border-t border-r border-[#F6F3EB]/35"
        aria-hidden="true"
      />

      {children}
    </div>
  );
}

interface ProfileAvatarBadgeProps {
  avatarUrl: string | null;
  displayName: string;
  initials: string;
  tone: string;
  accent: string;
  size?: "md" | "lg" | "xl";
  className?: string;
}

export function ProfileAvatarBadge({
  avatarUrl,
  displayName,
  initials,
  tone,
  accent,
  size = "xl",
  className = "",
}: ProfileAvatarBadgeProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const sizeStyles =
    size === "md"
      ? "h-16 w-16 text-lg"
      : size === "lg"
      ? "h-20 w-20 sm:h-24 sm:w-24 text-2xl"
      : "h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 text-3xl sm:text-4xl";

  const activeUrl = !imgFailed ? avatarUrl : null;
  const isLocalStaticAsset = Boolean(activeUrl && activeUrl.startsWith("/images/"));

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EFECE2] ring-[5px] ring-[#FAF8F3] shadow-[0_16px_38px_-16px_rgba(32,59,53,0.4)] ${sizeStyles} ${className}`}
      style={
        !activeUrl
          ? {
              background: `radial-gradient(circle at 28% 25%, ${accent}66, ${tone} 74%)`,
            }
          : undefined
      }
      aria-label={`${displayName} profile picture`}
    >
      {activeUrl ? (
        isLocalStaticAsset ? (
          <Image
            src={activeUrl}
            alt={`${displayName} profile picture`}
            fill
            priority
            sizes="140px"
            onError={() => setImgFailed(true)}
            className="object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeUrl}
            alt={`${displayName} profile picture`}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <span className="relative z-10 font-serif italic font-normal tracking-tight text-[#F6F3EB] select-none">
          {initials}
        </span>
      )}

      {/* Subtle inner cosmic hairline ring */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-[#203B35]/15"
        aria-hidden="true"
      />
    </div>
  );
}
