import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FeedQuerySchema,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from "@/lib/validations/feed";
import {
  formatActivitySummary,
  resolveSafePublicFeedPreview,
} from "@/lib/activity";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ActivityType, VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

const SAFE_ACTOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  disciplines: true,
} as const;

/**
 * Computes an explicit, transparent relevance score for Discover items.
 * Keyset pagination ordering stays strictly deterministic on (createdAt DESC, id DESC)
 * so pages never duplicate or skip items; relevanceScore is surfaced as a documented
 * quality/engagement signal combining recency, likes, public feedback, and Final status.
 */
function computeRelevanceScore(params: {
  createdAt: Date;
  likeCount: number;
  publicCommentCount: number;
  isFinal: boolean;
}): number {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(params.createdAt).getTime()) / (1000 * 60 * 60)
  );
  const recencyWeight = Math.max(0, 100 - ageHours * 0.5);
  const engagementWeight = params.likeCount * 3 + params.publicCommentCount * 1.5;
  const qualityBonus = params.isFinal ? 10 : 0;
  return Number((recencyWeight + engagementWeight + qualityBonus).toFixed(2));
}

async function fetchSuggestedCreators(
  viewerId: string | null,
  alreadyFollowingIds: string[]
) {
  const excludeIds = new Set<string>(alreadyFollowingIds);
  if (viewerId) excludeIds.add(viewerId);

  const candidates = await prisma.user.findMany({
    where: {
      ...(excludeIds.size > 0 ? { id: { notIn: Array.from(excludeIds) } } : {}),
      createdProjects: {
        some: { visibility: Visibility.Public },
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      disciplines: true,
      _count: {
        select: {
          followers: true,
          createdProjects: {
            where: { visibility: Visibility.Public },
          },
        },
      },
    },
    orderBy: [{ followers: { _count: "desc" } }, { createdAt: "desc" }],
    take: 5,
  });

  return candidates.map((u: any) => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    disciplines: Array.isArray(u.disciplines) ? u.disciplines : [],
    followerCount: u._count?.followers ?? 0,
    publicProjectCount: u._count?.createdProjects ?? 0,
    isFollowing: false,
  }));
}

