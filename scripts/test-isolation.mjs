// ─────────────────────────────────────────────────────────────────────────────
// TEST ISOLATION — the guard that turns "scratch store only" from a hope into a
// REFUSAL.
//
// The incident this exists for: an E2E suite was pointed at a dev server that
// was still holding the LIVE store. Every suite trusted OPENMIND_BASE, so
// nothing in the harness could tell the difference, and 23 files were written
// into real learner data before anyone noticed.
//
// A suite now has to prove four things before assertion one, and it exits 2 —
// before writing anything — if any proof is missing:
//
//   1. THE STORE IS DECLARED AND DISPOSABLE.
//      OPENMIND_DATA_DIR is set, absolute, outside the repository, inside an OS
//      temp root, and carries a marker file only a runner writes. The live
//      store path is refused by name and by containment, in both directions.
//
//   2. THE PORT IS DEDICATED.
//      OPENMIND_TEST_PORT is required and may not be a documented application
//      port (3000, 4173), so a run can never attach to the server someone left
//      running for the product.
//
//   3. THE SERVER PROVES WHICH STORE IT WRITES.
//      A canary profile is created through the API, and its id must appear in
//      the scratch profiles.json and in NO live record. This is the check that
//      would have stopped the incident: a stale server holding the live store
//      fails it, whatever port it answers on.
//
//   4. THE LIVE STORE IS FINGERPRINTED BEFORE AND AFTER.
//      "Untouched" becomes a measurement: a sha256 over every file, compared at
//      the end of the run and again on process exit. Any difference exits 3 and
//      names the file.
//
// ─────────────────────────────────────────────────────────────────────────────
//   node scripts/test-isolation.mjs --init            # create a scratch store
//   node scripts/test-isolation.mjs --init --label ui
//   node scripts/test-isolation.mjs --self-test       # 13 planted cases
//   node scripts/test-isolation.mjs --status          # what this shell resolves to
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LIVE_STORE = path.join(REPO, ".openmind-data");
export const MARKER_NAME = "openmind-test-scratch.json";
/** Ports a person starts for the PRODUCT. A suite may never attach to one. */
export const RESERVED_PORTS = new Set([3000, 4173]);
export const ISOLATION_EXIT = 2;
export const LIVE_STORE_EXIT = 3;

const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

/** Every regular file under `dir`, as `{ relativePath: sha256 | "<absent>" }`.
 *  Symlinks are recorded by their target text and never followed, so the walk
 *  cannot be led out of the directory it is measuring. */
export function fingerprint(dir) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      const rel = path.relative(dir, full);
      if (entry.isSymbolicLink()) {
        out[rel] = `symlink:${fs.readlinkSync(full)}`;
      } else if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        out[rel] = sha256(full);
      }
    }
  };
  walk(dir);
  return out;
}

export function diffFingerprints(before, after) {
  const changes = [];
  for (const key of Object.keys(before)) {
    if (!(key in after)) changes.push({ path: key, change: "removed" });
    else if (before[key] !== after[key]) changes.push({ path: key, change: "modified" });
  }
  for (const key of Object.keys(after)) if (!(key in before)) changes.push({ path: key, change: "created" });
  return changes;
}

const real = (p) => {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
};

const isInside = (child, parent) => {
  const rel = path.relative(real(parent), real(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
};

export function tempRoots() {
  const roots = [real(os.tmpdir())];
  // macOS keeps /tmp as a symlink to /private/tmp; both are OS temp space and
  // both appear in the project's own verification notes.
  if (process.platform !== "win32") roots.push(real("/tmp"));
  return [...new Set(roots)];
}

/** A unique, marked scratch directory. Never reused, never inside the repo. */
export function createScratchStore(label = "run") {
  const runId = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `openmind-test-${label}-`));
  fs.writeFileSync(
    path.join(dir, MARKER_NAME),
    JSON.stringify({ kind: "openmind-test-scratch", runId, label, createdAt: new Date().toISOString() }, null, 2),
  );
  return { dir, runId };
}

