import * as React from "react";
import { createHmac, timingSafeEqual } from "crypto";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const reactCache: <T extends (...args: any[]) => any>(fn: T) => T =
  typeof (React as any).cache === "function"
    ? (React as any).cache
    : (fn) => fn;

export interface AuthenticatedSessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  isAdmin: boolean;
  avatarUrl: string | null;
  disciplines: string[];
}

export type AccountEligibilityResult =
  | { eligible: true }
  | {
      eligible: false;
      code:
        | "ACCOUNT_NOT_FOUND"
        | "ACCOUNT_UNAVAILABLE"
        | "ACCOUNT_SUSPENDED"
        | "EMAIL_NOT_VERIFIED";
      message: string;
    };

const DEV_FALLBACK_AUTH_SECRET = "creativespace-dev-fallback-secret-do-not-use-in-prod";

function getConfiguredAuthSecret(): string | undefined {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  return secret && secret.length > 0 ? secret : undefined;
}

export function getAuthSecret(): string {
  const secret = getConfiguredAuthSecret();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET must be configured in production");
    }
    return DEV_FALLBACK_AUTH_SECRET;
  }
  return secret;
}

/**
 * Computes a deterministic HMAC-SHA256 stamp over security-sensitive user fields.
 * Password changes, account anonymization, email changes, role/admin changes,
 * suspension/verification transitions, or tokenVersion bumps automatically invalidate
 * any previously issued JWT cookies.
 */
