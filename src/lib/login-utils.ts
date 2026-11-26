import { LoginSchema } from "@/lib/validations/auth";

export type LoginFieldKey = "email" | "password";
export type LoginFieldErrors = Partial<Record<LoginFieldKey, string>>;

export interface LoginFormValues {
  email: string;
  password: string;
}

/**
 * Validates login inputs against the shared LoginSchema while providing
 * friendly empty-field prompts for interactive client UX.
 */
export function validateLoginValues(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmedEmail = values.email.trim().toLowerCase();

  const parsed = LoginSchema.safeParse({
    email: trimmedEmail,
    password: values.password,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const pathKey = issue.path[0];
      if (pathKey === "email" && !errors.email) {
        errors.email =
          trimmedEmail.length === 0
            ? "Please enter your email address."
            : issue.message;
      } else if (pathKey === "password" && !errors.password) {
        errors.password =
          values.password.length === 0
            ? "Please enter your password."
            : issue.message;
      }
    }
  }

  return errors;
}

function isAuthEntryPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register";
}

function isAdminPath(pathOrUrl: string): boolean {
  try {
    const parsed = new URL(pathOrUrl, "http://localhost");
    return parsed.pathname === "/admin" || parsed.pathname.startsWith("/admin/");
  } catch {
    return false;
  }
}

/**
 * Sanitizes a NextAuth callbackUrl so only relative app paths or exact
 * same-origin URLs are accepted (preventing open-redirect vulnerabilities).
 */
export function resolveSafeCallbackUrl(
  rawCallbackUrl: string | null | undefined,
  currentOrigin?: string
): string | null {
  if (!rawCallbackUrl || typeof rawCallbackUrl !== "string") {
    return null;
  }

  const trimmed = rawCallbackUrl.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    // Block protocol-relative URLs (//evil.com) and backslash variants (/\evil.com)
    if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
      return null;
    }

    try {
      const parsed = new URL(trimmed, "http://localhost");
      if (isAuthEntryPath(parsed.pathname)) {
        return null;
      }
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return null;
    }
  }

  if (currentOrigin) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.origin === currentOrigin) {
        if (isAuthEntryPath(parsed.pathname)) {
          return null;
        }
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Determines the safe post-login redirect target respecting USER / ADMIN
 * authorization boundaries and avoiding middleware bounce loops.
 */
export function resolvePostLoginDestination({
  rawCallbackUrl,
  currentOrigin,
  userRole,
}: {
  rawCallbackUrl: string | null | undefined;
  currentOrigin?: string;
  userRole?: string | null;
}): string {
  const safeCallback = resolveSafeCallbackUrl(rawCallbackUrl, currentOrigin);
  const isAdmin = userRole === "ADMIN";

  if (safeCallback) {
    if (isAdminPath(safeCallback) && !isAdmin) {
      return "/dashboard";
    }
    return safeCallback;
  }

  return isAdmin ? "/admin" : "/dashboard";
}

/**
 * Maps NextAuth error codes and server responses onto safe, user-friendly messages
 * without exposing database details, stack traces, or untrusted URL query strings.
 */
export function mapAuthErrorMessage(
  rawError: string | null | undefined,
  options?: { fromQueryParam?: boolean }
): string | null {
  if (!rawError || typeof rawError !== "string") {
    return null;
  }

  const trimmed = rawError.trim();
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();

  if (
    lower === "credentialssignin" ||
    lower.includes("invalid email or password") ||
    lower.includes("invalid credentials")
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (
    lower.includes("email and password are required") ||
    lower.includes("please provide a valid email") ||
    lower.includes("password is required")
  ) {
    return "Please enter a valid email address and password.";
  }

  if (lower.includes("verify your email") || lower === "email_not_verified") {
    return "Please verify your email address before signing in to your studio.";
  }

  if (lower.includes("suspended") || lower === "account_suspended") {
    return "This account has been suspended. Please contact support for assistance.";
  }

  if (lower.includes("no longer active") || lower === "account_unavailable") {
    return "This account is no longer active.";
  }

  if (lower === "sessionrequired") {
    return "Please sign in to access that page.";
  }

  if (lower === "accessdenied") {
    return "You do not have permission to sign in with these credentials.";
  }

  if (
    lower.includes("temporarily unavailable") ||
    lower.includes("try again shortly") ||
    lower === "configuration"
  ) {
    return "Sign-in is temporarily unavailable. Please try again in a moment.";
  }

  if (options?.fromQueryParam) {
    return "Unable to complete sign-in. Please check your credentials and try again.";
  }

  return "Unable to sign in right now. Please check your credentials or try again shortly.";
}
