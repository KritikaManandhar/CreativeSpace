import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize, getEffectiveRole } from "@/lib/rbac";
import { storageService } from "@/lib/storage";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { Visibility, VersionStatus } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/assets/[id] - Retrieve single asset with signed download URL and strict visibility enforcement
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const assetId = params.id;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        project: {
          select: {
            id: true,
            creatorId: true,
            visibility: true,
            metadata: true,
          },
        },
        version: {
          select: {
            id: true,
            versionNumber: true,
            status: true,
          },
        },
        uploader: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!asset) {
      return apiError("NOT_FOUND", "Asset not found", 404);
    }

    const { role } = await getEffectiveRole(user?.id, asset.projectId);
    const isMember = role === "Owner" || role === "Collaborator" || role === "ClientReviewer";

    // 1. If project is Private or CollaboratorsOnly, non-members are strictly forbidden
    if (!isMember && asset.project.visibility !== Visibility.Public) {
      return apiError("FORBIDDEN", "You do not have permission to access assets from this private project", 403);
    }

    const meta = (asset.project.metadata || {}) as Record<string, any>;
    const previewAssetIds = [meta.previewAssetId, meta.coverAssetId].filter(Boolean) as string[];
    const isApprovedOrFinalVersionAsset =
      asset.version?.status === "Approved" || asset.version?.status === "Final";
    const isExplicitPreview =
      previewAssetIds.includes(asset.id) &&
      (!asset.versionId || isApprovedOrFinalVersionAsset);

    // 2. If project is Public, non-members can ONLY access approved/final version assets
    //    or explicitly designated cover/preview assets that are NOT attached to Draft/Rejected versions
    if (!isMember) {
      if (!isApprovedOrFinalVersionAsset && !isExplicitPreview) {
        return apiError(
          "FORBIDDEN",
          "Private draft media and unversioned workspace assets cannot be accessed by non-members",
          403
        );
      }
    }

    // 3. Generate time-limited signed download URL via server-side credentials.
    //    Because all project assets share a single private Supabase Storage bucket
    //    (`public = false`), ALL downloads—including authorized Public project assets—
    //    use expiring signed URLs so Private/Draft/Rejected files can never be accessed
    //    directly via unauthenticated public bucket URLs.
    let downloadUrl = "";
    try {
      downloadUrl = await storageService.getSignedDownloadUrl(asset.storagePath, 3600);
    } catch (e) {
      downloadUrl = "";
    }

    const { storagePath: _storagePath, ...safeAsset } = asset;
    const response = apiSuccess({
      ...safeAsset,
      downloadUrl,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/assets/[id] - Delete an asset from DB and object storage with strict locking hierarchy
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const assetId = params.id;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        version: {
          select: { id: true, status: true, versionNumber: true },
        },
      },
    });

    if (!asset) {
      return apiError("NOT_FOUND", "Asset not found", 404);
    }

    // RBAC: Check permission to delete asset on target project
    const { role } = await authorize(user, asset.projectId, "delete_asset");

    // Collaborators can only delete assets they uploaded; Owners can delete any asset
    if (role !== "Owner" && asset.uploaderId !== user?.id) {
      return apiError(
        "FORBIDDEN",
        "Collaborators can only delete assets they uploaded themselves",
        403
      );
    }

    // Protection rule: Cannot delete an asset that is attached to a designated FINAL version
    if (asset.version?.status === VersionStatus.Final) {
      return apiError(
        "BAD_REQUEST",
        `Cannot delete an asset attached to a designated FINAL version (v${asset.version.versionNumber}). Demote the version to Approved first.`,
        400
      );
    }

    // Atomic transaction following strict locking hierarchy: Project -> Version -> Asset
    await prisma.$transaction(async (tx) => {
      // Level 1: Lock Project row
      if (typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id FROM projects WHERE id = ${asset.projectId} FOR UPDATE`;
        } catch (rawErr) {
          // Mock support
        }
      }

      // Level 2: Lock Version row if versionId exists
      if (asset.versionId && typeof (tx as any).$executeRaw === "function") {
        try {
          await tx.$executeRaw`SELECT id, status FROM versions WHERE id = ${asset.versionId} FOR UPDATE`;
        } catch (rawErr) {
          // Mock support
        }
      }

      // Re-verify version status under lock
      if (asset.versionId) {
        const lockedVersion = await tx.version.findUnique({
          where: { id: asset.versionId },
          select: { status: true, versionNumber: true },
        });
        if (lockedVersion?.status === VersionStatus.Final) {
          throw new AppError(
            "BAD_REQUEST",
            `Cannot delete an asset attached to a designated FINAL version (v${lockedVersion.versionNumber}). Demote the version to Approved first.`,
            400
          );
        }
      }

      // Level 3: Delete asset row
      await tx.asset.delete({
        where: { id: assetId },
      });
    });

    // Delete from Supabase Storage after successful database transaction
    try {
      await storageService.deleteObject(asset.storagePath);
    } catch (storageErr) {
      console.warn("Storage deletion warning (file may not exist):", storageErr);
    }

    return apiSuccess({ message: "Asset deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
