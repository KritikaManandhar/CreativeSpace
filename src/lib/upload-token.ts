import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { AppError } from "@/lib/api-response";

export interface UploadOwnershipClaims {
  intentId: string;
  uploaderId: string;
  projectId: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}

export interface ExpectedUploadOwnership {
  uploaderId: string;
  projectId: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}

export interface VerifiedUploadOwnershipResult {
  valid: boolean;
  intentId?: string;
  reason?: string;
}

const TOKEN_VERSION = 1;
const MIN_SECRET_LENGTH = 16;
export const DEFAULT_UPLOAD_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_UPLOAD_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes hard ceiling
const MAX_CLOCK_SKEW_MS = 60 * 1000; // 60 seconds

/**
 * Resolves the dedicated server-only upload signing secret.
 * Uses UPLOAD_TOKEN_SECRET (or NEXTAUTH_SECRET when dedicated secret is not split out).
 * NEVER uses a hardcoded secret, NEVER falls back to an ephemeral/insecure secret,
 * NEVER reuses SUPABASE_SERVICE_ROLE_KEY, and NEVER runs in browser context.
 */
function getSigningSecret(): string {
  if (typeof window !== "undefined") {
    throw new AppError(
      "STORAGE_CONFIG_ERROR",
      "Upload ownership token signing is restricted to server-side execution",
      500
    );
  }

  const rawSecret =
    process.env.UPLOAD_TOKEN_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim();

  if (!rawSecret || rawSecret.length < MIN_SECRET_LENGTH) {
    throw new AppError(
      "STORAGE_CONFIG_ERROR",
      "Server upload token signing secret is not configured",
      500
    );
  }

  // Domain-separated HKDF-like key derivation via HMAC so the upload token key is cryptographically
  // distinct even when derived from NEXTAUTH_SECRET
  return createHmac("sha256", rawSecret)
    .update("creativespace:upload-ownership-token:v1")
    .digest("hex");
}

/**
 * Deterministic canonical payload serialization (fixed tuple order).
 * Eliminates JSON object key-ordering ambiguity across runtimes.
 */
function serializeCanonicalPayload(fields: {
  intentId: string;
  uploaderId: string;
  projectId: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  iat: number;
  exp: number;
  nonce: string;
}): string {
  return JSON.stringify([
    TOKEN_VERSION,
    fields.intentId,
    fields.uploaderId,
    fields.projectId,
    fields.storagePath,
    fields.mimeType,
    fields.fileSize,
    fields.iat,
    fields.exp,
    fields.nonce,
  ]);
}

function signPayloadB64(payloadB64: string, key: string): string {
  return createHmac("sha256", key).update(payloadB64).digest("base64url");
}

/**
 * Mints a short-lived, deterministically serialized HMAC-SHA256 upload ownership token
 * tying an UploadIntent and server-generated storagePath to the authenticated uploader,
 * authorized project, MIME type, and file size.
 */
export function createUploadOwnershipToken(
  claims: UploadOwnershipClaims,
  ttlMs: number = DEFAULT_UPLOAD_TOKEN_TTL_MS
): string {
  const safeTtlMs = Math.min(ttlMs, MAX_UPLOAD_TOKEN_TTL_MS);
  const now = Date.now();
  const canonical = serializeCanonicalPayload({
    intentId: claims.intentId,
    uploaderId: claims.uploaderId,
    projectId: claims.projectId,
    storagePath: claims.storagePath,
    mimeType: claims.mimeType,
    fileSize: claims.fileSize,
    iat: now,
    exp: now + safeTtlMs,
    nonce: randomUUID(),
  });

  const payloadB64 = Buffer.from(canonical, "utf8").toString("base64url");
  const sig = signPayloadB64(payloadB64, getSigningSecret());
  return `${payloadB64}.${sig}`;
}

/**
 * Verifies an upload ownership token against the authenticated caller and registration payload.
 * Returns { valid: true, intentId } ONLY when HMAC signature, version, clock/expiry bounds,
 * uploaderId, projectId, storagePath, mimeType, and fileSize all match strictly.
 */
export function verifyUploadOwnershipToken(
  token: string | null | undefined,
  expected: ExpectedUploadOwnership
): VerifiedUploadOwnershipResult {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Missing upload ownership token" };
  }

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, reason: "Malformed upload ownership token" };
  }

  const [payloadB64, providedSig] = parts;
  const expectedSig = signPayloadB64(payloadB64, getSigningSecret());

  const providedBuf = Buffer.from(providedSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return { valid: false, reason: "Invalid upload ownership token signature" };
  }

  let tuple: unknown;
  try {
    tuple = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "Unreadable upload ownership token payload" };
  }

  if (!Array.isArray(tuple) || tuple.length !== 10) {
    return { valid: false, reason: "Invalid upload ownership token structure" };
  }

  const [
    version,
    intentId,
    uploaderId,
    projectId,
    storagePath,
    mimeType,
    fileSize,
    iat,
    exp,
    nonce,
  ] = tuple;

  if (
    version !== TOKEN_VERSION ||
    typeof intentId !== "string" ||
    intentId.length === 0 ||
    typeof uploaderId !== "string" ||
    typeof projectId !== "string" ||
    typeof storagePath !== "string" ||
    typeof mimeType !== "string" ||
    typeof fileSize !== "number" ||
    typeof iat !== "number" ||
    typeof exp !== "number" ||
    !Number.isFinite(iat) ||
    !Number.isFinite(exp) ||
    typeof nonce !== "string" ||
    nonce.length === 0
  ) {
    return { valid: false, reason: "Invalid upload ownership token fields" };
  }

  const now = Date.now();
  if (exp <= now) {
    return { valid: false, reason: "Upload ownership token has expired" };
  }
  if (iat > now + MAX_CLOCK_SKEW_MS || exp - iat > MAX_UPLOAD_TOKEN_TTL_MS) {
    return { valid: false, reason: "Upload ownership token lifetime is invalid" };
  }

  if (
    uploaderId !== expected.uploaderId ||
    projectId !== expected.projectId ||
    storagePath !== expected.storagePath ||
    mimeType !== expected.mimeType ||
    fileSize !== expected.fileSize
  ) {
    return {
      valid: false,
      reason: "Upload ownership token does not match caller, project, or upload metadata",
    };
  }

  return { valid: true, intentId };
}
