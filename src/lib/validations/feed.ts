import { z } from "zod";
import { AppError } from "@/lib/api-response";

export const FeedTabEnum = z.enum(["following", "discover"], {
  errorMap: () => ({ message: "Feed tab must be either 'following' or 'discover'" }),
});

export type FeedTab = z.infer<typeof FeedTabEnum>;

export const FeedQuerySchema = z.object({
  tab: FeedTabEnum.default("discover"),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(30, "Limit cannot exceed 30")
    .default(12),
  cursor: z.string().min(1).max(512).optional(),
  category: z.string().trim().max(64).optional(),
});

export const FollowListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit cannot exceed 50")
    .default(20),
  cursor: z.string().min(1).max(512).optional(),
});

const CursorPayloadSchema = z.object({
  createdAt: z.string().datetime({ message: "Invalid cursor timestamp" }),
  id: z.string().min(1, "Invalid cursor ID").max(128),
});

export interface DecodedKeysetCursor {
  createdAt: Date;
  id: string;
}

export function encodeKeysetCursor(payload: {
  createdAt: Date | string;
  id: string;
}): string {
  const iso =
    payload.createdAt instanceof Date
      ? payload.createdAt.toISOString()
      : new Date(payload.createdAt).toISOString();
  return Buffer.from(JSON.stringify({ createdAt: iso, id: payload.id }), "utf8").toString(
    "base64url"
  );
}

export function decodeKeysetCursor(rawCursor: string): DecodedKeysetCursor {
  try {
    // Reject non-base64url characters upfront
    if (!/^[A-Za-z0-9_-]+$/.test(rawCursor)) {
      throw new Error("Malformed cursor encoding");
    }
    const decodedStr = Buffer.from(rawCursor, "base64url").toString("utf8");
    const parsedJson = JSON.parse(decodedStr);
    const validated = CursorPayloadSchema.parse(parsedJson);
    const createdAt = new Date(validated.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor date");
    }
    return { createdAt, id: validated.id };
  } catch {
    throw new AppError("BAD_REQUEST", "Invalid or malformed pagination cursor", 400);
  }
}
