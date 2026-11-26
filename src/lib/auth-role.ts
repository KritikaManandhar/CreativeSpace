export type AuthoritativeUserRole = "USER" | "ADMIN";

/**
 * Normalizes any persisted or token role value into the unified USER | ADMIN model.
 * Administrative privileges are derived exclusively from role === "ADMIN".
 */
export function resolveAuthoritativeRole(role: unknown): AuthoritativeUserRole {
  return role === "ADMIN" ? "ADMIN" : "USER";
}

/**
 * Authoritative admin check based solely on role === "ADMIN".
 * Legacy compatibility flags such as `isAdmin` never independently grant admin access.
 */
export function isAuthoritativeAdmin(
  user: { role?: unknown } | null | undefined
): boolean {
  return user?.role === "ADMIN";
}

/**
 * Edge-safe authorization guard used by Next.js middleware.
 */
export function isMiddlewareTokenAuthorized(
  pathname: string,
  token: {
    id?: unknown;
    securityStamp?: unknown;
    sessionInvalid?: unknown;
    role?: unknown;
    isAdmin?: unknown;
  } | null | undefined
): boolean {
  if (
    !token?.id ||
    typeof token.securityStamp !== "string" ||
    token.securityStamp.length === 0 ||
    token.sessionInvalid
  ) {
    return false;
  }

  if (pathname.startsWith("/admin")) {
    return token.role === "ADMIN";
  }

  return true;
}
