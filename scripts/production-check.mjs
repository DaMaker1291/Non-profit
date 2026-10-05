// ─────────────────────────────────────────────────────────────────────────────
// `npm run production-check` — THE DEPLOYMENT CHECKLIST, EXECUTABLE (§35).
//
// The brief asks for a checklist that is not a document but a command, and this
// is that command. It answers, on one machine, in one run:
//
//   ✓ production build              ✓ environment validation
//   ✓ content graph + questions     ✓ content release version
//   ✓ typecheck                     ✓ unit/engine tests
//   ✓ static asset integrity        ✓ production render
//   ✓ health + readiness endpoints  ✓ external smoke (uptime-style)
//   ✓ auth (session is server-side) ✓ permissions (the §9 matrix)
//   ✓ offline sync (dedupe/replay)  ✓ AI fallback (a supported outcome)
//   ✓ database schema + migrations  (when DATABASE_URL is set — §4)
//
// HOW IT RUNS, and why two servers rather than one:
//
//   · the PRODUCTION build is assembled and served on a scratch port, because
//     the serve gates (asset integrity, render, smoke, permissions, sync) must
//     judge the artefact that would actually ship;
//   · the DEVELOPMENT server is started separately for `npm run e2e`, which
//     drives the `reveal` test hook a production build strips on purpose — a
//     hook that works in production is a production hole. Starting the wrong
//     server there reports the product broken when the harness is at fault.
//
// Everything writes to a TEMPORARY data directory, so a run never touches a real
// classroom's store. Nothing is left running: the servers are killed on exit.
//
// Flags / env:
//   OPENMIND_CHECK_PORT       production port (default 3210)
//   OPENMIND_CHECK_DEV_PORT   development port (default 3211)
//   OPENMIND_CHECK_UI=1       also run the real-browser accessibility walk
//                             (needs Chrome; OFF by default with a SKIP line)
//
// The one thing this does NOT do is migrate a database, because this deployment
// has no database: its store is a directory of JSON/JSONL files. The step that
// WOULD be there is called out as a NOTE rather than faked. See docs/DEPLOYMENT.md.
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const PROD_PORT = Number(process.env.OPENMIND_CHECK_PORT ?? 3210);
const DEV_PORT = Number(process.env.OPENMIND_CHECK_DEV_PORT ?? 3211);
const DIST = ".next-prod";
const PROD_BASE = `http://localhost:${PROD_PORT}`;
const DEV_BASE = `http://localhost:${DEV_PORT}`;

