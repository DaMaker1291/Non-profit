#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ▸ WHAT SURVIVES A RESTART, MEASURED BY RESTARTING A REAL SERVER.
//
// The kiosk identity suite (`verify-kiosk-identity.mjs`) drives one process and
// therefore cannot answer the question a school actually asks: a handset is
// closed, the laptop is rebooted, the school's electricity fails — what happens
// to the lesson in progress, to a PIN somebody was guessing, and to a credential
// the teacher revoked?
//
// So this drill owns its own server. It starts `next dev` on a scratch data
// directory, stops the PROCESS (not the store), starts it again, and asserts the
// same requests. Everything it writes is a temp directory; the real
// `.openmind-data` is never opened, so there is nothing to clean up afterwards.
//
// THE THREE ANSWERS, each of which a reviewer should be able to read here rather
// than infer from source:
//
//   1. A LIVE SESSION SURVIVES. Tokens live in `kiosk-sessions.json` by sha256,
//      so a restart mid-lesson does not sign the class out. That is deliberate —
//      a restart is not a revocation.
//   2. AN ENDED OR EXPIRED SESSION DOES NOT COME BACK. Hand-back and teacher
//      revocation delete the row; expiry is checked against the server's clock
//      on every use. A restart can only re-read what is on disk, so there is no
//      in-memory copy for it to revive.
//   3. THE PIN FAILURE COUNTER SURVIVES, and this is the measurement the drill
//      exists for. `hit()`'s window table is in-process (lib/server/rate-limit.ts
//      says so), so a restart WOULD reset it — which is why every failure is
//      also written to the class's own `kiosk[id].failed`. The drill spends
//      part of the budget, restarts, and proves the NEXT refusal arrives after
//      the remaining attempts, not after a fresh eight.
//
// It also checks the two privacy claims that are only provable from the file:
// no PIN and no session token is stored in the clear.
//
// Run:  npm run verify:kiosk:restart
// Exit: 0 all assertions passed · 1 a failed assertion · 3 disk below the guard
// ─────────────────────────────────────────────────────────────────────────────
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classify, measureHeadroom } from "./disk-headroom.mjs";
import { restoreGenerated, snapshotGenerated } from "./generated-files.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
if (!fs.existsSync(NEXT_BIN)) {
  console.error(`Cannot find the Next binary at ${NEXT_BIN}. Run \`npm ci\` first.`);
  process.exit(2);
}

const head = measureHeadroom();
if (head.measured && classify(head.freeMb, head) === "low") {
  console.error(`Refusing to run: ${head.freeMb} MB free, below the ${head.lowMb} MB floor.`);
  process.exit(3);
}

// ── ISOLATION ────────────────────────────────────────────────────────────────
// Both directories are temp: the store because this drill provisions learners,
// and the dist directory because a second dev server must not delete or rewrite
// the one the reviewer already has running (next.config.mjs separates phases for
// exactly that reason; NEXT_DIST_DIR is the supported way to add a third).
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "om-kiosk-restart-"));
const dataDir = path.join(scratch, "store");
const distDir = path.join(scratch, "dist");
fs.mkdirSync(dataDir, { recursive: true });
const logPath = path.join(scratch, "server.log");
const generatedBefore = snapshotGenerated(ROOT);

let server = null;
let serverRuns = 0;
let port = 0;
let passed = 0;
let failed = 0;
const failures = [];
function ok(cond, label, detail = "") {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}
function section(name) {
  console.log(`\n▸ ${name}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = () => `http://127.0.0.1:${port}`;

async function call(pathname, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${BASE()}${pathname}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, body: json, cookie: res.headers.get("set-cookie") ?? "" };
}
const cookieOf = (r) => (r.cookie || "").split(";")[0];

async function freePort() {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port: p } = srv.address();
      srv.close(() => resolve(p));
    });
  });
}

