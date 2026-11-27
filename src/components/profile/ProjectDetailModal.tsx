"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileArchive,
  FileCode,
  FileText,
  Film,
  FolderKanban,
  Layers,
  Maximize2,
  Music,
  Sparkles,
  Tag,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { CelestialSpark } from "@/components/landing/CreativeSpaceBrand";
import { FeedAvatar } from "@/components/feed/FeedAvatar";
import { deriveInitials, type ProfilePerspective } from "@/data/mockProfiles";
import { isSafePublicPreviewUrl } from "@/lib/activity";
import {
  formatFileSize,
  getAssetMediaType,
  type AssetMediaType,
  type ProjectAsset,
} from "@/lib/features/assets";
import { sanitizeExternalUrl } from "@/lib/features/profile";
import {
  fetchProjectWithAssets,
  type ProjectDetailData,
} from "@/lib/features/project-detail";
import {
  resolveSafeCardMediaUrl,
  type ProfileDisplayProject,
} from "./ProfileProjectCard";

interface ProjectDetailModalProps {
  project: ProfileDisplayProject | null;
  relatedProjects?: ProfileDisplayProject[];
  creatorFallback?: {
    id?: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    bio?: string | null;
    disciplines?: string[];
  };
  perspective: ProfilePerspective;
  onSelectRelatedProject?: (project: ProfileDisplayProject) => void;
  onClose: () => void;
}

interface ResolvedGalleryAsset extends ProjectAsset {
  mediaType: AssetMediaType;
  mediaUrl: string | null;
  posterUrl: string | null;
}

interface CreditEntry {
  key: string;
  name: string;
  username?: string | null;
  avatarUrl?: string | null;
  role: string;
  url?: string | null;
  urlLabel?: string;
}

function resolveCreditLinkLabel(
  url: string,
  role?: string,
  customLabel?: string | null
): string {
  if (customLabel && customLabel.trim()) return customLabel.trim();
  const lowerUrl = url.toLowerCase();
  const lowerRole = (role || "").toLowerCase();

  if (
    lowerUrl.includes("portfolio") ||
    lowerUrl.includes("behance") ||
    lowerUrl.includes("dribbble") ||
    lowerUrl.includes("artstation") ||
    lowerRole.includes("design") ||
    lowerRole.includes("art") ||
    lowerRole.includes("illustrat")
  ) {
    return "View Portfolio";
  }

  if (
    lowerUrl.includes("github") ||
    lowerUrl.includes("gitlab") ||
    lowerUrl.includes("commit") ||
    lowerUrl.includes("pull") ||
    lowerUrl.includes("contribution") ||
    lowerRole.includes("developer") ||
    lowerRole.includes("engineer")
  ) {
    return "View Contribution";
  }

  return "View Website";
}

function isSafeResolvedUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Signed URLs returned directly by /api/projects/[id]/assets use https:
  const external = sanitizeExternalUrl(trimmed);
  if (external) return external;

  // Allowlisted local static assets
  if (isSafePublicPreviewUrl(trimmed)) return trimmed;

  return null;
}

function pickMetadataString(
  meta: Record<string, unknown> | null | undefined,
  keys: string[]
): string | null {
  if (!meta || typeof meta !== "object") return null;
  for (const key of keys) {
    const val = meta[key];
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
  }
  return null;
}

function pickMetadataTextOrList(
  meta: Record<string, unknown> | null | undefined,
  keys: string[]
): string | string[] | null {
  if (!meta || typeof meta !== "object") return null;
  for (const key of keys) {
    const val = meta[key];
    if (typeof val === "string" && val.trim()) {
      return val.trim();
    }
    if (Array.isArray(val)) {
      const cleaned = val
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned;
    }
  }
  return null;
}

function extractDelimitedTokens(
  meta: Record<string, unknown> | null | undefined,
  keys: string[]
): string[] {
  if (!meta || typeof meta !== "object") return [];
  const results: string[] = [];
  for (const key of keys) {
    const val = meta[key];
    if (Array.isArray(val)) {
      for (const entry of val) {
        if (typeof entry === "string" && entry.trim()) {
          results.push(entry.trim());
        }
      }
    } else if (typeof val === "string" && val.trim()) {
      const parts = val
        .split(/,|(?:\s+&\s+)|(?:\s*;\s*)/)
        .map((part) => part.trim())
        .filter(Boolean);
      results.push(...parts);
    }
  }
  return results;
}

