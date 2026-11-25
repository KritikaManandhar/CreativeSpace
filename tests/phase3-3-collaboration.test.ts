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
import { authorize, getEffectiveRole } from "../src/lib/rbac";
import {
  CollaboratorRole,
  ConnectionStatus,
  InvitationStatus,
  NotificationType,
  ProjectStatus,
  Visibility,
} from "@prisma/client";
import {
  GET as listCollaborators,
  POST as inviteCollaborator,
} from "../src/app/api/projects/[id]/collaborators/route";
import { POST as acceptInvitationDedicated } from "../src/app/api/projects/[id]/collaborators/accept/route";
import {
  PATCH as patchCollaborator,
  DELETE as deleteCollaborator,
} from "../src/app/api/projects/[id]/collaborators/[userId]/route";
import { GET as getInvitationsDashboard } from "../src/app/api/invitations/route";
import { GET as getNotifications } from "../src/app/api/notifications/route";
import { GET as getProjectDetails } from "../src/app/api/projects/[id]/route";

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

const OWNER_ID = "11111111-1111-4111-8111-111111111111";
const INVITEE_ID = "22222222-2222-4222-8222-222222222222";
const REVIEWER_ID = "33333333-3333-4333-8333-333333333333";
const STRANGER_ID = "44444444-4444-4444-8444-444444444444";

const PRIVATE_PROJ_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

