import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafePublicPreviewUrl } from "@/lib/activity";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { InvitationStatus, VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

function resolveCoverThumbnail(project: any, isAccepted: boolean): string | null {
  // Never expose private workspace assets to pending, rejected, or cancelled invitees.
  if (!isAccepted && project.visibility !== Visibility.Public) {
    return null;
  }

  const meta = (project.metadata || {}) as Record<string, any>;
  const previewAssetId = meta.coverAssetId || meta.previewAssetId || null;
  const assets: any[] = Array.isArray(project.assets) ? project.assets : [];

  const isAssetAllowedForViewer = (asset: any): boolean => {
    if (!isSafePublicPreviewUrl(asset?.thumbnailPath)) return false;
    if (isAccepted) return true;
    // Non-accepted invitees on Public projects may only see Approved/Final version thumbnails
    // or explicitly designated unversioned cover/preview thumbnails (never Draft/Rejected).
    if (asset.versionId) {
      return (
        asset.version?.status === VersionStatus.Approved ||
        asset.version?.status === VersionStatus.Final
      );
    }
    return Boolean(previewAssetId && asset.id === previewAssetId);
  };

  if (previewAssetId) {
    const matched = assets.find((a) => a.id === previewAssetId && isAssetAllowedForViewer(a));
    if (matched?.thumbnailPath) return matched.thumbnailPath.trim();
  }

  const safeAsset = assets.find((a) => isAssetAllowedForViewer(a));
  return safeAsset?.thumbnailPath ? safeAsset.thumbnailPath.trim() : null;
}

// GET /api/invitations - Invitee & Owner Collaboration Invitations Dashboard API
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const [incomingRaw, outgoingRaw] = await Promise.all([
      prisma.projectCollaborator.findMany({
        where: {
          userId: user.id,
          project: {
            creatorId: { not: user.id },
          },
        },
        include: {
          invitedBy: { select: SAFE_USER_SELECT },
          project: {
            select: {
              id: true,
              title: true,
              category: true,
              visibility: true,
              metadata: true,
              creator: { select: SAFE_USER_SELECT },
              assets: {
                where: { thumbnailPath: { not: null } },
                select: {
                  id: true,
                  versionId: true,
                  thumbnailPath: true,
                  version: { select: { status: true } },
                },
                take: 4,
              },
            },
          },
        },
        orderBy: { invitedAt: "desc" },
      }),
      prisma.projectCollaborator.findMany({
        where: {
          userId: { not: user.id },
          project: {
            creatorId: user.id,
          },
        },
        include: {
          user: { select: SAFE_USER_SELECT },
          project: {
            select: {
              id: true,
              title: true,
              category: true,
              visibility: true,
            },
          },
        },
        orderBy: { invitedAt: "desc" },
      }),
    ]);

    const incoming = incomingRaw.map((inv: any) => {
      const status: InvitationStatus =
        inv.status ||
        (inv.acceptedAt ? InvitationStatus.Accepted : InvitationStatus.Pending);
      const isAccepted = status === InvitationStatus.Accepted;

      return {
        id: inv.id,
        projectId: inv.projectId,
        userId: inv.userId,
        role: inv.role,
        status,
        invitedAt: inv.invitedAt,
        acceptedAt: inv.acceptedAt,
        rejectedAt: inv.rejectedAt ?? null,
        cancelledAt: inv.cancelledAt ?? null,
        inviter: inv.invitedBy || inv.project.creator,
        project: {
          id: inv.project.id,
          title: inv.project.title,
          category: inv.project.category,
          visibility: inv.project.visibility,
          thumbnailUrl: resolveCoverThumbnail(inv.project, isAccepted),
        },
      };
    });

    const outgoing = outgoingRaw.map((inv: any) => {
      const status: InvitationStatus =
        inv.status ||
        (inv.acceptedAt ? InvitationStatus.Accepted : InvitationStatus.Pending);

      return {
        id: inv.id,
        projectId: inv.projectId,
        userId: inv.userId,
        role: inv.role,
        status,
        invitedAt: inv.invitedAt,
        acceptedAt: inv.acceptedAt,
        rejectedAt: inv.rejectedAt ?? null,
        cancelledAt: inv.cancelledAt ?? null,
        invitee: inv.user,
        project: {
          id: inv.project.id,
          title: inv.project.title,
          category: inv.project.category,
          visibility: inv.project.visibility,
        },
      };
    });

    const summary = {
      pendingIncoming: incoming.filter((i) => i.status === InvitationStatus.Pending).length,
      pendingOutgoing: outgoing.filter((o) => o.status === InvitationStatus.Pending).length,
      activeCollaborations: incoming.filter((i) => i.status === InvitationStatus.Accepted).length,
    };

    const response = apiSuccess({
      incoming,
      outgoing,
      summary,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
