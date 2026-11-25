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
import {
  buildActivityDedupKey,
  isSafePublicPreviewUrl,
  recordCommunityActivity,
  resolveSafePublicFeedPreview,
} from "../src/lib/activity";
import {
  ActivityType,
  CollaboratorRole,
  ConnectionStatus,
  InvitationStatus,
  NotificationType,
  ProjectStatus,
  SocialPrivacy,
  VersionStatus,
  Visibility,
} from "@prisma/client";
import {
  POST as followCreator,
  DELETE as unfollowCreator,
} from "../src/app/api/users/[id]/follow/route";
import { GET as getFollowers } from "../src/app/api/users/[id]/followers/route";
import { GET as getFollowing } from "../src/app/api/users/[id]/following/route";
import { GET as getFeed } from "../src/app/api/feed/route";
import { GET as getPortfolio } from "../src/app/api/portfolio/[username]/route";

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

const ALICE_ID = "11111111-1111-4111-8111-111111111111";
const BOB_ID = "22222222-2222-4222-8222-222222222222";
const CHARLIE_ID = "33333333-3333-4333-8333-333333333333";
const DANA_ID = "44444444-4444-4444-8444-444444444444";

const PUB_PROJ_1 = "aaaa1111-1111-4111-8111-111111111111";
const PUB_PROJ_2 = "aaaa2222-2222-4222-8222-222222222222";
const PRIV_PROJ = "bbbb1111-1111-4111-8111-111111111111";
const COLLAB_ONLY_PROJ = "cccc1111-1111-4111-8111-111111111111";

const VER_APPROVED = "v1111111-1111-4111-8111-111111111111";
const VER_FINAL = "v2222222-2222-4222-8222-222222222222";
const VER_DRAFT = "v3333333-3333-4333-8333-333333333333";
const VER_REJECTED = "v4444444-4444-4444-8444-444444444444";

