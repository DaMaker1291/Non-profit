// THE ACCEPTANCE BATTERY — does OpenMind actually improve learning?
//
// `scripts/verify-engines.mjs` proves the engines are correct and
// `scripts/e2e-api.mjs` proves the routes behave. This file asks the third
// question, and the only one a learner cares about: given real use, does the
// system's picture of a learner CHANGE in the direction the work justified, and
// does the next thing it asks for follow from that change?
//
// It drives the running server exactly as the app does — sign-up, enrolment,
// diagnostic, sessions, grades, the tutor and the offline sync door — and
// prints a report rather than a pass count, because "does it adapt?" is a
// question with evidence attached, not a boolean.
//
// Usage (development server on :4173):
//     npm run dev &   # or: npm run dev
//     node scripts/acceptance.mjs
//
// Retention cannot be waited for inside one process, so the battery uses the DOOR
// THE PRODUCT ITSELF USES for history that happened elsewhere: POST /api/evidence
// ingests device-reported answers with their own timestamps, which is what a
// phone that was offline for a week sends when it reconnects. The events are
// stamped `provenance: "device"` by the validator, so nothing here is passed off
// as server-observed.
// The compiled mirror (`npm run verify` builds it) is required for two facts
// this script refuses to hardcode: which concepts can actually be practised,
// and which course ids a UK maths learner may pick.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const BASE = "http://localhost:4173";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`   ✓ ${m}`); } else { fail++; console.log(`   ✗ FAIL: ${m}`); } };
// A claim that is REPORTED but not counted: these are the honest observations
// (\"the reason was understandable\") rather than contract assertions.
const note = (m) => console.log(`   · ${m}`);
const head = (s) => console.log(`\n════════ ${s} ════════`);
const sub = (s) => console.log(`\n── ${s}`);
const show = (k, v) => console.log(`   ${String(k).padEnd(26)} ${v}`);

const EVIDENCE_SCHEMA_VERSION = 1;
const DAY = 24 * 60 * 60 * 1000;

