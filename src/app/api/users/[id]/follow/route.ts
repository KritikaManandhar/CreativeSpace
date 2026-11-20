import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/users/[id]/follow - Follow a creator (one-way, independent of Connection & ProjectCollaborator)
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required to follow a creator", 401);
    }

    const targetUserId = params.id;

    if (targetUserId === user.id) {
      return apiError("BAD_REQUEST", "You cannot follow yourself", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new AppError("NOT_FOUND", "Creator not found", 404);
      }

      const existing = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetUserId,
          },
        },
      });

      if (existing) {
        throw new AppError("CONFLICT", "You are already following this creator", 409);
      }

      // Insert Follow record FIRST so PostgreSQL @@unique([followerId, followingId]) guards concurrency
      await tx.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });

      // Notify followed creator inside the same transaction; deduplicate repeated follow/unfollow cycles
      const existingNotif = await tx.notification.findFirst({
        where: {
          userId: targetUserId,
          type: NotificationType.Follow,
          relatedUserId: user.id,
        },
        select: { id: true },
      });

      if (!existingNotif) {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: NotificationType.Follow,
            relatedUserId: user.id,
          },
        });
      }

      const followerCount = await tx.follow.count({
        where: { followingId: targetUserId },
      });

      return {
        following: true,
        targetUserId,
        followerCount,
      };
    });

    return apiSuccess(result, 201);
  } catch (error: any) {
    if (error?.code === "P2002" || error?.code === "23505") {
      return apiError("CONFLICT", "You are already following this creator", 409);
    }
    return handleApiError(error);
  }
}

// DELETE /api/users/[id]/follow - Unfollow a creator (only current user's own follow record)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required to unfollow a creator", 401);
    }

    const targetUserId = params.id;

    if (targetUserId === user.id) {
      return apiError("BAD_REQUEST", "Invalid unfollow target", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new AppError("NOT_FOUND", "Creator not found", 404);
      }

      // Strictly scoped to current authenticated user's own follow relationship.
      // Never modifies Connection or ProjectCollaborator records.
      await tx.follow.deleteMany({
        where: {
          followerId: user.id,
          followingId: targetUserId,
        },
      });

      const followerCount = await tx.follow.count({
        where: { followingId: targetUserId },
      });

      return {
        following: false,
        targetUserId,
        followerCount,
      };
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
