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
import { NextRequest } from "next/server";
import {
  CollaboratorRole,
  ProjectStatus,
  UserRole,
  Visibility,
} from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import * as authModule from "../src/lib/auth";
import { isMiddlewareTokenAuthorized } from "../src/lib/auth-role";
import { evaluateAdminPageAccess } from "../src/lib/page-auth";
import { authorize } from "../src/lib/rbac";
import { assertCanDeleteComment } from "../src/lib/discussion-access";
import { RegisterSchema } from "../src/lib/validations/auth";
import { POST as registerUser } from "../src/app/api/auth/register/route";
import { POST as createProject } from "../src/app/api/projects/route";
import { POST as addPortfolioProject } from "../src/app/api/portfolio/projects/route";
import { GET as getAdminStats } from "../src/app/api/admin/stats/route";
import { POST as createAdminCategory } from "../src/app/api/admin/categories/route";
import { GET as getAdminReports } from "../src/app/api/admin/reports/route";
import { PATCH as patchAdminReport } from "../src/app/api/admin/reports/[id]/route";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function makeReq(method: string, body?: any): NextRequest {
  const init: any = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new NextRequest("http://localhost:3000/api/test", init);
}

async function runSuite() {
  console.log("=========================================================================");
  console.log("CreativeSpace Unified USER + ADMIN Account Model Test Suite (Mocked DB)");
  console.log("=========================================================================\n");

  const origGetCurrentUser = authModule.getCurrentUser;
  const origTransaction = prisma.$transaction;
  const origUserFindUnique = prisma.user.findUnique;
  const origUserCount = prisma.user.count;
  const origProjectFindUnique = prisma.project.findUnique;
  const origProjectCount = prisma.project.count;
  const origPortfolioUpsert = prisma.portfolio.upsert;
  const origPortfolioProjectUpsert = prisma.portfolioProject.upsert;
  const origActivityFindUnique = prisma.activity.findUnique;
  const origActivityCreate = prisma.activity.create;
  const origCategoryUpsert = prisma.category.upsert;
  const origReportFindMany = prisma.report.findMany;
  const origReportFindUnique = prisma.report.findUnique;
  const origReportUpdate = prisma.report.update;
  const origReportCount = prisma.report.count;
  const origAssetCount = prisma.asset.count;
  const origAssetAggregate = prisma.asset.aggregate;
  const origVersionCount = prisma.version.count;
  const origCommentCount = prisma.comment.count;
  const origLikeCount = prisma.like.count;
  const origProjectGroupBy = prisma.project.groupBy;

  const mockUsers: Record<string, any> = {};
  const mockPortfolios: Record<string, any> = {};
  const mockProjects: Record<string, any> = {};
  const mockPortfolioProjects: any[] = [];
  const mockCollaborators: any[] = [];
  const mockActivities: any[] = [];
  const mockReports: Record<string, any> = {};
  let currentMockUser: any = null;
  let seq = 1;

  const resetMockDb = () => {
    Object.keys(mockUsers).forEach((k) => delete mockUsers[k]);
    Object.keys(mockPortfolios).forEach((k) => delete mockPortfolios[k]);
    Object.keys(mockProjects).forEach((k) => delete mockProjects[k]);
    Object.keys(mockReports).forEach((k) => delete mockReports[k]);
    mockPortfolioProjects.length = 0;
    mockCollaborators.length = 0;
    mockActivities.length = 0;
    seq = 1;

    mockUsers["regular-1"] = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "user@creativespace.test",
      username: "regular_user",
      displayName: "Regular User",
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Illustration"],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
      passwordHash: bcrypt.hashSync("Pass1234!", 4),
    };

    mockUsers["other-1"] = {
      id: "22222222-2222-4222-8222-222222222222",
      email: "other@creativespace.test",
      username: "other_user",
      displayName: "Other User",
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Photography"],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
      passwordHash: bcrypt.hashSync("Pass1234!", 4),
    };

    mockUsers["desynced-user"] = {
      id: "33333333-3333-4333-8333-333333333333",
      email: "desynced@creativespace.test",
      username: "desynced_user",
      displayName: "Desynced Flag User",
      role: UserRole.USER,
      // Intentionally desynced legacy compatibility flag: must NEVER grant admin access
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
      passwordHash: bcrypt.hashSync("Pass1234!", 4),
    };

    mockUsers["admin-1"] = {
      id: "99999999-9999-4999-8999-999999999999",
      email: "admin@creativespace.test",
      username: "platform_admin",
      displayName: "Platform Admin",
      role: UserRole.ADMIN,
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-26T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
      passwordHash: bcrypt.hashSync("Pass1234!", 4),
    };

    mockProjects["other-private"] = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      creatorId: mockUsers["other-1"].id,
      title: "Other User Private Work",
      description: "Private draft",
      category: "Photography",
      status: ProjectStatus.Completed,
      visibility: Visibility.Private,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProjects["other-public"] = {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      creatorId: mockUsers["other-1"].id,
      title: "Other User Public Work",
      description: "Public finished work",
      category: "Photography",
      status: ProjectStatus.Completed,
      visibility: Visibility.Public,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockReports["report-1"] = {
      id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      reporterId: mockUsers["regular-1"].id,
      targetType: "Project",
      targetId: mockProjects["other-public"].id,
      reason: "Test moderation report",
      status: "Open",
      createdAt: new Date(),
    };
  };

  // Wire Prisma & auth mocks
  (authModule as any).getCurrentUser = async () => currentMockUser;

  (prisma.user as any).findUnique = async ({ where }: any) => {
    const all = Object.values(mockUsers);
    if (where.id) return all.find((u) => u.id === where.id) ?? null;
    if (where.email) return all.find((u) => u.email === where.email) ?? null;
    if (where.username) return all.find((u) => u.username === where.username) ?? null;
    return null;
  };
  (prisma.user as any).count = async () => Object.keys(mockUsers).length;

  (prisma.project as any).findUnique = async ({ where }: any) => {
    const proj = Object.values(mockProjects).find((p) => p.id === where.id);
    if (!proj) return null;
    return {
      ...proj,
      creator: mockUsers[Object.keys(mockUsers).find((k) => mockUsers[k].id === proj.creatorId) || ""] || null,
      collaborators: mockCollaborators.filter((c) => c.projectId === proj.id),
      projectTags: [],
    };
  };
  (prisma.project as any).count = async () => Object.keys(mockProjects).length;
  (prisma.project as any).groupBy = async () => [];

  (prisma.portfolio as any).upsert = async ({ where, create }: any) => {
    const existing = Object.values(mockPortfolios).find((p) => p.userId === where.userId);
    if (existing) return existing;
    const p = { id: `portfolio-${seq++}`, ...create, createdAt: new Date(), updatedAt: new Date() };
    mockPortfolios[p.id] = p;
    return p;
  };

  (prisma.portfolioProject as any).upsert = async ({ where, create, update }: any) => {
    const existing = mockPortfolioProjects.find(
      (pp) =>
        pp.portfolioId === where.portfolioId_projectId.portfolioId &&
        pp.projectId === where.portfolioId_projectId.projectId
    );
    if (existing) {
      Object.assign(existing, update);
      return { ...existing, project: mockProjects[existing.projectId] };
    }
    const created = { id: `pp-${seq++}`, ...create };
    mockPortfolioProjects.push(created);
    return { ...created, project: mockProjects[created.projectId] };
  };

  (prisma.activity as any).findUnique = async ({ where }: any) =>
    mockActivities.find((a) => a.dedupKey === where.dedupKey) ?? null;
  (prisma.activity as any).create = async ({ data }: any) => {
    const a = { id: `act-${seq++}`, ...data, createdAt: new Date() };
    mockActivities.push(a);
    return a;
  };

  (prisma.category as any).upsert = async ({ create }: any) => ({
    id: `cat-${seq++}`,
    name: create.name,
  });
  (prisma.report as any).findMany = async () => Object.values(mockReports);
  (prisma.report as any).findUnique = async ({ where }: any) =>
    Object.values(mockReports).find((r) => r.id === where.id) ?? null;
  (prisma.report as any).update = async ({ where, data }: any) => {
    const key = Object.keys(mockReports).find((k) => mockReports[k].id === where.id);
    if (!key) return null;
    mockReports[key] = { ...mockReports[key], ...data };
    return mockReports[key];
  };
  (prisma.report as any).count = async () => Object.values(mockReports).length;
  (prisma.asset as any).count = async () => 0;
  (prisma.asset as any).aggregate = async () => ({ _sum: { fileSize: 0 } });
  (prisma.version as any).count = async () => 0;
  (prisma.comment as any).count = async () => 0;
  (prisma.like as any).count = async () => 0;

  (prisma as any).$transaction = async (fn: any) => {
    const tx = {
      user: {
        create: async ({ data }: any) => {
          const id = `00000000-0000-4000-8000-${String(seq++).padStart(12, "0")}`;
          const u = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockUsers[id] = u;
          return u;
        },
      },
      portfolio: {
        create: async ({ data }: any) => {
          const p = { id: `portfolio-${seq++}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockPortfolios[p.id] = p;
          return p;
        },
      },
      project: {
        create: async ({ data }: any) => {
          const id = `aaaaaaaa-aaaa-4aaa-8aaa-${String(seq++).padStart(12, "0")}`;
          const p = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
          mockProjects[id] = p;
          return p;
        },
      },
      projectCollaborator: {
        create: async ({ data }: any) => {
          const c = { id: `collab-${seq++}`, ...data };
          mockCollaborators.push(c);
          return c;
        },
      },
      tag: {
        upsert: async ({ create }: any) => ({ id: `tag-${seq++}`, name: create.name }),
      },
      projectTag: {
        create: async ({ data }: any) => data,
      },
      activity: prisma.activity,
    };
    return fn(tx);
  };

  let passed = 0;
  const total = 5;

  async function runTest(id: number, title: string, fn: () => Promise<void>) {
    resetMockDb();
    await fn();
    passed += 1;
    console.log(`✅ [Test ${id}] ${title}`);
  }

  try {
    await runTest(
      1,
      "RegisterSchema excludes role & POST /api/auth/register always assigns USER + isAdmin=false + initializes Portfolio",
      async () => {
        // 1. RegisterSchema shape must NOT expose a client-controlled role field
        assert(
          !("role" in RegisterSchema.shape),
          "RegisterSchema must NOT contain a client-supplied role field"
        );

        // 2. Standard registration without role creates USER + Portfolio
        const res1 = await registerUser(
          makeReq("POST", {
            email: "new.artist@creativespace.test",
            username: "new_artist",
            displayName: "New Artist",
            password: "Password123!",
          })
        );
        assert(res1.status === 201, `Expected 201 on registration, got ${res1.status}`);
        const body1 = await res1.json();
        assert(body1.data.user.role === UserRole.USER, "New user role must be USER");
        assert(body1.data.user.isAdmin === false, "New user isAdmin must be false");
        const createdPortfolio = Object.values(mockPortfolios).find(
          (p) => p.userId === body1.data.user.id
        );
        assert(
          Boolean(createdPortfolio && createdPortfolio.customSlug === "new_artist"),
          "Registration transaction must initialize Portfolio for every newly registered USER"
        );

        // 3. Privilege escalation attempts in body (role: ADMIN / CREATOR / VIEWER, isAdmin: true) are ignored
        const res2 = await registerUser(
          makeReq("POST", {
            email: "escalate.attempt@creativespace.test",
            username: "escalate_attempt",
            displayName: "Attempted Escalation",
            password: "Password123!",
            role: "ADMIN",
            isAdmin: true,
          })
        );
        assert(res2.status === 201, `Expected 201 when extra stripped fields sent, got ${res2.status}`);
        const body2 = await res2.json();
        assert(body2.data.user.role === UserRole.USER, "Attempted role=ADMIN must still result in USER");
        assert(body2.data.user.isAdmin === false, "Attempted isAdmin=true must still result in false");
      }
    );

    await runTest(
      2,
      "Ordinary USER accounts can create projects & showcase own Completed Public projects in portfolio (ownership-based)",
      async () => {
        currentMockUser = mockUsers["regular-1"];

        // Create own Completed Public project
        const projRes = await createProject(
          makeReq("POST", {
            title: "Cosmic Ink Study",
            description: "Original illustration series",
            category: "Illustration",
            status: ProjectStatus.Completed,
            visibility: Visibility.Public,
          })
        );
        assert(projRes.status === 201, `Expected 201 for USER project creation, got ${projRes.status}`);
        const projJson = await projRes.json();
        assert(projJson.data.userRole === CollaboratorRole.Owner, "Creator of project becomes Owner");

        // Showcase own project in portfolio
        const portRes = await addPortfolioProject(
          makeReq("POST", {
            projectId: projJson.data.id,
            featured: true,
            displayOrder: 1,
          })
        );
        assert(portRes.status === 201, `Expected 201 for USER portfolio showcase, got ${portRes.status}`);

        // Cannot showcase another user's public project
        const otherPortRes = await addPortfolioProject(
          makeReq("POST", {
            projectId: mockProjects["other-public"].id,
            featured: false,
            displayOrder: 2,
          })
        );
        assert(
          otherPortRes.status === 403,
          `USER must not showcase another owner's project (expected 403, got ${otherPortRes.status})`
        );
      }
    );

    await runTest(
      3,
      "Standard USER accounts cannot access admin pages, admin APIs, or RBAC admin overrides",
      async () => {
        currentMockUser = mockUsers["regular-1"];

        const pageAccess = await evaluateAdminPageAccess("/admin");
        assert(!pageAccess.allowed && pageAccess.status === 403, "USER denied /admin page");

        assert((await getAdminStats(makeReq("GET"))).status === 403, "USER denied /api/admin/stats");
        assert(
          (await createAdminCategory(makeReq("POST", { name: "Printmaking" }))).status === 403,
          "USER denied /api/admin/categories"
        );
        assert((await getAdminReports(makeReq("GET"))).status === 403, "USER denied /api/admin/reports");
        assert(
          (await patchAdminReport(makeReq("PATCH", { status: "Resolved" }), {
            params: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
          })).status === 403,
          "USER denied /api/admin/reports/[id]"
        );

        let rbacBlocked = false;
        try {
          await authorize(currentMockUser, mockProjects["other-private"].id, "view_project");
        } catch {
          rbacBlocked = true;
        }
        assert(rbacBlocked, "USER denied private project view");

        assert(
          !isMiddlewareTokenAuthorized("/admin", {
            id: mockUsers["regular-1"].id,
            role: "USER",
            isAdmin: false,
            securityStamp: "valid",
          }),
          "Middleware denies /admin to USER"
        );
      }
    );

    await runTest(
      4,
      "Authoritative role invariant: desynced isAdmin=true with role=USER CANNOT grant admin privileges anywhere",
      async () => {
        const desynced = mockUsers["desynced-user"];
        currentMockUser = desynced;

        // 1. Session & safe-user normalization strips desynced isAdmin flag
        const resolved = await authModule.resolveVerifiedUserFromSession({
          user: { id: desynced.id },
        });
        assert(resolved !== null, "Active USER resolves");
        assert(resolved!.role === UserRole.USER, "Resolved role remains USER");
        assert(resolved!.isAdmin === false, "isAdmin compatibility flag synchronized to false for USER");

        const sessionCallback = authModule.authOptions.callbacks!.session!;
        const forgedSession: any = await sessionCallback({
          session: { user: {} as any, expires: "" },
          token: {
            id: desynced.id,
            email: desynced.email,
            username: desynced.username,
            displayName: desynced.displayName,
            role: UserRole.USER,
            isAdmin: true,
            securityStamp: "valid",
          } as any,
        } as any);
        assert(forgedSession.user.isAdmin === false, "Session callback prevents isAdmin=true escalation for USER");

        // 2. Middleware denies /admin even if token.isAdmin === true while token.role === "USER"
        assert(
          !isMiddlewareTokenAuthorized("/admin", {
            id: desynced.id,
            role: "USER",
            isAdmin: true,
            securityStamp: "valid",
          }),
          "Middleware must reject /admin when role=USER despite isAdmin=true"
        );

        // 3. Page guard, Admin APIs, RBAC, and comment deletion reject desynced USER
        const pageAccess = await evaluateAdminPageAccess("/admin");
        assert(!pageAccess.allowed && pageAccess.status === 403, "Page guard rejects desynced USER");
        assert((await getAdminStats(makeReq("GET"))).status === 403, "Stats API rejects desynced USER");
        assert((await getAdminReports(makeReq("GET"))).status === 403, "Reports API rejects desynced USER");

        let rbacBlocked = false;
        try {
          await authorize(desynced, mockProjects["other-private"].id, "view_project");
        } catch {
          rbacBlocked = true;
        }
        assert(rbacBlocked, "RBAC private view override rejects desynced USER");

        let deleteBlocked = false;
        try {
          assertCanDeleteComment(desynced, mockUsers["other-1"].id);
        } catch {
          deleteBlocked = true;
        }
        assert(deleteBlocked, "Comment moderation delete rejects desynced USER");
      }
    );

    await runTest(
      5,
      "ADMIN accounts retain all authorized administrative access across middleware, guards, APIs, and RBAC",
      async () => {
        const admin = mockUsers["admin-1"];
        currentMockUser = admin;

        assert(
          isMiddlewareTokenAuthorized("/admin", {
            id: admin.id,
            role: "ADMIN",
            isAdmin: true,
            securityStamp: "valid",
          }),
          "Middleware permits ADMIN to /admin"
        );

        const pageAccess = await evaluateAdminPageAccess("/admin");
        assert(
          pageAccess.allowed && pageAccess.user.role === UserRole.ADMIN && pageAccess.user.isAdmin === true,
          "evaluateAdminPageAccess allows ADMIN"
        );

        assert((await getAdminStats(makeReq("GET"))).status === 200, "ADMIN accesses /api/admin/stats");
        assert(
          (await createAdminCategory(makeReq("POST", { name: "Sculpture" }))).status === 201,
          "ADMIN creates category"
        );
        assert((await getAdminReports(makeReq("GET"))).status === 200, "ADMIN lists moderation reports");
        assert(
          (await patchAdminReport(makeReq("PATCH", { status: "Resolved" }), {
            params: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
          })).status === 200,
          "ADMIN resolves moderation report"
        );

        const rbacView = await authorize(admin, mockProjects["other-private"].id, "view_project");
        assert(rbacView.authorized, "ADMIN retains private project moderation view access");

        assertCanDeleteComment(admin, mockUsers["other-1"].id);
      }
    );

    console.log(`\nUnified USER + ADMIN Model Summary: ${passed}/${total} PASSED`);
  } finally {
    (authModule as any).getCurrentUser = origGetCurrentUser;
    (prisma as any).$transaction = origTransaction;
    (prisma.user as any).findUnique = origUserFindUnique;
    (prisma.user as any).count = origUserCount;
    (prisma.project as any).findUnique = origProjectFindUnique;
    (prisma.project as any).count = origProjectCount;
    (prisma.project as any).groupBy = origProjectGroupBy;
    (prisma.portfolio as any).upsert = origPortfolioUpsert;
    (prisma.portfolioProject as any).upsert = origPortfolioProjectUpsert;
    (prisma.activity as any).findUnique = origActivityFindUnique;
    (prisma.activity as any).create = origActivityCreate;
    (prisma.category as any).upsert = origCategoryUpsert;
    (prisma.report as any).findMany = origReportFindMany;
    (prisma.report as any).findUnique = origReportFindUnique;
    (prisma.report as any).update = origReportUpdate;
    (prisma.report as any).count = origReportCount;
    (prisma.asset as any).count = origAssetCount;
    (prisma.asset as any).aggregate = origAssetAggregate;
    (prisma.version as any).count = origVersionCount;
    (prisma.comment as any).count = origCommentCount;
    (prisma.like as any).count = origLikeCount;
  }
}

runSuite().catch((err) => {
  console.error("❌ Suite failed:", err);
  process.exit(1);
});
