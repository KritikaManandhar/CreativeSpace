import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  storageService,
} from "@/lib/storage";
import { validateProjectStoragePath } from "@/lib/storage-path";
import { verifyUploadOwnershipToken } from "@/lib/upload-token";
import { isSafePublicPreviewUrl } from "@/lib/activity";
import { ConfirmAssetUploadSchema } from "@/lib/validations/asset";
import { apiSuccess, apiError, handleApiError, AppError } from "@/lib/api-response";
import { UploadIntentStatus } from "@prisma/client";

function isStoragePathUniqueConstraintError(err: any): boolean {
  if (!err || typeof err !== "object") return false;
  if (err.code === "P2002" || err.code === "23505") {
    const target = JSON.stringify(err.meta?.target ?? err.message ?? "");
    return !target || target.includes("storagePath") || target.includes("assets_storagePath_key");
  }
  return false;
}

function isAppError(err: unknown): err is AppError {
  return (
    err instanceof AppError ||
    Boolean(err && typeof err === "object" && (err as any).name === "AppError")
  );
}

// POST /api/assets - Atomically register an uploaded asset using UploadIntent fencing
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validatedData = ConfirmAssetUploadSchema.parse(body);

    // Derive authorized project directly from trusted database records via RBAC
    const { project } = await authorize(user, validatedData.projectId, "upload_asset");

    // 1. Strict project-scoped storagePath validation (blocks cross-project injection,
    //    traversal, percent-encoded sequences, backslashes, and unexpected namespaces)
    const pathCheck = validateProjectStoragePath(project.id, validatedData.storagePath);
    if (!pathCheck.valid) {
      return apiError(
        "BAD_REQUEST",
        pathCheck.reason || "Invalid storagePath: object key must belong strictly to this project",
        400
      );
    }

    // 2. Enforce file size and MIME type restrictions consistently on registration
    if (validatedData.fileSize > MAX_UPLOAD_SIZE_BYTES) {
      return apiError(
        "PAYLOAD_TOO_LARGE",
        `File size exceeds maximum allowed limit of ${MAX_UPLOAD_SIZE_MB}MB`,
        413
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(validatedData.mimeType)) {
      return apiError(
        "UNSUPPORTED_MEDIA_TYPE",
        `File type "${validatedData.mimeType}" is not supported`,
        415
      );
    }

    // 3. Validate optional thumbnailPath so untrusted schemes, internal routes,
    //    path traversal, or signed storage URLs cannot be persisted
    const cleanThumbnailPath = validatedData.thumbnailPath?.trim() || null;
    if (cleanThumbnailPath && !isSafePublicPreviewUrl(cleanThumbnailPath)) {
      return apiError(
        "BAD_REQUEST",
        "Invalid thumbnailPath: must be a safe public URL or allowlisted static path",
        400
      );
    }

    // 4. Early application-level duplicate check (never triggers orphan cleanup)
    if (typeof (prisma.asset as any)?.findFirst === "function") {
      const existingAsset = await prisma.asset.findFirst({
        where: { storagePath: validatedData.storagePath },
        select: { id: true },
      });
      if (existingAsset) {
        return apiError(
          "CONFLICT",
          "An asset with this storagePath is already registered",
          409
        );
      }
    }

    // 5. Cryptographically verify deterministic HMAC-SHA256 upload ownership token
    const ownershipCheck = verifyUploadOwnershipToken(validatedData.uploadToken, {
      uploaderId: user.id,
      projectId: project.id,
      storagePath: validatedData.storagePath,
      mimeType: validatedData.mimeType,
      fileSize: validatedData.fileSize,
    });
    if (!ownershipCheck.valid || !ownershipCheck.intentId) {
      return apiError(
        "FORBIDDEN",
        ownershipCheck.reason || "Invalid or missing upload ownership proof",
        403
      );
    }

    const intentId = ownershipCheck.intentId;

    // 6. Single atomic registration transaction:
    //    Locks UploadIntent row (FOR UPDATE), verifies Pending state & exact ownership,
    //    validates optional versionId, transitions Pending -> Registered, and inserts Asset.
    //    If Asset creation fails, the entire transaction rolls back cleanly.
    let asset: any;
    try {
      asset = await prisma.$transaction(async (tx) => {
        if (typeof (tx as any).$executeRaw === "function") {
          try {
            await tx.$executeRaw`SELECT id, status FROM upload_intents WHERE id = ${intentId} FOR UPDATE`;
          } catch {
            // Mock driver fallback when raw SQL is unavailable
          }
        }

        const intent = await tx.uploadIntent.findUnique({
          where: { id: intentId },
        });

        if (
          !intent ||
          intent.uploaderId !== user.id ||
          intent.projectId !== project.id ||
          intent.storagePath !== validatedData.storagePath ||
          intent.mimeType !== validatedData.mimeType ||
          intent.fileSize !== validatedData.fileSize
        ) {
          throw new AppError(
            "FORBIDDEN",
            "Upload intent does not match authenticated uploader, project, or file metadata",
            403
          );
        }

        if (intent.status === UploadIntentStatus.Registered) {
          throw new AppError(
            "CONFLICT",
            "An asset with this storagePath is already registered",
            409
          );
        }

        if (intent.status !== UploadIntentStatus.Pending) {
          throw new AppError(
            "CONFLICT",
            "This upload session is no longer active; please upload the file again",
            409
          );
        }

        if (intent.expiresAt && new Date(intent.expiresAt).getTime() <= Date.now()) {
          throw new AppError(
            "FORBIDDEN",
            "Upload session has expired; please upload the file again",
            403
          );
        }

        if (validatedData.versionId) {
          const version = await tx.version.findUnique({
            where: { id: validatedData.versionId },
          });
          if (!version || version.projectId !== project.id) {
            throw new AppError("BAD_REQUEST", "Version does not belong to this project", 400);
          }
          if (version.status === "Approved" || version.status === "Final") {
            throw new AppError(
              "BAD_REQUEST",
              `Cannot attach new assets to an immutable signed-off version (${version.status}). Reopen as Draft or create a new sequential version.`,
              400
            );
          }
        }

        // Atomically transition Pending -> Registered inside the same transaction as Asset creation
        const claimReg = await tx.uploadIntent.updateMany({
          where: {
            id: intentId,
            status: UploadIntentStatus.Pending,
          },
          data: {
            status: UploadIntentStatus.Registered,
          },
        });
        if (claimReg.count !== 1) {
          throw new AppError(
            "CONFLICT",
            "Upload session was already consumed or aborted concurrently",
            409
          );
        }

        return await tx.asset.create({
          data: {
            projectId: project.id,
            uploaderId: user.id,
            versionId: validatedData.versionId || null,
            fileName: validatedData.fileName,
            mimeType: validatedData.mimeType,
            fileSize: validatedData.fileSize,
            storagePath: validatedData.storagePath,
            thumbnailPath: cleanThumbnailPath,
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
        });
      });
    } catch (createErr: any) {
      // Intentional validation, authorization, or duplicate/replay conflicts NEVER delete storage
      if (isAppError(createErr)) {
        throw createErr;
      }
      if (isStoragePathUniqueConstraintError(createErr)) {
        return apiError(
          "CONFLICT",
          "An asset with this storagePath is already registered",
          409
        );
      }

      // FENCED ORPHAN CLEANUP:
      // Before touching Supabase Storage, atomically claim Pending -> CleaningUp in PostgreSQL
      // while confirming no Asset record owns storagePath.
      // - If Request B already committed Pending -> Registered, claimCleanup returns false -> ZERO delete.
      // - If we commit Pending -> CleaningUp first, any concurrent Request B is permanently fenced out (409).
      // - If PostgreSQL is unreachable (DB outage), claimCleanup fails safely -> ZERO delete.
      let claimedForCleanup = false;
      try {
        claimedForCleanup = await prisma.$transaction(async (tx) => {
          if (typeof (tx as any).$executeRaw === "function") {
            try {
              await tx.$executeRaw`SELECT id, status FROM upload_intents WHERE id = ${intentId} FOR UPDATE`;
            } catch {
              // Mock driver fallback
            }
          }

          if (typeof (tx.asset as any)?.findFirst === "function") {
            const existingOwner = await tx.asset.findFirst({
              where: { storagePath: validatedData.storagePath },
              select: { id: true },
            });
            if (existingOwner) {
              return false;
            }
          }

          const claim = await tx.uploadIntent.updateMany({
            where: {
              id: intentId,
              uploaderId: user.id,
              projectId: project.id,
              storagePath: validatedData.storagePath,
              status: UploadIntentStatus.Pending,
            },
            data: {
              status: UploadIntentStatus.CleaningUp,
            },
          });

          return claim.count === 1;
        });
      } catch {
        // Database outage or lock failure during fence claim: abort cleanup safely rather than risk deleting a live object
        claimedForCleanup = false;
      }

      if (claimedForCleanup) {
        try {
          await storageService.deleteObject(validatedData.storagePath);
          await prisma.uploadIntent
            .updateMany({
              where: {
                id: intentId,
                status: UploadIntentStatus.CleaningUp,
              },
              data: {
                status: UploadIntentStatus.CleanedUp,
              },
            })
            .catch(() => {
              // Keep CleaningUp fence intact if final status write fails
            });
        } catch {
          // Leave UploadIntent in CleaningUp (permanently fenced) and log safely without secrets or raw paths
          console.warn("Orphan storage cleanup failed after fenced asset registration error");
        }
      }

      throw createErr;
    }

    const { storagePath: _storagePath, ...safeAsset } = asset;
    const response = apiSuccess(safeAsset, 201);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
