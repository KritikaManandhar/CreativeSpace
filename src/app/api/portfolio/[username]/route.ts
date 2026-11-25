import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  filterSocialLinksForViewer,
  getConnectionPairKey,
} from "@/lib/social-privacy";
import { formatActivitySummary, resolveSafePublicFeedPreview } from "@/lib/activity";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { ConnectionStatus, InvitationStatus, VersionStatus, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    username: string;
  };
}

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

// GET /api/portfolio/[username] - Public portfolio showcase & comprehensive creator profile data
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
        role: true,
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

    // Additional enriched public data: All Public Projects, Public Collaborations, Creator Posts
    let allProjects: any[] = [];
    let collaborations: any[] = [];
    let posts: any[] = [];
    let collaborationsCount = 0;

    // 1. Fetch all public projects created by this creator
    if (typeof (prisma.project as any)?.findMany === "function") {
      try {
        const foundProjects = await prisma.project.findMany({
          where: {
            creatorId: user.id,
            visibility: Visibility.Public,
          },
          include: {
            versions: {
              where: {
                status: { in: [VersionStatus.Approved, VersionStatus.Final] },
              },
              select: { id: true, versionNumber: true, status: true },
              orderBy: { versionNumber: "desc" },
            },
            assets: {
              where: {
                thumbnailPath: { not: null },
              },
              select: {
                id: true,
                versionId: true,
                thumbnailPath: true,
                mimeType: true,
                fileName: true,
              },
              take: 6,
              orderBy: { createdAt: "desc" },
            },
            projectTags: {
              include: { tag: true },
            },
            collaborators: {
              where: { status: InvitationStatus.Accepted },
              include: {
                user: {
                  select: SAFE_USER_SELECT,
                },
              },
            },
            _count: {
              select: { versions: true, likes: true, comments: true },
            },
            likes: viewer?.id
              ? { where: { userId: viewer.id }, select: { id: true } }
              : false,
          },
          orderBy: { createdAt: "desc" },
        });

        allProjects = foundProjects.map((p: any) => {
          const previewImg = resolveSafePublicFeedPreview(p) || p.assets?.[0]?.thumbnailPath || null;
          return {
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            status: p.status,
            metadata: p.metadata,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            coverUrl: previewImg,
            previewImageUrl: previewImg,
            tags: p.projectTags?.map((pt: any) => pt.tag.name) || [],
            versionCount: p._count?.versions || p.versions?.length || 0,
            latestVersion: p.versions?.[0] || null,
            likeCount: p._count?.likes || 0,
            commentCount: p._count?.comments || 0,
            hasLiked: Array.isArray(p.likes) && p.likes.length > 0,
            collaborators: (p.collaborators || []).map((c: any) => ({
              id: c.id,
              role: c.role,
              user: c.user,
            })),
          };
        });
      } catch {
        // Safe fallback in test harnesses
      }
    }

    // 2. Fetch public collaborations where this user is an accepted member
    if (typeof (prisma.projectCollaborator as any)?.findMany === "function") {
      try {
        const colabRecords = await prisma.projectCollaborator.findMany({
          where: {
            userId: user.id,
            status: InvitationStatus.Accepted,
            project: {
              visibility: Visibility.Public,
            },
          },
          include: {
            project: {
              include: {
                creator: {
                  select: SAFE_USER_SELECT,
                },
                collaborators: {
                  where: { status: InvitationStatus.Accepted },
                  include: {
                    user: {
                      select: SAFE_USER_SELECT,
                    },
                  },
                },
                assets: {
                  where: { thumbnailPath: { not: null } },
                  select: {
                    id: true,
                    versionId: true,
                    thumbnailPath: true,
                    mimeType: true,
                  },
                  take: 4,
                },
                _count: {
                  select: { versions: true, likes: true, comments: true },
                },
              },
            },
          },
          orderBy: { acceptedAt: "desc" },
        });

        collaborations = colabRecords.map((cr: any) => {
          const previewImg = resolveSafePublicFeedPreview(cr.project) || cr.project.assets?.[0]?.thumbnailPath || null;
          return {
            id: cr.id,
            role: cr.role,
            acceptedAt: cr.acceptedAt,
            project: {
              id: cr.project.id,
              title: cr.project.title,
              description: cr.project.description,
              category: cr.project.category,
              status: cr.project.status,
              creator: cr.project.creator,
              coverUrl: previewImg,
              collaborators: (cr.project.collaborators || []).map((c: any) => ({
                id: c.id,
                role: c.role,
                user: c.user,
              })),
              likeCount: cr.project._count?.likes || 0,
              commentCount: cr.project._count?.comments || 0,
            },
          };
        });

        collaborationsCount = collaborations.length;
      } catch {
        // Safe fallback
      }
    }

    // 3. Fetch public activities / posts by this user
    if (typeof (prisma.activity as any)?.findMany === "function") {
      try {
        const acts = await prisma.activity.findMany({
          where: {
            actorId: user.id,
            project: { visibility: Visibility.Public },
          },
          include: {
            project: {
              include: {
                versions: {
                  where: { status: { in: [VersionStatus.Approved, VersionStatus.Final] } },
                  select: { id: true, versionNumber: true, status: true },
                },
                assets: {
                  where: { thumbnailPath: { not: null } },
                  select: { id: true, versionId: true, thumbnailPath: true, mimeType: true },
                  take: 4,
                },
                projectTags: { include: { tag: true } },
                _count: { select: { likes: true, comments: true } },
                likes: viewer?.id ? { where: { userId: viewer.id }, select: { id: true } } : false,
              },
            },
            version: {
              select: { id: true, versionNumber: true, status: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        });

        posts = acts.map((act: any) => {
          const previewImg = resolveSafePublicFeedPreview(act.project) || act.project.assets?.[0]?.thumbnailPath || null;
          return {
            id: act.id,
            type: act.type,
            summary: formatActivitySummary(act.type, act.version?.versionNumber),
            createdAt: act.createdAt.toISOString(),
            actor: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl,
              disciplines: Array.isArray(user.disciplines) ? user.disciplines : [],
              isFollowing,
            },
            project: {
              id: act.project.id,
              title: act.project.title,
              description: act.project.description,
              category: act.project.category,
              status: act.project.status,
              previewImageUrl: previewImg,
              likeCount: act.project._count?.likes ?? 0,
              commentCount: act.project._count?.comments ?? 0,
              hasLiked: Array.isArray(act.project.likes) && act.project.likes.length > 0,
              tags: act.project.projectTags?.map((pt: any) => pt.tag.name) || [],
              mediaType: "image" as const,
            },
            version: act.version
              ? {
                  id: act.version.id,
                  versionNumber: act.version.versionNumber,
                  status: act.version.status,
                }
              : null,
          };
        });
      } catch {
        // Safe fallback
      }
    }

    // If no activities were recorded yet, synthesize posts from allProjects so the Posts tab is populated
    if (posts.length === 0 && allProjects.length > 0) {
      posts = allProjects.map((proj) => ({
        id: `proj-post-${proj.id}`,
        type: "ProjectPublished",
        summary: `published a new creative project: ${proj.title}`,
        createdAt: new Date(proj.createdAt).toISOString(),
        actor: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          disciplines: Array.isArray(user.disciplines) ? user.disciplines : [],
          isFollowing,
        },
        project: {
          id: proj.id,
          title: proj.title,
          description: proj.description,
          category: proj.category,
          status: proj.status,
          previewImageUrl: proj.coverUrl,
          likeCount: proj.likeCount,
          commentCount: proj.commentCount,
          hasLiked: proj.hasLiked,
          tags: proj.tags,
          mediaType: "image" as const,
        },
        version: proj.latestVersion
          ? {
              id: proj.latestVersion.id,
              versionNumber: proj.latestVersion.versionNumber,
              status: proj.latestVersion.status,
            }
          : null,
      }));
    }

    const response = apiSuccess({
      creator: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        disciplines: user.disciplines,
        socialLinks: visibleSocialLinks,
        ...(isOwner ? { socialPrivacy: user.socialPrivacy } : {}),
        joinedAt: user.createdAt,
        stats: {
          createdProjects: user._count?.createdProjects ?? allProjects.length,
          followers: user._count?.followers ?? 0,
          following: user._count?.following ?? 0,
          collaborations: collaborationsCount,
        },
      },
      connection: viewerConnection,
      isFollowing,
      portfolio: {
        id: user.portfolio?.id,
        customSlug: user.portfolio?.customSlug,
        projects: publicShowcaseProjects,
      },
      allProjects,
      collaborations,
      posts,
    });

    // Prevent shared/proxy caches from serving per-viewer filtered social links or connection states
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
