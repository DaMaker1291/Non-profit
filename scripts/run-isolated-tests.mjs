// ─────────────────────────────────────────────────────────────────────────────
// THE ONLY SUPPORTED WAY TO RUN THE BROWSER/API SUITES.
//
// It starts its own development server, on its own port, with its own uniquely
// created scratch store, and then runs the suites against it. Nothing is
// discovered: the port and the store are chosen here, so a run cannot attach to
// the server someone left holding real learner data — the failure that wrote 23
// files into the live store.
//
// What it guarantees, in order:
//   · the scratch store is created fresh (mkdtemp), marked, and refused if it is
//     the live store or inside the repository;
//   · the port is allocated from the OS and is not 3000/4173;
//   · the server is started with OPENMIND_DATA_DIR pointing at the scratch
//     store and a separate build cache, so a stale compile cannot be reused;
//   · readiness is a real /api/ready 200, not "the process is still alive";
//   · the suites themselves run the canary check (scripts/test-isolation.mjs),
//     which proves the server writes the scratch store;
//   · the live store is fingerprinted before and after, and any change exits 3;
//   · the server this runner started is the only process it stops.
//
// Run:
//   npm run test:isolated                 # e2e, UI walk, lesson walk
//   npm run test:isolated -- --only e2e
//   npm run test:isolated -- --only ui --only lesson
//   npm run test:isolated -- --keep       # keep scratch + server log for a look
//   npm run test:isolated -- --fresh      # delete the test build cache first
// ─────────────────────────────────────────────────────────────────────────────

import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  REPO,
  LIVE_STORE,
  createScratchStore,
  diffFingerprints,
  fingerprint,
} from "./test-isolation.mjs";

const SUITES = {
  e2e: { script: "scripts/e2e-api.mjs", label: "API end-to-end" },
  ui: { script: "scripts/ui-walk.mjs", label: "UI walk" },
  lesson: { script: "scripts/lesson-walk.mjs", label: "lesson walk" },
};

const args = process.argv.slice(2);
const keep = args.includes("--keep");
const fresh = args.includes("--fresh");
const only = [];
for (let i = 0; i < args.length; i += 1) if (args[i] === "--only" && args[i + 1]) only.push(args[i + 1]);
const names = only.length > 0 ? only : Object.keys(SUITES);
const unknown = names.filter((n) => !SUITES[n]);
if (unknown.length > 0) {
  console.error(`unknown suite(s): ${unknown.join(", ")}. Known: ${Object.keys(SUITES).join(", ")}`);
  process.exit(1);
}

const DIST = path.join(REPO, ".next-test");
const DIST_COMPLETE = path.join(DIST, ".openmind-run-complete");
// Only ever the runner's own cache directory, resolved inside the repository.
if (path.dirname(DIST) !== REPO || path.basename(DIST) !== ".next-test") throw new Error("refusing to delete an unexpected path");

// A DEV BUILD CACHE KILLED MID-WRITE IS THE "Loading…" FAILURE.
// Measured: a run ended by the command timeout left `.next-test` half-written; the
// next UI walk sat on the onboarding skeleton until it timed out, on a page that
// answers 200. The cache is disposable by definition, so the rule is: reuse it
// only when the previous run recorded a clean shutdown, otherwise delete it.
if (fs.existsSync(DIST) && (fresh || !fs.existsSync(DIST_COMPLETE))) {
  console.log(`  build cache:   discarding ${fresh ? "on --fresh" : "a cache with no clean-shutdown marker"}`);
  fs.rmSync(DIST, { recursive: true, force: true });
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const liveBefore = fingerprint(LIVE_STORE);
const { dir: scratch, runId } = createScratchStore("isolated");
const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const logPath = path.join(scratch, "server.log");
const log = fs.createWriteStream(logPath, { flags: "a" });

console.log(`\nISOLATED RUN ${runId}`);
console.log(`  scratch store: ${scratch}`);
console.log(`  app origin:    ${base}`);
console.log(`  build cache:   ${DIST}`);
console.log(`  live store:    ${LIVE_STORE} (fingerprinted, ${Object.keys(liveBefore).length} files)\n`);

const env = {
  ...process.env,
  OPENMIND_DATA_DIR: scratch,
  OPENMIND_TEST_SCRATCH: "1",
  OPENMIND_TEST_PORT: String(port),
  OPENMIND_BASE: base,
  UI_WALK_BASE: base,
  LESSON_WALK_BASE: base,
  OPENMIND_TEST_CONTENT_APPROVALS: "1", // fixture approvals: test processes only
  NEXT_DIST_DIR: DIST,
  NODE_ENV: "development",
};
// A dev server must not inherit a production build's phase from the shell.
delete env.NEXT_PHASE;

const nextBin = path.join(REPO, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) {
  console.error(`next is not installed at ${nextBin}. Run npm ci first.`);
  process.exit(1);
}

const server = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: REPO,
  env,
  stdio: ["ignore", "pipe", "pipe"],
  detached: true,
});
server.stdout.pipe(log);
server.stderr.pipe(log);

let exited = false;
server.on("exit", (code, signal) => {
  exited = true;
  if (code !== 0 && code !== null) console.log(`  (dev server exited early: code ${code}, signal ${signal})`);
});

