// Register path alias for '@/...' imports in ts-node
import Module from "module";
import path from "path";
import { randomUUID } from "crypto";

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

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import * as authModule from "../src/lib/auth";
import { storageService, SupabaseStorageService } from "../src/lib/storage";
import {
  buildSafeProjectStoragePath,
  validateProjectStoragePath,
} from "../src/lib/storage-path";
import {
  createUploadOwnershipToken,
  verifyUploadOwnershipToken,
} from "../src/lib/upload-token";

if (!process.env.UPLOAD_TOKEN_SECRET) {
  process.env.UPLOAD_TOKEN_SECRET = "test-only-upload-token-secret-phase39-32bytes";
}
import { handleApiError } from "../src/lib/api-response";
import { POST as registerAsset } from "../src/app/api/assets/route";
import { POST as requestUploadUrl } from "../src/app/api/assets/upload-url/route";
import { GET as getSingleAsset } from "../src/app/api/assets/[id]/route";
import { GET as listProjectAssets } from "../src/app/api/projects/[id]/assets/route";
import { GET as getProjectDetail } from "../src/app/api/projects/[id]/route";
import { GET as getDiscover } from "../src/app/api/discover/route";
import { GET as getInvitations } from "../src/app/api/invitations/route";
import {
  CollaboratorRole,
  InvitationStatus,
  ProjectStatus,
  UploadIntentStatus,
  VersionStatus,
  Visibility,
} from "@prisma/client";

