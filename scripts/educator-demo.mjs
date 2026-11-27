#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ▸ THE EDUCATOR DEMO — nine lessons, one throwaway store, no live learner data.
//
// The review kit used to tell a reviewer to open `/lesson/<concept>`. That route
// does not exist: the lesson is `/learn/<subject>/<concept>`, and it is gated on
// an enrolled learner. So the first thing a reviewer would have met was a 404 or
// an onboarding wall. This runner closes that gap without opening the live store
// and without asking the reviewer to configure anything.
//
// WHAT IT DOES
//   1. Creates a marked scratch store in the OS temp directory (never the repo,
//      never `.openmind-data`).
//   2. Fingerprints the live store before it starts.
//   3. Starts `next dev` on a free loopback port with its own build directory,
//      the scratch store, and the file backend forced explicitly.
//   4. Proves the server writes the scratch store with a canary learner, then
//      erases that canary.
//   5. Creates ONE scratch learner account with a complete UK GCSE maths course,
//      so `/learn` is reachable without the reviewer completing onboarding.
//   6. Checks all nine lesson pages and all nine model shells over HTTP, plus the
//      public review-contract pages.
//   7. On exit, stops only the server it started and refuses to pass if the live
//      store changed at all.
//
// WHAT IT DOES NOT DO
//   · It does not create a teacher account. A teacher account could submit the
//     in-app review form under a placeholder identity; reviews are recorded from
//     the signed pack and `EDUCATOR-RESPONSES.json`, not from this demo.
//   · It does not touch `.openmind-data`, send mail, call an AI provider, or
//     contact anybody.
//   · It does not mark any lesson reviewed. Every pack stays NOT REVIEWED.
//
// RUN
//   npm run educator:demo             # start and wait; Ctrl-C to stop
//   npm run educator:demo -- --check  # start, verify, stop, report
//   npm run educator:demo -- --keep   # keep the scratch store and server log
//
// The route table is read from the generated pack index, so the demo cannot
// silently drift from the nine packs a reviewer is being sent.
// ─────────────────────────────────────────────────────────────────────────────

import crypto from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  LIVE_STORE,
  REPO,
  checkScratchStore,
  createScratchStore,
  diffFingerprints,
  fingerprint,
} from "./test-isolation.mjs";
import { chromeAvailable, launchChrome, pageFor } from "./browser.mjs";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const keep = args.includes("--keep");
const portArg = args.indexOf("--port");
const requestedPort = portArg >= 0 ? Number(args[portArg + 1]) : null;
const PACK_DIR = path.join(REPO, "pilot-readiness", "educator-packs");
const DIST = path.join(REPO, ".next-demo");

function fail(message, detail = "") {
  console.error(`\nEDUCATOR DEMO FAILED — ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

function readDemoRows() {
  const indexPath = path.join(PACK_DIR, "README.md");
  if (!fs.existsSync(indexPath)) fail(`no pack index at ${indexPath}. Run npm run educator:packs first.`);
  const rows = [];
  for (const line of fs.readFileSync(indexPath, "utf8").split("\n")) {
    const match = /^\| \[`([^`]+)`\]\(([^)]+)\) \| `([^`]+)` \|/.exec(line);
    if (!match) continue;
    const [, conceptId, packFile, model] = match;
    const packPath = path.join(PACK_DIR, packFile);
    if (!fs.existsSync(packPath)) fail(`pack index names ${packFile}, which does not exist.`);
    const header = fs.readFileSync(packPath, "utf8").split("\n").slice(0, 12).join("\n");
    const subject = /\*\*Subject:\*\* ([a-z]+)/.exec(header)?.[1] ?? "";
    if (!subject) fail(`${packFile} does not print its subject in the first 12 lines.`);
    rows.push({ conceptId, subject, model, packFile });
  }
  if (rows.length === 0) fail("the pack index lists no interactive models.");
  const order = ["maths", "physics", "chemistry", "biology", "computing"];
  rows.sort((a, b) => order.indexOf(a.subject) - order.indexOf(b.subject) || a.conceptId.localeCompare(b.conceptId));
  return rows;
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function call(base, route, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${base}${route}`, {
    method,
    redirect: "follow",
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // a page, not JSON
  }
  return {
    status: res.status,
    text,
    json,
    cookie: (res.headers.get("set-cookie") ?? "").split(";")[0],
  };
}

const rows = readDemoRows();
const liveBefore = fingerprint(LIVE_STORE);
const { dir: scratch, runId } = createScratchStore("educator-demo");
const scratchCheck = checkScratchStore(scratch);
if (!scratchCheck.ok) fail(`the scratch store was refused: ${scratchCheck.reason}`);

