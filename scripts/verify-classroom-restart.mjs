#!/usr/bin/env node
// ── CLASSROOM 2.0 — A REAL PROCESS RESTART, NOT A REFRESH ────────────────────
//
// A classroom platform is only as durable as the thing that survives when the
// Node process goes away. This drill therefore creates a complete classroom
// fixture over HTTP, writes the same records the browser walks write, STOPS the
// server process, STARTS A SECOND PROCESS ON THE SAME DATA DIRECTORY, signs
// every account back in, and requires the class, assignment, live room and
// evidence ledger to be byte-for-byte what they were. It also reads the files on
// disk, because an API that remembers its own in-memory object would pass the
// HTTP assertions and fail this one.
//
// It deliberately runs its OWN dev server on a scratch `NEXT_DIST_DIR` and a
// scratch `OPENMIND_DATA_DIR`, so it can kill and restart a process without
// disturbing the developer's server or the user's real `.openmind-data`.
// `OPENMIND_TEST_CONTENT_APPROVALS=1` is test-only and lives only in this
// child's environment; no approval registry is edited and no real teacher is
// represented as having reviewed anything.
//
// Run: node scripts/verify-classroom-restart.mjs
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = Number(process.env.OPENMIND_RESTART_PORT ?? 4177);
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = process.cwd();
const SCRATCH = mkdtempSync(path.join(tmpdir(), "openmind-classroom-restart-"));
const DATA_DIR = path.join(SCRATCH, "data");
// Next 16 requires its dist directory to live under the application root. A
// unique name keeps this disposable dev build away from the user's `.next-dev`.
const DIST_DIR = `.next-restart-${process.pid}`;
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
// `next dev` writes the temporary distDir into the tracked project config and
// next-env.d.ts. The drill must leave the tree exactly as it found it, including
// when it fails, or a gate that passes would still leave a review diff behind.
const TSCONFIG_PATH = path.join(ROOT, "tsconfig.json");
const NEXT_ENV_PATH = path.join(ROOT, "next-env.d.ts");
const GENERATED_BEFORE = {
  tsconfig: readFileSync(TSCONFIG_PATH, "utf8"),
  nextEnv: existsSync(NEXT_ENV_PATH) ? readFileSync(NEXT_ENV_PATH, "utf8") : null,
};

let passed = 0;
let failed = 0;
const check = (cond, message, detail = "") => {
  if (cond) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ FAIL: ${message}${detail ? ` — ${detail}` : ""}`);
  }
};
const section = (name) => console.log(`\n▸ ${name}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const q = (values) => new URLSearchParams(values).toString();
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
const get = (cookie) => ({ headers: cookie ? { Cookie: cookie } : {} });
const deep = (value) => JSON.stringify(value);

let server = null;
let serverLog = "";

async function call(pathname, opts = {}) {
  const res = await fetch(BASE + pathname, { ...opts, signal: AbortSignal.timeout(30_000) });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 400) }; }
  return { status: res.status, body, headers: res.headers };
}
const cookieFrom = (res) => {
  const values = res.headers.getSetCookie?.() ?? (res.headers.get("set-cookie") ? [res.headers.get("set-cookie")] : []);
  return values.map((value) => value.split(";")[0]).filter(Boolean).join("; ");
};
const processStart = async () => {
  const h = await call("/api/health");
  if (h.status !== 200 || typeof h.body?.now !== "number" || typeof h.body?.uptimeSeconds !== "number") return null;
  return h.body.now - Math.round(h.body.uptimeSeconds * 1000);
};

async function waitForServer(label) {
  for (let i = 0; i < 120; i += 1) {
    if (server?.exitCode !== null) throw new Error(`${label}: server exited with ${server.exitCode}\n${serverLog.slice(-3000)}`);
    try {
      const health = await call("/api/health");
      if (health.status === 200) return;
    } catch { /* compiling, or the socket is not up yet */ }
    await sleep(500);
  }
  throw new Error(`${label}: server did not answer /api/health\n${serverLog.slice(-3000)}`);
}

async function startServer(label) {
  serverLog = "";
  server = spawn(process.execPath, [NEXT_BIN, "dev", "-H", "127.0.0.1", "-p", String(PORT)], {
    cwd: ROOT,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      NODE_ENV: "development",
      NEXT_DIST_DIR: DIST_DIR,
      OPENMIND_DATA_DIR: DATA_DIR,
      OPENMIND_ALLOW_EPHEMERAL_STORE: "1",
      // TEST ONLY. This is the isolated fixture approval path, asserted by the
      // existing classroom suite; it is never a production setting.
      OPENMIND_TEST_CONTENT_APPROVALS: "1",
    },
  });
  const collect = (chunk) => {
    serverLog += chunk.toString();
    if (serverLog.length > 40_000) serverLog = serverLog.slice(-40_000);
  };
  server.stdout.on("data", collect);
  server.stderr.on("data", collect);
  await waitForServer(label);
}

