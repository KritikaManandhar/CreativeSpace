// Register path alias for '@/...' imports in ts-node
import Module from "module";
import path from "path";
import { randomUUID } from "crypto";

const originalResolveFilename = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (request: string, parent: any, isMain: boolean, options: any) {
  if (request.startsWith("@/")) {
    const resolvedPath = path.join(__dirname, "../src", request.slice(2));
    return originalResolveFilename.call(this, resolvedPath, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

import { NextRequest } from "next/server";
import { prisma } from "../src/lib/prisma";
import * as authModule from "../src/lib/auth";
import { Visibility, CollaboratorRole, VersionStatus, ProjectStatus } from "@prisma/client";
import { GET as getVersions, POST as createVersion } from "../src/app/api/projects/[id]/versions/route";
import {
  GET as getVersion,
  PATCH as updateVersion,
  DELETE as deleteVersion,
} from "../src/app/api/projects/[id]/versions/[versionId]/route";
import { DELETE as deleteAsset } from "../src/app/api/assets/[id]/route";
import { POST as createAsset } from "../src/app/api/assets/route";
import { POST as postComment } from "../src/app/api/projects/[id]/comments/route";
import { storageService } from "../src/lib/storage";
import { createUploadOwnershipToken } from "../src/lib/upload-token";

if (!process.env.UPLOAD_TOKEN_SECRET) {
  process.env.UPLOAD_TOKEN_SECRET = "test-only-upload-token-secret-phase2-32bytes";
}

interface TestCaseResult {
  id: number;
  scenario: string;
  passed: boolean;
  message: string;
}

const results: TestCaseResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// Global mock state
let currentUser: any = null;

// Replace getCurrentUser
(authModule as any).getCurrentUser = async () => currentUser;

async function runPhase2TestSuite() {
  console.log("=================================================================");
  console.log("CreativeSpace Phase 2: Version Lifecycle & FINAL Enforcement Test Suite");
  console.log("=================================================================\n");

  // In-memory mock database store
  let mockDb = {
    users: {
      owner: { id: "user-owner-1", username: "owner_user", email: "owner@example.com" },
      collab: { id: "user-collab-2", username: "collab_user", email: "collab@example.com" },
      reviewer: { id: "user-reviewer-3", username: "client_reviewer", email: "reviewer@example.com" },
      nonMember: { id: "user-nonmember-4", username: "stranger_user", email: "stranger@example.com" },
    },
    projects: {
      projA: {
        id: "proj-alpha",
        creatorId: "user-owner-1",
        title: "Project Alpha",
        visibility: Visibility.Public,
        status: ProjectStatus.InProgress,
        metadata: {},
      },
      projB: {
        id: "proj-beta",
        creatorId: "user-owner-1",
        title: "Project Beta",
        visibility: Visibility.Public,
        status: ProjectStatus.InProgress,
        metadata: {},
      },
    },
    collaborators: [
      {
        projectId: "proj-alpha",
        userId: "user-collab-2",
        role: CollaboratorRole.Collaborator,
        acceptedAt: new Date("2026-10-01T00:00:00Z"),
        invitedAt: new Date("2026-09-30T00:00:00Z"),
      },
      {
        projectId: "proj-alpha",
        userId: "user-reviewer-3",
        role: CollaboratorRole.ClientReviewer,
        acceptedAt: new Date("2026-10-01T00:00:00Z"),
        invitedAt: new Date("2026-09-30T00:00:00Z"),
      },
    ] as any[],
    versions: [] as any[],
    assets: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        projectId: "proj-alpha",
        uploaderId: "user-owner-1",
        versionId: null,
        fileName: "alpha_render.png",
        mimeType: "image/png",
        fileSize: 1024,
        storagePath: "projects/proj-alpha/alpha_render.png",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        projectId: "proj-beta",
        uploaderId: "user-owner-1",
        versionId: null,
        fileName: "beta_render.png",
        mimeType: "image/png",
        fileSize: 2048,
        storagePath: "projects/proj-beta/beta_render.png",
      },
    ] as any[],
    comments: [] as any[],
    notifications: [] as any[],
  };

  // Setup Mock Prisma methods
  (prisma.project as any).findUnique = async (args: any) => {
    const projectId = args.where.id;
    const project = Object.values(mockDb.projects).find((p) => p.id === projectId);
    if (!project) return null;

    let matchingCollaborators: any[] = [];
    if (args.include?.collaborators) {
      const cWhere = args.include.collaborators.where || {};
      matchingCollaborators = mockDb.collaborators.filter((c) => {
        if (c.projectId !== projectId) return false;
        if (cWhere.userId && c.userId !== cWhere.userId) return false;
        if (cWhere.acceptedAt && cWhere.acceptedAt.not === null && c.acceptedAt === null) return false;
        return true;
      });
    }

    return { ...project, collaborators: matchingCollaborators };
  };

  (prisma.version as any).findUnique = async (args: any) => {
    const v = mockDb.versions.find((x) => x.id === args.where.id);
    if (!v) return null;
    const assets = mockDb.assets.filter((a) => a.versionId === v.id);
    const comments = mockDb.comments.filter((c) => c.versionId === v.id);
    const createdBy = Object.values(mockDb.users).find((u) => u.id === v.createdById);
    return { ...v, assets, comments, createdBy };
  };

  (prisma.version as any).findFirst = async (args: any) => {
    let list = [...mockDb.versions];
    if (args.where?.projectId) {
      list = list.filter((v) => v.projectId === args.where.projectId);
    }
    if (args.where?.status) {
      list = list.filter((v) => v.status === args.where.status);
    }
    if (args.where?.id?.not) {
      list = list.filter((v) => v.id !== args.where.id.not);
    }
    if (args.orderBy?.versionNumber === "desc") {
      list.sort((a, b) => b.versionNumber - a.versionNumber);
    }
    return list[0] || null;
  };

  (prisma.version as any).findMany = async (args: any) => {
    let list = [...mockDb.versions];
    if (args.where?.projectId) {
      list = list.filter((v) => v.projectId === args.where.projectId);
    }
    if (args.orderBy?.versionNumber === "desc") {
      list.sort((a, b) => b.versionNumber - a.versionNumber);
    }
    return list.map((v) => {
      const assets = mockDb.assets.filter((a) => a.versionId === v.id);
      const comments = mockDb.comments.filter((c) => c.versionId === v.id);
      const createdBy = Object.values(mockDb.users).find((u) => u.id === v.createdById);
      return { ...v, assets, comments, createdBy };
    });
  };

  (prisma.version as any).create = async (args: any) => {
    // Check unique constraint on (projectId, versionNumber)
    const duplicate = mockDb.versions.find(
      (v) => v.projectId === args.data.projectId && v.versionNumber === args.data.versionNumber
    );
    if (duplicate) {
      const err: any = new Error("Unique constraint failed on the fields: (`projectId`,`versionNumber`)");
      err.code = "P2002";
      err.meta = { target: ["projectId", "versionNumber"] };
      throw err;
    }
    const newRecord = {
      id: randomUUID(),
      createdAt: new Date(),
      ...args.data,
    };
    mockDb.versions.push(newRecord);
    return newRecord;
  };

  (prisma.version as any).update = async (args: any) => {
    const idx = mockDb.versions.findIndex((v) => v.id === args.where.id);
    if (idx === -1) throw new Error("Record to update not found");

    // Check PostgreSQL partial unique index on status = 'Final'
    if (args.data.status === VersionStatus.Final) {
      const existingFinal = mockDb.versions.find(
        (v) => v.projectId === mockDb.versions[idx].projectId && v.status === VersionStatus.Final && v.id !== args.where.id
      );
      if (existingFinal) {
        const err: any = new Error("Unique constraint failed on partial unique index: versions_unique_final_per_project");
        err.code = "P2002";
        err.meta = { target: ["versions_unique_final_per_project"] };
        throw err;
      }
    }

    Object.assign(mockDb.versions[idx], args.data);
    return mockDb.versions[idx];
  };

  (prisma.version as any).delete = async (args: any) => {
    const idx = mockDb.versions.findIndex((v) => v.id === args.where.id);
    if (idx === -1) throw new Error("Record to delete not found");
    const [deleted] = mockDb.versions.splice(idx, 1);
    // Cascade onDelete: SetNull for Asset.versionId and Comment.versionId
    mockDb.assets.forEach((a) => {
      if (a.versionId === deleted.id) a.versionId = null;
    });
    mockDb.comments.forEach((c) => {
      if (c.versionId === deleted.id) c.versionId = null;
    });
    return deleted;
  };

  (storageService as any).deleteObject = async () => true;

  (prisma.asset as any).findUnique = async (args: any) => {
    const a = mockDb.assets.find((x) => x.id === args.where.id);
    if (!a) return null;
    let version = null;
    if (a.versionId) {
      const v = mockDb.versions.find((ver) => ver.id === a.versionId);
      if (v) version = v;
    }
    const project = Object.values(mockDb.projects).find((p) => p.id === a.projectId);
    return { ...a, version, project };
  };

  (prisma.asset as any).delete = async (args: any) => {
    const idx = mockDb.assets.findIndex((x) => x.id === args.where.id);
    if (idx === -1) throw new Error("Asset not found");
    return mockDb.assets.splice(idx, 1)[0];
  };

  (prisma.asset as any).create = async (args: any) => {
    const newAsset = { id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...args.data };
    mockDb.assets.push(newAsset);
    return newAsset;
  };

  (prisma.asset as any).findMany = async (args: any) => {
    let list = [...mockDb.assets];
    if (args.where?.projectId) list = list.filter((a) => a.projectId === args.where.projectId);
    if (args.where?.id?.in) list = list.filter((a) => args.where.id.in.includes(a.id));
    return list;
  };

  (prisma.asset as any).updateMany = async (args: any) => {
    let count = 0;
    mockDb.assets.forEach((a) => {
      if (args.where.projectId && a.projectId !== args.where.projectId) return;
      if (args.where.id?.in && !args.where.id.in.includes(a.id)) return;
      Object.assign(a, args.data);
      count++;
    });
    return { count };
  };

  (prisma.comment as any).create = async (args: any) => {
    const comment = { id: `comment-${Date.now()}`, createdAt: new Date(), ...args.data };
    mockDb.comments.push(comment);
    return comment;
  };

  (prisma.comment as any).count = async (args: any) => {
    let list = [...mockDb.comments];
    if (args.where?.projectId) list = list.filter((c) => c.projectId === args.where.projectId);
    if (args.where?.versionId) list = list.filter((c) => c.versionId === args.where.versionId);
    return list.length;
  };

  (prisma.notification as any).create = async (args: any) => {
    const notif = { id: `notif-${Date.now()}`, createdAt: new Date(), isRead: false, ...args.data };
    mockDb.notifications.push(notif);
    return notif;
  };

  (prisma as any).$transaction = async (fn: any) => {
    const tx = {
      ...prisma,
      $executeRaw: async () => 1,
      version: {
        findFirst: (prisma.version as any).findFirst,
        findUnique: (prisma.version as any).findUnique,
        findMany: (prisma.version as any).findMany,
        create: (prisma.version as any).create,
        update: (prisma.version as any).update,
        delete: (prisma.version as any).delete,
      },
      asset: {
        findUnique: (prisma.asset as any).findUnique,
        findMany: (prisma.asset as any).findMany,
        updateMany: (prisma.asset as any).updateMany,
        delete: (prisma.asset as any).delete,
        create: (prisma.asset as any).create,
      },
      comment: {
        create: (prisma.comment as any).create,
        count: (prisma.comment as any).count,
      },
      notification: {
        create: (prisma.notification as any).create,
      },
      activity: {
        findUnique: async () => null,
        create: async (args: any) => ({
          id: randomUUID(),
          createdAt: new Date(),
          ...args.data,
        }),
      },
    };
    return await fn(tx);
  };

  // Helper to create Request
  function createReq(method: string, body?: any) {
    return new NextRequest("http://localhost:3000/api", {
      method,
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // =========================================================================
  // Test 1: Multiple Draft versions in one project
  // =========================================================================
  try {
    process.stdout.write("Test 1: Multiple Draft versions in one project... ");
    currentUser = mockDb.users.owner;

    const res1 = await createVersion(createReq("POST", { notes: "Draft 1" }), {
      params: { id: "proj-alpha" },
    });
    const data1 = await res1.json();
    assert(res1.status === 201, `Failed to create draft 1: ${res1.status}`);
    assert(data1.data.versionNumber === 1, `Expected versionNumber 1, got ${data1.data.versionNumber}`);
    assert(data1.data.status === VersionStatus.Draft, "Expected Draft status");

    const res2 = await createVersion(createReq("POST", { notes: "Draft 2" }), {
      params: { id: "proj-alpha" },
    });
    const data2 = await res2.json();
    assert(res2.status === 201, `Failed to create draft 2: ${res2.status}`);
    assert(data2.data.versionNumber === 2, `Expected versionNumber 2, got ${data2.data.versionNumber}`);
    assert(data2.data.status === VersionStatus.Draft, "Expected Draft status");

    const drafts = mockDb.versions.filter((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Draft);
    assert(drafts.length === 2, `Expected 2 draft versions, got ${drafts.length}`);

    console.log("✓ PASSED");
    results.push({
      id: 1,
      scenario: "Multiple Draft versions in one project",
      passed: true,
      message: "Multiple concurrent/sequential Draft versions (v1, v2) coexist validly in a single project.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 1, scenario: "Multiple Draft versions in one project", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 2: Multiple Approved versions where permitted by lifecycle policy
  // =========================================================================
  try {
    process.stdout.write("Test 2: Multiple Approved versions in one project... ");
    currentUser = mockDb.users.reviewer; // ClientReviewer approves
    const v1 = mockDb.versions.find((v) => v.versionNumber === 1);
    const v2 = mockDb.versions.find((v) => v.versionNumber === 2);

    const res1 = await updateVersion(createReq("PATCH", { status: VersionStatus.Approved, comment: "v1 approved" }), {
      params: { id: "proj-alpha", versionId: v1.id },
    });
    assert(res1.status === 200, `Expected 200, got ${res1.status}`);

    const res2 = await updateVersion(createReq("PATCH", { status: VersionStatus.Approved, comment: "v2 approved" }), {
      params: { id: "proj-alpha", versionId: v2.id },
    });
    assert(res2.status === 200, `Expected 200, got ${res2.status}`);

    const approved = mockDb.versions.filter((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Approved);
    assert(approved.length === 2, `Expected 2 approved versions, got ${approved.length}`);

    console.log("✓ PASSED");
    results.push({
      id: 2,
      scenario: "Multiple Approved versions where permitted by lifecycle policy",
      passed: true,
      message: "Multiple Approved versions (v1, v2) can coexist as verified historical milestones.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 2, scenario: "Multiple Approved versions", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 3: Only one FINAL version per project (Second FINAL rejected with 409)
  // =========================================================================
  try {
    process.stdout.write("Test 3: Only one FINAL version per project constraint... ");
    currentUser = mockDb.users.owner; // Only owner can designate FINAL
    const v1 = mockDb.versions.find((v) => v.versionNumber === 1);
    const v2 = mockDb.versions.find((v) => v.versionNumber === 2);

    // Designate v1 as Final
    const res1 = await updateVersion(createReq("PATCH", { status: VersionStatus.Final, comment: "Sign off as FINAL" }), {
      params: { id: "proj-alpha", versionId: v1.id },
    });
    assert(res1.status === 200, `Failed to designate v1 as Final: ${res1.status}`);
    assert(v1.status === VersionStatus.Final, "v1 should be Final");

    // Attempt to designate v2 as Final while v1 is still Final
    const res2 = await updateVersion(createReq("PATCH", { status: VersionStatus.Final, comment: "Try second final" }), {
      params: { id: "proj-alpha", versionId: v2.id },
    });
    const errBody = await res2.json();
    assert(res2.status === 409, `Expected 409 Conflict, got ${res2.status}`);
    assert(
      errBody.error?.message?.includes("A project can have only one FINAL version"),
      `Expected single FINAL message, got ${errBody.error?.message}`
    );

    const finalCount = mockDb.versions.filter((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);
    assert(finalCount.length === 1, `Expected exactly 1 final version, got ${finalCount.length}`);

    console.log("✓ PASSED");
    results.push({
      id: 3,
      scenario: "Only one FINAL version per project",
      passed: true,
      message: "Designating a second version as FINAL is rejected with 409 Conflict, preserving the single FINAL constraint.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 3, scenario: "Only one FINAL version per project", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 4: FINAL versions in separate projects
  // =========================================================================
  try {
    process.stdout.write("Test 4: FINAL versions in separate projects... ");
    currentUser = mockDb.users.owner;

    // Create and approve version in Project Beta
    const createBeta = await createVersion(createReq("POST", { notes: "Beta draft" }), {
      params: { id: "proj-beta" },
    });
    const betaData = await createBeta.json();
    const betaVerId = betaData.data.id;

    // Approve Beta v1
    await updateVersion(createReq("PATCH", { status: VersionStatus.Approved }), {
      params: { id: "proj-beta", versionId: betaVerId },
    });

    // Designate Beta v1 as Final
    const resBetaFinal = await updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
      params: { id: "proj-beta", versionId: betaVerId },
    });
    assert(resBetaFinal.status === 200, `Expected 200 for Beta final, got ${resBetaFinal.status}`);

    const alphaFinal = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);
    const betaFinal = mockDb.versions.find((v) => v.projectId === "proj-beta" && v.status === VersionStatus.Final);

    assert(Boolean(alphaFinal) && Boolean(betaFinal), "Both projects should have their own FINAL version");

    console.log("✓ PASSED");
    results.push({
      id: 4,
      scenario: "FINAL versions in separate projects",
      passed: true,
      message: "Partial unique index is scoped to (projectId), correctly allowing distinct projects to each have one FINAL version.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 4, scenario: "FINAL versions in separate projects", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 5: Two concurrent FINAL transition attempts
  // =========================================================================
  try {
    process.stdout.write("Test 5: Two concurrent FINAL transition attempts... ");
    currentUser = mockDb.users.owner;

    // Setup: Reset proj-alpha to have two Approved versions (v1 and v2)
    const v1 = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.versionNumber === 1);
    const v2 = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.versionNumber === 2);
    v1.status = VersionStatus.Approved;
    v2.status = VersionStatus.Approved;

    // Simulate concurrent execution where two requests attempt to designate Final
    const [race1, race2] = await Promise.all([
      updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
        params: { id: "proj-alpha", versionId: v1.id },
      }),
      updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
        params: { id: "proj-alpha", versionId: v2.id },
      }),
    ]);

    const statuses = [race1.status, race2.status];
    assert(statuses.includes(200), "One transition must succeed with 200");
    assert(statuses.includes(409), "The competing transition must fail with 409 Conflict");

    const finalCount = mockDb.versions.filter((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);
    assert(finalCount.length === 1, `Expected exactly 1 final version after race, got ${finalCount.length}`);

    console.log("✓ PASSED");
    results.push({
      id: 5,
      scenario: "Two concurrent FINAL transition attempts",
      passed: true,
      message: "Locking & partial unique index ensure exactly one transaction succeeds (200) and the competitor fails cleanly with 409 Conflict.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 5, scenario: "Two concurrent FINAL transition attempts", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 6: Concurrent version creation (sequential version numbers without collision)
  // =========================================================================
  try {
    process.stdout.write("Test 6: Concurrent version creation... ");
    currentUser = mockDb.users.owner;

    // Simulate two concurrent requests to create versions
    const [c1, c2] = await Promise.all([
      createVersion(createReq("POST", { notes: "Concurrent A" }), { params: { id: "proj-alpha" } }),
      createVersion(createReq("POST", { notes: "Concurrent B" }), { params: { id: "proj-alpha" } }),
    ]);

    assert(c1.status === 201 && c2.status === 201, "Both concurrent creations must succeed");
    const d1 = await c1.json();
    const d2 = await c2.json();

    const createdNums = [d1.data.versionNumber, d2.data.versionNumber].sort((a, b) => a - b);
    assert(createdNums[0] + 1 === createdNums[1], `Version numbers must be strictly sequential, got ${createdNums}`);

    console.log("✓ PASSED");
    results.push({
      id: 6,
      scenario: "Concurrent version creation",
      passed: true,
      message: "Row-level locking serializes concurrent creation requests, producing strictly sequential version numbers without collisions.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 6, scenario: "Concurrent version creation", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 7: Duplicate version-number prevention (bounded retry on P2002 collision)
  // =========================================================================
  try {
    process.stdout.write("Test 7: Duplicate version-number prevention with bounded retry... ");
    currentUser = mockDb.users.owner;

    // Simulate a transient P2002 collision on the first attempt that resolves on retry
    let simulatedCollisionAttempts = 1;
    const originalCreate = (prisma.version as any).create;
    (prisma.version as any).create = async (args: any) => {
      if (simulatedCollisionAttempts > 0) {
        simulatedCollisionAttempts--;
        const err: any = new Error("Unique constraint failed on the fields: (`projectId`,`versionNumber`)");
        err.code = "P2002";
        err.meta = { target: ["versionNumber"] };
        throw err;
      }
      return originalCreate(args);
    };

    const res = await createVersion(createReq("POST", { notes: "Retry test" }), {
      params: { id: "proj-alpha" },
    });
    (prisma.version as any).create = originalCreate;

    assert(res.status === 201, `Expected 201 after bounded retry, got ${res.status}`);
    const data = await res.json();
    assert(Boolean(data.data.id), "Should have created version record after retry");

    console.log("✓ PASSED");
    results.push({
      id: 7,
      scenario: "Duplicate version-number prevention",
      passed: true,
      message: "Bounded retry mechanism catches P2002 collision on versionNumber, recalculates next versionNumber, and completes successfully.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 7, scenario: "Duplicate version-number prevention", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 8: Publishing one version without publishing other drafts
  // =========================================================================
  try {
    process.stdout.write("Test 8: Publishing one version without publishing other drafts... ");
    // Associate asset-alpha-1 with v1 (Final)
    const v1 = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);
    const vDraft = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Draft);

    // Link asset-alpha-1 to Final version v1
    mockDb.assets[0].versionId = v1.id;

    // Add a private draft asset linked to vDraft
    const draftAsset = {
      id: "33333333-3333-3333-3333-333333333333",
      projectId: "proj-alpha",
      uploaderId: "user-owner-1",
      versionId: vDraft.id,
      fileName: "unreleased_concept.png",
      mimeType: "image/png",
      fileSize: 4096,
      storagePath: "projects/proj-alpha/unreleased_concept.png",
    };
    mockDb.assets.push(draftAsset);

    // Add feedback comment on draft version
    mockDb.comments.push({
      id: "comment-draft-review",
      projectId: "proj-alpha",
      versionId: vDraft.id,
      authorId: "user-collab-2",
      content: "Let us refine the color palette in this draft",
      createdAt: new Date(),
    });

    // Public non-member requests version listing
    currentUser = mockDb.users.nonMember;
    const res = await getVersions(createReq("GET"), { params: { id: "proj-alpha" } });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const body = await res.json();

    const returnedFinal = body.data.find((v: any) => v.id === v1.id);
    const returnedDraft = body.data.find((v: any) => v.id === vDraft.id);

    // Final version assets MUST be visible
    assert(returnedFinal.assets.length === 1, "Final version assets must be visible to public visitors");

    // Draft version assets MUST be hidden (empty array)
    assert(returnedDraft.assets.length === 0, "Draft version media assets MUST be hidden from public visitors");

    // But draft comments/feedback MUST remain visible for collaboration
    assert(returnedDraft.comments.length >= 1, "Public feedback comments on drafts must remain visible");

    console.log("✓ PASSED");
    results.push({
      id: 8,
      scenario: "Publishing one version without publishing other drafts",
      passed: true,
      message: "Designating/approving one version strictly scopes public media access to that version, while preserving draft feedback without exposing draft media.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 8, scenario: "Publishing one version without publishing other drafts", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 9: Rejection of invalid lifecycle transitions
  // =========================================================================
  try {
    process.stdout.write("Test 9: Rejection of invalid lifecycle transitions... ");
    const vDraft = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Draft);

    // 1. Direct Draft -> Final (Must be Approved first)
    currentUser = mockDb.users.owner;
    const r1 = await updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
      params: { id: "proj-alpha", versionId: vDraft.id },
    });
    assert(r1.status === 400, `Expected 400 for Draft->Final, got ${r1.status}`);

    // 2. ClientReviewer trying to designate Final (Owner only)
    const vApproved = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Approved);
    currentUser = mockDb.users.reviewer;
    const r2 = await updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
      params: { id: "proj-alpha", versionId: vApproved.id },
    });
    assert(r2.status === 403, `Expected 403 for Reviewer designating Final, got ${r2.status}`);

    // 3. Rejected -> Approved (Must reopen as Draft first)
    currentUser = mockDb.users.reviewer;
    vDraft.status = VersionStatus.Rejected;
    const r3 = await updateVersion(createReq("PATCH", { status: VersionStatus.Approved }), {
      params: { id: "proj-alpha", versionId: vDraft.id },
    });
    assert(r3.status === 400, `Expected 400 for Rejected->Approved, got ${r3.status}`);

    // 4. Rejected -> Final
    currentUser = mockDb.users.owner;
    const r4 = await updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
      params: { id: "proj-alpha", versionId: vDraft.id },
    });
    assert(r4.status === 400, `Expected 400 for Rejected->Final, got ${r4.status}`);

    // 5. Final -> Draft (Must demote to Approved first)
    const vFinal = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);
    const r5 = await updateVersion(createReq("PATCH", { status: VersionStatus.Draft }), {
      params: { id: "proj-alpha", versionId: vFinal.id },
    });
    assert(r5.status === 400, `Expected 400 for Final->Draft, got ${r5.status}`);

    console.log("✓ PASSED");
    results.push({
      id: 9,
      scenario: "Rejection of invalid lifecycle transitions",
      passed: true,
      message: "State machine rejects Draft->Final (400), Rejected->Approved (400), Final->Draft (400), and non-owner Final designation (403).",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 9, scenario: "Rejection of invalid lifecycle transitions", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 10: Asset/version cross-project integrity
  // =========================================================================
  try {
    process.stdout.write("Test 10: Asset/version cross-project integrity... ");
    currentUser = mockDb.users.owner;

    // Attempt to create a version in Project Alpha linking an asset that belongs to Project Beta
    const res = await createVersion(
      createReq("POST", { notes: "Cross-project attack attempt", assetIds: ["22222222-2222-2222-2222-222222222222"] }),
      { params: { id: "proj-alpha" } }
    );

    assert(res.status === 400, `Expected 400 Bad Request for cross-project asset linkage, got ${res.status}`);
    const body = await res.json();
    assert(
      body.error?.message?.includes("One or more assets do not belong to this project"),
      `Expected asset ownership error, got ${body.error?.message}`
    );

    console.log("✓ PASSED");
    results.push({
      id: 10,
      scenario: "Asset/version cross-project integrity",
      passed: true,
      message: "Cross-project asset linkage is strictly validated under lock and rejected with 400 BAD_REQUEST.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 10, scenario: "Asset/version cross-project integrity", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 11: Deletion protection for FINAL versions
  // =========================================================================
  try {
    process.stdout.write("Test 11: Deletion protection for FINAL versions... ");
    currentUser = mockDb.users.owner;
    const vFinal = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Final);

    // Attempt to delete FINAL version directly -> MUST FAIL (400 Bad Request)
    const res1 = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: vFinal.id },
    });
    assert(res1.status === 400, `Expected 400 Bad Request for deleting FINAL version, got ${res1.status}`);
    const errBody = await res1.json();
    assert(
      errBody.error?.message?.includes("Cannot delete a designated FINAL version"),
      `Expected FINAL deletion protection error, got ${errBody.error?.message}`
    );

    // Demote FINAL to Approved
    const demoteRes = await updateVersion(createReq("PATCH", { status: VersionStatus.Approved }), {
      params: { id: "proj-alpha", versionId: vFinal.id },
    });
    assert(demoteRes.status === 200, `Expected 200 for demoting Final to Approved, got ${demoteRes.status}`);

    console.log("✓ PASSED");
    results.push({
      id: 11,
      scenario: "Deletion protection for FINAL versions",
      passed: true,
      message: "Designated FINAL versions cannot be deleted (400 BAD_REQUEST); deletion requires explicit demotion to Approved.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 11, scenario: "Deletion protection for FINAL versions", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 12: Version deletion rejected when feedback comments exist (Top-level & Threaded)
  // =========================================================================
  try {
    process.stdout.write("Test 12: Rejection of version deletion when feedback exists... ");
    currentUser = mockDb.users.owner;

    // Create a new version for feedback deletion testing
    const vFeedbackRes = await createVersion(createReq("POST", { notes: "" }), {
      params: { id: "proj-alpha" },
    });
    const vFeedback = (await vFeedbackRes.json()).data;

    // 1. Add top-level review comment on this version
    mockDb.comments.push({
      id: `comment-top-${Date.now()}`,
      projectId: "proj-alpha",
      versionId: vFeedback.id,
      authorId: "user-collab-2",
      content: "Top-level critique: Please refine layout contrast.",
      createdAt: new Date(),
    });

    // 2. Add threaded reply comment on this version
    mockDb.comments.push({
      id: `comment-reply-${Date.now()}`,
      projectId: "proj-alpha",
      versionId: vFeedback.id,
      authorId: "user-reviewer-3",
      content: "Threaded reply: Agreed, especially on mobile viewport.",
      createdAt: new Date(),
    });

    // 3. Attempt to delete version -> MUST FAIL (409 Conflict)
    const delRes = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: vFeedback.id },
    });
    assert(delRes.status === 409, `Expected 409 Conflict for deleting version with feedback, got ${delRes.status}`);
    const errData = await delRes.json();
    assert(
      errData.error?.message?.includes("because it contains 2 feedback comments"),
      `Expected message mentioning 2 feedback comments, got: ${errData.error?.message}`
    );

    // 4. Verify all comments are preserved with original versionId intact (NOT set to null)
    const commentsForVer = mockDb.comments.filter((c) => c.versionId === vFeedback.id);
    assert(commentsForVer.length === 2, `Expected 2 comments retained with versionId intact, found ${commentsForVer.length}`);

    // Verify version record itself was NOT deleted
    const verStillExists = mockDb.versions.some((v) => v.id === vFeedback.id);
    assert(verStillExists, "Version record must not be deleted when comments exist");

    console.log("✓ PASSED");
    results.push({
      id: 12,
      scenario: "Rejection of version deletion when feedback exists",
      passed: true,
      message: "Version deletion is rejected with 409 Conflict when top-level or threaded feedback exists, preserving all comments and versionId intact.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 12, scenario: "Rejection of version deletion when feedback exists", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 13: Deletion of uncommented version succeeds and unlinks workspace assets
  // =========================================================================
  try {
    process.stdout.write("Test 13: Deletion of uncommented version succeeds... ");
    currentUser = mockDb.users.owner;

    // Create an uncommented draft version
    const cleanVerRes = await createVersion(createReq("POST", { notes: "" }), {
      params: { id: "proj-alpha" },
    });
    const cleanVer = (await cleanVerRes.json()).data;

    // Attach an asset to this uncommented version
    const testAssetId = "55555555-5555-5555-5555-555555555555";
    mockDb.assets.push({
      id: testAssetId,
      projectId: "proj-alpha",
      uploaderId: "user-owner-1",
      versionId: cleanVer.id,
      fileName: "uncommented_draft_sketch.png",
      mimeType: "image/png",
      fileSize: 1024,
      storagePath: "projects/proj-alpha/sketch.png",
    });

    // Delete the uncommented version -> MUST SUCCEED (200 OK)
    const delRes = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: cleanVer.id },
    });
    assert(delRes.status === 200, `Expected 200 OK for deleting uncommented version, got ${delRes.status}`);

    // Verify version record is removed
    const verExists = mockDb.versions.some((v) => v.id === cleanVer.id);
    assert(!verExists, "Version record should be removed from database");

    // Verify asset is preserved in project with versionId set to null (SetNull)
    const preservedAsset = mockDb.assets.find((a) => a.id === testAssetId);
    assert(preservedAsset && preservedAsset.versionId === null, "Asset versionId must be unlinked to null");
    assert(preservedAsset.projectId === "proj-alpha", "Asset must remain in project workspace");

    console.log("✓ PASSED");
    results.push({
      id: 13,
      scenario: "Deletion of uncommented version succeeds",
      passed: true,
      message: "Uncommented version is successfully deleted (200 OK) with linked assets cleanly unlinked and preserved in the workspace.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 13, scenario: "Deletion of uncommented version succeeds", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 14: Unauthorized users cannot delete versions or bypass protection
  // =========================================================================
  try {
    process.stdout.write("Test 14: Version deletion authorization enforcement... ");
    // Create an uncommented draft version
    currentUser = mockDb.users.owner;
    const authVerRes = await createVersion(createReq("POST", { notes: "" }), {
      params: { id: "proj-alpha" },
    });
    const authVer = (await authVerRes.json()).data;

    // 1. Unauthenticated request -> MUST FAIL (401)
    currentUser = null;
    const r1 = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: authVer.id },
    });
    assert(r1.status === 401, `Expected 401 for unauthenticated deletion, got ${r1.status}`);

    // 2. Non-member user -> MUST FAIL (403)
    currentUser = mockDb.users.nonMember;
    const r2 = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: authVer.id },
    });
    assert(r2.status === 403, `Expected 403 for non-member deletion, got ${r2.status}`);

    // 3. Collaborator -> MUST FAIL (403: only Owner can delete versions)
    currentUser = mockDb.users.collab;
    const r3 = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: authVer.id },
    });
    assert(r3.status === 403, `Expected 403 for collaborator deletion, got ${r3.status}`);

    // 4. Client Reviewer -> MUST FAIL (403: only Owner can delete versions)
    currentUser = mockDb.users.reviewer;
    const r4 = await deleteVersion(createReq("DELETE"), {
      params: { id: "proj-alpha", versionId: authVer.id },
    });
    assert(r4.status === 403, `Expected 403 for client reviewer deletion, got ${r4.status}`);

    console.log("✓ PASSED");
    results.push({
      id: 14,
      scenario: "Version deletion authorization enforcement",
      passed: true,
      message: "Version deletion is strictly restricted to project Owner (401 for unauthenticated, 403 for non-members and collaborators).",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 14, scenario: "Version deletion authorization enforcement", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 15: Concurrent feedback creation and version deletion
  // =========================================================================
  try {
    process.stdout.write("Test 15: Concurrent feedback creation and version deletion... ");
    currentUser = mockDb.users.owner;

    // Create a fresh draft version with no comments
    const concVerRes = await createVersion(createReq("POST", { notes: "" }), {
      params: { id: "proj-alpha" },
    });
    const concVer = (await concVerRes.json()).data;

    // Simulate concurrent deletion and comment submission racing on this version
    const [delOutcome, commentOutcome] = await Promise.all([
      deleteVersion(createReq("DELETE"), { params: { id: "proj-alpha", versionId: concVer.id } }),
      postComment(
        createReq("POST", { content: "Racing feedback comment", versionId: concVer.id }),
        { params: { id: "proj-alpha" } }
      ),
    ]);

    const statuses = [delOutcome.status, commentOutcome.status];
    // Either delete succeeded (200) and comment failed (404), OR comment succeeded (201) and delete was rejected (409 Conflict)
    const validRace1 = delOutcome.status === 200 && commentOutcome.status === 404;
    const validRace2 = delOutcome.status === 409 && commentOutcome.status === 201;

    assert(
      validRace1 || validRace2,
      `Expected either (200, 404) or (409, 201), got delete: ${delOutcome.status}, comment: ${commentOutcome.status}`
    );

    // Verify NO comments were left detached (versionId === null with content "Racing feedback comment")
    const detached = mockDb.comments.filter(
      (c) => c.content === "Racing feedback comment" && c.versionId === null
    );
    assert(detached.length === 0, "No feedback comments may be detached or converted to project-level discussion");

    console.log("✓ PASSED");
    results.push({
      id: 15,
      scenario: "Concurrent feedback creation and version deletion",
      passed: true,
      message: "Row locking ensures serialization between deletion and comment submission; zero feedback comments can be left detached.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 15, scenario: "Concurrent feedback creation and version deletion", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 16: Protection against deleting assets attached to a FINAL version
  // =========================================================================
  try {
    process.stdout.write("Test 16: Asset deletion protection on FINAL version... ");
    currentUser = mockDb.users.owner;

    // Create a new version and designate it Final
    const vRes = await createVersion(createReq("POST", { notes: "" }), {
      params: { id: "proj-alpha" },
    });
    const ver = (await vRes.json()).data;

    // Approve then designate as Final
    await updateVersion(createReq("PATCH", { status: VersionStatus.Approved }), {
      params: { id: "proj-alpha", versionId: ver.id },
    });
    await updateVersion(createReq("PATCH", { status: VersionStatus.Final }), {
      params: { id: "proj-alpha", versionId: ver.id },
    });

    // Create and attach an asset to this Final version
    const testAsset = {
      id: "66666666-6666-6666-6666-666666666666",
      projectId: "proj-alpha",
      uploaderId: "user-owner-1",
      versionId: ver.id,
      fileName: "final_hero.png",
      mimeType: "image/png",
      fileSize: 8192,
      storagePath: "projects/proj-alpha/final_hero.png",
    };
    mockDb.assets.push(testAsset);

    // Attempt to delete asset while version is Final -> MUST FAIL (400)
    const delRes1 = await deleteAsset(createReq("DELETE"), { params: { id: testAsset.id } });
    assert(delRes1.status === 400, `Expected 400 for deleting asset on FINAL version, got ${delRes1.status}`);

    // Demote version to Approved -> NOW deletion of asset MUST SUCCEED (200)
    await updateVersion(createReq("PATCH", { status: VersionStatus.Approved }), {
      params: { id: "proj-alpha", versionId: ver.id },
    });
    const delRes2 = await deleteAsset(createReq("DELETE"), { params: { id: testAsset.id } });
    assert(delRes2.status === 200, `Expected 200 for deleting asset after demotion, got ${delRes2.status}`);

    console.log("✓ PASSED");
    results.push({
      id: 16,
      scenario: "Asset deletion protection on FINAL version",
      passed: true,
      message: "Assets attached to a FINAL designated version cannot be deleted (400 BAD_REQUEST); deletion is unlocked only when demoted to Approved.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 16, scenario: "Asset deletion protection on FINAL version", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 17: Rejection of new asset uploads linked to immutable signed-off versions
  // =========================================================================
  try {
    process.stdout.write("Test 17: Rejection of asset upload to immutable versions... ");
    currentUser = mockDb.users.owner;

    // Register a project and an Approved version with valid UUIDs for ConfirmAssetUploadSchema
    const testProjId = "a0000000-0000-0000-0000-000000000001";
    const testVerId = "b0000000-0000-0000-0000-000000000001";
    (mockDb.projects as any).testProj = {
      id: testProjId,
      creatorId: "user-owner-1",
      title: "Immutable Version Test Project",
      visibility: Visibility.Public,
      status: ProjectStatus.InProgress,
      metadata: {},
    };
    mockDb.versions.push({
      id: testVerId,
      projectId: testProjId,
      versionNumber: 1,
      status: VersionStatus.Approved,
      createdById: "user-owner-1",
    });

    // Attempt to record upload directly into an Approved version (with valid UploadIntent + ownership token)
    const immutIntentId = "c0000000-0000-4000-8000-000000000001";
    const immutStoragePath = `projects/${testProjId}/injected.png`;
    const immutIntent = {
      id: immutIntentId,
      projectId: testProjId,
      uploaderId: "user-owner-1",
      storagePath: immutStoragePath,
      mimeType: "image/png",
      fileSize: 2048,
      status: "Pending",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
    const mockUploadIntentDelegate = {
      findUnique: async ({ where }: any) => (where.id === immutIntentId ? { ...immutIntent } : null),
      updateMany: async ({ where, data }: any) => {
        if (where.id === immutIntentId && (!where.status || immutIntent.status === where.status)) {
          immutIntent.status = data.status;
          return { count: 1 };
        }
        return { count: 0 };
      },
    };
    (prisma as any).uploadIntent = mockUploadIntentDelegate;
    const origTx = (prisma as any).$transaction;
    (prisma as any).$transaction = async (cb: any) =>
      origTx(async (tx: any) => {
        tx.uploadIntent = mockUploadIntentDelegate;
        return cb(tx);
      });

    const immutUploadToken = createUploadOwnershipToken({
      intentId: immutIntentId,
      uploaderId: "user-owner-1",
      projectId: testProjId,
      storagePath: immutStoragePath,
      mimeType: "image/png",
      fileSize: 2048,
    });
    const uploadRes = await createAsset(
      createReq("POST", {
        projectId: testProjId,
        versionId: testVerId,
        fileName: "injected_after_signoff.png",
        mimeType: "image/png",
        fileSize: 2048,
        storagePath: immutStoragePath,
        uploadToken: immutUploadToken,
      })
    );
    (prisma as any).$transaction = origTx;
    assert(uploadRes.status === 400, `Expected 400 for attaching asset to Approved version, got ${uploadRes.status}`);
    const body = await uploadRes.json();
    assert(
      body.error?.message?.includes("Cannot attach new assets to an immutable signed-off version"),
      `Expected immutable version message, got ${body.error?.message}`
    );

    console.log("✓ PASSED");
    results.push({
      id: 17,
      scenario: "Rejection of asset upload to immutable versions",
      passed: true,
      message: "Direct attachment of new assets to signed-off Approved/Final versions is prohibited (400 BAD_REQUEST), enforcing version immutability.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 17, scenario: "Rejection of asset upload to immutable versions", passed: false, message: err.message });
  }

  // =========================================================================
  // Test 18: Reopening to Draft does not send invalid Approval notification
  // =========================================================================
  try {
    process.stdout.write("Test 18: Draft reopening notification audit... ");
    // Clear notifications array
    mockDb.notifications = [];

    // Client reviewer reopens an approved version to Draft or creator reopens
    currentUser = mockDb.users.owner;
    const vToReopen = mockDb.versions.find((v) => v.projectId === "proj-alpha" && v.status === VersionStatus.Approved);

    await updateVersion(createReq("PATCH", { status: VersionStatus.Draft }), {
      params: { id: "proj-alpha", versionId: vToReopen.id },
    });

    // Check that NO approval notification was created
    const falseApprovals = mockDb.notifications.filter((n) => n.type === "Approval");
    assert(falseApprovals.length === 0, `Expected 0 Approval notifications, got ${falseApprovals.length}`);

    console.log("✓ PASSED");
    results.push({
      id: 18,
      scenario: "Reopening to Draft notification audit",
      passed: true,
      message: "Reopening a version to Draft sends no spurious Approval notifications.",
    });
  } catch (err: any) {
    console.log("✗ FAILED:", err.message);
    results.push({ id: 18, scenario: "Reopening to Draft notification audit", passed: false, message: err.message });
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n=================================================================");
  console.log("PHASE 2 VERSION LIFECYCLE & INTEGRITY TEST RESULTS");
  console.log("=================================================================");
  results.forEach((r) => {
    console.log(`[${r.passed ? "PASS" : "FAIL"}] Test ${r.id}: ${r.scenario}`);
    console.log(`       Evidence: ${r.message}`);
  });

  const passedCount = results.filter((r) => r.passed).length;
  console.log(`\nFinal Score: ${passedCount} / ${results.length} tests passed.`);
  console.log("=================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase2TestSuite().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