async function startServer() {
  serverRuns += 1;
  const out = fs.openSync(logPath, "a");
  server = spawn(process.execPath, [NEXT_BIN, "dev", "-p", String(port)], {
    cwd: ROOT,
    env: {
      ...process.env,
      OPENMIND_DATA_DIR: dataDir,
      NEXT_DIST_DIR: distDir,
      OPENMIND_STORE: "file",
      // A dev server on a scratch store: no AI, no external calls.
      OPENMIND_AI_PROVIDER: "",
    },
    detached: true,
    stdio: ["ignore", out, out],
  });
  server.unref();
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE()}/api/ready`, { signal: AbortSignal.timeout(5000) });
      if (r.status === 200) return;
      if (r.status === 503) {
        // Readiness names its failing check; a scratch store with a declared
        // data dir should never be here, so surface it rather than looping.
        const detail = await r.text();
        console.error(`server run ${serverRuns} is not ready: ${detail.slice(0, 400)}`);
      }
    } catch {
      // not listening yet
    }
    await sleep(400);
  }
  console.error(`server run ${serverRuns} never became ready; log:\n${tailLog()}`);
  throw new Error("server did not become ready");
}

async function stopServer() {
  if (!server) return;
  const pid = server.pid;
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE()}/api/health`, { signal: AbortSignal.timeout(1000) });
      await sleep(200);
    } catch {
      server = null;
      return;
    }
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    /* gone */
  }
  server = null;
  await sleep(500);
}

async function restart(label) {
  await stopServer();
  await startServer();
  console.log(`  · restarted (${label}); process run ${serverRuns}`);
  const r = await call("/api/ready");
  ok(r.status === 200, `the restarted server is ready (${label})`, `status ${r.status}`);
}

function tailLog(lines = 40) {
  try {
    return fs.readFileSync(logPath, "utf8").split("\n").slice(-lines).join("\n");
  } catch {
    return "(no log)";
  }
}

// ── THE STORE, READ THE WAY AN OPERATOR WOULD ────────────────────────────────
const file = (name) => path.join(dataDir, name);
function readStore(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file(name), "utf8"));
  } catch {
    return fallback;
  }
}
function writeStore(name, value) {
  fs.writeFileSync(file(name), JSON.stringify(value, null, 2));
}
const sha256 = (s) => createHash("sha256").update(s).digest("hex");

const stamp = `${Date.now()}`;
let cls = null;
let joinCode = "";
let pins = {};
let ids = {};
let tokenA = "";
let tokenB = "";

async function signUpTeacher() {
  const email = `kiosk-restart-${stamp}@example.test`;
  const r = await call("/api/auth/signup", {
    method: "POST",
    body: {
      email,
      password: "kiosk-restart-password-1",
      name: "Restart Drill Teacher",
      role: "teacher",
      country: "KE",
      language: "en",
      subjects: ["maths"],
    },
  });
  return { r, cookie: cookieOf(r) };
}

async function login(handle, pin) {
  return await call("/api/kiosk/login", { method: "POST", body: { joinCode, handle, pin } });
}

async function finish() {
  await stopServer();
  const restored = restoreGenerated(generatedBefore, ROOT);
  if (!restored.restoredAll) {
    failed += 1;
    failures.push("the drill left next-env.d.ts modified (restore failed)");
    console.log("  ✗ generated files were not restored to their pre-drill state");
  }
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* temp */
  }
  console.log(`\n${failed === 0 ? "PASS" : "FAIL"}: ${passed} passed, ${failed} failed`);
  if (failed) {
    console.log("FAILURES:");
    for (const f of failures) console.log(`  · ${f}`);
  }
  process.exit(failed === 0 ? 0 : 1);
}

