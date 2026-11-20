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
import { authorize } from "../src/lib/rbac";
import { getConnectionPairKey } from "../src/lib/social-privacy";
import {
  ConnectionStatus,
  NotificationType,
  ProjectStatus,
  SocialPrivacy,
  Visibility,
} from "@prisma/client";
import {
  GET as getConnections,
  POST as sendConnectionRequest,
} from "../src/app/api/connections/route";
import { GET as getConnectionRequests } from "../src/app/api/connections/requests/route";
import {
  PATCH as respondConnectionRequest,
  DELETE as deleteConnection,
} from "../src/app/api/connections/[id]/route";
import { GET as getPortfolio } from "../src/app/api/portfolio/[username]/route";
import { PATCH as updateProfile } from "../src/app/api/profile/route";
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

// Controlled auth context for deterministic route invocation
let currentUser: any = null;
(authModule as any).getCurrentUser = async () => currentUser;

// Stable valid UUIDs for Zod UUID validation
const ALICE_ID = "11111111-1111-4111-8111-111111111111";
const BOB_ID = "22222222-2222-4222-8222-222222222222";
const CHARLIE_ID = "33333333-3333-4333-8333-333333333333";
const DANA_ID = "44444444-4444-4444-8444-444444444444";
const PRIVATE_PROJECT_ID = "99999999-9999-4999-8999-999999999999";

