#!/usr/bin/env node
// ── ASSIGNMENT LIFECYCLE — TARGETED, PARTIAL, SCHEDULED, CANCELLED ───────────
//
// The browser walk proves delivery to two pupils. This suite asks the states a
// teacher sets when one piece of work is not the same as another:
//
//   · work aimed at ONE learner reaches that learner and nobody else;
//   · a two-concept task can be PARTIALLY complete, with the outstanding
//     concept named rather than rounded into "done";
//   · a retry is a second piece of evidence, while a replayed submission is the
//     SAME piece of evidence;
//   · a deadline in the past is refused;
//   · a scheduled task is hidden until its release, then appears;
//   · closing work withdraws it, and republishing restores it; and
//   · the teacher can read the learner's actual recent responses, not just a
//     completion tick.
//
// It runs against the development server with the isolated test-only approval
// fixture. It never edits PILOT_APPROVALS and creates no real review record.
//
//   OPENMIND_DATA_DIR=/tmp/openmind-lifecycle OPENMIND_TEST_CONTENT_APPROVALS=1 npm run dev
//   node scripts/verify-assignment-lifecycle.mjs
import { sleep } from "./browser.mjs";

const BASE = process.env.ASSIGNMENT_BASE ?? "http://127.0.0.1:4173";
let passed = 0;
let failed = 0;
const check = (cond, message, detail = "") => {
  if (cond) { passed += 1; console.log(`  ✓ ${message}`); }
  else { failed += 1; console.error(`  ✗ FAIL: ${message}${detail ? ` — ${detail}` : ""}`); }
};
const section = (name) => console.log(`\n▸ ${name}`);
const q = (values) => new URLSearchParams(values).toString();
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
const get = (cookie) => (cookie ? { headers: { Cookie: cookie } } : {});
const call = async (path, opts = {}) => {
  const res = await fetch(BASE + path, { ...opts, signal: AbortSignal.timeout(30_000) });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: res.status, body, headers: res.headers };
};
const created = [];

async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `life-${role}-${stamp}@example.test`;
  const password = "lifecycle-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role, country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = r.body?.profile?.profile?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.getSetCookie?.() ?? [r.headers.get("set-cookie") ?? ""])
    .map((value) => value.split(";")[0]).filter(Boolean).join("; ");
  if (r.status !== 200 || !id || !secret) throw new Error(`signup ${role}: ${r.status} ${JSON.stringify(r.body)}`);
  const a = { id, secret, cookie, email, password, handle };
  created.push(a);
  return a;
}

const patch = (a, body) => call("/api/profile", json({ id: a.id, secret: a.secret, ...body }, a.cookie));
const workFor = (a) => call(`/api/assignments?${q({ me: a.id, secret: a.secret })}`, get(a.cookie));
const ledger = async (a) => (await call(`/api/evidence?${q({ id: a.id, secret: a.secret })}`, get(a.cookie))).body?.events ?? [];
const assignmentFor = async (a, id) => {
  const work = await workFor(a);
  return (work.body?.assigned ?? []).find((row) => row.assignment.id === id) ?? null;
};

async function serveOne(a, conceptId) {
  const served = await call("/api/progress", json({ action: "serve", id: a.id, secret: a.secret, conceptId }, a.cookie));
  return served.status === 200 ? served.body?.question ?? null : null;
}

async function answerServed(a, conceptId, question, submissionId) {
  if (!question?.id) return null;
  const answer = { action: "answer", id: a.id, secret: a.secret, conceptId, questionId: question.id, submissionId };
  if (question.responseKind === "numeric") answer.numericAnswer = "0";
  else answer.choiceIndex = 0;
  const graded = await call("/api/progress", json(answer, a.cookie));
  return graded.status === 200 ? graded : null;
}

async function answerOne(a, conceptId, submissionId) {
  return answerServed(a, conceptId, await serveOne(a, conceptId), submissionId);
}

