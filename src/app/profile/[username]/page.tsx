import React from "react";
import type { Metadata } from "next";
import { InvitationStatus, VersionStatus, Visibility } from "@prisma/client";
import { resolveSafePublicFeedPreview } from "@/lib/activity";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRelativeDate } from "@/lib/features/assets";
import { sanitizeExternalUrl } from "@/lib/features/profile";
import {
  filterSocialLinksForViewer,
  getConnectionPairKey,
} from "@/lib/social-privacy";
import { deriveInitials, resolveMockProfile } from "@/data/mockProfiles";
import {
  ProfilePageClient,
  type InitialCreatorPortfolioData,
} from "@/components/profile/ProfilePageClient";
import type { ProfileDisplayProject } from "@/components/profile/ProfileProjectCard";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
  params: {
    username: string;
  };
  searchParams?: {
    tab?: string;
    serviceId?: string;
    action?: string;
  };
}

function normalizeUsernameParam(rawUsername: string): string {
  try {
    return decodeURIComponent(rawUsername || "")
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();
  } catch {
    return (rawUsername || "").trim().replace(/^@+/, "").toLowerCase();
  }
}

function normalizeSocialMap(rawLinks: unknown): Record<string, string> {
  if (!rawLinks || typeof rawLinks !== "object" || Array.isArray(rawLinks)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawLinks as Record<string, unknown>)) {
    const candidate =
      typeof val === "string"
        ? val
        : val && typeof val === "object" && "url" in val
        ? (val as { url?: unknown }).url
        : null;
    const safe = sanitizeExternalUrl(candidate);
    if (safe) {
      result[key] = safe;
    }
  }
  return result;
}