async function runPhase31TestSuite() {
  console.log("=======================================================================");
  console.log("CreativeSpace Phase 3.1: Peer Creator Connections & Social Privacy Tests");
  console.log("(In-Memory Transactional Harness with PostgreSQL Constraint Simulation)");
  console.log("=======================================================================\n");

  const mockDb: {
    users: Record<string, any>;
    connections: any[];
    notifications: any[];
    follows: any[];
    projects: Record<string, any>;
  } = {
    users: {
      [ALICE_ID]: {
        id: ALICE_ID,
        username: "alice_creator",
        displayName: "Alice Creator",
        email: "alice@example.com",
        bio: "Illustrator",
        avatarUrl: null,
        disciplines: ["Illustration"],
        socialLinks: {
          website: "https://alice.art",
          github: "https://github.com/alice",
        },
        socialPrivacy: SocialPrivacy.Public,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        portfolio: { id: "port-alice", customSlug: "alice", portfolioProjects: [] },
      },
      [BOB_ID]: {
        id: BOB_ID,
        username: "bob_animator",
        displayName: "Bob Animator",
        email: "bob@example.com",
        bio: "3D Animator",
        avatarUrl: null,
        disciplines: ["Animation"],
        socialLinks: {
          twitter: "https://twitter.com/bob_anim",
          behance: "https://behance.net/bob_anim",
        },
        socialPrivacy: SocialPrivacy.ConnectionsOnly,
        createdAt: new Date("2026-01-02T00:00:00Z"),
        portfolio: { id: "port-bob", customSlug: "bob", portfolioProjects: [] },
      },
      [CHARLIE_ID]: {
        id: CHARLIE_ID,
        username: "charlie_music",
        displayName: "Charlie Music",
        email: "charlie@example.com",
        bio: "Composer",
        avatarUrl: null,
        disciplines: ["Music"],
        socialLinks: {
          website: "https://charlie.music",
          instagram: "https://instagram.com/charlie_private",
        },
        socialPrivacy: SocialPrivacy.Private,
        createdAt: new Date("2026-01-03T00:00:00Z"),
        portfolio: { id: "port-charlie", customSlug: "charlie", portfolioProjects: [] },
      },
      [DANA_ID]: {
        id: DANA_ID,
        username: "dana_design",
        displayName: "Dana Designer",
        email: "dana@example.com",
        bio: "UI/UX Designer",
        avatarUrl: null,
        disciplines: ["UI/UX"],
        socialLinks: {
          website: { url: "https://dana.design", visibility: SocialPrivacy.Public },
          discord: { url: "https://discord.gg/dana", visibility: SocialPrivacy.ConnectionsOnly },
          personal: { url: "https://private.dana.me", visibility: SocialPrivacy.Private },
        },
        socialPrivacy: SocialPrivacy.ConnectionsOnly,
        createdAt: new Date("2026-01-04T00:00:00Z"),
        portfolio: { id: "port-dana", customSlug: "dana", portfolioProjects: [] },
      },
    },
    connections: [],
    notifications: [],
    follows: [
      {
        id: randomUUID(),
        followerId: CHARLIE_ID,
        followingId: BOB_ID,
        createdAt: new Date("2026-02-01T00:00:00Z"),
      },
    ],
    projects: {
      [PRIVATE_PROJECT_ID]: {
        id: PRIVATE_PROJECT_ID,
        creatorId: BOB_ID,
        title: "Bob's Private Film",
        visibility: Visibility.Private,
        status: ProjectStatus.InProgress,
        metadata: {},
        collaborators: [],
      },
    },
  };

  // Optional async delay toggle to simulate true concurrent interleaving
  let injectCreateDelayMs = 0;

  function hydrateConnection(conn: any, include?: any) {
    if (!conn) return null;
    const clone = { ...conn };
    if (include?.requester) {
      const u = mockDb.users[conn.requesterId];
      clone.requester = u
        ? {
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            disciplines: u.disciplines,
          }
        : null;
    }
    if (include?.receiver) {
      const u = mockDb.users[conn.receiverId];
      clone.receiver = u
        ? {
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            bio: u.bio,
            disciplines: u.disciplines,
          }
        : null;
    }
    return clone;
  }

  function enforcePgConnectionConstraints(record: any, ignoreId?: string) {
    // PG CHECK: connections_no_self_connection_check
    if (record.requesterId === record.receiverId) {
      const err: any = new Error("CHECK constraint violated: connections_no_self_connection_check");
      err.code = "23514";
      throw err;
    }

    // PG CHECK: connections_pair_key_canonical_check
    const canonical = getConnectionPairKey(record.requesterId, record.receiverId);
    if (record.pairKey !== canonical) {
      const err: any = new Error("CHECK constraint violated: connections_pair_key_canonical_check");
      err.code = "23514";
      throw err;
    }

    // PG CHECK: connections_status_timestamps_check
    const validTimestamps =
      (record.status === ConnectionStatus.Accepted && record.acceptedAt != null && record.rejectedAt == null) ||
      (record.status === ConnectionStatus.Rejected && record.rejectedAt != null && record.acceptedAt == null) ||
      (record.status === ConnectionStatus.Pending && record.acceptedAt == null && record.rejectedAt == null);
    if (!validTimestamps) {
      const err: any = new Error("CHECK constraint violated: connections_status_timestamps_check");
      err.code = "23514";
      throw err;
    }

    // PG UNIQUE: connections_pairKey_key & connections_unordered_pair_unique_idx
    const duplicate = mockDb.connections.find(
      (c) =>
        c.id !== ignoreId &&
        (c.pairKey === record.pairKey ||
          getConnectionPairKey(c.requesterId, c.receiverId) === canonical)
    );
    if (duplicate) {
      const err: any = new Error("Unique constraint failed on connections_unordered_pair_unique_idx");
      err.code = "P2002";
      throw err;
    }
  }

  const mockTx: any = {
    $executeRaw: async () => 1,
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) return mockDb.users[where.id] || null;
        if (where.username) {
          const found = Object.values(mockDb.users).find((u) => u.username === where.username);
          if (!found) return null;
          const followerCount = mockDb.follows.filter((f) => f.followingId === found.id).length;
          const followingCount = mockDb.follows.filter((f) => f.followerId === found.id).length;
          return {
            ...found,
            _count: {
              createdProjects: 0,
              followers: followerCount,
              following: followingCount,
            },
          };
        }
        return null;
      },
      update: async ({ where, data }: any) => {
        const existing = mockDb.users[where.id];
        if (!existing) throw new Error("User not found");
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        mockDb.users[where.id] = updated;
        return updated;
      },
    },
    project: {
      findUnique: async ({ where }: any) => {
        return mockDb.projects[where.id] || null;
      },
    },
    follow: {
      findMany: async ({ where }: any) => {
        return mockDb.follows.filter((f) => {
          if (where?.followerId && f.followerId !== where.followerId) return false;
          if (where?.followingId && f.followingId !== where.followingId) return false;
          return true;
        });
      },
    },
    connection: {
      findUnique: async ({ where, include }: any) => {
        const found = mockDb.connections.find(
          (c) =>
            (where.id && c.id === where.id) ||
            (where.pairKey && c.pairKey === where.pairKey)
        );
        return hydrateConnection(found, include);
      },
      findMany: async ({ where, include }: any) => {
        const list = mockDb.connections.filter((c) => {
          if (where?.status && c.status !== where.status) return false;
          if (where?.receiverId && c.receiverId !== where.receiverId) return false;
          if (where?.requesterId && c.requesterId !== where.requesterId) return false;
          if (where?.OR) {
            const matched = where.OR.some(
              (cond: any) =>
                (cond.requesterId && c.requesterId === cond.requesterId) ||
                (cond.receiverId && c.receiverId === cond.receiverId)
            );
            if (!matched) return false;
          }
          return true;
        });
        return list.map((c) => hydrateConnection(c, include));
      },
      create: async ({ data, include }: any) => {
        if (injectCreateDelayMs > 0) {
          await new Promise((r) => setTimeout(r, injectCreateDelayMs));
        }
        const now = new Date();
        const record = {
          id: randomUUID(),
          requesterId: data.requesterId,
          receiverId: data.receiverId,
          pairKey: data.pairKey,
          status: data.status ?? ConnectionStatus.Pending,
          createdAt: now,
          updatedAt: now,
          acceptedAt: data.acceptedAt ?? null,
          rejectedAt: data.rejectedAt ?? null,
        };
        enforcePgConnectionConstraints(record);
        mockDb.connections.push(record);
        return hydrateConnection(record, include);
      },
      update: async ({ where, data, include }: any) => {
        const idx = mockDb.connections.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error("Connection not found");
        const updated = {
          ...mockDb.connections[idx],
          ...data,
          updatedAt: new Date(),
        };
        enforcePgConnectionConstraints(updated, updated.id);
        mockDb.connections[idx] = updated;
        return hydrateConnection(updated, include);
      },
      delete: async ({ where }: any) => {
        const idx = mockDb.connections.findIndex((c) => c.id === where.id);
        if (idx === -1) throw new Error("Connection not found");
        const [removed] = mockDb.connections.splice(idx, 1);
        // Cascade delete notifications linked to this connection (matches onDelete: Cascade)
        mockDb.notifications = mockDb.notifications.filter(
          (n) => n.relatedConnectionId !== removed.id
        );
        return removed;
      },
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
          isRead: false,
          createdAt: new Date(),
        };
        mockDb.notifications.push(notif);
        return notif;
      },
      findMany: async ({ where, include }: any) => {
        return mockDb.notifications
          .filter((n) => !where?.userId || n.userId === where.userId)
          .map((n) => {
            const hydrated: any = { ...n };
            if (include?.relatedUser && n.relatedUserId) {
              const actor = mockDb.users[n.relatedUserId];
              hydrated.relatedUser = actor
                ? {
                    id: actor.id,
                    username: actor.username,
                    displayName: actor.displayName,
                    avatarUrl: actor.avatarUrl,
                  }
                : null;
            }
            if (include?.relatedConnection && n.relatedConnectionId) {
              const conn = mockDb.connections.find((c) => c.id === n.relatedConnectionId);
              hydrated.relatedConnection = conn
                ? {
                    id: conn.id,
                    status: conn.status,
                    requesterId: conn.requesterId,
                    receiverId: conn.receiverId,
                  }
                : null;
            }
            hydrated.relatedProject = null;
            return hydrated;
          });
      },
      count: async ({ where }: any) => {
        return mockDb.notifications.filter(
          (n) =>
            (!where?.userId || n.userId === where.userId) &&
            (where?.isRead === undefined || n.isRead === where.isRead)
        ).length;
      },
    },
  };

  // Wire mocks onto Prisma singleton
  (prisma as any).user = mockTx.user;
  (prisma as any).project = mockTx.project;
  (prisma as any).follow = mockTx.follow;
  (prisma as any).connection = mockTx.connection;
  (prisma as any).notification = mockTx.notification;
  (prisma as any).$transaction = async (cb: any) => cb(mockTx);

  function makeJsonReq(url: string, method: string, body?: any): NextRequest {
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

  let aliceBobConnId = "";

  // TEST 1: Sending a valid connection request
  await runTest(1, "Sending a valid connection request creates Pending record + ConnectionRequest notification", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const res = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    const json = await res.json();
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(json.success === true, "Expected success=true");
    assert(json.data.requesterId === ALICE_ID, "requesterId must be Alice");
    assert(json.data.receiverId === BOB_ID, "receiverId must be Bob");
    assert(json.data.status === ConnectionStatus.Pending, "status must be Pending");
    assert(json.data.acceptedAt === null && json.data.rejectedAt === null, "timestamps must be null");
    aliceBobConnId = json.data.id;

    // Verify notification sent to Bob
    const notifs = mockDb.notifications.filter(
      (n) => n.userId === BOB_ID && n.type === NotificationType.ConnectionRequest
    );
    assert(notifs.length === 1, `Expected 1 ConnectionRequest notification for Bob, got ${notifs.length}`);
    assert(notifs[0].relatedUserId === ALICE_ID, "Notification actor must be Alice");
    assert(notifs[0].relatedConnectionId === aliceBobConnId, "Notification must link to connection");

    // Verify GET /api/connections/requests shows outgoing for Alice and incoming for Bob
    const aliceReqRes = await getConnectionRequests(
      makeJsonReq("http://localhost/api/connections/requests?direction=outgoing", "GET")
    );
    const aliceReqJson = await aliceReqRes.json();
    assert(aliceReqJson.data.outgoing.length === 1, "Alice should see 1 outgoing request");

    currentUser = mockDb.users[BOB_ID];
    const bobReqRes = await getConnectionRequests(
      makeJsonReq("http://localhost/api/connections/requests?direction=incoming", "GET")
    );
    const bobReqJson = await bobReqRes.json();
    assert(bobReqJson.data.incoming.length === 1, "Bob should see 1 incoming request");
  });

  // TEST 2: Rejecting a self-connection
  await runTest(2, "Rejecting a self-connection returns 400 and creates no records or notifications", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const beforeConns = mockDb.connections.length;
    const beforeNotifs = mockDb.notifications.length;

    const res = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: ALICE_ID })
    );
    assert(res.status === 400, `Expected 400 for self-connection, got ${res.status}`);
    assert(mockDb.connections.length === beforeConns, "No connection should be created");
    assert(mockDb.notifications.length === beforeNotifs, "No notification should be created");
  });

  // TEST 3: Rejecting duplicate requests (same direction)
  await runTest(3, "Rejecting duplicate pending request returns 409 with zero duplicate notifications", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const beforeConns = mockDb.connections.length;
    const beforeNotifs = mockDb.notifications.length;

    const res = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
    assert(mockDb.connections.length === beforeConns, "Duplicate connection must not be created");
    assert(mockDb.notifications.length === beforeNotifs, "Retry must not generate duplicate notification");
  });

  // TEST 4: Preventing reverse-direction duplicate requests
  await runTest(4, "Preventing reverse-direction duplicate request (Bob -> Alice while Alice -> Bob is Pending)", async () => {
    currentUser = mockDb.users[BOB_ID];
    const beforeConns = mockDb.connections.length;
    const beforeNotifs = mockDb.notifications.length;

    const res = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: ALICE_ID })
    );
    const json = await res.json();
    assert(res.status === 409, `Expected 409 Conflict for reverse duplicate, got ${res.status}`);
    assert(json.error?.details?.existingConnectionId === aliceBobConnId, "Should reference existing pending connection");
    assert(mockDb.connections.length === beforeConns, "Must preserve single unordered-pair relationship");
    assert(mockDb.notifications.length === beforeNotifs, "Must not create duplicate notification");
  });

  // TEST 8: Preventing unauthorized acceptance (requester & third party & anonymous)
  await runTest(8, "Preventing unauthorized acceptance by requester, unrelated user, or unauthenticated caller", async () => {
    // Anonymous caller -> 401
    currentUser = null;
    const anonRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    assert(anonRes.status === 401, `Expected 401 for anonymous accept, got ${anonRes.status}`);

    // Requester (Alice) attempting to self-accept -> 403
    currentUser = mockDb.users[ALICE_ID];
    const reqRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    assert(reqRes.status === 403, `Expected 403 when requester tries to accept, got ${reqRes.status}`);

    // Third party (Charlie) attempting to accept -> 403
    currentUser = mockDb.users[CHARLIE_ID];
    const thirdRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    assert(thirdRes.status === 403, `Expected 403 when third party tries to accept, got ${thirdRes.status}`);
  });

  // TEST 9: Preventing unauthorized rejection (requester & third party)
  await runTest(9, "Preventing unauthorized rejection by requester or unrelated user", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const reqRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "reject" }),
      { params: { id: aliceBobConnId } }
    );
    assert(reqRes.status === 403, `Expected 403 when requester tries to reject, got ${reqRes.status}`);

    currentUser = mockDb.users[CHARLIE_ID];
    const thirdRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "reject" }),
      { params: { id: aliceBobConnId } }
    );
    assert(thirdRes.status === 403, `Expected 403 when third party tries to reject, got ${thirdRes.status}`);
  });

  // TEST 6: Rejecting a request (plus re-request policy verification)
  await runTest(6, "Rejecting a request sets Rejected status + rejectedAt, sends no acceptance notification, and supports re-request policy", async () => {
    currentUser = mockDb.users[BOB_ID];
    const beforeAcceptNotifs = mockDb.notifications.filter(
      (n) => n.type === NotificationType.ConnectionAccepted
    ).length;

    const rejRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "reject" }),
      { params: { id: aliceBobConnId } }
    );
    const rejJson = await rejRes.json();
    assert(rejRes.status === 200, `Expected 200, got ${rejRes.status}`);
    assert(rejJson.data.status === ConnectionStatus.Rejected, "Status must be Rejected");
    assert(rejJson.data.rejectedAt !== null, "rejectedAt must be set");
    assert(rejJson.data.acceptedAt === null, "acceptedAt must remain null");
    assert(rejJson.data.requesterId === ALICE_ID && rejJson.data.receiverId === BOB_ID, "Identities preserved");

    const afterAcceptNotifs = mockDb.notifications.filter(
      (n) => n.type === NotificationType.ConnectionAccepted
    ).length;
    assert(afterAcceptNotifs === beforeAcceptNotifs, "Rejection must NOT generate acceptance notification");

    // Cannot accept an already Rejected request
    const lateAccept = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    assert(lateAccept.status === 409, `Expected 409 accepting rejected request, got ${lateAccept.status}`);

    // Re-request policy: Alice can re-initiate on the single canonical row
    currentUser = mockDb.users[ALICE_ID];
    const reReqRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    const reReqJson = await reReqRes.json();
    assert(reReqRes.status === 201, `Expected 201 on re-request, got ${reReqRes.status}`);
    assert(reReqJson.data.id === aliceBobConnId, "Re-request must reuse single canonical connection row");
    assert(reReqJson.data.status === ConnectionStatus.Pending, "Re-requested status must be Pending");
    assert(reReqJson.data.rejectedAt === null, "rejectedAt must be cleared on re-request");
    assert(mockDb.connections.length === 1, "Still strictly 1 connection record between Alice and Bob");
  });

  // TEST 5: Accepting a pending request
  await runTest(5, "Accepting a pending request updates to Accepted, sets acceptedAt, sends ConnectionAccepted notification, and is retry-safe", async () => {
    currentUser = mockDb.users[BOB_ID];
    const res = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.data.status === ConnectionStatus.Accepted, "Status must be Accepted");
    assert(json.data.acceptedAt !== null, "acceptedAt must be set");
    assert(json.data.rejectedAt === null, "rejectedAt must be null");
    assert(json.data.requesterId === ALICE_ID && json.data.receiverId === BOB_ID, "Original requester/receiver preserved");

    const acceptedNotifs = mockDb.notifications.filter(
      (n) => n.userId === ALICE_ID && n.type === NotificationType.ConnectionAccepted
    );
    assert(acceptedNotifs.length === 1, `Expected 1 ConnectionAccepted notification for Alice, got ${acceptedNotifs.length}`);
    assert(acceptedNotifs[0].relatedUserId === BOB_ID, "Notification actor must be Bob");

    // Retry accept must fail with 409 and NOT create a duplicate notification
    const retryRes = await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceBobConnId } }
    );
    assert(retryRes.status === 409, `Expected 409 on duplicate accept retry, got ${retryRes.status}`);
    const afterRetryNotifs = mockDb.notifications.filter(
      (n) => n.userId === ALICE_ID && n.type === NotificationType.ConnectionAccepted
    );
    assert(afterRetryNotifs.length === 1, "Retry accept must NOT create duplicate notification");

    // Sending a new request to an already-Accepted peer returns 409
    currentUser = mockDb.users[ALICE_ID];
    const dupAcceptedReq = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    assert(dupAcceptedReq.status === 409, `Expected 409 when already connected, got ${dupAcceptedReq.status}`);

    // Both Alice and Bob see each other in GET /api/connections
    const aliceListRes = await getConnections();
    const aliceListJson = await aliceListRes.json();
    assert(aliceListJson.data.connections.length === 1, "Alice should have 1 accepted connection");
    assert(aliceListJson.data.connections[0].peer.id === BOB_ID, "Alice's peer should be Bob");
  });

  // TEST 7: Cancelling an outgoing request
  await runTest(7, "Cancelling an outgoing Pending request works only for requester and blocks receiver/others", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const sendRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: CHARLIE_ID })
    );
    const sendJson = await sendRes.json();
    const aliceCharlieId = sendJson.data.id;
    assert(sendRes.status === 201, "Alice -> Charlie request should succeed");

    // Receiver (Charlie) cannot DELETE/cancel Pending request -> 403
    currentUser = mockDb.users[CHARLIE_ID];
    const receiverCancel = await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${aliceCharlieId}`, "DELETE"),
      { params: { id: aliceCharlieId } }
    );
    assert(receiverCancel.status === 403, `Expected 403 when receiver tries to cancel, got ${receiverCancel.status}`);

    // Unrelated user (Bob) cannot cancel -> 403
    currentUser = mockDb.users[BOB_ID];
    const bobCancel = await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${aliceCharlieId}`, "DELETE"),
      { params: { id: aliceCharlieId } }
    );
    assert(bobCancel.status === 403, `Expected 403 when unrelated user tries to cancel, got ${bobCancel.status}`);

    // Original requester (Alice) cancels -> 200, row removed, no acceptance notification created
    currentUser = mockDb.users[ALICE_ID];
    const cancelRes = await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${aliceCharlieId}`, "DELETE"),
      { params: { id: aliceCharlieId } }
    );
    const cancelJson = await cancelRes.json();
    assert(cancelRes.status === 200, `Expected 200 on requester cancel, got ${cancelRes.status}`);
    assert(cancelJson.data.action === "cancelled", "Expected action='cancelled'");
    assert(
      !mockDb.connections.some((c) => c.id === aliceCharlieId),
      "Cancelled request should be removed"
    );
    assert(
      !mockDb.notifications.some((n) => n.relatedConnectionId === aliceCharlieId),
      "Cascaded pending request notification should be removed on cancel"
    );
  });

  // TEST 10: Removing an accepted connection
  await runTest(10, "Removing an accepted connection works for either connected user and blocks unrelated users", async () => {
    // Unrelated user (Charlie) cannot remove Alice-Bob connection -> 403
    currentUser = mockDb.users[CHARLIE_ID];
    const unauthDel = await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "DELETE"),
      { params: { id: aliceBobConnId } }
    );
    assert(unauthDel.status === 403, `Expected 403 when third party removes connection, got ${unauthDel.status}`);

    // Receiver (Bob) removes accepted connection -> 200
    currentUser = mockDb.users[BOB_ID];
    const delRes = await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${aliceBobConnId}`, "DELETE"),
      { params: { id: aliceBobConnId } }
    );
    const delJson = await delRes.json();
    assert(delRes.status === 200, `Expected 200 on connection removal, got ${delRes.status}`);
    assert(delJson.data.action === "removed", "Expected action='removed'");
    assert(
      !mockDb.connections.some((c) => c.id === aliceBobConnId),
      "Removed connection should no longer exist"
    );
  });

  // TEST 11: Public social links visible to anonymous visitors
  await runTest(11, "Public social links are visible to anonymous visitors on GET /api/portfolio/[username]", async () => {
    currentUser = null; // Anonymous visitor
    const res = await getPortfolio(
      makeJsonReq("http://localhost/api/portfolio/alice_creator", "GET"),
      { params: { username: "alice_creator" } }
    );
    const json = await res.json();
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(json.data.creator.socialLinks !== null, "Public socialLinks should be visible to anonymous callers");
    assert(json.data.creator.socialLinks.website === "https://alice.art", "Website link should be present");
    assert(json.data.creator.socialLinks.github === "https://github.com/alice", "GitHub link should be present");
  });

  // TEST 12: ConnectionsOnly links hidden from anonymous visitors (and non-connected users)
  await runTest(12, "ConnectionsOnly social links are hidden from anonymous visitors and non-connected users", async () => {
    // Anonymous caller viewing Bob (ConnectionsOnly)
    currentUser = null;
    const anonRes = await getPortfolio(
      makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
      { params: { username: "bob_animator" } }
    );
    const anonJson = await anonRes.json();
    assert(anonRes.status === 200, `Expected 200, got ${anonRes.status}`);
    assert(
      anonJson.data.creator.socialLinks === null,
      `Anonymous visitor must NOT see ConnectionsOnly links, got ${JSON.stringify(anonJson.data.creator.socialLinks)}`
    );

    // Authenticated non-connected user (Alice) viewing Bob
    currentUser = mockDb.users[ALICE_ID];
    const unconnRes = await getPortfolio(
      makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
      { params: { username: "bob_animator" } }
    );
    const unconnJson = await unconnRes.json();
    assert(
      unconnJson.data.creator.socialLinks === null,
      "Non-connected authenticated user must NOT see ConnectionsOnly links"
    );
  });

  // TEST 13: ConnectionsOnly links visible to accepted connections (plus per-link visibility support)
  await runTest(13, "ConnectionsOnly social links are visible to accepted connections (including per-link visibility filtering)", async () => {
    // Establish accepted connection between Alice and Dana (who has mixed per-link visibility)
    currentUser = mockDb.users[ALICE_ID];
    const reqRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: DANA_ID })
    );
    const aliceDanaId = (await reqRes.json()).data.id;

    currentUser = mockDb.users[DANA_ID];
    await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceDanaId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceDanaId } }
    );

    // Anonymous viewer on Dana: sees ONLY Public link ("website"), NOT ConnectionsOnly or Private
    currentUser = null;
    const anonDana = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/dana_design", "GET"),
        { params: { username: "dana_design" } }
      )
    ).json();
    assert(anonDana.data.creator.socialLinks?.website?.url === "https://dana.design", "Public per-link should be visible to anonymous");
    assert(anonDana.data.creator.socialLinks?.discord === undefined, "ConnectionsOnly per-link must be hidden from anonymous");
    assert(anonDana.data.creator.socialLinks?.personal === undefined, "Private per-link must be hidden from anonymous");

    // Accepted connection (Alice) viewing Dana: sees Public + ConnectionsOnly, NEVER Private
    currentUser = mockDb.users[ALICE_ID];
    const connDana = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/dana_design", "GET"),
        { params: { username: "dana_design" } }
      )
    ).json();
    assert(connDana.data.creator.socialLinks?.website?.url === "https://dana.design", "Accepted connection sees Public link");
    assert(connDana.data.creator.socialLinks?.discord?.url === "https://discord.gg/dana", "Accepted connection sees ConnectionsOnly link");
    assert(connDana.data.creator.socialLinks?.personal === undefined, "Accepted connection must NEVER see Private link");

    // Owner (Dana) sees all 3 links
    currentUser = mockDb.users[DANA_ID];
    const ownerDana = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/dana_design", "GET"),
        { params: { username: "dana_design" } }
      )
    ).json();
    assert(ownerDana.data.creator.socialLinks?.personal?.url === "https://private.dana.me", "Owner must see their own Private link");
  });

  // TEST 14: Private links visible ONLY to the profile owner
  await runTest(14, "Private social links are visible only to the profile owner and hidden from anonymous and accepted connections", async () => {
    // Establish Accepted connection between Alice and Charlie (Charlie has global socialPrivacy = Private)
    currentUser = mockDb.users[ALICE_ID];
    const sendRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: CHARLIE_ID })
    );
    const aliceCharlieConnId = (await sendRes.json()).data.id;

    currentUser = mockDb.users[CHARLIE_ID];
    await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${aliceCharlieConnId}`, "PATCH", { action: "accept" }),
      { params: { id: aliceCharlieConnId } }
    );

    // Anonymous -> hidden
    currentUser = null;
    const anonCharlie = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/charlie_music", "GET"),
        { params: { username: "charlie_music" } }
      )
    ).json();
    assert(anonCharlie.data.creator.socialLinks === null, "Private links must be hidden from anonymous");

    // Accepted connection (Alice) -> STILL hidden!
    currentUser = mockDb.users[ALICE_ID];
    const connCharlie = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/charlie_music", "GET"),
        { params: { username: "charlie_music" } }
      )
    ).json();
    assert(connCharlie.data.creator.socialLinks === null, "Private links must be hidden even from accepted connections");

    // Owner (Charlie) -> visible!
    currentUser = mockDb.users[CHARLIE_ID];
    const ownerCharlie = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/charlie_music", "GET"),
        { params: { username: "charlie_music" } }
      )
    ).json();
    assert(ownerCharlie.data.creator.socialLinks?.website === "https://charlie.music", "Owner must see own Private links");
  });

  // TEST 15: Connection status transitions dynamically affect social-link visibility
  await runTest(15, "Connection status changes (None -> Pending -> Rejected -> Pending -> Accepted -> Removed) dynamically control social-link visibility", async () => {
    const checkAliceSeesBobLinks = async () => {
      currentUser = mockDb.users[ALICE_ID];
      const res = await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
        { params: { username: "bob_animator" } }
      );
      return (await res.json()).data.creator.socialLinks;
    };

    // 1. None -> hidden
    assert((await checkAliceSeesBobLinks()) === null, "State=None: links must be hidden");

    // 2. Pending -> hidden
    currentUser = mockDb.users[ALICE_ID];
    const connId = (
      await (
        await sendConnectionRequest(
          makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
        )
      ).json()
    ).data.id;
    assert((await checkAliceSeesBobLinks()) === null, "State=Pending: links must remain hidden");

    // 3. Rejected -> hidden
    currentUser = mockDb.users[BOB_ID];
    await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${connId}`, "PATCH", { action: "reject" }),
      { params: { id: connId } }
    );
    assert((await checkAliceSeesBobLinks()) === null, "State=Rejected: links must remain hidden");

    // 4. Re-request (Pending) -> hidden, then Accepted -> visible
    currentUser = mockDb.users[ALICE_ID];
    await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    assert((await checkAliceSeesBobLinks()) === null, "State=Pending(re-requested): links must remain hidden");

    currentUser = mockDb.users[BOB_ID];
    await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${connId}`, "PATCH", { action: "accept" }),
      { params: { id: connId } }
    );
    const visibleLinks = await checkAliceSeesBobLinks();
    assert(
      visibleLinks?.twitter === "https://twitter.com/bob_anim",
      "State=Accepted: ConnectionsOnly links must now be visible"
    );

    // 5. Removed -> hidden again immediately
    currentUser = mockDb.users[ALICE_ID];
    await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${connId}`, "DELETE"),
      { params: { id: connId } }
    );
    assert((await checkAliceSeesBobLinks()) === null, "State=Removed: links must immediately be hidden again");
  });

  // TEST 16: Concurrent requests between the same two users (A -> B and B -> A simultaneously)
  await runTest(16, "Concurrent reverse-direction requests (Bob -> Dana and Dana -> Bob) produce exactly 1 connection & 1 notification", async () => {
    const beforeNotifs = mockDb.notifications.length;
    injectCreateDelayMs = 25; // Force async interleaving between findUnique and create

    try {
      // Simulate Bob -> Dana and Dana -> Bob racing simultaneously.
      // Because getCurrentUser() is read at request entry, capture per-request caller via queue.
      const callerQueue = [mockDb.users[BOB_ID], mockDb.users[DANA_ID]];
      (authModule as any).getCurrentUser = async () => callerQueue.shift() ?? currentUser;

      const [res1, res2] = await Promise.all([
        sendConnectionRequest(
          makeJsonReq("http://localhost/api/connections", "POST", { receiverId: DANA_ID })
        ),
        sendConnectionRequest(
          makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
        ),
      ]);

      const statuses = [res1.status, res2.status].sort();
      assert(
        statuses[0] === 201 && statuses[1] === 409,
        `Expected exactly one 201 and one 409 under concurrency, got ${JSON.stringify(statuses)}`
      );

      const pairKey = getConnectionPairKey(BOB_ID, DANA_ID);
      const pairConns = mockDb.connections.filter((c) => c.pairKey === pairKey);
      assert(pairConns.length === 1, `Expected strictly 1 connection record, got ${pairConns.length}`);

      const newNotifs = mockDb.notifications.length - beforeNotifs;
      assert(newNotifs === 1, `Expected strictly 1 notification created, got ${newNotifs}`);
    } finally {
      injectCreateDelayMs = 0;
      (authModule as any).getCurrentUser = async () => currentUser;
    }
  });

  // TEST 17: Existing Follow & ProjectCollaborator independence
  await runTest(17, "Existing Follow functionality remains independent AND accepted connections do NOT grant private project workspace access", async () => {
    // Charlie already follows Bob in mockDb.follows, with NO Connection record between Charlie and Bob
    assert(
      mockDb.follows.some((f) => f.followerId === CHARLIE_ID && f.followingId === BOB_ID),
      "Precondition: Charlie follows Bob"
    );

    // Following Bob does NOT reveal Bob's ConnectionsOnly social links
    currentUser = mockDb.users[CHARLIE_ID];
    const portfolioJson = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
        { params: { username: "bob_animator" } }
      )
    ).json();
    assert(
      portfolioJson.data.creator.socialLinks === null,
      "Following a creator must NOT bypass ConnectionsOnly privacy"
    );
    assert(
      portfolioJson.data.creator.stats.followers === 1,
      "Follow counts must remain completely intact and unaffected"
    );

    // Now connect Charlie <-> Bob and remove connection; Follow row must stay untouched
    const sendRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    const charlieBobId = (await sendRes.json()).data.id;
    currentUser = mockDb.users[BOB_ID];
    await respondConnectionRequest(
      makeJsonReq(`http://localhost/api/connections/${charlieBobId}`, "PATCH", { action: "accept" }),
      { params: { id: charlieBobId } }
    );

    // Critical security rule: Accepted Connection does NOT grant access to Bob's Private project!
    let projectAccessDenied = false;
    try {
      await authorize(mockDb.users[CHARLIE_ID], PRIVATE_PROJECT_ID, "view_project");
    } catch (err: any) {
      projectAccessDenied = err.statusCode === 403;
    }
    assert(
      projectAccessDenied,
      "Accepted peer connection MUST NOT grant access to a peer's private project workspace"
    );

    // Removing connection leaves Follow intact
    currentUser = mockDb.users[CHARLIE_ID];
    await deleteConnection(
      makeJsonReq(`http://localhost/api/connections/${charlieBobId}`, "DELETE"),
      { params: { id: charlieBobId } }
    );
    assert(
      mockDb.follows.some((f) => f.followerId === CHARLIE_ID && f.followingId === BOB_ID),
      "Removing a connection must NOT delete existing Follow records"
    );
  });

  // TEST 18: Per-viewer portfolio connection state isolation & no-store caching headers
  await runTest(18, "GET /api/portfolio/[username] sets private no-store cache headers and isolates per-viewer connection state", async () => {
    // Alice sends a fresh pending request to Bob
    currentUser = mockDb.users[ALICE_ID];
    const sendRes = await sendConnectionRequest(
      makeJsonReq("http://localhost/api/connections", "POST", { receiverId: BOB_ID })
    );
    const reqId = (await sendRes.json()).data.id;

    // 1. Anonymous visitor sees connection=null + private, no-store cache header
    currentUser = null;
    const anonRes = await getPortfolio(
      makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
      { params: { username: "bob_animator" } }
    );
    const anonJson = await anonRes.json();
    assert(
      Boolean(anonRes.headers.get("cache-control")?.includes("no-store")),
      "Portfolio response must include Cache-Control: no-store"
    );
    assert(
      Boolean(anonRes.headers.get("cache-control")?.includes("private")),
      "Portfolio response must include Cache-Control: private"
    );
    assert(anonJson.data.connection === null, "Anonymous viewer must see connection=null");
    assert(anonJson.data.creator.socialPrivacy === undefined, "Visitors must not receive internal socialPrivacy config");

    // 2. Requester (Alice) viewing Bob sees outgoing Pending
    currentUser = mockDb.users[ALICE_ID];
    const aliceView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
        { params: { username: "bob_animator" } }
      )
    ).json();
    assert(aliceView.data.connection?.id === reqId, "Alice should see her connection ID");
    assert(aliceView.data.connection?.status === ConnectionStatus.Pending, "Status should be Pending");
    assert(aliceView.data.connection?.direction === "outgoing", "Direction for Alice should be outgoing");

    // 3. Receiver (Bob) viewing Alice sees incoming Pending
    currentUser = mockDb.users[BOB_ID];
    const bobView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/alice_creator", "GET"),
        { params: { username: "alice_creator" } }
      )
    ).json();
    assert(bobView.data.connection?.status === ConnectionStatus.Pending, "Bob should see Pending");
    assert(bobView.data.connection?.direction === "incoming", "Direction for Bob should be incoming");

    // 4. Unrelated third party (Charlie) viewing Bob sees connection=null (zero leakage of Alice-Bob)
    currentUser = mockDb.users[CHARLIE_ID];
    const charlieView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
        { params: { username: "bob_animator" } }
      )
    ).json();
    assert(charlieView.data.connection === null, "Unrelated viewer must NOT see Alice-Bob connection");

    // 5. Profile owner (Bob) viewing own portfolio sees socialPrivacy and connection=null
    currentUser = mockDb.users[BOB_ID];
    const ownerView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/bob_animator", "GET"),
        { params: { username: "bob_animator" } }
      )
    ).json();
    assert(ownerView.data.connection === null, "Owner viewing own profile sees connection=null");
    assert(ownerView.data.creator.socialPrivacy === SocialPrivacy.ConnectionsOnly, "Owner receives own socialPrivacy");
  });

  // TEST 19: Profile settings PATCH /api/profile updates socialPrivacy & mixed per-link visibility backward-compatibly
  await runTest(19, "PATCH /api/profile updates socialPrivacy and mixed legacy + per-link visibility socialLinks", async () => {
    currentUser = mockDb.users[ALICE_ID];
    const patchRes = await updateProfile(
      makeJsonReq("http://localhost/api/profile", "PATCH", {
        socialPrivacy: SocialPrivacy.ConnectionsOnly,
        socialLinks: {
          website: { url: "https://alice.art", visibility: SocialPrivacy.Public },
          github: "https://github.com/alice", // Legacy string inherits ConnectionsOnly
          instagram: { url: "https://instagram.com/alice_secret", visibility: SocialPrivacy.Private },
        },
      })
    );
    const patchJson = await patchRes.json();
    assert(patchRes.status === 200, `Expected 200 on profile update, got ${patchRes.status}`);
    assert(patchJson.data.user.socialPrivacy === SocialPrivacy.ConnectionsOnly, "socialPrivacy updated");

    // Anonymous viewer on Alice now sees ONLY website (Public), not github (ConnectionsOnly) or instagram (Private)
    currentUser = null;
    const anonView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/alice_creator", "GET"),
        { params: { username: "alice_creator" } }
      )
    ).json();
    assert(anonView.data.creator.socialLinks?.website?.url === "https://alice.art", "Public override link visible");
    assert(anonView.data.creator.socialLinks?.github === undefined, "Inherited ConnectionsOnly link hidden from anonymous");
    assert(anonView.data.creator.socialLinks?.instagram === undefined, "Private link hidden from anonymous");

    // Accepted connection (Dana) sees website + github, NEVER instagram
    currentUser = mockDb.users[DANA_ID];
    const connView = await (
      await getPortfolio(
        makeJsonReq("http://localhost/api/portfolio/alice_creator", "GET"),
        { params: { username: "alice_creator" } }
      )
    ).json();
    assert(connView.data.creator.socialLinks?.website?.url === "https://alice.art", "Connected peer sees Public link");
    assert(connView.data.creator.socialLinks?.github === "https://github.com/alice", "Connected peer sees inherited legacy ConnectionsOnly link");
    assert(connView.data.creator.socialLinks?.instagram === undefined, "Connected peer must NEVER see Private link");
  });

  // TEST 20: GET /api/notifications returns safe actor identity for ConnectionRequest & ConnectionAccepted without leaking email/socialLinks
  await runTest(20, "GET /api/notifications exposes safe actor identity & connection context without leaking private fields", async () => {
    // Bob currently has a Pending request notification from Alice (created in Test 18)
    currentUser = mockDb.users[BOB_ID];
    const bobNotifRes = await getNotifications(
      makeJsonReq("http://localhost/api/notifications", "GET")
    );
    const bobNotifJson = await bobNotifRes.json();
    assert(bobNotifRes.status === 200, `Expected 200, got ${bobNotifRes.status}`);

    const connReqNotif = bobNotifJson.data.notifications.find(
      (n: any) => n.type === NotificationType.ConnectionRequest && n.relatedUserId === ALICE_ID
    );
    assert(Boolean(connReqNotif), "Bob should have a ConnectionRequest notification from Alice");
    assert(connReqNotif.relatedUser?.username === "alice_creator", "Safe actor username included");
    assert(connReqNotif.relatedUser?.displayName === "Alice Creator", "Safe actor displayName included");
    assert(connReqNotif.relatedUser?.email === undefined, "Actor email must NEVER be exposed in notifications");
    assert(connReqNotif.relatedUser?.socialLinks === undefined, "Actor socialLinks must NEVER be exposed in notifications");
    assert(connReqNotif.relatedConnection?.status === ConnectionStatus.Pending, "Connection status context included");
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n=======================================================================");
  console.log(`Phase 3.1 Test Summary: ${passedCount}/${results.length} PASSED`);
  console.log("=======================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase31TestSuite().catch((err) => {
  console.error("Fatal error running Phase 3.1 test suite:", err);
  process.exit(1);
});
