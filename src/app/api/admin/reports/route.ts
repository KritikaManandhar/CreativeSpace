import { NextRequest } from "next/server";
import { getCurrentUser, isAuthoritativeAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ReportStatus, ReportTargetType } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateReportSchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().uuid("Invalid target ID"),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(1000),
});

// GET /api/admin/reports - List moderation reports (Admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAuthoritativeAdmin(user)) {
      return apiError("FORBIDDEN", "Administrative privileges required", 403);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ReportStatus | null;

    const reports = await prisma.report.findMany({
      where: statusParam ? { status: statusParam } : {},
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(reports);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/admin/reports - Submit a report (any authenticated user)
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const { targetType, targetId, reason } = CreateReportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType,
        targetId,
        reason: reason.trim(),
        status: ReportStatus.Open,
      },
    });

    return apiSuccess(report, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
