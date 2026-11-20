import { prisma } from "@/lib/prisma";
import { ConnectionStatus, SocialPrivacy } from "@prisma/client";

export interface SocialLinkEntryObject {
  url: string;
  visibility?: SocialPrivacy;
}

export type SocialLinkEntry = string | SocialLinkEntryObject;
export type SocialLinksPayload = Record<string, SocialLinkEntry>;

export interface SocialPrivacyViewerContext {
  isOwner: boolean;
  isAcceptedConnection: boolean;
}

const VALID_PRIVACY_VALUES = new Set<string>([
  SocialPrivacy.Public,
  SocialPrivacy.ConnectionsOnly,
  SocialPrivacy.Private,
]);

/**
 * Returns the canonical ordered tuple [lowId, highId] for two user IDs.
 * Used for deterministic row locking to prevent deadlocks under concurrent requests.
 */
export function getOrderedUserPair(userAId: string, userBId: string): [string, string] {
  return userAId < userBId ? [userAId, userBId] : [userBId, userAId];
}

/**
 * Computes the canonical unordered-pair key matching PostgreSQL's
 * LEAST("requesterId", "receiverId") || ':' || GREATEST("requesterId", "receiverId").
 */
export function getConnectionPairKey(userAId: string, userBId: string): string {
  const [lowId, highId] = getOrderedUserPair(userAId, userBId);
  return `${lowId}:${highId}`;
}

/**
 * Checks whether an Accepted peer connection currently exists between two users.
 * Always returns false for anonymous viewers or identical IDs.
 */
export async function isAcceptedConnection(
  viewerId: string | null | undefined,
  profileOwnerId: string
): Promise<boolean> {
  if (!viewerId || viewerId === profileOwnerId) {
    return false;
  }

  const pairKey = getConnectionPairKey(viewerId, profileOwnerId);
  const connection = await prisma.connection.findUnique({
    where: { pairKey },
    select: { status: true },
  });

  return connection?.status === ConnectionStatus.Accepted;
}

/**
 * Strictly filters a creator's socialLinks on the server before API serialization.
 *
 * Supports both:
 *  - Legacy flat strings: { github: "https://..." } (inherits globalPrivacy)
 *  - Per-link visibility objects: { github: { url: "https://...", visibility: "ConnectionsOnly" } }
 *
 * Privacy rules:
 *  - Public: Visible to everyone (including anonymous visitors).
 *  - ConnectionsOnly: Visible only to the profile owner and users with an Accepted connection.
 *  - Private: Visible only to the profile owner.
 *
 * Returns null if no social links are visible to the caller, preventing key/metadata leaks.
 */
export function filterSocialLinksForViewer(
  rawSocialLinks: unknown,
  globalPrivacy: SocialPrivacy | null | undefined,
  viewerContext: SocialPrivacyViewerContext
): SocialLinksPayload | null {
  if (
    !rawSocialLinks ||
    typeof rawSocialLinks !== "object" ||
    Array.isArray(rawSocialLinks)
  ) {
    return null;
  }

  const entries = Object.entries(rawSocialLinks as Record<string, unknown>);
  if (entries.length === 0) {
    return null;
  }

  const fallbackPrivacy: SocialPrivacy =
    globalPrivacy && VALID_PRIVACY_VALUES.has(globalPrivacy)
      ? globalPrivacy
      : SocialPrivacy.Public;

  const filtered: SocialLinksPayload = {};

  for (const [platform, value] of entries) {
    if (typeof value === "string") {
      if (!value.trim()) continue;

      if (viewerContext.isOwner || canViewerSeePrivacyLevel(fallbackPrivacy, viewerContext)) {
        filtered[platform] = value;
      }
      continue;
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (typeof obj.url !== "string" || !obj.url.trim()) continue;

      const entryVisibility: SocialPrivacy =
        typeof obj.visibility === "string" && VALID_PRIVACY_VALUES.has(obj.visibility)
          ? (obj.visibility as SocialPrivacy)
          : fallbackPrivacy;

      if (viewerContext.isOwner || canViewerSeePrivacyLevel(entryVisibility, viewerContext)) {
        filtered[platform] =
          typeof obj.visibility === "string" && VALID_PRIVACY_VALUES.has(obj.visibility)
            ? { url: obj.url, visibility: entryVisibility }
            : { url: obj.url };
      }
    }
  }

  return Object.keys(filtered).length > 0 ? filtered : null;
}

function canViewerSeePrivacyLevel(
  level: SocialPrivacy,
  viewerContext: SocialPrivacyViewerContext
): boolean {
  if (viewerContext.isOwner) {
    return true;
  }

  switch (level) {
    case SocialPrivacy.Public:
      return true;
    case SocialPrivacy.ConnectionsOnly:
      return viewerContext.isAcceptedConnection;
    case SocialPrivacy.Private:
    default:
      return false;
  }
}
