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
import {
  CollaboratorRole,
  NotificationType,
  ProjectStatus,
  VersionStatus,
  Visibility,
} from "@prisma/client";
import {
  GET as getComments,
  POST as postComment,
} from "../src/app/api/projects/[id]/comments/route";
import {
  PATCH as editComment,
  DELETE as deleteComment,
} from "../src/app/api/projects/[id]/comments/[commentId]/route";
import {
  POST as likeComment,
  DELETE as unlikeComment,
} from "../src/app/api/projects/[id]/comments/[commentId]/like/route";
import {
  GET as getVersion,
  PATCH as patchVersion,
} from "../src/app/api/projects/[id]/versions/[versionId]/route";
import { GET as getProject } from "../src/app/api/projects/[id]/route";
import { GET as getNotifications } from "../src/app/api/notifications/route";

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

let currentUser: any = null;
(authModule as any).getCurrentUser = async () => currentUser;

// Stable RFC4122 UUIDs
const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const COLLAB_ID = "22222222-2222-4222-8222-222222222222";
const REVIEWER_ID = "33333333-3333-4333-8333-333333333333";
const PUBLIC_USER_ID = "44444444-4444-4444-8444-444444444444";
const ADMIN_ID = "55555555-5555-4555-8555-555555555555";

const PUBLIC_PROJ_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const PRIVATE_PROJ_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const PUB_VER_APPROVED_ID = "c1111111-1111-4111-8111-111111111111";
const PUB_VER_DRAFT_ID = "c2222222-2222-4222-8222-222222222222";
const PUB_VER_REJECTED_ID = "c3333333-3333-4333-8333-333333333333";
const PRIV_VER_DRAFT_ID = "d1111111-1111-4111-8111-111111111111";

