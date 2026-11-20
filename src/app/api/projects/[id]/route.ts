import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { UpdateProjectSchema } from "@/lib/validations/project";
import { validateCategoryMetadata } from "@/lib/validations/category-metadata";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { recordCommunityActivity } from "@/lib/activity";
import { ActivityType, Visibility } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id] - Get project details with RBAC check
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // Strict RBAC: ensures private projects don't leak
    const { role } = await authorize(user, projectId, "view_project");
    const isMember = role === "Owner" || role === "Collaborator" || role === "ClientReviewer";

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { invitedAt: "asc" },
        },
        assets: {
          orderBy: { createdAt: "desc" },
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
        },
        versions: {
          orderBy: { versionNumber: "desc" },
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
            assets: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
        comments: {
          where: { versionId: null }, // Project-level comments
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        projectTags: {
          include: { tag: true },
        },
        portfolioProjects: true,
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!project) {
      return apiError("NOT_FOUND", "Project not found", 404);
    }

    // Filter collaborators:
    // - Owner sees accepted collaborators + pending invitations (excluding closed Rejected/Cancelled rows)
    // - Non-owners ONLY see accepted members
    const visibleCollaborators = project.collaborators.filter((c: any) => {
      const effectiveStatus = c.status || (c.acceptedAt ? "Accepted" : "Pending");
      if (role === "Owner") {
        return effectiveStatus === "Accepted" || effectiveStatus === "Pending";
      }
      return effectiveStatus === "Accepted" && c.acceptedAt !== null;
    });

    // Filter assets: Non-members only see approved version assets or explicitly designated preview assets
    const meta = (project.metadata || {}) as Record<string, any>;
    const previewAssetIds = [meta.previewAssetId, meta.coverAssetId].filter(Boolean) as string[];

    const stripStoragePath = <T extends { storagePath?: unknown }>(asset: T) => {
      const { storagePath: _storagePath, ...safeAsset } = asset;
      return safeAsset;
    };

    const visibleAssets = (
      isMember
        ? project.assets
        : project.assets.filter((a) => {
            if (a.versionId) {
              return project.versions.some(
                (v) =>
                  v.id === a.versionId &&
                  (v.status === "Approved" || v.status === "Final")
              );
            }
            // Unversioned asset: only visible if explicitly designated as public preview asset
            return previewAssetIds.includes(a.id);
          })
    ).map(stripStoragePath);

    // Filter versions: Non-members cannot view Rejected versions; draft media assets stay hidden from non-members
    const visibleVersions = project.versions
      .filter((v) => isMember || v.status !== "Rejected")
      .map((v) => ({
        ...v,
        assets:
          isMember || v.status === "Approved" || v.status === "Final"
            ? v.assets.map(stripStoragePath)
            : [],
      }));

    // Internal project-level discussions (versionId === null) are strictly restricted to project members
    const visibleProjectComments = isMember ? project.comments : [];

    // Check if current user has liked this project
    let hasLiked = false;
    if (user) {
      const like = await prisma.like.findUnique({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId,
          },
        },
      });
      hasLiked = !!like;
    }

    const response = apiSuccess({
      ...project,
      collaborators: visibleCollaborators,
      assets: visibleAssets,
      versions: visibleVersions,
      comments: visibleProjectComments,
      userRole: role,
      hasLiked,
      isPortfolioFeatured: project.portfolioProjects.length > 0,
      tags: project.projectTags.map((pt) => pt.tag.name),
    });

    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/projects/[id] - Update project settings
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Only Owner can manage project settings
    await authorize(user, projectId, "manage_settings");

    const body = await req.json();
    const validatedData = UpdateProjectSchema.parse(body);

    // Validate metadata if provided
    if (validatedData.metadata && validatedData.category) {
      const metaResult = validateCategoryMetadata(validatedData.category, validatedData.metadata);
      if (!metaResult.success) {
        return apiError(
          "VALIDATION_ERROR",
          `Invalid metadata: ${metaResult.error.issues[0]?.message}`,
          422,
          metaResult.error.issues
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.project.update({
        where: { id: projectId },
        data: {
          title: validatedData.title?.trim(),
          description: validatedData.description !== undefined ? validatedData.description?.trim() : undefined,
          category: validatedData.category?.trim(),
          status: validatedData.status,
          visibility: validatedData.visibility,
          metadata: validatedData.metadata !== undefined ? validatedData.metadata : undefined,
        },
      });

      // Update tags if provided
      if (validatedData.tags) {
        await tx.projectTag.deleteMany({ where: { projectId } });

        for (const rawTag of validatedData.tags) {
          const tagName = rawTag.toLowerCase().trim().replace(/[^a-z0-9-_]/g, "");
          if (!tagName) continue;

          const tag = await tx.tag.upsert({
            where: { name: tagName },
            create: { name: tagName },
            update: {},
          });

          await tx.projectTag.create({
            data: {
              projectId,
              tagId: tag.id,
            },
          });
        }
      }

      if (p.visibility === Visibility.Public) {
        await recordCommunityActivity(tx, {
          actorId: p.creatorId,
          type: ActivityType.ProjectPublished,
          projectId: p.id,
        });
      }

      return p;
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/projects/[id] - Delete project (Owner only)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Only Owner can delete project
    await authorize(user, projectId, "delete_project");

    // BUS-R6: check if project is featured in portfolio
    const inPortfolio = await prisma.portfolioProject.findFirst({
      where: { projectId },
    });

    const forceDelete = req.nextUrl.searchParams.get("force") === "true";
    if (inPortfolio && !forceDelete) {
      return apiError(
        "CONFIRMATION_REQUIRED",
        "This project is currently showcased in your public portfolio. Deleting it will remove it from the showcase. Please confirm with ?force=true.",
        400
      );
    }

    // Delete child reply comments first inside a transaction so Comment.parent (ON DELETE RESTRICT)
    // does not block legitimate Owner project deletion in PostgreSQL.
    await prisma.$transaction(async (tx) => {
      await tx.comment.deleteMany({
        where: {
          projectId,
          parentId: { not: null },
        },
      });

      await tx.project.delete({
        where: { id: projectId },
      });
    });

    return apiSuccess({ message: "Project deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
