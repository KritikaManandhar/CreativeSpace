import { parseApiResponse } from "./api-client";

export interface AssetUploader {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  uploaderId?: string | null;
  versionId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  thumbnailPath?: string | null;
  downloadUrl?: string | null;
  createdAt: string;
  uploader?: AssetUploader | null;
}

export type AssetMediaType = "image" | "video" | "audio" | "document";

export interface UploadUrlResponse {
  uploadUrl: string;
  storagePath: string;
  uploadToken: string;
}

export function getAssetMediaType(asset: Pick<ProjectAsset, "mimeType" | "fileName">): AssetMediaType {
  const mime = (asset.mimeType || "").toLowerCase();
  const ext = asset.fileName?.split(".").pop()?.toLowerCase() || "";

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return "image";
  }
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return "video";
  }
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(ext)) {
    return "audio";
  }
  return "document";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const scaled = bytes / Math.pow(1024, index);
  return `${scaled >= 10 || index === 0 ? scaled.toFixed(0) : scaled.toFixed(1)} ${units[index]}`;
}

export function formatRelativeDate(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return "Just now";
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Security helper preserved from cf24322:
 * Collaborators creating a version may only attach unversioned assets they uploaded
 * themselves unless the caller is the Project Owner.
 */
export function filterEligibleVersionAssets(
  assets: ProjectAsset[],
  userRole: string | null | undefined,
  currentUserId: string | null | undefined
): ProjectAsset[] {
  return assets.filter((asset) => {
    if (asset.versionId) return false;
    if (userRole === "Owner") return true;
    const ownerId = asset.uploaderId ?? asset.uploader?.id ?? null;
    return Boolean(currentUserId && ownerId === currentUserId);
  });
}

/**
 * Executes CreativeSpace's 3-step signed upload flow with UploadIntent fencing:
 * 1) POST /api/assets/upload-url -> signed URL, storagePath, HMAC uploadToken
 * 2) PUT uploadUrl -> binary file upload to private object storage
 * 3) POST /api/assets -> atomic asset registration
 */
export async function uploadProjectAsset(
  projectId: string,
  file: File
): Promise<ProjectAsset> {
  const mimeType = file.type || "application/octet-stream";

  const intentRes = await fetch("/api/assets/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      fileName: file.name,
      mimeType,
      fileSize: file.size,
    }),
  });
  const intent = await parseApiResponse<UploadUrlResponse>(
    intentRes,
    "Failed to prepare asset upload"
  );

  const uploadRes = await fetch(intent.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error(`Storage upload failed (HTTP ${uploadRes.status})`);
  }

  const confirmRes = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      fileName: file.name,
      mimeType,
      fileSize: file.size,
      storagePath: intent.storagePath,
      uploadToken: intent.uploadToken,
    }),
  });

  return parseApiResponse<ProjectAsset>(confirmRes, "Failed to register uploaded asset");
}

export async function deleteProjectAsset(assetId: string): Promise<{ deleted: boolean }> {
  const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`, {
    method: "DELETE",
  });
  return parseApiResponse<{ deleted: boolean }>(res, "Failed to delete asset");
}
