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
import { prisma } from "../src/lib/prisma";
import * as authModule from "../src/lib/auth";
import { authorize } from "../src/lib/rbac";
import {
  evaluateProtectedPageAccess,
  evaluateAdminPageAccess,
  evaluateProjectEditPageAccess,
} from "../src/lib/page-auth";
import { POST as createVersion } from "../src/app/api/projects/[id]/versions/route";
import { PATCH as patchProject } from "../src/app/api/projects/[id]/route";
import { GET as getAdminStats } from "../src/app/api/admin/stats/route";
import { POST as createAdminCategory } from "../src/app/api/admin/categories/route";
import {
  CollaboratorRole,
  InvitationStatus,
  ProjectStatus,
  UserRole,
  VersionStatus,
  Visibility,
} from "@prisma/client";

interface TestResult {
  id: number;
  scenario: string;
  passed: boolean;
  message: string;
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(msg);
  }
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
  console.log("CreativeSpace Security Hardening Test Suite (Auth, Guards & Asset Ownership)");
  console.log("=========================================================================\n");

  const origFindUser = prisma.user.findUnique;
  const origFindProj = prisma.project.findUnique;
  const origGetCurrentUser = authModule.getCurrentUser;

  const passwordPlain = "StrongPass123!";
  const passwordHash = await bcrypt.hash(passwordPlain, 4);

  const mockUsers: Record<string, any> = {};
  const mockProjects: Record<string, any> = {};
  let mockCollaborators: any[] = [];
  let mockVersions: any[] = [];
  let mockAssets: any[] = [];
  let currentMockSessionUser: any = null;

  function resetData() {
    Object.keys(mockUsers).forEach((k) => delete mockUsers[k]);
    Object.keys(mockProjects).forEach((k) => delete mockProjects[k]);

    mockUsers["owner-1"] = {
      id: "11111111-1111-4111-8111-111111111111",
      email: "owner@creativespace.test",
      username: "owner_creator",
      displayName: "Owner Creator",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Illustration"],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["collab-a"] = {
      id: "22222222-2222-4222-8222-222222222222",
      email: "collaba@creativespace.test",
      username: "collab_a",
      displayName: "Collab A",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Music"],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["collab-b"] = {
      id: "33333333-3333-4333-8333-333333333333",
      email: "collabb@creativespace.test",
      username: "collab_b",
      displayName: "Collab B",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Animation"],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["reviewer-1"] = {
      id: "44444444-4444-4444-8444-444444444444",
      email: "reviewer@creativespace.test",
      username: "client_reviewer",
      displayName: "Legacy Reviewer",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Client Reviewer"],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["outsider-1"] = {
      id: "55555555-5555-4555-8555-555555555555",
      email: "outsider@creativespace.test",
      username: "outsider_user",
      displayName: "Outsider",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["unverified-1"] = {
      id: "66666666-6666-4666-8666-666666666666",
      email: "unverified@creativespace.test",
      username: "unverified_user",
      displayName: "Unverified User",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: [],
      emailVerified: null,
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["suspended-1"] = {
      id: "77777777-7777-4777-8777-777777777777",
      email: "suspended@creativespace.test",
      username: "suspended_user",
      displayName: "Suspended User",
      passwordHash,
      role: UserRole.ADMIN,
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: new Date("2026-11-24T00:00:00Z"),
      tokenVersion: 1,
    };
    mockUsers["admin-1"] = {
      id: "88888888-8888-4888-8888-888888888888",
      email: "admin@creativespace.test",
      username: "admin_user",
      displayName: "Platform Admin",
      passwordHash,
      role: UserRole.ADMIN,
      isAdmin: true,
      avatarUrl: null,
      disciplines: [],
      emailVerified: new Date("2026-11-20T00:00:00Z"),
      suspendedAt: null,
      tokenVersion: 1,
    };
    mockUsers["legacy-schema-1"] = {
      id: "99999999-9999-4999-8999-999999999999",
      email: "legacy.schema@creativespace.test",
      username: "legacy_schema_user",
      displayName: "Pre-Migration Schema User",
      passwordHash,
      role: UserRole.USER,
      isAdmin: false,
      avatarUrl: null,
      disciplines: ["Photography"],
    };

    const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const otherProjId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    mockProjects[projId] = {
      id: projId,
      creatorId: mockUsers["owner-1"].id,
      title: "Private Collaboration Studio",
      category: "Illustration",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Private,
      metadata: {},
    };
    mockProjects[otherProjId] = {
      id: otherProjId,
      creatorId: mockUsers["outsider-1"].id,
      title: "Other Creator Project",
      category: "Music",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Private,
      metadata: {},
    };

    mockCollaborators = [
      {
        id: "col-a",
        projectId: projId,
        userId: mockUsers["collab-a"].id,
        role: CollaboratorRole.Collaborator,
        status: InvitationStatus.Accepted,
        acceptedAt: new Date("2026-11-21T00:00:00Z"),
      },
      {
        id: "col-b",
        projectId: projId,
        userId: mockUsers["collab-b"].id,
        role: CollaboratorRole.Collaborator,
        status: InvitationStatus.Accepted,
        acceptedAt: new Date("2026-11-21T00:00:00Z"),
      },
      {
        id: "col-rev",
        projectId: projId,
        userId: mockUsers["reviewer-1"].id,
        role: CollaboratorRole.ClientReviewer,
        status: InvitationStatus.Accepted,
        acceptedAt: new Date("2026-11-21T00:00:00Z"),
      },
    ];

    const existingVersionId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
    mockVersions = [
      {
        id: existingVersionId,
        projectId: projId,
        versionNumber: 1,
        createdById: mockUsers["owner-1"].id,
        status: VersionStatus.Draft,
        createdAt: new Date("2026-11-22T00:00:00Z"),
      },
    ];

    mockAssets = [
      {
        id: "10000000-0000-4000-8000-000000000001",
        projectId: projId,
        uploaderId: mockUsers["owner-1"].id,
        versionId: null,
        fileName: "owner_unlinked.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: `projects/${projId}/owner_unlinked.png`,
        thumbnailPath: null,
        createdAt: new Date(),
      },
      {
        id: "10000000-0000-4000-8000-000000000002",
        projectId: projId,
        uploaderId: mockUsers["collab-a"].id,
        versionId: null,
        fileName: "collaba_unlinked.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: `projects/${projId}/collaba_unlinked.png`,
        thumbnailPath: null,
        createdAt: new Date(),
      },
      {
        id: "10000000-0000-4000-8000-000000000003",
        projectId: projId,
        uploaderId: mockUsers["collab-b"].id,
        versionId: null,
        fileName: "collabb_unlinked.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: `projects/${projId}/collabb_unlinked.png`,
        thumbnailPath: null,
        createdAt: new Date(),
      },
      {
        id: "10000000-0000-4000-8000-000000000004",
        projectId: projId,
        uploaderId: mockUsers["collab-b"].id,
        versionId: existingVersionId,
        fileName: "collabb_already_linked.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: `projects/${projId}/collabb_already_linked.png`,
        thumbnailPath: null,
        createdAt: new Date(),
      },
      {
        id: "10000000-0000-4000-8000-000000000005",
        projectId: otherProjId,
        uploaderId: mockUsers["outsider-1"].id,
        versionId: null,
        fileName: "other_project.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: `projects/${otherProjId}/other_project.png`,
        thumbnailPath: null,
        createdAt: new Date(),
      },
    ];
  }

  function installPrismaMocks() {
    (prisma.user as any).findUnique = async (args: any) => {
      if (args?.where?.id) {
        return Object.values(mockUsers).find((u) => u.id === args.where.id) ?? null;
      }
      if (args?.where?.email) {
        const target = args.where.email.toLowerCase().trim();
        return Object.values(mockUsers).find((u) => u.email.toLowerCase() === target) ?? null;
      }
      return null;
    };
    (prisma.user as any).count = async () => Object.keys(mockUsers).length;

    (prisma.project as any).findUnique = async (args: any) => {
      const p = mockProjects[args?.where?.id];
      if (!p) return null;
      const out: any = { ...p };
      if (args?.include?.collaborators) {
        const w = args.include.collaborators.where;
        out.collaborators = mockCollaborators.filter((c) => {
          if (c.projectId !== p.id) return false;
          if (w?.userId && c.userId !== w.userId) return false;
          if (w?.acceptedAt?.not === null && c.acceptedAt === null) return false;
          return true;
        });
      }
      return out;
    };
    (prisma.project as any).count = async () => Object.keys(mockProjects).length;
    (prisma.project as any).groupBy = async () => [];

    (prisma.asset as any).count = async () => mockAssets.length;
    (prisma.asset as any).aggregate = async () => ({ _sum: { fileSize: 5120 } });
    (prisma.asset as any).findMany = async (args: any) => {
      return mockAssets.filter((a) => {
        if (args?.where?.projectId && a.projectId !== args.where.projectId) return false;
        if (args?.where?.id?.in && !args.where.id.in.includes(a.id)) return false;
        return true;
      });
    };
    (prisma.asset as any).updateMany = async (args: any) => {
      let count = 0;
      for (const a of mockAssets) {
        if (args?.where?.projectId && a.projectId !== args.where.projectId) continue;
        if (args?.where?.id?.in && !args.where.id.in.includes(a.id)) continue;
        if (args?.where?.versionId === null && a.versionId !== null) continue;
        if (args?.where?.uploaderId && a.uploaderId !== args.where.uploaderId) continue;
        Object.assign(a, args.data);
        count++;
      }
      return { count };
    };

    (prisma.version as any).count = async () => mockVersions.length;
    (prisma.version as any).findFirst = async (args: any) => {
      const list = mockVersions
        .filter((v) => !args?.where?.projectId || v.projectId === args.where.projectId)
        .sort((a, b) => b.versionNumber - a.versionNumber);
      return list[0] || null;
    };
    (prisma.version as any).findUnique = async (args: any) => {
      const v = mockVersions.find((x) => x.id === args?.where?.id);
      if (!v) return null;
      return {
        ...v,
        createdBy: mockUsers["owner-1"],
        assets: mockAssets.filter((a) => a.versionId === v.id),
        comments: [],
      };
    };
    (prisma.version as any).create = async (args: any) => {
      const created = {
        id: `ver-${mockVersions.length + 1}-${Date.now()}`,
        createdAt: new Date(),
        ...args.data,
      };
      mockVersions.push(created);
      return created;
    };

    (prisma.comment as any).count = async () => 0;
    (prisma.like as any).count = async () => 0;
    (prisma.report as any).count = async () => 0;
    (prisma.category as any).upsert = async (args: any) => ({
      id: "cat-1",
      name: args.create.name,
      createdAt: new Date(),
    });

    (prisma as any).$transaction = async (fn: any) => {
      const tx = {
        $executeRaw: async () => 1,
        asset: prisma.asset,
        version: prisma.version,
        comment: { create: async (args: any) => args.data },
        project: prisma.project,
        projectTag: { deleteMany: async () => ({ count: 0 }), create: async () => ({}) },
        tag: { upsert: async (a: any) => ({ id: "tag-1", name: a.create.name }) },
        activity: { upsert: async () => ({}) },
      };
      return fn(tx);
    };
  }

  const results: TestResult[] = [];
  async function runTest(id: number, scenario: string, fn: () => Promise<void>) {
    resetData();
    try {
      await fn();
      results.push({ id, scenario, passed: true, message: "PASS" });
      console.log(`✅ [Security Test ${id}] ${scenario}`);
    } catch (err: any) {
      results.push({ id, scenario, passed: false, message: err?.message || String(err) });
      console.error(`❌ [Security Test ${id}] ${scenario} -> ${err?.message || err}`);
    }
  }

  try {
    installPrismaMocks();
    (authModule as any).getCurrentUser = async () => {
      if (!currentMockSessionUser) return null;
      return authModule.resolveVerifiedUserFromSession({
        user: { id: currentMockSessionUser.id },
      });
    };

    const credentialsProvider: any = authModule.authOptions.providers[0];
    const authorizeCreds = credentialsProvider.options.authorize;
    const jwtCallback = authModule.authOptions.callbacks!.jwt!;
    const sessionCallback = authModule.authOptions.callbacks!.session!;

    await runTest(1, "Unauthenticated access rejected across routes, page guards, and session resolver", async () => {
      currentMockSessionUser = null;
      const resolvedNull = await authModule.resolveVerifiedUserFromSession(null);
      assert(resolvedNull === null, "Expected null from resolveVerifiedUserFromSession(null)");

      const dashAccess = await evaluateProtectedPageAccess("/dashboard");
      assert(!dashAccess.allowed && dashAccess.status === 401 && dashAccess.redirectTo === "/login?callbackUrl=%2Fdashboard", "Dashboard page guard must require auth");

      const profileAccess = await evaluateProtectedPageAccess("/settings/profile");
      assert(!profileAccess.allowed && profileAccess.status === 401, "Settings profile guard must require auth");

      const adminAccess = await evaluateAdminPageAccess("/admin");
      assert(!adminAccess.allowed && adminAccess.status === 401, "Admin page guard must require auth");

      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const editAccess = await evaluateProjectEditPageAccess(projId);
      assert(!editAccess.allowed && editAccess.status === 401, "Project edit page guard must require auth");

      const verRes = await createVersion(makeReq("POST", { notes: "Anon" }), { params: { id: projId } });
      assert(verRes.status === 401, `Expected 401 on unauthenticated POST version, got ${verRes.status}`);

      const adminStatsRes = await getAdminStats(makeReq("GET"));
      assert(adminStatsRes.status === 403, `Expected 403 on unauthenticated admin stats, got ${adminStatsRes.status}`);
    });

    await runTest(2, "Unverified user blocked at Credentials sign-in, JWT re-check, DB session resolution, and RBAC", async () => {
      const unverified = mockUsers["unverified-1"];
      let blockedLogin = false;
      try {
        await authorizeCreds({ email: unverified.email, password: passwordPlain }, {} as any);
      } catch (e: any) {
        blockedLogin = String(e.message).toLowerCase().includes("verify");
      }
      assert(blockedLogin, "Unverified user must fail authorize() with verification error after password match");

      // Wrong password must NOT leak verification state
      let wrongPwGeneric = false;
      try {
        await authorizeCreds({ email: unverified.email, password: "WrongPassword!" }, {} as any);
      } catch (e: any) {
        wrongPwGeneric = e.message === "Invalid email or password";
      }
      assert(wrongPwGeneric, "Wrong password on unverified user must still return generic Invalid email or password");

      // Simulate existing session cookie where user becomes unverified
      const validUser = mockUsers["owner-1"];
      const initialStamp = authModule.computeSessionSecurityStamp(validUser);
      validUser.emailVerified = null;

      const updatedToken: any = await jwtCallback({
        token: {
          id: validUser.id,
          email: validUser.email,
          username: validUser.username,
          displayName: validUser.displayName,
          role: validUser.role,
          isAdmin: false,
          securityStamp: initialStamp,
        } as any,
        account: null,
        trigger: undefined,
      } as any);
      assert(updatedToken.sessionInvalid === true && !updatedToken.id, "Unverified user JWT must be invalidated");

      const resultingSession: any = await sessionCallback({
        session: { user: { id: validUser.id } as any, expires: "" },
        token: updatedToken,
      } as any);
      assert(!resultingSession?.user, "Invalidated session must strip user object");

      currentMockSessionUser = unverified;
      const resolved = await authModule.getCurrentUser();
      assert(resolved === null, "getCurrentUser() must return null for unverified user");

      let rbacBlocked = false;
      try {
        await authorize(unverified, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "create_comment");
      } catch (e: any) {
        rbacBlocked = e.statusCode === 401;
      }
      assert(rbacBlocked, "RBAC authorize must reject unverified user mutations");
    });

    await runTest(3, "Suspended user blocked at Credentials sign-in, session resolution, admin bypass, and RBAC", async () => {
      const suspended = mockUsers["suspended-1"];
      let blockedLogin = false;
      try {
        await authorizeCreds({ email: suspended.email, password: passwordPlain }, {} as any);
      } catch (e: any) {
        blockedLogin = String(e.message).toLowerCase().includes("suspended");
      }
      assert(blockedLogin, "Suspended user must fail authorize()");

      const resolved = await authModule.resolveVerifiedUserFromSession({
        user: { id: suspended.id },
      });
      assert(resolved === null, "Suspended user (even with isAdmin=true) must return null from resolveVerifiedUserFromSession");

      // Suspended admin cannot view private projects via isAdmin override or access admin page
      currentMockSessionUser = suspended;
      const adminPageRes = await evaluateAdminPageAccess("/admin");
      assert(!adminPageRes.allowed && adminPageRes.status === 401, "Suspended admin must be rejected from admin page");

      let privateViewBlocked = false;
      try {
        await authorize(suspended, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "view_project");
      } catch (e: any) {
        privateViewBlocked = e.statusCode === 403;
      }
      assert(privateViewBlocked, "Suspended admin must NOT bypass private project access");
    });

    await runTest(4, "Unauthorized project editing blocked for Collaborator, ClientReviewer, and outsider on page guard and PATCH API", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

      for (const key of ["collab-a", "reviewer-1", "outsider-1"]) {
        currentMockSessionUser = mockUsers[key];
        const pageAccess = await evaluateProjectEditPageAccess(projId);
        assert(!pageAccess.allowed && pageAccess.status === 403, `Expected 403 edit page access for ${key}, got ${JSON.stringify(pageAccess)}`);

        const patchRes = await patchProject(makeReq("PATCH", { title: "Tampered" }), {
          params: { id: projId },
        });
        assert(patchRes.status === 403, `Expected 403 PATCH /projects/[id] for ${key}, got ${patchRes.status}`);
      }

      // Owner allowed on edit page
      currentMockSessionUser = mockUsers["owner-1"];
      const ownerAccess = await evaluateProjectEditPageAccess(projId);
      assert(ownerAccess.allowed, "Owner must be allowed to open project edit page");
    });

    await runTest(5, "Unauthorized admin access blocked on page guard and admin API routes", async () => {
      currentMockSessionUser = mockUsers["owner-1"];
      const pageRes = await evaluateAdminPageAccess("/admin");
      assert(!pageRes.allowed && pageRes.status === 403, "Non-admin user must receive 403 from evaluateAdminPageAccess");

      const statsRes = await getAdminStats(makeReq("GET"));
      assert(statsRes.status === 403, `Non-admin /api/admin/stats must return 403, got ${statsRes.status}`);

      const catRes = await createAdminCategory(makeReq("POST", { name: "Sculpture" }));
      assert(catRes.status === 403, `Non-admin POST /api/admin/categories must return 403, got ${catRes.status}`);

      // Legacy compatibility flag isAdmin=true with role=USER must NOT independently grant admin access
      currentMockSessionUser = { ...mockUsers["owner-1"], role: UserRole.USER, isAdmin: true };
      const desyncedPageRes = await evaluateAdminPageAccess("/admin");
      assert(!desyncedPageRes.allowed && desyncedPageRes.status === 403, "USER with isAdmin=true must still receive 403 from evaluateAdminPageAccess");
      const desyncedStatsRes = await getAdminStats(makeReq("GET"));
      assert(desyncedStatsRes.status === 403, `USER with isAdmin=true /api/admin/stats must return 403, got ${desyncedStatsRes.status}`);

      // Legitimate verified active admin succeeds
      currentMockSessionUser = mockUsers["admin-1"];
      const adminPageOk = await evaluateAdminPageAccess("/admin");
      assert(adminPageOk.allowed && adminPageOk.user.role === UserRole.ADMIN && adminPageOk.user.isAdmin, "Active verified admin must access /admin");
      const adminStatsOk = await getAdminStats(makeReq("GET"));
      assert(adminStatsOk.status === 200, `Verified admin stats must return 200, got ${adminStatsOk.status}`);
    });

    await runTest(6, "Forged client session updates ignored; pre-hardening cookies and password/security changes invalidate JWTs", async () => {
      const owner = mockUsers["owner-1"];
      const signedIn: any = await authorizeCreds({ email: owner.email, password: passwordPlain }, {} as any);
      assert(typeof signedIn.securityStamp === "string" && signedIn.securityStamp.length > 0, "authorize() must attach securityStamp");

      const initialToken: any = await jwtCallback({
        token: {} as any,
        user: signedIn,
        account: null,
      } as any);

      // 1. Forged client trigger === "update" attempt trying to escalate isAdmin / id / displayName
      const afterSpoofedUpdate: any = await jwtCallback({
        token: { ...initialToken },
        trigger: "update",
        session: {
          user: {
            id: mockUsers["admin-1"].id,
            isAdmin: true,
            role: UserRole.ADMIN,
            displayName: "Forged Admin",
          },
        } as any,
      } as any);
      assert(afterSpoofedUpdate.id === owner.id, "Client update must never change token.id");
      assert(afterSpoofedUpdate.isAdmin === false, "Client update must never escalate isAdmin");
      assert(afterSpoofedUpdate.displayName === owner.displayName, "Client update must use DB displayName, not spoofed value");

      // 2. Pre-hardening cookie missing securityStamp is rejected
      const legacyTokenRes: any = await jwtCallback({
        token: { id: owner.id, email: owner.email, isAdmin: false } as any,
      } as any);
      assert(legacyTokenRes.sessionInvalid === true, "Pre-hardening JWT without securityStamp must be invalidated");

      const legacySession: any = await sessionCallback({
        session: { user: { id: owner.id } as any, expires: "" },
        token: legacyTokenRes,
      } as any);
      assert(!legacySession?.user, "Session callback must omit user on invalidated token");

      // 3. Password change immediately invalidates existing JWT via securityStamp change
      owner.passwordHash = await bcrypt.hash("NewSecretPass456!", 4);
      const afterPasswordChangeToken: any = await jwtCallback({
        token: { ...initialToken },
      } as any);
      assert(
        afterPasswordChangeToken.sessionInvalid === true,
        "Changing passwordHash must invalidate existing JWT sessions immediately"
      );

      // 4. Anonymized / deleted account (passwordHash = null) rejected
      mockUsers["collab-a"].passwordHash = null;
      assert(
        (await authModule.resolveVerifiedUserFromSession({ user: { id: mockUsers["collab-a"].id } })) === null,
        "Anonymized/passwordless account must be rejected by resolveVerifiedUserFromSession"
      );

      // 5. Auth secret configuration consistency & fail-closed production check
      assert(
        typeof authModule.authOptions.secret === "string" &&
          authModule.authOptions.secret === authModule.getAuthSecret(),
        "authOptions.secret and getAuthSecret() must match outside build phase"
      );
      const savedNodeEnv = process.env.NODE_ENV;
      const savedNextAuthSecret = process.env.NEXTAUTH_SECRET;
      try {
        (process.env as any).NODE_ENV = "production";
        delete process.env.NEXTAUTH_SECRET;
        let threwInProd = false;
        try {
          authModule.getAuthSecret();
        } catch {
          threwInProd = true;
        }
        assert(threwInProd, "getAuthSecret() must throw in production when NEXTAUTH_SECRET is missing");
      } finally {
        if (savedNodeEnv === undefined) {
          delete (process.env as any).NODE_ENV;
        } else {
          (process.env as any).NODE_ENV = savedNodeEnv;
        }
        if (savedNextAuthSecret === undefined) {
          delete process.env.NEXTAUTH_SECRET;
        } else {
          process.env.NEXTAUTH_SECRET = savedNextAuthSecret;
        }
      }
    });

    await runTest(7, "Invalid asset re-linking blocked (cross-project 400 and already-versioned asset 409)", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      currentMockSessionUser = mockUsers["owner-1"];

      // Cross-project asset -> 400
      const crossRes = await createVersion(
        makeReq("POST", {
          notes: "Cross project hijack",
          assetIds: ["10000000-0000-4000-8000-000000000005"],
        }),
        { params: { id: projId } }
      );
      assert(crossRes.status === 400, `Expected 400 on cross-project assetIds, got ${crossRes.status}`);

      // Already linked to v1 -> 409 even for Owner
      const relinkOwnerRes = await createVersion(
        makeReq("POST", {
          notes: "Re-link existing version asset",
          assetIds: ["10000000-0000-4000-8000-000000000004"],
        }),
        { params: { id: projId } }
      );
      assert(relinkOwnerRes.status === 409, `Expected 409 when Owner tries re-linking already versioned asset, got ${relinkOwnerRes.status}`);

      // Already linked attempted by uploader Collaborator B -> 409
      currentMockSessionUser = mockUsers["collab-b"];
      const relinkCollabRes = await createVersion(
        makeReq("POST", {
          notes: "Collab re-link own versioned asset",
          assetIds: ["10000000-0000-4000-8000-000000000004"],
        }),
        { params: { id: projId } }
      );
      assert(relinkCollabRes.status === 409, `Expected 409 when Collaborator re-links already versioned asset, got ${relinkCollabRes.status}`);

      const preservedAsset = mockAssets.find((a) => a.id === "10000000-0000-4000-8000-000000000004");
      assert(preservedAsset.versionId === "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Original versionId on existing asset must remain unchanged");
    });

    await runTest(8, "Attempted cross-user unlinked asset attachment by Collaborator rejected (403)", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      currentMockSessionUser = mockUsers["collab-b"];

      // Collaborator B tries to attach Collaborator A's unlinked asset
      const peerAttachRes = await createVersion(
        makeReq("POST", {
          notes: "Attach Collab A asset without permission",
          assetIds: ["10000000-0000-4000-8000-000000000002"],
        }),
        { params: { id: projId } }
      );
      assert(peerAttachRes.status === 403, `Expected 403 when Collaborator B attaches Collaborator A asset, got ${peerAttachRes.status}`);

      // Collaborator B tries to attach Owner's unlinked asset
      const ownerAssetAttachRes = await createVersion(
        makeReq("POST", {
          notes: "Attach Owner asset without permission",
          assetIds: ["10000000-0000-4000-8000-000000000001"],
        }),
        { params: { id: projId } }
      );
      assert(ownerAssetAttachRes.status === 403, `Expected 403 when Collaborator B attaches Owner asset, got ${ownerAssetAttachRes.status}`);

      assert(mockVersions.length === 1, "Failed cross-user version creation must not persist a new version");
    });

    await runTest(9, "Valid Owner and Collaborator version + asset attachment operations succeed", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

      // Collaborator B attaches own unlinked asset -> 201
      currentMockSessionUser = mockUsers["collab-b"];
      const collabOkRes = await createVersion(
        makeReq("POST", {
          notes: "Collab B attaches own unlinked asset",
          assetIds: ["10000000-0000-4000-8000-000000000003"],
        }),
        { params: { id: projId } }
      );
      assert(collabOkRes.status === 201, `Expected 201 for Collaborator own asset, got ${collabOkRes.status}`);
      const collabVer = (await collabOkRes.json()).data;
      const collabAsset = mockAssets.find((a) => a.id === "10000000-0000-4000-8000-000000000003");
      assert(collabAsset.versionId === collabVer.id, "Collaborator's own asset must link to created version");

      // Owner attaches Owner's unlinked asset -> 201
      currentMockSessionUser = mockUsers["owner-1"];
      const ownerOkRes = await createVersion(
        makeReq("POST", {
          notes: "Owner attaches own unlinked asset",
          assetIds: ["10000000-0000-4000-8000-000000000001"],
        }),
        { params: { id: projId } }
      );
      assert(ownerOkRes.status === 201, `Expected 201 for Owner unlinked asset, got ${ownerOkRes.status}`);
      const ownerVer = (await ownerOkRes.json()).data;
      const ownerAsset = mockAssets.find((a) => a.id === "10000000-0000-4000-8000-000000000001");
      assert(ownerAsset.versionId === ownerVer.id, "Owner asset must link to created version");
    });

    await runTest(10, "Legacy ClientReviewer retains view/comment access without upload, version, or edit escalation", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const reviewer = mockUsers["reviewer-1"];
      currentMockSessionUser = reviewer;

      // View & comment preserved
      const viewAuth = await authorize(reviewer, projId, "view_project");
      assert(viewAuth.authorized && viewAuth.role === CollaboratorRole.ClientReviewer, "ClientReviewer must keep view_project access");
      const commentAuth = await authorize(reviewer, projId, "create_comment");
      assert(commentAuth.authorized, "ClientReviewer must keep create_comment access");

      // Edit, upload, create_version, delete_asset strictly denied
      const editGuard = await evaluateProjectEditPageAccess(projId);
      assert(!editGuard.allowed && editGuard.status === 403, "ClientReviewer must not access project edit page");

      const verRes = await createVersion(makeReq("POST", { notes: "Reviewer attempt" }), {
        params: { id: projId },
      });
      assert(verRes.status === 403, `Expected 403 for ClientReviewer create_version, got ${verRes.status}`);

      let uploadDenied = false;
      try {
        await authorize(reviewer, projId, "upload_asset");
      } catch (e: any) {
        uploadDenied = e.statusCode === 403;
      }
      assert(uploadDenied, "ClientReviewer must be denied upload_asset");
    });

    await runTest(11, "Pre-migration DB user without emailVerified, suspendedAt, or tokenVersion logs in and passes session checks safely", async () => {
      const legacyUser = mockUsers["legacy-schema-1"];
      assert(
        !Object.prototype.hasOwnProperty.call(legacyUser, "emailVerified") &&
          !Object.prototype.hasOwnProperty.call(legacyUser, "suspendedAt") &&
          !Object.prototype.hasOwnProperty.call(legacyUser, "tokenVersion"),
        "Fixture must match current Prisma User schema without un-migrated columns"
      );

      // Default eligibility check permits existing pre-migration users; strict opt-in rejects absent field
      const defaultEligibility = authModule.validateAccountEligibility(legacyUser);
      assert(defaultEligibility.eligible === true, "Pre-migration user must pass default validateAccountEligibility");

      const strictEligibility = authModule.validateAccountEligibility(legacyUser, {
        requireEmailVerifiedField: true,
      });
      assert(
        !strictEligibility.eligible && strictEligibility.code === "EMAIL_NOT_VERIFIED",
        "Strict requireEmailVerifiedField option must reject missing emailVerified field"
      );

      // Sign-in, JWT issuance + re-evaluation, session resolution, and protected page guard succeed
      const signedIn: any = await authorizeCreds(
        { email: legacyUser.email, password: passwordPlain },
        {} as any
      );
      assert(
        typeof signedIn.securityStamp === "string" && signedIn.securityStamp.length > 0,
        "Pre-migration user authorize() must produce a valid securityStamp"
      );

      const initialToken: any = await jwtCallback({
        token: {} as any,
        user: signedIn,
        account: null,
      } as any);
      assert(initialToken.sessionInvalid === false && initialToken.id === legacyUser.id, "Initial JWT must be valid");

      const revalidatedToken: any = await jwtCallback({
        token: { ...initialToken },
        trigger: undefined,
      } as any);
      assert(
        revalidatedToken.sessionInvalid === false && revalidatedToken.id === legacyUser.id,
        "Subsequent JWT re-validation must remain valid for pre-migration DB user"
      );

      const sessionResult: any = await sessionCallback({
        session: { user: {} as any, expires: "" },
        token: revalidatedToken,
      } as any);
      assert(
        sessionResult?.user?.id === legacyUser.id && !("securityStamp" in sessionResult.user),
        "Session callback must populate user without exposing securityStamp"
      );

      currentMockSessionUser = legacyUser;
      const verifiedUser = await authModule.getCurrentUser();
      assert(verifiedUser?.id === legacyUser.id, "getCurrentUser() must resolve pre-migration DB user");

      const dashAccess = await evaluateProtectedPageAccess("/dashboard");
      assert(dashAccess.allowed && dashAccess.user.id === legacyUser.id, "Pre-migration user must pass protected page access");

      // Password change still invalidates existing sessions cleanly via securityStamp
      legacyUser.passwordHash = await bcrypt.hash("UpdatedPass789!", 4);
      const invalidatedAfterPwChange: any = await jwtCallback({
        token: { ...initialToken },
      } as any);
      assert(
        invalidatedAfterPwChange.sessionInvalid === true && !invalidatedAfterPwChange.id,
        "Password change must still invalidate pre-migration user's existing JWT"
      );
    });

    await runTest(12, "Owner can attach another Collaborator's eligible unlinked asset to a new version", async () => {
      const projId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
      const collabAssetId = "10000000-0000-4000-8000-000000000002"; // Uploaded by collab-a, versionId: null
      currentMockSessionUser = mockUsers["owner-1"];

      const res = await createVersion(
        makeReq("POST", {
          notes: "Owner packages Collaborator A unlinked asset into new version",
          assetIds: [collabAssetId],
        }),
        { params: { id: projId } }
      );
      assert(res.status === 201, `Expected 201 when Owner attaches Collaborator's unlinked asset, got ${res.status}`);

      const payload = await res.json();
      const createdVer = payload.data;
      const linkedAsset = mockAssets.find((a) => a.id === collabAssetId);
      assert(linkedAsset.versionId === createdVer.id, "Collaborator's unlinked asset must link to the new version");
      assert(linkedAsset.uploaderId === mockUsers["collab-a"].id, "Original collaborator uploaderId attribution must remain intact");
      assert(
        Array.isArray(createdVer.assets) && createdVer.assets.some((a: any) => a.id === collabAssetId),
        "Returned version payload must include the newly attached collaborator asset"
      );

      // Once linked, that asset must no longer be re-linkable to a subsequent version
      const relinkRes = await createVersion(
        makeReq("POST", {
          notes: "Attempt re-linking already attached collaborator asset",
          assetIds: [collabAssetId],
        }),
        { params: { id: projId } }
      );
      assert(relinkRes.status === 409, `Expected 409 on re-attaching newly linked asset, got ${relinkRes.status}`);
    });

    const passed = results.filter((r) => r.passed).length;
    console.log(`\nSecurity Hardening Summary: ${passed}/${results.length} PASSED`);
    if (passed !== results.length) {
      process.exitCode = 1;
    }
  } finally {
    (prisma.user as any).findUnique = origFindUser;
    (prisma.project as any).findUnique = origFindProj;
    (authModule as any).getCurrentUser = origGetCurrentUser;
  }
}

runSuite().catch((err) => {
  console.error("Security hardening test suite crashed:", err);
  process.exit(1);
});
