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

// GET /api/users/[id]/followers - Cursor-paginated list of a creator's followers (safe public fields only)
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
      followingId: targetUserId,
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
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.findMany({
        where: whereClause,
        include: {
          follower: { select: SAFE_PUBLIC_USER_SELECT },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
      }),
    ]);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;

    // Batch lookup of whether the authenticated viewer follows each listed user (no N+1)
    let viewerFollowingSet = new Set<string>();
    if (viewer?.id && pageRows.length > 0) {
      const listedIds = pageRows.map((r) => r.followerId);
      const viewerFollows = await prisma.follow.findMany({
        where: {
          followerId: viewer.id,
          followingId: { in: listedIds },
        },
        select: { followingId: true },
      });
      viewerFollowingSet = new Set(viewerFollows.map((f) => f.followingId));
    }

    const items = pageRows.map((row) => ({
      followedAt: row.createdAt,
      user: {
        id: row.follower.id,
        username: row.follower.username,
        displayName: row.follower.displayName,
        bio: row.follower.bio,
        avatarUrl: row.follower.avatarUrl,
        disciplines: Array.isArray(row.follower.disciplines)
          ? row.follower.disciplines
          : [],
        isFollowedByViewer: viewerFollowingSet.has(row.follower.id),
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