try {
  port = await freePort();
  await startServer();

  // ── 1. THE CREDENTIALS, AND WHAT LANDS ON DISK ────────────────────────────
  section("A teacher provisions learners, and the store never sees a PIN in the clear");
  const teacher = await signUpTeacher();
  ok(teacher.r.status === 200 && Boolean(teacher.cookie), "the teacher signs up", `status ${teacher.r.status}`);

  const created = await call("/api/classes", {
    method: "POST",
    cookie: teacher.cookie,
    body: { action: "create", name: `Restart drill ${stamp}`, subject: "maths" },
  });
  ok(created.status === 200, "the class is created", `status ${created.status}`);
  cls = created.body?.cls;
  joinCode = cls?.joinCode ?? "";
  ok(Boolean(cls?.id && joinCode), "it carries an id and a join code");

  const provisioned = await call("/api/classes", {
    method: "POST",
    cookie: teacher.cookie,
    body: { action: "provision", clsId: cls?.id, learners: [{ handle: "Amina" }, { handle: "Baraka" }] },
  });
  ok(provisioned.status === 200, "two learners are provisioned", `status ${provisioned.status}`);
  const kids = provisioned.body?.learners ?? [];
  ok(kids.length === 2 && kids.every((k) => /^\d{6}$/.test(k.pin)), "each gets a six-digit PIN, shown once");
  ok(kids[0]?.pin !== kids[1]?.pin, "the two PINs differ (they are drawn, not derived)");
  pins = { Amina: kids[0]?.pin, Baraka: kids[1]?.pin };
  ids = { Amina: kids[0]?.id, Baraka: kids[1]?.id };

  const rawClasses = fs.readFileSync(file("classes.json"), "utf8");
  const rawProfiles = fs.readFileSync(file("profiles.json"), "utf8");
  ok(!rawClasses.includes(pins.Amina) && !rawClasses.includes(pins.Baraka),
    "neither PIN appears in classes.json");
  ok(!rawProfiles.includes(pins.Amina) && !rawProfiles.includes(pins.Baraka),
    "neither PIN appears in profiles.json");
  const rows = readStore("classes.json", []).find((c) => c.id === cls.id)?.kiosk ?? {};
  ok(Boolean(rows[ids.Amina]?.hash) && Boolean(rows[ids.Amina]?.salt),
    "the class stores a scrypt hash and a salt");
  ok(!("pin" in (rows[ids.Amina] ?? {})) && !("plain" in (rows[ids.Amina] ?? {})),
    "and no field holds the PIN itself");

  // ── 2. A PIN BUYS A SESSION, WHICH IS ALSO A HASH ON DISK ─────────────────
  section("The session token is stored as a hash, never as itself");
  const loginA = await login("Amina", pins.Amina);
  ok(loginA.status === 200, "Amina's PIN opens a session", `status ${loginA.status}`);
  tokenA = loginA.body?.secret ?? "";
  ok(/^[0-9a-f]{64}$/.test(tokenA), "the credential is a 64-hex session token");
  const rawSessions = fs.readFileSync(file("kiosk-sessions.json"), "utf8");
  ok(!rawSessions.includes(tokenA), "the raw token is NOT in kiosk-sessions.json");
  ok(rawSessions.includes(sha256(tokenA)), "its sha256 is (lookup is by hash)");
  ok((await call(`/api/profile?id=${ids.Amina}&secret=${tokenA}`)).status === 200,
    "and the session reads its own learner");

  const loginB = await login("Baraka", pins.Baraka);
  ok(loginB.status === 200, "Baraka's PIN opens his own session");
  tokenB = loginB.body?.secret ?? "";
  const left = await call("/api/kiosk/leave", { method: "POST", body: { token: tokenB } });
  ok(left.status === 200, "he hands the device back");
  ok((await call(`/api/profile?id=${ids.Baraka}&secret=${tokenB}`)).status === 401,
    "the token is dead on the server before the restart");

  // ── 3. PART OF THE PIN BUDGET IS SPENT, THEN THE PROCESS DIES ─────────────
  section("The PIN failure counter is on the class, not in the process");
  // A drawn PIN could be the obvious wrong one (1 in a million, but this drill
  // must not be flaky): use a value that is certainly not the issued PIN.
  const wrongPin = pins.Amina === "999999" ? "000000" : "999999";
  for (let i = 0; i < 3; i++) await login("Amina", wrongPin);
  const spent = readStore("classes.json", []).find((c) => c.id === cls.id)?.kiosk?.[ids.Amina];
  ok(spent?.failed === 3, "three wrong PINs are recorded on the class row", `failed ${spent?.failed}`);
  ok(!spent?.lockedUntil, "and the credential is not locked yet");

  await restart("after three failures");
  ok((await call(`/api/profile?id=${ids.Amina}&secret=${tokenA}`)).status === 200,
    "Amina's live session still works after the restart (a restart is not a sign-out)");
  ok((await call(`/api/profile?id=${ids.Baraka}&secret=${tokenB}`)).status === 401,
    "Baraka's ended session is still dead (deletion is on disk, nothing to revive)");

  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await login("Amina", wrongPin)).status);
  ok(statuses.includes(429), "the budget is then spent", `statuses ${statuses.join(",")}`);
  const firstRefusal = statuses.indexOf(429);
  // Eight is the budget and three were spent before the restart, so five more
  // wrong PINs reach it and the SIXTH request is the refusal. A restart that
  // reset the counter would have needed eight.
  ok(firstRefusal === 5,
    "the refusal arrives after the REMAINING attempts, not a fresh eight",
    `refused at attempt ${firstRefusal + 1} of 6 (expected 6 = 3 spent + 5 remaining)`);

  const lockedRow = readStore("classes.json", []).find((c) => c.id === cls.id)?.kiosk?.[ids.Amina];
  ok((lockedRow?.lockedUntil ?? 0) > Date.now(), "the durable row carries the lock");
  // A hard bound means the RIGHT PIN is refused too. That is the deliberate
  // difference from the account door (lib/server/rate-limit.ts): a six-digit
  // credential issued for one lesson has no other margin, and the owner's remedy
  // is the teacher, not a wait.
  ok((await login("Amina", pins.Amina)).status === 429,
    "even the correct PIN waits while the hard bound is spent");
  ok((await login("Baraka", pins.Baraka)).status === 200,
    "a classmate's budget is untouched");

  // ── 4. AN EXPIRED SESSION DOES NOT COME BACK ──────────────────────────────
  section("Expiry is the server's clock, and a restart cannot revive it");
  const provisionedC = await call("/api/classes", {
    method: "POST",
    cookie: teacher.cookie,
    body: { action: "provision", clsId: cls.id, learners: [{ handle: "Chebet" }] },
  });
  const kidC = provisionedC.body?.learners?.[0];
  ok(Boolean(kidC?.pin), "a third learner is provisioned for the expiry test");
  const loginC = await login("Chebet", kidC?.pin);
  const tokenC = loginC.body?.secret ?? "";
  ok(loginC.status === 200 && Boolean(tokenC), "her session opens", `status ${loginC.status}`);

  await stopServer();
  const sessions = readStore("kiosk-sessions.json", {});
  const keyC = sha256(tokenC);
  ok(Boolean(sessions[keyC]), "her session row is in the file");
  sessions[keyC].expiresAt = Date.now() - 1000;
  writeStore("kiosk-sessions.json", sessions);
  await startServer();
  ok((await call("/api/ready")).status === 200, "the server is ready again");
  const expiredRead = await call(`/api/profile?id=${kidC?.id}&secret=${tokenC}`);
  ok(expiredRead.status === 401, "an expired session is refused after the restart",
    `status ${expiredRead.status}`);
  const expiredServe = await call("/api/progress", {
    method: "POST",
    body: { action: "serve", id: kidC?.id, secret: tokenC, conceptId: "quadratics" },
  });
  ok(expiredServe.status === 401, "…and cannot be served practice", `status ${expiredServe.status}`);
  ok((await login("Baraka", pins.Baraka)).status === 200,
    "a live session's PIN still works — expiry is per credential, not a class-wide switch");

  // ── 5. REVOCATION SURVIVES A RESTART ──────────────────────────────────────
  section("A revoked credential stays revoked across a restart");
  const loginB2 = await login("Baraka", pins.Baraka);
  const tokenB2 = loginB2.body?.secret ?? "";
  const revoked = await call("/api/classes", {
    method: "POST",
    cookie: teacher.cookie,
    body: { action: "revoke", clsId: cls.id, learnerId: ids.Baraka },
  });
  ok(revoked.status === 200, "the teacher revokes Baraka's credential", `status ${revoked.status}`);
  ok((await call(`/api/profile?id=${ids.Baraka}&secret=${tokenB2}`)).status === 401,
    "its session is dead before the restart");
  ok((await login("Baraka", pins.Baraka)).status === 401, "its PIN is refused before the restart");

  await restart("after a revocation");
  ok((await call(`/api/profile?id=${ids.Baraka}&secret=${tokenB2}`)).status === 401,
    "the session is still dead after the restart");
  ok((await login("Baraka", pins.Baraka)).status === 401,
    "the revoked PIN still opens nothing after the restart");
  const classRowAfterRevoke = readStore("classes.json", []).find((c) => c.id === cls.id);
  ok(!classRowAfterRevoke?.kiosk?.[ids.Baraka], "and the credential row is gone from the class file");

  // ── 6. THE LOCK EXPIRES, AND THE PROCESS TABLE ADDS NOTHING ───────────────
  section("A cleared lock lets the PIN back in, so the in-process window is not a second lock");
  await stopServer();
  const classes = readStore("classes.json", []);
  const rowA = classes.find((c) => c.id === cls.id)?.kiosk?.[ids.Amina];
  ok(Boolean(rowA), "Amina's credential row exists");
  delete rowA.failed;
  delete rowA.lockedUntil;
  writeStore("classes.json", classes);
  await startServer();
  ok((await call("/api/profile?id=" + ids.Amina + "&secret=" + tokenA)).status === 200,
    "her session survived the last restart too");
  const afterLock = await login("Amina", pins.Amina);
  ok(afterLock.status === 200,
    "with the durable lock cleared and the process restarted, the correct PIN works",
    `status ${afterLock.status} ${JSON.stringify(afterLock.body).slice(0, 100)}`);
  const clearedRow = readStore("classes.json", []).find((c) => c.id === cls.id)?.kiosk?.[ids.Amina];
  ok(!clearedRow?.failed && !clearedRow?.lockedUntil, "a success clears the durable counter");

  // ── 7. THE FILE IS PRUNED, NOT GROWING FOREVER ────────────────────────────
  section("Expired rows are dropped on the next session write");
  const afterPrune = readStore("kiosk-sessions.json", {});
  ok(!afterPrune[keyC], "the expired row was pruned when a new session was written");
  const badKeys = Object.keys(afterPrune).filter((k) => !/^[0-9a-f]{64}$/.test(k));
  ok(badKeys.length === 0, "every remaining key is a sha256, not a token", badKeys.join(","));
  const rawFinal = fs.readFileSync(file("kiosk-sessions.json"), "utf8");
  ok(!rawFinal.includes(tokenA) && !rawFinal.includes(afterLock.body?.secret ?? ""),
    "no live token appears in the file");

  await finish();
} catch (e) {
  console.error(`\nThe drill could not complete: ${e?.message ?? e}`);
  console.error(tailLog(60));
  await stopServer();
  restoreGenerated(generatedBefore, ROOT);
  try {
    fs.rmSync(scratch, { recursive: true, force: true });
  } catch {
    /* temp */
  }
  process.exit(1);
}