interface TestResult {
  id: number;
  scenario: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

let currentUser: any = null;
(authModule as any).getCurrentUser = async () => currentUser;

function makeJsonReq(url: string, method: string, body?: any): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function runPhase39StorageSecurityTests() {
  console.log("=========================================================================");
  console.log("CreativeSpace Phase 3.9: Storage Path, Upload Lifecycle & Leakage Suite");
  console.log("=========================================================================\n");

  const OWNER_A_ID = "11111111-1111-4111-8111-111111111111";
  const OWNER_B_ID = "22222222-2222-4222-8222-222222222222";
  const COLLAB_A_ID = "33333333-3333-4333-8333-333333333333";
  const REVIEWER_A_ID = "44444444-4444-4444-8444-444444444444";
  const OUTSIDER_ID = "55555555-5555-4555-8555-555555555555";

  const PROJ_PUB_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const PROJ_PRIV_A = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const PROJ_COLLAB_A = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const PROJ_PUB_B = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

  const VER_APPROVED = "e1111111-1111-4111-8111-111111111111";
  const VER_DRAFT = "e2222222-2222-4222-8222-222222222222";
  const VER_REJECTED = "e3333333-3333-4333-8333-333333333333";
  const VER_FINAL = "e4444444-4444-4444-8444-444444444444";

  const ASSET_APPROVED = "f1111111-1111-4111-8111-111111111111";
  const ASSET_DRAFT = "f2222222-2222-4222-8222-222222222222";
  const ASSET_REJECTED = "f3333333-3333-4333-8333-333333333333";
  const ASSET_UNVERSIONED = "f4444444-4444-4444-8444-444444444444";
  const ASSET_PRIV = "f5555555-5555-4555-8555-555555555555";
  const ASSET_COLLAB = "f6666666-6666-4666-8666-666666666666";

  const users: Record<string, any> = {
    [OWNER_A_ID]: { id: OWNER_A_ID, username: "owner_a", displayName: "Owner A", avatarUrl: null, isAdmin: false },
    [OWNER_B_ID]: { id: OWNER_B_ID, username: "owner_b", displayName: "Owner B", avatarUrl: null, isAdmin: false },
    [COLLAB_A_ID]: { id: COLLAB_A_ID, username: "collab_a", displayName: "Collab A", avatarUrl: null, isAdmin: false },
    [REVIEWER_A_ID]: { id: REVIEWER_A_ID, username: "reviewer_a", displayName: "Reviewer A", avatarUrl: null, isAdmin: false },
    [OUTSIDER_ID]: { id: OUTSIDER_ID, username: "outsider", displayName: "Outsider", avatarUrl: null, isAdmin: false },
  };

  const projects: Record<string, any> = {
    [PROJ_PUB_A]: {
      id: PROJ_PUB_A,
      creatorId: OWNER_A_ID,
      title: "Public Studio A",
      category: "Illustration",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Public,
      // Deliberately list ASSET_DRAFT as coverAssetId to prove Draft assets stay blocked even if designated
      metadata: { coverAssetId: ASSET_DRAFT },
      createdAt: new Date("2026-03-01T00:00:00Z"),
    },
    [PROJ_PRIV_A]: {
      id: PROJ_PRIV_A,
      creatorId: OWNER_A_ID,
      title: "Secret Private Studio A",
      category: "Illustration",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Private,
      metadata: {},
      createdAt: new Date("2026-03-02T00:00:00Z"),
    },
    [PROJ_COLLAB_A]: {
      id: PROJ_COLLAB_A,
      creatorId: OWNER_A_ID,
      title: "Collaborators Only Studio A",
      category: "Illustration",
      status: ProjectStatus.InProgress,
      visibility: Visibility.CollaboratorsOnly,
      metadata: {},
      createdAt: new Date("2026-03-03T00:00:00Z"),
    },
    [PROJ_PUB_B]: {
      id: PROJ_PUB_B,
      creatorId: OWNER_B_ID,
      title: "Public Studio B",
      category: "Music",
      status: ProjectStatus.InProgress,
      visibility: Visibility.Public,
      metadata: {},
      createdAt: new Date("2026-03-04T00:00:00Z"),
    },
  };

  const collaborators: any[] = [
    {
      id: "col-1",
      projectId: PROJ_PUB_A,
      userId: COLLAB_A_ID,
      role: CollaboratorRole.Collaborator,
      status: InvitationStatus.Accepted,
      acceptedAt: new Date("2026-03-01T01:00:00Z"),
      invitedAt: new Date("2026-03-01T00:30:00Z"),
    },
    {
      id: "col-2",
      projectId: PROJ_PUB_A,
      userId: REVIEWER_A_ID,
      role: CollaboratorRole.ClientReviewer,
      status: InvitationStatus.Accepted,
      acceptedAt: new Date("2026-03-01T01:00:00Z"),
      invitedAt: new Date("2026-03-01T00:30:00Z"),
    },
    // Pending invite for outsider on Public project A (must NOT see Draft/Rejected thumbnails!)
    {
      id: "col-3",
      projectId: PROJ_PUB_A,
      userId: OUTSIDER_ID,
      invitedById: OWNER_A_ID,
      role: CollaboratorRole.Collaborator,
      status: InvitationStatus.Pending,
      acceptedAt: null,
      invitedAt: new Date("2026-03-02T00:00:00Z"),
    },
  ];

  const versions: any[] = [
    { id: VER_APPROVED, projectId: PROJ_PUB_A, versionNumber: 1, status: VersionStatus.Approved, createdById: OWNER_A_ID },
    { id: VER_DRAFT, projectId: PROJ_PUB_A, versionNumber: 2, status: VersionStatus.Draft, createdById: COLLAB_A_ID },
    { id: VER_REJECTED, projectId: PROJ_PUB_A, versionNumber: 3, status: VersionStatus.Rejected, createdById: COLLAB_A_ID },
    { id: VER_FINAL, projectId: PROJ_PUB_A, versionNumber: 4, status: VersionStatus.Final, createdById: OWNER_A_ID },
  ];

  const assets: any[] = [
    {
      id: ASSET_APPROVED,
      projectId: PROJ_PUB_A,
      uploaderId: OWNER_A_ID,
      versionId: VER_APPROVED,
      fileName: "approved.png",
      mimeType: "image/png",
      fileSize: 2048,
      storagePath: `projects/${PROJ_PUB_A}/1700000001_aaaa1111bbbb_approved.png`,
      thumbnailPath: "https://cdn.example.com/approved_thumb.png",
      createdAt: new Date("2026-03-01T02:00:00Z"),
    },
    {
      id: ASSET_DRAFT,
      projectId: PROJ_PUB_A,
      uploaderId: COLLAB_A_ID,
      versionId: VER_DRAFT,
      fileName: "secret_draft.png",
      mimeType: "image/png",
      fileSize: 4096,
      storagePath: `projects/${PROJ_PUB_A}/1700000002_cccc2222dddd_secret_draft.png`,
      thumbnailPath: "https://cdn.example.com/draft_thumb.png",
      createdAt: new Date("2026-03-01T03:00:00Z"),
    },
    {
      id: ASSET_REJECTED,
      projectId: PROJ_PUB_A,
      uploaderId: COLLAB_A_ID,
      versionId: VER_REJECTED,
      fileName: "rejected.png",
      mimeType: "image/png",
      fileSize: 1024,
      storagePath: `projects/${PROJ_PUB_A}/1700000003_eeee3333ffff_rejected.png`,
      thumbnailPath: "https://cdn.example.com/rejected_thumb.png",
      createdAt: new Date("2026-03-01T04:00:00Z"),
    },
    {
      id: ASSET_UNVERSIONED,
      projectId: PROJ_PUB_A,
      uploaderId: OWNER_A_ID,
      versionId: null,
      fileName: "scratch_workspace.png",
      mimeType: "image/png",
      fileSize: 1024,
      storagePath: `projects/${PROJ_PUB_A}/1700000004_1234567890ab_scratch.png`,
      thumbnailPath: "projects/raw/internal_unsafe.png",
      createdAt: new Date("2026-03-01T05:00:00Z"),
    },
    {
      id: ASSET_PRIV,
      projectId: PROJ_PRIV_A,
      uploaderId: OWNER_A_ID,
      versionId: null,
      fileName: "nda.pdf",
      mimeType: "application/pdf",
      fileSize: 8192,
      storagePath: `projects/${PROJ_PRIV_A}/1700000005_abcdef123456_nda.pdf`,
      thumbnailPath: null,
      createdAt: new Date("2026-03-02T02:00:00Z"),
    },
    {
      id: ASSET_COLLAB,
      projectId: PROJ_COLLAB_A,
      uploaderId: OWNER_A_ID,
      versionId: null,
      fileName: "team_only.png",
      mimeType: "image/png",
      fileSize: 4096,
      storagePath: `projects/${PROJ_COLLAB_A}/1700000006_fedcba654321_team_only.png`,
      thumbnailPath: null,
      createdAt: new Date("2026-03-03T02:00:00Z"),
    },
  ];

  // Track mocked storage service calls and upload intents
  const uploadIntents: any[] = [];
  const deletedStoragePaths: string[] = [];
  const signedDownloadCalls: Array<{ path: string; expiresIn?: number }> = [];
  let forceCreateError = false;
  let forceCreateErrorOnce = false;
  let forceDeleteError = false;
  let forceCleanupDbOutage = false;
  let createDelayMs = 0;
  let onBeforeCleanupFence: (() => Promise<void>) | null = null;
  let onBeforeDeleteObject: (() => Promise<void>) | null = null;

  function seedIntentAndToken(params: {
    uploaderId: string;
    projectId: string;
    storagePath: string;
    mimeType: string;
    fileSize: number;
    ttlMs?: number;
  }) {
    const intentId = randomUUID();
    const ttl = params.ttlMs ?? 15 * 60 * 1000;
    const intent = {
      id: intentId,
      projectId: params.projectId,
      uploaderId: params.uploaderId,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      status: UploadIntentStatus.Pending as UploadIntentStatus,
      expiresAt: new Date(Date.now() + ttl),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    uploadIntents.push(intent);
    const uploadToken = createUploadOwnershipToken(
      {
        intentId,
        uploaderId: params.uploaderId,
        projectId: params.projectId,
        storagePath: params.storagePath,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
      },
      ttl
    );
    return { intentId, intent, uploadToken };
  }

  (storageService as any).generateUploadUrl = async (
    projectId: string,
    fileName: string,
    mimeType: string,
    fileSize: number
  ) => {
    // Run the exact production validation + safe key builder
    if (fileSize > 50 * 1024 * 1024) {
      const err: any = new Error("File size exceeds maximum allowed limit");
      err.name = "AppError";
      err.code = "PAYLOAD_TOO_LARGE";
      err.statusCode = 413;
      throw err;
    }
    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (!allowed.includes(mimeType)) {
      const err: any = new Error(`File type "${mimeType}" is not supported`);
      err.name = "AppError";
      err.code = "UNSUPPORTED_MEDIA_TYPE";
      err.statusCode = 415;
      throw err;
    }
    const storagePath = buildSafeProjectStoragePath(projectId, fileName);
    return {
      uploadUrl: `https://mock-storage.local/signed-upload/${encodeURIComponent(storagePath)}`,
      storagePath,
      token: "mock-token",
      expiresIn: 300,
    };
  };

  (storageService as any).getSignedDownloadUrl = async (storagePath: string, expiresIn = 3600) => {
    signedDownloadCalls.push({ path: storagePath, expiresIn });
    return `https://mock-storage.local/storage/v1/object/sign/creativespace-assets/${storagePath}?exp=${expiresIn}`;
  };

  (storageService as any).deleteObject = async (storagePath: string) => {
    if (onBeforeDeleteObject) {
      const hook = onBeforeDeleteObject;
      onBeforeDeleteObject = null;
      await hook();
    }
    if (forceDeleteError) {
      throw new Error(`RAW_STORAGE_SECRET_KEY_AND_PATH_LEAK:${storagePath}`);
    }
    deletedStoragePaths.push(storagePath);
  };

  // Wire Prisma in-memory mocks
  (prisma as any).project = {
    count: async ({ where }: any) => {
      return Object.values(projects).filter((p) => !where?.visibility || p.visibility === where.visibility).length;
    },
    findUnique: async ({ where, include }: any) => {
      const p = projects[where.id];
      if (!p) return null;
      const projCollabs = collaborators
        .filter((c) => c.projectId === p.id)
        .filter((c) => {
          const cw = include?.collaborators?.where;
          if (!cw) return true;
          if (cw.userId && c.userId !== cw.userId) return false;
          if (cw.acceptedAt?.not === null && c.acceptedAt === null) return false;
          return true;
        })
        .map((c) => ({ ...c, user: users[c.userId] }));
      const projVersions = versions
        .filter((v) => v.projectId === p.id)
        .map((v) => ({
          ...v,
          createdBy: users[v.createdById],
          assets: assets.filter((a) => a.versionId === v.id),
          comments: [],
        }));
      const projAssets = assets
        .filter((a) => a.projectId === p.id)
        .map((a) => ({ ...a, uploader: users[a.uploaderId] }));

      return {
        ...p,
        creator: users[p.creatorId],
        collaborators: projCollabs,
        assets: projAssets,
        versions: projVersions,
        comments: [],
        projectTags: [],
        portfolioProjects: [],
        _count: { likes: 0 },
      };
    },
    findMany: async ({ where, include }: any) => {
      return Object.values(projects)
        .filter((p) => !where?.visibility || p.visibility === where.visibility)
        .map((p) => {
          let projAssets = assets.filter((a) => a.projectId === p.id);
          const aWhere = include?.assets?.where;
          if (aWhere?.version?.status?.in) {
            const allowedStatuses = aWhere.version.status.in;
            projAssets = projAssets.filter((a) => {
              const v = versions.find((ver) => ver.id === a.versionId);
              return v && allowedStatuses.includes(v.status);
            });
          }
          const aSelect = include?.assets?.select;
          if (aSelect) {
            projAssets = projAssets.map((a) => {
              const picked: any = {};
              for (const key of Object.keys(aSelect)) {
                if (aSelect[key]) picked[key] = a[key];
              }
              return picked;
            });
          }
          return {
            ...p,
            creator: users[p.creatorId],
            assets: projAssets,
            projectTags: [],
            _count: { likes: 0, comments: 0, versions: versions.filter((v) => v.projectId === p.id).length },
          };
        });
    },
  };

  (prisma as any).version = {
    findUnique: async ({ where }: any) => versions.find((v) => v.id === where.id) || null,
  };

  (prisma as any).like = {
    findUnique: async () => null,
  };

  (prisma as any).projectCollaborator = {
    findMany: async ({ where }: any) => {
      if (where?.userId && typeof where.userId === "string") {
        return collaborators
          .filter((c) => c.userId === where.userId)
          .map((c) => {
            const p = projects[c.projectId];
            return {
              ...c,
              invitedBy: c.invitedById ? users[c.invitedById] : null,
              project: {
                ...p,
                creator: users[p.creatorId],
                assets: assets
                  .filter((a) => a.projectId === p.id && a.thumbnailPath !== null)
                  .map((a) => ({
                    id: a.id,
                    versionId: a.versionId,
                    thumbnailPath: a.thumbnailPath,
                    version: a.versionId ? { status: versions.find((v) => v.id === a.versionId)?.status } : null,
                  })),
              },
            };
          });
      }
      return [];
    },
  };

  (prisma as any).asset = {
    findUnique: async ({ where }: any) => {
      const a = assets.find((x) => x.id === where.id);
      if (!a) return null;
      return {
        ...a,
        project: projects[a.projectId],
        version: a.versionId ? versions.find((v) => v.id === a.versionId) || null : null,
        uploader: users[a.uploaderId],
      };
    },
    findFirst: async ({ where }: any) => {
      if (where?.storagePath) {
        return assets.find((a) => a.storagePath === where.storagePath) || null;
      }
      return null;
    },
    findMany: async ({ where }: any) => {
      return assets
        .filter((a) => {
          if (where?.projectId && a.projectId !== where.projectId) return false;
          if (Array.isArray(where?.OR)) {
            return where.OR.some((cond: any) => {
              if (cond.version?.status?.in) {
                const v = versions.find((ver) => ver.id === a.versionId);
                return v && cond.version.status.in.includes(v.status);
              }
              if (cond.id?.in && cond.versionId === null) {
                return a.versionId === null && cond.id.in.includes(a.id);
              }
              return false;
            });
          }
          return true;
        })
        .map((a) => ({ ...a, uploader: users[a.uploaderId] }));
    },
    create: async ({ data }: any) => {
      if (createDelayMs > 0) {
        await new Promise((r) => setTimeout(r, createDelayMs));
      }
      if (forceCreateErrorOnce) {
        forceCreateErrorOnce = false;
        throw new Error("Simulated transient PostgreSQL failure during registration");
      }
      if (forceCreateError) {
        throw new Error("Simulated PostgreSQL failure on projects/secret/internal_db_error");
      }
      // Enforce PostgreSQL unique index assets_storagePath_key (P2002)
      if (assets.some((a) => a.storagePath === data.storagePath)) {
        const err: any = new Error("Unique constraint failed on the fields: (`storagePath`)");
        err.code = "P2002";
        err.meta = { target: ["storagePath"] };
        throw err;
      }
      const created = {
        id: randomUUID(),
        ...data,
        createdAt: new Date(),
        uploader: users[data.uploaderId],
      };
      assets.push(created);
      return created;
    },
  };

  (prisma as any).uploadIntent = {
    create: async ({ data }: any) => {
      if (uploadIntents.some((u) => u.storagePath === data.storagePath)) {
        const err: any = new Error("Unique constraint failed on upload_intents_storagePath_key");
        err.code = "P2002";
        throw err;
      }
      const created = {
        id: randomUUID(),
        ...data,
        status: data.status || UploadIntentStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      uploadIntents.push(created);
      return created;
    },
    findUnique: async ({ where }: any) => {
      const found = uploadIntents.find((u) => u.id === where.id);
      return found ? { ...found } : null;
    },
    updateMany: async ({ where, data }: any) => {
      if (data.status === UploadIntentStatus.CleaningUp) {
        if (onBeforeCleanupFence) {
          const hook = onBeforeCleanupFence;
          onBeforeCleanupFence = null;
          await hook();
        }
        if (forceCleanupDbOutage) {
          throw new Error("Simulated PostgreSQL outage during cleanup fence");
        }
      }
      let count = 0;
      for (const u of uploadIntents) {
        if (where.id && u.id !== where.id) continue;
        if (where.uploaderId && u.uploaderId !== where.uploaderId) continue;
        if (where.projectId && u.projectId !== where.projectId) continue;
        if (where.storagePath && u.storagePath !== where.storagePath) continue;
        if (where.status && u.status !== where.status) continue;
        u.status = data.status;
        u.updatedAt = new Date();
        count++;
      }
      return { count };
    },
  };

  // Mock $executeRaw so in-memory tests never hit external DB for FOR UPDATE locks
  (prisma as any).$executeRaw = async () => 1;

  // Per-transaction isolated rollback mock (safe under concurrent Promise.all!)
  (prisma as any).$transaction = async (cb: any) => {
    const txCreatedAssetIds = new Set<string>();
    const txIntentPreviousStatus = new Map<string, UploadIntentStatus>();

    const txClient = {
      ...prisma,
      $executeRaw: async () => 1,
      uploadIntent: {
        ...(prisma as any).uploadIntent,
        updateMany: async ({ where, data }: any) => {
          if (data.status === UploadIntentStatus.CleaningUp) {
            if (onBeforeCleanupFence) {
              const hook = onBeforeCleanupFence;
              onBeforeCleanupFence = null;
              await hook();
            }
            if (forceCleanupDbOutage) {
              throw new Error("Simulated PostgreSQL outage during cleanup fence");
            }
          }
          let count = 0;
          for (const u of uploadIntents) {
            if (where.id && u.id !== where.id) continue;
            if (where.uploaderId && u.uploaderId !== where.uploaderId) continue;
            if (where.projectId && u.projectId !== where.projectId) continue;
            if (where.storagePath && u.storagePath !== where.storagePath) continue;
            if (where.status && u.status !== where.status) continue;
            if (!txIntentPreviousStatus.has(u.id)) {
              txIntentPreviousStatus.set(u.id, u.status);
            }
            u.status = data.status;
            u.updatedAt = new Date();
            count++;
          }
          return { count };
        },
      },
      asset: {
        ...(prisma as any).asset,
        create: async (args: any) => {
          const created = await (prisma as any).asset.create(args);
          txCreatedAssetIds.add(created.id);
          return created;
        },
      },
    };

    try {
      return await cb(txClient);
    } catch (err) {
      // Roll back ONLY mutations performed by THIS transaction
      for (const [intentId, prevStatus] of Array.from(txIntentPreviousStatus.entries())) {
        const target = uploadIntents.find((u) => u.id === intentId);
        if (target) target.status = prevStatus;
      }
      if (txCreatedAssetIds.size > 0) {
        for (let i = assets.length - 1; i >= 0; i--) {
          if (txCreatedAssetIds.has(assets[i].id)) assets.splice(i, 1);
        }
      }
      throw err;
    }
  };

  async function runTest(id: number, scenario: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ id, scenario, passed: true, message: "PASS" });
      console.log(`✅ [Test ${id}] ${scenario}`);
    } catch (err: any) {
      results.push({ id, scenario, passed: false, message: err.message || String(err) });
      console.error(`❌ [Test ${id}] ${scenario} -> ${err.message || err}`);
    }
  }