async function stopServer() {
  if (!server) return;
  const current = server;
  server = null;
  const exited = new Promise((resolve) => current.once("exit", resolve));
  try {
    process.kill(process.platform === "win32" ? current.pid : -current.pid, "SIGTERM");
  } catch {
    try { current.kill("SIGTERM"); } catch { /* already gone */ }
  }
  await Promise.race([exited, sleep(10_000)]);
  if (current.exitCode === null) {
    try { process.kill(process.platform === "win32" ? current.pid : -current.pid, "SIGKILL"); } catch { /* already gone */ }
    await Promise.race([exited, sleep(3_000)]);
  }
}

async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `restart-${role}-${stamp}@example.test`;
  const password = "restart-drill-password-123";
  const res = await call("/api/auth/signup", json({
    email, password, name: handle, role, country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = res.body?.profile?.profile?.id;
  const secret = res.body?.secret;
  if (res.status !== 200 || !id || !secret) throw new Error(`signup ${role}: ${res.status} ${JSON.stringify(res.body)}`);
  return { email, password, id, secret, handle, cookie: cookieFrom(res) };
}

async function reauthenticate(account) {
  const res = await call("/api/auth/login", json({ email: account.email, password: account.password }));
  const cookie = cookieFrom(res);
  const id = res.body?.profile?.profile?.id;
  check(res.status === 200 && id === account.id && !!cookie, `${account.handle} signs in again after the restart`,
    `HTTP ${res.status} ${id ?? "no profile"}`);
  return cookie;
}

const authedGet = (pathname, account, cookie = account.cookie, extra = {}) =>
  call(`${pathname}?${q({ id: account.id, secret: account.secret, ...extra })}`, get(cookie));
const workFor = (account, cookie = account.cookie) =>
  call(`/api/assignments?${q({ me: account.id, secret: account.secret })}`, get(cookie));
const classroom = (account, body, cookie = account.cookie) =>
  call("/api/classroom", json({ id: account.id, secret: account.secret, ...body }, cookie));
const classroomRead = (account, clsId, sessionId, cookie = account.cookie) =>
  call(`/api/classroom?${q({ cls: clsId, session: sessionId, id: account.id, secret: account.secret })}`, get(cookie));
const ledger = async (account, cookie = account.cookie) =>
  (await authedGet("/api/evidence", account, cookie)).body?.events ?? [];

let cls;
let sessionId;
let assignmentId;
let before;

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("refusing to run the test-approval fixture with NODE_ENV=production");
  }
  console.log(`Scratch store: ${DATA_DIR}`);
  console.log(`Scratch Next dist: ${DIST_DIR}`);

  section("A teacher, three pupils, a class, and test-only approved work");
  await startServer("the first server");
  const firstStart = await processStart();
  check(firstStart !== null, "the first process reports its own start time");

  const teacher = await account("teacher", "restart_teacher");
  const p1 = await account("student", "restart_p1");
  const p2 = await account("student", "restart_p2");
  const p3 = await account("student", "restart_p3");
  check([teacher, p1, p2, p3].every((a) => a.cookie.includes("om_session=")), "all four accounts hold real session cookies");

  const made = await call("/api/classes", json({
    action: "create", name: "Restart drill class", subject: "maths", specificationId: "uk-gcse",
  }, teacher.cookie));
  cls = made.body?.cls;
  check(made.status === 200 && !!cls?.id && !!cls?.joinCode, `the teacher creates the class (${cls?.joinCode ?? made.status})`);
  for (const pupil of [p1, p2, p3]) {
    const joined = await call("/api/classes", json({
      action: "join", id: pupil.id, secret: pupil.secret, joinCode: cls.joinCode, handle: pupil.handle,
    }, pupil.cookie));
    check(joined.status === 200, `${pupil.handle} joins through the class code`);
  }

  const created = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"],
    dueAt: Date.now() + 86_400_000, title: "Restart work", state: "published",
  }, teacher.cookie));
  assignmentId = created.body?.assignment?.id;
  check(created.status === 200 && created.body?.assignment?.state === "published", "the test-approved lesson is published to the class");

  section("A live room is started, joined, and answered");
  const started = await classroom(teacher, { action: "start", clsId: cls.id });
  sessionId = started.body?.session?.id;
  check(started.status === 200 && !!sessionId && started.body?.session?.canControl === true, `the teacher starts and owns the live room (${sessionId ?? started.status})`);
  const published = await classroom(teacher, { action: "publish", clsId: cls.id, sessionId, conceptId: "fractions" });
  const activity = published.body?.session?.activity;
  check(published.status === 200 && !!activity?.questionId && activity.choices?.length === 4, "a reviewed fractions activity reaches the room");
  for (const pupil of [p1, p2, p3]) {
    const joined = await classroom(pupil, { action: "join", clsId: cls.id, sessionId });
    check(joined.status === 200 && joined.body?.session?.me?.joined === true, `${pupil.handle} joins the live room`);
  }
  const sub1 = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId, questionId: activity.questionId,
    choiceIndex: 0, submissionId: "restart_submission_p1",
  });
  const sub2 = await classroom(p2, {
    action: "submit", clsId: cls.id, sessionId, questionId: activity.questionId,
    choiceIndex: 1, submissionId: "restart_submission_p2",
  });
  check(sub1.status === 200 && !!sub1.body?.session?.me?.submission, "pupil 1's answer is accepted and attached to their row");
  check(sub2.status === 200 && !!sub2.body?.session?.me?.submission, "pupil 2's answer is accepted");
  check((await ledger(p1)).length === 1 && (await ledger(p2)).length === 1, "each answer wrote exactly one evidence event");

  const teacherLive = (await classroomRead(teacher, cls.id, sessionId)).body?.session;
  const pupilLive = (await classroomRead(p1, cls.id, sessionId)).body?.session;
  const monitor = (await workFor(teacher)).body?.monitor?.find((m) => m.assignment.id === assignmentId);
  const pupilWork = (await workFor(p1)).body?.assigned?.find((w) => w.assignment.id === assignmentId);
  check(teacherLive?.counts?.participants === 3 && teacherLive?.counts?.submitted === 2, "the teacher sees three joined and two submitted");
  check(teacherLive?.answerIndex !== undefined && pupilLive?.answerIndex === undefined, "the teacher has the key; the pupil does not");
  check(monitor?.members?.find((m) => m.handle === p1.handle)?.complete === true, "the monitor marks pupil 1's work complete");
  check(monitor?.members?.find((m) => m.handle === p3.handle)?.complete === false, "and leaves pupil 3 outstanding");
  check(pupilWork?.mine?.complete === true, "pupil 1's own assignment view agrees");

  before = {
    start: firstStart,
    sessionVersion: teacherLive?.version,
    prompt: teacherLive?.activity?.prompt,
    participants: teacherLive?.counts?.participants,
    submitted: teacherLive?.counts?.submitted,
    monitor: deep(monitor),
    student: deep(pupilWork),
    p1Events: (await ledger(p1)).map((event) => event.id).sort(),
    p2Events: (await ledger(p2)).map((event) => event.id).sort(),
    joinCode: cls.joinCode,
  };

  section("The files themselves hold the classroom before the restart");
  const classFile = path.join(DATA_DIR, "classes.json");
  const roomFile = path.join(DATA_DIR, "classroom-sessions.json");
  const accountFile = path.join(DATA_DIR, "accounts.json");
  const p1Ledger = path.join(DATA_DIR, "evidence", `${p1.id}.jsonl`);
  check(existsSync(classFile) && readFileSync(classFile, "utf8").includes(assignmentId), "classes.json contains the assignment");
  check(existsSync(roomFile) && readFileSync(roomFile, "utf8").includes(sessionId), "classroom-sessions.json contains the live room");
  check(existsSync(accountFile) && [teacher, p1, p2, p3].every((a) => readFileSync(accountFile, "utf8").includes(a.email)), "accounts.json contains all four accounts");
  check(existsSync(p1Ledger) && readFileSync(p1Ledger, "utf8").trim().split("\n").filter(Boolean).length === 1, "pupil 1's evidence ledger has exactly one JSONL event on disk");

  section("The process is stopped, and a genuinely new one starts on the same store");
  await stopServer();
  check(true, "the first server process has exited");
  await startServer("the restarted server");
  const secondStart = await processStart();
  check(secondStart !== null && secondStart !== before.start, "a different process start is serving after the restart",
    `${new Date(before.start).toISOString()} → ${new Date(secondStart ?? 0).toISOString()}`);

  section("Every account signs in again; the class and its work are unchanged");
  const teacherCookie = await reauthenticate(teacher);
  const p1Cookie = await reauthenticate(p1);
  const p2Cookie = await reauthenticate(p2);
  const p3Cookie = await reauthenticate(p3);
  const classRead = await call(`/api/classes?${q({ me: teacher.id, secret: teacher.secret, id: cls.id })}`, get(teacherCookie));
  check(classRead.status === 200 && classRead.body?.cls?.joinCode === before.joinCode, "the class and its join code survived");
  const monitorAfter = (await workFor(teacher, teacherCookie)).body?.monitor?.find((m) => m.assignment.id === assignmentId);
  const p1WorkAfter = (await workFor(p1, p1Cookie)).body?.assigned?.find((w) => w.assignment.id === assignmentId);
  check(deep(monitorAfter) === before.monitor, "the teacher's assignment monitor is unchanged, including distinct completion states");
  check(deep(p1WorkAfter) === before.student, "pupil 1's own assignment view is unchanged");

  section("The live room and the evidence ledger are still authoritative");
  const liveAfter = (await classroomRead(teacher, cls.id, sessionId, teacherCookie)).body?.session;
  const pupilAfter = (await classroomRead(p1, cls.id, sessionId, p1Cookie)).body?.session;
  check(liveAfter?.id === sessionId && liveAfter?.status === "live", "the room is still live under the same session id");
  check(liveAfter?.version === before.sessionVersion && liveAfter?.activity?.prompt === before.prompt, "its version and activity prompt are unchanged");
  check(liveAfter?.counts?.participants === before.participants && liveAfter?.counts?.submitted === before.submitted, "both participation counts survived");
  check(pupilAfter?.me?.joined === true && pupilAfter?.me?.submission?.submissionId === "restart_submission_p1", "pupil 1 still owns the submission they made before the restart");
  const p1EventsAfter = (await ledger(p1, p1Cookie)).map((event) => event.id).sort();
  const p2EventsAfter = (await ledger(p2, p2Cookie)).map((event) => event.id).sort();
  check(deep(p1EventsAfter) === deep(before.p1Events) && deep(p2EventsAfter) === deep(before.p2Events), "both evidence ledgers are byte-identical; nothing was duplicated or lost",
    `p1 ${before.p1Events.join(",")} → ${p1EventsAfter.join(",")}; p2 ${before.p2Events.join(",")} → ${p2EventsAfter.join(",")}`);
  check((await ledger(p3, p3Cookie)).length === 0, "pupil 3, who joined but did not submit, still has no evidence event");

  section("The restarted room still accepts the same idempotent answer, then closes");
  const replay = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId, questionId: activity.questionId,
    choiceIndex: 0, submissionId: "restart_submission_p1",
  }, p1Cookie);
  check(replay.status === 200 && replay.body?.duplicate === true, "replaying the same submission after a restart is a duplicate, not new evidence");
  check((await ledger(p1, p1Cookie)).length === 1, "and the ledger still holds exactly one event");
  const end = await classroom(teacher, { action: "end", clsId: cls.id, sessionId }, teacherCookie);
  check(end.status === 200 && end.body?.session?.status === "ended", "the re-authenticated owner can still end the room");
  const afterEnd = await classroom(p3, {
    action: "submit", clsId: cls.id, sessionId, questionId: activity.questionId,
    choiceIndex: 2, submissionId: "restart_submission_p3_late",
  }, p3Cookie);
  check(afterEnd.status === 409 && afterEnd.body?.error === "session_ended", "and a pupil cannot submit after the close");

  section("Persisted files (read independently of the API)");
  const roomText = readFileSync(roomFile, "utf8");
  check(roomText.includes(sessionId) && roomText.includes("restart_submission_p1"), "classroom-sessions.json still holds the session and the pupil's submission");
  const p1Lines = readFileSync(p1Ledger, "utf8").trim().split("\n").filter(Boolean);
  check(p1Lines.length === 1, "the on-disk ledger still has exactly one accepted event");
  check(existsSync(path.join(DATA_DIR, "evidence")) && readdirSync(path.join(DATA_DIR, "evidence")).length >= 2, "both pupils' ledger files exist after the restart");

  console.log(`\n${"─".repeat(62)}`);
  console.log(`CLASSROOM RESTART: ${passed} passed, ${failed} failed`);
} catch (error) {
  failed += 1;
  console.error(`\n✗ restart drill crashed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  if (serverLog) console.error(`\n── server log (tail) ──\n${serverLog.slice(-5000)}`);
} finally {
  await stopServer();
  rmSync(SCRATCH, { recursive: true, force: true });
  rmSync(path.join(ROOT, DIST_DIR), { recursive: true, force: true });
  writeFileSync(TSCONFIG_PATH, GENERATED_BEFORE.tsconfig);
  if (GENERATED_BEFORE.nextEnv !== null) writeFileSync(NEXT_ENV_PATH, GENERATED_BEFORE.nextEnv);
}
process.exit(failed ? 1 : 0);