export function computeSessionSecurityStamp(dbUser: {
  id: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole | string;
  isAdmin: boolean;
  tokenVersion?: number | null;
  suspendedAt?: Date | string | null;
  isSuspended?: boolean | null;
  emailVerified?: Date | string | boolean | null;
}): string {
  const hasEmailVerifiedProp =
    Object.prototype.hasOwnProperty.call(dbUser, "emailVerified") &&
    dbUser.emailVerified !== undefined;

  const payload = [
    dbUser.id,
    dbUser.passwordHash ?? "",
    dbUser.email.toLowerCase().trim(),
    String(dbUser.role ?? ""),
    dbUser.isAdmin ? "1" : "0",
    dbUser.tokenVersion !== undefined && dbUser.tokenVersion !== null
      ? String(dbUser.tokenVersion)
      : "",
    dbUser.suspendedAt || dbUser.isSuspended ? "S1" : "S0",
    hasEmailVerifiedProp ? (dbUser.emailVerified ? "EV1" : "EV0") : "EV_SCHEMA_PENDING",
  ].join("|");

  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

function verifySessionSecurityStamp(
  tokenStamp: unknown,
  dbUser: Parameters<typeof computeSessionSecurityStamp>[0]
): boolean {
  if (typeof tokenStamp !== "string" || tokenStamp.length === 0) {
    return false;
  }
  const expected = computeSessionSecurityStamp(dbUser);
  const actualBuf = Buffer.from(tokenStamp, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Evaluates whether a database user record is eligible for authenticated access.
 * Checks existence, active credentials (blocks anonymized/deleted accounts),
 * suspension state, and email verification status when present on the record.
 */
export function validateAccountEligibility(
  dbUser: any,
  options?: { requireEmailVerifiedField?: boolean }
): AccountEligibilityResult {
  if (!dbUser || !dbUser.id || !dbUser.email) {
    return {
      eligible: false,
      code: "ACCOUNT_NOT_FOUND",
      message: "Account not found",
    };
  }

  if (
    !dbUser.passwordHash ||
    String(dbUser.email).toLowerCase().endsWith("@creativespace.deleted")
  ) {
    return {
      eligible: false,
      code: "ACCOUNT_UNAVAILABLE",
      message: "This account is no longer active",
    };
  }

  if (dbUser.suspendedAt || dbUser.isSuspended) {
    return {
      eligible: false,
      code: "ACCOUNT_SUSPENDED",
      message: "Your account has been suspended",
    };
  }

  const hasEmailVerifiedProp =
    Object.prototype.hasOwnProperty.call(dbUser, "emailVerified") &&
    dbUser.emailVerified !== undefined;

  if (hasEmailVerifiedProp) {
    if (!dbUser.emailVerified) {
      return {
        eligible: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email address before accessing protected features",
      };
    }
  } else if (options?.requireEmailVerifiedField) {
    return {
      eligible: false,
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your email address before accessing protected features",
    };
  }

  return { eligible: true };
}

function toSafeSessionUser(dbUser: any): AuthenticatedSessionUser {
  const disciplines = Array.isArray(dbUser.disciplines)
    ? (dbUser.disciplines as string[])
    : [];

  return {
    id: dbUser.id,
    email: dbUser.email,
    username: dbUser.username,
    displayName: dbUser.displayName,
    role: dbUser.role,
    isAdmin: Boolean(dbUser.isAdmin),
    avatarUrl: dbUser.avatarUrl ?? null,
    disciplines,
  };
}

const loadDbUserById = reactCache(async (userId: string) => {
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
  });
});

function markTokenInvalid(token: any) {
  token.sessionInvalid = true;
  delete token.id;
  delete token.email;
  delete token.username;
  delete token.displayName;
  delete token.avatarUrl;
  delete token.disciplines;
  delete token.securityStamp;
  token.isAdmin = false;
  token.role = undefined;
  return token;
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase().trim(),
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        const eligibility = validateAccountEligibility(user);
        if (!eligibility.eligible) {
          throw new Error(eligibility.message);
        }

        const safeUser = toSafeSessionUser(user);
        return {
          ...safeUser,
          securityStamp: computeSessionSecurityStamp(user),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in from verified authorize() output
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.displayName = user.displayName;
        token.role = user.role;
        token.isAdmin = Boolean(user.isAdmin);
        token.avatarUrl = user.avatarUrl ?? null;
        token.disciplines = Array.isArray(user.disciplines) ? user.disciplines : [];
        token.securityStamp = user.securityStamp;
        token.sessionInvalid = false;
        return token;
      }

      // Every subsequent token evaluation (including trigger === "update")
      // ignores client-supplied session payloads and re-validates live DB state.
      if (!token?.id || typeof token.id !== "string") {
        return markTokenInvalid(token);
      }

      const dbUser = await loadDbUserById(token.id);
      const eligibility = validateAccountEligibility(dbUser);
      if (!eligibility.eligible || !dbUser || !verifySessionSecurityStamp(token.securityStamp, dbUser)) {
        return markTokenInvalid(token);
      }

      const safeUser = toSafeSessionUser(dbUser);
      token.id = safeUser.id;
      token.email = safeUser.email;
      token.username = safeUser.username;
      token.displayName = safeUser.displayName;
      token.role = safeUser.role;
      token.isAdmin = safeUser.isAdmin;
      token.avatarUrl = safeUser.avatarUrl;
      token.disciplines = safeUser.disciplines;
      token.sessionInvalid = false;
      return token;
    },
    async session({ session, token }) {
      if (!token?.id || token.sessionInvalid || typeof token.securityStamp !== "string") {
        return {
          expires: new Date(0).toISOString(),
        } as any;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email as string) || session.user.email;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.role = token.role;
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.avatarUrl = (token.avatarUrl as string) || null;
        session.user.disciplines = (token.disciplines as string[]) || [];
      }
      return session;
    },
  },
  secret:
    process.env.NEXT_PHASE === "phase-production-build"
      ? getConfiguredAuthSecret()
      : getAuthSecret(),
};

/**
 * Resolves and validates a user session authoritatively against the database.
 */
export async function resolveVerifiedUserFromSession(
  session: { user?: { id?: string | null } } | null | undefined
): Promise<AuthenticatedSessionUser | null> {
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return null;
  }

  const dbUser = await loadDbUserById(userId);
  const eligibility = validateAccountEligibility(dbUser);
  if (!eligibility.eligible || !dbUser) {
    return null;
  }

  return toSafeSessionUser(dbUser);
}

/**
 * Server-side helper to fetch the current verified, active authenticated user
 * authoritatively from the database (deduplicated per request).
 */
export async function getCurrentUser(): Promise<AuthenticatedSessionUser | null> {
  const session = await getServerSession(authOptions);
  return resolveVerifiedUserFromSession(session);
}
