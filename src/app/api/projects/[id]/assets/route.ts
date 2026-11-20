import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { storageService } from "@/lib/storage";
import { apiSuccess, handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/assets - List assets for a project with signed URLs
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // Strict RBAC: Check permission to view project
    const { project, role } = await authorize(user, projectId, "view_project");
    const isMember = role === "Owner" || role === "Collaborator" || role === "ClientReviewer";

    // Non-members on public projects only see approved version assets or explicitly designated preview assets.
    // Raw unversioned workspace files without explicit preview designation are strictly hidden from non-members.
    const meta = (project.metadata || {}) as Record<string, any>;
    const previewAssetIds = [meta.previewAssetId, meta.coverAssetId].filter(Boolean) as string[];

    const assets = await prisma.asset.findMany({
      where: {
        projectId,
        ...(!isMember
          ? {
              OR: [
                { version: { status: { in: ["Approved", "Final"] } } },
                ...(previewAssetIds.length > 0 ? [{ id: { in: previewAssetIds }, versionId: null }] : []),
              ],
            }
          : {}),
      },
      include: {
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Attach time-limited signed download URLs generated server-side against the private bucket
    const enrichedAssets = await Promise.all(
      assets.map(async (asset) => {
        let downloadUrl = "";
        try {
          downloadUrl = await storageService.getSignedDownloadUrl(asset.storagePath, 3600);
        } catch (e) {
          downloadUrl = "";
        }

        const { storagePath: _storagePath, ...safeAsset } = asset;
        return {
          ...safeAsset,
          downloadUrl,
        };
      })
    );

    const response = apiSuccess(enrichedAssets);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
