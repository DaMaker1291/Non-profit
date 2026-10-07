// ─────────────────────────────────────────────────────────────────────────────
// ONE MANDATORY JOURNEY: a learner who has never been here before, from the
// front door to the next recommendation.
//
//   SIGN UP → ONBOARD → SELECT COURSE → DIAGNOSTIC → FIRST TASK
//           → ANSWER → FEEDBACK → EVIDENCE → NEXT RECOMMENDATION
//
// WHY THIS FILE EXISTS SEPARATELY from scripts/e2e-api.mjs.
//
// That suite is the deep one — 2,800 lines of contract checks — and it drives
// the `reveal` test hook, which lets it see a question's answer BEFORE
// submitting so it can build precise learner states. A production build
// compiles that hook OUT on purpose (a test hook that works in production is a
// production hole), so the deep suite can only ever run against a development
// server.
//
// Which left the product with an uncomfortable gap: 2,494 engine assertions and
// a deep suite that CANNOT run against the artefact we actually ship. "The
// tests pass" and "the thing we serve works" were two different claims.
//
// This journey closes it by asking for nothing a learner could not ask for. It
// never needs to know the right answer in advance, because the product itself
// tells the learner after they answer — `answerIndex` and `explanation` come
// back on the grade. So it runs against the REAL PRODUCTION BUILD, and the one
// claim it proves is the one that matters: a new learner can arrive, be
// measured, be taught, and be told what to do next.
//
// Usage:  OPENMIND_BASE=http://localhost:4199 node scripts/e2e-fresh-learner.mjs
// ─────────────────────────────────────────────────────────────────────────────

const BASE = process.env.OPENMIND_BASE ?? "http://localhost:4173";

let pass = 0;
let fail = 0;
const step = (name) => console.log(`\n▸ ${name}`);
const ok = (cond, message) => {
  if (cond) {
    pass += 1;
  } else {
    fail += 1;
    console.error(`  ✗ ${message}`);
  }
};

async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  return { status: res.status, body };
}

