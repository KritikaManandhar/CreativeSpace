import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: {
    id: string;
  };
}

// POST /api/projects/[id]/like - Toggle like on project
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required to like a project", 401);
    }

    const projectId = params.id;

    // RBAC: Check permission to view project
    await authorize(user, projectId, "view_project");

    // Check if user already liked
    const existing = await prisma.like.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });

    let liked = false;
    if (existing) {
      await prisma.like.delete({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId,
          },
        },
      });
      liked = false;
    } else {
      await prisma.like.create({
        data: {
          userId: user.id,
          projectId,
        },
      });
      liked = true;
    }

    const count = await prisma.like.count({ where: { projectId } });

    return apiSuccess({
      liked,
      totalLikes: count,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
