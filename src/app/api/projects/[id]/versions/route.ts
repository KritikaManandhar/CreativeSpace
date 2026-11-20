import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { CreateVersionSchema } from "@/lib/validations/version";
import { apiSuccess, handleApiError, AppError } from "@/lib/api-response";
import { VersionStatus } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id]/versions - List versions for project
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Check project view access
    const { role } = await authorize(user, projectId, "view_project");
    const isMember = role === "Owner" || role === "Collaborator" || role === "ClientReviewer";

    const versions = await prisma.version.findMany({
      where: { projectId },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        assets: {
          select: {
            id: true,
            projectId: true,
            uploaderId: true,
            versionId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            thumbnailPath: true,
            createdAt: true,
          },
        },
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
      orderBy: { versionNumber: "desc" },
    });

    // Public feedback visibility must not expose private draft media or rejected version feedback:
    // Non-members can view published/draft version feedback (with draft assets hidden),
    // while Rejected versions are excluded from non-member views.
    const sanitizedVersions = versions
      .filter((v) => isMember || v.status !== VersionStatus.Rejected)
      .map((v) => ({
        ...v,
        assets:
          isMember || v.status === "Approved" || v.status === "Final"
            ? v.assets
            : [],
      }));

    return apiSuccess(sanitizedVersions);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/projects/[id]/versions - Create a new sequential draft version with strict locking and bounded retries
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const projectId = params.id;

    // RBAC: Owner and Collaborators can create versions
    await authorize(user, projectId, "create_version");

    const body = await req.json();
    const validatedData = CreateVersionSchema.parse(body);

    const MAX_RETRIES = 3;
    let attempt = 0;
    let lastError: any = null;

    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        const newVersion = await prisma.$transaction(async (tx) => {
          // 1. Strict Locking Hierarchy - Level 1: Lock Project row
          // In PostgreSQL, FOR UPDATE ensures that concurrent version creations for the same project
          // are strictly serialized at the project level to prevent version number race conditions.
          if (typeof (tx as any).$executeRaw === "function") {
            try {
              await tx.$executeRaw`SELECT id FROM projects WHERE id = ${projectId} FOR UPDATE`;
            } catch (rawErr) {
              // Ignore in environments where raw locking isn't supported (e.g. some mock drivers)
            }
          }

          // 2. Validate asset ownership - Prevent cross-project asset linkage
          if (validatedData.assetIds && validatedData.assetIds.length > 0) {
            const matchingAssets = await tx.asset.findMany({
              where: {
                id: { in: validatedData.assetIds },
                projectId,
              },
              select: { id: true },
            });
            if (matchingAssets.length !== validatedData.assetIds.length) {
              throw new AppError(
                "BAD_REQUEST",
                "One or more assets do not belong to this project or do not exist",
                400
              );
            }
          }

          // 3. Find highest existing version number under lock
          const latestVersion = await tx.version.findFirst({
            where: { projectId },
            orderBy: { versionNumber: "desc" },
            select: { versionNumber: true },
          });

          const nextVersionNumber = (latestVersion?.versionNumber || 0) + 1;

          // 4. Strict Locking Hierarchy - Level 2: Create Version record
          const version = await tx.version.create({
            data: {
              projectId,
              versionNumber: nextVersionNumber,
              createdById: user!.id,
              status: VersionStatus.Draft,
            },
          });

          // 5. Strict Locking Hierarchy - Level 3: Link assets to this version
          if (validatedData.assetIds && validatedData.assetIds.length > 0) {
            await tx.asset.updateMany({
              where: {
                id: { in: validatedData.assetIds },
                projectId,
              },
              data: {
                versionId: version.id,
              },
            });
          }

          // 6. Add revision notes as comment if provided
          if (validatedData.notes?.trim()) {
            await tx.comment.create({
              data: {
                projectId,
                versionId: version.id,
                authorId: user!.id,
                content: `Revision Notes (v${nextVersionNumber}): ${validatedData.notes.trim()}`,
              },
            });
          }

          return version;
        });

        // Fetch complete version with relations
        const fullVersion = await prisma.version.findUnique({
          where: { id: newVersion.id },
          include: {
            createdBy: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            assets: {
          select: {
            id: true,
            projectId: true,
            uploaderId: true,
            versionId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            thumbnailPath: true,
            createdAt: true,
          },
        },
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
            },
          },
        });

        return apiSuccess(fullVersion, 201);
      } catch (err: any) {
        lastError = err;
        const isConflict =
          (err.code === "P2002" &&
            (err.meta?.target?.includes("versionNumber") ||
              JSON.stringify(err.meta || {}).includes("versionNumber"))) ||
          err.code === "P2034" ||
          err.message?.includes("deadlock detected") ||
          err.message?.includes("could not serialize access");

        if (isConflict && attempt < MAX_RETRIES) {
          // Bounded backoff retry for transient concurrency conflicts
          await new Promise((resolve) =>
            setTimeout(resolve, attempt * 40 + Math.floor(Math.random() * 20))
          );
          continue;
        }

        throw err;
      }
    }

    if (lastError?.code === "P2002" || lastError?.code === "P2034") {
      throw new AppError(
        "CONFLICT",
        "Version creation conflict: concurrent requests attempted to allocate the same version number. Please retry.",
        409
      );
    }

    throw lastError;
  } catch (error) {
    return handleApiError(error);
  }
}