let port = requestedPort;
if (port === null) port = await freePort();
if (!Number.isInteger(port) || port < 1024 || port > 65535) fail(`bad port: ${port}`);
if (port === 3000 || port === 4173) fail("refusing a documented application port; the demo must not attach to the product's server.");
const base = `http://127.0.0.1:${port}`;
const logPath = path.join(scratch, "server.log");
const log = fs.createWriteStream(logPath, { flags: "a" });

const env = {
  ...process.env,
  OPENMIND_DATA_DIR: scratch,
  OPENMIND_TEST_SCRATCH: "1",
  // The demo is a labelled disposable instance. The file backend is forced so a
  // developer's .env asking for Postgres cannot turn the demo into a database
  // setup, and the durability declaration is removed so the two claims cannot
  // contradict each other.
  OPENMIND_STORE: "file",
  OPENMIND_ALLOW_EPHEMERAL_STORE: "1",
  NEXT_DIST_DIR: DIST,
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_ENV: "development",
  OPENMIND_BASE: base,
};
delete env.OPENMIND_DATA_DIR_DURABLE;
delete env.NEXT_PHASE;

const nextBin = path.join(REPO, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(nextBin)) fail(`next is not installed at ${nextBin}. Run npm ci first.`);

console.log("\nEDUCATOR DEMO");
console.log("  status:         every pack remains NOT REVIEWED; this is access, not approval");
console.log(`  scratch store:  ${scratch}`);
console.log(`  app origin:     ${base}`);
console.log(`  build cache:    ${DIST}`);
console.log(`  live store:     ${LIVE_STORE} (fingerprinted, ${Object.keys(liveBefore).length} files)`);
console.log(`  models:         ${rows.length}\n`);

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
  if (code !== 0 && code !== null) console.log(`  (dev server exited: code ${code}, signal ${signal})`);
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

const tail = (n = 30) => {
  try {
    log.end();
    return fs.readFileSync(logPath, "utf8").trimEnd().split("\n").slice(-n).join("\n");
  } catch {
    return "(no server log)";
  }
};

