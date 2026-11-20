import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConnectionRequestsQuerySchema } from "@/lib/validations/connection";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ConnectionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const SAFE_PEER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  disciplines: true,
} as const;

// GET /api/connections/requests - List pending incoming and/or outgoing connection requests
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const parsedQuery = ConnectionRequestsQuerySchema.parse({
      direction: searchParams.get("direction") || undefined,
    });

    const includeIncoming =
      parsedQuery.direction === "all" || parsedQuery.direction === "incoming";
    const includeOutgoing =
      parsedQuery.direction === "all" || parsedQuery.direction === "outgoing";

    const [incoming, outgoing] = await Promise.all([
      includeIncoming
        ? prisma.connection.findMany({
            where: {
              receiverId: user.id,
              status: ConnectionStatus.Pending,
            },
            include: {
              requester: { select: SAFE_PEER_SELECT },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      includeOutgoing
        ? prisma.connection.findMany({
            where: {
              requesterId: user.id,
              status: ConnectionStatus.Pending,
            },
            include: {
              receiver: { select: SAFE_PEER_SELECT },
            },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    const response = apiSuccess({
      incoming,
      outgoing,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