const stop = async () => {
  if (exited) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
  const deadline = Date.now() + 8_000;
  while (!exited && Date.now() < deadline) await new Promise((r) => setTimeout(r, 100));
  if (!exited) {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {
      server.kill("SIGKILL");
    }
  }
};

const tail = (n = 25) => {
  try {
    log.end();
    const lines = fs.readFileSync(logPath, "utf8").trimEnd().split("\n");
    return lines.slice(-n).join("\n");
  } catch {
    return "(no server log)";
  }
};

const fail = async (message) => {
  console.error(`\nISOLATED RUN FAILED — ${message}\n`);
  console.error(tail());
  await stop();
  console.error(`\n  server log: ${logPath}`);
  process.exit(1);
};

// ── READINESS: a real 200 from /api/ready, bounded ──────────────────────────
const deadline = Date.now() + 240_000;
let ready = false;
while (Date.now() < deadline) {
  if (exited) await fail("the dev server exited before it was ready");
  try {
    const res = await fetch(`${base}/api/ready`, { signal: AbortSignal.timeout(5_000) });
    if (res.status === 200) {
      ready = true;
      break;
    }
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 1_000));
}
if (!ready) await fail("the dev server did not answer /api/ready with 200 within 240 s");

// The canary runs inside each suite as well; doing it here means a broken
// target fails before a four-minute lesson walk starts.
const probe = await fetch(`${base}/api/profile`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ handle: `iso_runner_${runId}` }),
}).catch((err) => err);
if (!(probe instanceof Response) || probe.status !== 200) {
  await fail(`the isolation canary could not be created (${probe instanceof Response ? probe.status : probe?.message})`);
}
const probeBody = await probe.json().catch(() => ({}));
const probeId = probeBody?.profile?.id ?? probeBody?.id ?? null;
const scratchProfiles = fs.existsSync(path.join(scratch, "profiles.json"))
  ? fs.readFileSync(path.join(scratch, "profiles.json"), "utf8")
  : "";
const liveProfiles = fs.existsSync(path.join(LIVE_STORE, "profiles.json"))
  ? fs.readFileSync(path.join(LIVE_STORE, "profiles.json"), "utf8")
  : "";
if (!probeId || !scratchProfiles.includes(probeId)) {
  await fail(`canary ${probeId ?? "(no id)"} is not in the scratch store — the server is writing somewhere else`);
}
if (liveProfiles.includes(probeId)) {
  await fail(`canary ${probeId} was written into the LIVE store. Nothing further will be run.`);
}
await fetch(`${base}/api/profile?id=${encodeURIComponent(probeId)}&secret=${encodeURIComponent(probeBody?.secret ?? "")}&confirm=ERASE`, {
  method: "DELETE",
}).catch(() => {});
console.log(`  canary: ${probeId} created, found in scratch, erased\n`);

// ── THE SUITES ─────────────────────────────────────────────────────────────
const results = [];
for (const name of names) {
  const suite = SUITES[name];
  console.log(`── ${suite.label} ──────────────────────────────────────────────`);
  const started = Date.now();
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(REPO, suite.script)], {
      cwd: REPO,
      env,
      stdio: "inherit",
    });
    child.on("exit", (c, signal) => resolve(c ?? (signal ? 1 : 0)));
  });
  results.push({ name, code, seconds: Math.round((Date.now() - started) / 1000) });
  if (code !== 0) break; // do not spend the next suite's minutes on a broken target
}

// ── STOP, THEN MEASURE ─────────────────────────────────────────────────────
await stop();
log.end();
// Record that this cache was left in a complete state, so the next run may reuse
// it. A run killed before this line is treated as dirty and discarded next time.
try {
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(DIST_COMPLETE, `${new Date().toISOString()} ${runId}\n`);
} catch {
  // a cache we cannot mark is still a cache we can discard next time
}

const liveAfter = fingerprint(LIVE_STORE);
const drift = diffFingerprints(liveBefore, liveAfter);
const failures = results.filter((r) => r.code !== 0);

console.log("\n════ ISOLATED RUN SUMMARY ════");
for (const r of results) console.log(`  ${r.code === 0 ? "✓" : "✗"} ${r.name.padEnd(7)} exit ${r.code}  (${r.seconds}s)`);
const skipped = names.filter((n) => !results.some((r) => r.name === n));
if (skipped.length > 0) console.log(`  · not run: ${skipped.join(", ")}`);
console.log(`  live store: ${drift.length === 0 ? "unchanged" : `${drift.length} FILE(S) CHANGED`} (${Object.keys(liveAfter).length} files)`);
for (const change of drift.slice(0, 20)) console.log(`      ${change.change.padEnd(9)} ${change.path}`);

if (!keep) {
  fs.rmSync(scratch, { recursive: true, force: true });
  console.log(`  scratch store: discarded`);
} else {
  console.log(`  scratch store: kept at ${scratch}`);
  console.log(`  server log:    ${logPath}`);
}

if (drift.length > 0) {
  console.error("\n  THE LIVE STORE CHANGED DURING AN ISOLATED RUN.");
  console.error("  This is a data-integrity incident: preserve the store, run");
  console.error("  `node scripts/reconcile-e2e-incident.mjs` against the backup, and report it.");
  process.exit(3);
}
process.exit(failures.length > 0 ? 1 : 0);
