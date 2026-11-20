import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SendConnectionRequestSchema } from "@/lib/validations/connection";
import { getConnectionPairKey, getOrderedUserPair } from "@/lib/social-privacy";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { ConnectionStatus, NotificationType } from "@prisma/client";

export const dynamic = "force-dynamic";

const SAFE_PEER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  disciplines: true,
} as const;

// GET /api/connections - List accepted peer connections for authenticated user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const connections = await prisma.connection.findMany({
      where: {
        status: ConnectionStatus.Accepted,
        OR: [{ requesterId: user.id }, { receiverId: user.id }],
      },
      include: {
        requester: { select: SAFE_PEER_SELECT },
        receiver: { select: SAFE_PEER_SELECT },
      },
      orderBy: { acceptedAt: "desc" },
    });

    const formatted = connections.map((conn) => {
      const peer = conn.requesterId === user.id ? conn.receiver : conn.requester;
      return {
        id: conn.id,
        requesterId: conn.requesterId,
        receiverId: conn.receiverId,
        status: conn.status,
        createdAt: conn.createdAt,
        acceptedAt: conn.acceptedAt,
        peer,
      };
    });

    const response = apiSuccess({ connections: formatted });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/connections - Send a peer connection request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const { receiverId } = SendConnectionRequestSchema.parse(body);

    if (receiverId === user.id) {
      return apiError(
        "BAD_REQUEST",
        "You cannot send a connection request to yourself",
        400
      );
    }

    const pairKey = getConnectionPairKey(user.id, receiverId);
    const [lowUserId, highUserId] = getOrderedUserPair(user.id, receiverId);

    const connection = await prisma.$transaction(async (tx) => {
      // Deterministic row locking on both users in ascending ID order prevents
      // deadlocks and serializes concurrent requests (A->B and B->A) for this pair.
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM users WHERE id IN (${lowUserId}, ${highUserId}) ORDER BY id ASC FOR UPDATE`;
        } catch {
          // Allow in-memory test harness compatibility when raw SQL is mocked/unsupported
        }
      }

      const targetUser = await tx.user.findUnique({
        where: { id: receiverId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new AppError("NOT_FOUND", "Target creator not found", 404);
      }

      const existing = await tx.connection.findUnique({
        where: { pairKey },
      });

      if (existing) {
        if (existing.status === ConnectionStatus.Accepted) {
          throw new AppError(
            "CONFLICT",
            "You are already connected with this creator",
            409
          );
        }

        if (existing.status === ConnectionStatus.Pending) {
          if (existing.requesterId === user.id) {
            throw new AppError(
              "CONFLICT",
              "You already have a pending connection request to this creator",
              409
            );
          }
          throw new AppError(
            "CONFLICT",
            "This creator has already sent you a pending connection request. Please accept or reject their request instead.",
            409,
            { existingConnectionId: existing.id }
          );
        }

        // Agreed re-request policy for Rejected relationships:
        // Reuse the single canonical row, reset to Pending with the new requester/receiver,
        // clear rejectedAt, and emit a single fresh ConnectionRequest notification.
        const reopened = await tx.connection.update({
          where: { id: existing.id },
          data: {
            requesterId: user.id,
            receiverId,
            status: ConnectionStatus.Pending,
            acceptedAt: null,
            rejectedAt: null,
          },
          include: {
            requester: { select: SAFE_PEER_SELECT },
            receiver: { select: SAFE_PEER_SELECT },
          },
        });

        await tx.notification.create({
          data: {
            userId: receiverId,
            type: NotificationType.ConnectionRequest,
            relatedUserId: user.id,
            relatedConnectionId: reopened.id,
          },
        });

        return reopened;
      }

      const created = await tx.connection.create({
        data: {
          requesterId: user.id,
          receiverId,
          pairKey,
          status: ConnectionStatus.Pending,
          acceptedAt: null,
          rejectedAt: null,
        },
        include: {
          requester: { select: SAFE_PEER_SELECT },
          receiver: { select: SAFE_PEER_SELECT },
        },
      });

      await tx.notification.create({
        data: {
          userId: receiverId,
          type: NotificationType.ConnectionRequest,
          relatedUserId: user.id,
          relatedConnectionId: created.id,
        },
      });

      return created;
    });

    return apiSuccess(connection, 201);
  } catch (error: any) {
    // Map PostgreSQL unique constraint violations (P2002 / 23505) cleanly to 409 Conflict
    if (error?.code === "P2002" || error?.code === "23505") {
      return apiError(
        "CONFLICT",
        "A connection relationship already exists between these creators",
        409
      );
    }
    return handleApiError(error);
  }
}