  // TEST 1: Cross-project storagePath injection blocked
  await runTest(1, "Cross-project storagePath injection is rejected (400) when Owner B targets Project A's object", async () => {
    currentUser = users[OWNER_B_ID];
    const res = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_B,
        fileName: "stolen.pdf",
        mimeType: "application/pdf",
        fileSize: 1024,
        storagePath: `projects/${PROJ_PRIV_A}/1700000005_abcdef123456_nda.pdf`,
      })
    );
    assert(res.status === 400, `Expected 400 for cross-project storagePath, got ${res.status}`);
  });

  // TEST 2: Path traversal, encoded traversal, backslashes, empty segments, and wrong prefixes blocked
  await runTest(2, "Path traversal, encoded traversal (%2e%2e/%2f/%5c), backslashes, empty segments & bad prefixes rejected", async () => {
    const maliciousPaths = [
      `projects/${PROJ_PUB_A}/../${PROJ_PRIV_A}/nda.pdf`,
      `projects/${PROJ_PUB_A}/%2e%2e%2fsecret.png`,
      `projects/${PROJ_PUB_A}/foo%2fbar.png`,
      `projects/${PROJ_PUB_A}/foo%5cbar.png`,
      `projects/${PROJ_PUB_A}/foo\\bar.png`,
      `projects/${PROJ_PUB_A}/`,
      `projects/${PROJ_PUB_A}//file.png`,
      `projects/${PROJ_PUB_A}/.hidden.png`,
      `projects/${PROJ_PUB_A}/sub/nested.png`,
      `other-bucket/${PROJ_PUB_A}/file.png`,
      `/projects/${PROJ_PUB_A}/file.png`,
      `projects/${PROJ_PUB_A}/file..name.png`,
      `projects/${PROJ_PUB_A}/file name.png`,
    ];

    for (const badPath of maliciousPaths) {
      const check = validateProjectStoragePath(PROJ_PUB_A, badPath);
      assert(!check.valid, `validateProjectStoragePath MUST reject: ${badPath}`);
    }

    currentUser = users[OWNER_A_ID];
    for (const badPath of maliciousPaths.slice(0, 5)) {
      const res = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "evil.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: badPath,
        })
      );
      assert(res.status === 400, `Expected 400 for malicious storagePath ${badPath}, got ${res.status}`);
    }
  });

  // TEST 3: Duplicate/overwrite storagePath registration blocked (409) without deleting existing file
  await runTest(3, "Duplicate storagePath registration is rejected (409 Conflict) and never deletes existing object", async () => {
    currentUser = users[COLLAB_A_ID];
    const beforeDeletes = deletedStoragePaths.length;
    const res = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "hijack.png",
        mimeType: "image/png",
        fileSize: 2048,
        storagePath: `projects/${PROJ_PUB_A}/1700000001_aaaa1111bbbb_approved.png`,
      })
    );
    assert(res.status === 409, `Expected 409 for duplicate storagePath, got ${res.status}`);
    assert(
      deletedStoragePaths.length === beforeDeletes,
      "Duplicate storagePath rejection MUST NOT delete the existing asset's storage object"
    );
  });

  // TEST 4: Unauthorized asset registration, disallowed MIME, oversized payload, unsafe thumbnailPath
  await runTest(4, "Unauthorized asset registration (401/403), disallowed MIME (415), oversize (413) & unsafe thumbnailPath (400) rejected", async () => {
    const validPath = buildSafeProjectStoragePath(PROJ_PUB_A, "new_art.png");

    // Unauthenticated -> 401
    currentUser = null;
    const r401 = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "new_art.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: validPath,
      })
    );
    assert(r401.status === 401, `Expected 401 unauthenticated, got ${r401.status}`);

    // Outsider -> 403
    currentUser = users[OUTSIDER_ID];
    const rOutsider = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "new_art.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: validPath,
      })
    );
    assert(rOutsider.status === 403, `Expected 403 outsider, got ${rOutsider.status}`);

    // ClientReviewer cannot upload -> 403
    currentUser = users[REVIEWER_A_ID];
    const rReviewer = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "new_art.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: validPath,
      })
    );
    assert(rReviewer.status === 403, `Expected 403 ClientReviewer, got ${rReviewer.status}`);

    // Disallowed MIME type -> 415
    currentUser = users[OWNER_A_ID];
    const rMime = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "malware.exe",
        mimeType: "application/x-msdownload",
        fileSize: 1024,
        storagePath: validPath,
      })
    );
    assert(rMime.status === 415, `Expected 415 disallowed MIME, got ${rMime.status}`);

    // Oversized file -> 413
    const rBig = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "huge.png",
        mimeType: "image/png",
        fileSize: 51 * 1024 * 1024,
        storagePath: validPath,
      })
    );
    assert(rBig.status === 413, `Expected 413 oversize, got ${rBig.status}`);

    // Unsafe thumbnailPath -> 400
    const rThumb = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "art.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: validPath,
        thumbnailPath: "javascript:alert(1)",
      })
    );
    assert(rThumb.status === 400, `Expected 400 unsafe thumbnailPath, got ${rThumb.status}`);
  });

  // TEST 5: Orphan storage cleanup on DB registration failure + sanitized 500 error
  await runTest(5, "Failed DB registration triggers fenced orphan cleanup (Pending->CleaningUp->CleanedUp) and returns generic 500", async () => {
    currentUser = users[OWNER_A_ID];
    const orphanPath = buildSafeProjectStoragePath(PROJ_PUB_A, "orphan.png");
    const { intent, uploadToken: orphanToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: orphanPath,
      mimeType: "image/png",
      fileSize: 1024,
    });
    forceCreateError = true;
    try {
      const res = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "orphan.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: orphanPath,
          uploadToken: orphanToken,
        })
      );
      const json = await res.json();
      assert(res.status === 500, `Expected 500 on DB failure, got ${res.status}`);
      assert(
        !JSON.stringify(json).includes("internal_db_error") && !JSON.stringify(json).includes("projects/secret"),
        "500 response MUST NOT leak raw internal error message or storage paths"
      );
      assert(
        deletedStoragePaths.includes(orphanPath),
        "Orphan uploaded storage object must be cleaned up when DB registration fails"
      );
      assert(
        intent.status === UploadIntentStatus.CleanedUp,
        `UploadIntent must transition to CleanedUp after successful cleanup, got ${intent.status}`
      );
    } finally {
      forceCreateError = false;
    }
  });

  // TEST 6: Signed upload URL authorization & malicious filename sanitization
  await runTest(6, "Signed upload URL enforces auth/RBAC/MIME/size and sanitizes malicious filenames into project namespace", async () => {
    // Unauthenticated -> 401
    currentUser = null;
    const u401 = await requestUploadUrl(
      makeJsonReq("http://localhost/api/assets/upload-url", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "test.png",
        mimeType: "image/png",
        fileSize: 1024,
      })
    );
    assert(u401.status === 401, `Expected 401 on upload-url, got ${u401.status}`);

    // Outsider -> 403
    currentUser = users[OUTSIDER_ID];
    const u403 = await requestUploadUrl(
      makeJsonReq("http://localhost/api/assets/upload-url", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "test.png",
        mimeType: "image/png",
        fileSize: 1024,
      })
    );
    assert(u403.status === 403, `Expected 403 on outsider upload-url, got ${u403.status}`);

    // Collaborator uploading malicious traversal filename -> sanitized strictly into PROJ_PUB_A
    currentUser = users[COLLAB_A_ID];
    const uOk = await requestUploadUrl(
      makeJsonReq("http://localhost/api/assets/upload-url", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "../../other-project/..%2fsecret.png",
        mimeType: "image/png",
        fileSize: 1024,
      })
    );
    const uJson = await uOk.json();
    assert(uOk.status === 200, `Expected 200 for collaborator upload-url, got ${uOk.status}`);
    assert(
      validateProjectStoragePath(PROJ_PUB_A, uJson.data.storagePath).valid,
      `Generated storagePath must pass strict project validation: ${uJson.data.storagePath}`
    );
    assert(
      uOk.headers.get("cache-control")?.includes("no-store") === true,
      "upload-url response must set Cache-Control: private, no-store"
    );
  });

  // TEST 7: Draft (even if coverAssetId), Rejected, Unversioned, Private, & CollaboratorsOnly blocked from non-members
  await runTest(7, "Draft (even if coverAssetId), Rejected, Unversioned, Private & CollaboratorsOnly assets strictly return 403 to non-members with 0 signed URLs issued", async () => {
    currentUser = users[OUTSIDER_ID];
    const signedBefore = signedDownloadCalls.length;

    for (const blockedAssetId of [
      ASSET_DRAFT,
      ASSET_REJECTED,
      ASSET_UNVERSIONED,
      ASSET_PRIV,
      ASSET_COLLAB,
    ]) {
      const res = await getSingleAsset(
        makeJsonReq(`http://localhost/api/assets/${blockedAssetId}`, "GET"),
        { params: { id: blockedAssetId } }
      );
      assert(res.status === 403, `Expected 403 for blocked asset ${blockedAssetId}, got ${res.status}`);
    }
    assert(
      signedDownloadCalls.length === signedBefore,
      "ZERO signed download URLs may be generated for unauthorized asset requests"
    );

    // Approved public asset succeeds with expiring signed URL & NO raw storagePath
    const okRes = await getSingleAsset(
      makeJsonReq(`http://localhost/api/assets/${ASSET_APPROVED}`, "GET"),
      { params: { id: ASSET_APPROVED } }
    );
    const okJson = await okRes.json();
    assert(okRes.status === 200, `Expected 200 for public Approved asset, got ${okRes.status}`);
    assert(okJson.data.storagePath === undefined, "GET /api/assets/[id] MUST NOT serialize storagePath");
    assert(
      okJson.data.downloadUrl.includes("/storage/v1/object/sign/") &&
        okRes.headers.get("cache-control")?.includes("no-store"),
      "Authorized asset retrieval must return expiring signed URL with private no-store cache headers"
    );
  });

  // TEST 8: Complete leakage check across Discover, Project Detail, Project Assets, Invitations, & POST /api/assets
  await runTest(8, "Discover, Project Detail, Project Assets, Invitations & POST /api/assets never leak storagePath or Draft/Rejected assets", async () => {
    // 1. Discover (anonymous) -> ONLY Approved/Final assets, ZERO storagePath
    currentUser = null;
    const discJson = await (await getDiscover(makeJsonReq("http://localhost/api/discover", "GET"))).json();
    const pubAInDisc = discJson.data.projects.find((p: any) => p.id === PROJ_PUB_A);
    assert(
      pubAInDisc.assets.length === 1 && pubAInDisc.assets[0].id === ASSET_APPROVED,
      `Discover must expose ONLY Approved/Final assets, got ${JSON.stringify(pubAInDisc.assets)}`
    );
    assert(pubAInDisc.assets[0].storagePath === undefined, "Discover MUST NOT expose storagePath");

    // 2. Project Assets list (outsider) -> ONLY Approved asset, ZERO storagePath
    currentUser = users[OUTSIDER_ID];
    const listJson = await (
      await listProjectAssets(makeJsonReq(`http://localhost/api/projects/${PROJ_PUB_A}/assets`, "GET"), {
        params: { id: PROJ_PUB_A },
      })
    ).json();
    assert(
      listJson.data.length === 1 && listJson.data[0].id === ASSET_APPROVED,
      "Non-member project asset listing must exclude Draft, Rejected, and unversioned assets"
    );
    assert(listJson.data[0].storagePath === undefined, "Project assets listing MUST NOT expose storagePath");

    // 3. Project Detail (outsider) -> ZERO storagePath on assets or versions[*].assets
    const detailJson = await (
      await getProjectDetail(makeJsonReq(`http://localhost/api/projects/${PROJ_PUB_A}`, "GET"), {
        params: { id: PROJ_PUB_A },
      })
    ).json();
    assert(
      detailJson.data.assets.every((a: any) => a.storagePath === undefined) &&
        detailJson.data.versions.every((v: any) => v.assets.every((a: any) => a.storagePath === undefined)),
      "Project detail MUST NOT expose storagePath on any asset"
    );

    // 4. Invitations for Pending invitee on Public project -> MUST resolve Approved thumb (NOT Draft coverAssetId or raw storagePath!)
    const invJson = await (await getInvitations()).json();
    const pendingInv = invJson.data.incoming.find((i: any) => i.project.id === PROJ_PUB_A);
    assert(
      pendingInv?.project?.thumbnailUrl === "https://cdn.example.com/approved_thumb.png",
      `Pending invitee must only see safe Approved thumbnail, got ${pendingInv?.project?.thumbnailUrl}`
    );

    // 5. Valid POST /api/assets registration returns 201 WITHOUT storagePath
    currentUser = users[OWNER_A_ID];
    const freshPath = buildSafeProjectStoragePath(PROJ_PUB_A, "clean_render.png");
    const { uploadToken: freshToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: freshPath,
      mimeType: "image/png",
      fileSize: 2048,
    });
    const regRes = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "clean_render.png",
        mimeType: "image/png",
        fileSize: 2048,
        storagePath: freshPath,
        uploadToken: freshToken,
      })
    );
    const regJson = await regRes.json();
    assert(regRes.status === 201 && regJson.data.storagePath === undefined, "POST /api/assets must return 201 without exposing storagePath");
  });

  // TEST 9: Signed URL config failure & disabled permanent public URLs
  await runTest(9, "Missing server storage credentials fail safely (500 STORAGE_CONFIG_ERROR) and getPublicUrl is disabled", async () => {
    const realService = new SupabaseStorageService("creativespace-assets");

    // Permanent public URLs must be disabled on private bucket architecture
    let publicUrlBlocked = false;
    try {
      realService.getPublicUrl(`projects/${PROJ_PUB_A}/file.png`);
    } catch (e: any) {
      publicUrlBlocked = e?.code === "STORAGE_POLICY_ERROR";
    }
    assert(publicUrlBlocked, "getPublicUrl must throw STORAGE_POLICY_ERROR for private bucket policy");

    // Missing service-role key must fail safely with STORAGE_CONFIG_ERROR (never fall back to anon key)
    const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder.supabase.co";
    try {
      let uploadConfigFailed = false;
      try {
        await realService.generateUploadUrl(PROJ_PUB_A, "test.png", "image/png", 1024);
      } catch (e: any) {
        uploadConfigFailed = e?.code === "STORAGE_CONFIG_ERROR" && e?.statusCode === 500;
      }
      assert(uploadConfigFailed, "generateUploadUrl must fail with 500 STORAGE_CONFIG_ERROR when service credentials missing");

      let downloadConfigFailed = false;
      try {
        await realService.getSignedDownloadUrl(`projects/${PROJ_PUB_A}/test.png`, 3600);
      } catch (e: any) {
        downloadConfigFailed = e?.code === "STORAGE_CONFIG_ERROR" && e?.statusCode === 500;
      }
      assert(downloadConfigFailed, "getSignedDownloadUrl must fail with 500 STORAGE_CONFIG_ERROR when service credentials missing");
    } finally {
      if (savedUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
      else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (savedKey !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
      else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    // Generic unexpected error through handleApiError never leaks internal details
    const errRes = handleApiError(new Error("SECRET_SQL_OR_SIGNED_URL_LEAK"));
    const errJson = await errRes.json();
    assert(
      errRes.status === 500 && !JSON.stringify(errJson).includes("SECRET_SQL_OR_SIGNED_URL_LEAK"),
      "handleApiError must redact raw Error.message on 500 responses"
    );
  });

  // TEST 10: Concurrent duplicate storagePath registrations -> [201, 409] via UploadIntent/P2002 with ZERO storage deletion
  await runTest(10, "Concurrent duplicate storagePath registrations yield [201, 409] and preserve winning storage object", async () => {
    currentUser = users[OWNER_A_ID];
    const racePath = buildSafeProjectStoragePath(PROJ_PUB_A, "race_file.png");
    const { uploadToken: raceToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: racePath,
      mimeType: "image/png",
      fileSize: 2048,
    });
    const deletesBefore = deletedStoragePaths.length;
    createDelayMs = 25;
    try {
      const [r1, r2] = await Promise.all([
        registerAsset(
          makeJsonReq("http://localhost/api/assets", "POST", {
            projectId: PROJ_PUB_A,
            fileName: "race_file.png",
            mimeType: "image/png",
            fileSize: 2048,
            storagePath: racePath,
            uploadToken: raceToken,
          })
        ),
        registerAsset(
          makeJsonReq("http://localhost/api/assets", "POST", {
            projectId: PROJ_PUB_A,
            fileName: "race_file.png",
            mimeType: "image/png",
            fileSize: 2048,
            storagePath: racePath,
            uploadToken: raceToken,
          })
        ),
      ]);
      const statuses = [r1.status, r2.status].sort();
      assert(
        statuses[0] === 201 && statuses[1] === 409,
        `Expected [201, 409] on concurrent duplicate registration, got ${JSON.stringify(statuses)}`
      );
      assert(
        assets.filter((a) => a.storagePath === racePath).length === 1,
        "Strictly 1 Asset row may exist for racePath"
      );
      assert(
        deletedStoragePaths.length === deletesBefore,
        "Concurrent duplicate loser MUST NEVER delete the winning upload's storage object"
      );
    } finally {
      createDelayMs = 0;
    }
  });

  // TEST 11: Upload token security audit (missing/forged/expired/wrong-uploader/tampered/missing-secret/deterministic)
  await runTest(11, "Upload token enforces dedicated signing secret, deterministic payload, expiry, uploader/project binding & zero deletions on reject", async () => {
    const deletesBefore = deletedStoragePaths.length;
    const ownerPath = buildSafeProjectStoragePath(PROJ_PUB_A, "owner_owned.png");
    const { intentId: ownerIntentId, uploadToken: ownerToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: ownerPath,
      mimeType: "image/png",
      fileSize: 1024,
    });

    // Verify deterministic canonical tuple structure (JSON array, not arbitrary object key order)
    const [payloadB64] = ownerToken.split(".");
    const decodedTuple = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    assert(
      Array.isArray(decodedTuple) && decodedTuple.length === 10 && decodedTuple[0] === 1 && decodedTuple[1] === ownerIntentId,
      "Upload token payload must use deterministic canonical tuple serialization"
    );

    // 1. Missing token (arbitrary unissued path) -> 403
    currentUser = users[OWNER_A_ID];
    const rMissing = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "owner_owned.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: ownerPath,
      })
    );
    assert(rMissing.status === 403, `Expected 403 for missing uploadToken, got ${rMissing.status}`);

    // 2. Collaborator trying to register Owner's uploadToken/path -> 403
    currentUser = users[COLLAB_A_ID];
    const rWrongUser = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "owner_owned.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: ownerPath,
        uploadToken: ownerToken,
      })
    );
    assert(rWrongUser.status === 403, `Expected 403 when wrong uploader presents token, got ${rWrongUser.status}`);

    // 3. Tampered fileSize with Owner's token -> 403
    currentUser = users[OWNER_A_ID];
    const rTampered = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "owner_owned.png",
        mimeType: "image/png",
        fileSize: 9999,
        storagePath: ownerPath,
        uploadToken: ownerToken,
      })
    );
    assert(rTampered.status === 403, `Expected 403 for tampered fileSize, got ${rTampered.status}`);

    // 4. Expired token -> 403
    const expiredToken = createUploadOwnershipToken(
      {
        intentId: ownerIntentId,
        uploaderId: OWNER_A_ID,
        projectId: PROJ_PUB_A,
        storagePath: ownerPath,
        mimeType: "image/png",
        fileSize: 1024,
      },
      -1000
    );
    const rExpired = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "owner_owned.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: ownerPath,
        uploadToken: expiredToken,
      })
    );
    assert(rExpired.status === 403, `Expected 403 for expired uploadToken, got ${rExpired.status}`);

    // 5. Missing signing secret MUST fail closed (500 STORAGE_CONFIG_ERROR, never insecure fallback)
    const savedUploadSecret = process.env.UPLOAD_TOKEN_SECRET;
    const savedAuthSecret = process.env.NEXTAUTH_SECRET;
    delete process.env.UPLOAD_TOKEN_SECRET;
    delete process.env.NEXTAUTH_SECRET;
    try {
      let failedClosed = false;
      try {
        verifyUploadOwnershipToken(ownerToken, {
          uploaderId: OWNER_A_ID,
          projectId: PROJ_PUB_A,
          storagePath: ownerPath,
          mimeType: "image/png",
          fileSize: 1024,
        });
      } catch (e: any) {
        failedClosed = e?.code === "STORAGE_CONFIG_ERROR" && e?.statusCode === 500;
      }
      assert(failedClosed, "upload-token.ts MUST fail closed with 500 STORAGE_CONFIG_ERROR when no signing secret is configured");
    } finally {
      if (savedUploadSecret !== undefined) process.env.UPLOAD_TOKEN_SECRET = savedUploadSecret;
      if (savedAuthSecret !== undefined) process.env.NEXTAUTH_SECRET = savedAuthSecret;
    }

    assert(
      deletedStoragePaths.length === deletesBefore,
      "Rejected ownership-token checks MUST NEVER delete any storage object"
    );
  });

  // TEST 12: Cleanup failure handling returns sanitized 500, leaves intent fenced at CleaningUp
  await runTest(12, "Orphan cleanup failure keeps intent fenced at CleaningUp and returns sanitized 500 without exposing secrets or paths", async () => {
    currentUser = users[OWNER_A_ID];
    const failPath = buildSafeProjectStoragePath(PROJ_PUB_A, "cleanup_fail.png");
    const { intent, uploadToken: failToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: failPath,
      mimeType: "image/png",
      fileSize: 1024,
    });
    forceCreateError = true;
    forceDeleteError = true;
    try {
      const res = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "cleanup_fail.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: failPath,
          uploadToken: failToken,
        })
      );
      const json = await res.json();
      assert(res.status === 500, `Expected 500 when DB and cleanup both fail, got ${res.status}`);
      const serialized = JSON.stringify(json);
      assert(
        !serialized.includes("RAW_STORAGE_SECRET_KEY") &&
          !serialized.includes(failPath) &&
          !serialized.includes("internal_db_error"),
        "Cleanup failure must NOT leak secrets, raw paths, or DB errors to clients"
      );
      assert(
        intent.status === UploadIntentStatus.CleaningUp,
        `Failed cleanup must leave intent fenced in CleaningUp, got ${intent.status}`
      );
    } finally {
      forceCreateError = false;
      forceDeleteError = false;
    }

    // Subsequent replay after failed cleanup MUST be blocked (409) because intent is fenced
    const replayAfterFail = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "cleanup_fail.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: failPath,
        uploadToken: failToken,
      })
    );
    assert(
      replayAfterFail.status === 409,
      `Replay against fenced CleaningUp intent must return 409, got ${replayAfterFail.status}`
    );
  });

  // TEST 13: Concurrent independent uploads succeed independently with zero interference
  await runTest(13, "Concurrent independent uploads issue distinct storagePaths & tokens and register cleanly without interference", async () => {
    currentUser = users[OWNER_A_ID];
    const [u1Res, u2Res] = await Promise.all([
      requestUploadUrl(
        makeJsonReq("http://localhost/api/assets/upload-url", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "same_name.png",
          mimeType: "image/png",
          fileSize: 1024,
        })
      ),
      requestUploadUrl(
        makeJsonReq("http://localhost/api/assets/upload-url", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "same_name.png",
          mimeType: "image/png",
          fileSize: 1024,
        })
      ),
    ]);
    const u1 = (await u1Res.json()).data;
    const u2 = (await u2Res.json()).data;
    assert(
      u1Res.status === 200 &&
        u2Res.status === 200 &&
        u1.storagePath !== u2.storagePath &&
        u1.uploadToken !== u2.uploadToken,
      "Concurrent uploads of identical filenames must produce distinct storagePaths and uploadTokens"
    );

    const [reg1, reg2] = await Promise.all([
      registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "same_name.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: u1.storagePath,
          uploadToken: u1.uploadToken,
        })
      ),
      registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "same_name.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: u2.storagePath,
          uploadToken: u2.uploadToken,
        })
      ),
    ]);
    assert(
      reg1.status === 201 && reg2.status === 201,
      `Expected both concurrent independent uploads to succeed [201, 201], got [${reg1.status}, ${reg2.status}]`
    );
  });

  // TEST 14: Exact Section 1 Race — Concurrent registration & cleanup (BOTH interleavings proven safe!)
  await runTest(14, "Concurrent registration & orphan cleanup race is impossible in BOTH interleavings (atomic UploadIntent fencing)", async () => {
    currentUser = users[OWNER_A_ID];

    // Interleaving A: Request A fails transiently; BEFORE A claims Pending->CleaningUp, Request B registers Pending->Registered (201).
    // Request A's fence claim matches 0 rows -> ZERO deleteObject calls -> Request B's live storage object is preserved!
    const pathInterleave1 = buildSafeProjectStoragePath(PROJ_PUB_A, "race_interleave_1.png");
    const { intent: intent1, uploadToken: token1 } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: pathInterleave1,
      mimeType: "image/png",
      fileSize: 1024,
    });

    const deletesBefore1 = deletedStoragePaths.length;
    forceCreateErrorOnce = true;
    let reqBStatus1 = 0;
    onBeforeCleanupFence = async () => {
      // Simulate Request B registering and committing right before Request A claims cleanup!
      const reqBRes = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "race_interleave_1.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: pathInterleave1,
          uploadToken: token1,
        })
      );
      reqBStatus1 = reqBRes.status;
    };

    const reqARes1 = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "race_interleave_1.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: pathInterleave1,
        uploadToken: token1,
      })
    );
    assert(reqBStatus1 === 201, `Expected Request B to succeed (201), got ${reqBStatus1}`);
    assert(reqARes1.status === 500, `Expected Request A to return 500, got ${reqARes1.status}`);
    assert(
      intent1.status === UploadIntentStatus.Registered,
      `Intent must remain Registered, got ${intent1.status}`
    );
    assert(
      deletedStoragePaths.length === deletesBefore1 && !deletedStoragePaths.includes(pathInterleave1),
      "CRITICAL: Request A MUST NOT delete Request B's newly registered storage object!"
    );

    // Interleaving B: Request A fails transiently AND commits Pending->CleaningUp fence FIRST;
    // while Request A is about to deleteObject, Request B attempts registration -> Request B is fenced out (409)!
    const pathInterleave2 = buildSafeProjectStoragePath(PROJ_PUB_A, "race_interleave_2.png");
    const { intent: intent2, uploadToken: token2 } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: pathInterleave2,
      mimeType: "image/png",
      fileSize: 1024,
    });

    forceCreateErrorOnce = true;
    let reqBStatus2 = 0;
    onBeforeDeleteObject = async () => {
      // Simulate Request B racing in while Request A holds the CleaningUp fence and is deleting storage
      const reqBRes = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "race_interleave_2.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: pathInterleave2,
          uploadToken: token2,
        })
      );
      reqBStatus2 = reqBRes.status;
    };

    const reqARes2 = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "race_interleave_2.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: pathInterleave2,
        uploadToken: token2,
      })
    );
    assert(reqARes2.status === 500, `Expected Request A to return 500, got ${reqARes2.status}`);
    assert(
      reqBStatus2 === 409,
      `Request B arriving after CleaningUp fence MUST be rejected (409), got ${reqBStatus2}`
    );
    assert(
      !assets.some((a) => a.storagePath === pathInterleave2),
      "No Asset record may exist for a fenced/cleaned-up storagePath"
    );
    assert(
      deletedStoragePaths.includes(pathInterleave2) && intent2.status === UploadIntentStatus.CleanedUp,
      "Request A must safely delete the fenced orphan and mark CleanedUp"
    );
  });

  // TEST 15: Safe token replay behavior (after Registered AND after CleanedUp)
  await runTest(15, "Replaying a valid uploadToken after Registered or CleanedUp returns 409 and never deletes storage", async () => {
    currentUser = users[OWNER_A_ID];
    const replayPath = buildSafeProjectStoragePath(PROJ_PUB_A, "replay_once.png");
    const { uploadToken: replayToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: replayPath,
      mimeType: "image/png",
      fileSize: 1024,
    });

    const first = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "replay_once.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: replayPath,
        uploadToken: replayToken,
      })
    );
    assert(first.status === 201, `Expected initial registration 201, got ${first.status}`);

    const deletesBefore = deletedStoragePaths.length;
    const replay = await registerAsset(
      makeJsonReq("http://localhost/api/assets", "POST", {
        projectId: PROJ_PUB_A,
        fileName: "replay_once.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: replayPath,
        uploadToken: replayToken,
      })
    );
    assert(replay.status === 409, `Expected 409 on token replay, got ${replay.status}`);
    assert(
      deletedStoragePaths.length === deletesBefore,
      "Token replay MUST NEVER trigger storage deletion"
    );
  });

  // TEST 16: Database outage during cleanup fence aborts deletion safely
  await runTest(16, "Database outage during cleanup fence aborts storage deletion safely and returns sanitized 500", async () => {
    currentUser = users[OWNER_A_ID];
    const outagePath = buildSafeProjectStoragePath(PROJ_PUB_A, "db_outage.png");
    const { intent, uploadToken: outageToken } = seedIntentAndToken({
      uploaderId: OWNER_A_ID,
      projectId: PROJ_PUB_A,
      storagePath: outagePath,
      mimeType: "image/png",
      fileSize: 1024,
    });

    const deletesBefore = deletedStoragePaths.length;
    forceCreateError = true;
    forceCleanupDbOutage = true;
    try {
      const res = await registerAsset(
        makeJsonReq("http://localhost/api/assets", "POST", {
          projectId: PROJ_PUB_A,
          fileName: "db_outage.png",
          mimeType: "image/png",
          fileSize: 1024,
          storagePath: outagePath,
          uploadToken: outageToken,
        })
      );
      const json = await res.json();
      assert(res.status === 500, `Expected 500 on DB outage, got ${res.status}`);
      assert(
        !JSON.stringify(json).includes("outage") && !JSON.stringify(json).includes(outagePath),
        "DB outage response must be sanitized"
      );
      assert(
        deletedStoragePaths.length === deletesBefore && !deletedStoragePaths.includes(outagePath),
        "DB outage during cleanup fence MUST NOT delete storage object"
      );
      assert(
        intent.status === UploadIntentStatus.Pending,
        "Intent status remains Pending when DB fence could not be acquired"
      );
    } finally {
      forceCreateError = false;
      forceCleanupDbOutage = false;
    }
  });

  const passed = results.filter((r) => r.passed).length;
  console.log("\n=========================================================================");
  console.log(`Phase 3.9 Storage Security Summary: ${passed}/${results.length} PASSED`);
  console.log("=========================================================================");
  if (passed !== results.length) {
    process.exit(1);
  }
}

runPhase39StorageSecurityTests().catch((err) => {
  console.error("Fatal error running Phase 3.9 storage security tests:", err);
  process.exit(1);
});