let cleaned = false;
const cleanup = async (exitCode) => {
  if (cleaned) return;
  cleaned = true;
  await stop();
  log.end();
  const drift = diffFingerprints(liveBefore, fingerprint(LIVE_STORE));
  if (drift.length > 0) {
    console.error("\n  THE LIVE STORE CHANGED DURING THE DEMO.");
    for (const change of drift.slice(0, 20)) console.error(`      ${change.change.padEnd(9)} ${change.path}`);
    console.error("  This is a data-integrity incident. Preserve the store and report it.");
    process.exitCode = 3;
  } else {
    console.log(`  live store:     unchanged (${Object.keys(liveBefore).length} files)`);
  }
  if (keep) {
    console.log(`  scratch store:  kept at ${scratch}`);
    console.log(`  server log:     ${logPath}`);
  } else {
    fs.rmSync(scratch, { recursive: true, force: true });
    console.log("  scratch store:  discarded");
  }
  if (exitCode !== 0) process.exitCode = exitCode;
};

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\n  ${signal} — stopping the demo.`);
    void cleanup(0).then(() => process.exit(process.exitCode ?? 0));
  });
}

// ── READINESS — a real 200, not "the process is alive" ──────────────────────
const deadline = Date.now() + 180_000;
let ready = false;
while (Date.now() < deadline) {
  if (exited) {
    await cleanup(1);
    fail("the dev server exited before it was ready", tail());
  }
  try {
    const health = await call(base, "/api/health");
    if (health.status === 200) {
      const readyRes = await call(base, "/api/ready");
      if (readyRes.status === 200) {
        ready = true;
        break;
      }
    }
  } catch {
    // not up yet
  }
  await new Promise((r) => setTimeout(r, 1_000));
}
if (!ready) {
  await cleanup(1);
  fail("the dev server did not answer /api/ready with 200 within 180 s", tail());
}

// ── THE CANARY — prove which store this server writes ───────────────────────
const canary = await call(base, "/api/profile", {
  method: "POST",
  body: { handle: `demo_canary_${runId}` },
});
if (canary.status !== 200) {
  await cleanup(1);
  fail(`the isolation canary could not be created (HTTP ${canary.status})`, tail());
}
const canaryId = canary.json?.profile?.id ?? canary.json?.id ?? null;
const canarySecret = canary.json?.secret ?? canary.json?.profile?.secret ?? "";
if (!canaryId) {
  await cleanup(1);
  fail("the isolation canary has no id", JSON.stringify(canary.json).slice(0, 400));
}
const scratchProfiles = path.join(scratch, "profiles.json");
const inScratch = fs.existsSync(scratchProfiles) && fs.readFileSync(scratchProfiles, "utf8").includes(canaryId);
if (!inScratch) {
  await cleanup(1);
  fail(`the canary ${canaryId} is not in the scratch store — the server is writing somewhere else.`);
}
// The live store is NOT read here. Its fingerprint before and after the run is
// the guard: if this server wrote a learner there, the hash comparison says so.
await call(base, `/api/profile?id=${encodeURIComponent(canaryId)}&secret=${encodeURIComponent(canarySecret)}&confirm=ERASE`, {
  method: "DELETE",
});
console.log(`  canary:         ${canaryId} created in scratch, erased`);

// ── ONE SCRATCH LEARNER, WITH A COMPLETE COURSE ─────────────────────────────
// Not a teacher account: the in-app review form takes its reviewer identity from
// the account, and a placeholder account must never look like a teacher review.
const stamp = `${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
const email = `educator-demo-${stamp}@example.test`;
const password = crypto.randomBytes(18).toString("base64url");
const signup = await call(base, "/api/auth/signup", {
  method: "POST",
  body: {
    email,
    password,
    name: "Scratch reviewer",
    role: "student",
    country: "GB",
    language: "en",
    // One complete course is enough for the whole `/learn` surface; the demo does
    // not need five course declarations, and inventing them would be noise.
    subjects: ["maths"],
  },
});
if (signup.status !== 200) {
  await cleanup(1);
  fail(`the scratch learner could not be created (HTTP ${signup.status})`, tail());
}
const profileId = signup.json?.profile?.profile?.id ?? signup.json?.profile?.id;
const profileSecret = signup.json?.secret ?? signup.json?.profile?.secret;
if (!profileId || !profileSecret) {
  await cleanup(1);
  fail("the scratch learner has no profile id or capability secret", JSON.stringify(signup.json).slice(0, 400));
}

const enrolled = await call(base, "/api/profile", {
  method: "POST",
  body: {
    id: profileId,
    secret: profileSecret,
    onboarded: true,
    grade: "Year 11",
    spec: "uk-gcse",
    specLevel: "higher",
  },
});
if (enrolled.status !== 200) {
  await cleanup(1);
  fail(`the scratch learner could not be enrolled (HTTP ${enrolled.status})`, JSON.stringify(enrolled.json).slice(0, 400));
}
const gaps = Array.isArray(enrolled.json?.courseGaps) ? enrolled.json.courseGaps : null;
if (!gaps || gaps.length > 0) {
  await cleanup(1);
  fail("the scratch learner's course is not complete", JSON.stringify(enrolled.json?.courseGaps ?? enrolled.json).slice(0, 400));
}

const login = await call(base, "/api/auth/login", {
  method: "POST",
  body: { email, password },
});
if (login.status !== 200 || !login.cookie) {
  await cleanup(1);
  fail(`the scratch learner cannot sign in (HTTP ${login.status})`, tail());
}

// ── THE NINE LESSONS, AND THE MODEL EACH MUST ACTUALLY MOUNT ────────────────
const failures = [];
for (const row of rows) {
  const lessonRoute = `/learn/${row.subject}/${row.conceptId}`;
  // THE PAGE IS CLIENT-RENDERED BEHIND THE ROUTE GUARD. A 200 proves the route
  // exists; it does not prove the lesson mounted. The rendered check below is
  // the one that waits for `data-model-shell`, and it runs before `--check`
  // reports success. Keeping both is deliberate: a 404 and a hydration failure
  // are different defects and should not be collapsed into one message.
  const lesson = await call(base, lessonRoute, { cookie: login.cookie });
  if (lesson.status !== 200) {
    failures.push(`${row.conceptId}: HTTP ${lesson.status} at ${lessonRoute}`);
  }
  const reviewRoute = `/lesson-review/${row.conceptId}`;
  const review = await call(base, reviewRoute);
  const hasReviewState = review.text.includes("Current human-evidence state");
  const hasUnreviewed = review.text.includes("No human review is on record for this version");
  if (review.status !== 200 || !hasReviewState || !hasUnreviewed) {
    failures.push(`${row.conceptId} review page: HTTP ${review.status}, state=${hasReviewState}, unreviewed=${hasUnreviewed}`);
  }
  console.log(
    `  ${failures.some((f) => f.startsWith(row.conceptId)) ? "✗" : "✓"} ${row.conceptId.padEnd(22)} ${row.subject.padEnd(10)} ${lessonRoute}`,
  );
}

const ledger = await call(base, "/api/lesson-review");
if (ledger.status !== 200 || (ledger.json?.reviews?.length ?? -1) !== 0) {
  failures.push(`the scratch review ledger is not empty (HTTP ${ledger.status}, ${ledger.json?.reviews?.length} reviews)`);
}

if (failures.length > 0) {
  await cleanup(1);
  console.error("\n  The demo started, but these route checks failed:");
  for (const failure of failures) console.error(`    · ${failure}`);
  console.error(`\n  Server log: ${logPath}\n`);
  process.exit(1);
}

/**
 * THE RENDERED LESSON CHECK. The nine lesson pages are client components behind
 * the route guard, so their server HTML is the guard's boot screen. This opens a
 * real headless Chrome, installs the scratch learner's session cookie, and waits
 * for the exact model shell each pack names. It also requires the prediction gate
 * to be `locked`: a model that renders with its controls already open would mean
 * the thing the reviewer is asked to judge (predict first) is not on the page.
 */
async function verifyRenderedLessons() {
  if (!chromeAvailable()) {
    throw new Error(
      "Chrome is not available, so the rendered lesson check could not run. Set CHROME_BIN, or open the routes manually.",
    );
  }
  const browser = await launchChrome({ port: 9333 + Math.floor(Math.random() * 600), onEvent: () => {} });
  const page = pageFor(browser.send);
  try {
    if (!login.cookie) throw new Error("the scratch login returned no session cookie to install");
    const equals = login.cookie.indexOf("=");
    const cookieName = login.cookie.slice(0, equals);
    const cookieValue = login.cookie.slice(equals + 1);
    await browser.send("Network.setCookie", {
      name: cookieName,
      value: cookieValue,
      url: base,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    });
    for (const row of rows) {
      await page.goto(`${base}/learn/${row.subject}/${row.conceptId}`);
      await page.waitFor(
        `return !!document.querySelector('[data-model-shell="${row.model}"]');`,
        `the ${row.conceptId} interactive model`,
        45_000,
      );
      const seen = await page.evaluate(`
        const main = document.querySelector("main");
        const shell = document.querySelector('[data-model-shell="${row.model}"]');
        const text = main?.innerText || "";
        return {
          status: /pilot content status/i.test(text),
          unavailable: /not available as a lesson/i.test(text),
          slot: shell?.querySelector("[data-model-slot]")?.getAttribute("data-model-slot") ?? null,
        };
      `);
      if (!seen?.status || seen.unavailable || seen.slot !== "locked") {
        const where = await page.evaluate(`
          return {
            href: location.href,
            mains: document.querySelectorAll("main").length,
            shells: Array.from(document.querySelectorAll("[data-model-shell]")).map((el) => el.getAttribute("data-model-shell")),
            text: (document.body.innerText || "").replace(/\\n+/g, " · ").slice(0, 900),
          };
        `);
        throw new Error(
          `${row.conceptId}: status=${seen?.status}, unavailable=${seen?.unavailable}, prediction gate=${seen?.slot} | ${JSON.stringify(where)}`,
        );
      }
      console.log(`  ✓ ${row.conceptId.padEnd(22)} rendered, exact model mounted, prediction gate locked`);
    }
  } finally {
    await browser.close();
  }
}

if (checkOnly) {
  try {
    await verifyRenderedLessons();
  } catch (e) {
    await cleanup(1);
    fail("the rendered lesson check failed", `${e?.message ?? e}\n\n  Server log: ${logPath}`);
  }
  console.log("\n  ALL NINE LESSONS RENDERED AND MODEL SHELLS MOUNTED");
} else {
  console.log("\n  ALL NINE LESSON ROUTES ANSWERED (open one in a browser to see the model)");
}
console.log("  Review ledger: 0 records (no review has been submitted or inferred)");

if (!checkOnly) {
  console.log("\n  SIGN IN AS THE SCRATCH LEARNER");
  console.log(`    ${base}/onboarding?mode=signin`);
  console.log(`    email:    ${email}`);
  console.log(`    password: ${password}`);
  console.log("\n  LESSON ROUTES (sign in first, or follow a link and sign in when asked)");
  for (const row of rows) {
    console.log(`    ${row.conceptId.padEnd(22)} ${base}/learn/${row.subject}/${row.conceptId}`);
  }
  console.log("\n  REVIEW CONTRACT (public; reading only — this account is a learner, so it cannot submit)");
  for (const row of rows) console.log(`    ${row.conceptId.padEnd(22)} ${base}/lesson-review/${row.conceptId}`);
  console.log("\n  The reviewer returns the signed pack and EDUCATOR-FEEDBACK-FORM.md.");
  console.log("  Nothing in this demo changes a pack's NOT REVIEWED status.\n");
}

if (checkOnly) {
  await cleanup(0);
  console.log("  CHECK PASSED — run `npm run educator:demo` to open the interactive demo.\n");
  process.exit(0);
}

console.log("  The demo is running. Press Ctrl-C to stop it.\n");
// Keep the process alive; the signal handler does the cleanup.
await new Promise(() => {});
