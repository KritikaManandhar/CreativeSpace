/**
 * CreativeSpace Phase 3.5 / 3.5.1: Real PostgreSQL Integration Verification Suite
 *
 * SAFETY & ISOLATION GUARANTEES:
 * 1. Strictly requires an explicitly configured `TEST_DATABASE_URL` (NEVER falls back to
 *    `DATABASE_URL` or `DIRECT_URL`).
 * 2. Refuses to execute when `NODE_ENV === "production"`, when `TEST_DATABASE_URL` targets
 *    the same `(host, port, database)` as `DATABASE_URL` or `DIRECT_URL`, when the host or
 *    database name matches production naming, or when using PgBouncer transaction pooling
 *    (`pgbouncer=true` or port `6543`) where `search_path` cannot be pinned safely.
 * 3. Creates a collision-proof temporary schema
 *    (`creativespace_pg_int_<epoch>_<pid>_<12hex>`) validated against a strict allowlist regex.
 * 4. Verifies `SELECT current_schema(), current_setting('search_path')` on the scoped
 *    connection BEFORE executing any SQL, asserting `current_schema === testSchema` and that
 *    `public` is NOT in `search_path`.
 * 5. Scans every migration SQL file before execution to block explicit `public.` qualifiers
 *    and database-wide destructive DDL (`DROP DATABASE`, `CREATE DATABASE`, `ALTER SYSTEM`,
 *    `DROP SCHEMA`).
 * 6. Cleanup runs unconditionally in `finally` (even on test failure) and drops ONLY the
 *    temporary schema created by this run.
 *
 * Usage:
 *   TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/creativespace_test" npm run test:pg
 */

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";

interface PgTestResult {
  id: number;
  scenario: string;
  passed: boolean;
  details: string;
}

const TEMP_SCHEMA_REGEX = /^creativespace_pg_int_[0-9]+_[0-9]+_[a-f0-9]{12}$/;
const PROD_NAME_PATTERN = /(^|[._-])prod(uction)?([._-]|$)/i;

function loadEnvVar(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return undefined;
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) return undefined;
  return match[1].trim().replace(/^["']|["']$/g, "");
}

function parseTargetFingerprint(rawUrl: string): {
  protocol: string;
  hostname: string;
  port: string;
  database: string;
  pgbouncer: boolean;
} {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid PostgreSQL URL syntax in TEST_DATABASE_URL");
  }
  const database = parsed.pathname.replace(/^\/+/, "").toLowerCase();
  const port = parsed.port || "5432";
  const pgbouncer =
    parsed.searchParams.get("pgbouncer")?.toLowerCase() === "true" ||
    port === "6543";
  return {
    protocol: parsed.protocol.toLowerCase(),
    hostname: parsed.hostname.toLowerCase(),
    port,
    database,
    pgbouncer,
  };
}

/**
 * Validates that TEST_DATABASE_URL points strictly to a safe, isolated, direct PostgreSQL
 * test target and can never accidentally target production or the primary app database.
 */
function assertSafeTestDatabaseUrl(rawTestUrl: string): void {
  if ((process.env.NODE_ENV || "").toLowerCase() === "production") {
    throw new Error(
      "REFUSED: PostgreSQL integration tests cannot run when NODE_ENV=production."
    );
  }

  const target = parseTargetFingerprint(rawTestUrl);

  if (target.protocol !== "postgresql:" && target.protocol !== "postgres:") {
    throw new Error(
      `REFUSED: TEST_DATABASE_URL must use postgresql:// or postgres:// (found ${target.protocol}).`
    );
  }

  if (!target.hostname || !target.database) {
    throw new Error(
      "REFUSED: TEST_DATABASE_URL must explicitly specify both host and database name."
    );
  }

  if (target.pgbouncer) {
    throw new Error(
      "REFUSED: TEST_DATABASE_URL uses PgBouncer transaction pooling (pgbouncer=true or port 6543). " +
        "Schema-scoped integration tests require a direct PostgreSQL connection (e.g. port 5432) " +
        "so connection-level search_path is strictly pinned to the temporary test schema."
    );
  }

  if (
    PROD_NAME_PATTERN.test(target.hostname) ||
    PROD_NAME_PATTERN.test(target.database)
  ) {
    throw new Error(
      "REFUSED: TEST_DATABASE_URL hostname or database name appears to reference a production database."
    );
  }

  // Strictly refuse targeting the same (hostname, port, database) as DATABASE_URL or DIRECT_URL
  for (const appKey of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const appUrl = loadEnvVar(appKey);
    if (!appUrl) continue;
    try {
      const appTarget = parseTargetFingerprint(appUrl);
      if (
        appTarget.hostname === target.hostname &&
        appTarget.database === target.database &&
        appTarget.port === target.port
      ) {
        throw new Error(
          `REFUSED: TEST_DATABASE_URL points to the exact same database as ${appKey}. ` +
            "Configure a separate isolated test database for TEST_DATABASE_URL."
        );
      }
    } catch (err: any) {
      if (String(err?.message || "").startsWith("REFUSED:")) {
        throw err;
      }
      // Ignore malformed unconfigured app URLs when comparing
    }
  }
}

