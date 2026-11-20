import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

// GET /api/admin/stats - Platform health & metrics
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return apiError("FORBIDDEN", "Administrative privileges required", 403);
    }

    const [
      totalUsers,
      totalProjects,
      totalAssets,
      totalVersions,
      totalComments,
      totalLikes,
      pendingReports,
      assetSizeAggregate,
      projectsByCategory,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.asset.count(),
      prisma.version.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.report.count({ where: { status: "Open" } }),
      prisma.asset.aggregate({
        _sum: { fileSize: true },
      }),
      prisma.project.groupBy({
        by: ["category"],
        _count: { id: true },
      }),
    ]);

    const totalStorageBytes = assetSizeAggregate._sum.fileSize || 0;
    const totalStorageMB = Math.round((totalStorageBytes / (1024 * 1024)) * 10) / 10;

    return apiSuccess({
      totalUsers,
      totalProjects,
      totalAssets,
      totalVersions,
      totalComments,
      totalLikes,
      pendingReports,
      totalStorageBytes,
      totalStorageMB,
      projectsByCategory: projectsByCategory.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