async function runPhase33TestSuite() {
  console.log("=========================================================================");
  console.log("CreativeSpace Phase 3.3: Collaboration Lifecycle & Invitee Dashboard Suite");
  console.log("(In-Memory Transactional Harness with PostgreSQL Constraint Simulation)");
  console.log("=========================================================================\n");

  const mockDb = {
    users: {
      [OWNER_ID]: {
        id: OWNER_ID,
        email: "owner@creativespace.com",
        username: "owner_anya",
        displayName: "Anya Owner",
        avatarUrl: null,
        isAdmin: false,
      },
      [INVITEE_ID]: {
        id: INVITEE_ID,
        email: "rohan@creativespace.com",
        username: "collab_rohan",
        displayName: "Rohan Collab",
        avatarUrl: null,
        isAdmin: false,
      },
      [REVIEWER_ID]: {
        id: REVIEWER_ID,
        email: "david@creativespace.com",
        username: "reviewer_david",
        displayName: "David Reviewer",
        avatarUrl: null,
        isAdmin: false,
      },
      [STRANGER_ID]: {
        id: STRANGER_ID,
        email: "grace@creativespace.com",
        username: "stranger_grace",
        displayName: "Grace Stranger",
        avatarUrl: null,
        isAdmin: false,
      },
    } as Record<string, any>,
    projects: {
      [PRIVATE_PROJ_ID]: {
        id: PRIVATE_PROJ_ID,
        creatorId: OWNER_ID,
        title: "Confidential Brand System",
        category: "UI/UX",
        visibility: Visibility.Private,
        status: ProjectStatus.InProgress,
        metadata: { coverAssetId: "asset-secret-cover" },
      },
    } as Record<string, any>,
    assets: [
      {
        id: "asset-secret-cover",
        projectId: PRIVATE_PROJ_ID,
        uploaderId: OWNER_ID,
        versionId: null,
        fileName: "secret_cover.png",
        thumbnailPath: "https://storage.local/secret_cover_thumb.png",
        storagePath: "projects/priv/secret_cover.png",
      },
    ] as any[],
    collaborators: [
      // Owner's own ProjectCollaborator row (matching POST /api/projects & seed.ts)
      {
        id: randomUUID(),
        projectId: PRIVATE_PROJ_ID,
        userId: OWNER_ID,
        invitedById: OWNER_ID,
        role: CollaboratorRole.Owner,
        status: InvitationStatus.Accepted,
        invitedAt: new Date("2026-01-01T00:00:00Z"),
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
        rejectedAt: null,
        cancelledAt: null,
      },
    ] as any[],
    notifications: [] as any[],
    connections: [
      // Pre-existing Accepted peer connection between Owner and Invitee
      {
        id: randomUUID(),
        requesterId: OWNER_ID,
        receiverId: INVITEE_ID,
        status: ConnectionStatus.Accepted,
        acceptedAt: new Date("2026-01-01T00:00:00Z"),
      },
    ] as any[],
    follows: [
      // Pre-existing Follow relationship
      {
        id: randomUUID(),
        followerId: INVITEE_ID,
        followingId: OWNER_ID,
        createdAt: new Date("2026-01-01T00:00:00Z"),
      },
    ] as any[],
  };

  let serializeTransactions = false;
  let txChain = Promise.resolve();

  function enforcePgCollabConstraints(rec: any, ignoreId?: string) {
    // PG CHECK: project_collaborators_status_timestamps_check
    const valid =
      (rec.status === InvitationStatus.Accepted &&
        rec.acceptedAt != null &&
        rec.rejectedAt == null &&
        rec.cancelledAt == null) ||
      (rec.status === InvitationStatus.Rejected &&
        rec.rejectedAt != null &&
        rec.acceptedAt == null) ||
      (rec.status === InvitationStatus.Cancelled &&
        rec.cancelledAt != null &&
        rec.acceptedAt == null) ||
      (rec.status === InvitationStatus.Pending &&
        rec.acceptedAt == null &&
        rec.rejectedAt == null &&
        rec.cancelledAt == null);

    if (!valid) {
      const err: any = new Error("CHECK violation: project_collaborators_status_timestamps_check");
      err.code = "23514";
      throw err;
    }

    // PG UNIQUE: (projectId, userId)
    const dup = mockDb.collaborators.find(
      (c) => c.id !== ignoreId && c.projectId === rec.projectId && c.userId === rec.userId
    );
    if (dup) {
      const err: any = new Error("Unique constraint failed on (projectId, userId)");
      err.code = "P2002";
      throw err;
    }
  }

  function hydrateCollab(c: any, include?: any) {
    if (!c) return null;
    const out: any = { ...c };
    if (include?.user) {
      const u = mockDb.users[c.userId];
      out.user = u
        ? { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
        : null;
    }
    if (include?.invitedBy) {
      const u = c.invitedById ? mockDb.users[c.invitedById] : null;
      out.invitedBy = u
        ? { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: u.avatarUrl }
        : null;
    }
    if (include?.project) {
      const p = mockDb.projects[c.projectId];
      if (p) {
        const creator = mockDb.users[p.creatorId];
        out.project = {
          ...p,
          creator: creator
            ? {
                id: creator.id,
                username: creator.username,
                displayName: creator.displayName,
                avatarUrl: creator.avatarUrl,
              }
            : null,
          assets: mockDb.assets.filter((a) => a.projectId === p.id),
        };
      }
    }
    return out;
  }

  const mockTx: any = {
    $executeRaw: async () => 1,
    user: {
      findFirst: async ({ where }: any) => {
        const orList = where?.OR || [];
        return (
          Object.values(mockDb.users).find((u) =>
            orList.some(
              (cond: any) =>
                (cond.email && u.email === cond.email) ||
                (cond.username && u.username === cond.username)
            )
          ) || null
        );
      },
    },
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
            .map((c) => hydrateCollab(c, { user: true }));
        }
        if (include?.creator) out.creator = mockDb.users[p.creatorId];
        if (include?.assets) out.assets = mockDb.assets.filter((a) => a.projectId === p.id);
        if (include?.versions) out.versions = [];
        if (include?.comments) out.comments = [];
        if (include?.projectTags) out.projectTags = [];
        if (include?.portfolioProjects) out.portfolioProjects = [];
        if (include?._count) out._count = { likes: 0 };
        return out;
      },
    },
    projectCollaborator: {
      findUnique: async ({ where, include }: any) => {
        const key = where.projectId_userId;
        const found = mockDb.collaborators.find(
          (c) => c.projectId === key.projectId && c.userId === key.userId
        );
        return hydrateCollab(found, include);
      },
      findMany: async ({ where, include }: any) => {
        const list = mockDb.collaborators.filter((c) => {
          if (where?.projectId && c.projectId !== where.projectId) return false;
          if (where?.userId) {
            if (typeof where.userId === "string" && c.userId !== where.userId) return false;
            if (where.userId?.not && c.userId === where.userId.not) return false;
          }
          if (where?.status) {
            if (typeof where.status === "string" && c.status !== where.status) return false;
            if (Array.isArray(where.status?.in) && !where.status.in.includes(c.status)) {
              return false;
            }
          }
          if (where?.acceptedAt?.not === null && c.acceptedAt === null) return false;
          if (where?.project?.creatorId) {
            const p = mockDb.projects[c.projectId];
            if (!p) return false;
            if (typeof where.project.creatorId === "string" && p.creatorId !== where.project.creatorId) {
              return false;
            }
            if (where.project.creatorId?.not && p.creatorId === where.project.creatorId.not) {
              return false;
            }
          }
          return true;
        });
        return list.map((c) => hydrateCollab(c, include));
      },
      create: async ({ data, include }: any) => {
        const record = {
          id: randomUUID(),
          projectId: data.projectId,
          userId: data.userId,
          invitedById: data.invitedById ?? null,
          role: data.role,
          status: data.status ?? InvitationStatus.Pending,
          invitedAt: data.invitedAt ?? new Date(),
          acceptedAt: data.acceptedAt ?? null,
          rejectedAt: data.rejectedAt ?? null,
          cancelledAt: data.cancelledAt ?? null,
        };
        enforcePgCollabConstraints(record);
        mockDb.collaborators.push(record);
        return hydrateCollab(record, include);
      },
      update: async ({ where, data, include }: any) => {
        const key = where.projectId_userId;
        const idx = mockDb.collaborators.findIndex(
          (c) => c.projectId === key.projectId && c.userId === key.userId
        );
        if (idx === -1) throw new Error("Collaborator not found");
        const updated = { ...mockDb.collaborators[idx], ...data };
        enforcePgCollabConstraints(updated, updated.id);
        mockDb.collaborators[idx] = updated;
        return hydrateCollab(updated, include);
      },
      delete: async ({ where }: any) => {
        const key = where.projectId_userId;
        const idx = mockDb.collaborators.findIndex(
          (c) => c.projectId === key.projectId && c.userId === key.userId
        );
        if (idx === -1) throw new Error("Collaborator not found");
        const [removed] = mockDb.collaborators.splice(idx, 1);
        return removed;
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
      findMany: async ({ where }: any) => {
        return mockDb.notifications
          .filter((n) => n.userId === where.userId)
          .map((n) => {
            const proj = n.relatedProjectId ? mockDb.projects[n.relatedProjectId] : null;
            const collabs = proj
              ? mockDb.collaborators.filter(
                  (c) => c.projectId === proj.id && c.userId === where.userId
                )
              : [];
            const actor = n.relatedUserId ? mockDb.users[n.relatedUserId] : null;
            return {
              ...n,
              relatedProject: proj
                ? {
                    id: proj.id,
                    title: proj.title,
                    category: proj.category,
                    visibility: proj.visibility,
                    creatorId: proj.creatorId,
                    collaborators: collabs.map((c) => ({
                      acceptedAt: c.acceptedAt,
                      status: c.status,
                    })),
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
              relatedVersion: null,
              relatedComment: null,
            };
          });
      },
      count: async ({ where }: any) => {
        return mockDb.notifications.filter(
          (n) =>
            n.userId === where.userId &&
            (where.isRead === undefined || n.isRead === where.isRead)
        ).length;
      },
    },
  };

  (prisma as any).user = mockTx.user;
  (prisma as any).project = mockTx.project;
  (prisma as any).projectCollaborator = mockTx.projectCollaborator;
  (prisma as any).like = mockTx.like;
  (prisma as any).notification = mockTx.notification;
  (prisma as any).$transaction = async (cb: any) => {
    if (!serializeTransactions) return cb(mockTx);
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

  // TEST 1: Invitation creation by authorized owner + notification
  await runTest(1, "Owner invites collaborator (Pending), sets invitedById, creates Invitation notification, grants NO workspace access", async () => {
    currentUser = mockDb.users[OWNER_ID];
    const res = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "collab_rohan",
        role: CollaboratorRole.Collaborator,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    const json = await res.json();
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(json.data.status === InvitationStatus.Pending, "Status must be Pending");
    assert(json.data.acceptedAt === null, "acceptedAt must be null before acceptance");
    assert(json.data.invitedById === OWNER_ID, "invitedById must be Owner");

    const invNotifs = mockDb.notifications.filter(
      (n) => n.userId === INVITEE_ID && n.type === NotificationType.Invitation
    );
    assert(invNotifs.length === 1, "Expected 1 Invitation notification");

    // Pending invitee receives ZERO project workspace access (even though Owner & Invitee have an Accepted Connection!)
    currentUser = mockDb.users[INVITEE_ID];
    const projRes = await getProjectDetails(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(projRes.status === 403, `Pending invitee MUST be denied private workspace (403), got ${projRes.status}`);

    // Invitee Dashboard exposes safe title/inviter WITHOUT private workspace thumbnail assets!
    const dashRes = await getInvitationsDashboard();
    const dashJson = await dashRes.json();
    assert(dashRes.status === 200, "Invitee dashboard loads cleanly");
    assert(dashJson.data.incoming.length === 1, "1 incoming pending invitation shown");
    assert(dashJson.data.incoming[0].project.thumbnailUrl === null, "Private project assets must NOT leak as thumbnails to pending invitees");
  });

  // TEST 2: Unauthorized invitation creation + self-invitation + duplicate pending rejection
  await runTest(2, "Reject unauthorized invitation (403), self-invitation (400), and duplicate pending invitation (409) with 0 notifications", async () => {
    const beforeNotifs = mockDb.notifications.length;

    // Non-owner trying to invite -> 403
    currentUser = mockDb.users[STRANGER_ID];
    const unauthRes = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "reviewer_david",
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(unauthRes.status === 403, `Expected 403 for unauthorized invite, got ${unauthRes.status}`);

    // Owner self-invitation -> 400
    currentUser = mockDb.users[OWNER_ID];
    const selfRes = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "owner_anya",
        role: CollaboratorRole.Collaborator,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(selfRes.status === 400, `Expected 400 for self-invitation, got ${selfRes.status}`);

    // Duplicate pending invitation -> 409
    const dupRes = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "collab_rohan",
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(dupRes.status === 409, `Expected 409 for duplicate pending invite, got ${dupRes.status}`);

    // Invalid Owner role assignment -> 422
    const ownerRoleRes = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "reviewer_david",
        role: CollaboratorRole.Owner,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(ownerRoleRes.status === 422, `Expected 422 for Owner role invite, got ${ownerRoleRes.status}`);

    assert(mockDb.notifications.length === beforeNotifs, "Failed invitations must create 0 notifications");
  });

  // TEST 3: Acceptance by another user rejected + Acceptance by intended invitee + duplicate acceptance rejected
  await runTest(3, "Reject unauthorized acceptance (403), allow intended invitee acceptance (200 + InvitationAccepted), and reject duplicate accept (409)", async () => {
    // Another user (Owner or Stranger) attempting to accept Rohan's invite -> 403
    currentUser = mockDb.users[STRANGER_ID];
    const otherAccept = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "PATCH", {
        action: "accept",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    assert(otherAccept.status === 403, `Expected 403 when non-invitee attempts accept, got ${otherAccept.status}`);

    // Intended invitee accepts -> 200, membership active, InvitationAccepted sent to Owner
    currentUser = mockDb.users[INVITEE_ID];
    const beforeNotifs = mockDb.notifications.length;
    const accRes = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "PATCH", {
        action: "accept",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    const accJson = await accRes.json();
    assert(accRes.status === 200, `Expected 200 on accept, got ${accRes.status}`);
    assert(accJson.data.status === InvitationStatus.Accepted, "Status must be Accepted");
    assert(accJson.data.acceptedAt !== null, "acceptedAt must be set");

    const accNotifs = mockDb.notifications.slice(beforeNotifs);
    assert(
      accNotifs.length === 1 &&
        accNotifs[0].type === NotificationType.InvitationAccepted &&
        accNotifs[0].userId === OWNER_ID,
      "Owner must receive 1 InvitationAccepted notification"
    );

    // Invitee now has active workspace access!
    const projRes = await getProjectDetails(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(projRes.status === 200, "Accepted collaborator can now access private workspace");

    // Duplicate acceptance via dedicated /accept endpoint -> 409, 0 extra notifications
    const dupAccRes = await acceptInvitationDedicated(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/accept`, "POST"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(dupAccRes.status === 409, `Expected 409 on duplicate accept, got ${dupAccRes.status}`);
    assert(mockDb.notifications.length === beforeNotifs + 1, "Duplicate accept must NOT duplicate notifications");

    // Existing collaborator invitation rejection -> 409
    currentUser = mockDb.users[OWNER_ID];
    const reInviteAccepted = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "collab_rohan",
        role: CollaboratorRole.Collaborator,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(reInviteAccepted.status === 409, `Expected 409 inviting existing collaborator, got ${reInviteAccepted.status}`);
  });

  // TEST 4: Rejection by intended invitee (no membership granted, notifies inviter, supports clean re-invite)
  await runTest(4, "Intended invitee rejection updates status to Rejected, grants no access, notifies owner, and allows re-invitation", async () => {
    currentUser = mockDb.users[OWNER_ID];
    const invRes = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "reviewer_david",
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(invRes.status === 201, "Owner invites David as ClientReviewer");

    // Stranger cannot reject David's invitation -> 403
    currentUser = mockDb.users[STRANGER_ID];
    const unauthRej = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
        action: "reject",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
    );
    assert(unauthRej.status === 403, `Expected 403 on unauthorized reject, got ${unauthRej.status}`);

    // David rejects -> 200, status=Rejected, acceptedAt=null, InvitationRejected sent to Owner
    currentUser = mockDb.users[REVIEWER_ID];
    const beforeRejNotifs = mockDb.notifications.length;
    const rejRes = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
        action: "reject",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
    );
    const rejJson = await rejRes.json();
    assert(rejRes.status === 200 && rejJson.data.status === InvitationStatus.Rejected, "Status must be Rejected");
    assert(rejJson.data.acceptedAt === null && rejJson.data.rejectedAt !== null, "Timestamps consistent");

    const rejNotifs = mockDb.notifications.slice(beforeRejNotifs);
    assert(
      rejNotifs.length === 1 &&
        rejNotifs[0].type === NotificationType.InvitationRejected &&
        rejNotifs[0].userId === OWNER_ID,
      "Owner must receive InvitationRejected notification"
    );

    // Rejected invitee gets ZERO project access and cannot later accept -> 409
    const projRes = await getProjectDetails(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(projRes.status === 403, "Rejected invitee must NOT have project access");

    const lateAccept = await acceptInvitationDedicated(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/accept`, "POST"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(lateAccept.status === 409, `Expected 409 accepting rejected invite, got ${lateAccept.status}`);
  });

  // TEST 5: Cancellation by owner, unauthorized cancellation rejection, and cancelled invite cannot be accepted
  await runTest(5, "Owner cancels pending invitation (Cancelled + notification), unauthorized cancel rejected (403), cancelled invite cannot be accepted (409)", async () => {
    // Owner re-invites David (reuses canonical row -> Pending)
    currentUser = mockDb.users[OWNER_ID];
    const reinv = await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "reviewer_david",
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(reinv.status === 201, "Re-inviting previously rejected user succeeds");

    // Unauthorized user (David or accepted collaborator Rohan) cannot cancel -> 403
    currentUser = mockDb.users[INVITEE_ID];
    const collabCancel = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
        action: "cancel",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
    );
    assert(collabCancel.status === 403, `Collaborator cannot cancel owner's invite (403), got ${collabCancel.status}`);

    // Owner cancels -> 200, status=Cancelled, InvitationCancelled sent to David
    currentUser = mockDb.users[OWNER_ID];
    const beforeCancel = mockDb.notifications.length;
    const cancelRes = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
        action: "cancel",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
    );
    const cancelJson = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelJson.data.status === InvitationStatus.Cancelled, "Status must be Cancelled");
    const cancelNotifs = mockDb.notifications.slice(beforeCancel);
    assert(
      cancelNotifs.length === 1 &&
        cancelNotifs[0].type === NotificationType.InvitationCancelled &&
        cancelNotifs[0].userId === REVIEWER_ID,
      "Invitee must receive InvitationCancelled notification"
    );

    // Owner cancelling an ALREADY ACCEPTED collaborator (Rohan) MUST fail with 409!
    const cancelAccepted = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "PATCH", {
        action: "cancel",
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    assert(
      cancelAccepted.status === 409,
      `Cancel must NEVER remove an already accepted collaborator (expected 409, got ${cancelAccepted.status})`
    );

    // David cannot accept cancelled invitation -> 409
    currentUser = mockDb.users[REVIEWER_ID];
    const acceptCancelled = await acceptInvitationDedicated(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/accept`, "POST"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(acceptCancelled.status === 409, `Cancelled invite cannot be accepted (409), got ${acceptCancelled.status}`);

    // Owner's outgoing dashboard accurately shows Accepted + Cancelled statuses
    currentUser = mockDb.users[OWNER_ID];
    const ownerDash = await (await getInvitationsDashboard()).json();
    assert(
      ownerDash.data.outgoing.some((o: any) => o.userId === INVITEE_ID && o.status === InvitationStatus.Accepted),
      "Outgoing dashboard shows Accepted status"
    );
    assert(
      ownerDash.data.outgoing.some((o: any) => o.userId === REVIEWER_ID && o.status === InvitationStatus.Cancelled),
      "Outgoing dashboard shows Cancelled status"
    );
  });

  // TEST 6: Concurrent acceptance and cancellation serialize safely without corrupting state
  await runTest(6, "Concurrent acceptance and cancellation serialize cleanly: either accept wins (cancel=409) or cancel wins (accept=409)", async () => {
    currentUser = mockDb.users[OWNER_ID];
    await inviteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "POST", {
        userIdentifier: "reviewer_david",
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID } }
    );

    serializeTransactions = true;
    try {
      const callerQueue = [mockDb.users[REVIEWER_ID], mockDb.users[OWNER_ID]];
      (authModule as any).getCurrentUser = async () => callerQueue.shift() ?? currentUser;

      const [acceptRes, cancelRes] = await Promise.all([
        patchCollaborator(
          makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
            action: "accept",
          }),
          { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
        ),
        patchCollaborator(
          makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${REVIEWER_ID}`, "PATCH", {
            action: "cancel",
          }),
          { params: { id: PRIVATE_PROJ_ID, userId: REVIEWER_ID } }
        ),
      ]);

      const acceptWon = acceptRes.status === 200 && cancelRes.status === 409;
      const cancelWon = cancelRes.status === 200 && acceptRes.status === 409;
      assert(
        acceptWon || cancelWon,
        `Expected deterministic winner (200 vs 409), got accept=${acceptRes.status}, cancel=${cancelRes.status}`
      );

      const finalRow = mockDb.collaborators.find(
        (c) => c.projectId === PRIVATE_PROJ_ID && c.userId === REVIEWER_ID
      );
      if (acceptWon) {
        assert(finalRow.status === InvitationStatus.Accepted && finalRow.acceptedAt !== null, "Accepted state preserved");
      } else {
        assert(finalRow.status === InvitationStatus.Cancelled && finalRow.acceptedAt === null, "Cancelled state preserved");
      }
    } finally {
      serializeTransactions = false;
      (authModule as any).getCurrentUser = async () => currentUser;
    }
  });

  // TEST 7: Role escalation prevention & Owner removal protection
  await runTest(7, "Prevent role escalation to Owner (400), prevent owner removal (400), and enforce Project.creatorId authority", async () => {
    // Owner attempting to promote Rohan to Owner -> 400
    currentUser = mockDb.users[OWNER_ID];
    const escRes = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "PATCH", {
        role: CollaboratorRole.Owner,
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    assert(escRes.status === 400, `Expected 400 blocking promotion to Owner, got ${escRes.status}`);

    // Collaborator attempting to remove Owner -> 400 (Owner removal strictly protected)
    currentUser = mockDb.users[INVITEE_ID];
    const collabDelOwner = await deleteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${OWNER_ID}`, "DELETE"),
      { params: { id: PRIVATE_PROJ_ID, userId: OWNER_ID } }
    );
    assert(collabDelOwner.status === 400, `Expected 400 blocking owner removal, got ${collabDelOwner.status}`);

    // Even Owner cannot remove themselves via collaborator DELETE -> 400
    currentUser = mockDb.users[OWNER_ID];
    const ownerSelfDel = await deleteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${OWNER_ID}`, "DELETE"),
      { params: { id: PRIVATE_PROJ_ID, userId: OWNER_ID } }
    );
    assert(ownerSelfDel.status === 400, `Expected 400 blocking owner self-removal, got ${ownerSelfDel.status}`);

    // Corrupt ProjectCollaborator row with role=Owner for non-creator cannot grant Owner in getEffectiveRole
    mockDb.collaborators.push({
      id: randomUUID(),
      projectId: PRIVATE_PROJ_ID,
      userId: STRANGER_ID,
      invitedById: null,
      role: CollaboratorRole.Owner,
      status: InvitationStatus.Accepted,
      invitedAt: new Date(),
      acceptedAt: new Date(),
      rejectedAt: null,
      cancelledAt: null,
    });
    const eff = await getEffectiveRole(STRANGER_ID, PRIVATE_PROJ_ID);
    assert(eff.role === "None", `Corrupt Owner collaborator row must NOT override Project.creatorId, got ${eff.role}`);
    // Clean up synthetic corrupt row
    mockDb.collaborators = mockDb.collaborators.filter((c) => c.userId !== STRANGER_ID);

    // Owner CAN validly switch Rohan between Collaborator and ClientReviewer -> 200
    const roleSwitch = await patchCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "PATCH", {
        role: CollaboratorRole.ClientReviewer,
      }),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    assert(roleSwitch.status === 200, "Owner can change role to ClientReviewer");

    // ClientReviewer CANNOT manage settings, upload assets, or invite collaborators
    let reviewerBlocked = false;
    try {
      await authorize(mockDb.users[INVITEE_ID], PRIVATE_PROJ_ID, "invite_collaborator");
    } catch (e: any) {
      reviewerBlocked = e.statusCode === 403;
    }
    assert(reviewerBlocked, "ClientReviewer must NOT receive owner/invite permissions");
  });

  // TEST 8: Collaborator removal revokes access immediately, redacts private notification metadata, and preserves Connection & Follow
  await runTest(8, "Collaborator removal revokes access immediately, notifies removed user, redacts private project notifications, and preserves Connection/Follow", async () => {
    currentUser = mockDb.users[OWNER_ID];
    const beforeNotifs = mockDb.notifications.length;

    const delRes = await deleteCollaborator(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators/${INVITEE_ID}`, "DELETE"),
      { params: { id: PRIVATE_PROJ_ID, userId: INVITEE_ID } }
    );
    const delJson = await delRes.json();
    assert(delRes.status === 200 && delJson.data.action === "removed", "Owner removes collaborator");

    const remNotifs = mockDb.notifications.slice(beforeNotifs);
    assert(
      remNotifs.length === 1 &&
        remNotifs[0].type === NotificationType.CollaboratorRemoved &&
        remNotifs[0].userId === INVITEE_ID,
      "Removed collaborator receives CollaboratorRemoved notification"
    );

    // Immediate access revocation
    currentUser = mockDb.users[INVITEE_ID];
    const revokedProj = await getProjectDetails(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(revokedProj.status === 403, `Removed collaborator must immediately get 403, got ${revokedProj.status}`);

    const revokedList = await listCollaborators(
      makeReq(`http://localhost/api/projects/${PRIVATE_PROJ_ID}/collaborators`, "GET"),
      { params: { id: PRIVATE_PROJ_ID } }
    );
    assert(revokedList.status === 403, "Removed collaborator cannot list private collaborators");

    // Notification feed MUST redact private project title/metadata after access revocation!
    const notifJson = await (
      await getNotifications(makeReq("http://localhost/api/notifications", "GET"))
    ).json();
    const leaked = notifJson.data.notifications.some(
      (n: any) => n.relatedProject?.title === "Confidential Brand System"
    );
    assert(!leaked, "Removed collaborator must NOT see private project title in notifications");

    // Existing CreatorConnection and Follow relationships remain 100% untouched!
    assert(
      mockDb.connections.length === 1 && mockDb.connections[0].status === ConnectionStatus.Accepted,
      "Removing a collaborator must NEVER delete their CreatorConnection"
    );
    assert(
      mockDb.follows.length === 1 && mockDb.follows[0].followerId === INVITEE_ID,
      "Removing a collaborator must NEVER delete their Follow relationship"
    );
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n=========================================================================");
  console.log(`Phase 3.3 Test Summary: ${passedCount}/${results.length} PASSED`);
  console.log("=========================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase33TestSuite().catch((err) => {
  console.error("Fatal error running Phase 3.3 test suite:", err);
  process.exit(1);
});
