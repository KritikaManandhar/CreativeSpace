import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FollowListQuerySchema,
  decodeKeysetCursor,
  encodeKeysetCursor,
} from "@/lib/validations/feed";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

const SAFE_PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  bio: true,
  avatarUrl: true,
  disciplines: true,
} as const;

// GET /api/users/[id]/following - Cursor-paginated list of creators a user follows (safe public fields only)
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const viewer = await getCurrentUser();
    const targetUserId = params.id;

    const { searchParams } = new URL(req.url);
    const { limit, cursor } = FollowListQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      cursor: searchParams.get("cursor") ?? undefined,
    });

    const decodedCursor = cursor ? decodeKeysetCursor(cursor) : null;

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return apiError("NOT_FOUND", "Creator not found", 404);
    }

    const whereClause: any = {
      followerId: targetUserId,
      ...(decodedCursor
        ? {
            OR: [
              { createdAt: { lt: decodedCursor.createdAt } },
              {
                AND: [
                  { createdAt: decodedCursor.createdAt },
                  { id: { lt: decodedCursor.id } },
                ],
              },
            ],
          }
        : {}),
    };

    const [totalCount, rows] = await Promise.all([
      prisma.follow.count({ where: { followerId: targetUserId } }),
      prisma.follow.findMany({
        where: whereClause,
        include: {
          following: { select: SAFE_PUBLIC_USER_SELECT },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    let viewerFollowingSet = new Set<string>();
    if (viewer?.id && pageRows.length > 0) {
      if (viewer.id === targetUserId) {
        viewerFollowingSet = new Set(pageRows.map((r) => r.followingId));
      } else {
        const listedIds = pageRows.map((r) => r.followingId);
        const viewerFollows = await prisma.follow.findMany({
          where: {
            followerId: viewer.id,
            followingId: { in: listedIds },
          },
          select: { followingId: true },
        });
        viewerFollowingSet = new Set(viewerFollows.map((f) => f.followingId));
      }
    }

    const items = pageRows.map((row) => ({
      followedAt: row.createdAt,
      user: {
        id: row.following.id,
        username: row.following.username,
        displayName: row.following.displayName,
        bio: row.following.bio,
        avatarUrl: row.following.avatarUrl,
        disciplines: Array.isArray(row.following.disciplines)
          ? row.following.disciplines
          : [],
        isFollowedByViewer: viewerFollowingSet.has(row.following.id),
      },
    }));

    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeKeysetCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
        : null;

    const response = apiSuccess({
      items,
      totalCount,
      hasMore,
      nextCursor,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