async function runPhase34TestSuite() {
  console.log("=======================================================================");
  console.log("CreativeSpace Phase 3.4: Follow System & Community Activity Feed Suite");
  console.log("(In-Memory Transactional Harness with PostgreSQL Constraint Simulation)");
  console.log("=======================================================================\n");

  const mockDb = {
    users: {
      [ALICE_ID]: {
        id: ALICE_ID,
        email: "alice@secret.com",
        passwordHash: "$2a$10$secretHashAlice",
        username: "alice_art",
        displayName: "Alice Illustrator",
        bio: "Sci-fi illustrator",
        avatarUrl: null,
        disciplines: ["Illustration"],
        socialLinks: { personal: "https://private.alice.me" },
        socialPrivacy: SocialPrivacy.Private,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        portfolio: { id: "port-alice", customSlug: "alice", portfolioProjects: [] },
      },
      [BOB_ID]: {
        id: BOB_ID,
        email: "bob@secret.com",
        passwordHash: "$2a$10$secretHashBob",
        username: "bob_anim",
        displayName: "Bob Animator",
        bio: "3D motion artist",
        avatarUrl: null,
        disciplines: ["Animation"],
        socialLinks: { privateChat: "https://private.bob.me" },
        socialPrivacy: SocialPrivacy.Private,
        createdAt: new Date("2026-01-02T00:00:00Z"),
        portfolio: { id: "port-bob", customSlug: "bob", portfolioProjects: [] },
      },
      [CHARLIE_ID]: {
        id: CHARLIE_ID,
        email: "charlie@secret.com",
        passwordHash: "$2a$10$secretHashCharlie",
        username: "charlie_music",
        displayName: "Charlie Composer",
        bio: "Soundscapes",
        avatarUrl: null,
        disciplines: ["Music"],
        socialLinks: { studio: "https://private.charlie.me" },
        socialPrivacy: SocialPrivacy.Private,
        createdAt: new Date("2026-01-03T00:00:00Z"),
        portfolio: { id: "port-charlie", customSlug: "charlie", portfolioProjects: [] },
      },
      [DANA_ID]: {
        id: DANA_ID,
        email: "dana@secret.com",
        passwordHash: "$2a$10$secretHashDana",
        username: "dana_ux",
        displayName: "Dana Designer",
        bio: "Design systems",
        avatarUrl: null,
        disciplines: ["UI/UX"],
        socialLinks: {},
        socialPrivacy: SocialPrivacy.Public,
        createdAt: new Date("2026-01-04T00:00:00Z"),
        portfolio: { id: "port-dana", customSlug: "dana", portfolioProjects: [] },
      },
    } as Record<string, any>,
    projects: {
      [PUB_PROJ_1]: {
        id: PUB_PROJ_1,
        creatorId: BOB_ID,
        title: "Nebula Forest Concept",
        description: "Cosmic foliage exploration",
        category: "Animation",
        status: ProjectStatus.InProgress,
        visibility: Visibility.Public,
        metadata: {},
      },
      [PUB_PROJ_2]: {
        id: PUB_PROJ_2,
        creatorId: CHARLIE_ID,
        title: "Aurora Ambient Suite",
        description: "Spatial audio synth study",
        category: "Music",
        status: ProjectStatus.Completed,
        visibility: Visibility.Public,
        metadata: {},
      },
      [PRIV_PROJ]: {
        id: PRIV_PROJ,
        creatorId: BOB_ID,
        title: "Top Secret NDA Project",
        description: "Must NEVER appear in feed",
        category: "Animation",
        status: ProjectStatus.InProgress,
        visibility: Visibility.Private,
        metadata: {},
      },
      [COLLAB_ONLY_PROJ]: {
        id: COLLAB_ONLY_PROJ,
        creatorId: BOB_ID,
        title: "Collaborators Only Workshop",
        description: "Internal team only",
        category: "Animation",
        status: ProjectStatus.InProgress,
        visibility: Visibility.CollaboratorsOnly,
        metadata: {},
      },
    } as Record<string, any>,
    versions: [
      {
        id: VER_APPROVED,
        projectId: PUB_PROJ_1,
        versionNumber: 1,
        createdById: BOB_ID,
        status: VersionStatus.Approved,
      },
      {
        id: VER_FINAL,
        projectId: PUB_PROJ_2,
        versionNumber: 2,
        createdById: CHARLIE_ID,
        status: VersionStatus.Final,
      },
      {
        id: VER_DRAFT,
        projectId: PUB_PROJ_1,
        versionNumber: 2,
        createdById: BOB_ID,
        status: VersionStatus.Draft,
      },
      {
        id: VER_REJECTED,
        projectId: PUB_PROJ_1,
        versionNumber: 3,
        createdById: BOB_ID,
        status: VersionStatus.Rejected,
      },
    ] as any[],
    assets: [
      {
        id: "asset-approved-1",
        projectId: PUB_PROJ_1,
        versionId: VER_APPROVED,
        thumbnailPath: "https://cdn.local/approved_v1_thumb.png",
        storagePath: "projects/pub1/approved_v1.png",
        createdAt: new Date("2026-02-01T00:00:00Z"),
      },
      {
        id: "asset-draft-secret",
        projectId: PUB_PROJ_1,
        versionId: VER_DRAFT,
        thumbnailPath: "https://cdn.local/UNPUBLISHED_DRAFT_SECRET.png",
        storagePath: "projects/pub1/secret_draft.png",
        createdAt: new Date("2026-02-05T00:00:00Z"),
      },
    ] as any[],
    comments: [
      // Internal project discussion (versionId === null) -> MUST NOT be counted in public feed!
      {
        id: randomUUID(),
        projectId: PUB_PROJ_1,
        versionId: null,
        authorId: BOB_ID,
        content: "Private internal discussion",
      },
      // Public version feedback on Approved v1 -> counted!
      {
        id: randomUUID(),
        projectId: PUB_PROJ_1,
        versionId: VER_APPROVED,
        authorId: ALICE_ID,
        content: "Beautiful color palette!",
      },
    ] as any[],
    follows: [] as any[],
    connections: [
      {
        id: randomUUID(),
        requesterId: ALICE_ID,
        receiverId: BOB_ID,
        pairKey: `${ALICE_ID}:${BOB_ID}`,
        status: ConnectionStatus.Accepted,
        acceptedAt: new Date("2026-01-10T00:00:00Z"),
      },
    ] as any[],
    collaborators: [
      {
        id: randomUUID(),
        projectId: COLLAB_ONLY_PROJ,
        userId: ALICE_ID,
        role: CollaboratorRole.Collaborator,
        status: InvitationStatus.Accepted,
        acceptedAt: new Date("2026-01-10T00:00:00Z"),
      },
    ] as any[],
    likes: [] as any[],
    notifications: [] as any[],
    activities: [] as any[],
  };

  let followCreateDelayMs = 0;

  function sortDescKeyset<T extends { createdAt: Date; id: string }>(arr: T[]): T[] {
    return [...arr].sort((a, b) => {
      const tDiff = b.createdAt.getTime() - a.createdAt.getTime();
      if (tDiff !== 0) return tDiff;
      return b.id.localeCompare(a.id);
    });
  }

  function applyKeysetFilter<T extends { createdAt: Date; id: string }>(
    arr: T[],
    orClause: any
  ): T[] {
    if (!Array.isArray(orClause)) return arr;
    const ltCond = orClause.find((c: any) => c.createdAt?.lt);
    const eqCond = orClause.find((c: any) => Array.isArray(c.AND));
    if (!ltCond || !eqCond) return arr;
    const cDate: Date = ltCond.createdAt.lt;
    const cId: string = eqCond.AND.find((x: any) => x.id?.lt)?.id?.lt;
    return arr.filter(
      (item) =>
        item.createdAt.getTime() < cDate.getTime() ||
        (item.createdAt.getTime() === cDate.getTime() && item.id < cId)
    );
  }

  const mockTx: any = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.id) return mockDb.users[where.id] || null;
        if (where.username) {
          const u = Object.values(mockDb.users).find((x) => x.username === where.username);
          if (!u) return null;
          return {
            ...u,
            _count: {
              createdProjects: Object.values(mockDb.projects).filter(
                (p) => p.creatorId === u.id && p.visibility === Visibility.Public
              ).length,
              followers: mockDb.follows.filter((f) => f.followingId === u.id).length,
              following: mockDb.follows.filter((f) => f.followerId === u.id).length,
            },
          };
        }
        return null;
      },
      findMany: async ({ where, take }: any) => {
        const excluded = new Set<string>(where?.id?.notIn || []);
        const list = Object.values(mockDb.users)
          .filter((u) => {
            if (excluded.has(u.id)) return false;
            const hasPub = Object.values(mockDb.projects).some(
              (p) => p.creatorId === u.id && p.visibility === Visibility.Public
            );
            return hasPub;
          })
          .map((u) => ({
            id: u.id,
            username: u.username,
            displayName: u.displayName,
            bio: u.bio,
            avatarUrl: u.avatarUrl,
            disciplines: u.disciplines,
            _count: {
              followers: mockDb.follows.filter((f) => f.followingId === u.id).length,
              createdProjects: Object.values(mockDb.projects).filter(
                (p) => p.creatorId === u.id && p.visibility === Visibility.Public
              ).length,
            },
          }));
        return take ? list.slice(0, take) : list;
      },
    },
    project: {
      findUnique: async ({ where, include }: any) => {
        const p = mockDb.projects[where.id];
        if (!p) return null;
        const out: any = { ...p };
        if (include?.collaborators) {
          const w = include.collaborators.where;
          out.collaborators = mockDb.collaborators.filter(
            (c) =>
              c.projectId === p.id &&
              (!w?.userId || c.userId === w.userId) &&
              (!w?.acceptedAt?.not || c.acceptedAt !== null)
          );
        }
        return out;
      },
    },
    connection: {
      findUnique: async ({ where }: any) => {
        return mockDb.connections.find((c) => c.pairKey === where.pairKey) || null;
      },
    },
    follow: {
      findUnique: async ({ where }: any) => {
        const key = where.followerId_followingId;
        return (
          mockDb.follows.find(
            (f) => f.followerId === key.followerId && f.followingId === key.followingId
          ) || null
        );
      },
      findMany: async ({ where, include, take }: any) => {
        let list = mockDb.follows.filter((f) => {
          if (where?.followerId && f.followerId !== where.followerId) return false;
          if (where?.followingId) {
            if (typeof where.followingId === "string" && f.followingId !== where.followingId) {
              return false;
            }
            if (Array.isArray(where.followingId?.in) && !where.followingId.in.includes(f.followingId)) {
              return false;
            }
          }
          return true;
        });
        if (where?.OR) {
          list = applyKeysetFilter(list, where.OR);
        }
        list = sortDescKeyset(list);
        if (take) list = list.slice(0, take);
        return list.map((f) => {
          const out: any = { ...f };
          if (include?.follower) {
            const u = mockDb.users[f.followerId];
            out.follower = {
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              bio: u.bio,
              avatarUrl: u.avatarUrl,
              disciplines: u.disciplines,
            };
          }
          if (include?.following) {
            const u = mockDb.users[f.followingId];
            out.following = {
              id: u.id,
              username: u.username,
              displayName: u.displayName,
              bio: u.bio,
              avatarUrl: u.avatarUrl,
              disciplines: u.disciplines,
            };
          }
          return out;
        });
      },
      count: async ({ where }: any) => {
        return mockDb.follows.filter((f) => {
          if (where?.followingId && f.followingId !== where.followingId) return false;
          if (where?.followerId && f.followerId !== where.followerId) return false;
          return true;
        }).length;
      },
      create: async ({ data }: any) => {
        if (followCreateDelayMs > 0) {
          await new Promise((r) => setTimeout(r, followCreateDelayMs));
        }
        // PG CHECK: follows_no_self_follow_check
        if (data.followerId === data.followingId) {
          const err: any = new Error("CHECK violation: follows_no_self_follow_check");
          err.code = "23514";
          throw err;
        }
        // PG UNIQUE: (followerId, followingId)
        if (
          mockDb.follows.some(
            (f) => f.followerId === data.followerId && f.followingId === data.followingId
          )
        ) {
          const err: any = new Error("Unique constraint failed on follows(followerId, followingId)");
          err.code = "P2002";
          throw err;
        }
        const rec = {
          id: randomUUID(),
          followerId: data.followerId,
          followingId: data.followingId,
          createdAt: new Date(),
        };
        mockDb.follows.push(rec);
        return rec;
      },
      deleteMany: async ({ where }: any) => {
        const before = mockDb.follows.length;
        mockDb.follows = mockDb.follows.filter(
          (f) => !(f.followerId === where.followerId && f.followingId === where.followingId)
        );
        return { count: before - mockDb.follows.length };
      },
    },
    like: {
      findMany: async ({ where }: any) => {
        return mockDb.likes.filter(
          (l) =>
            l.userId === where.userId &&
            (!where.projectId?.in || where.projectId.in.includes(l.projectId))
        );
      },
    },
    notification: {
      findFirst: async ({ where }: any) => {
        return (
          mockDb.notifications.find(
            (n) =>
              n.userId === where.userId &&
              n.type === where.type &&
              n.relatedUserId === where.relatedUserId
          ) || null
        );
      },
      create: async ({ data }: any) => {
        const n = {
          id: randomUUID(),
          userId: data.userId,
          type: data.type,
          relatedUserId: data.relatedUserId ?? null,
          relatedProjectId: data.relatedProjectId ?? null,
          isRead: false,
          createdAt: new Date(),
        };
        mockDb.notifications.push(n);
        return n;
      },
    },
    activity: {
      findUnique: async ({ where }: any) => {
        return mockDb.activities.find((a) => a.dedupKey === where.dedupKey) || null;
      },
      create: async ({ data }: any) => {
        if (mockDb.activities.some((a) => a.dedupKey === data.dedupKey)) {
          const err: any = new Error("Unique constraint failed on activities_dedupKey_key");
          err.code = "P2002";
          throw err;
        }
        const rec = {
          id: data.id || randomUUID(),
          actorId: data.actorId,
          type: data.type,
          projectId: data.projectId,
          versionId: data.versionId ?? null,
          dedupKey: data.dedupKey,
          createdAt: data.createdAt || new Date(),
        };
        mockDb.activities.push(rec);
        return rec;
      },
      findMany: async ({ where, take }: any) => {
        let list = mockDb.activities.filter((a) => {
          const proj = mockDb.projects[a.projectId];
          if (!proj) return false;
          if (where?.project?.visibility && proj.visibility !== where.project.visibility) {
            return false;
          }
          if (where?.project?.category && proj.category !== where.project.category) {
            return false;
          }
          if (where?.actorId?.in && !where.actorId.in.includes(a.actorId)) {
            return false;
          }
          // Check version visibility AND clause
          if (a.versionId) {
            const ver = mockDb.versions.find((v) => v.id === a.versionId);
            if (
              !ver ||
              (ver.status !== VersionStatus.Approved && ver.status !== VersionStatus.Final)
            ) {
              return false;
            }
          }
          return true;
        });

        // Apply cursor keyset filter if present in AND
        const cursorAnd = Array.isArray(where?.AND)
          ? where.AND.find((c: any) => Array.isArray(c.OR) && c.OR.some((o: any) => o.createdAt?.lt))
          : null;
        if (cursorAnd) {
          list = applyKeysetFilter(list, cursorAnd.OR);
        }

        list = sortDescKeyset(list);
        if (take) list = list.slice(0, take);

        return list.map((a) => {
          const actor = mockDb.users[a.actorId];
          const proj = mockDb.projects[a.projectId];
          const ver = a.versionId
            ? mockDb.versions.find((v) => v.id === a.versionId) || null
            : null;
          const pubVersions = mockDb.versions.filter(
            (v) =>
              v.projectId === proj.id &&
              (v.status === VersionStatus.Approved || v.status === VersionStatus.Final)
          );
          const projAssets = mockDb.assets.filter((as) => as.projectId === proj.id);
          const publicCommentCount = mockDb.comments.filter((c) => {
            if (c.projectId !== proj.id || c.versionId === null) return false;
            const cv = mockDb.versions.find((v) => v.id === c.versionId);
            return cv && cv.status !== VersionStatus.Rejected;
          }).length;

          return {
            ...a,
            actor: {
              id: actor.id,
              username: actor.username,
              displayName: actor.displayName,
              avatarUrl: actor.avatarUrl,
              disciplines: actor.disciplines,
            },
            project: {
              id: proj.id,
              title: proj.title,
              description: proj.description,
              category: proj.category,
              status: proj.status,
              visibility: proj.visibility,
              metadata: proj.metadata,
              versions: pubVersions.map((v) => ({ id: v.id, status: v.status })),
              assets: projAssets,
              _count: {
                likes: mockDb.likes.filter((l) => l.projectId === proj.id).length,
                comments: publicCommentCount,
              },
            },
            version: ver
              ? {
                  id: ver.id,
                  projectId: ver.projectId,
                  versionNumber: ver.versionNumber,
                  status: ver.status,
                }
              : null,
          };
        });
      },
    },
  };

  (prisma as any).user = mockTx.user;
  (prisma as any).project = mockTx.project;
  (prisma as any).connection = mockTx.connection;
  (prisma as any).follow = mockTx.follow;
  (prisma as any).like = mockTx.like;
  (prisma as any).notification = mockTx.notification;
  (prisma as any).activity = mockTx.activity;
  (prisma as any).$transaction = async (cb: any) => cb(mockTx);

  function makeReq(url: string, method: string): NextRequest {
    return new NextRequest(url, { method });
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

  // TEST 1: Follow a creator + Follow notification + reject self-follow + prevent duplicate
  await runTest(1, "Follow creator creates Follow + notification; rejects self-follow (400) and duplicates (409)", async () => {
    currentUser = mockDb.users[ALICE_ID];

    // Self-follow rejected -> 400, 0 notifications
    const selfRes = await followCreator(
      makeReq(`http://localhost/api/users/${ALICE_ID}/follow`, "POST"),
      { params: { id: ALICE_ID } }
    );
    assert(selfRes.status === 400, `Expected 400 on self-follow, got ${selfRes.status}`);
    assert(mockDb.notifications.length === 0, "Failed self-follow must create 0 notifications");

    // Alice follows Bob -> 201 + 1 Follow notification
    const okRes = await followCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "POST"),
      { params: { id: BOB_ID } }
    );
    const okJson = await okRes.json();
    assert(okRes.status === 201 && okJson.data.following === true && okJson.data.followerCount === 1, "Follow succeeded");
    assert(
      mockDb.notifications.length === 1 &&
        mockDb.notifications[0].type === NotificationType.Follow &&
        mockDb.notifications[0].userId === BOB_ID &&
        mockDb.notifications[0].relatedUserId === ALICE_ID,
      "Bob must receive 1 Follow notification from Alice"
    );

    // Duplicate follow -> 409 + 0 duplicate notifications
    const dupRes = await followCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "POST"),
      { params: { id: BOB_ID } }
    );
    assert(dupRes.status === 409, `Expected 409 on duplicate follow, got ${dupRes.status}`);
    assert(mockDb.notifications.length === 1, "Duplicate follow must not create duplicate notification");

    // Portfolio reflects isFollowing=true for Alice viewing Bob
    const portJson = await (
      await getPortfolio(makeReq("http://localhost/api/portfolio/bob_anim", "GET"), {
        params: { username: "bob_anim" },
      })
    ).json();
    assert(portJson.data.isFollowing === true, "Portfolio must expose isFollowing=true to follower");
  });

  // TEST 2: Unfollow removes only current user's follow; Connection & ProjectCollaborator remain independent
  await runTest(2, "Unfollow removes only caller's follow and leaves Connection, ProjectCollaborator, and other follows intact", async () => {
    // Charlie also follows Bob
    currentUser = mockDb.users[CHARLIE_ID];
    await followCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "POST"),
      { params: { id: BOB_ID } }
    );

    // Alice unfollows Bob -> ONLY Alice's follow removed; Charlie's follow, Alice-Bob Connection, and Collaborator row stay intact!
    currentUser = mockDb.users[ALICE_ID];
    const unfollowRes = await unfollowCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "DELETE"),
      { params: { id: BOB_ID } }
    );
    const unfollowJson = await unfollowRes.json();
    assert(unfollowRes.status === 200 && unfollowJson.data.following === false, "Unfollow succeeded");
    assert(unfollowJson.data.followerCount === 1, "Charlie's follow of Bob must remain untouched");
    assert(
      mockDb.connections.length === 1 && mockDb.connections[0].status === ConnectionStatus.Accepted,
      "Unfollowing must NEVER delete existing CreatorConnection"
    );
    assert(
      mockDb.collaborators.length === 1 && mockDb.collaborators[0].userId === ALICE_ID,
      "Unfollowing must NEVER affect ProjectCollaborator membership"
    );

    // Following Bob as Charlie does NOT grant Charlie access to Bob's Private project!
    let privateBlocked = false;
    try {
      await authorize(mockDb.users[CHARLIE_ID], PRIV_PROJ, "view_project");
    } catch (e: any) {
      privateBlocked = e.statusCode === 403;
    }
    assert(privateBlocked, "Following a creator must NEVER grant access to private projects");

    // Re-follow Alice -> Bob does not spam a second Follow notification
    const beforeReFollowNotifs = mockDb.notifications.length;
    await followCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "POST"),
      { params: { id: BOB_ID } }
    );
    assert(
      mockDb.notifications.length === beforeReFollowNotifs,
      "Re-following after unfollow must not generate duplicate Follow notification spam"
    );
  });

  // TEST 3: Paginated followers & following lists return safe public profile fields ONLY (no email / socialLinks)
  await runTest(3, "Followers & Following lists paginate cleanly and never expose email, passwordHash, or private socialLinks", async () => {
    // Dana also follows Bob (now Bob has 3 followers: Charlie, Alice, Dana)
    currentUser = mockDb.users[DANA_ID];
    await followCreator(
      makeReq(`http://localhost/api/users/${BOB_ID}/follow`, "POST"),
      { params: { id: BOB_ID } }
    );

    // Page 1 (limit=2)
    currentUser = mockDb.users[ALICE_ID];
    const p1Res = await getFollowers(
      makeReq(`http://localhost/api/users/${BOB_ID}/followers?limit=2`, "GET"),
      { params: { id: BOB_ID } }
    );
    const p1Json = await p1Res.json();
    assert(p1Res.status === 200, `Expected 200, got ${p1Res.status}`);
    assert(p1Json.data.totalCount === 3, `Expected totalCount=3, got ${p1Json.data.totalCount}`);
    assert(p1Json.data.items.length === 2 && p1Json.data.hasMore === true, "Page 1 must have 2 items and hasMore=true");
    assert(Boolean(p1Json.data.nextCursor), "Page 1 must provide nextCursor");

    // Page 2 using nextCursor
    const p2Res = await getFollowers(
      makeReq(
        `http://localhost/api/users/${BOB_ID}/followers?limit=2&cursor=${encodeURIComponent(p1Json.data.nextCursor)}`,
        "GET"
      ),
      { params: { id: BOB_ID } }
    );
    const p2Json = await p2Res.json();
    assert(p2Res.status === 200 && p2Json.data.items.length === 1 && p2Json.data.hasMore === false, "Page 2 must have remaining 1 item");

    const allFollowerIds = [...p1Json.data.items, ...p2Json.data.items].map((i: any) => i.user.id);
    assert(new Set(allFollowerIds).size === 3, "Paginated follower pages must contain 0 duplicates");

    // Verify ZERO leakage of sensitive user fields
    for (const item of [...p1Json.data.items, ...p2Json.data.items]) {
      assert(item.user.email === undefined, "Follower item must NEVER expose email");
      assert(item.user.passwordHash === undefined, "Follower item must NEVER expose passwordHash");
      assert(item.user.socialLinks === undefined, "Follower item must NEVER expose socialLinks");
    }

    // Following list for Alice returns Bob
    const followingRes = await getFollowing(
      makeReq(`http://localhost/api/users/${ALICE_ID}/following?limit=10`, "GET"),
      { params: { id: ALICE_ID } }
    );
    const followingJson = await followingRes.json();
    assert(
      followingJson.data.totalCount === 1 && followingJson.data.items[0].user.id === BOB_ID,
      "Alice's following list must accurately include Bob"
    );
  });

  // TEST 4: Community Feed privacy filtering (Private, CollaboratorsOnly, Draft, Rejected, Draft media, Internal discussions)
  await runTest(4, "Feed excludes Private/CollaboratorsOnly projects, Draft/Rejected versions, draft media, and internal discussions", async () => {
    // Seed a mix of eligible public activities AND ineligible restricted activities
    const tBase = new Date("2026-03-01T10:00:00Z").getTime();
    await mockTx.activity.create({
      data: {
        id: "10000000-0000-4000-8000-000000000001",
        actorId: BOB_ID,
        type: ActivityType.ProjectPublished,
        projectId: PUB_PROJ_1,
        versionId: null,
        dedupKey: `ProjectPublished:${PUB_PROJ_1}`,
        createdAt: new Date(tBase + 1000),
      },
    });
    await mockTx.activity.create({
      data: {
        id: "10000000-0000-4000-8000-000000000002",
        actorId: BOB_ID,
        type: ActivityType.VersionPublished,
        projectId: PUB_PROJ_1,
        versionId: VER_APPROVED,
        dedupKey: `VersionPublished:${VER_APPROVED}`,
        createdAt: new Date(tBase + 2000),
      },
    });
    await mockTx.activity.create({
      data: {
        id: "10000000-0000-4000-8000-000000000003",
        actorId: CHARLIE_ID,
        type: ActivityType.VersionFinalized,
        projectId: PUB_PROJ_2,
        versionId: VER_FINAL,
        dedupKey: `VersionFinalized:${VER_FINAL}`,
        createdAt: new Date(tBase + 3000),
      },
    });
    // Ineligible rows (simulating legacy/stale activity rows pointing to Private, CollaboratorsOnly, Draft, Rejected):
    await mockTx.activity.create({
      data: {
        id: "20000000-0000-4000-8000-000000000001",
        actorId: BOB_ID,
        type: ActivityType.ProjectPublished,
        projectId: PRIV_PROJ,
        versionId: null,
        dedupKey: `ProjectPublished:${PRIV_PROJ}`,
        createdAt: new Date(tBase + 4000),
      },
    });
    await mockTx.activity.create({
      data: {
        id: "20000000-0000-4000-8000-000000000002",
        actorId: BOB_ID,
        type: ActivityType.ProjectPublished,
        projectId: COLLAB_ONLY_PROJ,
        versionId: null,
        dedupKey: `ProjectPublished:${COLLAB_ONLY_PROJ}`,
        createdAt: new Date(tBase + 5000),
      },
    });
    await mockTx.activity.create({
      data: {
        id: "20000000-0000-4000-8000-000000000003",
        actorId: BOB_ID,
        type: ActivityType.VersionPublished,
        projectId: PUB_PROJ_1,
        versionId: VER_DRAFT,
        dedupKey: `VersionPublished:${VER_DRAFT}`,
        createdAt: new Date(tBase + 6000),
      },
    });
    await mockTx.activity.create({
      data: {
        id: "20000000-0000-4000-8000-000000000004",
        actorId: BOB_ID,
        type: ActivityType.VersionPublished,
        projectId: PUB_PROJ_1,
        versionId: VER_REJECTED,
        dedupKey: `VersionPublished:${VER_REJECTED}`,
        createdAt: new Date(tBase + 7000),
      },
    });

    // Anonymous caller blocked from Following feed (401)
    currentUser = null;
    const anonFollowing = await getFeed(makeReq("http://localhost/api/feed?tab=following", "GET"));
    assert(anonFollowing.status === 401, `Anonymous Following feed must return 401, got ${anonFollowing.status}`);

    // Authenticated Alice -> Following feed (Alice follows ONLY Bob)
    currentUser = mockDb.users[ALICE_ID];
    const followingRes = await getFeed(makeReq("http://localhost/api/feed?tab=following", "GET"));
    const followingJson = await followingRes.json();
    assert(followingRes.status === 200, "Following feed returns 200");
    assert(
      Boolean(followingRes.headers.get("cache-control")?.includes("private")) &&
        Boolean(followingRes.headers.get("cache-control")?.includes("no-store")),
      "Feed must enforce private, no-store cache headers"
    );
    // Only Bob's 2 eligible public activities should appear (NOT Charlie, NOT Private, NOT CollaboratorsOnly, NOT Draft, NOT Rejected!)
    assert(
      followingJson.data.items.length === 2,
      `Expected strictly 2 eligible activities from Bob, got ${followingJson.data.items.length}`
    );
    assert(
      followingJson.data.items.every((i: any) => i.actor.id === BOB_ID),
      "Following feed must contain ONLY followed creator's activities"
    );

    // Check safe preview media & public-only comment count on PUB_PROJ_1
    const pubProjItem = followingJson.data.items.find((i: any) => i.project.id === PUB_PROJ_1);
    assert(
      pubProjItem.project.previewImageUrl === "https://cdn.local/approved_v1_thumb.png",
      "Preview must use Approved version asset, NEVER unpublished draft media"
    );
    assert(
      pubProjItem.project.commentCount === 1,
      `Expected commentCount=1 (public feedback only, excluding internal discussion), got ${pubProjItem.project.commentCount}`
    );
    assert(pubProjItem.actor.email === undefined, "Feed actor must NOT expose email");
    assert(pubProjItem.actor.socialLinks === undefined, "Feed actor must NOT expose socialLinks");
    assert((pubProjItem.project as any).assets === undefined, "Feed must NOT serialize raw Asset array");

    // Discover feed returns all 3 eligible public activities (Bob's 2 + Charlie's 1)
    const discoverRes = await getFeed(makeReq("http://localhost/api/feed?tab=discover", "GET"));
    const discoverJson = await discoverRes.json();
    assert(
      discoverJson.data.items.length === 3,
      `Expected strictly 3 eligible public activities in Discover, got ${discoverJson.data.items.length}`
    );
    assert(
      !discoverJson.data.items.some(
        (i: any) => i.project.id === PRIV_PROJ || i.project.id === COLLAB_ONLY_PROJ
      ),
      "Discover must NEVER expose Private or CollaboratorsOnly projects"
    );
  });

  // TEST 5: Dynamic visibility revocation (project becomes Private -> immediately disappears from feed!)
  await runTest(5, "Content that changes from Public to Private immediately disappears from unauthorized feeds", async () => {
    mockDb.projects[PUB_PROJ_2].visibility = Visibility.Private;
    try {
      currentUser = mockDb.users[ALICE_ID];
      const discJson = await (
        await getFeed(makeReq("http://localhost/api/feed?tab=discover", "GET"))
      ).json();
      assert(
        !discJson.data.items.some((i: any) => i.project.id === PUB_PROJ_2),
        "Project changed to Private MUST immediately disappear from feed"
      );
    } finally {
      mockDb.projects[PUB_PROJ_2].visibility = Visibility.Public;
    }
  });

  // TEST 6: Cursor pagination (zero duplicates, concurrent insert stability, invalid cursor rejection)
  await runTest(6, "Keyset cursor pagination rejects invalid cursors (400) and remains stable with zero duplicates under concurrent inserts", async () => {
    currentUser = mockDb.users[ALICE_ID];

    // Malformed cursor -> 400
    const badCursorRes = await getFeed(
      makeReq("http://localhost/api/feed?tab=discover&cursor=!!!not-a-valid-cursor!!!", "GET")
    );
    assert(badCursorRes.status === 400, `Expected 400 for malformed cursor, got ${badCursorRes.status}`);

    // Fetch page 1 (limit=2)
    const p1Json = await (
      await getFeed(makeReq("http://localhost/api/feed?tab=discover&limit=2", "GET"))
    ).json();
    assert(p1Json.data.items.length === 2 && p1Json.data.hasMore === true, "Page 1 has 2 items + hasMore");
    const p1Ids = p1Json.data.items.map((i: any) => i.id);

    // Simulate a BRAND NEW activity inserted concurrently BEFORE page 2 is fetched!
    await mockTx.activity.create({
      data: {
        id: "30000000-0000-4000-8000-000000000099",
        actorId: CHARLIE_ID,
        type: ActivityType.PortfolioPublished,
        projectId: PUB_PROJ_2,
        versionId: null,
        dedupKey: `PortfolioPublished:${PUB_PROJ_2}`,
        createdAt: new Date("2026-03-05T12:00:00Z"),
      },
    });

    // Fetch page 2 with page 1's keyset cursor -> MUST return ONLY the remaining older item, ZERO duplicates from page 1!
    const p2Json = await (
      await getFeed(
        makeReq(
          `http://localhost/api/feed?tab=discover&limit=2&cursor=${encodeURIComponent(p1Json.data.nextCursor)}`,
          "GET"
        )
      )
    ).json();
    assert(p2Json.data.items.length === 1 && p2Json.data.hasMore === false, "Page 2 returns remaining 1 older item");
    const p2Ids = p2Json.data.items.map((i: any) => i.id);
    assert(
      !p2Ids.some((id: string) => p1Ids.includes(id)),
      "Keyset pagination MUST NOT duplicate any page 1 activity even after concurrent new inserts"
    );
  });

  // TEST 7: Concurrency - simultaneous duplicate follows + repeated activity deduplication
  await runTest(7, "Concurrent duplicate follows create strictly 1 Follow & 1 Notification; repeated activity writes deduplicate cleanly", async () => {
    currentUser = mockDb.users[DANA_ID];
    const beforeNotifs = mockDb.notifications.length;
    followCreateDelayMs = 25;

    try {
      const [r1, r2] = await Promise.all([
        followCreator(
          makeReq(`http://localhost/api/users/${CHARLIE_ID}/follow`, "POST"),
          { params: { id: CHARLIE_ID } }
        ),
        followCreator(
          makeReq(`http://localhost/api/users/${CHARLIE_ID}/follow`, "POST"),
          { params: { id: CHARLIE_ID } }
        ),
      ]);

      const statuses = [r1.status, r2.status].sort();
      assert(
        statuses[0] === 201 && statuses[1] === 409,
        `Expected [201, 409] for concurrent duplicate follows, got ${JSON.stringify(statuses)}`
      );

      const followMatches = mockDb.follows.filter(
        (f) => f.followerId === DANA_ID && f.followingId === CHARLIE_ID
      );
      assert(followMatches.length === 1, "Strictly 1 Follow record must exist");
      assert(mockDb.notifications.length - beforeNotifs === 1, "Strictly 1 Follow notification must be created");
    } finally {
      followCreateDelayMs = 0;
    }

    // Repeated activity recording for the exact same event produces strictly 1 Activity row
    const beforeActivities = mockDb.activities.length;
    await Promise.all([
      recordCommunityActivity(mockTx, {
        actorId: CHARLIE_ID,
        type: ActivityType.ProjectPublished,
        projectId: PUB_PROJ_2,
      }),
      recordCommunityActivity(mockTx, {
        actorId: CHARLIE_ID,
        type: ActivityType.ProjectPublished,
        projectId: PUB_PROJ_2,
      }),
    ]);
    assert(
      mockDb.activities.length === beforeActivities + 1,
      "Repeated concurrent activity recording must deduplicate via dedupKey to strictly 1 item"
    );
  });

  // TEST 8: Phase 3.5 hardening - strict activity dedup keys & safe public preview URL validation
  await runTest(8, "Activity dedupKey requires versionId for version events and feed preview rejects raw storage paths / unsafe schemes", async () => {
    let threwVersionPublished = false;
    try {
      buildActivityDedupKey(ActivityType.VersionPublished, PUB_PROJ_1, null);
    } catch {
      threwVersionPublished = true;
    }
    assert(threwVersionPublished, "VersionPublished must throw when versionId is null");

    let threwVersionFinalized = false;
    try {
      buildActivityDedupKey(ActivityType.VersionFinalized, PUB_PROJ_1, undefined);
    } catch {
      threwVersionFinalized = true;
    }
    assert(threwVersionFinalized, "VersionFinalized must throw when versionId is missing");

    assert(
      isSafePublicPreviewUrl("https://cdn.example.com/thumb.png") === true &&
        isSafePublicPreviewUrl("/uploads/thumb.png") === true &&
        isSafePublicPreviewUrl("projects/pub1/raw_internal_thumb.png") === false &&
        isSafePublicPreviewUrl("javascript:alert(1)") === false &&
        isSafePublicPreviewUrl("//evil.example.com/x.png") === false &&
        isSafePublicPreviewUrl("/api/admin/stats") === false &&
        isSafePublicPreviewUrl("/api/assets/secret-id") === false &&
        isSafePublicPreviewUrl("/uploads/../../etc/passwd") === false &&
        isSafePublicPreviewUrl("/uploads/%2e%2e/secret.png") === false &&
        isSafePublicPreviewUrl("https://proj.supabase.co/storage/v1/object/sign/bucket/private.png?token=abc") === false &&
        isSafePublicPreviewUrl("https://proj.supabase.co/storage/v1/object/authenticated/bucket/private.png") === false &&
        isSafePublicPreviewUrl("http://127.0.0.1:5432/internal.png") === false &&
        isSafePublicPreviewUrl("https://user:pass@cdn.example.com/thumb.png") === false,
      "isSafePublicPreviewUrl must permit only safe public http(s) URLs and allowlisted static paths while blocking traversal, internal routes, signed storage URLs, and SSRF targets"
    );

    const safePreview = resolveSafePublicFeedPreview({
      versions: [{ id: VER_APPROVED, status: VersionStatus.Approved }],
      assets: [
        { id: "asset-raw", versionId: VER_APPROVED, thumbnailPath: "projects/pub1/raw_internal_thumb.png" },
        { id: "asset-xss", versionId: VER_APPROVED, thumbnailPath: "javascript:alert(1)" },
      ],
    });
    assert(
      safePreview === null,
      "resolveSafePublicFeedPreview must return null rather than exposing raw storage paths or unsafe schemes"
    );

    // Phase 3.5.1 check: demoting a Final version back to Approved hides its stale VersionFinalized feed item
    const finalVer = mockDb.versions.find((v) => v.id === VER_FINAL)!;
    finalVer.status = VersionStatus.Approved;
    try {
      currentUser = mockDb.users[ALICE_ID];
      const discJson = await (
        await getFeed(makeReq("http://localhost/api/feed?tab=discover", "GET"))
      ).json();
      assert(
        !discJson.data.items.some(
          (i: any) => i.type === ActivityType.VersionFinalized && i.version?.id === VER_FINAL
        ),
        "Demoted Final version MUST NOT remain visible as a stale VersionFinalized feed activity"
      );
    } finally {
      finalVer.status = VersionStatus.Final;
    }
  });

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  console.log("\n=======================================================================");
  console.log(`Phase 3.4 Test Summary: ${passedCount}/${results.length} PASSED`);
  console.log("=======================================================================");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runPhase34TestSuite().catch((err) => {
  console.error("Fatal error running Phase 3.4 test suite:", err);
  process.exit(1);
});
