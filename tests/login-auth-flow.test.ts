// Register path alias for '@/...' imports in ts-node
import Module from "module";
import path from "path";

const originalResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (
  request: string,
  parent: any,
  isMain: boolean,
  options: any
) {
  if (request.startsWith("@/")) {
    const resolvedPath = path.join(__dirname, "../src", request.slice(2));
    return originalResolveFilename.call(this, resolvedPath, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import * as authModule from "../src/lib/auth";
import { isMiddlewareTokenAuthorized } from "../src/lib/auth-role";
import { evaluateAdminPageAccess, evaluateProtectedPageAccess } from "../src/lib/page-auth";
import {
  mapAuthErrorMessage,
  resolvePostLoginDestination,
  resolveSafeCallbackUrl,
  validateLoginValues,
} from "../src/lib/login-utils";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
}

async function runSuite() {
  console.log("=========================================================================");
  console.log("CreativeSpace Login Page Auth, Validation, Redirect & Security Suite");
  console.log("=========================================================================\n");

  const origFindUnique = prisma.user.findUnique;
  const origGetCurrentUser = authModule.getCurrentUser;
  const origConsoleError = console.error;

  const passwordPlain = "DreamerPass123!";
  const passwordHash = await bcrypt.hash(passwordPlain, 4);

  const mockUsers: Record<string, any> = {
    user: {
      id: "11111111-1111-4111-8111-111111111111",
      email: "user@creativespace.test",
      username: "studio_dreamer",
      displayName: "Studio Dreamer",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Illustration"],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    },
    admin: {
      id: "22222222-2222-4222-8222-222222222222",
      email: "admin@creativespace.test",
      username: "platform_admin",
      displayName: "Platform Admin",
      passwordHash,
      role: UserRole.ADMIN,
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    },
    desynced: {
      id: "33333333-3333-4333-8333-333333333333",
      email: "desynced@creativespace.test",
      username: "desynced_user",
      displayName: "Desynced User",
      passwordHash,
      role: UserRole.USER,
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    },
  };

  let simulateDbError = false;
  let dbLookupCount = 0;
  let currentMockUser: any = null;

  const credentialsProvider: any = authModule.authOptions.providers[0];
  const authorizeCreds = credentialsProvider.options.authorize;
  const jwtCallback = authModule.authOptions.callbacks!.jwt!;
  const sessionCallback = authModule.authOptions.callbacks!.session!;

  let passed = 0;
  const total = 6;

  async function runTest(id: number, title: string, fn: () => Promise<void> | void) {
    simulateDbError = false;
    dbLookupCount = 0;
    currentMockUser = null;
    await fn();
    passed += 1;
    console.log(`✅ [Login Test ${id}] ${title}`);
  }

  try {
    (prisma.user as any).findUnique = async (args: any) => {
      dbLookupCount += 1;
      if (simulateDbError) {
        throw new Error(
          "PrismaClientKnownRequestError: Value 'CREATOR' not found in enum 'UserRole' at supabase.pooler:6543"
        );
      }
      if (args?.where?.id) {
        return Object.values(mockUsers).find((u) => u.id === args.where.id) ?? null;
      }
      if (args?.where?.email) {
        const target = args.where.email.toLowerCase().trim();
        return Object.values(mockUsers).find((u) => u.email.toLowerCase() === target) ?? null;
      }
      return null;
    };

    (authModule as any).getCurrentUser = async () => {
      if (!currentMockUser) return null;
      return authModule.resolveVerifiedUserFromSession({
        user: { id: currentMockUser.id },
      });
    };

    await runTest(1, "Client validation delegates cleanly to LoginSchema rules", () => {
      const emptyErrors = validateLoginValues({ email: "", password: "" });
      assert(Boolean(emptyErrors.email), "Empty email must fail client validation");
      assert(Boolean(emptyErrors.password), "Empty password must fail client validation");

      const badEmailErrors = validateLoginValues({
        email: "not-an-email",
        password: "secret",
      });
      assert(
        badEmailErrors.email === "Please provide a valid email address",
        `Expected LoginSchema email message, got ${badEmailErrors.email}`
      );
      assert(!badEmailErrors.password, "Non-empty password must pass");

      const validErrors = validateLoginValues({
        email: "  USER@CreativeSpace.test ",
        password: passwordPlain,
      });
      assert(
        Object.keys(validErrors).length === 0,
        "Trimmed valid email and non-empty password must pass"
      );
    });

    await runTest(
      2,
      "Server authorize() validates LoginSchema before DB lookup and hides raw DB/Prisma errors",
      async () => {
        // Malformed email should fail validation before hitting Prisma
        let malformedMsg = "";
        try {
          await authorizeCreds({ email: "invalid-email", password: "abc" }, {} as any);
        } catch (err: any) {
          malformedMsg = err.message;
        }
        assert(
          malformedMsg === "Please provide a valid email address",
          `Unexpected malformed email error: ${malformedMsg}`
        );
        assert(dbLookupCount === 0, "Malformed email must fail before querying database");

        // Empty credentials should fail validation before hitting Prisma
        let missingMsg = "";
        try {
          await authorizeCreds({ email: "", password: "" }, {} as any);
        } catch (err: any) {
          missingMsg = err.message;
        }
        assert(missingMsg === "Email and password are required", "Empty creds message mismatch");
        assert(dbLookupCount === 0, "Empty credentials must fail before querying database");

        // Simulated Prisma/Supabase enum mismatch error must NOT leak internal details
        simulateDbError = true;
        console.error = () => {};
        let dbErrMsg = "";
        try {
          await authorizeCreds({ email: "user@creativespace.test", password: passwordPlain }, {} as any);
        } catch (err: any) {
          dbErrMsg = err.message;
        } finally {
          console.error = origConsoleError;
        }
        assert(
          !dbErrMsg.includes("Prisma") &&
            !dbErrMsg.includes("CREATOR") &&
            !dbErrMsg.includes("supabase") &&
            dbErrMsg.includes("temporarily unavailable"),
          `Raw DB details leaked in error: ${dbErrMsg}`
        );
      }
    );

    await runTest(
      3,
      "USER and ADMIN login flows create verified JWT + Session without leaking secrets or elevating desynced flags",
      async () => {
        // Standard USER login
        const authUser: any = await authorizeCreds(
          { email: "  USER@creativespace.test ", password: passwordPlain },
          {} as any
        );
        assert(authUser.role === UserRole.USER && authUser.isAdmin === false, "USER role check");
        assert(typeof authUser.securityStamp === "string", "USER gets securityStamp");

        const userToken: any = await jwtCallback({
          token: {} as any,
          user: authUser,
          account: null,
        } as any);
        const userSession: any = await sessionCallback({
          session: { user: {} as any, expires: "" },
          token: userToken,
        } as any);
        assert(
          userSession.user.role === UserRole.USER &&
            userSession.user.isAdmin === false &&
            !("securityStamp" in userSession.user),
          "USER session populated safely"
        );

        // ADMIN login
        const authAdmin: any = await authorizeCreds(
          { email: "admin@creativespace.test", password: passwordPlain },
          {} as any
        );
        assert(authAdmin.role === UserRole.ADMIN && authAdmin.isAdmin === true, "ADMIN role check");
        const adminToken: any = await jwtCallback({
          token: {} as any,
          user: authAdmin,
          account: null,
        } as any);
        const adminSession: any = await sessionCallback({
          session: { user: {} as any, expires: "" },
          token: adminToken,
        } as any);
        assert(
          adminSession.user.role === UserRole.ADMIN && adminSession.user.isAdmin === true,
          "ADMIN session retains admin privileges"
        );

        // Desynced isAdmin=true with role=USER must normalize to isAdmin=false
        const authDesynced: any = await authorizeCreds(
          { email: "desynced@creativespace.test", password: passwordPlain },
          {} as any
        );
        assert(
          authDesynced.role === UserRole.USER && authDesynced.isAdmin === false,
          "Desynced USER must normalize isAdmin=false on login"
        );
      }
    );

    await runTest(
      4,
      "Open-redirect protection and role-aware post-login redirect resolution",
      () => {
        const origin = "http://localhost:3000";

        // Unsafe targets rejected
        assert(resolveSafeCallbackUrl("https://evil.com/phish", origin) === null, "Reject external URL");
        assert(resolveSafeCallbackUrl("//evil.com", origin) === null, "Reject protocol-relative URL");
        assert(resolveSafeCallbackUrl("/\\evil.com", origin) === null, "Reject backslash URL");
        assert(resolveSafeCallbackUrl("javascript:alert(1)", origin) === null, "Reject javascript URI");
        assert(resolveSafeCallbackUrl("/login", origin) === null, "Reject /login loop");
        assert(resolveSafeCallbackUrl("/register", origin) === null, "Reject /register loop");

        // Safe relative & same-origin URLs accepted
        assert(
          resolveSafeCallbackUrl("/settings/profile?tab=privacy", origin) ===
            "/settings/profile?tab=privacy",
          "Preserve safe relative path"
        );
        assert(
          resolveSafeCallbackUrl("http://localhost:3000/projects/123/edit", origin) ===
            "/projects/123/edit",
          "Preserve same-origin full URL from NextAuth middleware"
        );

        // Post-login destination defaults & USER/ADMIN boundaries
        assert(
          resolvePostLoginDestination({ rawCallbackUrl: null, currentOrigin: origin, userRole: "USER" }) ===
            "/dashboard",
          "USER defaults to /dashboard"
        );
        assert(
          resolvePostLoginDestination({ rawCallbackUrl: null, currentOrigin: origin, userRole: "ADMIN" }) ===
            "/admin",
          "ADMIN defaults to /admin"
        );
        assert(
          resolvePostLoginDestination({
            rawCallbackUrl: "/admin",
            currentOrigin: origin,
            userRole: "USER",
          }) === "/dashboard",
          "USER bounced from /admin callbackUrl goes to /dashboard instead of looping"
        );
        assert(
          resolvePostLoginDestination({
            rawCallbackUrl: "http://localhost:3000/admin",
            currentOrigin: origin,
            userRole: "ADMIN",
          }) === "/admin",
          "ADMIN honors /admin callbackUrl"
        );
      }
    );

    await runTest(
      5,
      "Auth error mapper sanitizes NextAuth codes and blocks internal error / query reflection",
      () => {
        assert(
          mapAuthErrorMessage("CredentialsSignin")?.includes("Invalid email or password") === true,
          "CredentialsSignin mapped cleanly"
        );
        assert(
          mapAuthErrorMessage("SessionRequired")?.includes("Please sign in") === true,
          "SessionRequired mapped cleanly"
        );
        assert(
          mapAuthErrorMessage("Please verify your email address before accessing protected features")?.includes(
            "verify your email"
          ) === true,
          "Verification error mapped cleanly"
        );
        assert(
          mapAuthErrorMessage("Your account has been suspended")?.includes("suspended") === true,
          "Suspension error mapped cleanly"
        );

        const rawSql = "FATAL: password authentication failed for user postgres on aws-0.pooler.supabase.com";
        const mappedSql = mapAuthErrorMessage(rawSql);
        assert(
          Boolean(mappedSql) && !mappedSql!.includes("postgres") && !mappedSql!.includes("supabase"),
          "Raw DB error must not pass through mapAuthErrorMessage"
        );

        const spoofedQuery = "Your account was hacked! Call 1-800-FAKE";
        const mappedQuery = mapAuthErrorMessage(spoofedQuery, { fromQueryParam: true });
        assert(
          Boolean(mappedQuery) && !mappedQuery!.includes("hacked") && !mappedQuery!.includes("1-800"),
          "Untrusted URL ?error= text must never be reflected"
        );
      }
    );

    await runTest(
      6,
      "Middleware and page guards enforce login redirects and USER/ADMIN boundary",
      async () => {
        // Unauthenticated page access redirects to /login with callbackUrl
        currentMockUser = null;
        const dashGuard = await evaluateProtectedPageAccess("/dashboard");
        assert(
          !dashGuard.allowed && dashGuard.redirectTo === "/login?callbackUrl=%2Fdashboard",
          "Dashboard redirects unauthenticated user to /login"
        );
        const adminGuardUnauth = await evaluateAdminPageAccess("/admin");
        assert(
          !adminGuardUnauth.allowed && adminGuardUnauth.redirectTo === "/login?callbackUrl=%2Fadmin",
          "Admin redirects unauthenticated user to /login"
        );

        // Middleware route checks
        assert(!isMiddlewareTokenAuthorized("/dashboard", null), "Middleware blocks unauth /dashboard");
        assert(
          isMiddlewareTokenAuthorized("/dashboard", {
            id: mockUsers.user.id,
            role: "USER",
            securityStamp: "stamp",
          }),
          "Middleware permits USER on /dashboard"
        );
        assert(
          !isMiddlewareTokenAuthorized("/admin", {
            id: mockUsers.user.id,
            role: "USER",
            securityStamp: "stamp",
          }),
          "Middleware denies USER on /admin"
        );
        assert(
          isMiddlewareTokenAuthorized("/admin", {
            id: mockUsers.admin.id,
            role: "ADMIN",
            securityStamp: "stamp",
          }),
          "Middleware permits ADMIN on /admin"
        );

        // Authenticated USER vs ADMIN page guards
        currentMockUser = mockUsers.user;
        const userDash = await evaluateProtectedPageAccess("/dashboard");
        assert(userDash.allowed, "Authenticated USER accesses /dashboard");
        const userAdmin = await evaluateAdminPageAccess("/admin");
        assert(!userAdmin.allowed && userAdmin.status === 403, "Authenticated USER denied /admin");

        currentMockUser = mockUsers.admin;
        const adminOk = await evaluateAdminPageAccess("/admin");
        assert(adminOk.allowed && adminOk.user.role === UserRole.ADMIN, "Authenticated ADMIN accesses /admin");
      }
    );

    console.log(`\nLogin Auth Flow Summary: ${passed}/${total} PASSED`);
  } finally {
    (prisma.user as any).findUnique = origFindUnique;
    (authModule as any).getCurrentUser = origGetCurrentUser;
    console.error = origConsoleError;
  }
}

runSuite().catch((err) => {
  console.error("❌ Login auth flow test suite failed:", err);
  process.exit(1);
});