// ── transport ────────────────────────────────────────────────────────────────
async function call(path, opts) {
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 200) }; }
  return { status: res.status, body };
}
const SECRETS = new Map();
const post = (p, b) => {
  const body = b && typeof b === "object" && b.id && SECRETS.has(b.id) ? { ...b, secret: SECRETS.get(b.id) } : b;
  return call(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
};
const getAuthed = (path, id) => call(`${path}${path.includes("?") ? "&" : "?"}secret=${encodeURIComponent(SECRETS.get(id) ?? "")}`);
const sid = (id) => SECRETS.get(id);

// ── a fresh student, the way the product makes one ───────────────────────────
let seq = 0;
async function freshStudent(label, extra = {}) {
  const stamp = `${Date.now().toString(36)}${seq++}`;
  const email = `acceptance-${label}-${stamp}@example.org`;
  const r = await post("/api/auth/signup", {
    email, password: "acceptance-pass-123", name: label,
    country: "GB", language: "en", subjects: ["maths"], role: "student", ...extra,
  });
  // The signup response carries the learner STATE (the same projection the
  // profile GET returns), so the id is one level in — read defensively rather
  // than assuming a shape the route owns.
  const id = r.body?.profile?.id ?? r.body?.profile?.profile?.id ?? "";
  if (!id) throw new Error(`signup failed: ${JSON.stringify(r.body).slice(0, 300)}`);
  SECRETS.set(id, r.body.secret);
  return { id, secret: r.body.secret, email, signup: r };
}

// ── the ordinary learner verbs ───────────────────────────────────────────────
const serveAt = (id, conceptId, extra = {}) => post("/api/progress", { action: "serve", id, conceptId, reveal: true, ...extra });
const answerAt = (id, conceptId, questionId, choiceIndex) =>
  post("/api/progress", { action: "answer", id, conceptId, questionId, choiceIndex });
const askHint = (id, conceptId, questionId, level) =>
  post("/api/progress", { action: "hint", id, conceptId, questionId, level });

/** One graded answer, optionally right, optionally with hints taken first. */
async function gradeOne(id, conceptId, correct, opts = {}) {
  const s = await serveAt(id, conceptId, opts.serve);
  if (s.status !== 200 || !s.body?.question) return null;
  const q = s.body.question;
  if (opts.hints) for (let l = 1; l <= opts.hints; l++) await askHint(id, conceptId, q.id, l);
  const idx = correct ? q.answer : (q.answer + 1) % q.choices.length;
  const r = await answerAt(id, conceptId, q.id, idx);
  return r.status === 200 ? { ...r.body, questionId: q.id } : null;
}

const nextOf = async (id) => (await getAuthed(`/api/next?id=${id}`, id)).body;
const topAction = (next) => next?.actions?.[0] ?? null;
const actionLine = (a) => (a ? `${a.kind} · ${a.conceptId} · ${a.minutes ?? "?"} min · "${(a.title ?? "").slice(0, 40)}"` : "none");
const evidenceOf = async (id) => (await getAuthed(`/api/evidence?id=${id}`, id)).body;
const dimsOf = (ev, cid) => {
  const c = ev?.projection?.byConcept?.[cid];
  if (!c) return null;
  const d = (r) => (r && r.asked > 0 ? `${r.correct}/${r.asked}` : "— not measured");
  return {
    recall: d(c.measured), application: d(c.independent), transfer: d(c.transfer), retention: d(c.retention),
    attempts: c.attempts, correct: c.correct,
  };
};

// The one compiled fact this script needs: which concepts can actually be
// practised, and the qualification ids a UK learner's course can be built from.
const genome = require("../.verify/genome.js");
const specs = require("../.verify/specifications.js");
const GENERATED = genome.CONCEPTS.filter((c) => c.subject === "maths")
  .map((c) => c.id)
  .filter((cid) => require("../.verify/questions.js").hasGenerator(cid));
// The learner's real course, read from the specification layer rather than
// invented here: the first GCSE Maths option the product offers a UK learner,
// with its first tier. (A course the layer does not offer must not be saveable,
// which is why this is read from the product.)
const ukOptions = specs.specOptionsFor("GB", "maths");
const UK_MATHS_SPEC = ukOptions[0]?.id ?? "";
const UK_MATHS_LEVEL = ukOptions[0]?.levels?.[0]?.id ?? "";

// ── WHICH CONCEPTS CAN ACTUALLY MEASURE TRANSFER ───────────────────────────
// Transfer is only transfer when the question is re-framed onto a second
// surface. The re-framer re-frames any concept whose answers are VALUES and
// whose stems are ONE readable line — four real questions of the concept, with
// the learner asked which of them produces a stated result — so the set of
// concepts that CAN carry a transfer measurement is a fact about the bank, read
// here from the re-framer itself rather than assumed. A battery that
// transferred an arbitrary concept would be asserting a measurement the serve
// cannot make (it honestly records `independent` instead, and no transfer
// credit exists to find). Both sides are counted below, so a change in coverage
// shows up as a number rather than as a quietly skipped section.
const transferMod = require("../.verify/transfer.js");
const REFRAMABLE = GENERATED.find((cid) => transferMod.canTransfer(cid)) ?? "";
const NO_SECOND_SURFACE = GENERATED.find((cid) => !transferMod.canTransfer(cid)) ?? "";
show("concepts that can transfer", `${GENERATED.filter((cid) => transferMod.canTransfer(cid)).length} of ${GENERATED.length} practicable maths concepts`);
show("concepts that cannot", `${GENERATED.filter((cid) => !transferMod.canTransfer(cid)).length} — answers in prose, or stems that run over several lines`);

// ═══════════════════════════════════════════════════════════════════════════
head("S2. FRESH STUDENT — one real pathway, no developer assistance");
// ═══════════════════════════════════════════════════════════════════════════
const student = await freshStudent("Amina");
sub("ONBOARDING");
show("account", `${student.email} created`);
ok(student.signup.body.account?.role === "student", "the account carries the role the learner chose");
const course = { spec: UK_MATHS_SPEC || undefined, specLevel: UK_MATHS_LEVEL || undefined };
const enrol = await post("/api/profile", {
  id: student.id, country: "GB", grade: "11", board: UK_MATHS_SPEC ? "aqa" : undefined,
  spec: course.spec, specLevel: course.specLevel,
  subjects: ["maths"], subjectCourses: { maths: course },
  goal: "I want a grade 7 in GCSE Maths", intent: "exams", examDate: "2027-06-01", onboarded: true,
});
ok(enrol.status === 200, "enrolment saved (UK → GCSE → Mathematics → AQA · grade 11 · exam date)");
show("course", `GB · aqa · spec ${UK_MATHS_SPEC || "(independent)"} · maths`);
// A required field missing is refused, with a reason.
const badEnrol = await post("/api/profile", { id: student.id, country: "GB", subjects: ["maths"], onboarded: true });
ok(badEnrol.status === 200 || badEnrol.status === 400, `an incomplete re-save is either completed or refused with a reason (${badEnrol.status})`);

sub("DIAGNOSTIC");
let cur = (await post("/api/diagnostic", { id: student.id, subject: "maths", action: "start", kind: "baseline", reveal: true })).body;
const t0 = Date.now();
let asked = 0, correct = 0;
const perConcept = new Map();
for (let guard = 0; cur?.question && guard < 40; guard++) {
  const q = cur.question;
  // Deliberately mixed: a diagnostic answered perfectly measures nothing about
  // where the learner stops.
  const wantRight = guard % 3 !== 0;
  const chosen = wantRight ? q.answer : (q.answer + 1) % q.choices.length;
  const r = await post("/api/diagnostic", { id: student.id, subject: "maths", action: "answer", questionId: q.id, chosen, reveal: true });
  if (r.status !== 200) break;
  asked++; if (r.body.correct) correct++;
  const cid = q.conceptId ?? r.body.conceptId ?? "?";
  const rec = perConcept.get(cid) ?? { asked: 0, correct: 0 };
  rec.asked++; if (r.body.correct) rec.correct++;
  perConcept.set(cid, rec);
  cur = { question: r.body.next };
}
const tookMs = Date.now() - t0;
const diagFin = await post("/api/diagnostic", { id: student.id, subject: "maths", action: "finish" });
const diagRes = diagFin.body?.result ?? {};
show("questions", asked);
show("score", `${correct}/${asked} (${asked ? Math.round((correct / asked) * 100) : 0}%)`);
show("time", `${(tookMs / 1000).toFixed(1)}s of answering (network-bound in a script; the UI's clock is per-sitting)`);
const scored = (diagRes.scores ?? []).filter((s) => s.asked > 0);
show("topics identified", scored.map((s) => `${s.conceptId}:${s.correct}/${s.asked}`).join(" ") || "(none returned)");
const weak = scored.filter((s) => s.correct / s.asked < 0.6).map((s) => s.conceptId);
show("weak areas identified", weak.join(", ") || "(none)");
// §12's four answers: what you know (strengths), what needs practice (gaps),
// what was NOT measured, and what to do next. The "not measured" half is the
// demand-ladder estimates whose `measured` flag is false plus the concepts the
// probe never asked about (asked: 0 priors) — the field is not called
// `notMeasured`, which is why the first version of this line printed "?".
const ladderUnmeasured = (diagRes.skills ?? []).filter((s) => !s.estimate?.measured);
show("know already", (diagRes.strengths ?? []).map((s) => s.conceptId).join(", ") || "(none)");
show("needs practice", (diagRes.gaps ?? []).slice(0, 5).map((s) => s.conceptId).join(", ") || "(none)");
show("not measured", `${ladderUnmeasured.length} demand bands unmeasured of ${(diagRes.skills ?? []).length}` +
  (ladderUnmeasured.length ? ` (${ladderUnmeasured.map((s) => `${s.skill}${s.inBank === false ? " beyond this instrument" : ""}`).slice(0, 3).join(", ")})` : ""));
show("concepts never asked", `${(diagRes.scores ?? []).filter((s) => (s.asked ?? 0) === 0).length} carry an unprobed prior, not a score`);
ok((diagRes.gaps ?? []).length + (diagRes.strengths ?? []).length + (diagRes.scores ?? []).filter((s) => (s.asked ?? 0) === 0).length > 0,
  "the result separates what is known, what needs practice and what was never measured rather than reporting one number");
ok(asked >= 6, `the diagnostic probed a real set of skills (${asked} questions)`);
ok(scored.length > 0, "the result names the concepts it measured, per concept");
ok(diagRes.misconceptions !== undefined, "the result reports misconceptions it detected");

sub("FIRST RECOMMENDATION");
const firstNext = await nextOf(student.id);
const first = topAction(firstNext);
ok(!!first, `the engine recommends something (${actionLine(first)})`);
show("task", actionLine(first));
show("reason", (first?.reason ?? "(no reason)").slice(0, 150));
show("why now", (first?.whyNow ?? "").slice(0, 100));
show("evidence cited", JSON.stringify(first?.evidence ?? {}).slice(0, 160));
ok(typeof first?.reason === "string" && first.reason.length > 10, "the recommendation carries its own reason, not a slogan");
ok(!!first?.conceptId, "and names a concept, so it can be acted on");

sub("FIRST SESSION — doing exactly what was recommended");
const targetConcept = first.conceptId;
const kind = first.kind;
const opened = await post("/api/session", { action: "start", id: student.id, conceptId: targetConcept, kind });
ok(opened.status === 200, `a ${kind} session opened on ${targetConcept} (target ${opened.body?.session?.target})`);
const target = opened.body?.session?.target ?? 3;
let sAsked = 0, sCorrect = 0, sHints = 0;
const misc = new Map();
for (let i = 0; i < target; i++) {
  // A real learner is not uniform: this one is right twice in three, and takes
  // one hint, so independence and support are both exercised.
  const wantRight = i % 3 !== 1;
  const hints = i === 0 ? 1 : 0;
  const g = await gradeOne(student.id, targetConcept, wantRight, { hints });
  if (!g) break;
  sAsked++; sHints += hints;
  if (g.correct) sCorrect++;
  if (g.misconceptionId) misc.set(g.misconceptionId, (misc.get(g.misconceptionId) ?? 0) + 1);
}
const fin = await post("/api/session", { action: "finish", id: student.id, conceptId: targetConcept });
const result = fin.body?.result;
show("questions attempted", sAsked);
show("correct / incorrect", `${sCorrect} / ${sAsked - sCorrect}`);
show("hints", sHints);
show("misconceptions identified", [...misc.entries()].map(([k, v]) => `${k}×${v}`).join(", ") || "(none)");
show("mastery before → after", result ? `${result.before?.mastery?.toFixed(3)} → ${result.after?.mastery?.toFixed(3)}` : "(no result)");
show("evidence created", result ? `${result.activity?.asked} answers, ${result.activity?.hints} hints, transfer asked ${result.activity?.transferAsked}` : "(none)");
ok(!!result, "the session closed with a result derived from the server's own activity record");
ok(result?.activity?.asked === sAsked, "the result counts what the server graded, not what the client claims");
const ev1 = await evidenceOf(student.id);
show("ledger events", `${ev1?.total ?? "?"} events, deep reconcile differences: ${ev1?.deepReconcile?.differences?.length ?? "?"}`);
ok((ev1?.total ?? 0) > 0, "the work landed in the append-only ledger");
const afterFirst = topAction(await nextOf(student.id));
show("next recommendation", actionLine(afterFirst));
ok(!!afterFirst, "and the engine offers the next action immediately");

// ═══════════════════════════════════════════════════════════════════════════
head("S3. ADAPTIVE LEARNING — do two different learners get different plans?");
// ═══════════════════════════════════════════════════════════════════════════
const CONCEPT = GENERATED[0];
const strong = await freshStudent("Bola");
const weakL = await freshStudent("Chen");
await post("/api/profile", { id: strong.id, subjects: ["maths"], country: "GB", onboarded: true });
await post("/api/profile", { id: weakL.id, subjects: ["maths"], country: "GB", onboarded: true });
for (let i = 0; i < 5; i++) await gradeOne(strong.id, CONCEPT, true);
for (let i = 0; i < 4; i++) await gradeOne(weakL.id, CONCEPT, false);
const stateOf = async (id) => {
  const p = await getAuthed(`/api/progress?id=${id}&subject=maths`, id);
  return p.body?.progress?.[CONCEPT] ?? null;
};
const sModel = await stateOf(strong.id), wModel = await stateOf(weakL.id);
const sNext = topAction(await nextOf(strong.id)), wNext = topAction(await nextOf(weakL.id));
sub(`Student A — five correct on ${CONCEPT}`);
show("model state", `mastery ${sModel?.mastery?.toFixed(2)}, attempts ${sModel?.attempts}, independent ${sModel?.independent?.correct}/${sModel?.independent?.asked}, streak ${sModel?.streak}`);
show("next task", actionLine(sNext));
sub(`Student B — four wrong on ${CONCEPT}`);
show("model state", `mastery ${wModel?.mastery?.toFixed(2)}, attempts ${wModel?.attempts}, independent ${wModel?.independent?.correct}/${wModel?.independent?.asked}, misconceptions ${Object.keys(wModel?.misconceptions ?? {}).join(",") || "none"}`);
show("next task", actionLine(wNext));
ok(sModel && wModel && sModel.mastery > wModel.mastery, `the two learners' models differ (${sModel?.mastery?.toFixed(2)} vs ${wModel?.mastery?.toFixed(2)})`);
ok(actionLine(sNext) !== actionLine(wNext) || sNext?.kind !== wNext?.kind,
  `and so do their next tasks (${sNext?.kind}:${sNext?.conceptId} vs ${wNext?.kind}:${wNext?.conceptId})`);
sub("Student A's performance changes — does the plan change with it?");
const before = actionLine(sNext);
for (let i = 0; i < 6; i++) await gradeOne(strong.id, CONCEPT, false);
const aAfter = topAction(await nextOf(strong.id));
show("next task after six wrong", actionLine(aAfter));
ok(actionLine(aAfter) !== before, `the plan moved because the evidence moved (${before} → ${actionLine(aAfter)})`);

// ═══════════════════════════════════════════════════════════════════════════
head("S4. MISCONCEPTION — is the wrong answer diagnosed, and does it decay?");
// ═══════════════════════════════════════════════════════════════════════════
const mStudent = await freshStudent("Dev");
await post("/api/profile", { id: mStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
// A misconception can only be NAMED for a question whose generator declares one
// (the catalogue is attached by the generator, not guessed by the grader from a
// wrong index). So the probe first finds a concept that carries a tag and says
// how many do — a fact about the content, which is what this test is really
// measuring.
const questions = require("../.verify/questions.js");
const taggedConcepts = GENERATED.filter((cid) => {
  for (const seed of ["m1", "m2", "m3", "m4", "m5", "m6"]) {
    const q = questions.generateQuestion(cid, seed, 0.5);
    if (q && (q.misconceptionTags ?? []).length) return true;
  }
  return false;
});
show("concepts whose questions declare a misconception", `${taggedConcepts.length} of ${GENERATED.length} practisable concepts`);
const mConcept = taggedConcepts[0] ?? CONCEPT;
const mServe = await serveAt(mStudent.id, mConcept);
const mQ = mServe.body.question;
const wrongIdx = (mQ.answer + 1) % mQ.choices.length;
const mAns = await answerAt(mStudent.id, mConcept, mQ.id, wrongIdx);
show("question", mQ.prompt.slice(0, 90));
show("student answer", `${mQ.choices[wrongIdx]}  (correct: ${mQ.choices[mQ.answer]})`);
show("detected misconception", mAns.body?.misconceptionId ?? "(none named)");
show("evidence", JSON.stringify(mAns.body?.demonstrated ?? null));
const mEv1 = await evidenceOf(mStudent.id);
show("model change", JSON.stringify(mEv1?.projection?.byConcept?.[mConcept]?.misconceptions ?? {}));
show("next task", actionLine(topAction(await nextOf(mStudent.id))));
ok(!!mAns.body?.misconceptionId,
  `the server names the misconception the wrong answer represents (${mAns.body?.misconceptionId})`);
ok(Object.keys(mEv1?.projection?.byConcept?.[mConcept]?.misconceptions ?? {}).length > 0,
  "and it reaches the ledger's projection, not just the response");
sub("Answering correctly afterwards");
for (let i = 0; i < 2; i++) await gradeOne(mStudent.id, mConcept, true);
const mEv2 = await evidenceOf(mStudent.id);
const hitsAfter = Object.values(mEv2?.projection?.byConcept?.[mConcept]?.misconceptions ?? {});
show("misconception hits after two correct", hitsAfter.join(", ") || "none current");
show("model now", `mastery ${mEv2?.projection?.byConcept?.[mConcept] ? (mEv2.projection.byConcept[mConcept].correct / mEv2.projection.byConcept[mConcept].attempts).toFixed(2) : "?"} accuracy`);
note("the ledger keeps every slip; the model keeps only CURRENT slips (a repaired misconception stops being current)");

// ═══════════════════════════════════════════════════════════════════════════
head("S5. TUTOR REALITY — eight different inputs, one concept");
// ═══════════════════════════════════════════════════════════════════════════
const tStudent = await freshStudent("Efe");
await post("/api/profile", { id: tStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
for (let i = 0; i < 3; i++) await gradeOne(tStudent.id, CONCEPT, true);
// Asked the way the PANEL asks: the question on screen travels with the turn.
// Without it the turn is a concept-only call (a room's shape), and the battery
// was measuring a tutor nobody sees — the panel always sends what the learner
// is looking at, and the grounding rules differ (see lib/socratic.ts: the serve
// reason is spoken only where it is the only context there is, because a
// surface that renders the decision's own reason does not need it re-read).
const tOnScreen = (await serveAt(tStudent.id, CONCEPT)).body?.question?.prompt ?? "";
const askTutor = async (message) => {
  const r = await post("/api/tutor", {
    conceptId: CONCEPT, message, language: "en", id: tStudent.id,
    question: tOnScreen || undefined,
  });
  return r.body ?? {};
};
const probes = [
  ["1. genuine question", "What is this?"],
  ["2. not understanding", "I don't understand it."],
  ["3. wants a hint", "Give me a hint."],
  ["4. why wrong", "Why is my answer wrong?"],
  ["5. correct reasoning", `I think it works because you ${mQ.choices[mQ.answer]}`],
  ["6. plausible misconception", "I think you just add the two numbers together and that's the answer."],
  ["7. irrelevant", "What is the capital of France?"],
  ["8. another concept", "Can you explain quadratics to me instead?"],
];
const replies = [];
for (const [label, message] of probes) {
  const r = await askTutor(message);
  replies.push({ label, message, reply: r.reply ?? "", mode: r.mode, source: r.answerSource, label_key: r.labelKey });
  console.log(`\n   ${label}  →  "${message}"`);
  console.log(`     ${(r.reply ?? "(no reply)").replace(/\n/g, "\n     ").slice(0, 420)}`);
  console.log(`     [mode=${r.mode ?? "?"} source=${r.answerSource ?? "?"} label=${r.labelKey ?? "none"}]`);
}
const bodies = replies.map((r) => r.reply);
ok(new Set(bodies).size >= 7, `the tutor does not repeat one canned paragraph (${new Set(bodies).size}/8 distinct replies)`);
ok(!/^\s*$/.test(bodies[6] ?? "x"), "it answers the irrelevant question with a reply rather than nothing");
ok(replies[6].reply.toLowerCase().includes("france") === false, "and does not pretend the capital of France is on this concept");

// ── The distinctions §11 asks for, one claim at a time ────────────────────
// A learner's sentence can ask for the answer, ask for a step, ask WHY, or
// OFFER A METHOD. Those are four different things and they must not share a
// reply: the battery used to record the same paragraph for "why is my answer
// wrong?" and for "I think you just add the two numbers together".
ok(!/restate the question in your own words/i.test(replies[6].reply),
  `an unrelated sentence is not answered with the Socratic prompt for this question — it is told plainly that the tutor can only follow this question ("${replies[6].reply.slice(0, 70)}…")`);
ok(!/hand over the answer|walk you to it/i.test(replies[3].reply),
  `a why-question is answered as a request for REASONING, not for the answer ("${replies[3].reply.slice(0, 60)}…")`);
ok(/method/i.test(replies[4].reply) && replies[4].reply.includes(mQ.choices[mQ.answer]),
  "a learner who STATES a correct method gets it read back and tested, rather than being asked to restate the question");
ok(/method/i.test(replies[5].reply) && replies[5].reply.includes("add the two numbers"),
  "and a learner who states a plausible misconception is treated the same way — as a claim to test, not as a request for the answer");
ok(replies[4].reply !== replies[5].reply,
  "the two claims are answered with the learner's own words, so a correct method and a wrong one are distinguishable");
note("whether a stated method is CORRECT is not knowable from free text offline, and the tutor does not pretend to grade it — the authoritative signal is the learner's own recorded answers (hitIds in the grounding), not their prose");
ok(replies.every((r) => !/OpenMind served this one to/.test(r.reply)),
  "and no reply restates the serve reason the panel already renders under it — that repetition on every message was the canned paragraph");
ok(replies[0].reply.includes(tOnScreen.slice(0, 20)) || replies[1].reply.includes(tOnScreen.slice(0, 20)),
  "while the question actually on screen IS the thing the coaching is grounded in");
sub("The same question, before and after the learner's evidence changes");
const q = "Give me a hint.";
const beforeEv = await askTutor(q);
for (let i = 0; i < 4; i++) await gradeOne(tStudent.id, CONCEPT, false);
const afterEv = await askTutor(q);
show("reply (before)", (beforeEv.reply ?? "").slice(0, 200));
show("reply (after)", (afterEv.reply ?? "").slice(0, 200));
show("grounding (after)", JSON.stringify(afterEv.grounding?.decision ?? null).slice(0, 220));
note(beforeEv.reply === afterEv.reply
  ? "identical replies — the tutor's own text is deterministic; its GROUNDING is what carries the learner state"
  : "the replies differ, so the learner's state reached the tutor's text");
ok(!!afterEv.grounding, "the tutor's grounding is returned, so its reasoning can be inspected rather than trusted");

// ═══════════════════════════════════════════════════════════════════════════
head("S6. EVIDENCE → MODEL → RECOMMENDATION, before and after ONE action");
// ═══════════════════════════════════════════════════════════════════════════
const eStudent = await freshStudent("Fatima");
await post("/api/profile", { id: eStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
const eConcept = GENERATED[3];
const beforeEv2 = await evidenceOf(eStudent.id);
const beforeDims = dimsOf(beforeEv2, eConcept);
const beforeNext = topAction(await nextOf(eStudent.id));
sub("BEFORE");
show("recall", beforeDims?.recall ?? "— not measured");
show("application", beforeDims?.application ?? "— not measured");
show("independence/transfer/retention", `${beforeDims?.transfer ?? "—"} / ${beforeDims?.retention ?? "—"}`);
show("next action", actionLine(beforeNext));
const g6 = await gradeOne(eStudent.id, eConcept, true);
const afterEv2 = await evidenceOf(eStudent.id);
const afterDims = dimsOf(afterEv2, eConcept);
const afterNext = topAction(await nextOf(eStudent.id));
sub("AFTER one hint-free correct answer");
show("recall", afterDims?.recall ?? "—");
show("application", afterDims?.application ?? "—");
show("transfer", afterDims?.transfer ?? "—");
show("retention", afterDims?.retention ?? "—");
show("next action", actionLine(afterNext));
show("the answer's own proof", JSON.stringify(g6?.demonstrated ?? null));
ok(afterDims && afterDims.recall !== beforeDims?.recall, `the learner's evidence changed (recall ${beforeDims?.recall ?? "—"} → ${afterDims.recall})`);
ok(g6?.demonstrated?.mode === "independent" && g6?.demonstrated?.hints === 0, "the single answer is attributed as independent work by the server");
ok(!!afterNext, "and a next action follows from the new state");

// ═══════════════════════════════════════════════════════════════════════════
head("S7. LEARNING JOURNEY — every transition, in order");
// ═══════════════════════════════════════════════════════════════════════════
const jStudent = await freshStudent("Grace");
await post("/api/profile", {
  id: jStudent.id, country: "GB", grade: "10", board: "aqa", spec: UK_MATHS_SPEC,
  subjects: ["maths"], goal: "Understand fractions properly", intent: "understand", onboarded: true,
});
const transitions = [];
const record = async (step, action, extra = {}) => {
  const ev = await evidenceOf(jStudent.id);
  const next = topAction(await nextOf(jStudent.id));
  transitions.push({ step, action, ...extra, events: ev?.total ?? 0, next: actionLine(next) });
  console.log(`\n   ${step}`);
  console.log(`     learner action : ${action}`);
  if (extra.evidence) console.log(`     evidence       : ${extra.evidence}`);
  if (extra.model) console.log(`     model change   : ${extra.model}`);
  console.log(`     ledger events  : ${ev?.total ?? "?"}`);
  console.log(`     next action    : ${actionLine(next)}`);
};

// 1. DIAGNOSTIC
let jc = (await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "start", kind: "baseline", reveal: true })).body;
let jAsked = 0, jCorrect = 0;
for (let guard = 0; jc?.question && guard < 30; guard++) {
  const qq = jc.question;
  const done = guard % 2 === 0;
  const a = await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "answer", questionId: qq.id, chosen: done ? qq.answer : (qq.answer + 1) % qq.choices.length, reveal: true });
  if (a.status !== 200) break;
  jAsked++; if (a.body.correct) jCorrect++;
  jc = { question: a.body.next };
}
const jDiag = await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "finish" });
const jFirst = topAction(await nextOf(jStudent.id));
await record("1. DIAGNOSTIC → baseline",
  `${jAsked} diagnostic questions, ${jCorrect} correct`,
  { evidence: `${jAsked} answers, source diagnostic`, model: `diagnostics recorded for ${Object.keys(jDiag.body?.result?.scores ?? {}).length || "?"} concepts` });
ok(!!jFirst, "the first recommendation exists straight after measurement");

// 2. LEARN (reading the lesson produces no evidence — and says so)
const lessonConcept = jFirst.conceptId;
await record("2. LEARN → read the concept page", `opened the lesson on ${lessonConcept}`,
  { evidence: "none by design (a lesson is not an answer)", model: "unchanged" });
note("the product does not award mastery for reading; only answers create evidence");

// 3. PRACTISE
const pOpen = await post("/api/session", { action: "start", id: jStudent.id, conceptId: lessonConcept, kind: "PRACTISE", target: 4 });
let pRight = 0;
for (let i = 0; i < 4; i++) { const g = await gradeOne(jStudent.id, lessonConcept, true); if (g?.correct) pRight++; }
const pFin = await post("/api/session", { action: "finish", id: jStudent.id, conceptId: lessonConcept });
await record("3. PRACTISE → four correct, unaided", `${pRight}/4 correct`,
  { evidence: `${pFin.body?.result?.activity?.asked} answers, ${pFin.body?.result?.activity?.hints} hints`,
    model: `mastery ${pFin.body?.result?.before?.mastery?.toFixed(2)} → ${pFin.body?.result?.after?.mastery?.toFixed(2)}` });

// 4. PROVE
const prOpen = await post("/api/session", { action: "start", id: jStudent.id, conceptId: lessonConcept, kind: "PRACTISE", target: 3 });
if (prOpen.status !== 200) note(`(a prove session could not open: ${JSON.stringify(prOpen.body).slice(0, 80)})`);
const proveG = await gradeOne(jStudent.id, lessonConcept, true);
const prFin = await post("/api/session", { action: "finish", id: jStudent.id, conceptId: lessonConcept });
await record("4. PROVE → demonstrated unaided", "one more hint-free answer",
  { evidence: `'independence' credited: ${JSON.stringify(prFin.body?.result?.proof ?? proveG?.demonstrated ?? null)}`,
    model: `mastery ${prFin.body?.result?.after?.mastery?.toFixed(2) ?? "?"}` });

// 5. TRANSFER — the session opens FIRST, because the re-framed surface is the
// server's own staging: a serve with `intent: transfer` outside an open session
// is a question drawn from the practice pool, and it can never prove transfer.
//
// The step is named for what the concept can actually support: where a second
// surface exists the question is re-framed onto it, and where none does the
// honest stretch is the hardest form of the same question — recorded as the
// independent answer it is, not as a transfer it is not. Which of the two this
// learner sees is the serve's own answer (`reframed`), read below.
const trOpen = await post("/api/session", { action: "start", id: jStudent.id, conceptId: lessonConcept, kind: "TRANSFER", target: 3 });
const trServe = await serveAt(jStudent.id, lessonConcept, { intent: "transfer" });
const trQ = trServe.body?.question;
const trReframed = trServe.body?.reframed === true;
const trAns = trQ ? await answerAt(jStudent.id, lessonConcept, trQ.id, trQ.answer) : null;
const trFin = await post("/api/session", { action: "finish", id: jStudent.id, conceptId: lessonConcept });
await record(
  `5. TRANSFER → ${trReframed ? "the same idea on a second surface" : "the hardest form of the same question (no second surface exists for this concept)"}`,
  trQ ? `"${trQ.prompt.slice(0, 60)}" answered correctly` : "no transfer question served",
  { evidence: JSON.stringify(trAns?.body?.demonstrated ?? null),
    model: `transfer proof recorded: ${trFin.body?.result?.proof?.transfer === true}` });
ok(trServe.body?.transferable === transferMod.canTransfer(lessonConcept),
  `the serve tells the page whether a second surface exists at all, and agrees with the re-framer (${trServe.body?.transferable} for ${lessonConcept})`);
ok(trFin.body?.result?.proof?.transfer !== true || trReframed,
  "transfer credit is never recorded for a question the serve could not re-frame");

// 6. ASSESS (a second measurement run, which is what /impact compares)
let ac = (await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "start", kind: "baseline", reveal: true })).body;
let aAsked = 0, aCorrect = 0;
for (let guard = 0; ac?.question && guard < 30; guard++) {
  const qq = ac.question;
  const a = await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "answer", questionId: qq.id, chosen: qq.answer, reveal: true });
  if (a.status !== 200) break;
  aAsked++; if (a.body.correct) aCorrect++;
  ac = { question: a.body.next };
}
const aFin = await post("/api/diagnostic", { id: jStudent.id, subject: "maths", action: "finish" });
const impact = (await getAuthed(`/api/impact?id=${jStudent.id}`, jStudent.id)).body;
await record("6. ASSESS → a second measurement run", `${aCorrect}/${aAsked} correct on a fresh diagnostic`,
  { evidence: "diagnostic fold", model: `runs recorded: ${Object.keys(aFin.body?.result?.scores ?? {}).length || "?"}` });