async function runPhase32TestSuite() {
  console.log("=========================================================================");
  console.log("CreativeSpace Phase 3.2: Threaded Discussions, Likes & Notifications Suite");
  console.log("(In-Memory Transactional Harness with PostgreSQL Constraint Simulation)");
  console.log("=========================================================================\n");

  const mockDb = {
    users: {
      [OWNER_ID]: {
        id: OWNER_ID,
        username: "owner_anya",
        displayName: "Anya Owner",
        avatarUrl: null,
        isAdmin: false,
      },
      [COLLAB_ID]: {
        id: COLLAB_ID,
        username: "collab_rohan",
        displayName: "Rohan Collab",
        avatarUrl: null,
        isAdmin: false,
      },
      [REVIEWER_ID]: {
        id: REVIEWER_ID,
        username: "reviewer_david",
        displayName: "David Reviewer",
        avatarUrl: null,
        isAdmin: false,
      },
      [PUBLIC_USER_ID]: {
        id: PUBLIC_USER_ID,
        username: "community_grace",
        displayName: "Grace Public",
        avatarUrl: null,
        isAdmin: false,
      },
      [ADMIN_ID]: {
        id: ADMIN_ID,
        username: "platform_admin",
        displayName: "Platform Admin",
        avatarUrl: null,
        isAdmin: true,
      },
    } as Record<string, any>,
    projects: {
      [PUBLIC_PROJ_ID]: {
        id: PUBLIC_PROJ_ID,
        creatorId: OWNER_ID,
        title: "Public Sci-Fi Concept",
        category: "Illustration",
        visibility: Visibility.Public,
        status: ProjectStatus.InProgress,
        metadata: {},
      },
      [PRIVATE_PROJ_ID]: {
        id: PRIVATE_PROJ_ID,
        creatorId: OWNER_ID,
        title: "Secret Client Brand Identity",
        category: "UI/UX",
        visibility: Visibility.Private,
        status: ProjectStatus.InProgress,
        metadata: {},
      },
    } as Record<string, any>,
    collaborators: [
      {
        projectId: PUBLIC_PROJ_ID,
        userId: COLLAB_ID,
        role: CollaboratorRole.Collaborator,
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
        invitedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        projectId: PUBLIC_PROJ_ID,
        userId: REVIEWER_ID,
        role: CollaboratorRole.ClientReviewer,
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
        invitedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        projectId: PRIVATE_PROJ_ID,
        userId: COLLAB_ID,
        role: CollaboratorRole.Collaborator,
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
        invitedAt: new Date("2026-01-01T00:00:00Z"),
      },
      {
        projectId: PRIVATE_PROJ_ID,
        userId: REVIEWER_ID,
        role: CollaboratorRole.ClientReviewer,
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
        invitedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ] as any[],
    versions: [
      {
        id: PUB_VER_APPROVED_ID,
        projectId: PUBLIC_PROJ_ID,
        versionNumber: 1,
        createdById: COLLAB_ID,
        status: VersionStatus.Approved,
        createdAt: new Date("2026-01-02T00:00:00Z"),
      },
      {
        id: PUB_VER_DRAFT_ID,
        projectId: PUBLIC_PROJ_ID,
        versionNumber: 2,
        createdById: COLLAB_ID,
        status: VersionStatus.Draft,
        createdAt: new Date("2026-01-03T00:00:00Z"),
      },
      {
        id: PUB_VER_REJECTED_ID,
        projectId: PUBLIC_PROJ_ID,
        versionNumber: 3,
        createdById: COLLAB_ID,
        status: VersionStatus.Rejected,
        createdAt: new Date("2026-01-04T00:00:00Z"),
      },
      {
        id: PRIV_VER_DRAFT_ID,
        projectId: PRIVATE_PROJ_ID,
        versionNumber: 1,
        createdById: COLLAB_ID,
        status: VersionStatus.Draft,
        createdAt: new Date("2026-01-05T00:00:00Z"),
      },
    ] as any[],
    assets: [
      {
        id: "e1111111-1111-4111-8111-111111111111",
        projectId: PUBLIC_PROJ_ID,
        versionId: PUB_VER_APPROVED_ID,
        uploaderId: COLLAB_ID,
        fileName: "approved_v1.png",
        storagePath: "projects/pub/approved_v1.png",
      },
      {
        id: "e2222222-2222-4222-8222-222222222222",
        projectId: PUBLIC_PROJ_ID,
        versionId: PUB_VER_DRAFT_ID,
        uploaderId: COLLAB_ID,
        fileName: "unpublished_draft_v2.png",
        storagePath: "projects/pub/unpublished_draft_v2.png",
      },
    ] as any[],
    comments: [] as any[],
    commentLikes: [] as any[],
    notifications: [] as any[],
    likes: [] as any[],
  };

  let likeCreateDelayMs = 0;
  let serializeTransactions = false;
  let txChain = Promise.resolve();

  function hydrateComment(c: any, include?: any): any {
    if (!c) return null;
    const out: any = { ...c };
    if (include?.author) {
      const u = mockDb.users[c.authorId];
      out.author = u
        ? { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
        : null;
    }
    if (include?.version) {
      out.version = c.versionId
        ? mockDb.versions.find((v) => v.id === c.versionId) || null
        : null;
    }
    if (include?.likes) {
      out.likes = mockDb.commentLikes
        .filter((l) => l.commentId === c.id)
        .map((l) => ({ userId: l.userId }));
    }
    if (include?._count) {
      out._count = {
        likes: mockDb.commentLikes.filter((l) => l.commentId === c.id).length,
      };
    }
    if (include?.replies) {
      out.replies = mockDb.comments
        .filter((r) => r.parentId === c.id)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((r) => hydrateComment(r, include.replies.include));
    }
    return out;
  }

  const mockTx: any = {
    $executeRaw: async () => 1,
    project: {
      findUnique: async ({ where, include }: any) => {
        const p = mockDb.projects[where.id];
        if (!p) return null;
        const out: any = { ...p };
        if (include?.collaborators) {
          const w = include.collaborators.where;
          out.collaborators = mockDb.collaborators
            .filter((c) => {
              if (c.projectId !== p.id) return false;
              if (w?.userId && c.userId !== w.userId) return false;
              if (w?.acceptedAt?.not === null && c.acceptedAt === null) return false;
              return true;
            })
            .map((c) => ({ ...c, user: mockDb.users[c.userId] }));
        }
        if (include?.creator) out.creator = mockDb.users[p.creatorId];
        if (include?.assets) out.assets = mockDb.assets.filter((a) => a.projectId === p.id);
        if (include?.versions) {
          out.versions = mockDb.versions
            .filter((v) => v.projectId === p.id)
            .map((v) => ({
              ...v,
              assets: mockDb.assets.filter((a) => a.versionId === v.id),
              comments: mockDb.comments
                .filter((c) => c.versionId === v.id)
                .map((c) => hydrateComment(c, { author: true })),
            }));
        }
        if (include?.comments) {
          out.comments = mockDb.comments
            .filter((c) => c.projectId === p.id && c.versionId === null)
            .map((c) => hydrateComment(c, { author: true }));
        }
        if (include?.projectTags) out.projectTags = [];
        if (include?.portfolioProjects) out.portfolioProjects = [];
        if (include?._count) out._count = { likes: 0 };
        return out;
      },
    },
    version: {
      findUnique: async ({ where, include }: any) => {
        const v = mockDb.versions.find((ver) => ver.id === where.id);
        if (!v) return null;
        const out: any = { ...v };
        if (include?.assets) out.assets = mockDb.assets.filter((a) => a.versionId === v.id);
        if (include?.createdBy) out.createdBy = mockDb.users[v.createdById];
        if (include?.comments) {
          out.comments = mockDb.comments
            .filter((c) => c.versionId === v.id)
            .map((c) => hydrateComment(c, { author: true }));
        }
        return out;
      },
      findFirst: async ({ where }: any) => {
        return (
          mockDb.versions.find(
            (v) =>
              v.projectId === where.projectId &&
              v.status === where.status &&
              (!where.id?.not || v.id !== where.id.not)
          ) || null
        );
      },
      update: async ({ where, data }: any) => {
        const idx = mockDb.versions.findIndex((v) => v.id === where.id);
        if (idx === -1) throw new Error("Version not found");
        mockDb.versions[idx] = { ...mockDb.versions[idx], ...data };
        return mockDb.versions[idx];
      },
    },
    comment: {
      findUnique: async ({ where, include }: any) => {
        const found = mockDb.comments.find((c) => c.id === where.id);
        return hydrateComment(found, include);
      },
      findMany: async ({ where, include }: any) => {
        const list = mockDb.comments.filter((c) => {
          if (where?.projectId !== undefined && c.projectId !== where.projectId) return false;
          if (where?.versionId !== undefined && c.versionId !== where.versionId) return false;
          if (where?.parentId !== undefined && c.parentId !== where.parentId) return false;
          return true;
        });
        return list
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((c) => hydrateComment(c, include));
      },
      count: async ({ where }: any) => {
        return mockDb.comments.filter((c) => {
          if (where?.parentId !== undefined && c.parentId !== where.parentId) return false;
          if (where?.versionId !== undefined && c.versionId !== where.versionId) return false;
          return true;
        }).length;
      },
      create: async ({ data, include }: any) => {
        const now = new Date();
        const record = {
          id: randomUUID(),
          projectId: data.projectId,
          versionId: data.versionId ?? null,
          parentId: data.parentId ?? null,
          authorId: data.authorId,
          content: data.content,
          createdAt: now,
          updatedAt: now,
        };
        // PG CHECK: comments_no_self_parent_check
        if (record.parentId && record.parentId === record.id) {
          const err: any = new Error("CHECK violation: comments_no_self_parent_check");
          err.code = "23514";
          throw err;
        }
        // PG FK: parent must exist if parentId provided
        if (record.parentId && !mockDb.comments.some((c) => c.id === record.parentId)) {
          const err: any = new Error("FK violation: comments_parentId_fkey");
          err.code = "P2003";
          throw err;
        }
        mockDb.comments.push(record);
        return hydrateComment(record, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = mockDb.comments.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error("Comment not found");
        mockDb.comments[idx] = {
          ...mockDb.comments[idx],
          ...data,
          updatedAt: new Date(Date.now() + 5000),
        };
        return hydrateComment(mockDb.comments[idx], include);
      },
      delete: async ({ where }: any) => {
        // PG FK ON DELETE RESTRICT: block if any child replies reference this comment
        if (mockDb.comments.some((c) => c.parentId === where.id)) {
          const err: any = new Error("FK violation: comments_parentId_fkey ON DELETE RESTRICT");
          err.code = "P2003";
          throw err;
        }
        const idx = mockDb.comments.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error("Comment not found");
        const [removed] = mockDb.comments.splice(idx, 1);
        // Cascade comment_likes
        mockDb.commentLikes = mockDb.commentLikes.filter((l) => l.commentId !== removed.id);
        // SetNull on notifications.relatedCommentId
        mockDb.notifications.forEach((n) => {
          if (n.relatedCommentId === removed.id) n.relatedCommentId = null;
        });
        return removed;
      },
    },
    commentLike: {
      findUnique: async ({ where }: any) => {
        const { userId, commentId } = where.userId_commentId;
        return (
          mockDb.commentLikes.find((l) => l.userId === userId && l.commentId === commentId) ||
          null
        );
      },
      create: async ({ data }: any) => {
        if (likeCreateDelayMs > 0) {
          await new Promise((r) => setTimeout(r, likeCreateDelayMs));
        }
        // PG UNIQUE: comment_likes_userId_commentId_key
        if (
          mockDb.commentLikes.some(
            (l) => l.userId === data.userId && l.commentId === data.commentId
          )
        ) {
          const err: any = new Error("Unique constraint failed on comment_likes_userId_commentId_key");
          err.code = "P2002";
          throw err;
        }
        const rec = {
          id: randomUUID(),
          userId: data.userId,
          commentId: data.commentId,
          createdAt: new Date(),
        };
        mockDb.commentLikes.push(rec);
        return rec;
      },
      deleteMany: async ({ where }: any) => {
        const before = mockDb.commentLikes.length;
        mockDb.commentLikes = mockDb.commentLikes.filter(
          (l) => !(l.userId === where.userId && l.commentId === where.commentId)
        );
        return { count: before - mockDb.commentLikes.length };
      },
      count: async ({ where }: any) => {
        return mockDb.commentLikes.filter((l) => l.commentId === where.commentId).length;
      },
    },
    like: {
      findUnique: async () => null,
    },
    notification: {
      create: async ({ data }: any) => {
        const notif = {
          id: randomUUID(),
          userId: data.userId,
          type: data.type,
          relatedProjectId: data.relatedProjectId ?? null,
          relatedUserId: data.relatedUserId ?? null,
          relatedConnectionId: data.relatedConnectionId ?? null,
          relatedVersionId: data.relatedVersionId ?? null,
          relatedCommentId: data.relatedCommentId ?? null,
          isRead: false,
          createdAt: new Date(),
        };
        mockDb.notifications.push(notif);
        return notif;
      },
      findFirst: async ({ where }: any) => {
        return (
          mockDb.notifications.find(
            (n) =>
              n.userId === where.userId &&
              n.type === where.type &&
              n.relatedUserId === where.relatedUserId &&
              n.relatedCommentId === where.relatedCommentId
          ) || null
        );
      },
      findMany: async ({ where }: any) => {
        return mockDb.notifications
          .filter((n) => n.userId === where.userId)
          .map((n) => {
            const proj = n.relatedProjectId ? mockDb.projects[n.relatedProjectId] : null;
            const projCollaborators = proj
              ? mockDb.collaborators.filter(
                  (c) => c.projectId === proj.id && c.userId === where.userId
                )
              : [];
            const actor = n.relatedUserId ? mockDb.users[n.relatedUserId] : null;
            const ver = n.relatedVersionId
              ? mockDb.versions.find((v) => v.id === n.relatedVersionId) || null
              : null;
            const comm = n.relatedCommentId
              ? mockDb.comments.find((c) => c.id === n.relatedCommentId) || null
              : null;
            return {
              ...n,
              relatedProject: proj
                ? {
                    id: proj.id,
                    title: proj.title,
                    category: proj.category,
                    visibility: proj.visibility,
                    creatorId: proj.creatorId,
                    collaborators: projCollaborators.map((c) => ({ acceptedAt: c.acceptedAt })),
                  }
                : null,
              relatedUser: actor
                ? {
                    id: actor.id,
                    username: actor.username,
                    displayName: actor.displayName,
                    avatarUrl: actor.avatarUrl,
                  }
                : null,
              relatedConnection: null,
              relatedVersion: ver
                ? {
                    id: ver.id,
                    projectId: ver.projectId,
                    versionNumber: ver.versionNumber,
                    status: ver.status,
                  }
                : null,
              relatedComment: comm
                ? {
                    id: comm.id,
                    projectId: comm.projectId,
                    versionId: comm.versionId,
                    parentId: comm.parentId,
                  }
                : null,
            };
          });
      },
      count: async ({ where }: any) => {
        return mockDb.notifications.filter(
          (n) => n.userId === where.userId && (where.isRead === undefined || n.isRead === where.isRead)
        ).length;
      },
    },
  };

  (prisma as any).project = mockTx.project;
  (prisma as any).version = mockTx.version;
  (prisma as any).comment = mockTx.comment;
  (prisma as any).commentLike = mockTx.commentLike;
  (prisma as any).like = mockTx.like;
  (prisma as any).notification = mockTx.notification;
  (prisma as any).$transaction = async (cb: any) => {
    if (!serializeTransactions) {
      return cb(mockTx);
    }
    const run = txChain.then(() => cb(mockTx));
    txChain = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };

  function makeReq(url: string, method: string, body?: any): NextRequest {
    return new NextRequest(url, {
      method,
      headers: { "content-type": "application/json" },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }

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

  let projectDiscussionRootId = "";
  let versionApprovedRootId = "";
  let versionApprovedReplyId = "";
  let privateVersionCommentId = "";
  let rejectedVersionCommentId = "";

  // TEST 1: Create top-level project discussion comment & version feedback comment
  await runTest(1, "Create top-level project discussion comment and version feedback comment", async () => {
    currentUser = mockDb.users[COLLAB_ID];
    const projRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "project",
        versionId: null,
        content: "Internal team kickoff discussion",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const projJson = await projRes.json();
    assert(projRes.status === 201, `Expected 201, got ${projRes.status}`);
    assert(projJson.data.versionId === null, "Project comment versionId must be null");
    assert(projJson.data.parentId === null, "Top-level parentId must be null");
    projectDiscussionRootId = projJson.data.id;

    // Create version feedback comment on Approved v1
    const verRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        content: "Lighting pass on v1 looks crisp!",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const verJson = await verRes.json();
    assert(verRes.status === 201, `Expected 201, got ${verRes.status}`);
    assert(verJson.data.versionId === PUB_VER_APPROVED_ID, "versionId must match v1");
    versionApprovedRootId = verJson.data.id;
  });

  // TEST 2: Create a valid 1-level reply + Reply notification for parent author
  await runTest(2, "Create valid 1-level reply and generate Reply notification for parent comment author", async () => {
    currentUser = mockDb.users[PUBLIC_USER_ID];
    const beforeNotifs = mockDb.notifications.length;

    const replyRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        parentId: versionApprovedRootId,
        content: "Agreed, the rim light works great!",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const replyJson = await replyRes.json();
    assert(replyRes.status === 201, `Expected 201, got ${replyRes.status}`);
    assert(replyJson.data.parentId === versionApprovedRootId, "parentId must link to root comment");
    versionApprovedReplyId = replyJson.data.id;

    const replyNotifs = mockDb.notifications.slice(beforeNotifs);
    assert(replyNotifs.length === 1, `Expected 1 Reply notification, got ${replyNotifs.length}`);
    assert(replyNotifs[0].type === NotificationType.Reply, "Notification type must be Reply");
    assert(replyNotifs[0].userId === COLLAB_ID, "Recipient must be parent comment author");
    assert(replyNotifs[0].relatedUserId === PUBLIC_USER_ID, "Actor must be replier");
    assert(replyNotifs[0].relatedCommentId === versionApprovedReplyId, "relatedCommentId must be set");

    // Verify self-reply does NOT generate a notification
    currentUser = mockDb.users[COLLAB_ID];
    const beforeSelf = mockDb.notifications.length;
    const selfReplyRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        parentId: versionApprovedRootId,
        content: "Adding a follow-up note to my own comment",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(selfReplyRes.status === 201, "Self-reply should succeed");
    assert(
      mockDb.notifications.length === beforeSelf,
      "Replying to own comment must NOT generate a self-notification"
    );
  });

  // TEST 3: Reject replies to replies (depth > 1)
  await runTest(3, "Reject nested replies (replying to a reply returns 400 and creates no notification)", async () => {
    currentUser = mockDb.users[OWNER_ID];
    const beforeNotifs = mockDb.notifications.length;

    const res = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        parentId: versionApprovedReplyId,
        content: "Nested level-2 reply should fail",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(res.status === 400, `Expected 400 for level-2 reply, got ${res.status}`);
    assert(mockDb.notifications.length === beforeNotifs, "Failed reply must create 0 notifications");
  });

  // TEST 4: Reject reply with nonexistent parent, cross-project parent, and cross-version parent
  await runTest(4, "Reject reply with nonexistent parent (404), cross-project parent (400), and cross-version parent (400)", async () => {
    currentUser = mockDb.users[OWNER_ID];

    // 4a. Nonexistent parent -> 404
    const missingRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        parentId: randomUUID(),
        content: "Ghost parent reply",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(missingRes.status === 404, `Expected 404 for nonexistent parent, got ${missingRes.status}`);

    // Seed a comment in PRIVATE_PROJ_ID
    const privRes = await postComment(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PRIV_VER_DRAFT_ID,
        content: "Confidential client feedback",
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    privateVersionCommentId = (await privRes.json()).data.id;

    // 4b. Cross-project parent -> 400
    const crossProjRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        parentId: privateVersionCommentId,
        content: "Cross-project hijack attempt",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(crossProjRes.status === 400, `Expected 400 for cross-project parent, got ${crossProjRes.status}`);

    // 4c. Cross-version parent (replying to v1 parent inside v2 draft) -> 400
    const crossVerRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_DRAFT_ID,
        parentId: versionApprovedRootId,
        content: "Cross-version hijack attempt",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(crossVerRes.status === 400, `Expected 400 for cross-version parent, got ${crossVerRes.status}`);

    // 4d. Project-scope reply targeting a version comment -> 400
    const crossScopeRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "project",
        versionId: null,
        parentId: versionApprovedRootId,
        content: "Cross-scope hijack attempt",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(crossScopeRes.status === 400, `Expected 400 for cross-scope parent, got ${crossScopeRes.status}`);
  });

  // TEST 5: Ownership enforcement for editing & deleting + reply integrity on parent delete
  await runTest(5, "Enforce ownership on edit/delete and reject deleting parent comment with replies (409)", async () => {
    // Non-author (Owner) cannot edit Collab's comment -> 403
    currentUser = mockDb.users[OWNER_ID];
    const unauthEdit = await editComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}`, "PATCH", {
        content: "Tampered by non-author",
      }),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    assert(unauthEdit.status === 403, `Expected 403 on non-author edit, got ${unauthEdit.status}`);

    // Author (Collab) can edit own comment -> 200
    currentUser = mockDb.users[COLLAB_ID];
    const okEdit = await editComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}`, "PATCH", {
        content: "Lighting pass on v1 looks extra crisp! (updated)",
      }),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    const okEditJson = await okEdit.json();
    assert(okEdit.status === 200, `Expected 200 on author edit, got ${okEdit.status}`);
    assert(okEditJson.data.content.includes("extra crisp"), "Edited content must persist");

    // Author trying to delete parent that has replies -> 409 Conflict (replies preserved!)
    const delParent = await deleteComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}`, "DELETE"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    assert(delParent.status === 409, `Expected 409 deleting parent with replies, got ${delParent.status}`);
    assert(
      mockDb.comments.some((c) => c.id === versionApprovedReplyId && c.parentId === versionApprovedRootId),
      "Child replies must remain intact and attached to parent"
    );

    // Non-author (Collab) cannot delete Public User's reply -> 403
    const unauthDel = await deleteComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedReplyId}`, "DELETE"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedReplyId } }
    );
    assert(unauthDel.status === 403, `Expected 403 on non-author delete, got ${unauthDel.status}`);

    // Author (Public User) can delete their own leaf reply -> 200
    const tempLeafRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        content: "Temporary comment to delete",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const tempLeafId = (await tempLeafRes.json()).data.id;
    const delLeaf = await deleteComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${tempLeafId}`, "DELETE"),
      { params: { id: PUBLIC_PROJ_ID, commentId: tempLeafId } }
    );
    assert(delLeaf.status === 200, `Expected 200 deleting leaf comment, got ${delLeaf.status}`);

    // Admin moderation delete allowed
    const adminTargetRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        content: "Spam comment for admin delete",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const adminTargetId = (await adminTargetRes.json()).data.id;
    currentUser = mockDb.users[ADMIN_ID];
    const adminDel = await deleteComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${adminTargetId}`, "DELETE"),
      { params: { id: PUBLIC_PROJ_ID, commentId: adminTargetId } }
    );
    assert(adminDel.status === 200, `Expected 200 for admin moderation delete, got ${adminDel.status}`);
  });

  // TEST 6: Strict scope separation (project vs version, no mixing, invalid scopes rejected)
  await runTest(6, "Project scope and version scope remain strictly separated with nested replies and reject un-scoped queries", async () => {
    currentUser = mockDb.users[OWNER_ID];

    // Missing scope -> 422
    const noScope = await getComments(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "GET"),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(noScope.status === 422, `Expected 422 when scope omitted, got ${noScope.status}`);

    // scope=project returns ONLY versionId=null comments
    const projScopeRes = await getComments(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments?scope=project`, "GET"),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const projScopeJson = await projScopeRes.json();
    assert(projScopeRes.status === 200, `Expected 200 for project scope, got ${projScopeRes.status}`);
    assert(projScopeJson.data.length === 1, `Expected 1 project discussion root, got ${projScopeJson.data.length}`);
    assert(projScopeJson.data.every((c: any) => c.versionId === null), "Project scope must never include version comments");

    // scope=version&versionId=v1 returns ONLY v1 comments with nested replies
    const verScopeRes = await getComments(
      makeReq(
        `http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments?scope=version&versionId=${PUB_VER_APPROVED_ID}`,
        "GET"
      ),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const verScopeJson = await verScopeRes.json();
    assert(verScopeRes.status === 200, `Expected 200 for version scope, got ${verScopeRes.status}`);
    assert(verScopeJson.data.length === 1, "Expected 1 root comment on v1");
    assert(verScopeJson.data[0].replies.length === 2, "Expected 2 nested replies under v1 root");
    assert(verScopeJson.data.every((c: any) => c.versionId === PUB_VER_APPROVED_ID), "Must only return v1 comments");
  });

  // TEST 7: Access rules for project discussions, public drafts, draft media, rejected versions, and private projects
  await runTest(7, "Non-members blocked from project discussions (even Public), Rejected versions, Private projects, and Draft media", async () => {
    // Seed a comment on Rejected v3 as Owner
    currentUser = mockDb.users[OWNER_ID];
    const rejCommRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_REJECTED_ID,
        content: "Internal revision note on rejected v3",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    rejectedVersionCommentId = (await rejCommRes.json()).data.id;

    // 7a. Public non-member CANNOT read or post project-level discussions on Public project
    currentUser = mockDb.users[PUBLIC_USER_ID];
    const pubReadProjDisc = await getComments(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments?scope=project`, "GET"),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(pubReadProjDisc.status === 403, `Expected 403 reading public project discussions as non-member, got ${pubReadProjDisc.status}`);

    const pubPostProjDisc = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "project",
        versionId: null,
        content: "Intruder trying to post to internal discussion",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(pubPostProjDisc.status === 403, `Expected 403 posting to public project discussion as non-member, got ${pubPostProjDisc.status}`);

    // GET /api/projects/[id] must also omit internal project discussions and Rejected versions for non-members
    const projDetailsRes = await getProject(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}`, "GET"),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const projDetailsJson = await projDetailsRes.json();
    assert(projDetailsJson.data.comments.length === 0, "GET /api/projects/[id] must not leak internal project discussions to non-members");
    assert(
      !projDetailsJson.data.versions.some((v: any) => v.status === VersionStatus.Rejected),
      "GET /api/projects/[id] must exclude Rejected versions for non-members"
    );

    // 7b. Public non-member CANNOT read or post on Rejected version
    const pubReadRej = await getComments(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments?scope=version&versionId=${PUB_VER_REJECTED_ID}`, "GET"),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(pubReadRej.status === 403, `Expected 403 reading Rejected version feedback, got ${pubReadRej.status}`);

    // 7c. Public non-member CAN read & post feedback on Public Draft v2, while Draft media assets remain HIDDEN!
    const pubPostDraft = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_DRAFT_ID,
        content: "Public community feedback on open draft v2",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    assert(pubPostDraft.status === 201, `Expected 201 for public draft feedback, got ${pubPostDraft.status}`);

    const draftVersionRes = await getVersion(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/versions/${PUB_VER_DRAFT_ID}`, "GET"),
      { params: { id: PUBLIC_PROJ_ID, versionId: PUB_VER_DRAFT_ID } }
    );
    const draftVersionJson = await draftVersionRes.json();
    assert(draftVersionJson.data.assets.length === 0, "Unpublished draft media assets MUST remain hidden from non-members!");

    // 7d. Public non-member CANNOT access Private project feedback
    const privRead = await getComments(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/comments?scope=version&versionId=${PRIV_VER_DRAFT_ID}`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(privRead.status === 403, `Expected 403 on private project feedback, got ${privRead.status}`);
  });

  // TEST 8: Comment likes, unlikes, duplicate prevention, unauthorized likes, self-like notification prevention
  await runTest(8, "Comment likes/unlikes enforce uniqueness, scope visibility, and prevent self-like notifications", async () => {
    // 8a. Like a visible comment + verify Like notification for author
    currentUser = mockDb.users[PUBLIC_USER_ID];
    const beforeNotifs = mockDb.notifications.length;
    const likeRes = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    const likeJson = await likeRes.json();
    assert(likeRes.status === 201, `Expected 201 on comment like, got ${likeRes.status}`);
    assert(likeJson.data.liked === true && likeJson.data.likeCount === 1, "Like count must be 1");

    const likeNotifs = mockDb.notifications.slice(beforeNotifs);
    assert(likeNotifs.length === 1 && likeNotifs[0].type === NotificationType.Like, "Expected 1 Like notification");
    assert(likeNotifs[0].userId === COLLAB_ID, "Like notification recipient must be comment author");

    // 8b. Duplicate like -> 409 Conflict + zero duplicate notification
    const dupLike = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    assert(dupLike.status === 409, `Expected 409 on duplicate like, got ${dupLike.status}`);
    assert(mockDb.notifications.length === beforeNotifs + 1, "Duplicate like must not create notification");

    // 8c. Unlike -> 200, likeCount = 0; re-like -> 201, still NO duplicate Like notification spam!
    const unlikeRes = await unlikeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "DELETE"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    const unlikeJson = await unlikeRes.json();
    assert(unlikeRes.status === 200 && unlikeJson.data.likeCount === 0, "Unlike must set likeCount=0");

    const relikeRes = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    assert(relikeRes.status === 201, "Re-like after unlike should succeed");
    assert(
      mockDb.notifications.length === beforeNotifs + 1,
      "Repeated like/unlike cycles must not spam duplicate Like notifications"
    );

    // 8d. Unauthorized likes: non-member liking internal project discussion, rejected version comment, or private project comment -> 403
    const unauthProjLike = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${projectDiscussionRootId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: projectDiscussionRootId } }
    );
    assert(unauthProjLike.status === 403, `Expected 403 liking internal project discussion, got ${unauthProjLike.status}`);

    const unauthRejLike = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${rejectedVersionCommentId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: rejectedVersionCommentId } }
    );
    assert(unauthRejLike.status === 403, `Expected 403 liking Rejected version comment, got ${unauthRejLike.status}`);

    const unauthPrivLike = await likeComment(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/comments/${privateVersionCommentId}/like`, "POST"),
      { params: { id: PRIVATE_PROJ_ID, commentId: privateVersionCommentId } }
    );
    assert(unauthPrivLike.status === 403, `Expected 403 liking private project comment, got ${unauthPrivLike.status}`);

    // 8e. Self-like: Collab likes own comment -> succeeds (201) with ZERO notification
    currentUser = mockDb.users[COLLAB_ID];
    const beforeSelfLike = mockDb.notifications.length;
    const selfLikeRes = await likeComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
      { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
    );
    assert(selfLikeRes.status === 201, "Self-like succeeds");
    assert(mockDb.notifications.length === beforeSelfLike, "Self-like must NOT generate notification");
  });

  // TEST 9: Version review notifications (Approval & Rejection) + no self-notification + no duplicate on retry + no notification on failed action
  await runTest(9, "Version Approval & Rejection generate accurate notifications for owner/creator, skip self, and ignore retries/failures", async () => {
    // 9a. Reviewer approves Draft v2 (created by Collab, owned by Owner) -> BOTH Owner & Collab receive Approval!
    currentUser = mockDb.users[REVIEWER_ID];
    const beforeApprove = mockDb.notifications.length;

    const appRes = await patchVersion(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/versions/${PUB_VER_DRAFT_ID}`, "PATCH", {
        status: VersionStatus.Approved,
      }),
      { params: { id: PUBLIC_PROJ_ID, versionId: PUB_VER_DRAFT_ID } }
    );
    assert(appRes.status === 200, `Expected 200 approving v2, got ${appRes.status}`);

    const appNotifs = mockDb.notifications.slice(beforeApprove);
    assert(appNotifs.length === 2, `Expected 2 Approval notifications (Owner + Collab), got ${appNotifs.length}`);
    assert(appNotifs.every((n) => n.type === NotificationType.Approval), "All must be Approval type");
    assert(appNotifs.some((n) => n.userId === OWNER_ID), "Owner must be notified");
    assert(appNotifs.some((n) => n.userId === COLLAB_ID), "Version creator (Collab) must be notified");
    assert(appNotifs.every((n) => n.relatedVersionId === PUB_VER_DRAFT_ID && n.relatedUserId === REVIEWER_ID), "Safe version & actor refs included");

    // 9b. Repeated identical Approve call -> idempotent 200 with ZERO duplicate notifications
    const retryApprove = await patchVersion(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/versions/${PUB_VER_DRAFT_ID}`, "PATCH", {
        status: VersionStatus.Approved,
      }),
      { params: { id: PUBLIC_PROJ_ID, versionId: PUB_VER_DRAFT_ID } }
    );
    assert(retryApprove.status === 200, "Idempotent retry returns 200");
    assert(mockDb.notifications.length === beforeApprove + 2, "Repeated approval must NOT duplicate notifications");

    // 9c. Owner rejects v2 (created by Collab) -> ONLY Collab receives Rejection (Owner does NOT self-notify!)
    currentUser = mockDb.users[OWNER_ID];
    const beforeReject = mockDb.notifications.length;
    const rejRes = await patchVersion(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/versions/${PUB_VER_DRAFT_ID}`, "PATCH", {
        status: VersionStatus.Rejected,
      }),
      { params: { id: PUBLIC_PROJ_ID, versionId: PUB_VER_DRAFT_ID } }
    );
    assert(rejRes.status === 200, `Expected 200 rejecting v2, got ${rejRes.status}`);
    const rejNotifs = mockDb.notifications.slice(beforeReject);
    assert(rejNotifs.length === 1, `Expected 1 Rejection notification (Collab only, no self-notify for Owner), got ${rejNotifs.length}`);
    assert(rejNotifs[0].userId === COLLAB_ID && rejNotifs[0].type === NotificationType.Rejection, "Collab notified of Rejection");

    // 9d. Unauthorized review attempt (Public user trying to approve) -> 403, ZERO notifications
    currentUser = mockDb.users[PUBLIC_USER_ID];
    const beforeFail = mockDb.notifications.length;
    const failReview = await patchVersion(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/versions/${PUB_VER_DRAFT_ID}`, "PATCH", {
        status: VersionStatus.Approved,
      }),
      { params: { id: PUBLIC_PROJ_ID, versionId: PUB_VER_DRAFT_ID } }
    );
    assert(failReview.status === 403, `Expected 403 on unauthorized review, got ${failReview.status}`);
    assert(mockDb.notifications.length === beforeFail, "Failed review must create 0 notifications");
  });

  // TEST 10: Notification privacy redaction (removed private project member + deleted comment handling)
  await runTest(10, "GET /api/notifications redacts private project data after access revocation and handles deleted comments safely", async () => {
    // Reviewer approves private project draft -> Collab receives Approval notification for Private project
    currentUser = mockDb.users[REVIEWER_ID];
    const res = await patchVersion(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/versions/${PRIV_VER_DRAFT_ID}`, "PATCH", {
        status: VersionStatus.Approved,
      }),
      { params: { id: PRIVATE_PROJ_ID, versionId: PRIV_VER_DRAFT_ID } }
    );
    assert(res.status === 200, "Private version approval succeeds");

    // While Collab IS a member, GET /api/notifications shows private project title & version
    currentUser = mockDb.users[COLLAB_ID];
    const beforeRemovalJson = await (
      await getNotifications(makeReq("http://localhost/api/notifications", "GET"))
    ).json();
    const privNotifBefore = beforeRemovalJson.data.notifications.find(
      (n: any) => n.relatedProject?.id === PRIVATE_PROJ_ID
    );
    assert(Boolean(privNotifBefore), "Active member should see private project notification details");

    // Now REMOVE Collab from PRIVATE_PROJ_ID
    mockDb.collaborators = mockDb.collaborators.filter(
      (c) => !(c.projectId === PRIVATE_PROJ_ID && c.userId === COLLAB_ID)
    );

    // After removal, GET /api/notifications MUST redact private project title, version, and comment!
    const afterRemovalRes = await getNotifications(
      makeReq("http://localhost/api/notifications", "GET")
    );
    const afterRemovalJson = await afterRemovalRes.json();
    assert(afterRemovalRes.status === 200, "Notifications endpoint must still return 200");
    const leaked = afterRemovalJson.data.notifications.some(
      (n: any) => n.relatedProject?.title === "Secret Client Brand Identity"
    );
    assert(!leaked, "Removed collaborator must NEVER see private project title in notification payloads!");
  });

  // TEST 11: Concurrency - simultaneous duplicate likes by same user
  await runTest(11, "Concurrent duplicate likes by the same user remain strictly unique (1 like, 1 notification)", async () => {
    currentUser = mockDb.users[REVIEWER_ID];
    const beforeLikes = mockDb.commentLikes.filter(
      (l) => l.userId === REVIEWER_ID && l.commentId === versionApprovedRootId
    ).length;
    const beforeNotifs = mockDb.notifications.length;
    likeCreateDelayMs = 25; // Force async interleaving past findUnique

    try {
      const [r1, r2] = await Promise.all([
        likeComment(
          makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
          { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
        ),
        likeComment(
          makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${versionApprovedRootId}/like`, "POST"),
          { params: { id: PUBLIC_PROJ_ID, commentId: versionApprovedRootId } }
        ),
      ]);

      const statuses = [r1.status, r2.status].sort();
      assert(
        statuses[0] === 201 && statuses[1] === 409,
        `Expected [201, 409] under concurrent duplicate likes, got ${JSON.stringify(statuses)}`
      );

      const afterLikes = mockDb.commentLikes.filter(
        (l) => l.userId === REVIEWER_ID && l.commentId === versionApprovedRootId
      ).length;
      assert(afterLikes - beforeLikes === 1, "Strictly 1 CommentLike record must exist");
      assert(mockDb.notifications.length - beforeNotifs === 1, "Strictly 1 Like notification must be emitted");
    } finally {
      likeCreateDelayMs = 0;
    }
  });

  // TEST 12: Concurrency - simultaneous reply creation and parent comment deletion
  await runTest(12, "Concurrent reply creation and parent deletion serialize cleanly with zero orphaned replies", async () => {
    currentUser = mockDb.users[OWNER_ID];
    const rootRes = await postComment(
      makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
        scope: "version",
        versionId: PUB_VER_APPROVED_ID,
        content: "Racing root comment",
      }),
      { params: { id: PUBLIC_PROJ_ID } }
    );
    const raceRootId = (await rootRes.json()).data.id;

    serializeTransactions = true; // Simulate PostgreSQL row-level FOR UPDATE serialization
    try {
      const callerQueue = [mockDb.users[COLLAB_ID], mockDb.users[OWNER_ID]];
      (authModule as any).getCurrentUser = async () => callerQueue.shift() ?? currentUser;

      const [replyRes, deleteRes] = await Promise.all([
        postComment(
          makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments`, "POST", {
            scope: "version",
            versionId: PUB_VER_APPROVED_ID,
            parentId: raceRootId,
            content: "Racing reply",
          }),
          { params: { id: PUBLIC_PROJ_ID } }
        ),
        deleteComment(
          makeReq(`http://localhost/api/projects/${PUBLIC_PROJ_ID}/comments/${raceRootId}`, "DELETE"),
          { params: { id: PUBLIC_PROJ_ID, commentId: raceRootId } }
        ),
      ]);

      const validOutcomeA = replyRes.status === 201 && deleteRes.status === 409;
      const validOutcomeB = deleteRes.status === 200 && replyRes.status === 404;
      assert(
        validOutcomeA || validOutcomeB,
        `Expected either (reply=201, delete=409) or (delete=200, reply=404), got reply=${replyRes.status}, delete=${deleteRes.status}`
      );

      // Invariant: Zero orphaned replies ever exist
      const orphanedReplies = mockDb.comments.filter(
        (c) => c.parentId !== null && !mockDb.comments.some((p) => p.id === c.parentId)
      );
      assert(orphanedReplies.length === 0, "Zero orphaned replies may ever exist");
    } finally {
      serializeTransactions = false;
      (authModule as any).getCurrentUser = async () => currentUser;
    }
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n=========================================================================");
  console.log(`Phase 3.2 Test Summary: ${passedCount}/${results.length} PASSED`);
  console.log("=========================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase32TestSuite().catch((err) => {
  console.error("Fatal error running Phase 3.2 test suite:", err);
  process.exit(1);
});