function extractToolsFromMetadata(
  meta: Record<string, unknown> | null | undefined
): string[] {
  if (!meta || typeof meta !== "object") return [];
  const toolKeys = ["software", "tools", "toolsUsed", "daw", "designTool", "medium"];
  const collected = new Set<string>();
  for (const key of toolKeys) {
    const val = meta[key];
    if (typeof val === "string" && val.trim()) {
      val
        .split(/,|(?:\s+&\s+)/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((s) => collected.add(s));
    } else if (Array.isArray(val)) {
      val
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
        .forEach((s) => collected.add(s));
    }
  }
  return Array.from(collected);
}

async function loadPublicProfilePortfolio(
  rawUsername: string
): Promise<{
  data: InitialCreatorPortfolioData | null;
  error: string | null;
}> {
  const username = normalizeUsernameParam(rawUsername);
  if (!username) {
    return { data: null, error: null };
  }

  try {
    const [viewer, user] = await Promise.all([
      getCurrentUser(),
      prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          disciplines: true,
          socialLinks: true,
          socialPrivacy: true,
          createdAt: true,
          _count: {
            select: {
              createdProjects: { where: { visibility: Visibility.Public } },
              followers: true,
              following: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      return {
        data: {
          foundInDb: false,
          creator: null,
          isFollowing: false,
          projects: [],
        },
        error: null,
      };
    }

    const isOwner = Boolean(viewer?.id && viewer.id === user.id);
    let isFollowing = false;
    let isAcceptedConnection = false;

    if (viewer?.id && !isOwner) {
      const pairKey = getConnectionPairKey(viewer.id, user.id);
      const [conn, follow] = await Promise.all([
        prisma.connection.findUnique({
          where: { pairKey },
          select: { status: true },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: viewer.id,
              followingId: user.id,
            },
          },
          select: { id: true },
        }),
      ]);
      isAcceptedConnection = conn?.status === "Accepted";
      isFollowing = Boolean(follow);
    }

    const visibleSocialLinks = normalizeSocialMap(
      filterSocialLinksForViewer(user.socialLinks, user.socialPrivacy, {
        isOwner,
        isAcceptedConnection,
      })
    );

    const creatorDisciplines = Array.isArray(user.disciplines)
      ? user.disciplines
          .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
          .map((d) => d.trim())
      : [];

    const [foundProjects, collaborationsCount] = await Promise.all([
      prisma.project.findMany({
        where: {
          creatorId: user.id,
          visibility: Visibility.Public,
        },
        include: {
          portfolioProjects: {
            select: { featured: true },
          },
          versions: {
            where: {
              status: { in: [VersionStatus.Approved, VersionStatus.Final] },
            },
            select: { id: true, versionNumber: true, status: true },
            orderBy: { versionNumber: "desc" },
          },
          assets: {
            where: { thumbnailPath: { not: null } },
            select: {
              id: true,
              versionId: true,
              thumbnailPath: true,
              mimeType: true,
              fileName: true,
            },
            take: 6,
            orderBy: { createdAt: "desc" },
          },
          projectTags: {
            include: { tag: true },
          },
          collaborators: {
            where: { status: InvitationStatus.Accepted },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: { versions: true, likes: true, comments: true },
          },
          likes: viewer?.id
            ? { where: { userId: viewer.id }, select: { id: true } }
            : false,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.projectCollaborator.count({
        where: {
          userId: user.id,
          status: InvitationStatus.Accepted,
          project: { visibility: Visibility.Public },
        },
      }),
    ]);

    const creatorSummary = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      disciplines: creatorDisciplines,
    };

    const mappedProjects: ProfileDisplayProject[] = foundProjects.map((p) => {
      const meta = (p.metadata || null) as Record<string, unknown> | null;
      const latestVer = p.versions[0] || null;
      const versionTag = latestVer
        ? `v${latestVer.versionNumber} · ${latestVer.status}`
        : p.status === ProjectStatusLabel.Completed
        ? "Published"
        : p.status;

      const coverUrl = resolveSafePublicFeedPreview(p);
      const isLikedByViewer = Array.isArray(p.likes) && p.likes.length > 0;

      return {
        id: p.id,
        title: p.title,
        description: p.description || "",
        discipline: p.category,
        status: p.status,
        versionTag,
        featured: p.portfolioProjects.some((pp) => pp.featured),
        coverUrl,
        coverAlt: p.title,
        tags: p.projectTags.map((pt) => pt.tag.name),
        tools: extractToolsFromMetadata(meta),
        updatedAt:
          formatRelativeDate(p.updatedAt) || formatRelativeDate(p.createdAt),
        createdAt: p.createdAt.toISOString(),
        metadata: meta,
        likeCount: p._count.likes,
        commentCount: p._count.comments,
        hasLiked: isLikedByViewer,
        collaborators: p.collaborators
          .filter((c) => c.role !== "Owner")
          .map((c) => ({
            name: c.user.displayName,
            username: c.user.username,
            initials: deriveInitials(c.user.displayName),
            tone: "#203B35",
            accent: "#9DB5A5",
            role: c.role === "ClientReviewer" ? "Client Reviewer" : c.role,
            avatarUrl: c.user.avatarUrl,
          })),
        versions: latestVer
          ? [
              {
                id: latestVer.id,
                version: `v${latestVer.versionNumber}`,
                label: latestVer.status,
                date: formatRelativeDate(p.updatedAt),
                status: latestVer.status,
                note: "",
              },
            ]
          : [],
        creator: creatorSummary,
      };
    });

    return {
      data: {
        foundInDb: true,
        creator: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          disciplines: creatorDisciplines,
          socialLinks: visibleSocialLinks,
          joinedAt: user.createdAt.toISOString(),
          stats: {
            createdProjects: user._count.createdProjects,
            followers: user._count.followers,
            following: user._count.following,
            collaborations: collaborationsCount,
          },
        },
        isFollowing,
        projects: mappedProjects,
      },
      error: null,
    };
  } catch (err) {
    console.error("Failed to load DB profile portfolio:", err);
    return {
      data: null,
      error: "Unable to load published works from the database.",
    };
  }
}

const ProjectStatusLabel = {
  Completed: "Completed",
} as const;

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const normalized = normalizeUsernameParam(params.username);
  try {
    const dbCreator = await prisma.user.findUnique({
      where: { username: normalized },
      select: { displayName: true, username: true, bio: true },
    });
    if (dbCreator) {
      return {
        title: `${dbCreator.displayName} (@${dbCreator.username}) — CreativeSpace`,
        description:
          dbCreator.bio ||
          `Explore ${dbCreator.displayName}'s published projects and studio work on CreativeSpace.`,
      };
    }
  } catch {
    // Fallback to static title below
  }

  const profile = resolveMockProfile(params.username);
  return {
    title: `${profile.displayName} (@${profile.username}) — CreativeSpace`,
    description:
      profile.bio ||
      `Explore ${profile.displayName}'s creative projects, studio notes, and collaborations on CreativeSpace.`,
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { data: initialPortfolio, error: portfolioError } =
    await loadPublicProfilePortfolio(params.username);

  return (
    <ProfilePageClient
      username={params.username}
      initialTab={searchParams?.tab}
      initialServiceId={searchParams?.serviceId}
      initialAction={searchParams?.action}
      initialPortfolio={initialPortfolio}
      portfolioError={portfolioError}
    />
  );
}
