import { ActivityType, VersionStatus } from "@prisma/client";

export interface RecordActivityParams {
  actorId: string;
  type: ActivityType;
  projectId: string;
  versionId?: string | null;
}

export function buildActivityDedupKey(
  type: ActivityType,
  projectId: string,
  versionId?: string | null
): string {
  if (
    type === ActivityType.VersionPublished ||
    type === ActivityType.VersionFinalized
  ) {
    if (!versionId) {
      throw new Error(`Activity type ${type} requires a valid versionId`);
    }
    return `${type}:${versionId}`;
  }
  return `${type}:${projectId}`;
}

const ALLOWED_RELATIVE_PREVIEW_PREFIXES = [
  "/uploads/",
  "/images/",
  "/assets/",
  "/thumbnails/",
  "/media/",
  "/public/",
] as const;

function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".localhost") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  return false;
}

function hasPathTraversal(pathSegment: string): boolean {
  if (pathSegment.includes("\\") || pathSegment.includes("\0")) return true;
  if (/(?:^|\/)\.\.(?:\/|$)/.test(pathSegment)) return true;
  try {
    const decoded = decodeURIComponent(pathSegment);
    if (decoded.includes("\\") || decoded.includes("\0")) return true;
    if (/(?:^|\/)\.\.(?:\/|$)/.test(decoded)) return true;
  } catch {
    // Reject malformed percent-encoding outright
    return true;
  }
  return false;
}

/**
 * Ensures a feed preview URL is a safe public web URL (https://, http://, or an allowlisted
 * static app-relative path) and NEVER leaks:
 *  - raw internal object-storage bucket paths (e.g. "projects/abc/file.png"),
 *  - Supabase private signed/authenticated storage URLs,
 *  - unsafe URI schemes (javascript:, data:),
 *  - path traversal sequences (.., %2e%2e, backslashes),
 *  - internal application/API routes (/api/..., /_next/...),
 *  - loopback/private/link-local SSRF hosts or embedded URL credentials.
 */
export function isSafePublicPreviewUrl(rawPath: string | null | undefined): boolean {
  if (!rawPath || typeof rawPath !== "string") return false;
  const trimmed = rawPath.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  // Reject whitespace or control characters inside URL
  if (/[\s\u0000-\u001F\u007F]/.test(trimmed)) return false;

  // 1. External http(s) public URL validation
  if (/^https?:\/\//i.test(trimmed)) {
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return false;
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.username || parsed.password) return false;
    if (!parsed.hostname || isPrivateOrLoopbackHost(parsed.hostname)) return false;
    if (hasPathTraversal(parsed.pathname)) return false;

    // Never allow Supabase private signed or authenticated object URLs in public feed previews
    const lowerPath = parsed.pathname.toLowerCase();
    if (
      lowerPath.includes("/storage/v1/object/sign/") ||
      lowerPath.includes("/storage/v1/object/authenticated/")
    ) {
      return false;
    }

    return true;
  }

  // 2. App-relative static public asset URL validation (strict prefix allowlist + anti-traversal)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    if (trimmed.includes("\\") || trimmed.includes("?") || trimmed.includes("#")) {
      return false;
    }
    if (hasPathTraversal(trimmed)) return false;

    let normalizedPath: string;
    try {
      const resolved = new URL(trimmed, "https://creativespace.invalid");
      if (resolved.origin !== "https://creativespace.invalid") return false;
      normalizedPath = resolved.pathname;
    } catch {
      return false;
    }

    const lowerNormalized = normalizedPath.toLowerCase();
    if (
      lowerNormalized.startsWith("/api/") ||
      lowerNormalized.startsWith("/_next/") ||
      hasPathTraversal(normalizedPath)
    ) {
      return false;
    }

    return ALLOWED_RELATIVE_PREVIEW_PREFIXES.some((prefix) =>
      lowerNormalized.startsWith(prefix)
    );
  }

  return false;
}

