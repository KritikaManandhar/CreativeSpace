import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateProjectSchema } from "@/lib/validations/project";
import { validateCategoryMetadata } from "@/lib/validations/category-metadata";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { recordCommunityActivity } from "@/lib/activity";
import {
  ActivityType,
  CollaboratorRole,
  InvitationStatus,
  ProjectStatus,
  Visibility,
} from "@prisma/client";

// GET /api/projects - List user's projects across all roles
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status") as ProjectStatus | null;
    const categoryParam = searchParams.get("category");
    const roleParam = searchParams.get("role") as CollaboratorRole | null;

    // Find all projects where user is owner or an accepted collaborator
    const projects = await prisma.project.findMany({
      where: {
        AND: [
          roleParam === "Owner"
            ? { creatorId: user.id }
            : roleParam
            ? {
                collaborators: {
                  some: {
                    userId: user.id,
                    role: roleParam,
                    acceptedAt: { not: null },
                  },
                },
              }
            : {
                OR: [
                  { creatorId: user.id },
                  {
                    collaborators: {
                      some: {
                        userId: user.id,
                        acceptedAt: { not: null },
                      },
                    },
                  },
                ],
              },
          statusParam ? { status: statusParam } : {},
          categoryParam ? { category: categoryParam } : {},
        ],
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        collaborators: {
          where: { acceptedAt: { not: null } },
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
        },
        projectTags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            assets: true,
            versions: true,
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Format output with the user's role on each project
    const formatted = projects.map((p) => {
      let role: CollaboratorRole = CollaboratorRole.Collaborator;
      if (p.creatorId === user.id) {
        role = CollaboratorRole.Owner;
      } else {
        const membership = p.collaborators.find((c) => c.userId === user.id && c.acceptedAt !== null);
        if (membership) role = membership.role;
      }

      return {
        ...p,
        userRole: role,
        tags: p.projectTags.map((pt) => pt.tag.name),
      };
    });

    return apiSuccess(formatted);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects - Create a new project with hybrid metadata
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    // Role Enforcement: Only Creators (and platform Admins) can create projects
    if (user.role !== "CREATOR" && !user.isAdmin) {
      return apiError("FORBIDDEN", "Only creators can create new projects", 403);
    }

    const body = await req.json();
    const validatedData = CreateProjectSchema.parse(body);

    // Validate category-specific metadata using appropriate schema
    if (validatedData.metadata && Object.keys(validatedData.metadata).length > 0) {
      const metaResult = validateCategoryMetadata(validatedData.category, validatedData.metadata);
      if (!metaResult.success) {
        return apiError(
          "VALIDATION_ERROR",
          `Invalid metadata for category ${validatedData.category}: ${metaResult.error.issues[0]?.message}`,
          422,
          metaResult.error.issues
        );
      }
    }

    // Execute in transaction: create project, assign tags, add creator to collaborators join table
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          creatorId: user.id,
          title: validatedData.title.trim(),
          description: validatedData.description?.trim() || null,
          category: validatedData.category.trim(),
          status: validatedData.status,
          visibility: validatedData.visibility,
          metadata: validatedData.metadata || {},
        },
      });

      // Add creator as Owner in ProjectCollaborator
      await tx.projectCollaborator.create({
        data: {
          projectId: newProject.id,
          userId: user.id,
          invitedById: user.id,
          role: CollaboratorRole.Owner,
          status: InvitationStatus.Accepted,
          acceptedAt: new Date(),
        },
      });

      // Record community activity ONLY if the project is created as Public
      if (newProject.visibility === Visibility.Public) {
        await recordCommunityActivity(tx, {
          actorId: user.id,
          type: ActivityType.ProjectPublished,
          projectId: newProject.id,
        });
      }

      // Handle tags if provided
      if (validatedData.tags && validatedData.tags.length > 0) {
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
              projectId: newProject.id,
              tagId: tag.id,
            },
          });
        }
      }

      return newProject;
    });

    // Return the full created project with relations
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        collaborators: true,
        projectTags: {
          include: { tag: true },
        },
      },
    });

    return apiSuccess(
      {
        ...fullProject,
        userRole: CollaboratorRole.Owner,
        tags: fullProject?.projectTags.map((pt) => pt.tag.name) || [],
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
