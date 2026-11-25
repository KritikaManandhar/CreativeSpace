import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddPortfolioProjectSchema } from "@/lib/validations/portfolio";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { recordCommunityActivity } from "@/lib/activity";
import { ActivityType, ProjectStatus, Visibility } from "@prisma/client";

// POST /api/portfolio/projects - Add a completed public project to creator's portfolio
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    if (user.role !== "CREATOR" && !user.isAdmin) {
      return apiError("FORBIDDEN", "Only creators can showcase projects in a portfolio", 403);
    }

    const body = await req.json();
    const { projectId, featured, displayOrder } = AddPortfolioProjectSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return apiError("NOT_FOUND", "Project not found", 404);
    }

    if (project.creatorId !== user.id) {
      return apiError("FORBIDDEN", "You can only showcase your own projects in your portfolio", 403);
    }

    // STRICT BUSINESS RULE (BUS-R4, BUS-R5 & Prompt §4.6):
    // Only projects with status == Completed and visibility == Public can be added to a creator's Portfolio.
    if (project.status !== ProjectStatus.Completed) {
      return apiError(
        "INVALID_STATE",
        `Only Completed projects can be showcased in your portfolio (current status: ${project.status}). Please mark the project as Completed first.`,
        400
      );
    }

    if (project.visibility !== Visibility.Public) {
      return apiError(
        "INVALID_VISIBILITY",
        `Only Public projects can be added to your portfolio (current visibility: ${project.visibility}). Please set project visibility to Public.`,
        400
      );
    }

    // Ensure user has portfolio record
    const portfolio = await prisma.portfolio.upsert({
      where: { userId: user.id },
      create: { userId: user.id, customSlug: user.username },
      update: {},
    });

    // Add or update project in portfolio
    const portfolioProject = await prisma.portfolioProject.upsert({
      where: {
        portfolioId_projectId: {
          portfolioId: portfolio.id,
          projectId,
        },
      },
      create: {
        portfolioId: portfolio.id,
        projectId,
        featured,
        displayOrder,
      },
      update: {
        featured,
        displayOrder,
      },
      include: {
        project: true,
      },
    });

    await recordCommunityActivity(prisma, {
      actorId: user.id,
      type: ActivityType.PortfolioPublished,
      projectId,
    });

    return apiSuccess(portfolioProject, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
