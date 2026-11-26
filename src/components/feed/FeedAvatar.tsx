"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CreatorAvatar } from "@/components/landing/CreativeSpaceBrand";
import { sanitizePreviewImageUrl } from "@/data/mockProfiles";

interface FeedAvatarProps {
  avatarUrl?: string | null;
  initials: string;
  tone?: string;
  accent?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<FeedAvatarProps["size"]>, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-11 w-11",
};

/**
 * Shared circular avatar renderer for feed cards, navigation, comments, and sidebars.
 * Displays an image when valid/loaded and falls back gracefully to the editorial monogram crest.
 */
export function FeedAvatar({
  avatarUrl,
  initials,
  tone = "#203B35",
  accent = "#9DB5A5",
  name,
  size = "sm",
  className = "",
}: FeedAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const safeUrl = !imgFailed ? sanitizePreviewImageUrl(avatarUrl) : null;

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  if (!safeUrl) {
    const mappedSize = size === "lg" ? "md" : size;
    return (
      <CreatorAvatar
        initials={initials}
        tone={tone}
        accent={accent}
        name={name}
        size={mappedSize}
      />
    );
  }

  const sizeClass = SIZE_CLASSES[size];
  const isLocalStatic = safeUrl.startsWith("/images/");

  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-[#EFECE2] ring-1 ring-[#203B35]/15 ${sizeClass} ${className}`}
    >
      {isLocalStatic ? (
        <Image
          src={safeUrl}
          alt={name}
          fill
          sizes="48px"
          onError={() => setImgFailed(true)}
          className="object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={safeUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}