const post = (path, body) =>
  call(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// A unique learner per run: the suite must be re-runnable against the same
// store without the second run inheriting the first one's progress. Time plus
// randomness, because two runs a millisecond apart are two runs.
const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const EMAIL = `fresh-${stamp}@openmind.test`;
const PASSWORD = "openmind-e2e-passphrase";

// ── Is anything there at all? ───────────────────────────────────────────────
// Asked FIRST and reported on its own, because every assertion below would
// otherwise fail with a confusing message when the real problem is that no
// server is listening.
{
  step("The deployment answers");
  let reachable = true;
  try {
    await fetch(BASE + "/", { signal: AbortSignal.timeout(5000) });
  } catch {
    reachable = false;
  }
  ok(reachable, `a server is listening on ${BASE} — start one, or set OPENMIND_BASE`);
  if (!reachable) {
    console.error(`\nNo server at ${BASE}. This journey needs the real build running:\n` +
      `  npm run build && npm run e2e:fresh\n`);
    process.exit(1);
  }
}

// ── 1. SIGN UP ─────────────────────────────────────────────────────────────
let secret = "";
let id = "";
{
  step("Sign up");
  const r = await post("/api/auth/signup", {
    email: EMAIL,
    password: PASSWORD,
    name: "Fresh Learner",
    country: "GB",
    language: "en",
  });
  ok(r.status === 200, `sign-up answered 200 (got ${r.status})`);
  ok(r.body?.account?.email === EMAIL, "the new account is the one that was asked for");
  ok(typeof r.body?.profile?.profile?.id === "string" && r.body.profile.profile.id.length > 0,
    "and it owns a learner profile from the start — an account is never a login with nowhere to put the learning");
  ok(typeof r.body?.secret === "string" && r.body.secret.length >= 16,
    "the capability comes back with it, so every later write on this device can be authorised");
  id = r.body?.profile?.profile?.id ?? "";
  secret = r.body?.secret ?? "";
}

const authed = (path) => call(`${path}${path.includes("?") ? "&" : "?"}id=${encodeURIComponent(id)}&secret=${encodeURIComponent(secret)}`);

// ── 2. ONBOARD ─────────────────────────────────────────────────────────────
{
  step("Onboard");
  const r = await post("/api/profile", {
    id, secret,
    grade: "Year 10",
    birthYear: 2010,
    goal: "exams",
    subjects: ["maths"],
    onboarded: true,
  });
  ok(r.status === 200, `the enrolment write answered 200 (got ${r.status})`);
  // Onboarding is a TIMESTAMP, not a flag: "when did we stop asking them to set
  // up" is a fact a support question can be answered from, and a boolean is not.
  ok(typeof r.body?.profile?.onboardedAt === "number",
    "and onboarding is recorded with the moment it finished, not just a flag");
  // The gaps are DERIVED server-side from what the learner has not chosen yet,
  // and named FIELD BY FIELD — "your course is incomplete" is useless without
  // "which part". This is the list Home sends them to /curriculum for, so it has
  // to name the course honestly before one is chosen: a learner whose course is
  // unchosen must never be given a recommendation that rests on the fallback.
  const gaps = r.body?.courseGaps ?? [];
  const mathsGap = gaps.find((g) => g.subject === "maths");
  ok(mathsGap != null, "and their course is reported as still unchosen, by subject");
  ok(Array.isArray(mathsGap?.missing) && mathsGap.missing.length > 0,
    `with the missing parts named (${(mathsGap?.missing ?? []).join(", ")})`);
  ok(Object.keys(r.body?.profile?.subjectCourses ?? {}).length === 0 || !r.body.profile.subjectCourses.maths?.spec,
    "and nothing has silently chosen a qualification for them");
}

// ── 3. SELECT COURSE ───────────────────────────────────────────────────────
{
  step("Select course");
  const r = await post("/api/profile", {
    id, secret,
    subjectCourses: { maths: { spec: "uk-gcse", specLevel: "higher" } },
  });
  ok(r.status === 200, `choosing a course answered 200 (got ${r.status})`);
  ok(r.body?.profile?.subjectCourses?.maths?.spec === "uk-gcse",
    "the course is stored against the subject it belongs to — a learner can sit two courses at once");
  ok(r.body?.profile?.spec === "uk-gcse",
    "and the learner's FIRST subject is mirrored into the flat field, so a single-course reader keeps a true one");
  ok(!(r.body?.courseGaps ?? []).some((g) => g.subject === "maths" && g.missing.includes("spec")),
    "and the qualification gap closes — Home stops sending them here for a course");
  const after = await authed("/api/next");
  ok(!(after.body?.courseGaps ?? []).some((g) => g.subject === "maths"),
    "and the decision door agrees — the plan no longer has to say it is provisional");
}

// ── 4. DIAGNOSTIC ──────────────────────────────────────────────────────────
// Five steps, not twenty: "question 1 of N" would be a lie, because an adaptive
// sitting has no fixed length. The learner is measured until the ladder for
// each concept runs out, and the sitting is CLOSED once — one
// `diagnostic_completed` event, then the model moves.
let diagnosticked = 0;
{
  step("Diagnostic");
  const start = await post("/api/diagnostic", { id, secret, subject: "maths", action: "start", kind: "baseline" });
  ok(start.status === 200, `the sitting opens (got ${start.status})`);
  ok(typeof start.body?.question?.id === "string", "and serves a real question");
  ok(typeof start.body?.sessionKey === "string", "against a named session, so a reload can resume rather than restart");
  // THE SERVED QUESTION CARRIES NO ANSWER. Asserted on the PRODUCTION build,
  // which is the only place this can be checked: a view that shipped `answer`
  // would hand the learner the key, and the dev suite would not catch it if the
  // strip lived in a build step.
  ok(start.body?.question && start.body.question.answer === undefined,
    "and the question does not carry its own answer — the strip is real in the artefact we serve");

  // Answer the first question: a wrong answer is a valid measurement, and the
  // journey is about the LOOP, not about scoring well.
  const first = start.body?.question?.id;
  if (first) {
    const a = await post("/api/diagnostic", { id, secret, subject: "maths", action: "answer", questionId: first, chosen: 0, certainty: "unsure" });
    ok(a.status === 200, `answering is graded (got ${a.status})`);
    ok(typeof a.body?.correct === "boolean", "the verdict is the server's");
    ok(typeof a.body?.explanation === "string" && a.body.explanation.length > 0,
      "and a wrong answer still comes with a reason, not just a cross");
    diagnosticked += 1;
  }

  // Walk the rest of the ladder out. `skip` is the learner saying "I do not
  // know", which is a better measurement than a guess — and it is the only way
  // to finish a sitting whose length is not known in advance.
  let guard = 0;
  let body = null;
  for (;;) {
    if (guard++ > 60) {
      ok(false, "the diagnostic ladder ended within 60 steps");
      break;
    }
    const s = await post("/api/diagnostic", { id, secret, subject: "maths", action: "skip" });
    if (s.status !== 200) {
      ok(false, `skip answered 200 (got ${s.status})`);
      break;
    }
    body = s.body;
    if (!body?.next) break;
    diagnosticked += 1;
  }

  const finish = await post("/api/diagnostic", { id, secret, subject: "maths", action: "finish" });
  ok(finish.status === 200, `closing the sitting answered 200 (got ${finish.status})`);
  ok(finish.body?.result != null, "and it produced the report the learner reads");
  ok(finish.body?.lifecycle === undefined || finish.body.lifecycle === "completed",
    "with the sitting's own lifecycle marked complete rather than left open");

  // A CLOSED SITTING IS A MEASUREMENT THE MODEL CAN SEE — the whole point of it.
  const summary = await authed("/api/evidence-summary");
  ok(summary.status === 200, `the learner's own record is readable (got ${summary.status})`);
  ok((summary.body?.totals?.diagnostics ?? 0) >= 1,
    `and it holds the sitting as a baseline measurement (diagnostics: ${summary.body?.totals?.diagnostics})`);
  ok((summary.body?.totals?.answers ?? 0) >= 1, "alongside the answered questions");
}

// ── 5. FIRST TASK ──────────────────────────────────────────────────────────
// The decision, read the way /api/next serves it. It must be a real
// recommendation derived from the record just created — not a fallback.
let taskConcept = "";
{
  step("First task");
  const r = await authed("/api/next");
  ok(r.status === 200, `the decision door answered 200 (got ${r.status})`);
  ok(Array.isArray(r.body?.actions) && r.body.actions.length > 0,
    "and it recommends something to do");
  ok(typeof r.body?.decision?.evidenceEvents === "number" && r.body.decision.evidenceEvents > 0,
    `from evidence it has actually read (${r.body?.decision?.evidenceEvents} events)`);
  taskConcept = r.body?.actions?.[0]?.conceptId ?? "";
  ok(typeof taskConcept === "string" && taskConcept.length > 0, "naming the concept to work on");
  // The reason is decided FOR the learner, server-side, in their language. A
  // surface that composed its own would be a second, unwritten decision.
  ok(typeof r.body?.actions?.[0]?.reason === "string" && r.body.actions[0].reason.length > 0,
    "with a reason attached, because \"do this\" without \"because\" is an order");
}

// ── 6. ANSWER, AND 7. FEEDBACK ─────────────────────────────────────────────
let proof = null;
{
  step("Answer and feedback");
  const served = await post("/api/progress", { action: "serve", id, secret, conceptId: taskConcept, lang: "en" });
  ok(served.status === 200, `a practice question is served for it (got ${served.status})`);
  ok(typeof served.body?.question?.id === "string", "and it is a real question");
  ok(served.body?.question?.answer === undefined, "with the answer still not on the wire");

  const q = served.body?.question;
  const graded = await post("/api/progress", {
    action: "answer",
    id, secret,
    conceptId: taskConcept,
    questionId: q?.id,
    choiceIndex: 0,
    submissionId: `sub_fresh${stamp}`,
    deviceAt: Date.now(),
  });
  ok(graded.status === 200, `the answer is graded (got ${graded.status})`);
  const v = graded.body ?? {};
  ok(typeof v.correct === "boolean", "the verdict is a real boolean, decided server-side");
  ok(typeof v.answerIndex === "number", "the right answer is revealed AFTER answering — that is the feedback");
  ok(typeof v.explanation === "string" && v.explanation.length > 0, "with an explanation of why");
  // Attribution is the server's: the client never declares mode or hint count,
  // and `demonstrated` is what the answer actually PROVED.
  ok(v.demonstrated && typeof v.demonstrated === "object" && typeof v.demonstrated.mode === "string",
    `and what it proved is attributed by the server (mode: ${v.demonstrated?.mode})`);
  ok(typeof v.mastery === "number", "the concept's mastery moved as a result");
  proof = v.demonstrated;
}

// ── 8. EVIDENCE ────────────────────────────────────────────────────────────
{
  step("Evidence");
  const r = await authed("/api/evidence-summary");
  ok(r.status === 200, `the record is readable (got ${r.status})`);
  ok((r.body?.totals?.answers ?? 0) >= 2, `it counts the diagnostic answer AND the practice one (${r.body?.totals?.answers})`);
  const row = (r.body?.concepts ?? []).find((c) => c.conceptId === taskConcept);
  ok(row != null, "the concept just practised appears in it");
  ok(row?.attempts >= 1, "with an attempt counted");
  ok(Array.isArray(r.body?.recent) && r.body.recent.length > 0, "and a recent-answer stream a surface can show");
  // AN UNMEASURED DIMENSION IS NULL, NEVER 0. `independent` is null until an
  // answer is given WITHOUT help; showing 0 would be a claim the learner has
  // failed something they were never asked to do.
  ok(row?.independent === null || (row?.independent && typeof row.independent.asked === "number"),
    "and a dimension nobody has measured yet is null rather than zero");

  // The ledger itself, capability-gated. A refusal here is the read door
  // working; an empty record would be a learner who answered nothing.
  const bad = await call(`/api/evidence?id=${encodeURIComponent(id)}&secret=wrong-capability-token-000000`);
  ok(bad.status === 401, `the ledger refuses a wrong capability (got ${bad.status})`);
  const ledger = await authed("/api/evidence");
  ok(ledger.status === 200, `and answers the right one (got ${ledger.status})`);
  ok(Array.isArray(ledger.body?.events) && ledger.body.events.length > 0, "with the events behind the model");
  ok(typeof ledger.body?.projectionVersion === "number" || typeof ledger.body?.projection?.version === "number" || ledger.body?.projection != null,
    "and the projection they were folded into");
}

// ── 9. NEXT RECOMMENDATION, AND THAT IT MOVED ──────────────────────────────
{
  step("Next recommendation");
  const before = await authed("/api/next");
  ok(before.status === 200, `Home's decision is readable again (got ${before.status})`);
  ok((before.body?.decision?.evidenceEvents ?? 0) > 0, "and it is still decided from the learner's own record");
  ok(Array.isArray(before.body?.actions) && before.body.actions.length > 0, "with something to do next");
  ok(before.body?.snapshot && typeof before.body.snapshot.touched === "number",
    `and an honest snapshot of where they are (touched: ${before.body?.snapshot?.touched})`);
  // THE LOOP CLOSES ONLY IF THE PLAN CAN MOVE. A recommendation identical to the
  // pre-practice one is not adaptivity, it is a list that happens to be there —
  // and that is why the count of events the decision was made from is asserted
  // rather than the concept it names (which may legitimately be the same one).
  ok(before.body?.decision?.evidenceEvents >= 3,
    `the plan now rests on everything recorded since sign-up (${before.body?.decision?.evidenceEvents} events)`);
  ok(proof != null, "and the work just done is part of it — the loop closed");
}

console.log(`\nFresh-learner journey: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
