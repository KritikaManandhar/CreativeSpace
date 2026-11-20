import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/discover - Browse public trending and featured projects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "popular"; // "popular" or "newest"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // Strict Privacy: ONLY Public projects can ever be returned in Discovery
    const whereClause: any = {
      visibility: Visibility.Public,
      ...(category && category !== "All" ? { category } : {}),
    };

    const orderBy: any =
      sort === "newest"
        ? { createdAt: "desc" }
        : [
            { likes: { _count: "desc" } },
            { createdAt: "desc" },
          ];

    const [total, projects] = await Promise.all([
      prisma.project.count({ where: whereClause }),
      prisma.project.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              disciplines: true,
            },
          },
          assets: {
            where: {
              version: {
                status: { in: [VersionStatus.Approved, VersionStatus.Final] },
              },
            },
            select: {
              id: true,
              projectId: true,
              versionId: true,
              fileName: true,
              mimeType: true,
              fileSize: true,
              thumbnailPath: true,
              createdAt: true,
            },
            take: 4,
            orderBy: { createdAt: "desc" },
          },
          projectTags: {
            include: { tag: true },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              versions: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      tags: p.projectTags.map((pt) => pt.tag.name),
    }));

    return apiSuccess({
      projects: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
