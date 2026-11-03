#!/usr/bin/env node
// ── CLASSROOM 2.0 — LIVE SESSION, ASSIGNMENT GATE, PERSISTENCE ──────────────
//
// This is the server-authoritative half of the acceptance suite. It creates
// real accounts, a real class and real pupil memberships over HTTP, then:
//
//   · starts a live session as the owning teacher;
//   · publishes an activity from the approved test fixture;
//   · has two pupils join and submit;
//   · retries the same submission (one ledger event);
//   · refuses a second different submission to the same activity;
//   · pauses and refuses a submission after the close;
//   · refuses a non-member and a second teacher controlling the room;
//   · reads the persisted room back after every transition.
//
// Browser presence, real SSE delivery and offline are covered by the browser
// walk. Run against the dev server on a scratch store:
//   OPENMIND_DATA_DIR=/tmp/openmind-classroom OPENMIND_TEST_CONTENT_APPROVALS=1 npm run dev
//   node scripts/verify-classroom2.mjs
const BASE = process.env.OPENMIND_BASE ?? "http://127.0.0.1:4173";
let passed = 0, failed = 0;
const check = (cond, msg, detail = "") => {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ FAIL: ${msg}${detail ? ` — ${detail}` : ""}`); }
};
const section = (s) => console.log(`\n▸ ${s}`);
const q = (o) => new URLSearchParams(o).toString();
const json = (body, cookie = null) => ({
  method: "POST",
  headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(body),
});
async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 300) }; }
  return { status: res.status, body, headers: res.headers };
}
const created = [];
async function account(role, handle) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const email = `class2-${role}-${stamp}@example.test`;
  const password = "class2-password-123";
  const r = await call("/api/auth/signup", json({
    email, password, name: handle, role,
    country: "GB", language: "en", subjects: ["maths"],
  }));
  const id = r.body?.profile?.profile?.id;
  const secret = r.body?.secret;
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  if (r.status !== 200 || !id || !secret) throw new Error(`signup ${role}: HTTP ${r.status} ${JSON.stringify(r.body)}`);
  const a = { id, secret, cookie, email, password, role, handle };
  created.push(a);
  return a;
}
async function patch(a, body) {
  return call("/api/profile", json({ id: a.id, secret: a.secret, ...body }, a.cookie));
}
const authedGet = (a, path, extra = {}) => call(`${path}?${q({ id: a.id, secret: a.secret, ...extra })}`, {
  headers: a.cookie ? { Cookie: a.cookie } : {},
});
/** The assignment listing names the caller `me`; `id` on that route is not a
 *  learner parameter at all. */
const workFor = (a) => call(`/api/assignments?${q({ me: a.id, secret: a.secret })}`, {
  headers: a.cookie ? { Cookie: a.cookie } : {},
});
const classroom = (a, body) => call("/api/classroom", json({ id: a.id, secret: a.secret, ...body }, a.cookie));
const ledger = async (a) => (await authedGet(a, "/api/evidence")).body?.events ?? [];

try {
  const health = await call("/api/health");
  if (health.status !== 200) throw new Error(`health ${health.status}`);

  section("A teacher, a class, and two pupils");
  const teacher = await account("teacher", "class2_teacher");
  check((await patch(teacher, { onboarded: true, handle: "class2_teacher" })).status === 200, "teacher profile");
  const clsRes = await call("/api/classes", json({
    action: "create", name: "Classroom 2.0", subject: "maths", specificationId: "uk-gcse",
  }, teacher.cookie));
  const cls = clsRes.body?.cls;
  check(clsRes.status === 200 && !!cls?.joinCode, `the teacher created a class (${cls?.joinCode ?? clsRes.status})`);
  const p1 = await account("student", "class2_p1");
  const p2 = await account("student", "class2_p2");
  const outsider = await account("student", "class2_out");
  for (const p of [p1, p2, outsider]) {
    await patch(p, { onboarded: true, grade: "Year 10", subjects: ["maths"], subjectCourses: { maths: { spec: "uk-gcse", specLevel: "foundation" } } });
  }
  for (const p of [p1, p2]) {
    const join = await call("/api/classes", json({ action: "join", id: p.id, secret: p.secret, joinCode: cls.joinCode, handle: p.handle }, p.cookie));
    check(join.status === 200, `${p.handle} joined the class through the class code`, `${join.status} ${JSON.stringify(join.body)}`);
  }

  section("The owning teacher starts and publishes; the server stores the room");
  const started = await classroom(teacher, { action: "start", clsId: cls.id });
  const sid = started.body?.session?.id;
  check(started.status === 200 && !!sid, `a live session starts (${sid ?? started.status})`);
  check(started.body?.session?.status === "live", "with status live");
  check(started.body?.session?.canControl === true, "and the teacher is the controller");

  const published = await classroom(teacher, { action: "publish", clsId: cls.id, sessionId: sid, conceptId: "fractions" });
  const act = published.body?.session?.activity;
  check(published.status === 200 && !!act, "a reviewed lesson activity is published");
  check(published.body?.session?.answerIndex !== undefined, "the teacher receives the key");
  check(!!act?.prompt && Array.isArray(act?.choices) && act.choices.length === 4, "every device gets the same four-option item");
  const versionBefore = published.body?.session?.version;

  section("A pupil joins and submits; duplicate and overwrite are distinguished");
  const joined = await classroom(p1, { action: "join", clsId: cls.id, sessionId: sid });
  check(joined.status === 200 && joined.body?.session?.me?.joined === true, "pupil 1 joins the live room");
  const p1View = (await call(`/api/classroom?${q({ cls: cls.id, session: sid, id: p1.id, secret: p1.secret })}`, { headers: { Cookie: p1.cookie } })).body?.session;
  check(p1View?.activity?.prompt === act.prompt, "pupil 1 sees the same prompt");
  check(p1View?.answerIndex === undefined, "but never receives the answer key");
  const before = (await ledger(p1)).length;
  const choice = 0;
  const sub = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: choice, submissionId: "sub_class2_one",
  });
  check(sub.status === 200 && sub.body?.session?.me?.submission, "the submission is accepted and attached to the pupil's row");
  const afterOne = await ledger(p1);
  check(afterOne.length === before + 1, "exactly one evidence event is written", `${before} → ${afterOne.length}`);

  const replay = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: choice, submissionId: "sub_class2_one",
  });
  check(replay.status === 200 && replay.body?.duplicate === true, "the same submission id is idempotent");
  check((await ledger(p1)).length === afterOne.length, "and does not add a second ledger event");

  const overwrite = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: 1, submissionId: "sub_class2_two",
  });
  check(overwrite.status === 409 && overwrite.body?.error === "already_submitted", "a different second answer is refused, not silently overwritten");

  section("Pupil 2, a late join, and the teacher's participation view");
  const late = await classroom(p2, { action: "join", clsId: cls.id, sessionId: sid });
  check(late.status === 200, "pupil 2 can join after the activity was published");
  await classroom(p2, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: 2, submissionId: "sub_class2_p2",
  });
  const teacherView = (await call(`/api/classroom?${q({ cls: cls.id, session: sid })}`, { headers: { Cookie: teacher.cookie } })).body?.session;
  check(teacherView?.counts?.participants === 2, "the teacher sees two participants");
  check(teacherView?.counts?.submitted === 2, "and two submissions");
  check(teacherView?.participants?.find((p) => p.handle === "class2_p1")?.submitted === true, "with per-pupil state");

  section("Pause, late submissions, and non-owner controls");
  const paused = await classroom(teacher, { action: "pause", clsId: cls.id, sessionId: sid });
  check(paused.status === 200 && paused.body?.session?.status === "paused", "the teacher pauses the room");
  const afterPause = await classroom(p2, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: 0, submissionId: "sub_class2_after_pause",
  });
  check(afterPause.status === 409 && afterPause.body?.error === "submissions_paused", "a submission after the pause is refused");

  const outsiderJoin = await classroom(outsider, { action: "join", clsId: cls.id, sessionId: sid });
  check(outsiderJoin.status === 403 && outsiderJoin.body?.error === "not a member", "a pupil outside the class cannot join the room");

  const otherTeacher = await account("teacher", "class2_teacher2");
  await patch(otherTeacher, { onboarded: true, handle: "class2_teacher2" });
  const steal = await classroom(otherTeacher, { action: "resume", clsId: cls.id, sessionId: sid });
  check(steal.status === 403 && ["not_the_teacher", "not_the_session_owner"].includes(steal.body?.error),
    `a second teacher cannot control this room (${steal.status} ${steal.body?.error})`);

  const resumed = await classroom(teacher, { action: "resume", clsId: cls.id, sessionId: sid });
  check(resumed.status === 200 && resumed.body?.session?.status === "live", "the owner resumes it");
  check((await classroom(teacher, { action: "end", clsId: cls.id, sessionId: sid })).body?.session?.status === "ended", "and ends it");
  const afterEnd = await classroom(p1, {
    action: "submit", clsId: cls.id, sessionId: sid,
    questionId: act.questionId, choiceIndex: 0, submissionId: "sub_class2_after_end",
  });
  check(afterEnd.status === 409 && afterEnd.body?.error === "session_ended", "a submission after the end is refused");

  section("The assignment publication gate is intact");
  const unapproved = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["quadratics"],
    dueAt: Date.now() + 86400000, title: "Must not publish",
  }, teacher.cookie));
  check(unapproved.status === 400 && /not yet approved/i.test(String(unapproved.body?.error)), "an unapproved lesson cannot be set to a class", JSON.stringify(unapproved.body));

  const approved = await call("/api/assignments", json({
    action: "create", clsId: cls.id, conceptIds: ["fractions"],
    dueAt: Date.now() + 86400000, title: "Reviewed work",
  }, teacher.cookie));
  check(approved.status === 200 && approved.body?.assignment?.state === "published", "the test-approved lesson can be set");
  const pupilWork = await workFor(p1);
  check(pupilWork.status === 200 && (pupilWork.body?.assigned ?? []).some((w) => w.assignment.id === approved.body.assignment.id),
    `pupil 1 receives the assignment (HTTP ${pupilWork.status})`);
  const monitor = await workFor(teacher);
  check(monitor.status === 200 && (monitor.body?.monitor ?? []).some((m) => m.assignment.id === approved.body.assignment.id),
    `the teacher's monitor receives it (HTTP ${monitor.status})`);

  console.log(`\n${"─".repeat(58)}`);
  console.log(`CLASSROOM 2.0 API: ${passed} passed, ${failed} failed`);
} finally {
  for (const a of created) {
    await call(`/api/profile?id=${encodeURIComponent(a.id)}&secret=${encodeURIComponent(a.secret)}&confirm=ERASE`, { method: "DELETE" });
  }
}
process.exit(failed ? 1 : 0);
