import { z } from "zod";

export const RequestUploadUrlSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.coerce.number().positive("File size must be positive"),
});

export const ConfirmAssetUploadSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),
  versionId: z.string().uuid("Invalid version ID").optional().nullable(),
  fileName: z.string().min(1, "File name is required"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileSize: z.coerce.number().positive("File size must be positive"),
  storagePath: z.string().min(1, "Storage path is required"),
  uploadToken: z.string().min(1, "Upload ownership token is required").optional(),
  thumbnailPath: z.string().optional().nullable(),
});
