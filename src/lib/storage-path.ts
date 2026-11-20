import { randomUUID } from "crypto";

const SAFE_PROJECT_ID_REGEX = /^[A-Za-z0-9_-]{1,128}$/;
const SAFE_STORAGE_FILENAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,254}$/;

export interface StoragePathValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Strictly validates that a Supabase Storage object key adheres to:
 *   projects/<projectId>/<filename>
 *
 * Rejects:
 * - cross-project prefixes or unexpected top-level namespaces,
 * - raw or percent-encoded path traversal (.., %2e, %2f, %5c, %00),
 * - backslashes, extra path segments, empty segments, leading dots,
 * - whitespace, control characters, and overly long paths.
 */
export function validateProjectStoragePath(
  projectId: string,
  storagePath: string
): StoragePathValidationResult {
  if (!projectId || !SAFE_PROJECT_ID_REGEX.test(projectId)) {
    return { valid: false, reason: "Invalid projectId for storage path validation" };
  }

  if (typeof storagePath !== "string" || storagePath.length === 0 || storagePath.length > 512) {
    return { valid: false, reason: "Storage path must be a non-empty string up to 512 characters" };
  }

  // Reject whitespace, control characters, backslashes, and any percent-encoding (blocks %2e, %2f, %5c, %00)
  if (/[\s\u0000-\u001F\u007F\\]/.test(storagePath)) {
    return { valid: false, reason: "Storage path contains disallowed whitespace, control characters, or backslashes" };
  }
  if (storagePath.includes("%")) {
    return { valid: false, reason: "Storage path must not contain percent-encoded sequences" };
  }

  const segments = storagePath.split("/");
  if (segments.length !== 3) {
    return { valid: false, reason: "Storage path must follow exact structure projects/<projectId>/<filename>" };
  }

  const [namespace, pathProjectId, fileName] = segments;
  if (namespace !== "projects") {
    return { valid: false, reason: "Storage path must be scoped under projects/" };
  }
  if (pathProjectId !== projectId) {
    return { valid: false, reason: "Storage path does not match the authorized project namespace" };
  }
  if (!fileName || fileName === "." || fileName === ".." || fileName.includes("..")) {
    return { valid: false, reason: "Storage path filename contains invalid traversal sequence" };
  }
  if (!SAFE_STORAGE_FILENAME_REGEX.test(fileName)) {
    return { valid: false, reason: "Storage path filename contains disallowed characters" };
  }

  return { valid: true };
}

/**
 * Generates an unguessable, collision-resistant, project-scoped storage path
 * guaranteed to satisfy validateProjectStoragePath(projectId, result).
 */
export function buildSafeProjectStoragePath(projectId: string, rawFileName: string): string {
  if (!projectId || !SAFE_PROJECT_ID_REGEX.test(projectId)) {
    throw new Error("Invalid projectId for storage path generation");
  }

  // Strip any directory separators first, then sanitize to safe filename characters
  const baseName = rawFileName.split(/[\\/]/).pop() || "file";
  let sanitizedName = baseName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .replace(/^[._-]+/, "")
    .slice(0, 180);

  if (!sanitizedName) {
    sanitizedName = "asset";
  }

  const uniqueSuffix = `${Date.now()}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const storagePath = `projects/${projectId}/${uniqueSuffix}_${sanitizedName}`;

  const check = validateProjectStoragePath(projectId, storagePath);
  if (!check.valid) {
    throw new Error(check.reason || "Generated storage path failed validation");
  }

  return storagePath;
}