function buildSchemaUrl(
  baseUrl: string,
  schemaName: string,
  connectionLimit?: number
): string {
  if (!TEMP_SCHEMA_REGEX.test(schemaName)) {
    throw new Error(`Unsafe temporary schema identifier: ${schemaName}`);
  }
  const url = new URL(baseUrl);
  url.searchParams.set("schema", schemaName);
  if (connectionLimit !== undefined) {
    url.searchParams.set("connection_limit", String(connectionLimit));
  }
  return url.toString();
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

/**
 * Splits a PostgreSQL migration file into individual executable statements while preserving
 * single-quoted strings (including E'...' C-style escapes), double-quoted identifiers,
 * dollar-quoted blocks ($tag$...$tag$), and stripping line (`--`) and nested block
 * (`/* ... *\/`) comments.
 *
 * Fails explicitly if EOF is reached inside any unclosed quote, comment, or dollar block
 * rather than silently executing truncated or misparsed SQL.
 */
function splitSqlStatements(sql: string, fileLabel = "<sql>"): string[] {
  const statements: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inEscapeString = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let blockCommentDepth = 0;
  let dollarTag: string | null = null;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        current += "\n";
      }
      continue;
    }

    if (blockCommentDepth > 0) {
      if (ch === "/" && next === "*") {
        blockCommentDepth++;
        i++;
      } else if (ch === "*" && next === "/") {
        blockCommentDepth--;
        i++;
        if (blockCommentDepth === 0) {
          // Preserve token separation when stripping block comments
          current += " ";
        }
      }
      continue;
    }

    if (dollarTag) {
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (inSingleQuote) {
      current += ch;
      if (inEscapeString && ch === "\\" && next !== undefined) {
        current += next;
        i++;
      } else if (ch === "'" && next === "'") {
        current += next;
        i++;
      } else if (ch === "'") {
        inSingleQuote = false;
        inEscapeString = false;
      }
      continue;
    }

    if (inDoubleQuote) {
      current += ch;
      if (ch === '"' && next === '"') {
        current += next;
        i++;
      } else if (ch === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    // Outside quotes and comments
    if (ch === "-" && next === "-") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockCommentDepth = 1;
      i++;
      continue;
    }
    if (ch === "$") {
      // PostgreSQL dollar-quote tags: empty $$ or $[A-Za-z_][A-Za-z_0-9]*$ (never $1$)
      const tagMatch = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/);
      if (tagMatch) {
        dollarTag = tagMatch[0];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }
    if ((ch === "E" || ch === "e") && next === "'") {
      const prev = i > 0 ? sql[i - 1] : "";
      if (!/[A-Za-z0-9_$]/.test(prev)) {
        inSingleQuote = true;
        inEscapeString = true;
        current += ch + next;
        i++;
        continue;
      }
    }
    if (ch === "'") {
      inSingleQuote = true;
      inEscapeString = false;
      current += ch;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      current += ch;
      continue;
    }
    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      continue;
    }

    current += ch;
  }

  if (inSingleQuote) {
    throw new Error(`REFUSED: Unterminated single-quoted string literal in ${fileLabel}`);
  }
  if (inDoubleQuote) {
    throw new Error(`REFUSED: Unterminated double-quoted identifier in ${fileLabel}`);
  }
  if (blockCommentDepth > 0) {
    throw new Error(`REFUSED: Unterminated block comment in ${fileLabel}`);
  }
  if (dollarTag) {
    throw new Error(`REFUSED: Unterminated dollar-quoted block (${dollarTag}) in ${fileLabel}`);
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  return statements;
}

/**
 * Strips comments and single-quoted string literals from a SQL statement while
 * keeping executable keywords, double-quoted identifiers (e.g. "public"), and
 * DO $$ ... $$ bodies intact so safety checks target executable SQL only.
 */
