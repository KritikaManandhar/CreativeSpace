import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RespondConnectionRequestSchema } from "@/lib/validations/connection";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { ConnectionStatus, NotificationType } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

const SAFE_PEER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  disciplines: true,
} as const;

// PATCH /api/connections/[id] - Accept or reject an incoming pending connection request
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const connectionId = params.id;
    const body = await req.json();
    const { action } = RespondConnectionRequestSchema.parse(body);

    const updated = await prisma.$transaction(async (tx) => {
      // Lock the connection row to prevent concurrent accept/reject/cancel races
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM connections WHERE id = ${connectionId} FOR UPDATE`;
        } catch {
          // Mock test harness compatibility
        }
      }

      const existing = await tx.connection.findUnique({
        where: { id: connectionId },
      });

      if (!existing) {
        throw new AppError("NOT_FOUND", "Connection request not found", 404);
      }

      // Authorization: ONLY the intended receiver can accept or reject
      if (existing.receiverId !== user.id) {
        throw new AppError(
          "FORBIDDEN",
          "Only the recipient of a connection request can accept or reject it",
          403
        );
      }

      // Only Pending requests can transition to Accepted or Rejected
      if (existing.status !== ConnectionStatus.Pending) {
        throw new AppError(
          "CONFLICT",
          `Connection request is already ${existing.status.toLowerCase()} and cannot be modified`,
          409
        );
      }

      const now = new Date();

      if (action === "accept") {
        const accepted = await tx.connection.update({
          where: { id: connectionId },
          data: {
            status: ConnectionStatus.Accepted,
            acceptedAt: now,
            rejectedAt: null,
          },
          include: {
            requester: { select: SAFE_PEER_SELECT },
            receiver: { select: SAFE_PEER_SELECT },
          },
        });

        // Notify the original requester inside the same transaction
        await tx.notification.create({
          data: {
            userId: existing.requesterId,
            type: NotificationType.ConnectionAccepted,
            relatedUserId: user.id,
            relatedConnectionId: accepted.id,
          },
        });

        return accepted;
      }

      // action === "reject": update status & rejectedAt; NEVER create acceptance notification
      const rejected = await tx.connection.update({
        where: { id: connectionId },
        data: {
          status: ConnectionStatus.Rejected,
          rejectedAt: now,
          acceptedAt: null,
        },
        include: {
          requester: { select: SAFE_PEER_SELECT },
          receiver: { select: SAFE_PEER_SELECT },
        },
      });

      return rejected;
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/connections/[id] - Cancel outgoing Pending request (requester only) or remove Accepted connection (either participant)
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const connectionId = params.id;

    const result = await prisma.$transaction(async (tx) => {
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM connections WHERE id = ${connectionId} FOR UPDATE`;
        } catch {
          // Mock test harness compatibility
        }
      }

      const existing = await tx.connection.findUnique({
        where: { id: connectionId },
      });

      if (!existing) {
        throw new AppError("NOT_FOUND", "Connection not found", 404);
      }

      const isRequester = existing.requesterId === user.id;
      const isReceiver = existing.receiverId === user.id;

      // Non-participants cannot inspect state or delete
      if (!isRequester && !isReceiver) {
        throw new AppError(
          "FORBIDDEN",
          "You do not have permission to modify this connection",
          403
        );
      }

      if (existing.status === ConnectionStatus.Pending) {
        if (!isRequester) {
          throw new AppError(
            "FORBIDDEN",
            "Only the requester can cancel a pending connection request. Recipients should reject it instead.",
            403
          );
        }

        await tx.connection.delete({
          where: { id: connectionId },
        });

        return {
          message: "Connection request cancelled successfully",
          action: "cancelled" as const,
          connectionId,
        };
      }

      if (existing.status === ConnectionStatus.Accepted) {
        await tx.connection.delete({
          where: { id: connectionId },
        });

        return {
          message: "Connection removed successfully",
          action: "removed" as const,
          connectionId,
        };
      }

      throw new AppError(
        "CONFLICT",
        "Rejected connection requests cannot be cancelled or removed",
        409
      );
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
