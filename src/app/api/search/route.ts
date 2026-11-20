import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

// GET /api/search - Keyword and multi-facet search over public projects
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const category = searchParams.get("category");
    const tag = searchParams.get("tag")?.toLowerCase().trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const skip = (page - 1) * limit;

    // Build conditions strictly scoped to Public projects
    const conditions: any[] = [{ visibility: Visibility.Public }];

    if (category && category !== "All") {
      conditions.push({ category });
    }

    if (tag) {
      conditions.push({
        projectTags: {
          some: {
            tag: { name: tag },
          },
        },
      });
    }

    if (query) {
      conditions.push({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
          {
            creator: {
              OR: [
                { username: { contains: query, mode: "insensitive" } },
                { displayName: { contains: query, mode: "insensitive" } },
              ],
            },
          },
          {
            projectTags: {
              some: {
                tag: {
                  name: { contains: query, mode: "insensitive" },
                },
              },
            },
          },
        ],
      });
    }

    const whereClause = { AND: conditions };

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
            },
          },
        },
        orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const formatted = projects.map((p) => ({
      ...p,
      tags: p.projectTags.map((pt) => pt.tag.name),
    }));

    return apiSuccess({
      query,
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