/**
 * Is this path a scratch store and nothing else? The ONE owner of the rule,
 * shared by the suites (through `checkTarget`) and by the cleanup script — the
 * pair that must never drift, because one writes where the other deletes.
 */
export function checkScratchStore(rawDir, opts = {}) {
  const repo = opts.repo ?? REPO;
  const live = opts.liveStore ?? path.join(repo, ".openmind-data");
  const roots = opts.tempRoots ?? tempRoots();
  const dataDir = path.resolve(String(rawDir));
  if (!fs.existsSync(dataDir) || !fs.statSync(dataDir).isDirectory()) {
    return { ok: false, code: "scratch-store-missing", reason: `${dataDir} does not exist. Create it with: node scripts/test-isolation.mjs --init` };
  }
  if (isInside(dataDir, live) || isInside(live, dataDir)) {
    return { ok: false, code: "live-store", reason: `${dataDir} is the live learner store (or contains it). Tests never write there.` };
  }
  if (isInside(dataDir, repo)) {
    return { ok: false, code: "scratch-inside-repo", reason: `${dataDir} is inside the repository; a scratch store must not be a project directory.` };
  }
  if (!roots.some((root) => isInside(dataDir, root))) {
    return { ok: false, code: "scratch-outside-tmp", reason: `${dataDir} is outside the OS temp roots (${roots.join(", ")}).` };
  }
  const markerPath = path.join(dataDir, MARKER_NAME);
  if (!fs.existsSync(markerPath)) {
    return { ok: false, code: "scratch-marker", reason: `${dataDir} has no ${MARKER_NAME}; only a runner-created scratch store is accepted.` };
  }
  let marker;
  try {
    marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
  } catch {
    return { ok: false, code: "scratch-marker", reason: `${markerPath} is not readable JSON.` };
  }
  if (marker?.kind !== "openmind-test-scratch") {
    return { ok: false, code: "scratch-marker", reason: `${markerPath} is not an OpenMind test-scratch marker.` };
  }
  return { ok: true, dataDir: real(dataDir), marker };
}

/**
 * The whole target rule, as a pure function of the environment. Returns
 * `{ ok: true, ... }` or `{ ok: false, code, reason }`; the CLI turns the second
 * into exit 2, and the self-test plants a case for every code.
 */
export function checkTarget(env, opts = {}) {
  const repo = opts.repo ?? REPO;
  const live = opts.liveStore ?? path.join(repo, ".openmind-data");
  const roots = opts.tempRoots ?? tempRoots();

  const rawDir = env.OPENMIND_DATA_DIR;
  if (!rawDir || !String(rawDir).trim()) {
    return { ok: false, code: "no-scratch-store", reason: "OPENMIND_DATA_DIR is not set — the suite would have to guess which store it is writing." };
  }
  if (!path.isAbsolute(String(rawDir))) {
    return { ok: false, code: "relative-scratch-store", reason: `OPENMIND_DATA_DIR is relative (${rawDir}); a run's store must not depend on the caller's cwd.` };
  }
  const store = checkScratchStore(rawDir, { repo, live, tempRoots: roots });
  if (!store.ok) return store;
  const dataDir = store.dataDir;
  const marker = store.marker;
  if (env.OPENMIND_TEST_SCRATCH !== "1") {
    return { ok: false, code: "scratch-flag", reason: "OPENMIND_TEST_SCRATCH=1 is not set; the two-key test mode is off." };
  }

  const rawPort = env.OPENMIND_TEST_PORT;
  const port = Number(rawPort);
  if (!rawPort || !Number.isInteger(port) || port < 1024 || port > 65535) {
    return { ok: false, code: "no-test-port", reason: "OPENMIND_TEST_PORT is not set to a usable port — a run must own a dedicated port, not find one." };
  }
  if (RESERVED_PORTS.has(port)) {
    return { ok: false, code: "reserved-port", reason: `port ${port} is a documented application port; a test run may not attach to the product's server.` };
  }

  const baseEnvKeys = ["OPENMIND_BASE", "UI_WALK_BASE", "LESSON_WALK_BASE"];
  const named = baseEnvKeys.find((key) => typeof env[key] === "string" && env[key].trim());
  const base = named ? String(env[named]) : `http://127.0.0.1:${port}`;
  let url;
  try {
    url = new URL(base);
  } catch {
    return { ok: false, code: "base-not-dedicated", reason: `${named ?? "base"} is not a URL: ${base}` };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, code: "base-not-dedicated", reason: `${base} is not http(s).` };
  }
  if (!["127.0.0.1", "localhost", "[::1]", "::1"].includes(url.hostname)) {
    return { ok: false, code: "base-not-loopback", reason: `${base} is not a loopback address; a test run talks to a server on this machine.` };
  }
  const basePort = Number(url.port || (url.protocol === "https:" ? 443 : 80));
  if (basePort !== port) {
    return { ok: false, code: "base-not-dedicated", reason: `${base} does not use OPENMIND_TEST_PORT (${port}); the run would talk to a different server than the one it started.` };
  }

  return { ok: true, base: url.origin, dataDir: real(dataDir), port, runId: marker.runId ?? null };
}

