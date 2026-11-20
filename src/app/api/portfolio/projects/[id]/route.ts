import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: {
    id: string; // portfolioProjectId or projectId
  };
}

// DELETE /api/portfolio/projects/[id] - Remove project from portfolio
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const id = params.id;

    // Find user's portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.id },
    });

    if (!portfolio) {
      return apiError("NOT_FOUND", "Portfolio not found", 404);
    }

    // Try finding by portfolioProjectId or projectId
    const item = await prisma.portfolioProject.findFirst({
      where: {
        portfolioId: portfolio.id,
        OR: [{ id }, { projectId: id }],
      },
    });

    if (!item) {
      return apiError("NOT_FOUND", "Project not found in your portfolio", 404);
    }

    await prisma.portfolioProject.delete({
      where: { id: item.id },
    });

    return apiSuccess({ message: "Project removed from portfolio successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
