import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/rbac";
import { storageService } from "@/lib/storage";
import {
  createUploadOwnershipToken,
  DEFAULT_UPLOAD_TOKEN_TTL_MS,
} from "@/lib/upload-token";
import { RequestUploadUrlSchema } from "@/lib/validations/asset";
import { apiSuccess, apiError, handleApiError } from "@/lib/api-response";
import { UploadIntentStatus } from "@prisma/client";

// POST /api/assets/upload-url - Issue signed upload URL, UploadIntent record, and ownership token
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    const body = await req.json();
    const validatedData = RequestUploadUrlSchema.parse(body);

    // Strict RBAC: Derive authorized project directly from trusted database records
    const { project } = await authorize(user, validatedData.projectId, "upload_asset");

    // Generate project-scoped signed upload URL from Supabase Storage (upsert: false)
    const uploadDetails = await storageService.generateUploadUrl(
      project.id,
      validatedData.fileName,
      validatedData.mimeType,
      validatedData.fileSize
    );

    // Persist UploadIntent with unique storagePath and Pending lifecycle state
    // to coordinate atomic registration and race-free orphan cleanup fencing.
    const expiresAt = new Date(Date.now() + DEFAULT_UPLOAD_TOKEN_TTL_MS);
    const intent = await prisma.uploadIntent.create({
      data: {
        projectId: project.id,
        uploaderId: user.id,
        storagePath: uploadDetails.storagePath,
        mimeType: validatedData.mimeType,
        fileSize: validatedData.fileSize,
        status: UploadIntentStatus.Pending,
        expiresAt,
      },
      select: { id: true },
    });

    // Mint deterministic HMAC-SHA256 ownership token bound to UploadIntent + uploader + project + path + metadata
    const uploadToken = createUploadOwnershipToken({
      intentId: intent.id,
      uploaderId: user.id,
      projectId: project.id,
      storagePath: uploadDetails.storagePath,
      mimeType: validatedData.mimeType,
      fileSize: validatedData.fileSize,
    });

    const response = apiSuccess({
      ...uploadDetails,
      uploadToken,
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