function formatDisplayDate(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatStatusLabel(status: string | null | undefined): string | null {
  switch (status) {
    case "Completed":
      return "Completed";
    case "InProgress":
      return "In Progress";
    case "InReview":
      return "In Review";
    case "Idea":
      return "Concept";
    case "Archived":
      return "Archived";
    default:
      return status || null;
  }
}

function formatRoleLabel(role: string): string {
  switch (role) {
    case "ClientReviewer":
      return "Client Reviewer";
    case "Collaborator":
      return "Collaborator";
    case "Owner":
      return "Creator";
    default:
      return role;
  }
}

function resolveDocumentBadge(asset: ProjectAsset): {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
} {
  const mime = (asset.mimeType || "").toLowerCase();
  const ext = asset.fileName?.split(".").pop()?.toLowerCase() || "";

  if (mime === "application/pdf" || ext === "pdf") {
    return { label: "PDF", Icon: FileText };
  }
  if (mime.includes("zip") || ext === "zip" || ext === "rar") {
    return { label: "Archive", Icon: FileArchive };
  }
  if (mime === "application/json" || ext === "json") {
    return { label: "JSON", Icon: FileCode };
  }
  if (mime === "text/markdown" || ext === "md") {
    return { label: "Markdown", Icon: FileText };
  }
  return { label: ext ? ext.toUpperCase() : "File", Icon: FileText };
}

export function ProjectDetailModal({
  project,
  relatedProjects,
  creatorFallback,
  perspective,
  onSelectRelatedProject,
  onClose,
}: ProjectDetailModalProps) {
  const isOpen = Boolean(project);
  const titleId = useId();
  const modalBodyRef = useRef<HTMLDivElement | null>(null);

  const [detail, setDetail] = useState<ProjectDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});

  // Scroll-position-preserving body lock & Escape handling
  useEffect(() => {
    if (!isOpen) return;

    const savedScrollY = window.scrollY;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      if (Math.abs(window.scrollY - savedScrollY) > 1) {
        window.scrollTo({ top: savedScrollY, behavior: "auto" });
      }
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  // Keyboard navigation for lightbox & modal Escape close
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) {
          e.stopPropagation();
          setLightboxIndex(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, lightboxIndex, onClose]);

  // Fetch full DB project + signed storage assets when project changes
  useEffect(() => {
    if (!project?.id) {
      setDetail(null);
      setDetailError(null);
      setLoadingDetail(false);
      setLightboxIndex(null);
      return;
    }

    let cancelled = false;
    setDetail(null);
    setDetailError(null);
    setLoadingDetail(true);
    setLightboxIndex(null);
    setFailedImageIds({});

    modalBodyRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    fetchProjectWithAssets(project.id)
      .then((data) => {
        if (cancelled) return;
        if (perspective === "visitor" && data.visibility !== "Public") {
          setDetailError("This project is not publicly visible.");
          setDetail(null);
          return;
        }
        setDetail(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // In client/preview storage mode without DB backend, allow local project data fallback
        if (!project) {
          const msg =
            err instanceof Error ? err.message : "Failed to load project details";
          setDetailError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project?.id, perspective]);

  // Merge & filter strictly to published assets (Approved/Final versions or explicit cover/preview)
  const publishedAssets = useMemo<ResolvedGalleryAsset[]>(() => {
    if (!detail) {
      const meta = ((project?.metadata || {}) as Record<string, unknown>);
      const rawGallery =
        (meta.galleryAssets as Array<{
          id?: string;
          fileName?: string;
          mediaType?: "image" | "video" | "audio" | "document";
          mediaUrl?: string;
          posterUrl?: string;
          fileSize?: number;
          mimeType?: string;
        }>) ||
        ((project as unknown as Record<string, unknown>)?.galleryAssets as Array<{
          id?: string;
          fileName?: string;
          mediaType?: "image" | "video" | "audio" | "document";
          mediaUrl?: string;
          posterUrl?: string;
          fileSize?: number;
          mimeType?: string;
        }>) ||
        [];

      const localResolved: ResolvedGalleryAsset[] = [];
      for (let i = 0; i < rawGallery.length; i++) {
        const item = rawGallery[i];
        if (!item?.mediaUrl) continue;
        const mediaType = item.mediaType || "image";
        localResolved.push({
          id: item.id || `local-asset-${i}`,
          projectId: project?.id || "",
          versionId: null,
          fileName: item.fileName || `Asset ${i + 1}`,
          mimeType:
            item.mimeType ||
            (mediaType === "video"
              ? "video/mp4"
              : mediaType === "audio"
              ? "audio/mp3"
              : mediaType === "document"
              ? "application/pdf"
              : "image/jpeg"),
          fileSize: item.fileSize || 0,
          thumbnailPath: null,
          downloadUrl: item.mediaUrl,
          createdAt: "",
          mediaType,
          mediaUrl: item.mediaUrl,
          posterUrl: item.posterUrl || (mediaType === "image" ? item.mediaUrl : null),
        });
      }
      return localResolved;
    }

    const meta = (detail.metadata || {}) as Record<string, unknown>;
    const previewAssetIds = new Set(
      [meta.coverAssetId, meta.previewAssetId].filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      )
    );

    const publishedVersionIds = new Set(
      (detail.versions || [])
        .filter((v) => v.status === "Approved" || v.status === "Final")
        .map((v) => v.id)
    );

    // Combine project.assets with version assets to ensure completeness, deduplicating by asset.id
    const assetById = new Map<string, ProjectAsset>();
    for (const a of detail.assets || []) {
      assetById.set(a.id, a);
    }
    for (const v of detail.versions || []) {
      for (const va of v.assets || []) {
        const existing = assetById.get(va.id);
        assetById.set(va.id, {
          ...va,
          downloadUrl: existing?.downloadUrl || va.downloadUrl || null,
          thumbnailPath: existing?.thumbnailPath || va.thumbnailPath || null,
        });
      }
    }

    const resolved: ResolvedGalleryAsset[] = [];
    for (const asset of Array.from(assetById.values())) {
      const isPublishedVersion = Boolean(
        asset.versionId && publishedVersionIds.has(asset.versionId)
      );
      const isExplicitPreview = Boolean(
        previewAssetIds.has(asset.id) &&
          (!asset.versionId || publishedVersionIds.has(asset.versionId))
      );

      if (!isPublishedVersion && !isExplicitPreview) continue;

      const mediaUrl =
        isSafeResolvedUrl(asset.downloadUrl) ||
        (asset.thumbnailPath && isSafePublicPreviewUrl(asset.thumbnailPath)
          ? asset.thumbnailPath.trim()
          : null);

      const posterUrl =
        asset.thumbnailPath && isSafePublicPreviewUrl(asset.thumbnailPath)
          ? asset.thumbnailPath.trim()
          : null;

      resolved.push({
        ...asset,
        mediaType: getAssetMediaType(asset),
        mediaUrl,
        posterUrl,
      });
    }

    return resolved;
  }, [detail]);

  const images = useMemo(
    () =>
      publishedAssets.filter(
        (a) => a.mediaType === "image" && Boolean(a.mediaUrl) && !failedImageIds[a.id]
      ),
    [publishedAssets, failedImageIds]
  );

  const videos = useMemo(
    () => publishedAssets.filter((a) => a.mediaType === "video"),
    [publishedAssets]
  );

  const audios = useMemo(
    () => publishedAssets.filter((a) => a.mediaType === "audio"),
    [publishedAssets]
  );

  const documents = useMemo(
    () => publishedAssets.filter((a) => a.mediaType === "document"),
    [publishedAssets]
  );

  // Header cover media resolution (strictly DB-backed cover image or video; no synthetic placeholders)
  const headerCover = useMemo(() => {
    const meta = ((detail?.metadata || project?.metadata || {}) as Record<
      string,
      unknown
    >);
    const explicitId =
      pickMetadataString(meta, ["coverAssetId", "previewAssetId"]) || null;

    if (explicitId) {
      const explicitAsset = publishedAssets.find(
        (a) =>
          a.id === explicitId &&
          (a.mediaType === "image" || a.mediaType === "video") &&
          Boolean(a.mediaUrl) &&
          !failedImageIds[a.id]
      );
      if (explicitAsset) return explicitAsset;
    }

    if (images[0]) return images[0];

    const firstPlayableVideo = videos.find((v) => Boolean(v.mediaUrl));
    if (firstPlayableVideo) return firstPlayableVideo;

    const fallbackUrl = resolveSafeCardMediaUrl(project?.coverUrl);
    if (fallbackUrl && !failedImageIds["summary-cover"]) {
      return {
        id: "summary-cover",
        projectId: project?.id || "",
        versionId: null,
        fileName: project?.title || "Project cover",
        mimeType: "image/jpeg",
        fileSize: 0,
        mediaType: "image" as const,
        mediaUrl: fallbackUrl,
        posterUrl: fallbackUrl,
        createdAt: project?.createdAt || "",
      };
    }

    return null;
  }, [detail?.metadata, project, publishedAssets, images, videos, failedImageIds]);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null || images.length <= 1) return;
    const onArrow = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % images.length
        );
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev - 1 + images.length) % images.length
        );
      }
    };
    window.addEventListener("keydown", onArrow);
    return () => window.removeEventListener("keydown", onArrow);
  }, [lightboxIndex, images.length]);

  if (!project) return null;

  const meta = ((detail?.metadata || project.metadata || {}) as Record<
    string,
    unknown
  >);

  const displayTitle = detail?.title || project.title;
  const displayCategory = detail?.category || project.discipline;
  const displayStatus = formatStatusLabel(detail?.status || project.status);
  const tagline = pickMetadataString(meta, [
    "tagline",
    "subtitle",
    "shortIntro",
    "introduction",
    "summary",
  ]);
  const publicationDate = formatDisplayDate(
    pickMetadataString(meta, ["publishedAt", "publicationDate"]) ||
      detail?.createdAt ||
      project.createdAt
  );

  const creator = {
    id: detail?.creator?.id || project.creator?.id || creatorFallback?.id || "",
    username:
      detail?.creator?.username ||
      project.creator?.username ||
      creatorFallback?.username ||
      "",
    displayName:
      detail?.creator?.displayName ||
      project.creator?.displayName ||
      creatorFallback?.displayName ||
      "Creator",
    avatarUrl:
      detail?.creator?.avatarUrl ??
      project.creator?.avatarUrl ??
      creatorFallback?.avatarUrl ??
      null,
    bio:
      detail?.creator?.bio ?? project.creator?.bio ?? creatorFallback?.bio ?? null,
    disciplines:
      project.creator?.disciplines || creatorFallback?.disciplines || [],
  };

  // Overview fields (hide individual empty fields; hide entire section if none)
  const fullDesc = pickMetadataString(meta, [
    "fullDescription",
    "fullOverview",
    "longDescription",
  ]);
  const descriptionText = (
    fullDesc ||
    detail?.description ||
    project.description ||
    ""
  ).trim();
  const backgroundText = pickMetadataTextOrList(meta, [
    "background",
    "context",
    "backgroundContext",
    "projectBackground",
  ]);
  const objectivesValue = pickMetadataTextOrList(meta, [
    "objectives",
    "goals",
    "projectObjectives",
  ]);
  const conceptText = pickMetadataTextOrList(meta, [
    "concept",
    "approach",
    "creativeConcept",
    "creativeApproach",
    "processNotes",
  ]);
  const hasOverview = Boolean(
    descriptionText || backgroundText || objectivesValue || conceptText
  );

  // Project Details metadata rows (non-repeating with Skills & Tools below)
  const detailRows: Array<{ label: string; value: string }> = [
    { label: "Category", value: displayCategory },
  ];

  const projectType = pickMetadataString(meta, ["projectType", "type"]);
  if (projectType) detailRows.push({ label: "Project Type", value: projectType });

  const duration = pickMetadataString(meta, [
    "duration",
    "projectDuration",
    "timeline",
  ]);
  if (duration) detailRows.push({ label: "Duration", value: duration });

  const completionDate = formatDisplayDate(
    pickMetadataString(meta, ["completionDate", "completedAt"])
  );
  if (completionDate) {
    detailRows.push({ label: "Completion Date", value: completionDate });
  }

  if (publicationDate) {
    detailRows.push({ label: "Published", value: publicationDate });
  }
  if (displayStatus) {
    detailRows.push({ label: "Status", value: displayStatus });
  }

  const technicalSpecs: Array<{ label: string; value: string | null }> = [
    { label: "Style", value: pickMetadataString(meta, ["style"]) },
    { label: "Medium", value: pickMetadataString(meta, ["medium"]) },
    { label: "Format", value: pickMetadataString(meta, ["format"]) },
    { label: "Genre", value: pickMetadataString(meta, ["genre"]) },
    { label: "Platform", value: pickMetadataString(meta, ["platform"]) },
    { label: "Technique", value: pickMetadataString(meta, ["technique"]) },
    { label: "Resolution", value: pickMetadataString(meta, ["resolution"]) },
    { label: "Aspect Ratio", value: pickMetadataString(meta, ["aspectRatio"]) },
    {
      label: "Frame Rate",
      value:
        meta.fps !== undefined && meta.fps !== null && String(meta.fps).trim()
          ? `${meta.fps} fps`
          : meta.frameRate !== undefined &&
            meta.frameRate !== null &&
            String(meta.frameRate).trim()
          ? `${meta.frameRate} fps`
          : null,
    },
    {
      label: "Tempo",
      value:
        meta.bpm !== undefined && meta.bpm !== null && String(meta.bpm).trim()
          ? `${meta.bpm} BPM`
          : null,
    },
    { label: "Musical Key", value: pickMetadataString(meta, ["key"]) },
    { label: "Time Signature", value: pickMetadataString(meta, ["timeSignature"]) },
    { label: "Camera", value: pickMetadataString(meta, ["camera", "cameraRig"]) },
    { label: "Lens", value: pickMetadataString(meta, ["lens"]) },
    { label: "Aperture", value: pickMetadataString(meta, ["aperture"]) },
    {
      label: "ISO",
      value:
        meta.iso !== undefined && meta.iso !== null && String(meta.iso).trim()
          ? `${meta.iso}`
          : null,
    },
    { label: "Shutter Speed", value: pickMetadataString(meta, ["shutterSpeed"]) },
    { label: "Focal Length", value: pickMetadataString(meta, ["focalLength"]) },
    {
      label: "Canvas",
      value:
        pickMetadataString(meta, ["canvasDimensions", "dimensions"]) ||
        (meta.canvasWidth && meta.canvasHeight
          ? `${meta.canvasWidth} × ${meta.canvasHeight} px`
          : null),
    },
    {
      label: "Color Profile",
      value: pickMetadataString(meta, ["colorProfile", "colorSpace", "colorPalette"]),
    },
    { label: "Grid System", value: pickMetadataString(meta, ["gridSystem"]) },
    { label: "Typography", value: pickMetadataString(meta, ["typography"]) },
    { label: "Language", value: pickMetadataString(meta, ["language"]) },
    {
      label: "Word Count",
      value:
        meta.wordCount || meta.wordCountTarget
          ? Number(meta.wordCount || meta.wordCountTarget).toLocaleString()
          : null,
    },
  ];

  for (const spec of technicalSpecs) {
    if (spec.value) {
      detailRows.push({ label: spec.label, value: spec.value });
    }
  }

  // Skills & Tools deduplication (no repetition across tools, skills, and tags)
  const seenSkillToolKeys = new Set<string>();
  const toolPills: string[] = [];
  for (const t of extractDelimitedTokens(meta, [
    "software",
    "tools",
    "toolsUsed",
    "daw",
    "designTool",
    "typefaces",
  ])) {
    const key = t.toLowerCase();
    if (!seenSkillToolKeys.has(key)) {
      seenSkillToolKeys.add(key);
      toolPills.push(t);
    }
  }

  const skillPills: string[] = [];
  for (const s of extractDelimitedTokens(meta, ["skills", "skillsDemonstrated"])) {
    const key = s.toLowerCase();
    if (!seenSkillToolKeys.has(key)) {
      seenSkillToolKeys.add(key);
      skillPills.push(s);
    }
  }

  const tagPills: string[] = [];
  for (const tag of detail?.tags || project.tags || []) {
    const cleaned = tag.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (!seenSkillToolKeys.has(key)) {
      seenSkillToolKeys.add(key);
      tagPills.push(cleaned);
    }
  }

  const hasSkillsAndTools =
    toolPills.length > 0 || skillPills.length > 0 || tagPills.length > 0;

  // Main project link (kept separate from contributor-specific links)
  const mainProjectLink = sanitizeExternalUrl(
    pickMetadataString(meta, [
      "projectUrl",
      "liveUrl",
      "siteUrl",
      "externalUrl",
      "demoUrl",
      "url",
      "link",
    ]) ||
      ((detail as unknown as Record<string, unknown>)?.projectUrl as string) ||
      null
  );

  // Credits & Contributors (accepted collaborators excluding redundant solo owner + metadata credits)
  const creditEntries: CreditEntry[] = [];
  const seenCreditUsers = new Set<string>();

  if (detail?.collaborators) {
    for (const c of detail.collaborators) {
      if (c.role === "Owner" && c.userId === creator.id) continue;
      if (c.status && c.status !== "Accepted") continue;
      if (seenCreditUsers.has(c.user.username.toLowerCase())) continue;
      seenCreditUsers.add(c.user.username.toLowerCase());

      const rawUrl =
        (c as unknown as Record<string, unknown>).url ||
        (c as unknown as Record<string, unknown>).website ||
        (c as unknown as Record<string, unknown>).portfolioUrl ||
        (c as unknown as Record<string, unknown>).link ||
        (c.user as unknown as Record<string, unknown>).website ||
        (c.user as unknown as Record<string, unknown>).url;
      const safeUrl = typeof rawUrl === "string" ? sanitizeExternalUrl(rawUrl) : null;
      const roleLabel = formatRoleLabel(c.role);

      creditEntries.push({
        key: c.id,
        name: c.user.displayName,
        username: c.user.username,
        avatarUrl: c.user.avatarUrl,
        role: roleLabel,
        url: safeUrl,
        urlLabel: safeUrl ? resolveCreditLinkLabel(safeUrl, roleLabel) : undefined,
      });
    }
  } else {
    for (const c of project.collaborators || []) {
      if (c.username.toLowerCase() === creator.username.toLowerCase()) continue;
      if (seenCreditUsers.has(c.username.toLowerCase())) continue;
      seenCreditUsers.add(c.username.toLowerCase());

      const rawUrl =
        (c as unknown as Record<string, unknown>).url ||
        (c as unknown as Record<string, unknown>).website ||
        (c as unknown as Record<string, unknown>).portfolioUrl ||
        (c as unknown as Record<string, unknown>).link ||
        (c as unknown as Record<string, unknown>).contributionUrl;
      const safeUrl = typeof rawUrl === "string" ? sanitizeExternalUrl(rawUrl) : null;
      const roleLabel = formatRoleLabel(c.role);
      const customLabel =
        typeof (c as unknown as Record<string, unknown>).urlLabel === "string"
          ? ((c as unknown as Record<string, unknown>).urlLabel as string).trim()
          : undefined;

      creditEntries.push({
        key: c.username,
        name: c.name,
        username: c.username,
        avatarUrl: c.avatarUrl,
        role: roleLabel,
        url: safeUrl,
        urlLabel: safeUrl
          ? resolveCreditLinkLabel(safeUrl, roleLabel, customLabel)
          : undefined,
      });
    }
  }

  const metaCredits = meta.credits ?? meta.contributors;
  if (Array.isArray(metaCredits)) {
    metaCredits.forEach((entry, idx) => {
      if (!entry || typeof entry !== "object") return;
      const rec = entry as Record<string, unknown>;
      const name = typeof rec.name === "string" ? rec.name.trim() : "";
      if (!name) return;
      const username = typeof rec.username === "string" ? rec.username.trim() : null;
      const role =
        typeof rec.role === "string" && rec.role.trim()
          ? rec.role.trim()
          : "Contributor";
      if (username && seenCreditUsers.has(username.toLowerCase())) return;
      if (username) seenCreditUsers.add(username.toLowerCase());

      const rawUrl =
        rec.url ||
        rec.website ||
        rec.portfolioUrl ||
        rec.link ||
        rec.contributionUrl ||
        rec.externalUrl ||
        rec.href;
      const safeUrl = typeof rawUrl === "string" ? sanitizeExternalUrl(rawUrl) : null;
      const customLabel =
        typeof rec.urlLabel === "string" && rec.urlLabel.trim()
          ? rec.urlLabel.trim()
          : undefined;

      creditEntries.push({
        key: `meta-credit-${idx}`,
        name,
        username,
        role,
        url: safeUrl,
        urlLabel: safeUrl
          ? resolveCreditLinkLabel(safeUrl, role, customLabel)
          : undefined,
      });
    });
  }

  // Creative Gallery filtering: avoid repeating single header asset when no other assets exist
  const galleryImages =
    images.length > 1
      ? images
      : images.filter((img) => img.id !== headerCover?.id);
  const galleryVideos = videos.filter((vid) => vid.id !== headerCover?.id);
  const hasGallerySection =
    galleryImages.length > 0 ||
    galleryVideos.length > 0 ||
    audios.length > 0 ||
    documents.length > 0;

  const openLightboxForAsset = (assetId: string) => {
    const idx = images.findIndex((i) => i.id === assetId);
    if (idx >= 0) setLightboxIndex(idx);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 lg:p-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-[#203B35]/55 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Expanded Exhibition Modal Card */}
      <div className="relative z-10 flex w-full max-w-5xl max-h-[94dvh] sm:max-h-[92dvh] flex-col rounded-t-[24px] sm:rounded-[26px] border border-[#203B35]/15 bg-[#FAF8F3] text-[#282B2A] shadow-[0_32px_80px_-18px_rgba(32,59,53,0.34)] overflow-hidden">
        {/* Sticky Top Exhibition Chrome */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#203B35]/10 bg-[#FAF8F3]/95 backdrop-blur-md px-5 sm:px-8 py-3.5">
          <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#5D635F]">
            <CelestialSpark className="h-3.5 w-3.5 shrink-0 text-[#9DB5A5]" />
            <span className="truncate text-[#203B35] font-medium">
              {displayCategory}
            </span>
            {displayStatus && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{displayStatus}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close project detail card"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1.5 text-[12.5px] font-medium text-[#203B35] hover:border-[#203B35]/35 hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div
          ref={modalBodyRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-8 sm:space-y-10"
        >
          {detailError && !detail && !project ? (
            <div className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-8 text-center space-y-3">
              <Layers className="mx-auto h-7 w-7 text-[#5D635F]" />
              <p className="font-serif text-2xl text-[#203B35]">
                Unable to load project details
              </p>
              <p className="text-[14px] text-[#5D635F] max-w-md mx-auto">
                {detailError}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-full bg-[#203B35] px-5 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors"
              >
                Return to Profile
              </button>
            </div>
          ) : (
            <>
              {/* =========================================================== */}
              {/* 2. PROJECT HEADER                                           */}
              {/* =========================================================== */}
              <header className="space-y-6">
                <div className="space-y-3.5">
                  {/* Category + Publication Date Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#203B35] px-3 py-1 text-[11.5px] font-medium text-[#F6F3EB]">
                      {displayCategory}
                    </span>

                    {publicationDate && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1 font-mono text-[11px] text-[#5D635F]">
                        <Calendar className="h-3 w-3 text-[#9DB5A5]" />
                        <span>{publicationDate}</span>
                      </span>
                    )}

                    {mainProjectLink && (
                      <a
                        href={mainProjectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-1 font-sans text-[11.5px] font-medium text-[#203B35] hover:border-[#203B35] hover:bg-[#EFECE2] transition-colors"
                      >
                        <span>
                          {pickMetadataString(meta, [
                            "externalUrlLabel",
                            "projectUrlLabel",
                            "linkLabel",
                          ]) || "Project Site"}
                        </span>
                        <ExternalLink className="h-3 w-3 text-[#5D635F]" />
                      </a>
                    )}
                  </div>

                  {/* Title & Optional Tagline */}
                  <div className="space-y-2.5 max-w-3xl">
                    <h2
                      id={titleId}
                      className="font-serif text-3xl sm:text-[2.35rem] lg:text-[2.7rem] leading-[1.1] tracking-[-0.01em] text-[#203B35]"
                    >
                      {displayTitle}
                    </h2>
                    {tagline && (
                      <p className="text-[16px] sm:text-[17.5px] leading-relaxed text-[#5D635F]">
                        {tagline}
                      </p>
                    )}
                  </div>

                  {/* Creator Attribution Strip */}
                  {creator.username && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <Link
                        href={`/profile/${encodeURIComponent(creator.username)}`}
                        onClick={onClose}
                        className="group inline-flex items-center gap-3 rounded-full border border-[#203B35]/15 bg-[#F6F3EB] py-1.5 pl-1.5 pr-4 hover:border-[#203B35]/35 transition-colors"
                      >
                        <FeedAvatar
                          avatarUrl={creator.avatarUrl}
                          initials={deriveInitials(creator.displayName)}
                          tone="#203B35"
                          accent="#C8BDE0"
                          name={creator.displayName}
                          size="sm"
                        />
                        <div className="min-w-0 leading-tight">
                          <p className="text-[13px] font-medium text-[#203B35] group-hover:underline">
                            {creator.displayName}
                          </p>
                          <p className="font-mono text-[11px] text-[#5D635F]">
                            @{creator.username}
                          </p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Large Project Cover Image or Video */}
                {headerCover && headerCover.mediaUrl && (
                  <div className="relative overflow-hidden rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]/70">
                    {headerCover.mediaType === "video" ? (
                      <div className="bg-[#162A26]">
                        <video
                          src={headerCover.mediaUrl}
                          poster={headerCover.posterUrl || undefined}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full max-h-[540px] object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="group relative flex items-center justify-center bg-[#EFECE2]/75">
                        <img
                          src={headerCover.mediaUrl}
                          alt={headerCover.fileName || displayTitle}
                          onError={() =>
                            setFailedImageIds((prev) => ({
                              ...prev,
                              [headerCover.id]: true,
                            }))
                          }
                          className="w-full max-h-[540px] object-contain mx-auto"
                        />
                        {images.some((img) => img.id === headerCover.id) && (
                          <button
                            type="button"
                            onClick={() => openLightboxForAsset(headerCover.id)}
                            aria-label={`Inspect ${headerCover.fileName} fullscreen`}
                            className="absolute bottom-3.5 right-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#203B35]/85 backdrop-blur-md px-3.5 py-1.5 text-[12px] font-medium text-[#F6F3EB] border border-[#F6F3EB]/20 opacity-95 hover:bg-[#162A26] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F3EB]"
                          >
                            <Maximize2 className="h-3.5 w-3.5" />
                            <span>Inspect Full Frame</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </header>

              {/* =========================================================== */}
              {/* 5. CREATIVE GALLERY (CENTERPIECE WHEN ASSETS ARE PRESENT)   */}
              {/* =========================================================== */}
              {loadingDetail ? (
                <section aria-label="Loading creative gallery" className="space-y-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
                    <Sparkles className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span>Loading published media &amp; project details...</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-44 rounded-2xl bg-[#EFECE2] animate-pulse border border-[#203B35]/10" />
                    <div className="h-44 rounded-2xl bg-[#EFECE2] animate-pulse border border-[#203B35]/10" />
                  </div>
                </section>
              ) : (
                hasGallerySection && (
                  <section aria-label="Creative Gallery" className="space-y-6">
                    <div className="flex items-center justify-between gap-3 border-b border-[#203B35]/10 pb-3">
                      <div>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-[#5D635F]">
                          Published Exhibition Assets
                        </p>
                        <h3 className="font-serif text-2xl text-[#203B35] mt-0.5">
                          Creative Gallery
                        </h3>
                      </div>
                      <span className="font-mono text-[11px] text-[#5D635F]">
                        {publishedAssets.length}{" "}
                        {publishedAssets.length === 1 ? "asset" : "assets"}
                      </span>
                    </div>

                    {/* Multi-Image Gallery */}
                    {galleryImages.length > 0 && (
                      <div className="space-y-3">
                        <div
                          className={`grid gap-4 ${
                            galleryImages.length === 1
                              ? "grid-cols-1"
                              : "grid-cols-1 md:grid-cols-2"
                          }`}
                        >
                          {galleryImages.map((imgAsset) => (
                            <figure
                              key={imgAsset.id}
                              className="group overflow-hidden rounded-2xl border border-[#203B35]/15 bg-[#EFECE2]/65"
                            >
                              <button
                                type="button"
                                onClick={() => openLightboxForAsset(imgAsset.id)}
                                className="relative block w-full overflow-hidden bg-[#EFECE2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                                aria-label={`Inspect ${imgAsset.fileName}`}
                              >
                                <img
                                  src={imgAsset.mediaUrl!}
                                  alt={imgAsset.fileName}
                                  loading="lazy"
                                  onError={() =>
                                    setFailedImageIds((prev) => ({
                                      ...prev,
                                      [imgAsset.id]: true,
                                    }))
                                  }
                                  className="h-72 sm:h-80 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                                <span className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#203B35]/80 text-[#F6F3EB] opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Maximize2 className="h-3.5 w-3.5" />
                                </span>
                              </button>
                              <figcaption className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#FAF8F3] border-t border-[#203B35]/10">
                                <span className="truncate text-[12.5px] font-medium text-[#203B35]">
                                  {imgAsset.fileName}
                                </span>
                                {imgAsset.fileSize > 0 && (
                                  <span className="shrink-0 font-mono text-[10.5px] text-[#5D635F]">
                                    {formatFileSize(imgAsset.fileSize)}
                                  </span>
                                )}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Assets */}
                    {galleryVideos.length > 0 && (
                      <div className="space-y-3">
                        <p className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                          <Film className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Video &amp; Motion</span>
                        </p>
                        <div
                          className={`grid gap-4 ${
                            galleryVideos.length === 1
                              ? "grid-cols-1"
                              : "grid-cols-1 md:grid-cols-2"
                          }`}
                        >
                          {galleryVideos.map((vid) => (
                            <div
                              key={vid.id}
                              className="overflow-hidden rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB]"
                            >
                              {vid.mediaUrl ? (
                                <video
                                  src={vid.mediaUrl}
                                  poster={vid.posterUrl || undefined}
                                  controls
                                  playsInline
                                  preload="metadata"
                                  className="w-full aspect-video bg-[#162A26]"
                                />
                              ) : (
                                <div className="flex aspect-video items-center justify-center bg-[#EFECE2] p-6 text-center text-[13px] text-[#5D635F]">
                                  Video stream unavailable for preview
                                </div>
                              )}
                              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#203B35]/10 bg-[#FAF8F3]">
                                <span className="truncate text-[13px] font-medium text-[#203B35]">
                                  {vid.fileName}
                                </span>
                                <span className="shrink-0 font-mono text-[10.5px] text-[#5D635F]">
                                  {formatFileSize(vid.fileSize)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio Assets */}
                    {audios.length > 0 && (
                      <div className="space-y-3">
                        <p className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                          <Music className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Audio Tracks</span>
                        </p>
                        <div className="space-y-3">
                          {audios.map((audio) => (
                            <div
                              key={audio.id}
                              className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-4 sm:p-5 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#203B35] text-[#F6F3EB]">
                                    <Music className="h-4 w-4 text-[#C8BDE0]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[14px] font-medium text-[#203B35]">
                                      {audio.fileName}
                                    </p>
                                    <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-[#5D635F]">
                                      {audio.mimeType} ·{" "}
                                      {formatFileSize(audio.fileSize)}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {audio.mediaUrl ? (
                                <audio
                                  src={audio.mediaUrl}
                                  controls
                                  preload="metadata"
                                  className="w-full"
                                />
                              ) : (
                                <p className="text-[12.5px] text-[#5D635F]">
                                  Audio file stream currently unavailable.
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documents & Other Attachments */}
                    {documents.length > 0 && (
                      <div className="space-y-3">
                        <p className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                          <FileText className="h-3.5 w-3.5 text-[#9DB5A5]" />
                          <span>Documents &amp; Attachments</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {documents.map((doc) => {
                            const badge = resolveDocumentBadge(doc);
                            const DocIcon = badge.Icon;
                            return (
                              <div
                                key={doc.id}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#203B35]/15 bg-[#FAF8F3] text-[#203B35]">
                                    <DocIcon className="h-4 w-4 text-[#203B35]" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[13.5px] font-medium text-[#203B35]">
                                      {doc.fileName}
                                    </p>
                                    <p className="font-mono text-[10.5px] text-[#5D635F]">
                                      {badge.label}
                                      {doc.fileSize > 0
                                        ? ` · ${formatFileSize(doc.fileSize)}`
                                        : ""}
                                    </p>
                                  </div>
                                </div>

                                {doc.mediaUrl && (
                                  <a
                                    href={doc.mediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={doc.fileName}
                                    aria-label={`Open or download ${doc.fileName}`}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-3 py-1.5 text-[12px] font-medium text-[#203B35] hover:border-[#203B35] hover:bg-[#EFECE2] transition-colors"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span>Open</span>
                                    <ExternalLink className="h-3 w-3 text-[#5D635F]" />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                )
              )}

              {/* =========================================================== */}
              {/* 3 & 4. PROJECT OVERVIEW + PROJECT DETAILS                   */}
              {/* =========================================================== */}
              {(hasOverview || detailRows.length > 0 || hasSkillsAndTools) && (
                <section
                  aria-label="Project overview and details"
                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8"
                >
                  {/* Left Column: Overview + Skills & Tools */}
                  {(hasOverview || hasSkillsAndTools) && (
                    <div
                      className={`${
                        detailRows.length > 0 ? "lg:col-span-7" : "lg:col-span-12"
                      } space-y-6`}
                    >
                      {hasOverview && (
                        <div className="space-y-5">
                          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F] border-b border-[#203B35]/10 pb-2.5">
                            Project Overview
                          </h3>

                          {descriptionText && (
                            <div className="space-y-1.5">
                              <p className="text-[15px] leading-[1.75] text-[#282B2A] whitespace-pre-line">
                                {descriptionText}
                              </p>
                            </div>
                          )}

                          {backgroundText && (
                            <div className="rounded-2xl border border-[#203B35]/10 bg-[#F6F3EB]/75 p-4 space-y-1.5">
                              <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                                Background &amp; Context
                              </h4>
                              {Array.isArray(backgroundText) ? (
                                <ul className="list-disc pl-4 space-y-1 text-[14px] leading-relaxed text-[#282B2A]/90">
                                  {backgroundText.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[14px] leading-relaxed text-[#282B2A]/90 whitespace-pre-line">
                                  {backgroundText}
                                </p>
                              )}
                            </div>
                          )}

                          {objectivesValue && (
                            <div className="rounded-2xl border border-[#203B35]/10 bg-[#F6F3EB]/75 p-4 space-y-1.5">
                              <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                                Project Objectives
                              </h4>
                              {Array.isArray(objectivesValue) ? (
                                <ul className="list-disc pl-4 space-y-1 text-[14px] leading-relaxed text-[#282B2A]/90">
                                  {objectivesValue.map((obj) => (
                                    <li key={obj}>{obj}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[14px] leading-relaxed text-[#282B2A]/90 whitespace-pre-line">
                                  {objectivesValue}
                                </p>
                              )}
                            </div>
                          )}

                          {conceptText && (
                            <div className="rounded-2xl border border-[#203B35]/10 bg-[#F6F3EB]/75 p-4 space-y-1.5">
                              <h4 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#5D635F]">
                                Creative Concept &amp; Approach
                              </h4>
                              {Array.isArray(conceptText) ? (
                                <ul className="list-disc pl-4 space-y-1 text-[14px] leading-relaxed text-[#282B2A]/90">
                                  {conceptText.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[14px] leading-relaxed text-[#282B2A]/90 whitespace-pre-line">
                                  {conceptText}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 6. Skills & Tools (Non-repeating consolidated section) */}
                      {hasSkillsAndTools && (
                        <div className="space-y-4 pt-2">
                          <h3 className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
                            <Wrench className="h-3.5 w-3.5 text-[#9DB5A5]" />
                            <span>Skills &amp; Tools</span>
                          </h3>

                          <div className="space-y-3">
                            {toolPills.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[12px] font-medium text-[#5D635F]">
                                  Tools &amp; Software
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {toolPills.map((tool) => (
                                    <span
                                      key={tool}
                                      className="rounded-full border border-[#203B35]/15 bg-[#F6F3EB] px-3 py-1 text-[12.5px] font-medium text-[#203B35]"
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {skillPills.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="text-[12px] font-medium text-[#5D635F]">
                                  Skills Demonstrated
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {skillPills.map((skill) => (
                                    <span
                                      key={skill}
                                      className="rounded-full border border-[#9DB5A5]/60 bg-[#9DB5A5]/15 px-3 py-1 text-[12.5px] text-[#203B35]"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {tagPills.length > 0 && (
                              <div className="space-y-1.5">
                                <p className="inline-flex items-center gap-1 text-[12px] font-medium text-[#5D635F]">
                                  <Tag className="h-3 w-3" />
                                  <span>Tags</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {tagPills.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-md border border-[#203B35]/10 bg-[#EFECE2]/85 px-2.5 py-1 font-mono text-[11px] text-[#5D635F]"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Right Column: Project Details Metadata Table */}
                  {detailRows.length > 0 && (
                    <aside
                      className={`${
                        hasOverview || hasSkillsAndTools
                          ? "lg:col-span-5"
                          : "lg:col-span-12"
                      }`}
                    >
                      <div className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-5 sm:p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <FolderKanban className="h-4 w-4 text-[#9DB5A5]" />
                          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
                            Project Details
                          </h3>
                        </div>

                        <dl className="divide-y divide-[#203B35]/10 text-[13.5px]">
                          {detailRows.map((row) => (
                            <div
                              key={row.label}
                              className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
                            >
                              <dt className="text-[#5D635F] shrink-0">
                                {row.label}
                              </dt>
                              <dd className="font-medium text-[#203B35] text-right break-words">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </aside>
                  )}
                </section>
              )}

              {/* =========================================================== */}
              {/* 7. CREDITS & CONTRIBUTORS (HIDDEN IF EMPTY)                 */}
              {/* =========================================================== */}
              {creditEntries.length > 0 && (
                <section aria-label="Credits and contributors" className="space-y-3">
                  <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-[#5D635F]">
                    <Users className="h-3.5 w-3.5 text-[#9DB5A5]" />
                    <span>Credits &amp; Contributors</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {creditEntries.map((credit) => (
                      <div
                        key={credit.key}
                        className="inline-flex flex-wrap items-center gap-2 rounded-2xl sm:rounded-full border border-[#203B35]/15 bg-[#F6F3EB] py-1.5 pl-1.5 pr-3 text-left"
                      >
                        <FeedAvatar
                          avatarUrl={credit.avatarUrl}
                          initials={deriveInitials(credit.name)}
                          tone="#203B35"
                          accent="#9DB5A5"
                          name={credit.name}
                          size="xs"
                        />
                        <div className="leading-tight">
                          <span className="text-[12.5px] font-medium text-[#203B35]">
                            {credit.name}
                          </span>
                          {credit.username && (
                            <span className="ml-1.5 font-mono text-[11px] text-[#5D635F]">
                              @{credit.username}
                            </span>
                          )}
                          <span className="ml-1.5 text-[11.5px] text-[#5D635F]">
                            · {credit.role}
                          </span>
                        </div>

                        {credit.url && (
                          <a
                            href={credit.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${credit.urlLabel || "View Link"} for ${credit.name}`}
                            className="inline-flex items-center gap-1 rounded-full border border-[#203B35]/20 bg-[#FAF8F3] px-2.5 py-0.5 text-[11px] font-medium text-[#203B35] hover:border-[#203B35] hover:bg-[#EFECE2] transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[#203B35]"
                          >
                            <span>{credit.urlLabel || "View Website"}</span>
                            <ExternalLink className="h-2.5 w-2.5 text-[#5D635F]" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* =========================================================== */}
              {/* 8. ABOUT THE CREATOR                                        */}
              {/* =========================================================== */}
              {creator.username && (
                <section
                  aria-label="About the creator"
                  className="rounded-2xl border border-[#203B35]/15 bg-[#F6F3EB] p-5 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                      <FeedAvatar
                        avatarUrl={creator.avatarUrl}
                        initials={deriveInitials(creator.displayName)}
                        tone="#203B35"
                        accent="#C8BDE0"
                        name={creator.displayName}
                        size="lg"
                      />
                      <div className="min-w-0 space-y-1.5">
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#5D635F]">
                          About the Creator
                        </p>
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="font-serif text-xl sm:text-2xl text-[#203B35]">
                            {creator.displayName}
                          </h3>
                          <span className="font-mono text-[12px] text-[#5D635F]">
                            @{creator.username}
                          </span>
                        </div>
                        {creator.bio && (
                          <p className="text-[13.5px] leading-relaxed text-[#282B2A]/85 max-w-2xl">
                            {creator.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/profile/${encodeURIComponent(creator.username)}`}
                      onClick={onClose}
                      className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#203B35] px-4 py-2 text-[13px] font-medium text-[#F6F3EB] hover:bg-[#162A26] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#203B35]"
                    >
                      <span>View Full Profile</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* FULL-SCREEN IMAGE LIGHTBOX OVERLAY                                  */}
      {/* =================================================================== */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-[#162A26]/95 backdrop-blur-md p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Inspecting ${images[lightboxIndex].fileName}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          <div className="flex w-full max-w-6xl items-center justify-between gap-4 pb-4 text-[#F6F3EB]">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium">
                {images[lightboxIndex].fileName}
              </p>
              <p className="font-mono text-[11px] text-[#9DB5A5]">
                {lightboxIndex + 1} / {images.length}
                {images[lightboxIndex].fileSize > 0
                  ? ` · ${formatFileSize(images[lightboxIndex].fileSize)}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close image inspection"
              className="rounded-full border border-[#F6F3EB]/25 bg-[#203B35] p-2 text-[#F6F3EB] hover:bg-[#F6F3EB] hover:text-[#203B35] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative flex flex-1 w-full max-w-6xl items-center justify-center overflow-hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxIndex(null);
            }}
          >
            <img
              src={images[lightboxIndex].mediaUrl!}
              alt={images[lightboxIndex].fileName}
              className="max-h-[78dvh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex(
                      (lightboxIndex - 1 + images.length) % images.length
                    )
                  }
                  aria-label="Previous image"
                  className="absolute left-2 sm:left-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#F6F3EB]/25 bg-[#203B35]/85 text-[#F6F3EB] hover:bg-[#FAF8F3] hover:text-[#203B35] transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % images.length)
                  }
                  aria-label="Next image"
                  className="absolute right-2 sm:right-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#F6F3EB]/25 bg-[#203B35]/85 text-[#F6F3EB] hover:bg-[#FAF8F3] hover:text-[#203B35] transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