function refuse(code, reason, suite) {
  const lines = [
    "",
    "┌──────────────────────────────────────────────────────────────────────┐",
    "│ ISOLATION REFUSED — no test ran, and nothing was written.            │",
    "└──────────────────────────────────────────────────────────────────────┘",
    "",
    `  suite:  ${suite}`,
    `  reason: ${reason}`,
    `  code:   ${code}`,
    "",
    "  Run the suites the supported way instead:",
    "",
    "      npm run test:isolated              # e2e + UI + lesson",
    "      npm run test:isolated -- --only e2e",
    "",
    "  The runner creates a unique scratch store, owns a dedicated port,",
    "  proves the server writes there with a canary learner, and refuses to",
    "  finish if the live store changed at all.",
    "",
  ];
  console.error(lines.join("\n"));
  process.exit(ISOLATION_EXIT);
}

/**
 * Resolve the target for a suite and install the live-store guard. Call
 * `proveServerIsolated()` before the first assertion and
 * `assertLiveStoreUntouched()` before reporting a result.
 */
export function requireIsolation({ suite, baseEnv = "OPENMIND_BASE" } = {}) {
  // Let a suite name its own base variable and fold it into the one shape the
  // pure check reads, without mutating the caller's environment.
  const env = { ...process.env };
  if (baseEnv !== "OPENMIND_BASE" && env[baseEnv] && !env.OPENMIND_BASE) env.OPENMIND_BASE = env[baseEnv];
  const target = checkTarget(env);
  if (!target.ok) refuse(target.code, target.reason, suite);

  const live = LIVE_STORE;
  const before = fingerprint(live);
  let verified = false;
  let reported = false;

  const report = (changes, where) => {
    if (reported || changes.length === 0) return;
    reported = true;
    console.error(
      [
        "",
        "┌──────────────────────────────────────────────────────────────────────┐",
        "│ LIVE STORE CHANGED DURING AN ISOLATED RUN                            │",
        "└──────────────────────────────────────────────────────────────────────┘",
        "",
        `  suite: ${suite}   when: ${where}`,
        `  store: ${live}`,
        "",
        ...changes.slice(0, 40).map((c) => `    ${c.change.padEnd(9)} ${c.path}`),
        ...(changes.length > 40 ? [`    … and ${changes.length - 40} more`] : []),
        "",
        "  This is a data-integrity incident, not a test failure. Preserve the",
        "  store, run `node scripts/reconcile-e2e-incident.mjs`, and report it.",
        "",
      ].join("\n"),
    );
  };

  const check = (where) => {
    verified = true;
    const changes = diffFingerprints(before, fingerprint(live));
    if (changes.length > 0) {
      report(changes, where);
      process.exitCode = LIVE_STORE_EXIT;
    }
    return changes.length === 0;
  };

  // The safety net: a suite that throws or calls process.exit() still gets the
  // comparison, so "we forgot the final assert" cannot become a silent pass.
  process.on("exit", () => {
    if (!verified) check("process exit");
  });

  return {
    base: target.base,
    dataDir: target.dataDir,
    liveStore: live,
    port: target.port,
    runId: target.runId,
    /** Prove over HTTP that this server writes the scratch store and no other. */
    async proveServerIsolated() {
      const say = (reason) => refuse("server-not-isolated", reason, suite);
      let health;
      try {
        health = await fetch(`${target.base}/api/health`, { signal: AbortSignal.timeout(10_000) });
      } catch (err) {
        say(`no server answered at ${target.base} (${err?.message ?? err}). Start one through the runner.`);
      }
      if (health.status !== 200) say(`/api/health answered ${health.status} at ${target.base}.`);
      const hb = await health.json().catch(() => ({}));
      if (hb?.service !== "openmind") say(`${target.base} is not OpenMind (health service=${JSON.stringify(hb?.service)}).`);

      const ready = await fetch(`${target.base}/api/ready`, { signal: AbortSignal.timeout(30_000) }).catch((err) => err);
      if (!(ready instanceof Response) || ready.status !== 200) {
        say(`/api/ready did not report a ready instance at ${target.base} (${ready instanceof Response ? ready.status : ready?.message}).`);
      }

      // THE CANARY. A learner created through the public API must land in the
      // scratch store. If it lands in the live store, this run is the incident.
      const handle = `iso_probe_${target.runId ?? Date.now().toString(36)}`;
      const created = await fetch(`${target.base}/api/profile`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle }),
        signal: AbortSignal.timeout(30_000),
      }).catch((err) => err);
      if (!(created instanceof Response) || created.status !== 200) {
        say(`POST /api/profile answered ${created instanceof Response ? created.status : created?.message} while creating the isolation canary.`);
      }
      const body = await created.json().catch(() => ({}));
      const id = body?.profile?.id ?? body?.id ?? body?.state?.profile?.id ?? null;
      if (!id) say(`the isolation canary was not given an id (response keys: ${Object.keys(body ?? {}).join(", ")}).`);

      const scratchProfiles = path.join(target.dataDir, "profiles.json");
      const inScratch = fs.existsSync(scratchProfiles) && fs.readFileSync(scratchProfiles, "utf8").includes(id);
      if (!inScratch) say(`canary ${id} is NOT in ${scratchProfiles} — the server is not writing the scratch store.`);
      const liveProfiles = path.join(live, "profiles.json");
      const inLive = fs.existsSync(liveProfiles) && fs.readFileSync(liveProfiles, "utf8").includes(id);
      if (inLive) say(`canary ${id} was written into the LIVE store at ${liveProfiles}. Stopping before the suite touches it.`);

      // Remove the canary (a completed erasure leaves a harmless tombstone in
      // the scratch store; the live store was already proven untouched).
      const secret = body?.secret ?? body?.profile?.secret ?? "";
      await fetch(`${target.base}/api/profile?id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}&confirm=ERASE`, {
        method: "DELETE",
        signal: AbortSignal.timeout(30_000),
      }).catch(() => {});

      if (!check("isolation probe")) return false;
      return true;
    },
    /** Compare the live store now. Returns true when it is byte-identical. */
    assertLiveStoreUntouched(where = "end of run") {
      return check(where);
    },
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] ?? "" : null;
  };

  if (args.includes("--init")) {
    const { dir, runId } = createScratchStore(flag("--label") || "manual");
    console.log(`scratch store: ${dir}`);
    console.log(`run id:        ${runId}`);
    console.log("\nexport these into the server and the suite:\n");
    console.log(`  export OPENMIND_DATA_DIR="${dir}"`);
    console.log("  export OPENMIND_TEST_SCRATCH=1");
    console.log("  export OPENMIND_TEST_PORT=4180");
    console.log("  export OPENMIND_BASE=http://127.0.0.1:4180");
    console.log("  export OPENMIND_TEST_CONTENT_APPROVALS=1   # fixture approvals, test only");
    process.exit(0);
  }

  if (args.includes("--status")) {
    const target = checkTarget(process.env);
    console.log(JSON.stringify(target, null, 2));
    process.exit(target.ok ? 0 : ISOLATION_EXIT);
  }

  if (args.includes("--self-test")) {
    const { mkdtempSync, writeFileSync, mkdirSync, rmSync } = fs;
    const sandbox = mkdtempSync(path.join(os.tmpdir(), "openmind-isolation-selftest-"));
    const repo = path.join(sandbox, "repo");
    const root = path.join(sandbox, "tmp-root");
    const live = path.join(repo, ".openmind-data");
    const insideRepo = path.join(repo, "scratch");
    const outsideTmp = path.join(sandbox, "outside");
    const scratch = path.join(root, "scratch");
    const marked = path.join(root, "marked");
    for (const dir of [live, insideRepo, outsideTmp, scratch, marked]) mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(marked, MARKER_NAME), JSON.stringify({ kind: "openmind-test-scratch" }));
    const opts = { repo, liveStore: live, tempRoots: [root] };
    const good = {
      OPENMIND_DATA_DIR: marked,
      OPENMIND_TEST_SCRATCH: "1",
      OPENMIND_TEST_PORT: "4180",
      OPENMIND_BASE: "http://127.0.0.1:4180",
    };
    const cases = [
      ["no-scratch-store", { ...good, OPENMIND_DATA_DIR: "" }],
      ["relative-scratch-store", { ...good, OPENMIND_DATA_DIR: "relative/store" }],
      ["scratch-store-missing", { ...good, OPENMIND_DATA_DIR: path.join(root, "absent") }],
      ["live-store", { ...good, OPENMIND_DATA_DIR: live }],
      ["live-store", { ...good, OPENMIND_DATA_DIR: sandbox }], // contains the live store
      ["scratch-inside-repo", { ...good, OPENMIND_DATA_DIR: insideRepo }],
      ["scratch-outside-tmp", { ...good, OPENMIND_DATA_DIR: outsideTmp }],
      ["scratch-marker", { ...good, OPENMIND_DATA_DIR: scratch }],
      ["scratch-flag", { ...good, OPENMIND_TEST_SCRATCH: "0" }],
      ["no-test-port", { ...good, OPENMIND_TEST_PORT: "" }],
      ["reserved-port", { ...good, OPENMIND_TEST_PORT: "4173", OPENMIND_BASE: "http://127.0.0.1:4173" }],
      ["base-not-dedicated", { ...good, OPENMIND_BASE: "http://127.0.0.1:4999" }],
      ["base-not-loopback", { ...good, OPENMIND_BASE: "http://192.168.1.10:4180" }],
    ];
    let passed = 0;
    let failed = 0;
    for (const [expected, env] of cases) {
      const got = checkTarget(env, opts);
      if (got.ok) {
        failed++;
        console.log(`  ✗ expected ${expected}, but the target was ACCEPTED`);
      } else if (got.code !== expected) {
        failed++;
        console.log(`  ✗ expected ${expected}, got ${got.code} (${got.reason})`);
      } else {
        passed++;
        console.log(`  ✓ refuses ${expected}`);
      }
    }
    const accepted = checkTarget(good, opts);
    if (accepted.ok && accepted.port === 4180) {
      passed++;
      console.log("  ✓ accepts a marked scratch store on a dedicated loopback port");
    } else {
      failed++;
      console.log(`  ✗ the valid target was refused: ${accepted.reason}`);
    }
    // And the guard must not silently accept a fingerprint drift.
    const dir = path.join(sandbox, "fp");
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "a.json"), "1");
    const before = fingerprint(dir);
    writeFileSync(path.join(dir, "a.json"), "2");
    writeFileSync(path.join(dir, "b.json"), "3");
    const drift = diffFingerprints(before, fingerprint(dir));
    if (drift.length === 2 && drift.some((c) => c.change === "modified") && drift.some((c) => c.change === "created")) {
      passed++;
      console.log("  ✓ detects a modified and a created file");
    } else {
      failed++;
      console.log(`  ✗ fingerprint drift was not detected: ${JSON.stringify(drift)}`);
    }
    rmSync(sandbox, { recursive: true, force: true });
    console.log(`\nisolation self-test: ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  }

  console.log("usage: node scripts/test-isolation.mjs [--init [--label name] | --self-test | --status]");
  process.exit(1);
}