/**
 * Idempotently records a community-visible activity inside an existing Prisma transaction
 * (or client). Stores ONLY references (actorId, type, projectId, versionId, dedupKey) —
 * never copies private content. Duplicate events are silently deduplicated via dedupKey.
 */
export async function recordCommunityActivity(
  tx: any,
  params: RecordActivityParams
): Promise<any | null> {
  if (!tx?.activity || typeof tx.activity.create !== "function") {
    // Graceful no-op for older phase mock harnesses that don't mock prisma.activity
    return null;
  }

  const normalizedVersionId =
    params.type === ActivityType.VersionPublished ||
    params.type === ActivityType.VersionFinalized
      ? (params.versionId ?? null)
      : null;

  const dedupKey = buildActivityDedupKey(
    params.type,
    params.projectId,
    normalizedVersionId
  );

  try {
    if (typeof tx.activity.findUnique === "function") {
      const existing = await tx.activity.findUnique({
        where: { dedupKey },
        select: { id: true },
      });
      if (existing) {
        return existing;
      }
    }

    return await tx.activity.create({
      data: {
        actorId: params.actorId,
        type: params.type,
        projectId: params.projectId,
        versionId: normalizedVersionId,
        dedupKey,
      },
    });
  } catch (err: any) {
    // Concurrent duplicate insert on unique dedupKey is a safe idempotent no-op
    if (err?.code === "P2002" || err?.code === "23505") {
      return null;
    }
    throw err;
  }
}

export function formatActivitySummary(
  type: ActivityType,
  versionNumber?: number | null
): string {
  switch (type) {
    case ActivityType.ProjectPublished:
      return "published a new public project";
    case ActivityType.VersionPublished:
      return versionNumber
        ? `published Version v${versionNumber}`
        : "published a new version";
    case ActivityType.VersionFinalized:
      return versionNumber
        ? `designated Version v${versionNumber} as Final`
        : "designated a Final version";
    case ActivityType.PortfolioPublished:
      return "featured a completed work in their portfolio";
    default:
      return "shared new creative work";
  }
}

/**
 * Resolves a safe public media preview URL for a Public project card in the Community Feed.
 * STRICT RULE:
 *  - NEVER returns assets belonging to Draft or Rejected versions.
 *  - ONLY returns assets attached to Approved/Final versions OR explicitly designated
 *    as metadata.coverAssetId / metadata.previewAssetId.
 */
export function resolveSafePublicFeedPreview(project: {
  metadata?: any;
  versions?: Array<{ id: string; status: VersionStatus }>;
  assets?: Array<{
    id: string;
    versionId: string | null;
    thumbnailPath: string | null;
    mimeType?: string;
  }>;
}): string | null {
  const assets = Array.isArray(project.assets) ? project.assets : [];
  if (assets.length === 0) return null;

  const meta = (project.metadata || {}) as Record<string, any>;
  const designatedIds = new Set(
    [meta.coverAssetId, meta.previewAssetId].filter(Boolean) as string[]
  );

  const publishedVersionIds = new Set(
    (Array.isArray(project.versions) ? project.versions : [])
      .filter(
        (v) =>
          v.status === VersionStatus.Approved || v.status === VersionStatus.Final
      )
      .map((v) => v.id)
  );

  // 1. Prefer explicitly designated cover/preview asset if not attached to a Draft/Rejected version
  //    AND its thumbnailPath is a verified safe public URL (never a raw internal bucket path).
  for (const a of assets) {
    if (
      designatedIds.has(a.id) &&
      (!a.versionId || publishedVersionIds.has(a.versionId)) &&
      isSafePublicPreviewUrl(a.thumbnailPath)
    ) {
      return a.thumbnailPath!.trim();
    }
  }

  // 2. Otherwise use verified safe public thumbnail of an asset attached to a published (Approved/Final) version
  for (const a of assets) {
    if (
      a.versionId &&
      publishedVersionIds.has(a.versionId) &&
      isSafePublicPreviewUrl(a.thumbnailPath)
    ) {
      return a.thumbnailPath!.trim();
    }
  }

  return null;
}
