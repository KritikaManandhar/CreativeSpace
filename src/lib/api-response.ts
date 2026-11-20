import { NextResponse } from "next/server";
import { ZodError } from "zod";

export interface ApiResponseEnvelope<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
}

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponseEnvelope<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  );
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  details?: any
): NextResponse<ApiResponseEnvelope<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    },
    { status }
  );
}

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode = 400, details?: any) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown): NextResponse<ApiResponseEnvelope<null>> {
  console.error("API Error caught:", error);

  if (
    error instanceof AppError ||
    (error && typeof error === "object" && (error as any).name === "AppError")
  ) {
    const appErr = error as AppError;
    return apiError(
      appErr.code,
      appErr.message,
      appErr.statusCode || 400,
      appErr.details
    );
  }

  if (error instanceof ZodError) {
    const issues = error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    return apiError(
      "VALIDATION_ERROR",
      issues.length > 0 ? issues[0].message : "Invalid request data",
      422,
      issues
    );
  }

  // Handle unexpected internal errors without leaking raw storage paths, SQL, or signed URLs
  return apiError("INTERNAL_SERVER_ERROR", "An unexpected internal error occurred", 500);
}
