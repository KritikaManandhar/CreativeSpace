import { supabaseAdmin } from "@/lib/supabase";
import { AppError } from "@/lib/api-response";
import { buildSafeProjectStoragePath } from "@/lib/storage-path";

export interface GenerateUploadUrlResult {
  uploadUrl: string;
  storagePath: string;
  token?: string;
  expiresIn: number;
}

export interface StorageService {
  generateUploadUrl(
    projectId: string,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): Promise<GenerateUploadUrlResult>;

  getSignedDownloadUrl(storagePath: string, expiresIn?: number): Promise<string>;

  getPublicUrl(storagePath: string): string;

  deleteObject(storagePath: string): Promise<void>;
}

export const BUCKET_NAME = process.env.STORAGE_BUCKET_NAME || "creativespace-assets";
export const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || "50", 10);
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/tiff",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  // Video
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Documents & Design
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/x-zip-compressed",
  "application/json",
];

export class SupabaseStorageService implements StorageService {
  private bucket: string;

  constructor(bucket: string = BUCKET_NAME) {
    this.bucket = bucket;
  }

  private assertServerStorageConfigured(): void {
    if (typeof window !== "undefined") {
      throw new AppError(
        "STORAGE_CONFIG_ERROR",
        "Privileged storage operations are restricted to server-side execution",
        500
      );
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || /placeholder\.supabase\.co/i.test(url) || !serviceKey) {
      throw new AppError(
        "STORAGE_CONFIG_ERROR",
        "Server-side Supabase Storage credentials are not properly configured",
        500
      );
    }
  }

  async generateUploadUrl(
    projectId: string,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): Promise<GenerateUploadUrlResult> {
    // 1. Validate file size
    if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
      throw new AppError(
        "PAYLOAD_TOO_LARGE",
        `File size exceeds maximum allowed limit of ${MAX_UPLOAD_SIZE_MB}MB`,
        413
      );
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError(
        "UNSUPPORTED_MEDIA_TYPE",
        `File type "${mimeType}" is not supported. Please upload supported creative assets (images, audio, video, documents, archives).`,
        415
      );
    }

    // 3. Ensure server-side storage credentials are available before calling Supabase Storage
    this.assertServerStorageConfigured();

    // 4. Generate unguessable, sanitized, project-scoped storage path (prevents traversal & overwrite)
    const storagePath = buildSafeProjectStoragePath(projectId, fileName);

    // 5. Request signed upload URL with upsert: false to prevent overwriting existing objects
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data) {
      console.error("Supabase Storage Upload URL Error:", error?.message || error);
      throw new AppError(
        "STORAGE_ERROR",
        "Failed to generate signed upload URL",
        500
      );
    }

    return {
      uploadUrl: data.signedUrl,
      storagePath,
      token: data.token,
      expiresIn: 300, // 5 minutes
    };
  }

  async getSignedDownloadUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    this.assertServerStorageConfigured();
    const safeExpiresIn = Math.min(Math.max(Math.floor(expiresIn), 60), 3600);
    const { data, error } = await supabaseAdmin.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, safeExpiresIn);

    if (error || !data) {
      console.error("Supabase Storage Download URL Error:", error?.message || error);
      throw new AppError(
        "STORAGE_ERROR",
        "Failed to generate signed download URL",
        500
      );
    }

    return data.signedUrl;
  }

  getPublicUrl(_storagePath: string): string {
    throw new AppError(
      "STORAGE_POLICY_ERROR",
      "Permanent public object URLs are disabled for private bucket storage; use getSignedDownloadUrl after authorization",
      500
    );
  }

  async deleteObject(storagePath: string): Promise<void> {
    this.assertServerStorageConfigured();
    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      console.error("Supabase Storage Delete Error:", error?.message || error);
      throw new AppError("STORAGE_ERROR", "Failed to delete file from storage", 500);
    }
  }
}

export const storageService = new SupabaseStorageService();