function extractExecutableSql(stmt: string): string {
  let out = "";
  let inSingleQuote = false;
  let inEscapeString = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let blockCommentDepth = 0;

  for (let i = 0; i < stmt.length; i++) {
    const ch = stmt[i];
    const next = stmt[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        out += "\n";
      }
      continue;
    }
    if (blockCommentDepth > 0) {
      if (ch === "/" && next === "*") {
        blockCommentDepth++;
        i++;
      } else if (ch === "*" && next === "/") {
        blockCommentDepth--;
        i++;
        if (blockCommentDepth === 0) out += " ";
      }
      continue;
    }
    if (inSingleQuote) {
      if (inEscapeString && ch === "\\" && next !== undefined) {
        i++;
      } else if (ch === "'" && next === "'") {
        i++;
      } else if (ch === "'") {
        inSingleQuote = false;
        inEscapeString = false;
        out += " ";
      }
      continue;
    }
    if (inDoubleQuote) {
      out += ch;
      if (ch === '"' && next === '"') {
        out += next;
        i++;
      } else if (ch === '"') {
        inDoubleQuote = false;
      }
      continue;
    }

    if (ch === "-" && next === "-") {
      inLineComment = true;
      i++;
      continue;
    }
    if (ch === "/" && next === "*") {
      blockCommentDepth = 1;
      i++;
      continue;
    }
    if ((ch === "E" || ch === "e") && next === "'") {
      const prev = i > 0 ? stmt[i - 1] : "";
      if (!/[A-Za-z0-9_$]/.test(prev)) {
        inSingleQuote = true;
        inEscapeString = true;
        i++;
        continue;
      }
    }
    if (ch === "'") {
      inSingleQuote = true;
      inEscapeString = false;
      continue;
    }
    if (ch === '"') {
      inDoubleQuote = true;
      out += ch;
      continue;
    }
    out += ch;
  }

  return out;
}

/**
 * Ensures an executable migration statement cannot escape the temporary schema
 * or run database-wide destructive DDL. Distinguishes executable SQL from
 * comments and string literals.
 */
function assertMigrationStatementSafe(stmt: string, fileLabel: string): void {
  const executable = extractExecutableSql(stmt);

  if (/(?:^|[^A-Za-z0-9_$])(?:"public"|public)\s*\./i.test(executable)) {
    throw new Error(
      `REFUSED: Migration ${fileLabel} contains an explicit public schema qualifier in executable SQL.`
    );
  }
  if (
    /\b(DROP\s+DATABASE|CREATE\s+DATABASE|ALTER\s+SYSTEM|CREATE\s+SCHEMA|DROP\s+SCHEMA|SET\s+(?:LOCAL\s+|SESSION\s+)?SEARCH_PATH)\b/i.test(
      executable
    ) ||
    /\bALTER\s+(?:ROLE|USER|DATABASE)\b[\s\S]*\bSEARCH_PATH\b/i.test(executable)
  ) {
    throw new Error(
      `REFUSED: Migration ${fileLabel} contains disallowed database-wide or search_path DDL.`
    );
  }
}

async function assertConnectionPinnedToSchema(
  client: PrismaClient,
  expectedSchema: string,
  expectedBackendPid?: number
): Promise<number> {
  const rows: Array<{
    current_schema: string | null;
    search_path: string;
    backend_pid: number;
  }> = await client.$queryRawUnsafe(
    `SELECT current_schema() AS current_schema, current_setting('search_path') AS search_path, pg_backend_pid() AS backend_pid`
  );
  const activeSchema = rows[0]?.current_schema ?? "";
  const activeSearchPath = rows[0]?.search_path ?? "";
  const backendPid = Number(rows[0]?.backend_pid);

  assert(
    activeSchema === expectedSchema,
    `ABORTED: Expected current_schema() === "${expectedSchema}", got "${activeSchema}". Refusing to run SQL.`
  );
  const searchPathParts = activeSearchPath
    .split(",")
    .map((p) => p.trim().replace(/^"|"$/g, ""));
  assert(
    searchPathParts.length === 1 && searchPathParts[0] === expectedSchema,
    `ABORTED: Expected search_path to contain ONLY "${expectedSchema}", got "${activeSearchPath}".`
  );
  if (expectedBackendPid !== undefined) {
    assert(
      backendPid === expectedBackendPid,
      `ABORTED: Migration connection backend PID changed (${expectedBackendPid} -> ${backendPid}).`
    );
  }
  return backendPid;
}

async function applyMigrationFile(client: PrismaClient, migrationSqlPath: string) {
  const label = path.basename(path.dirname(migrationSqlPath));
  const sql = fs.readFileSync(migrationSqlPath, "utf8");
  const statements = splitSqlStatements(sql, label);
  for (const stmt of statements) {
    assertMigrationStatementSafe(stmt, label);
    await client.$executeRawUnsafe(stmt);
  }
}