try {
  const health = await call("/api/health");
  if (health.status !== 200) throw new Error(`health ${health.status}`);

  section("A targeted two-concept assignment reaches only its learner");
  const teacher = await account("teacher", "life_teacher");
  const p1 = await account("student", "life_p1");
  const p2 = await account("student", "life_p2");
  for (const a of [teacher, p1, p2]) {
    check((await patch(a, { onboarded: true, handle: a.handle, country: "GB", language: "en", subjects: ["maths"] })).status === 200,
      `${a.handle}'s profile is complete`);
  }
  const clsRes = await call("/api/classes", json({
    action: "create", name: "Lifecycle class", subject: "maths", specificationId: "uk-gcse",
  }, teacher.cookie));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.joinCode, `the class exists (${cls?.joinCode ?? clsRes.status})`);
  for (const pupil of [p1, p2]) {
    const joined = await call("/api/classes", json({
      action: "join", id: pupil.id, secret: pupil.secret, joinCode: cls.joinCode, handle: pupil.handle,
    }, pupil.cookie));
    check(joined.status === 200, `${pupil.handle} joins the class`);
  }

  const dueAt = Date.now() + 60 * 60 * 1000;
  const targeted = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions", "negatives"],
    targetHandles: [p1.handle], dueAt, title: "Targeted two-part task", state: "published",
  }, teacher.cookie));
  const targetId = targeted.body?.assignment?.id;
  check(targeted.status === 200 && !!targetId && targeted.body?.assignment?.dueAt === dueAt, "the teacher sets a deadlined two-concept task for one learner");
  check((await assignmentFor(p1, targetId))?.assignment?.targetHandles?.[0] === p1.handle, "the targeted learner receives it");
  check((await assignmentFor(p2, targetId)) === null, "the other learner does not receive work aimed at somebody else");
  const teacherWork = await workFor(teacher);
  const monBefore = (teacherWork.body?.monitor ?? []).find((m) => m.assignment.id === targetId);
  check(monBefore?.members?.length === 1 && monBefore.members[0].handle === p1.handle, "the teacher's monitor holds only the targeted row");

  section("One concept done is PARTIAL, not complete");
  check(!!(await answerOne(p1, "fractions", "life_sub_fraction_1")), "the learner answers the first concept through the practice door");
  const partial = (await workFor(p1)).body?.assigned?.find((w) => w.assignment.id === targetId);
  check(partial?.mine?.complete === false, "the task is not marked complete");
  check(partial?.mine?.answers === 1 && partial?.mine?.outstanding?.includes("negatives"),
    "the outstanding concept is named", JSON.stringify(partial?.mine?.outstanding));
  const monPartial = (await workFor(teacher)).body?.monitor?.find((m) => m.assignment.id === targetId);
  check(monPartial?.members?.[0]?.complete === false && monPartial.members[0].outstanding.includes("negatives"),
    "the teacher sees the same partial state, from the ledger");

  section("A replay is not a second answer; a retry is");
  const beforeReplay = (await ledger(p1)).length;
  await answerOne(p1, "fractions", "life_sub_fraction_2");
  const afterRetry = (await ledger(p1)).length;
  check(afterRetry === beforeReplay + 1, "a new retry records a second answer", `${beforeReplay} → ${afterRetry}`);
  const replay = await answerOne(p1, "fractions", "life_sub_fraction_1");
  check(replay?.body?.duplicate === true, "replaying an earlier submission is recognised as a duplicate");
  check((await ledger(p1)).length === afterRetry, "the replay adds no evidence event");
  const monRetry = (await workFor(teacher)).body?.monitor?.find((m) => m.assignment.id === targetId);
  check(monRetry?.members?.[0]?.answers === 2, "the monitor counts both real attempts, not the replay");

  section("Two concurrent requests for one learner both survive");
  const fractionQuestion = await serveOne(p1, "fractions");
  const negativeQuestion = await serveOne(p1, "negatives");
  const beforeConcurrent = (await ledger(p1)).length;
  const [concurrentA, concurrentB] = await Promise.all([
    answerServed(p1, "fractions", fractionQuestion, "life_concurrent_fraction"),
    answerServed(p1, "negatives", negativeQuestion, "life_concurrent_negatives"),
  ]);
  check(concurrentA?.body?.duplicate !== true && concurrentB?.body?.duplicate !== true,
    "both simultaneous answers are accepted as new work");
  const concurrentLedger = await ledger(p1);
  check(concurrentLedger.length === beforeConcurrent + 2, "both events reach the ledger; neither silently overwrites the other",
    `${beforeConcurrent} → ${concurrentLedger.length}`);
  check(new Set(concurrentLedger.map((event) => event.id)).size === concurrentLedger.length, "the concurrent events have distinct ids");

  section("A past deadline is refused; a scheduled task is hidden until released");
  const past = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"],
    dueAt: Date.now() - 1_000, title: "Already late",
  }, teacher.cookie));
  check(past.status === 400 && /due date must be in the future/.test(String(past.body?.error)), "a deadline in the past cannot be set");
  const releaseAt = Date.now() + 2_000;
  const scheduled = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"], targetHandles: [p2.handle],
    dueAt: Date.now() + 60 * 60 * 1000, releaseAt, state: "scheduled", title: "Released later",
  }, teacher.cookie));
  const scheduledId = scheduled.body?.assignment?.id;
  check(scheduled.status === 200 && scheduled.body?.assignment?.state === "scheduled", "a scheduled task is stored as scheduled");
  check((await assignmentFor(p2, scheduledId)) === null, "the learner does not see it before the release");
  await sleep(2_500);
  check(!!(await assignmentFor(p2, scheduledId)), "the same learner sees it after the release");
  check((await assignmentFor(p1, scheduledId)) === null, "the scheduled task did not leak to the other pupil");

  section("Closing withdraws the work; republishing restores it");
  const closed = await call("/api/assignments", json({ action: "close", clsId: cls.id, assignmentId: targetId }, teacher.cookie));
  check(closed.status === 200 && closed.body?.assignment?.state === "closed", "the teacher closes the task");
  check((await assignmentFor(p1, targetId)) === null, "the learner can no longer see the closed work");
  const republished = await call("/api/assignments", json({ action: "publish", clsId: cls.id, assignmentId: targetId }, teacher.cookie));
  check(republished.status === 200 && republished.body?.assignment?.state === "published", "the teacher republishes the same record");
  check(!!(await assignmentFor(p1, targetId)), "the targeted learner sees it again");

  section("The teacher can read the learner's actual responses");
  const member = await call(`/api/classes?${q({ me: teacher.id, secret: teacher.secret, id: cls.id, learner: p1.id })}`, get(teacher.cookie));
  const recent = member.body?.member?.recent ?? [];
  check(member.status === 200 && !!member.body?.member, "the teacher opens the learner's evidence drawer");
  check(recent.some((event) => event.conceptId === "fractions"), "it contains the actual fractions responses taken for the task");
  check(recent.every((event) => typeof event.correct === "boolean"), "each response carries its server-decided verdict");

  console.log(`\n${"─".repeat(58)}`);
  console.log(`ASSIGNMENT LIFECYCLE: ${passed} passed, ${failed} failed`);
} finally {
  for (const a of created) {
    await call(`/api/profile?${q({ id: a.id, secret: a.secret, confirm: "ERASE" })}`, { method: "DELETE" });
  }
}
process.exit(failed ? 1 : 0);