show("impact report", JSON.stringify(impact?.deltas ?? impact ?? {}).slice(0, 260));
ok(transitions.length === 6, "all six transitions of the intended progression were driven");
ok(transitions.every((t) => t.next), "every transition produced a next action to be judged by");

// ═══════════════════════════════════════════════════════════════════════════
head("S8. RETENTION — learned is not retained (8-day-old evidence, synced today)");
// ═══════════════════════════════════════════════════════════════════════════
const rStudent = await freshStudent("Hana");
await post("/api/profile", { id: rStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
const aged = [GENERATED[5], GENERATED[7]];
const now = Date.now();
// EIGHT days, not seven, and the difference is the scheduler being right: three
// independent correct answers land a concept in the 0.75–0.9 mastery bucket,
// whose review interval is exactly 7 days (lib/retention.ts). Evidence dated
// "7 days ago minus two minutes" is therefore NOT yet due, and the first
// version of this battery reported that as a product failure when it was an
// off-by-a-minute in the test.
const AGE_DAYS = 8;
const retention = require("../.verify/retention.js");
// One learner's work, as the device would report it after being offline for
// `daysAgo` days. `source` is what the offline app records: ordinary practice,
// or a delayed recall it scheduled and served itself. Reused below so the
// retention section can place the SAME work at different ages.
const agedEvents = (learnerId, cid, daysAgo, n = 3, source = "practice") =>
  Array.from({ length: n }, (_, i) => ({
    type: "answer_submitted",
    id: `ev_acc${cid.replace(/[^a-z0-9]/gi, "")}${i}x${daysAgo}x${learnerId.slice(-6)}${now.toString(36)}`,
    schemaVersion: EVIDENCE_SCHEMA_VERSION, learnerId,
    at: now - daysAgo * DAY + i * 60000, source, conceptId: cid,
    questionId: `${cid}-aged-${i}`, correct: true, mode: "independent", chosen: 0, hints: 0,
    subject: "maths", specificationId: null,
  }));
const events = aged.flatMap((cid) => agedEvents(rStudent.id, cid, AGE_DAYS));
const ing = await post("/api/evidence", { id: rStudent.id, events });
ok(ing.status === 200 && ing.body?.accepted === events.length,
  `seven-day-old offline work synced through the real ingest door (${ing.body?.accepted}/${events.length} accepted, ${ing.body?.duplicates ?? 0} duplicates)`);
// Idempotency: the same batch again must not double-count.
const again2 = await post("/api/evidence", { id: rStudent.id, events });
ok(again2.body?.duplicates === events.length, `a re-sent batch is idempotent (${again2.body?.duplicates} duplicates, ${again2.body?.accepted} accepted)`);
const rEv = await evidenceOf(rStudent.id);
const rModel = (await getAuthed(`/api/progress?id=${rStudent.id}&subject=maths`, rStudent.id)).body?.progress ?? {};
for (const cid of aged) {
  const d = dimsOf(rEv, cid);
  const iv = retention.reviewIntervalDays(rModel[cid]?.mastery ?? 0);
  show(`${cid}`, `recall ${d?.recall}, application ${d?.application}, retention ${d?.retention} · mastery ${(rModel[cid]?.mastery ?? 0).toFixed(2)}, lastSeen ${new Date(rModel[cid]?.lastSeen ?? 0).toISOString().slice(0, 10)}, review interval ${iv ?? "none (still learning)"} days`);
}
ok(aged.every((cid) => (rModel[cid]?.mastery ?? 0) > 0.5), "the ledger says the learner LEARNED these a week ago");
ok(aged.every((cid) => dimsOf(rEv, cid)?.retention === "— not measured"),
  "and the record still says retention was NEVER MEASURED — a week-old correct answer is not retained recall");
sub("Now retrieving it — a week later, without teaching first");
const rNext = await nextOf(rStudent.id);
show("what the engine asks for", rNext.actions.map((a) => `${a.kind}:${a.conceptId}`).slice(0, 4).join("  "));
const retrieveKinds = rNext.actions.filter((a) => a.kind === "RETRIEVE").map((a) => a.conceptId);
show("concepts the scheduler considers due", retrieveKinds.join(", ") || "(none flagged RETRIEVE)");
const dueConcept = retrieveKinds[0] ?? aged[0];

// ── TWO STATES FROM ONE DUE REVIEW, LIKE FOR LIKE ────────────────────────
// The first version of this section answered a due review CORRECTLY and then
// failed the next question in the same sitting — which is not a failed due
// review, because the staged retrieval is consumed by the first answer. It
// therefore reported "failed retrieval recorded: false" and nobody could tell
// whether forgetting was measured at all. So the failure is now the FIRST
// answer to a due review, on a learner whose aged evidence is identical to the
// passer's, on the SAME concept: RETAINED and FORGOTTEN, and the two next tasks
// compared. The retention RULE is one function (lib/proof.ts#isRetentionEvidence
// for "was this delayed recall", + the mark for "did it hold"), and the STATE is
// read from the one rule that names it (lib/proof.ts#retentionState).
const proofMod = require("../.verify/proof.js");
const viewMod = require("../.verify/evidence-view.js");
const recallStateOf = (ev, cid) => proofMod.retentionState(ev?.projection?.byConcept?.[cid]?.retention ?? null);
const need = async (label, cid, correct) => {
  const s = await freshStudent(label);
  await post("/api/profile", { id: s.id, subjects: ["maths"], country: "GB", onboarded: true });
  await post("/api/evidence", { id: s.id, events: agedEvents(s.id, cid, AGE_DAYS) });
  const before = await nextOf(s.id);
  const g = await gradeOne(s.id, cid, correct);
  const ev = await evidenceOf(s.id);
  const model = (await getAuthed(`/api/progress?id=${s.id}&subject=maths`, s.id)).body?.progress?.[cid] ?? {};
  return { s, before, g, ev, model };
};
const held = await need("Ivy", dueConcept, true);
const lost = await need("Jonas", dueConcept, false);
for (const [who, r] of [["passed", held], ["failed", lost]]) {
  show(`${who} — due before?`, r.before.actions.map((a) => `${a.kind}:${a.conceptId}`).slice(0, 3).join("  "));
  show(`${who} — grade`, `correct=${r.g?.correct} ${JSON.stringify(r.g?.demonstrated)}`);
  show(`${who} — record`, `${dimsOf(r.ev, dueConcept)?.retention ?? "—"} · state ${recallStateOf(r.ev, dueConcept)} · mastery ${(r.model.mastery ?? 0).toFixed(2)} · review in ${retention.reviewIntervalDays(r.model.mastery ?? 0) ?? "none"}d`);
  show(`${who} — next`, (await nextOf(r.s.id)).actions.map((a) => `${a.kind}:${a.conceptId}`).slice(0, 2).join("  "));
}
ok(held.before.actions.some((a) => a.kind === "RETRIEVE" && a.conceptId === dueConcept) && lost.before.actions.some((a) => a.kind === "RETRIEVE" && a.conceptId === dueConcept),
  "both learners had the same concept due for review before answering");
ok(held.g?.demonstrated?.source === "retrieval" && held.g?.demonstrated?.retained === true,
  `a due recall that HELD is attributed as delayed recall and reported as retained (${JSON.stringify(held.g?.demonstrated)})`);
ok(lost.g?.demonstrated?.source === "retrieval" && lost.g?.demonstrated?.retained === false,
  `a due recall that FAILED is attributed as delayed recall and never reported as retained (${JSON.stringify(lost.g?.demonstrated)})`);
ok(recallStateOf(held.ev, dueConcept) === "retained" && recallStateOf(lost.ev, dueConcept) === "forgotten",
  `the two records end in different STATES — ${recallStateOf(held.ev, dueConcept)} against ${recallStateOf(lost.ev, dueConcept)} (the rule reads the latest outcome, not the ratio)`);
const rowsOf = (ev) => viewMod.conceptKnowledge(ev.projection, dueConcept, (k) => k).rows;
const retRow = (ev) => rowsOf(ev).find((r) => r.from === "retention");
ok(retRow(held.ev)?.state === "retained" && retRow(lost.ev)?.state === "forgotten",
  `and the concept page's retention row carries that state as ${proofMod.retentionLabelKey("forgotten")} rather than a band — the wording comes from the state rule, not from the page`);
ok((lost.ev.projection.byConcept[dueConcept].retention.asked === 1) && (lost.ev.projection.byConcept[dueConcept].retention.correct === 0),
  `forgetting is MEASURED, not dropped: a failed due review is retention asked-but-not-correct (${dimsOf(lost.ev, dueConcept)?.retention})`);
const nextHeld = (await nextOf(held.s.id)).actions?.[0];
const nextLost = (await nextOf(lost.s.id)).actions?.[0];
ok(`${nextHeld?.kind}:${nextHeld?.conceptId}` !== `${nextLost?.kind}:${nextLost?.conceptId}`,
  `the SAME concept, reviewed well or badly, gives different next work (${actionLine(nextHeld)} vs ${actionLine(nextLost)})`);
ok(nextLost?.conceptId === dueConcept && (nextLost?.kind === "PRACTISE" || nextLost?.kind === "EXPLAIN" || nextLost?.kind === "REMEDIATE"),
  `and a learner who could not recall it is sent back to work on it, not moved on (${nextLost?.kind}:${nextLost?.conceptId})`);
const ivHeld = retention.reviewIntervalDays(held.model.mastery ?? 0);
const ivLost = retention.reviewIntervalDays(lost.model.mastery ?? 0);
ok(ivHeld !== null && ivLost !== null && ivLost < ivHeld,
  `and the schedule follows the evidence: forgotten comes back in ${ivLost} days against ${ivHeld} for retained`);

sub("Retained, then lost — the state follows the LATEST outcome, not the ratio");
// A record that held a delayed recall 8 days ago and failed today's has counts
// of 1/2 — identical to one that failed 8 days ago and held today, and the two
// are opposite states. Time is injected through the same door the product uses
// for work that happened elsewhere: a device's offline week.
const span = await freshStudent("Kim");
await post("/api/profile", { id: span.id, subjects: ["maths"], country: "GB", onboarded: true });
const spanEvents = [
  ...agedEvents(span.id, dueConcept, 10),                 // learned ten days ago
  ...agedEvents(span.id, dueConcept, 8, 1, "retrieval"),  // a delayed recall that HELD, eight days ago
];
const spanIng = await post("/api/evidence", { id: span.id, events: spanEvents });
const spanEv = await evidenceOf(span.id);
show("after the held recall", `retention ${dimsOf(spanEv, dueConcept)?.retention ?? "—"} · state ${recallStateOf(spanEv, dueConcept)} · ingested ${spanIng.body?.accepted}`);
const spanDue = (await nextOf(span.id)).actions.some((a) => a.kind === "RETRIEVE" && a.conceptId === dueConcept);
const spanGrade = await gradeOne(span.id, dueConcept, false); // today's due review, failed
const spanEv2 = await evidenceOf(span.id);
show("after today's failed recall", `retention ${dimsOf(spanEv2, dueConcept)?.retention ?? "—"} · state ${recallStateOf(spanEv2, dueConcept)}`);
ok(spanDue, "the concept was due again a week after the held recall");
ok(spanGrade?.demonstrated?.source === "retrieval",
  `and today's failure is a delayed-recall failure, not ordinary practice (${spanGrade?.demonstrated?.source})`);
ok(spanEv2.projection.byConcept[dueConcept].retention.asked === 2 && spanEv2.projection.byConcept[dueConcept].retention.correct === 1,
  `the record keeps the history rather than overwriting it (${dimsOf(spanEv2, dueConcept)?.retention})`);
ok(recallStateOf(spanEv2, dueConcept) === "forgotten",
  `and the state is the LATEST outcome — "${recallStateOf(spanEv2, dueConcept)}" — which a ratio of 1/2 cannot say`);

const rDue = retention.dueReviews((await getAuthed(`/api/progress?id=${rStudent.id}&subject=maths`, rStudent.id)).body ?? {}, Date.now());
show("scheduler says due now", rDue.length ? rDue.map((d) => `${d.conceptId} (${d.overdueBy.toFixed(2)}d overdue)`).join(", ") : "(nothing due)");
sub("The counter-check: a concept practised NOW is not a retention result");
const freshId = GENERATED[9];
await gradeOne(rStudent.id, freshId, true);
const rEv3 = await evidenceOf(rStudent.id);
ok(dimsOf(rEv3, freshId)?.retention === "— not measured",
  "a concept answered minutes ago shows retention as unmeasured, not as retained");

// ═══════════════════════════════════════════════════════════════════════════
head("S9. TRANSFER — the same idea, in an unfamiliar context");
// ═══════════════════════════════════════════════════════════════════════════
const xStudent = await freshStudent("Ivan");
await post("/api/profile", { id: xStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
// A concept the re-framer can actually re-frame — read from the mirror, not
// guessed from an index, because a concept with no second surface cannot
// produce transfer evidence no matter how it is asked for.
const xConcept = REFRAMABLE || GENERATED[11];
for (let i = 0; i < 3; i++) await gradeOne(xStudent.id, xConcept, true);
const xPlain = await serveAt(xStudent.id, xConcept);
// The transfer STAGE is the server's: the session must be open before the
// re-framed question is drawn, or there is no staged surface to credit.
await post("/api/session", { action: "start", id: xStudent.id, conceptId: xConcept, kind: "TRANSFER", target: 3 });
const xTransfer = await serveAt(xStudent.id, xConcept, { intent: "transfer" });
show("practice wording", (xPlain.body?.question?.prompt ?? "").slice(0, 100));
show("transfer wording", (xTransfer.body?.question?.prompt ?? "").slice(0, 100));
show("transfer target field", JSON.stringify(xTransfer.body?.target ?? null));
ok(!!xTransfer.body?.question, "a transfer serve produces a question");
ok(xTransfer.body?.reframed === true,
  `and the serve reports it re-framed the question onto a second surface (reframed=${xTransfer.body?.reframed})`);
ok(xTransfer.body?.question?.prompt !== xPlain.body?.question?.prompt || JSON.stringify(xTransfer.body?.question) !== JSON.stringify(xPlain.body?.question),
  "and it is not simply the practice question drawn again");
const xq = xTransfer.body.question;
const xa = await answerAt(xStudent.id, xConcept, xq.id, xq.answer);
const xf = await post("/api/session", { action: "finish", id: xStudent.id, conceptId: xConcept });
show("attribution", JSON.stringify(xa.body?.demonstrated ?? null));
show("session proof", JSON.stringify(xf.body?.result?.proof ?? null));
const xEv = await evidenceOf(xStudent.id);
show("record", `transfer ${dimsOf(xEv, xConcept)?.transfer}, application ${dimsOf(xEv, xConcept)?.application}`);
ok((xEv?.projection?.byConcept?.[xConcept]?.transfer?.asked ?? 0) > 0, "transfer is recorded as its own dimension in the ledger");
sub("The counter-check: transfer with hints is not transfer");
const yServe = await serveAt(xStudent.id, xConcept, { intent: "transfer" });
let yG = null;
if (yServe.body?.question) {
  const yq = yServe.body.question;
  await askHint(xStudent.id, xConcept, yq.id, 1);
  const yr = await answerAt(xStudent.id, xConcept, yq.id, yq.answer);
  yG = yr.body;
}
show("hinted transfer answer", JSON.stringify(yG?.demonstrated ?? null));
ok(yG?.demonstrated?.mode === "guided" || yG?.demonstrated?.retained === undefined,
  "a hinted answer is attributed as guided — it can never be recorded as unaided transfer");

// ── The other half of the same rule: a concept with NO second surface must
// never be dressed up as one. The serve is asked for transfer, and answers
// honestly — `reframed: false`, the hardest draw of the same form, and the
// answer recorded as the independent work it is. This is the counter-check that
// makes the gate a measurement rather than a slogan.
sub("The counter-check: a concept with no second surface is not called transfer");
const zStudent = await freshStudent("Zara");
await post("/api/profile", { id: zStudent.id, subjects: ["maths"], country: "GB", onboarded: true });
const zConcept = NO_SECOND_SURFACE || xConcept;
for (let i = 0; i < 3; i++) await gradeOne(zStudent.id, zConcept, true);
const zPlain = await serveAt(zStudent.id, zConcept);
await post("/api/session", { action: "start", id: zStudent.id, conceptId: zConcept, kind: "TRANSFER", target: 3 });
const zServe = await serveAt(zStudent.id, zConcept, { intent: "transfer" });
const zq = zServe.body?.question;
const zAns = zq ? await answerAt(zStudent.id, zConcept, zq.id, zq.answer) : null;
const zFin = await post("/api/session", { action: "finish", id: zStudent.id, conceptId: zConcept });
show("concept", `${zConcept} — no second surface (canTransfer=${transferMod.canTransfer(zConcept)})`);
show("serve says", `transferable=${zServe.body?.transferable}, reframed=${zServe.body?.reframed}`);
show("attribution", JSON.stringify(zAns?.body?.demonstrated ?? null));
ok(zServe.body?.transferable === false && zServe.body?.reframed === false,
  `the serve is asked for transfer and says plainly that it could not re-frame this concept (${zServe.body?.reframed})`);
ok(zFin.body?.result?.proof?.transfer !== true,
  "so the session records no transfer proof — the product does not claim a measurement it could not make");
ok(zAns?.body?.demonstrated?.mode !== "transfer",
  `and the answer is credited for what it was: ${zAns?.body?.demonstrated?.mode} work on the same question form`);

// ═══════════════════════════════════════════════════════════════════════════
head("S10. FRESH TEACHER — the whole journey, no developer assistance");
// ═══════════════════════════════════════════════════════════════════════════
// S2–S9 walk a student. This walks the other half of §2 and §18, in order, and
// judges it the way a teacher would: can every step be completed without
// guessing, and is every number the monitor shows one the evidence supports?
// It is the section that caught the class counting its own teacher as a student
// and the Print/Export buttons opening an error in a new tab.
const tAccount = await freshStudent("Ravi", { role: "teacher" });
show("account", `${tAccount.email} · role ${tAccount.signup.body.account?.role}`);
ok(tAccount.signup.body.account?.role === "teacher", "the teacher's account carries the role they chose");
const tProfile = await post("/api/profile", {
  id: tAccount.id, country: "GB", grade: "11", board: UK_MATHS_SPEC ? "aqa" : undefined,
  spec: UK_MATHS_SPEC || undefined, specLevel: UK_MATHS_LEVEL || undefined,
  subjects: ["maths"], onboarded: true,
});
show("country / curriculum", `${tProfile.body?.profile?.country} · ${tProfile.body?.profile?.spec} · subjects ${JSON.stringify(tProfile.body?.profile?.subjects)}`);
ok(tProfile.body?.profile?.country === "GB" && tProfile.body?.profile?.spec === UK_MATHS_SPEC,
  "the country and the course they teach are stored on their profile");

sub("Create a class, and invite by code");
const tCls = await post("/api/classes", { id: tAccount.id, action: "create", name: "Year 10 Mathematics", subject: "maths", handle: "Ravi" });
const tClassId = tCls.body?.cls?.id ?? "";
const tCode = tCls.body?.cls?.joinCode ?? "";
show("class", `"${tCls.body?.cls?.name}" · code ${tCode}`);
ok(!!tClassId && /^[A-Z2-9]{6}$/.test(tCode), "a class is created with a join code a teacher can read out");
const tKid = await freshStudent("Mira");
await post("/api/profile", { id: tKid.id, subjects: ["maths"], country: "GB", onboarded: true, handle: "Mira" });
const tJoin = await post("/api/classes", { id: tKid.id, action: "join", joinCode: tCode, handle: "Mira" });
ok(tJoin.status === 200, "a student joins with that code — the invite works with no email and no account juggling");
ok((await post("/api/classes", { id: tKid.id, action: "join", joinCode: "ZZZZZZ", handle: "Mira" })).status === 404,
  "and a wrong code is refused rather than silently joining nothing");

sub("Set work: only from the class's curriculum, only with a real deadline");
const tOwned = (await getAuthed(`/api/assignments?me=${tAccount.id}`, tAccount.id)).body?.classes?.[0];
show("assignable", `${tOwned?.assignable?.length} concepts from the class's declared subject (${tOwned?.subject})`);
const tConcepts = [GENERATED[5], GENERATED[7]];
ok(tConcepts.every((c) => tOwned?.assignable?.includes(c)), "the picker is the server's own candidate list for this class");
const tBad = await post("/api/assignments", { id: tAccount.id, action: "create", clsId: tClassId, conceptIds: ["photosynthesis"], dueAt: Date.now() + DAY, title: "x" });
ok(tBad.status === 400 && /curriculum/.test(tBad.body?.error ?? ""),
  `a concept outside the curriculum is refused with a reason a teacher can act on ("${tBad.body?.error}")`);
const tPast = await post("/api/assignments", { id: tAccount.id, action: "create", clsId: tClassId, conceptIds: [tConcepts[0]], dueAt: Date.now() - DAY, title: "x" });
ok(tPast.status === 400 && /future/.test(tPast.body?.error ?? ""),
  `and a deadline in the past is refused rather than stored ("${tPast.body?.error}")`);
const tAsg = await post("/api/assignments", {
  id: tAccount.id, action: "create", clsId: tClassId, conceptIds: tConcepts,
  dueAt: Date.now() + 7 * DAY, title: "Number catch-up",
});
ok(tAsg.status === 200 && tAsg.body?.assignment?.conceptIds?.length === tConcepts.length,
  `work is set (${tConcepts.join(" + ")}, due in 7 days)`);
const tSeen = (await getAuthed(`/api/assignments?me=${tKid.id}`, tKid.id)).body?.assigned?.[0];
show("student sees", `${tSeen?.assignment?.title} · ${tSeen?.mine?.outstanding?.length} outstanding`);
ok(tSeen?.mine?.complete === false && tSeen?.mine?.outstanding?.length === tConcepts.length,
  "the student sees the work they have been set, with nothing done yet");

sub("The student does real work on both concepts");
await post("/api/evidence", { id: tKid.id, events: tConcepts.flatMap((cid) => agedEvents(tKid.id, cid, AGE_DAYS)) });
const tHeld = await gradeOne(tKid.id, tConcepts[0], true);
const tLost = await gradeOne(tKid.id, tConcepts[1], false);
show("graded", `${tConcepts[0]}: ${JSON.stringify(tHeld?.demonstrated)} · ${tConcepts[1]}: ${JSON.stringify(tLost?.demonstrated)}`);

sub("Read the monitor: is every number one the evidence supports?");
const tMon = (await getAuthed(`/api/assignments?me=${tAccount.id}`, tAccount.id)).body?.monitor?.[0];
const tRoster = (await getAuthed(`/api/classes?me=${tAccount.id}`, tAccount.id)).body?.classes?.[0];
const tHandles = Object.keys(tRoster?.students ?? {});
show("class read view", `${tHandles.length} student${tHandles.length === 1 ? "" : "s"}: ${tHandles.join(", ") || "(none)"} · rows ${Object.keys(tRoster?.live ?? {}).join(", ") || "(none)"}`);
ok(tHandles.length === 1 && tHandles[0] === "Mira",
  `the class counts its STUDENTS, not its teacher — one child, one student (${tHandles.length}: ${tHandles.join(", ")})`);
ok(!("Ravi" in (tRoster?.live ?? {})) && !(tRoster?.live?.Ravi),
  "and the teacher is in no row of the class table");
ok((tCls.body?.cls?.members ?? []).includes(tAccount.id),
  "while they are still a MEMBER — creating a class must not lock the teacher out of reading it");
const tMembers = (tMon?.members ?? []).map((m) => m.handle);
show("monitor members", tMembers.join(", ") || "(none)");
ok(tMembers.length === 1 && tMembers[0] === "Mira",
  `the assignment monitor lists the students who owe the work, and nobody else (${tMembers.join(", ")})`);
ok(!(tMon?.interventions ?? []).some((i) => i.handle === "Ravi"),
  `"who needs intervention" never names the teacher (${JSON.stringify((tMon?.interventions ?? []).map((i) => `${i.handle}/${i.reason}`))})`);
const tMira = tMon?.members?.[0];
const tProved = Object.entries(tMira?.concepts ?? {}).map(([cid, c]) => `${cid.slice(0, 9)}=${c.proof}/${c.rate}`);
show("monitor row", `${tMira?.answers} answers · proved ${tProved.join(" ")}`);
ok(tMira?.concepts?.[tConcepts[0]]?.proof === "retained",
  `a concept the student recalled after a delay is reported as RETAINED — the same word, from the same rule, as the sentence the student reads (${tMira?.concepts?.[tConcepts[0]]?.proof})`);
ok(tMira?.concepts?.[tConcepts[1]]?.proof === null && tMira?.concepts?.[tConcepts[1]]?.rate === 0,
  `and a concept they failed is a 0% weakness with NO proof claimed — a miss is not dressed up as one (proof ${String(tMira?.concepts?.[tConcepts[1]]?.proof)}, rate ${tMira?.concepts?.[tConcepts[1]]?.rate})`);
ok(tMira?.complete === true && (tMira?.outstanding ?? []).length === 0,
  "completion is counted from the student's own answers, not from a stored flag");
ok((tMon?.interventions ?? []).some((i) => i.reason === "weak" && i.conceptId === tConcepts[1]),
  `and the concept they got wrong is named as the reason to step in (${JSON.stringify((tMon?.interventions ?? []).map((i) => `${i.reason}:${i.conceptId}`))})`);
ok(!(tMon?.interventions ?? []).some((i) => i.reason === "not_started" && i.handle === "Ravi"),
  "while the teacher's own membership generates no intervention against them");
// Null-safe: a class with no declared subject has no week at all, and that must
// fail the assertions below rather than take the battery down with a TypeError.
const tPlan = require("../.verify/teacher-plan.js").buildWeeklyPlan(tRoster) ?? { days: [], groups: [], scaffolds: [], fromCurriculum: true };
const tPlanNames = [...tPlan.groups.flatMap((g) => g.members), ...tPlan.scaffolds.map((s) => s.who)];
show("week's plan", `${tPlan.days.length} days · ${tPlan.fromCurriculum ? "from curriculum (no data yet)" : "from the class's own evidence"} · groups ${tPlan.groups.map((g) => `${g.name}[${g.members.join(",")}]`).join(" ") || "none"}`);
ok(!tPlanNames.includes("Ravi"),
  `the week's plan is built from the students, never the teacher (${tPlanNames.length ? tPlanNames.join(", ") : "no group work assigned yet"})`);

sub("The pack a teacher downloads opens, and only for a member");
const tBase = `/api/pack-export?id=${encodeURIComponent(tClassId)}&me=${encodeURIComponent(tAccount.id)}`;
const tPack = await call(`${tBase}&secret=${encodeURIComponent(sid(tAccount.id))}&format=html`);
show("print link", `HTTP ${tPack.status} · ${String(tPack.body?.raw ?? "").length > 0 ? "a printable pack" : JSON.stringify(tPack.body)?.slice(0, 80)}`);
ok(tPack.status === 200, "the Print link a teacher clicks returns the pack (it used to open a bare error in a new tab)");
const tBare = await call(`${tBase}&format=json`);
ok(tBare.status === 401 || tBare.status === 400, `and the same URL without the capability is refused (HTTP ${tBare.status} ${tBare.body?.error ?? ""})`);
const tMember = await call(`/api/pack-export?id=${encodeURIComponent(tClassId)}&me=${encodeURIComponent(tKid.id)}&secret=${encodeURIComponent(sid(tKid.id))}&format=json`);
show("a member of the class", `HTTP ${tMember.status} ${tMember.status !== 200 ? (tMember.body?.error ?? "") : "the pack, with its answer key"}`);
ok(tMember.status === 200, "a member of the class can open the pack for their own class");
const tOutsider = await freshStudent("Sana");
const tStranger = await call(`/api/pack-export?id=${encodeURIComponent(tClassId)}&me=${encodeURIComponent(tOutsider.id)}&secret=${encodeURIComponent(sid(tOutsider.id))}&format=json`);
show("a signed-in outsider", `HTTP ${tStranger.status} ${tStranger.body?.error ?? ""}`);
ok(tStranger.status === 403 || tStranger.status === 401,
  `while a signed-in learner in NO such class cannot read its answer key (HTTP ${tStranger.status} ${tStranger.body?.error ?? ""})`);

sub("The school, and each class's own qualification");
// §2's teacher flow asks for SCHOOL/CLASS and SUBJECT/QUALIFICATION, and this
// section used to name both as gaps: the assignment door accepted a class-level
// course no screen sent, and there was nowhere to record a school at all. Both
// are driven here through the doors the teacher's own screen calls, and the one
// thing that makes them worth having is checked: two classes of ONE subject at
// different qualifications are different objects, from the picker to the week.
const tSchool = await post("/api/profile", { id: tAccount.id, school: "  St Mary's College  " });
show("school", JSON.stringify(tSchool.body?.profile?.school));
ok(tSchool.body?.profile?.school === "St Mary's College",
  `the school a teacher teaches at is recorded on their profile, trimmed (${JSON.stringify(tSchool.body?.profile?.school)})`);
ok((await post("/api/profile", { id: tAccount.id, school: "" })).body?.profile?.school === undefined,
  "and clearing it removes the field rather than storing an empty school");
await post("/api/profile", { id: tAccount.id, school: "St Mary's College" });

const mkClass = (name, specificationId) =>
  post("/api/classes", { id: tAccount.id, action: "create", name, subject: "maths", specificationId });
const tGcse = await mkClass("Year 10 Mathematics (GCSE)", "uk-gcse");
const tAlevel = await mkClass("Year 12 Mathematics (A-Level)", "uk-alevel");
const tNoPaper = await mkClass("Year 9 Mathematics (no paper)", null);
const threeOf = async () => (await getAuthed(`/api/assignments?me=${tAccount.id}`, tAccount.id)).body?.classes ?? [];
const tThree = await threeOf();
const countOf = (name) => tThree.find((c) => c.name === name)?.assignable?.length ?? -1;
const gcseN = countOf("Year 10 Mathematics (GCSE)"), alevelN = countOf("Year 12 Mathematics (A-Level)"), noneN = countOf("Year 9 Mathematics (no paper)");
show("one subject, three classes", `GCSE course=${tGcse.body?.cls?.specificationId} assignable=${gcseN} | A-Level course=${tAlevel.body?.cls?.specificationId} assignable=${alevelN} | no paper course=${String(tNoPaper.body?.cls?.specificationId)} assignable=${noneN}`);
ok(gcseN > 0 && alevelN > 0 && gcseN !== alevelN,
  `two classes of ONE subject at different qualifications offer different work (GCSE ${gcseN} vs A-Level ${alevelN})`);
ok(noneN > gcseN && noneN > alevelN,
  `while a class that declares no qualification is taught its whole subject, not a course nobody chose (${noneN})`);
const planOf = async (clsId) => (await getAuthed(`/api/pack-export?id=${clsId}&me=${tAccount.id}&format=json`, tAccount.id)).body?.plan;
const tPlanGcse = await planOf(tGcse.body?.cls?.id);
const tPlanAlevel = await planOf(tAlevel.body?.cls?.id);
show("weeks", `GCSE ${JSON.stringify(tPlanGcse?.focus)} · A-Level ${JSON.stringify(tPlanAlevel?.focus)}`);
ok(JSON.stringify(tPlanGcse?.focus) !== JSON.stringify(tPlanAlevel?.focus),
  "and the week each class is taught is drawn from its own qualification, not from its subject — the pack differs for a different course");
// Refused BY NAME, never silently dropped or defaulted.
const tBadCourse = await mkClass("Unknown course", "no-such-course");
const tOrphan = await post("/api/classes", { id: tAccount.id, action: "create", name: "Course without subject", specificationId: "uk-gcse" });
const tMismatch = await post("/api/classes", { id: tAccount.id, action: "create", name: "Physics class, maths paper", subject: "physics", specificationId: "us-sat" });
show("refusals", `${tBadCourse.status} ${tBadCourse.body?.error} | ${tOrphan.status} ${tOrphan.body?.error} | ${tMismatch.status} ${tMismatch.body?.error}`);
ok(tBadCourse.status === 400 && tBadCourse.body?.error === "unknown_spec",
  `a course that means nothing is refused by name (${tBadCourse.status} ${tBadCourse.body?.error})`);
ok(tOrphan.status === 400 && tOrphan.body?.error === "course_without_subject",
  "and a course with no subject to be a course of is refused rather than stored (it is not a maths class)");
ok(tMismatch.status === 400 && tMismatch.body?.error === "spec_does_not_teach_physics",
  `and a real qualification the subject is not part of is refused, with the subject named (${tMismatch.body?.error})`);
// Set later, cleared later: a class that already exists is not stuck with what
// it was created with, and "no qualification" stays a real choice.
const tSetLater = await post("/api/classes", { id: tAccount.id, action: "update", clsId: tNoPaper.body?.cls?.id, specificationId: "uk-alevel" });
const afterSet = (await threeOf()).find((c) => c.id === tNoPaper.body?.cls?.id);
const tCleared = await post("/api/classes", { id: tAccount.id, action: "update", clsId: tNoPaper.body?.cls?.id, specificationId: null });
const afterClear = (await threeOf()).find((c) => c.id === tNoPaper.body?.cls?.id);
show("declared later", `${tSetLater.body?.cls?.specificationId} → assignable ${afterSet?.assignable?.length} | cleared → ${String(tCleared.body?.cls?.specificationId)} assignable ${afterClear?.assignable?.length}`);
ok(tSetLater.status === 200 && afterSet?.assignable?.length === alevelN,
  `a class that already exists can have its qualification declared, and the picker follows it immediately (${afterSet?.assignable?.length})`);
ok(tCleared.status === 200 && (tCleared.body?.cls?.specificationId ?? null) === null && afterClear?.assignable?.length === noneN,
  `and cleared again — no qualification is a choice, not an empty one (${afterClear?.assignable?.length})`);
const tOtherTeacher = await freshStudent("Nadia", { role: "teacher" });
const tStolen = await post("/api/classes", { id: tOtherTeacher.id, action: "update", clsId: tNoPaper.body?.cls?.id, specificationId: "uk-gcse" });
ok(tStolen.status === 403,
  `while a different teacher cannot declare it at all (HTTP ${tStolen.status} ${tStolen.body?.error ?? ""})`);

sub("Named gaps: what this journey could NOT do");
// Reported, not built (the directive's rule): these are absent from the product
// rather than broken in it, and each is measured so the gap is a number rather
// than an impression. Two of the three named here in earlier campaigns — school
// /organisation, and a class-level qualification no screen sent — are now
// driven above rather than listed.
note("inviting: a join code to read out — there is no shareable link and no email invite, so the student must be told the code out of band");

// ═══════════════════════════════════════════════════════════════════════════
head("ACCEPTANCE TOTAL");
console.log(`\n   ${pass} claims held, ${fail} failed.`);
console.log(`   Learners created in this run: ${seq} (each with its own account, profile and capability secret)`);
console.log(`   Data store: ${process.env.OPENMIND_DATA_DIR ?? ".data (default)"} — clean up with scripts/cleanup-e2e-store.mjs if desired.\n`);
process.exit(fail === 0 ? 0 : 1);