// GET /api/feed?tab=following|discover&limit=12&cursor=...&category=...
export async function GET(req: NextRequest) {
  try {
    const viewer = await getCurrentUser();
    const { searchParams } = new URL(req.url);

    const parsed = FeedQuerySchema.parse({
      tab: searchParams.get("tab") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });

    const { tab, limit, cursor, category } = parsed;

    // Following feed strictly requires authentication
    if (tab === "following" && !viewer?.id) {
      return apiError(
        "UNAUTHORIZED",
        "Sign in to view activity from creators you follow",
        401
      );
    }

    const decodedCursor = cursor ? decodeKeysetCursor(cursor) : null;

    // Resolve followed creator IDs for authenticated user
    let followedIds: string[] = [];
    if (viewer?.id) {
      const followRows = await prisma.follow.findMany({
        where: { followerId: viewer.id },
        select: { followingId: true },
      });
      followedIds = followRows.map((f) => f.followingId);
    }

    // Empty following list fast-path
    if (tab === "following" && followedIds.length === 0) {
      const suggestedCreators = !decodedCursor
        ? await fetchSuggestedCreators(viewer!.id, followedIds)
        : [];
      const emptyRes = apiSuccess({
        tab,
        items: [],
        followingCount: 0,
        hasMore: false,
        nextCursor: null,
        suggestedCreators,
      });
      emptyRes.headers.set("Cache-Control", "private, no-store, max-age=0");
      emptyRes.headers.set("Vary", "Cookie");
      return emptyRes;
    }

    // Build strict live visibility + cursor filter:
    // 1. Project MUST currently be Public (excludes Private & CollaboratorsOnly).
    // 2. Project/Portfolio activities require versionId = null.
    // 3. VersionPublished requires version.status IN (Approved, Final) (excludes Draft & Rejected).
    // 4. VersionFinalized requires version.status = Final (immediately hides stale Final items if demoted).
    // 5. Keyset cursor ensures stable ordering with zero duplicates across pages.
    const andConditions: any[] = [
      {
        OR: [
          {
            type: {
              in: [ActivityType.ProjectPublished, ActivityType.PortfolioPublished],
            },
            versionId: null,
          },
          {
            type: ActivityType.VersionPublished,
            versionId: { not: null },
            version: {
              status: { in: [VersionStatus.Approved, VersionStatus.Final] },
            },
          },
          {
            type: ActivityType.VersionFinalized,
            versionId: { not: null },
            version: {
              status: VersionStatus.Final,
            },
          },
        ],
      },
    ];

    if (decodedCursor) {
      andConditions.push({
        OR: [
          { createdAt: { lt: decodedCursor.createdAt } },
          {
            AND: [
              { createdAt: decodedCursor.createdAt },
              { id: { lt: decodedCursor.id } },
            ],
          },
        ],
      });
    }

    const whereClause: any = {
      project: {
        visibility: Visibility.Public,
        ...(category && category !== "All" ? { category } : {}),
      },
      ...(tab === "following" ? { actorId: { in: followedIds } } : {}),
      AND: andConditions,
    };

    const rawActivities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        actor: { select: SAFE_ACTOR_SELECT },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            status: true,
            visibility: true,
            metadata: true,
            versions: {
              where: {
                status: { in: [VersionStatus.Approved, VersionStatus.Final] },
              },
              select: { id: true, status: true },
            },
            assets: {
              where: {
                thumbnailPath: { not: null },
                OR: [
                  { versionId: null },
                  {
                    version: {
                      status: { in: [VersionStatus.Approved, VersionStatus.Final] },
                    },
                  },
                ],
              },
              select: {
                id: true,
                versionId: true,
                thumbnailPath: true,
              },
              orderBy: { createdAt: "desc" },
              take: 8,
            },
            _count: {
              select: {
                likes: true,
                // Strictly count ONLY public version feedback comments (exclude internal project discussions where versionId is null)
                comments: {
                  where: {
                    versionId: { not: null },
                    version: { status: { not: VersionStatus.Rejected } },
                  },
                },
              },
            },
          },
        },
        version: {
          select: {
            id: true,
            projectId: true,
            versionNumber: true,
            status: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    // Defense-in-depth post-filter against live project/version state (guards mock drivers too)
    const eligible = rawActivities.filter((act: any) => {
      if (!act.project || act.project.visibility !== Visibility.Public) return false;
      if (
        act.type === ActivityType.ProjectPublished ||
        act.type === ActivityType.PortfolioPublished
      ) {
        return act.versionId === null;
      }
      if (act.type === ActivityType.VersionPublished) {
        if (!act.versionId || !act.version || act.version.projectId !== act.project.id) {
          return false;
        }
        return (
          act.version.status === VersionStatus.Approved ||
          act.version.status === VersionStatus.Final
        );
      }
      if (act.type === ActivityType.VersionFinalized) {
        if (!act.versionId || !act.version || act.version.projectId !== act.project.id) {
          return false;
        }
        return act.version.status === VersionStatus.Final;
      }
      return false;
    });

    const hasMore = eligible.length > limit;
    const pageRows = hasMore ? eligible.slice(0, limit) : eligible;

    // Batch-resolve viewer likes & follow status (zero N+1 queries)
    let viewerLikedProjectIds = new Set<string>();
    const viewerFollowingSet = new Set<string>(followedIds);

    if (viewer?.id && pageRows.length > 0) {
      const projectIds = Array.from(new Set(pageRows.map((r: any) => r.project.id)));
      const likedRows = await prisma.like.findMany({
        where: {
          userId: viewer.id,
          projectId: { in: projectIds },
        },
        select: { projectId: true },
      });
      viewerLikedProjectIds = new Set(likedRows.map((l) => l.projectId));
    }

    // Explicit safe DTO serialization (NEVER leaks raw User, Project, Version, or Asset records)
    const items = pageRows.map((act: any) => {
      const likeCount = act.project._count?.likes ?? 0;
      const commentCount = act.project._count?.comments ?? 0;
      const isFinal = act.version?.status === VersionStatus.Final;

      const previewImageUrl = resolveSafePublicFeedPreview({
        metadata: act.project.metadata,
        versions: act.project.versions,
        assets: act.project.assets,
      });

      return {
        id: act.id,
        type: act.type,
        summary: formatActivitySummary(act.type, act.version?.versionNumber ?? null),
        createdAt: act.createdAt,
        relevanceScore: computeRelevanceScore({
          createdAt: act.createdAt,
          likeCount,
          publicCommentCount: commentCount,
          isFinal,
        }),
        actor: {
          id: act.actor.id,
          username: act.actor.username,
          displayName: act.actor.displayName,
          avatarUrl: act.actor.avatarUrl,
          disciplines: Array.isArray(act.actor.disciplines)
            ? act.actor.disciplines
            : [],
          isFollowing: viewerFollowingSet.has(act.actor.id),
        },
        project: {
          id: act.project.id,
          title: act.project.title,
          description: act.project.description,
          category: act.project.category,
          status: act.project.status,
          previewImageUrl,
          likeCount,
          commentCount,
          hasLiked: viewerLikedProjectIds.has(act.project.id),
        },
        version: act.version
          ? {
              id: act.version.id,
              versionNumber: act.version.versionNumber,
              status: act.version.status,
            }
          : null,
      };
    });

    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    const suggestedCreators = !decodedCursor
      ? await fetchSuggestedCreators(viewer?.id ?? null, followedIds)
      : [];

    const response = apiSuccess({
      tab,
      items,
      followingCount: followedIds.length,
      hasMore,
      nextCursor,
      suggestedCreators,
    });

    // Strict per-viewer cache isolation
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