async function runPostgresIntegrationSuite() {
  console.log("=========================================================================");
  console.log("CreativeSpace Phase 3.5: Real PostgreSQL Integration Verification Suite");
  console.log("=========================================================================\n");

  // STRICT REQUIREMENT: Only read TEST_DATABASE_URL; NEVER fall back to DATABASE_URL / DIRECT_URL.
  const rawTestUrl = loadEnvVar("TEST_DATABASE_URL");
  if (!rawTestUrl) {
    console.error(
      "⚠️  BLOCKED: TEST_DATABASE_URL is not configured.\n" +
        "    Real PostgreSQL integration tests require an explicitly configured isolated test database URL.\n" +
        "    Set TEST_DATABASE_URL (local PostgreSQL or dedicated non-production test direct URL)\n" +
        "    and re-run: npm run test:pg\n" +
        "    (This suite NEVER falls back to DATABASE_URL/DIRECT_URL and NEVER simulates live PG results.)"
    );
    process.exit(2);
  }

  // Enforce production / pooler / same-database safety guards BEFORE opening any connection
  assertSafeTestDatabaseUrl(rawTestUrl);

  const uniqueSuffix = randomUUID().replace(/-/g, "").slice(0, 12);
  const testSchema = `creativespace_pg_int_${Date.now()}_${process.pid}_${uniqueSuffix}`;
  assert(
    TEMP_SCHEMA_REGEX.test(testSchema),
    `Generated invalid test schema name: ${testSchema}`
  );

  const adminClient = new PrismaClient({
    datasources: { db: { url: rawTestUrl } },
  });

  let schemaCreated = false;
  let migrationClient: PrismaClient | null = null;
  let scopedClient: PrismaClient | null = null;
  const results: PgTestResult[] = [];

  async function runTest(id: number, scenario: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ id, scenario, passed: true, details: "PASS" });
      console.log(`✅ [PG Test ${id}] ${scenario}`);
    } catch (err: any) {
      results.push({ id, scenario, passed: false, details: err.message || String(err) });
      console.error(`❌ [PG Test ${id}] ${scenario} -> ${err.message || err}`);
    }
  }

  try {
    // 1. Verify live PostgreSQL connectivity
    await adminClient.$connect();
    const versionRows: Array<{ version: string }> =
      await adminClient.$queryRawUnsafe(`SELECT version()`);
    console.log(`Connected to live PostgreSQL: ${versionRows[0]?.version || "unknown"}`);
    console.log(`Isolated temporary schema: ${testSchema}\n`);

    // 2. Create isolated temporary schema (cannot collide with existing schemas)
    await adminClient.$executeRawUnsafe(`CREATE SCHEMA "${testSchema}"`);
    schemaCreated = true;

    // 3. Dedicated single-connection client (`connection_limit=1`) guarantees the exact same
    //    PostgreSQL backend connection (verified by pg_backend_pid()) that passes search_path
    //    verification executes every migration statement.
    migrationClient = new PrismaClient({
      datasources: { db: { url: buildSchemaUrl(rawTestUrl, testSchema, 1) } },
    });
    await migrationClient.$connect();
    const migrationBackendPid = await assertConnectionPinnedToSchema(
      migrationClient,
      testSchema
    );

    // Load all timestamped migrations in chronological order
    const migrationsRoot = path.join(__dirname, "../prisma/migrations");
    const migrationDirs = fs
      .readdirSync(migrationsRoot, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    // Pre-seed IDs for testing migration backfills & Migration 12 safety mid-chain
    const aliceId = randomUUID();
    const bobId = randomUUID();
    const charlieId = randomUUID();
    const legacyProjId = randomUUID();
    const legacyFinalVerId = randomUUID();
    const legacyApprovedVerId = randomUUID();
    const legacyCollabId = randomUUID();
    const runtimeFinalVerId = randomUUID();
    const runtimeFinalActId = randomUUID();

    // TEST 1: Execute entire migration chain chronologically on verified single connection
    await runTest(1, "Complete migration chain executes cleanly inside isolated schema and preserves backfill & Migration 12 invariants", async () => {
      for (const dir of migrationDirs) {
        const sqlPath = path.join(migrationsRoot, dir, "migration.sql");
        if (!fs.existsSync(sqlPath)) continue;

        // Right BEFORE Phase 3.3 collaborator backfill migration, seed legacy pre-3.3 rows
        if (dir === "20261118140100_add_invitation_lifecycle_to_project_collaborators") {
          const now = new Date();
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "users" ("id","email","username","displayName","createdAt","updatedAt") VALUES
             ('${aliceId}','alice@pgtest.local','alice_pg','Alice PG',$1,$1),
             ('${bobId}','bob@pgtest.local','bob_pg','Bob PG',$1,$1),
             ('${charlieId}','charlie@pgtest.local','charlie_pg','Charlie PG',$1,$1)`,
            now
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "projects" ("id","creatorId","title","category","status","visibility","createdAt","updatedAt")
             VALUES ('${legacyProjId}','${aliceId}','Legacy Public Project','Illustration','InProgress','Public',$1,$1)`,
            now
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "project_collaborators" ("id","projectId","userId","role","invitedAt","acceptedAt")
             VALUES ('${legacyCollabId}','${legacyProjId}','${bobId}','Collaborator',$1,$1)`,
            now
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status","createdAt") VALUES
             ('${legacyApprovedVerId}','${legacyProjId}',1,'${bobId}','Approved',$1),
             ('${legacyFinalVerId}','${legacyProjId}',2,'${bobId}','Final',$1)`,
            now
          );
        }

        // Right BEFORE Migration 12, seed a runtime UUID VersionFinalized row AND a malformed
        // ProjectPublished row with a stray versionId to verify Migration 12 preserves runtime
        // attribution and safely normalizes pre-existing anomalies before adding CHECK
        if (dir === "20261118170000_add_activity_integrity_constraints") {
          const now = new Date();
          const secondProjId = randomUUID();
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "projects" ("id","creatorId","title","category","status","visibility","createdAt","updatedAt")
             VALUES ('${secondProjId}','${aliceId}','Runtime Attribution Project','UI/UX','InProgress','Public',$1,$1)`,
            now
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status","createdAt")
             VALUES ('${runtimeFinalVerId}','${secondProjId}',1,'${bobId}','Final',$1)`,
            now
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
             VALUES ('${runtimeFinalActId}','${charlieId}','VersionFinalized','${secondProjId}','${runtimeFinalVerId}','VersionFinalized:${runtimeFinalVerId}')`
          );
          await migrationClient!.$executeRawUnsafe(
            `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
             VALUES ('${randomUUID()}','${aliceId}','ProjectPublished','${secondProjId}','${runtimeFinalVerId}','ProjectPublished:${secondProjId}')`
          );
        }

        await applyMigrationFile(migrationClient!, sqlPath);

        // Verify Migration 12 is strictly idempotent on retry (simulated interrupted-retry)
        if (dir === "20261118170000_add_activity_integrity_constraints") {
          await applyMigrationFile(migrationClient!, sqlPath);
        }
      }

      // Confirm exact same backend connection stayed pinned to testSchema across entire migration chain
      await assertConnectionPinnedToSchema(
        migrationClient!,
        testSchema,
        migrationBackendPid
      );

      // Verify Phase 3.3 backfill set legacy accepted collaborator to status = 'Accepted'
      const collabRows: any[] = await migrationClient!.$queryRawUnsafe(
        `SELECT "status", "acceptedAt" FROM "project_collaborators" WHERE "id" = '${legacyCollabId}'`
      );
      assert(
        collabRows[0]?.status === "Accepted" && collabRows[0]?.acceptedAt !== null,
        `Legacy accepted collaborator was not backfilled to Accepted: ${JSON.stringify(collabRows)}`
      );

      // Verify Migration 11 + 12 reconciled historical backfilled VersionFinalized row to owner (aliceId)
      const backfilledFinal: any[] = await migrationClient!.$queryRawUnsafe(
        `SELECT "actorId", "versionId" FROM "activities" WHERE "id" = 'act-ver-${legacyFinalVerId}'`
      );
      assert(
        backfilledFinal[0]?.actorId === aliceId && backfilledFinal[0]?.versionId === legacyFinalVerId,
        "Historical backfilled VersionFinalized row must be reconciled to project owner"
      );

      // Verify Migration 12 did NOT overwrite runtime UUID VersionFinalized attribution
      const runtimeFinal: any[] = await migrationClient!.$queryRawUnsafe(
        `SELECT "actorId" FROM "activities" WHERE "id" = '${runtimeFinalActId}'`
      );
      assert(
        runtimeFinal[0]?.actorId === charlieId,
        "Migration 12 must NOT overwrite runtime-generated UUID VersionFinalized attribution"
      );

      // Verify key catalog indexes exist exclusively inside testSchema
      const idxRows: Array<{ indexname: string }> = await migrationClient!.$queryRawUnsafe(
        `SELECT indexname FROM pg_indexes WHERE schemaname = '${testSchema}'`
      );
      const idxNames = new Set(idxRows.map((r) => r.indexname));
      for (const requiredIdx of [
        "versions_unique_final_per_project",
        "versions_projectId_versionNumber_key",
        "connections_unordered_pair_unique_idx",
        "comment_likes_userId_commentId_key",
        "activities_dedupKey_key",
        "assets_storagePath_key",
        "upload_intents_storagePath_key",
      ]) {
        assert(idxNames.has(requiredIdx), `Missing required PostgreSQL index: ${requiredIdx}`);
      }
    });

    // Disconnect single-connection migration client and open pooled schema-scoped client for concurrency tests
    await migrationClient.$disconnect();
    migrationClient = null;

    scopedClient = new PrismaClient({
      datasources: { db: { url: buildSchemaUrl(rawTestUrl, testSchema) } },
    });
    await scopedClient.$connect();
    await assertConnectionPinnedToSchema(scopedClient, testSchema);

    // TEST 2: Final-version partial unique index under concurrent writes
    await runTest(2, "Partial unique index versions_unique_final_per_project prevents concurrent dual FINAL versions", async () => {
      const projId = randomUUID();
      const v1 = randomUUID();
      const v2 = randomUUID();
      const now = new Date();
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "projects" ("id","creatorId","title","category","status","visibility","createdAt","updatedAt")
         VALUES ('${projId}','${aliceId}','Concurrent Final Test','UI/UX','InProgress','Public',$1,$1)`,
        now
      );
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status","createdAt") VALUES
         ('${v1}','${projId}',1,'${aliceId}','Approved',$1),
         ('${v2}','${projId}',2,'${aliceId}','Approved',$1)`,
        now
      );

      const outcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(`UPDATE "versions" SET "status" = 'Final' WHERE "id" = '${v1}'`),
        scopedClient!.$executeRawUnsafe(`UPDATE "versions" SET "status" = 'Final' WHERE "id" = '${v2}'`),
      ]);
      const fulfilled = outcomes.filter((o) => o.status === "fulfilled").length;
      const rejected = outcomes.filter((o) => o.status === "rejected").length;
      assert(fulfilled === 1 && rejected === 1, `Expected 1 fulfilled & 1 rejected, got ${fulfilled}/${rejected}`);
    });

    // TEST 3: Concurrent version-number allocation uniqueness
    await runTest(3, "Unique index versions_projectId_versionNumber_key rejects concurrent duplicate version numbers", async () => {
      const outcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status")
           VALUES ('${randomUUID()}','${legacyProjId}',99,'${aliceId}','Draft')`
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status")
           VALUES ('${randomUUID()}','${legacyProjId}',99,'${bobId}','Draft')`
        ),
      ]);
      const fulfilled = outcomes.filter((o) => o.status === "fulfilled").length;
      const rejected = outcomes.filter((o) => o.status === "rejected").length;
      assert(fulfilled === 1 && rejected === 1, `Expected 1 fulfilled & 1 rejected for versionNumber collision`);
    });

    // TEST 4: Concurrent reverse-direction CreatorConnection requests + self-connection CHECK
    await runTest(4, "Unordered-pair unique index blocks opposite-direction concurrent Connections & CHECK blocks self-connection", async () => {
      const pairKey = aliceId < bobId ? `${aliceId}:${bobId}` : `${bobId}:${aliceId}`;
      const now = new Date();
      const outcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "connections" ("id","requesterId","receiverId","pairKey","status","createdAt","updatedAt")
           VALUES ('${randomUUID()}','${aliceId}','${bobId}','${pairKey}','Pending',$1,$1)`,
          now
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "connections" ("id","requesterId","receiverId","pairKey","status","createdAt","updatedAt")
           VALUES ('${randomUUID()}','${bobId}','${aliceId}','${pairKey}','Pending',$1,$1)`,
          now
        ),
      ]);
      const fulfilled = outcomes.filter((o) => o.status === "fulfilled").length;
      const rejected = outcomes.filter((o) => o.status === "rejected").length;
      assert(fulfilled === 1 && rejected === 1, `Expected 1 connection created & 1 rejected for opposite directions`);

      let selfBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(
          `INSERT INTO "connections" ("id","requesterId","receiverId","pairKey","status","createdAt","updatedAt")
           VALUES ('${randomUUID()}','${aliceId}','${aliceId}','${aliceId}:${aliceId}','Pending',$1,$1)`,
          now
        );
      } catch {
        selfBlocked = true;
      }
      assert(selfBlocked, "Self-connection MUST be rejected by PostgreSQL CHECK constraint");
    });

    // TEST 5: ProjectCollaborator invitation acceptance, rejection, and status-timestamp CHECK constraint
    await runTest(5, "ProjectCollaborator accepts valid Pending->Accepted/Rejected transitions and blocks invalid status-timestamp combinations", async () => {
      const invId = randomUUID();
      const now = new Date();
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "project_collaborators" ("id","projectId","userId","invitedById","role","status","invitedAt")
         VALUES ('${invId}','${legacyProjId}','${charlieId}','${aliceId}','ClientReviewer','Pending',$1)`,
        now
      );

      let invalidBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(
          `UPDATE "project_collaborators" SET "acceptedAt" = $1 WHERE "id" = '${invId}'`,
          now
        );
      } catch {
        invalidBlocked = true;
      }
      assert(invalidBlocked, "Pending row with acceptedAt MUST fail project_collaborators_status_timestamps_check");

      await scopedClient!.$executeRawUnsafe(
        `UPDATE "project_collaborators" SET "status" = 'Rejected', "rejectedAt" = $1 WHERE "id" = '${invId}'`,
        now
      );
      await scopedClient!.$executeRawUnsafe(
        `UPDATE "project_collaborators" SET "status" = 'Accepted', "acceptedAt" = $1, "rejectedAt" = NULL WHERE "id" = '${invId}'`,
        now
      );
    });

    // TEST 6: Follow uniqueness under concurrency & self-follow CHECK constraint
    await runTest(6, "Follow unique index prevents concurrent duplicates & CHECK blocks self-follow", async () => {
      const outcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "follows" ("id","followerId","followingId") VALUES ('${randomUUID()}','${aliceId}','${bobId}')`
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "follows" ("id","followerId","followingId") VALUES ('${randomUUID()}','${aliceId}','${bobId}')`
        ),
      ]);
      assert(
        outcomes.filter((o) => o.status === "fulfilled").length === 1 &&
          outcomes.filter((o) => o.status === "rejected").length === 1,
        "Concurrent duplicate follows must produce strictly 1 row"
      );

      let selfFollowBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(
          `INSERT INTO "follows" ("id","followerId","followingId") VALUES ('${randomUUID()}','${aliceId}','${aliceId}')`
        );
      } catch {
        selfFollowBlocked = true;
      }
      assert(selfFollowBlocked, "Self-follow MUST fail follows_no_self_follow_check");
    });

    // TEST 7: Activity dedupKey uniqueness under concurrent inserts + type-version CHECK
    await runTest(7, "Activity dedupKey unique index prevents concurrent duplicate feed items & CHECK enforces versionId rules", async () => {
      const key = `PortfolioPublished:${legacyProjId}`;
      const outcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
           VALUES ('${randomUUID()}','${aliceId}','PortfolioPublished','${legacyProjId}',NULL,'${key}')`
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
           VALUES ('${randomUUID()}','${aliceId}','PortfolioPublished','${legacyProjId}',NULL,'${key}')`
        ),
      ]);
      assert(
        outcomes.filter((o) => o.status === "fulfilled").length === 1 &&
          outcomes.filter((o) => o.status === "rejected").length === 1,
        "Concurrent duplicate Activity dedupKey must produce strictly 1 row"
      );

      let badTypeBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(
          `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
           VALUES ('${randomUUID()}','${aliceId}','VersionPublished','${legacyProjId}',NULL,'VersionPublished:bad')`
        );
      } catch {
        badTypeBlocked = true;
      }
      assert(badTypeBlocked, "VersionPublished without versionId MUST fail activities_type_version_check");

      let strayVersionBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(
          `INSERT INTO "activities" ("id","actorId","type","projectId","versionId","dedupKey")
           VALUES ('${randomUUID()}','${aliceId}','ProjectPublished','${legacyProjId}','${legacyApprovedVerId}','ProjectPublished:bad')`
        );
      } catch {
        strayVersionBlocked = true;
      }
      assert(strayVersionBlocked, "ProjectPublished with non-null versionId MUST fail activities_type_version_check");
    });

    // TEST 8: Comment parent/reply ON DELETE RESTRICT & self-parent CHECK + CommentLike concurrency uniqueness
    await runTest(8, "Comment ON DELETE RESTRICT prevents orphaning replies & CommentLike prevents concurrent duplicate likes", async () => {
      const parentId = randomUUID();
      const replyId = randomUUID();
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "comments" ("id","projectId","versionId","authorId","content")
         VALUES ('${parentId}','${legacyProjId}','${legacyApprovedVerId}','${aliceId}','Root PG comment')`
      );
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "comments" ("id","projectId","versionId","authorId","parentId","content")
         VALUES ('${replyId}','${legacyProjId}','${legacyApprovedVerId}','${bobId}','${parentId}','Child PG reply')`
      );

      let parentDeleteBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(`DELETE FROM "comments" WHERE "id" = '${parentId}'`);
      } catch {
        parentDeleteBlocked = true;
      }
      assert(parentDeleteBlocked, "Deleting parent comment with replies MUST fail comments_parentId_fkey ON DELETE RESTRICT");

      const likeOutcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "comment_likes" ("id","commentId","userId") VALUES ('${randomUUID()}','${parentId}','${bobId}')`
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "comment_likes" ("id","commentId","userId") VALUES ('${randomUUID()}','${parentId}','${bobId}')`
        ),
      ]);
      assert(
        likeOutcomes.filter((o) => o.status === "fulfilled").length === 1 &&
          likeOutcomes.filter((o) => o.status === "rejected").length === 1,
        "Concurrent duplicate CommentLikes must produce strictly 1 row"
      );
    });

    // TEST 9: Project / Version / Asset foreign-key integrity
    await runTest(9, "FK integrity: User with projects protected by ON DELETE RESTRICT & Asset unlinks on Version delete (ON DELETE SET NULL)", async () => {
      let creatorDeleteBlocked = false;
      try {
        await scopedClient!.$executeRawUnsafe(`DELETE FROM "users" WHERE "id" = '${aliceId}'`);
      } catch {
        creatorDeleteBlocked = true;
      }
      assert(creatorDeleteBlocked, "Deleting project creator with active projects MUST fail ON DELETE RESTRICT");

      const tempVerId = randomUUID();
      const tempAssetId = randomUUID();
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "versions" ("id","projectId","versionNumber","createdById","status")
         VALUES ('${tempVerId}','${legacyProjId}',50,'${aliceId}','Draft')`
      );
      await scopedClient!.$executeRawUnsafe(
        `INSERT INTO "assets" ("id","projectId","uploaderId","versionId","fileName","mimeType","fileSize","storagePath")
         VALUES ('${tempAssetId}','${legacyProjId}','${aliceId}','${tempVerId}','sketch.png','image/png',1024,'projects/p/sketch.png')`
      );
      await scopedClient!.$executeRawUnsafe(`DELETE FROM "versions" WHERE "id" = '${tempVerId}'`);

      const assetRows: any[] = await scopedClient!.$queryRawUnsafe(
        `SELECT "id", "versionId" FROM "assets" WHERE "id" = '${tempAssetId}'`
      );
      assert(
        assetRows.length === 1 && assetRows[0].versionId === null,
        "Asset must be preserved with versionId = NULL when its version is deleted"
      );

      // Concurrent duplicate Asset.storagePath inserts must enforce assets_storagePath_key (1 fulfilled, 1 rejected)
      const sharedPath = `projects/${legacyProjId}/concurrent_dup_${Date.now()}.png`;
      const assetDupOutcomes = await Promise.allSettled([
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "assets" ("id","projectId","uploaderId","fileName","mimeType","fileSize","storagePath")
           VALUES ('${randomUUID()}','${legacyProjId}','${aliceId}','dup.png','image/png',512,'${sharedPath}')`
        ),
        scopedClient!.$executeRawUnsafe(
          `INSERT INTO "assets" ("id","projectId","uploaderId","fileName","mimeType","fileSize","storagePath")
           VALUES ('${randomUUID()}','${legacyProjId}','${bobId}','dup.png','image/png',512,'${sharedPath}')`
        ),
      ]);
      assert(
        assetDupOutcomes.filter((o) => o.status === "fulfilled").length === 1 &&
          assetDupOutcomes.filter((o) => o.status === "rejected").length === 1,
        "Concurrent duplicate Asset.storagePath inserts must produce strictly 1 row via assets_storagePath_key"
      );
    });

    const passed = results.filter((r) => r.passed).length;
    console.log("\n=========================================================================");
    console.log(`PostgreSQL Integration Summary: ${passed}/${results.length} PASSED (Live PG)`);
    console.log("=========================================================================");
    if (passed !== results.length) {
      process.exitCode = 1;
    }
  } finally {
    if (migrationClient) {
      await migrationClient.$disconnect().catch((err) => {
        console.error("Warning: failed to disconnect migration PG client:", err?.message || err);
      });
    }
    if (scopedClient) {
      await scopedClient.$disconnect().catch((err) => {
        console.error("Warning: failed to disconnect scoped PG client:", err?.message || err);
      });
    }
    if (schemaCreated && TEMP_SCHEMA_REGEX.test(testSchema)) {
      await adminClient
        .$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`)
        .catch((err) => {
          console.error(
            `Warning: failed to drop temporary schema "${testSchema}":`,
            err?.message || err
          );
        });
    }
    await adminClient.$disconnect().catch(() => {});
  }
}

runPostgresIntegrationSuite().catch((err) => {
  console.error("PostgreSQL integration suite failed:", err?.message || err);
  process.exit(1);
});
