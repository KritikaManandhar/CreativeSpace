import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ReportStatus } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: {
    id: string;
  };
}

const UpdateReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
});

// PATCH /api/admin/reports/[id] - Resolve or dismiss a moderation report
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isAdmin) {
      return apiError("FORBIDDEN", "Administrative privileges required", 403);
    }

    const reportId = params.id;
    const body = await req.json();
    const { status } = UpdateReportSchema.parse(body);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return apiError("NOT_FOUND", "Report not found", 404);
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