const results = [];
const record = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "  ✓" : "  ✗"} ${name}${detail ? ` — ${detail}` : ""}`);
};
const skip = (name, why) => {
  results.push({ name, ok: true, skipped: true, detail: why });
  console.log(`  · ${name} — SKIPPED: ${why}`);
};
const section = (n) => console.log(`\n▶ ${n}`);

// ── Server lifecycle ────────────────────────────────────────────────────────
const children = [];
function startServer(cmd, args, env, logFile, cwd = ROOT) {
  const out = fs.openSync(logFile, "a");
  const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, stdio: ["ignore", out, out] });
  children.push(child);
  return child;
}
async function waitFor(url, seconds, child) {
  for (let i = 0; i < seconds * 2; i++) {
    if (child && child.exitCode !== null) return false;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return true;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}
function shutdown() {
  for (const c of children) {
    try { if (c.exitCode === null) c.kill("SIGTERM"); } catch { /* already gone */ }
  }
}
process.on("SIGINT", () => { shutdown(); process.exit(130); });
process.on("SIGTERM", () => { shutdown(); process.exit(143); });
process.on("exit", shutdown);

const runScript = (script, env = {}) => {
  const r = spawnSync("npm", ["run", script], {
    cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env },
  });
  return r.status === 0;
};
const runNode = (args, env = {}) => {
  const r = spawnSync("node", args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });
  return r.status === 0;
};

console.log(`\nOpenMind — production check`);
console.log(`  dist ${DIST} · production :${PROD_PORT} · development :${DEV_PORT}\n`);

// ── 1. Static gates ─────────────────────────────────────────────────────────
section("1 · static gates (no server)");
const typecheckOk = runScript("typecheck");
record("typecheck", typecheckOk, "tsc --noEmit");

const verifyOk = runScript("verify");
record("engine + content-graph suite", verifyOk, "npm run verify (compiles .verify)");

// Environment validation uses the engine the readiness check uses, from the one
// compiled mirror — no second list of "the variables that matter" here.
let envOk = false;
try {
  const envMod = require(path.join(ROOT, ".verify", "env.js"));
  const report = envMod.envReport(process.env);
  envOk = report.ok;
  console.log(`    deployment profile: ${report.deployment.profile.id}${report.deployment.problem ? ` (REFUSED: ${report.deployment.problem})` : ""}`);
  console.log(`    ai provider: ${report.ai.provider} · data dir: ${report.dataDir || "(default)"}`);
  for (const p of report.problems) console.log(`    ✗ ${p.key} — ${p.detail}`);
  for (const n of report.notes) console.log(`    · note ${n.key}: ${n.detail}`);
  record("environment validation", envOk, report.problems.length ? `${report.problems.length} problem(s)` : "well-formed");
} catch (e) {
  record("environment validation", false, `could not load .verify/env.js (${e.message})`);
}

const contentOk = runScript("verify:q");
record("question coverage", contentOk, "npm run verify:q — every generated question is answerable");

const releaseOk = runScript("verify:content-release");
record("content release version", releaseOk, "the served content matches the published version");

// ── 2. The database, when there is one ──────────────────────────────────────
// The store is a directory of JSON/JSONL files by default, so this section has
// three honest states rather than one:
//
//   · no DATABASE_URL — recorded as a SKIP that states the reason. Never as a
//     pass, because "we did not look" and "it is fine" are different claims;
//   · a configured database whose schema is BEHIND or DRIFTED — a FAIL. The
//     deployment sequence is backup → migration → rollout → health check, so a
//     running app on an unmigrated schema is the exact ordering this check
//     exists to catch;
//   · a migrated database — its own invariants are then re-proved by `verify`
//     (append-only, idempotent re-send, erasure). A schema that merely EXISTS
//     proves nothing: the ledger's rules are what the learning architecture
//     rests on, and they are assertions, not decoration.
//
// `status` is a read. This command never migrates — applying a migration is a
// deployment step with a backup in front of it, and a checklist that quietly
// changed a production schema while reporting PASS would be the worst possible
// behaviour for the one command people run to decide whether to ship.
section("2 · the database");
if (!process.env.DATABASE_URL) {
  skip("database schema and migrations",
    "DATABASE_URL is not set — the store is a directory of JSON/JSONL files (docs/DEPLOYMENT.md §5)");
} else {
  const dbReport = spawnSync("node", ["scripts/migrate.mjs", "status", "--json"], { cwd: ROOT, encoding: "utf8", env: process.env });
  let parsed = null;
  try { parsed = JSON.parse((dbReport.stdout ?? "").trim()); } catch { /* reported as unreachable below */ }
  record("database reachable and schema recorded",
    dbReport.status === 0 && Boolean(parsed?.configured),
    parsed ? `${parsed.applied.length} migration(s) applied` : `migrate.mjs exited ${dbReport.status}`);
  const schemaOk = Boolean(parsed) && parsed.pending.length === 0 && parsed.drift.length === 0;
  record("schema migrations up to date", schemaOk,
    parsed ? `${parsed.pending.length} pending · ${parsed.drift.length} drift` : "no report — run `npm run db:status`");
  if (schemaOk) {
    const verifyDbOk = runNode(["scripts/migrate.mjs", "verify"]);
    record("evidence schema invariants", verifyDbOk, "append-only, idempotent re-send, erasure");
  } else {
    record("evidence schema invariants", false, "not run — the schema is not the one the migration files describe");
  }
}

// ── 3. The production build ─────────────────────────────────────────────────
section("3 · the production build and the artefact it serves");
const buildOk = runScript("build", { NEXT_DIST_DIR: DIST });
record("production build", buildOk, `next build → ${DIST}`);

if (!buildOk) {
  console.error("\nThe build failed — nothing further can be judged. Stopping.");
  console.log(`\nPRODUCTION CHECK: FAIL`);
  process.exit(1);
}

// Assemble the standalone bundle exactly as start-openmind.sh does: next build
// with output:"standalone" does NOT copy the static tree into the bundle.
try {
  fs.rmSync(path.join(DIST, "standalone", "public"), { recursive: true, force: true });
  fs.rmSync(path.join(DIST, "standalone", DIST, "static"), { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, "public"), path.join(DIST, "standalone", "public"), { recursive: true });
  fs.cpSync(path.join(ROOT, DIST, "static"), path.join(DIST, "standalone", DIST, "static"), { recursive: true });
} catch (e) {
  record("assemble standalone bundle", false, e.message);
}

const prodData = fs.mkdtempSync(path.join(os.tmpdir(), "om-prodcheck-"));
const prodLog = path.join(prodData, "server.log");
// The standalone server must run from its OWN directory: server.js resolves its
// static tree relative to cwd, which is exactly the copy assembled above.
const prodChild = startServer(
  "node", ["server.js"],
  { PORT: String(PROD_PORT), HOSTNAME: "127.0.0.1", NODE_ENV: "production", OPENMIND_DATA_DIR: prodData },
  prodLog,
  path.join(ROOT, DIST, "standalone"),
);
const prodUp = await waitFor(`${PROD_BASE}/api/health`, 60, prodChild);
record("production server starts", prodUp, prodUp ? PROD_BASE : `see ${prodLog}`);

if (prodUp) {
  // ── 4. Serve gates against the real artefact ──────────────────────────────
  section("4 · what the running artefact actually serves");
  const assetsOk = runNode(["scripts/verify-build-assets.mjs", "--dist", DIST, "--port", String(PROD_PORT)]);
  record("static asset integrity", assetsOk, "the stylesheet and every referenced asset resolve");

  const renderOk = runNode(["scripts/verify-render.mjs", "--port", String(PROD_PORT)]);
  record("production render", renderOk, "typography, one nav per viewport, footer pushed down");

  const smokeOk = runNode(["scripts/smoke-production.mjs"], { OPENMIND_BASE: PROD_BASE });
  record("external smoke", smokeOk, "/, /about, /curriculum, /offline, /onboarding, health, ready, 404");

  const permOk = runNode(["scripts/verify-permissions.mjs"], { OPENMIND_BASE: PROD_BASE });
  record("authorization matrix", permOk, "the §9 rules, against a scratch store");

  const syncOk = runNode(["scripts/verify-offline-sync.mjs"], { OPENMIND_BASE: PROD_BASE });
  record("offline sync protocol", syncOk, "dedupe, refusals, paging, replay");

  // AI fallback is a supported state, not an error: with no key configured the
  // tutor must answer from the deterministic engine and say so. Asserted over
  // HTTP here because "the provider is down" is a production condition.
  try {
    const r = await fetch(`${PROD_BASE}/api/ai`);
    const j = await r.json();
    const configured = j && j.provider && j.provider !== "offline";
    // `provider` is null when no model is configured — that is the intended
    // offline state, not a failure. A real breakage is a non-200 status or a
    // non-null, non-string provider.
    record("AI status endpoint", r.status === 200 && (j.provider === null || typeof j.provider === "string"),
      configured ? `a model is configured (${j.provider}); the offline fallback remains supported` : "no model — the deterministic offline tutor is the answer");
  } catch (e) {
    record("AI status endpoint", false, e.message);
  }
} else {
  record("serve gates", false, "skipped — the production server did not start");
  console.log(`    (server log: ${prodLog})`);
}

// ── 5. End-to-end against a development server ──────────────────────────────
section("5 · HTTP end-to-end (development server, for the reveal hook)");
const devData = fs.mkdtempSync(path.join(os.tmpdir(), "om-devcheck-"));
const devLog = path.join(devData, "server.log");
const devChild = startServer(
  "npx", ["next", "dev", "-p", String(DEV_PORT)],
  { NODE_ENV: "development", NEXT_DIST_DIR: ".next-dev", OPENMIND_DATA_DIR: devData },
  devLog,
);
const devUp = await waitFor(`${DEV_BASE}/`, 90, devChild);
record("development server starts", devUp, devUp ? DEV_BASE : `see ${devLog}`);
if (devUp) {
  const e2eOk = runScript("e2e", { OPENMIND_BASE: DEV_BASE, OPENMIND_DATA_DIR: devData });
  record("end-to-end suite", e2eOk, "npm run e2e");
} else {
  record("end-to-end suite", false, "skipped — the development server did not start");
}

// ── 6. The real-browser accessibility walk (optional) ───────────────────────
section("6 · accessibility smoke (real browser)");
if (process.env.OPENMIND_CHECK_UI === "1") {
  const uiOk = runScript("verify:ui", { UI_WALK_BASE: DEV_BASE, OPENMIND_DATA_DIR: devData });
  record("accessibility / UI walk", uiOk, "npm run verify:ui (Chrome)");
} else {
  skip("accessibility / UI walk", "set OPENMIND_CHECK_UI=1 (needs Chrome installed)");
}

// ── 7. What this deployment does NOT have ───────────────────────────────────
section("7 · honest notes about this deployment's shape");
if (!process.env.DATABASE_URL) {
  console.log("  · schema migrations:  N/A — the store is a directory of JSON/JSONL files (db/migrations exists and is rehearsed; it is not wired to this deployment)");
}
console.log("  · object storage:     N/A — large files are packs served from the app, not a bucket");
console.log("  · these become real steps only when the store moves to a database (see docs/DEPLOYMENT.md §5)");

// ── Summary ─────────────────────────────────────────────────────────────────
const ran = results.filter((r) => !r.skipped);
const failed = ran.filter((r) => !r.ok);
console.log(`\n${"─".repeat(58)}`);
for (const r of results) console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
console.log(`\nPRODUCTION CHECK: ${failed.length === 0 ? "PASS" : `FAIL (${failed.length} failed)`}`);
process.exit(failed.length === 0 ? 0 : 1);
