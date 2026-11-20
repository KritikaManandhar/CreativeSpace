import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  filterSocialLinksForViewer,
  getConnectionPairKey,
} from "@/lib/social-privacy";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ConnectionStatus, VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    username: string;
  };
}

// GET /api/portfolio/[username] - Public portfolio showcase
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const username = params.username.toLowerCase().trim();
    const viewer = await getCurrentUser();

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        disciplines: true,
        socialLinks: true,
        socialPrivacy: true,
        createdAt: true,
        portfolio: {
          include: {
            portfolioProjects: {
              include: {
                project: {
                  include: {
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
                      select: { likes: true, comments: true },
                    },
                  },
                },
              },
              orderBy: [
                { featured: "desc" },
                { displayOrder: "asc" },
              ],
            },
          },
        },
        _count: {
          select: {
            createdProjects: {
              where: { visibility: Visibility.Public },
            },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return apiError("NOT_FOUND", `Creator @${params.username} not found`, 404);
    }

    // Server-side social links privacy filtering (Public / ConnectionsOnly / Private)
    // Never rely on frontend hiding; anonymous viewers cannot bypass privacy checks.
    const isOwner = Boolean(viewer?.id && viewer.id === user.id);

    let viewerConnection: {
      id: string;
      status: ConnectionStatus;
      direction: "incoming" | "outgoing";
      acceptedAt: Date | null;
      rejectedAt: Date | null;
    } | null = null;

    let isFollowing = false;

    if (viewer?.id && !isOwner) {
      const pairKey = getConnectionPairKey(viewer.id, user.id);
      const [existingConn, existingFollow] = await Promise.all([
        prisma.connection.findUnique({
          where: { pairKey },
          select: {
            id: true,
            requesterId: true,
            receiverId: true,
            status: true,
            acceptedAt: true,
            rejectedAt: true,
          },
        }),
        typeof (prisma.follow as any)?.findUnique === "function"
          ? prisma.follow.findUnique({
              where: {
                followerId_followingId: {
                  followerId: viewer.id,
                  followingId: user.id,
                },
              },
              select: { id: true },
            })
          : Promise.resolve(null),
      ]);

      isFollowing = Boolean(existingFollow);

      if (existingConn) {
        viewerConnection = {
          id: existingConn.id,
          status: existingConn.status,
          direction:
            existingConn.requesterId === viewer.id ? "outgoing" : "incoming",
          acceptedAt: existingConn.acceptedAt,
          rejectedAt: existingConn.rejectedAt,
        };
      }
    }

    const connected = viewerConnection?.status === ConnectionStatus.Accepted;

    const visibleSocialLinks = filterSocialLinksForViewer(
      user.socialLinks,
      user.socialPrivacy,
      {
        isOwner,
        isAcceptedConnection: connected,
      }
    );

    // Filter projects to only include Public visibility (Privacy guarantee per PRIV-1 & TRD §32)
    const publicShowcaseProjects = (user.portfolio?.portfolioProjects || [])
      .filter((pp) => pp.project.visibility === Visibility.Public)
      .map((pp) => ({
        id: pp.id,
        featured: pp.featured,
        displayOrder: pp.displayOrder,
        project: {
          ...pp.project,
          tags: pp.project.projectTags.map((pt) => pt.tag.name),
        },
      }));

    const response = apiSuccess({
      creator: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        disciplines: user.disciplines,
        socialLinks: visibleSocialLinks,
        ...(isOwner ? { socialPrivacy: user.socialPrivacy } : {}),
        joinedAt: user.createdAt,
        stats: user._count,
      },
      connection: viewerConnection,
      isFollowing,
      portfolio: {
        id: user.portfolio?.id,
        customSlug: user.portfolio?.customSlug,
        projects: publicShowcaseProjects,
      },
    });

    // Prevent shared/proxy caches from serving per-viewer filtered social links or connection states
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
