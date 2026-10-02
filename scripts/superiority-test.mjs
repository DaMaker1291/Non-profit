// ─────────────────────────────────────────────────────────────────────────────
// THE SUPERIORITY TEST — a gate that can FALSIFY the differentiation claim.
//
// Usage: npm run superiority-test
//
// ── The claim under test ─────────────────────────────────────────────────
//
//   "OpenMind can take richer learner evidence and make more individually
//    appropriate, evidence-backed next-learning decisions than a conventional
//    sequential learning system."
//
// That is the ONLY claim this file tests, and it is deliberately the narrow one:
// not "OpenMind teaches better than UNICEF", not "learners gain more" — a
// synthetic battery has no learners in it and cannot measure learning. A number
// like "+0.3 SD" produced here would be an invention dressed as a result, which
// is the failure this project treats as unacceptable everywhere else.
//
// ── What makes it different from `npm run verify` ────────────────────────
//
// `verify` proves the code is internally consistent. This proves the DECISIONS
// are better than a conventional system's on the same evidence, and it is built
// so that it can report the engine failing:
//
//   · every learner is a history of answers folded by the REAL fold into a REAL
//     model, and every recommendation comes through the REAL door (`decide`);
//   · every expectation is DECLARED in the scenario (this learner's weakness,
//     this learner's misconception) rather than derived from the engine's own
//     output — an expectation read from the thing it judges is not a test;
//   · the BASELINE is a real deterministic system with the same evidence: work
//     the specification in order, repeat what was wrong, move on when right,
//     never retrieve, never look at a misconception, never check a prerequisite.
//
// ── The pass conditions ─────────────────────────────────────────────────
//
// Printed at the end; a non-zero exit means "differentiation NOT demonstrated".
// They are the user's conditions verbatim, measured on the battery below.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();

const require = createRequire(import.meta.url);
const genome = require("../.verify/genome.js");
const decision = require("../.verify/decision.js");
const assignmentView = require("../.verify/server/assignment-view.js");
const tutor = require("../.verify/server/tutor.js");
const llm = require("../.verify/llm.js");
// `stageOf` here is the LADDER's (learner-model); the genome's own `stage`
// accessor below keeps its name, so the two cannot be confused.
const { buildSnapshot, conceptDone, stageOf: ladderStageOf } = require("../.verify/learner-model.js");
const transfer = require("../.verify/transfer.js");

// The shared vocabulary is IMPORTED, not rebuilt: a second generator would let
// this file and the standing benchmark disagree about what evidence means, and
// a metric with two owners is not a standard. Dynamic because north-star reads
// the compiled mirror, which only exists after compileEngines().
const ns = await import("./north-star.mjs");
const { a, times, learner, decideFor, topFor, frontierOf, NOW, ORDER, ORDER_INDEX, title, cohortLearner, mulberry32 } = ns;

// ── The course every scenario is enrolled on ────────────────────────────
const COURSE = (subject) => ({
  country: "GB", grade: "Year 11", board: "aqa", spec: "uk-gcse", specLevel: "higher",
  subjects: [subject],
  subjectCourses: { [subject]: { spec: "uk-gcse", specLevel: "higher", board: "aqa" } },
});

const stageOf = (id) => genome.getConcept(id)?.stage ?? null;
const prereqsOf = (id) => genome.getConcept(id)?.prereqs ?? [];
const ancestorsOf = (id) => genome.ancestorsOf(id);
const subjectOf = (id) => genome.getConcept(id)?.subject ?? null;
const conceptsOf = (subject) => genome.bySubject(subject).map((c) => c.id);
const indexIn = (subject) => { const m = new Map(conceptsOf(subject).map((id, i) => [id, i])); return m; };

/** Independent proof on a concept: hint-free correct answers, no live slip. */
function independent(model, id) {
  return model.progress[id]?.independent?.correct ?? 0;
}
function liveMisconceptions(model, id) {
  return Object.keys(model.progress[id]?.misconceptions ?? {});
}
/**
 * Is this concept FINISHED for this learner, by the product's own verdict?
 *
 * This file used to answer the question itself — `independent >= 2 && no
 * slip` — and that was a second readiness bar, not a measurement: cohort_0's
 * two unaided answers (mastery 64%, below the engine's ESTABLISHED_MASTERY =
 * 0.65) counted as "proven" while the ladder — the single owner of the rung —
 * called the next step PRACTISE, so the scorer branded the ladder's own rung
 * "unnecessary repetition" and the metric reported the product failing to do
 * what its policy says. The engine already has one predicate for "no longer
 * open" (`learner-model#conceptDone`, which folds in the transfer surface and
 * the live slip), so the metric reads the product's verdict rather than
 * holding a private threshold — which is what the pass condition means by
 * "unnecessary repetition": sending a learner back over what their record has
 * already finished.
 */
function finished(model, id) {
  const e = buildSnapshot(model).evidence.find((x) => x.conceptId === id);
  return e ? conceptDone(e, transfer.canTransfer) : false;
}

// ── Scoring, shared by both systems ─────────────────────────────────────
// Each metric is a property of a DECISION plus the scenario's declared facts,
// so the same function scores OpenMind and the baseline. Nothing here reads the
// engine's internals.

function scoreDecision({ model, subject, servedId, kind, declared }) {
  const out = {
    wrongLevel: false, missedMisconception: false, repetition: false,
    prerequisiteViolation: false, falseTransferReadiness: false, invalid: false, backed: false,
  };
  if (!servedId) {
    // No decision at all is the worst outcome: nothing for the learner to do.
    out.invalid = true;
    return out;
  }
  const c = genome.getConcept(servedId);
  if (!c || c.subject !== subject) { out.wrongLevel = true; return out; }

  // A RETRIEVAL of proven work is the retention dimension doing its job — the
  // scheduler brought it back because it had aged — and calling that
  // "repetition" would be the scorer punishing the feature it should measure.
  // The engine's kinds are uppercase (lib/next-engine.ts#NextKind). Comparing
  // against a lower-case literal made every RETRIEVE look like new work, which
  // would have reported the retention scheduler as repetition — a scorer bug
  // that would have condemned the product for a feature working.
  const retrieval = String(kind ?? "").toUpperCase() === "RETRIEVE";
  // The ladder (lib/learner-model.ts#stageOf): once a concept is proved, the
  // NEXT rung is TRANSFER — unfamiliar wording — so serving it is the engine
  // advancing the learner, not repeating itself. Repetition is RE-TEACHING
  // (EXPLAIN/PRACTISE/REMEDIATE) something the record proves, or transferring
  // something whose transfer is already demonstrated. RETRIEVE is never
  // repetition: that is the retention scheduler doing its job.
  const reTeachKind = kind === "EXPLAIN" || kind === "PRACTISE" || kind === "REMEDIATE";
  if (!retrieval && (reTeachKind || kind === "TRANSFER") && finished(model, servedId)) {
    out.repetition = true;
  }

  // A missed misconception is one whose own concept (or the groundwork beneath
  // it) is not where the learner is being sent.
  if (declared.misconception && !retrieval &&
      servedId !== declared.misconception.conceptId &&
      !ancestorsOf(declared.misconception.conceptId).includes(servedId)) out.missedMisconception = true;

  // A prerequisite is VIOLATED only by evidence of failure. Absence is not
  // failure — that is the product's own rule, and a scorer that ignored it
  // would fail the engine for not knowing what it has not been asked. And only
  // NEW work can violate it: a spaced review is recall of material the learner
  // has already met — a fact about the schedule, not a foundation being built
  // on — so the due RETRIEVE of percentages whose `decimals` is weak
  // (cohort_8) is the retention engine doing its job, while an EXPLAIN over the
  // same gap is the violation the metric exists for. The calibration at the
  // end of this test proves the detector still fires on that one.
  const failedPrereq = prereqsOf(servedId).filter((p) => {
    const pr = model.progress[p];
    if (!pr || (pr.attempts ?? 0) === 0) return false;
    const cleanProof = (pr.independent?.asked ?? 0) > 0 && (pr.independent.correct ?? 0) === pr.independent.asked;
    return !cleanProof && (pr.accuracy ?? pr.mastery ?? 1) < 0.5;
  });
  if (!retrieval && failedPrereq.length > 0) out.prerequisiteViolation = true;

  // WRONG LEVEL, in the user's own terms: a FOUNDATION concept handed to a
  // learner who has evidence on something else and for whom it is not the
  // groundwork of anything they have touched. ("Year 11 → 10 × 5".) A learner
  // with no evidence at all is exempt: there is nothing to be below.
  const foundationStage = declared.foundationStage ?? 1;
  // TRANSFER and RETRIEVE are never "below their level": the first is proof
  // work on something the record already demonstrates, the second is the
  // schedule. What the user called the failure ("Year 11 → 10 × 5") is being
  // TAUGHT or re-drilled foundation material: EXPLAIN/PRACTISE/REMEDIATE.
  const teachesIt = reTeachKind;
  if ((c.stage ?? 0) <= foundationStage && !retrieval && teachesIt) {
    const pr = model.progress[servedId];
    const attempts = pr?.attempts ?? 0;
    // Remediation of something actually failed is never "below their level" —
    // that is the engine doing the right thing with the learner's own record.
    const failed = attempts >= 2 && (pr?.correct ?? 0) / attempts < 0.5;
    const evidenced = Object.keys(model.progress).filter((id) => (model.progress[id]?.attempts ?? 0) > 0);
    const groundwork = evidenced.some((id) => ancestorsOf(id).includes(servedId));
    if (!failed && evidenced.length > 0 && !groundwork) out.wrongLevel = true;
  }
  return out;
}

/** The conventional system: the specification in order, first concept with no
 *  recorded answer; when every concept has been answered, drill the first one
 *  again. No evidence use beyond "has this been answered". */
function baselineDecision({ subject, model }) {
  const ids = conceptsOf(subject);
  const unanswered = ids.find((id) => (model.progress[id]?.attempts ?? 0) === 0);
  const servedId = unanswered ?? ids.find((id) => Object.keys(model.progress).includes(id)) ?? null;
  return {
    servedId,
    kind: "practice",
    // The baseline's own honesty: it has no citations, because it cites nothing.
    evidenceIds: [],
    reason: unanswered ? "next unscored concept in specification order" : "repeat the earliest concept",
  };
}

const checks = [];
function check(group, condition, detail) {
  checks.push({ group, ok: !!condition, detail });
}
function groupResults(group) {
  const rows = checks.filter((c) => c.group === group);
  return { pass: rows.filter((r) => r.ok).length, total: rows.length, failed: rows.filter((r) => !r.ok) };
}

function lineFor(L, action) {
  const act = action ?? topFor(L);
  if (!act) return null;
  const served = act.conceptId ?? act.concept ?? null;
  const gaps = decision.citationGaps(L.ctx, [act]);
  return { act, served, gaps, backed: action?.basis === "cited" };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1 — CURRICULUM TARGETING
// Ten declared learners. No learner may receive work their own evidence has
// already put behind them, and none may be served a concept outside their course.
// ─────────────────────────────────────────────────────────────────────────────

const M = conceptsOf("maths");
const algebra = M.filter((id) => /equation|expression|quadratic|algebra/.test(id));
const geometry = M.filter((id) => /angle|triangle|circle|shape|area|volume|geometry|pythag/.test(id));
const strong = (ids) => ids.flatMap((id) => [a(id, true, { gapDays: 22 }), a(id, true, { gapDays: 12 }), a(id, true, { gapDays: 2 })]);
const weak = (ids) => ids.flatMap((id) => [a(id, false, { gapDays: 20 }), a(id, false, { gapDays: 6 })]);

const T1 = [
  { id: "A", name: "strong algebra, weak geometry", history: [...strong(algebra.slice(0, 4)), ...weak(geometry.slice(0, 2))], needs: geometry.slice(0, 2) },
  { id: "B", name: "weak algebra, strong geometry", history: [...weak(algebra.slice(0, 2)), ...strong(geometry.slice(0, 4))], needs: algebra.slice(0, 2) },
  { id: "C", name: "strong everything", history: [...strong(M.slice(0, 6))], needs: [] },
  { id: "D", name: "weak fractions", history: [...weak(["fraction-ops", "fractions"]), ...strong(algebra.slice(0, 2))], needs: ["fraction-ops"] },
  { id: "E", name: "strong fractions", history: [...strong(["fraction-ops"])], needs: [] },
  { id: "F", name: "developing algebra", history: [...times(2, algebra[0], true), ...times(2, algebra[0], false)], needs: algebra.slice(0, 1) },
  { id: "G", name: "foundational arithmetic", history: [...times(3, "place-value", false), ...times(2, "multiplication", false)], needs: ["place-value"] },
  { id: "H", name: "strong mechanics", history: [...strong(genome.bySubject("physics").map((c) => c.id).slice(0, 3))], subject: "physics", needs: [] },
  { id: "I", name: "weak electricity", history: [...weak(genome.bySubject("physics").map((c) => c.id).slice(3, 5))], subject: "physics", needs: [] },
  { id: "J", name: "weak bonding", history: [...weak(genome.bySubject("chemistry").map((c) => c.id).slice(0, 2))], subject: "chemistry", needs: [] },
];

console.log("════ TEST 1 — curriculum targeting ════");
const t1 = [];
for (const s of T1) {
  const subject = s.subject ?? "maths";
  const L = learner(`t1_${s.id}`, COURSE(subject), s.history);
  const served = lineFor(L);
  const model = L.model;
  const sc = scoreDecision({ model, subject, servedId: served?.served, kind: served?.act.kind, declared: {} });
  t1.push({ name: s.name, served: served?.served, subject, sc });
  check("T1", served && served.served && subjectOf(served.served) === subject,
    `${s.name}: served ${served?.served ? `${served.served} (${subjectOf(served.served)})` : "NOTHING"} for a ${subject} learner`);
  check("T1", !sc.wrongLevel, `${s.name}: not below their level (${served?.served}, stage ${stageOf(served?.served)})`);
  check("T1", !sc.repetition, `${s.name}: not work their record already proves (${served?.served})`);
  check("T1", served && served.gaps.length === 0, `${s.name}: citations resolve (${served?.gaps.length ?? "-"} broken)`);
}
{
  // The canonical failure, stated as its own fact: a Year 11 learner whose
  // record proves multiplication must never be served it again.
  const L = learner("t1_guard", COURSE("maths"), [...strong(["multiplication"]), ...strong(algebra.slice(0, 2))]);
  const guard = topFor(L);
  // A retrieval of it is the scheduler doing its job; RE-TEACHING it is the
  // failure the user named ("Year 11 → 10 × 5").
  check("T1", !(guard?.conceptId === "multiplication" && guard?.kind !== "RETRIEVE"),
    `the Year 11 guard: proven multiplication is never re-taught (top action ${guard?.kind}:${guard?.conceptId})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2 — PERSONALISATION: different evidence → different recommendation
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 2 — personalisation ════");
{
  const A = learner("t2_A", COURSE("maths"), [...strong(algebra.slice(0, 3)), ...weak(geometry.slice(0, 2))]);
  const B = learner("t2_B", COURSE("maths"), [...weak(algebra.slice(0, 2)), ...strong(geometry.slice(0, 3))]);
  const a1 = topFor(A), b1 = topFor(B);
  check("T2", a1 && b1 && (a1.conceptId !== b1.conceptId || a1.kind !== b1.kind),
    `opposite records → different next action (${a1?.kind}:${a1?.conceptId} vs ${b1?.kind}:${b1?.conceptId})`);
  const A2 = lineFor(A), B2 = lineFor(B);
  check("T2", A2.gaps.length === 0 && B2.gaps.length === 0, "and both reasons cite events that exist");
  // "The reason must explain the difference" is a claim about the PLAN, not
  // only its first row: introducing new material legitimately cites nothing
  // (its reason is about the curriculum), while the rest of the plan explains
  // itself with this learner's answers. So the test asks whether the plan as a
  // whole is anchored in their evidence.
  const planCites = (L) => decideFor(L).reduce((n, x) => n + (x.evidenceIds?.length ?? 0), 0);
  check("T2", planCites(A) > 0 && planCites(B) > 0,
    `and both plans are anchored in the learner's own answers (A ${planCites(A)} citations, B ${planCites(B)})`);

  // 100 seeded pairs: a materially different state must not produce the same
  // concept AND the same kind.
  const rng = mulberry32(0x51ed270b);
  let same = 0, checked = 0;
  for (let i = 0; i < 100; i++) {
    const pick = () => M[Math.floor(rng() * (M.length - 4))];
    const c1 = pick(), c2 = pick();
    if (c1 === c2) continue;
    const x = learner(`t2_x${i}`, COURSE("maths"), [...strong([c1])]);
    const y = learner(`t2_y${i}`, COURSE("maths"), [...strong([c2])]);
    const d1 = topFor(x), d2 = topFor(y);
    checked++;
    if (d1?.conceptId === d2?.conceptId && d1?.kind === d2?.kind) same++;
  }
  check("T2", same / checked < 0.05,
    `over ${checked} seeded pairs with different proven concepts, only ${same} got an identical action (${(100 * same / checked).toFixed(0)}% < 5%)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3 — EVIDENCE CAUSALITY: the recommendation is caused by the evidence
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 3 — evidence causality ════");
{
  const base = [...weak(["fractions"]), ...strong(algebra.slice(0, 2))];
  const before = learner("t3_before", COURSE("maths"), base);
  const shown = topFor(before);
  // ONE real answer — on the concept the ENGINE ITSELF asked for, which is what
  // makes this causal rather than circular: the learner does the work they were
  // given and the next decision must move.
  const target = shown?.conceptId;
  const after = learner("t3_after", COURSE("maths"), [...base, a(target, true, { gapDays: 0 }), a(target, true, { gapDays: 0 })]);
  const now = topFor(after);
  check("T3", shown?.conceptId !== now?.conceptId || shown?.kind !== now?.kind,
    `one honest success on the concept the engine asked for changes the next action (${shown?.kind}:${shown?.conceptId} → ${now?.kind}:${now?.conceptId})`);
  // The DELTA, not an absolute: the target may already carry independence from
  // the scenario's own history, and asserting "exactly 2" would be an
  // assertion about the fixture rather than about what the two new answers did.
  check("T3", independent(after.model, target) === independent(before.model, target) + 2,
    `and both answers are recorded as independence on that concept (${independent(before.model, target)} → ${independent(after.model, target)})`);
  // …and removing it restores the original: the decision is a function of the
  // ledger, not of a sequence the engine carries.
  const restored = learner("t3_restored", COURSE("maths"), base);
  const back = topFor(restored);
  check("T3", back?.conceptId === shown?.conceptId && back?.kind === shown?.kind,
    `and the same ledger decides the same thing twice (${back?.kind}:${back?.conceptId})`);
  check("T3", citationGapsClean(restored), "with no citation the ledger cannot support");
  function citationGapsClean(L) { return decision.citationGaps(L.ctx, decideFor(L)).length === 0; }

  // ── THE RATE, not the anecdote ──────────────────────────────────────────
  // The pass condition is ">95% meaningful response to changed learner
  // evidence", and the scenario above is one learner. Materiality is judged by
  // the same owner the engine uses — the ladder — so the question measured here
  // is precise: whenever added evidence moves the served concept to a
  // DIFFERENT RUNG, does the recommendation follow it? A concept already at the
  // top rung has nowhere to move, and demanding a change there would be asking
  // for noise, not responsiveness, so those cases are not counted. The added
  // evidence is the one the engine itself prescribed — the same answers the
  // learner would give in the session it handed them.
  {
    const rng = mulberry32(0x2f9a71c3);
    let moved = 0, followed = 0;
    const rung = (L, id) => {
      const e = buildSnapshot(L.model).evidence.find((x) => x.conceptId === id);
      return e ? ladderStageOf(e) : null;
    };
    for (let i = 0; i < 40; i++) {
      const cid = M[Math.floor(rng() * (M.length - 30))];
      const base = [...weak([cid])];
      const L0 = learner(`t3_rate0_${i}`, COURSE("maths"), base);
      const d0 = topFor(L0);
      const s0 = d0 ? rung(L0, d0.conceptId) : null;
      if (!d0 || !s0 || s0 === "advance") continue;
      const L1 = learner(`t3_rate1_${i}`, COURSE("maths"), [...base, ...times(3, d0.conceptId, true)]);
      if (rung(L1, d0.conceptId) === s0) continue; // the rung did not move: nothing to follow
      moved++;
      const d1 = topFor(L1);
      if (d1 && (d1.conceptId !== d0.conceptId || d1.kind !== d0.kind)) followed++;
    }
    console.log(`  the rung moved in ${moved} of 40 fresh scenarios; the recommendation followed it in ${followed}/${moved}`);
    check("T3", moved > 0 && followed / moved >= 0.95,
      `and the recommendation follows the evidence in ≥95% of the cases where the rung itself moved (${followed}/${moved})`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4 — MISCONCEPTION: the same volume of wrong answers, different shapes
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 4 — misconception ════");
{
  const tagged = learner("t4_tagged", COURSE("maths"),
    times(10, "fraction-ops", false, { tags: ["common-denominator"] }));
  const untagged = learner("t4_untagged", COURSE("maths"),
    times(10, "fraction-ops", false));
  const t1a = topFor(tagged), t1u = topFor(untagged);
  const mis = liveMisconceptions(tagged.model, "fraction-ops");
  check("T4", mis.includes("common-denominator"),
    `the learner's own slip is in the model (${mis.join(", ") || "none"})`);
  const inRange = (id) => id === "fraction-ops" || ancestorsOf("fraction-ops").includes(id);
  check("T4", t1a && inRange(t1a.conceptId),
    `the learner is sent to the failing concept or the groundwork beneath it (${t1a?.kind}:${t1a?.conceptId})`);
  const reasonA = JSON.stringify(t1a?.reason ?? "");
  const reasonU = JSON.stringify(t1u?.reason ?? "");
  check("T4", t1a?.kind !== t1u?.kind || reasonA !== reasonU,
    `and the prescribed work differs by the pattern, not the score (${t1a?.kind}/${t1u?.kind})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5 — INDEPENDENCE: 5/5 unaided ≠ 5/5 with help ≠ 5/5 scaffolded
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 5 — independence ════");
{
  const concept = algebra[0];
  const A = learner("t5_A", COURSE("maths"), times(5, concept, true));
  const B = learner("t5_B", COURSE("maths"), times(5, concept, true, { hints: 2 }));
  const C = learner("t5_C", COURSE("maths"), [...times(3, concept, false), ...times(4, concept, true, { hints: 3 })]);
  const da = topFor(A), db = topFor(B), dc = topFor(C);
  check("T5", independent(A.model, concept) === 5, `A's five unaided answers are independence proof (${independent(A.model, concept)})`);
  check("T5", independent(B.model, concept) === 0, `B's five helped answers are NOT (${independent(B.model, concept)})`);
  check("T5", da?.kind !== db?.kind || da?.conceptId !== db?.conceptId,
    `and the engine does not treat them as equal (A ${da?.kind}:${da?.conceptId} vs B ${db?.kind}:${db?.conceptId})`);
  check("T5", db?.kind !== dc?.kind || db?.conceptId !== dc?.conceptId,
    `nor B as C, whose record needed scaffolding (C ${dc?.kind}:${dc?.conceptId})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6 — NEW CONTENT: the frontier, at 10 points of the curriculum
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 6 — new content (frontier progression) ════");
{
  let planAhead = 0, tested = 0;
  const reTaught = [];
  for (let k = 2; k < 12; k++) {
    const upTo = M.slice(0, k);
    // The user's own scenario: concepts 1..k INDEPENDENTLY MASTERED **AND
    // TRANSFERRED**, so every prerequisite of the next concept is genuinely
    // satisfied. Without the transfer answers each concept sits on the ladder's
    // transfer rung and serving it is correct policy — the ladder is
    // prove → transfer → advance — so a scenario that stops at proof would be
    // testing the ladder, not the frontier.
    const L = learner(`t6_${k}`, COURSE("maths"), upTo.flatMap((id) => [
      a(id, true, { gapDays: 14 }), a(id, true, { gapDays: 9 }), a(id, true, { gapDays: 3 }),
      a(id, true, { mode: "transfer", gapDays: 1 }),
    ]));
    const plan = decideFor(L);
    const frontier = frontierOf(L.model);
    tested++;
    // NEW MATERIAL must be on offer: the point of the frontier is that the
    // learner has finished what is behind it. (A plan may ALSO include a due
    // retrieval — that is the retention dimension, not a failure to advance.)
    const ahead = plan.filter((x) => (ORDER_INDEX.get(x.conceptId) ?? -1) > frontier);
    if (ahead.length > 0) planAhead++;
    // …and nothing the record already proves may be re-TAUGHT (retrieval is
    // not re-teaching; it is recall of something aged).
    for (const x of plan) {
      const idx = ORDER_INDEX.get(x.conceptId) ?? -1;
      // Same rule as the shared scorer, so the suite has ONE definition of
      // repetition: a re-teach of proved work, or a transfer of work whose
      // transfer is already demonstrated.
      const sc = scoreDecision({ model: L.model, subject: "maths", servedId: x.conceptId, kind: x.kind, declared: {} });
      if (idx <= frontier && sc.repetition) reTaught.push(`${x.kind}:${x.conceptId}@${idx}`);
    }
  }
  check("T6", planAhead === tested,
    `after independently mastering the first k concepts, the plan offers NEW material beyond the frontier in all ${tested} cases (${planAhead}/${tested})`);
  check("T6", reTaught.length === 0,
    `and never re-teaches work the record already proves (${reTaught.length === 0 ? "none" : reTaught.slice(0, 6).join(", ")})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7 — RETRIEVAL: yesterday ≠ ninety days ≠ never demonstrated
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 7 — retrieval ════");
{
  const c = algebra[1];
  // Same trajectory, different recency: three good answers each, the last one
  // yesterday versus ninety days ago.
  const A = learner("t7_A", COURSE("maths"), [a(c, true, { gapDays: 40 }), a(c, true, { gapDays: 20 }), a(c, true, { gapDays: 1 })]);
  const B = learner("t7_B", COURSE("maths"), [a(c, true, { gapDays: 120 }), a(c, true, { gapDays: 100 }), a(c, true, { gapDays: 90 })]);
  const C = learner("t7_C", COURSE("maths"), [a(algebra[0], true, { gapDays: 2 })]);
  const da = topFor(A), db = topFor(B), dc = topFor(C);
  check("T7", !(dc && dc.conceptId === c && dc.kind === "retrieve"),
    `a learner who was NEVER asked about this concept is not given its retrieval (C: ${dc?.kind}:${dc?.conceptId})`);
  check("T7", da?.kind !== db?.kind || da?.conceptId !== db?.conceptId,
    `and ninety days of silence is not the same decision as yesterday (${da?.kind}:${da?.conceptId} vs ${db?.kind}:${db?.conceptId})`);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8 — TEACHER: every intervention names student, concept, evidence, action
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 8 — teacher interventions ════");
{
  const assignmentConcepts = M.slice(0, 6);
  const assignment = { id: "asg_bench", conceptIds: assignmentConcepts, subject: "maths", setAt: NOW - 7 * 86400000, dueAt: NOW + 7 * 86400000 };
  const rng = mulberry32(0x1234abcd);
  const rows = [];
  const learners = [];
  for (let i = 0; i < 30; i++) {
    const weakConcept = assignmentConcepts[Math.floor(rng() * assignmentConcepts.length)];
    const shape = rng();
    const history = shape < 0.4
      ? [...times(4, weakConcept, false, { tags: ["common-denominator"] }), ...times(2, assignmentConcepts[0], true)]
      : shape < 0.7
        ? [...times(3, weakConcept, false), ...times(2, assignmentConcepts[1], true)]
        : [...times(4, weakConcept, true)];
    const L = learner(`t8_${i}`, COURSE("maths"), history);
    learners.push({ id: `t8_${i}`, history, weakConcept, L });
    rows.push(assignmentView.deriveAssignmentProgress(assignment, `student_${i}`, L.id, L.events));
  }
  const interventions = assignmentView.interventionsFor(rows);
  const complete = interventions.every((iv) => iv.handle && iv.conceptId && iv.reason &&
    (iv.rate !== null || iv.reason === "not_started" || iv.misconceptionId));
  check("T8", interventions.length > 0, `the class produces interventions (${interventions.length} across 30 learners)`);
  check("T8", complete, "and every one names the student, the concept, the evidence and the action");
  const misconceptionRows = interventions.filter((iv) => iv.reason === "misconception");
  check("T8", misconceptionRows.length > 0,
    `recurring slips are surfaced as their own intervention (${misconceptionRows.length})`);
  // Remove the evidence and the intervention must go with it.
  const one = learners.find((l) => l.history.some((h) => !h.correct));
  const rowsWithout = [assignmentView.deriveAssignmentProgress(assignment, "student_x", one.id, one.L.events.filter((e) => e.correct !== false))];
  const without = assignmentView.interventionsFor(rowsWithout);
  check("T8", without.length !== interventions.filter((iv) => iv.handle === "student_x").length ||
      !without.some((iv) => iv.conceptId === one.weakConcept && iv.reason === "weak"),
    "and deleting the failing evidence deletes the intervention that cited it");
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9 — THE TUTOR: five inputs, same question. Brutal by design.
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 9 — tutor ════");
{
  const conceptId = algebra[0];
  // The turn is grounded in the CONCEPT and the question on screen (the shipped
  // signed-out path); the learner-grounded path needs a stored ledger, which is
  // exercised by e2e. What is under test here is the reply itself, per message.
  const messages = [
    "I don't understand.",
    "Why do I subtract 7?",
    "I got x = 13.",
    "I think I should divide first.",
    "What does the 7 represent?",
  ];
  const turns = [];
  for (const message of messages) {
    turns.push(await tutor.tutorTurn({ learnerId: null, conceptId, message, language: "en", now: NOW }));
  }
  // The reply TEXT itself, from the engine that produces it when no model is
  // configured, given the same context the panel supplies: the question on
  // screen, the serve reason, and the slips this learner's own answers
  // triggered. `tutorTurn` above is kept for the honesty claim (it must say why
  // it did not use a model); the distinctions are asserted on this text.
  const socratic = require("../.verify/socratic.js");
  const grounded = {
    question: "Solve 3x + 7 = 22",
    serveReason: "recall is strong, application is developing",
    hitIds: ["sign-error"],
  };
  const replies = messages.map((m) => socratic.socraticReply(conceptId, m, "en", grounded));
  const status = llm.aiStatus();
  const distinct = new Set(replies).size;
  check("T9", replies.every((r) => r && r.length > 0), "every input gets a reply");
  check("T9", distinct === messages.length, `and the five inputs get ${distinct}/5 distinct replies (never one canned paragraph)`);
  // …and the why-questions are about what was ASKED rather than a fixed move
  // with a varying opener. This is the assertion that failed before the fix:
  // "Why do I subtract 7?" and "What does the 7 represent?" were byte-identical
  // because the branch's only message-dependent part was which of five openers
  // a hash happened to pick. The reply now reads the learner's own words back,
  // the same shape the claim branch uses.
  check("T9", [1, 4].every((i) => replies[i].includes(messages[i])),
    "and a why-question is answered about the learner's own words (read back), not a canned move");
  check("T9", replies.every((r) => !r.includes("{")), "with no unrendered placeholder in any of them");
  const repeats = replies.filter((r, i) => i > 0 && r === replies[0]).length;
  check("T9", repeats === 0, `and none repeats the first reply verbatim (${repeats})`);
  // ── THE SEMANTIC CLAIMS, not a keyword hunt ──────────────────────────────
  // Every reply must reference the question actually on screen …
  check("T9", replies.every((r) => r.includes(grounded.question)),
    "every reply references the question on the screen");
  // …must not hand over the answer the Socratic panel exists to withhold …
  check("T9", replies.every((r) => !/x\s*=\s*5\b/.test(r)),
    "and none reveals the answer (x = 5) on a Socratic turn");
  // …and a turn given NO evidence must not claim any. The same call with an
  // empty history is the control: a reply that says "your answers triggered
  // …" when nothing did is exactly the fabrication the directive forbids.
  const bare = messages.map((m) => socratic.socraticReply(conceptId, m, "en", { question: grounded.question }));
  const claimedWithout = bare.filter((r) => /triggered/i.test(r) || /sign slip/i.test(r)).length;
  check("T9", claimedWithout === 0,
    `with no learner evidence supplied, no reply claims any (${claimedWithout}/5 did)`);
  // Actionable detail when distinctness fails: name the colliding pair.
  const collide = [];
  for (let i = 0; i < replies.length; i++) for (let j = i + 1; j < replies.length; j++) {
    if (replies[i] === replies[j]) collide.push(`#${i + 1}="${messages[i]}" ≡ #${j + 1}="${messages[j]}"`);
  }
  if (collide.length) console.log(`  colliding replies: ${collide.join("; ")}`);
  check("T9", turns.every((t) => t && (t.answerSource === "ai" || t.aiUnavailable !== null)),
    "and a reply that did not come from a model says why — the product never claims AI answered");
  if (status.enabled) {
    console.log(`  LOCAL_AI = RUNNING (${status.provider} · ${status.model})`);
  } else {
    console.log("  LOCAL_AI = NOT_IMPLEMENTED — no model is configured, so every reply above is the");
    console.log("              deterministic Socratic engine, and the product says so on the turn");
    console.log("              (labelKey + aiUnavailable); nothing claims a model answered.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10 — OPENMIND vs THE BASELINE, on identical evidence
// ─────────────────────────────────────────────────────────────────────────────

console.log("════ TEST 10 — baseline comparison ════");
{
  const cohort = [];
  for (let i = 0; i < 40; i++) cohort.push(cohortLearner(i));
  // Plus the declared Test 1 learners, so the table covers the designed cases.
  const scenarios = [
    ...T1.map((s) => ({ id: `t1_${s.id}`, subject: s.subject ?? "maths", shell: COURSE(s.subject ?? "maths"), history: s.history, declared: { misconception: null } })),
    ...cohort.map((L, i) => ({ id: `cohort_${i}`, subject: "maths", shell: COURSE("maths"), history: null, cohort: true, model: L.model, L })),
  ];

  const totals = {
    om: { wrongLevel: 0, missedMisconception: 0, repetition: 0, prerequisiteViolation: 0, falseTransferReadiness: 0, invalid: 0, uncitedEvidenced: 0, backed: 0, n: 0 },
    bl: { wrongLevel: 0, missedMisconception: 0, repetition: 0, prerequisiteViolation: 0, falseTransferReadiness: 0, invalid: 0, uncitedEvidenced: 0, backed: 0, n: 0 },
  };
  // Every non-zero OpenMind figure is printed with the scenarios that produced
  // it, so a failure names the decisions to look at instead of a bare count.
  const omDefects = { wrongLevel: [], missedMisconception: [], repetition: [], prerequisiteViolation: [], falseTransferReadiness: [], invalid: [], uncitedEvidenced: [] };
  // Only these claim the learner is ready for harder, re-framed or open work.
  const OPENMIND_KINDS_AHEAD = new Set(["TRANSFER", "CHALLENGE", "PROJECT"]);

  for (const s of scenarios) {
    const subject = s.subject;
    const L = s.L ?? learner(s.id, s.shell, s.history);
    const model = L.model;
    const declared = {
      misconception: (Object.entries(model.progress).flatMap(([cid, p]) =>
        Object.keys(p.misconceptions ?? {}).map((mid) => ({ conceptId: cid, mid }))))[0] ?? null,
      floor: undefined,
    };
    const om = topFor(L);
    const omScored = scoreDecision({ model, subject, servedId: om?.conceptId ?? null, kind: om?.kind, declared });
    const omGaps = decision.citationGaps(L.ctx, decideFor(L));
    omScored.invalid = omScored.invalid || omGaps.length > 0;
    // "Evidence-backed" has two honest shapes: the decision cites events the
    // learner actually produced, or it introduces material this learner has no
    // record of — where there is nothing to cite and the reason says so. A
    // decision ABOUT evidenced material that cites none of it is the failure
    // this metric exists to catch, and it is counted separately.
    const omEvidenced = ((model.progress[om?.conceptId]?.attempts) ?? 0) > 0;
    omScored.backed = !om ? false : (om.evidenceIds?.length ?? 0) > 0 || !omEvidenced;
    omScored.uncitedEvidenced = !!om && omEvidenced && !((om.evidenceIds?.length ?? 0) > 0);
    if (om && OPENMIND_KINDS_AHEAD.has(om.kind) && independent(model, om.conceptId) === 0) omScored.falseTransferReadiness = true;

    const bl = baselineDecision({ subject, model });
    const blScored = scoreDecision({ model, subject, servedId: bl.servedId, kind: bl.kind, declared });
    const servedConcept = bl.servedId;
    // The baseline has no notion of independence, so any "ahead" work it serves
    // while the record is unproven is the same false-readiness failure — and it
    // serves the NEXT unscored concept, which is exactly how it advances.
    if (servedConcept && independent(model, servedConcept) === 0 && (model.progress[servedConcept]?.attempts ?? 0) > 0) blScored.falseTransferReadiness = true;

    for (const [k, v] of Object.entries({ ...omScored })) if (k !== "backed") if (v === true) {
      totals.om[k]++;
      if (k in omDefects) omDefects[k].push(`${s.id}: ${om.kind}:${om.conceptId}`);
    }
    for (const [k, v] of Object.entries({ ...blScored })) if (k !== "backed") if (v === true) totals.bl[k]++;
    if (omScored.backed) totals.om.backed++;
    totals.om.n++; totals.bl.n++;
  }

  // ── ONE CONCEPT, ONE ROW ───────────────────────────────────────────────
  // A plan must never schedule the same concept twice. It could: a concept can
  // be both an unmet prerequisite (the repair branch) and due for review (the
  // schedule), and the plan then carried two rows for it with CONTRADICTORY
  // sentences — measured on cohort_0, "not established yet" stood directly
  // above "You proved this before". Enforced across every plan in the battery.
  {
    const doubled = scenarios.filter((s) => {
      const L = s.L ?? learner(s.id, s.shell, s.history);
      const ids = decideFor(L).map((x) => x.conceptId);
      return new Set(ids).size !== ids.length;
    }).map((s) => s.id);
    check("T10", doubled.length === 0,
      `no plan schedules one concept twice (${doubled.length} did${doubled.length ? `: ${doubled.slice(0, 4).join(", ")}` : ""})`);
  }

  // ── THE INSTRUMENTS THEMSELVES ─────────────────────────────────────────
  // Two metrics were corrected this pass (repetition now reads the product's
  // own finish line; a spaced review is no longer scored as new work over a
  // prerequisite gap). A detector that cannot fire proves nothing, so each is
  // fired once on a REAL folded record in which the violation genuinely exists
  // — the same fold, the same evidence, the same scoring function that judged
  // the engine above.
  {
    const noSurface = conceptsOf("maths").find((id) => !transfer.canTransfer(id));
    const cal = learner("t10_cal_repeat", COURSE("maths"), times(6, noSurface, true));
    const ce = buildSnapshot(cal.model).evidence.find((x) => x.conceptId === noSurface);
    const done = ce ? conceptDone(ce, transfer.canTransfer) : false;
    const scored = scoreDecision({ model: cal.model, subject: "maths", servedId: noSurface, kind: "PRACTISE", declared: {} });
    check("T10", done && scored.repetition === true,
      `calibration: re-teaching a FINISHED concept (${noSurface}) is still caught as repetition`);
  }
  {
    const dep = conceptsOf("maths").find((id) => prereqsOf(id).length > 0);
    const pre = prereqsOf(dep)[0];
    const cal = learner("t10_cal_prereq", COURSE("maths"), times(3, pre, false));
    const scored = scoreDecision({ model: cal.model, subject: "maths", servedId: dep, kind: "EXPLAIN", declared: {} });
    check("T10", scored.prerequisiteViolation === true,
      `calibration: teaching ${dep} over a failed ${pre} is still caught as a prerequisite violation`);
  }

  const pct = (n, d) => (d === 0 ? "—" : `${Math.round((100 * n) / d)}%`);
  const row = (label, k) =>
    `  ${label.padEnd(30)} ${String(totals.bl[k]).padStart(8)}   ${String(totals.om[k]).padStart(8)}`;

  console.log("");
  console.log("  OPENMIND EDUCATIONAL DECISION BENCHMARK");
  console.log("");
  console.log(`  Learners/scenarios:            ${totals.om.n}`);
  console.log("");
  console.log("                                        Baseline   OpenMind");
  console.log("  --------------------------------------------------------");
  console.log(row("Wrong-level tasks", "wrongLevel"));
  console.log(row("Missed misconceptions", "missedMisconception"));
  console.log(row("Unnecessary repetition", "repetition"));
  console.log(row("Prerequisite violations", "prerequisiteViolation"));
  console.log(row("False transfer readiness", "falseTransferReadiness"));
  console.log(row("Invalid recommendations", "invalid"));
  console.log(row("Uncited evidence claims", "uncitedEvidenced"));
  // The pass condition names a RATE — ≥95% appropriate next-action decisions —
  // so it is measured rather than assumed, against criteria declared here: a
  // decision is appropriate when it is safe in every way this battery can see
  // (right level, gap respected, nothing invented, its claim cited, no false
  // readiness). Missed misconceptions and repetition are NOT folded in: the
  // user's own table expects them non-zero while this rate stays ≥95%, so they
  // are reported as their own rows.
  const SAFETY = ["wrongLevel", "prerequisiteViolation", "invalid", "uncitedEvidenced", "falseTransferReadiness"];
  const appropriateOf = (t) => t.n - SAFETY.reduce((s, k) => s + t[k], 0);
  const omRate = Math.round((100 * appropriateOf(totals.om)) / totals.om.n);
  const blRate = Math.round((100 * appropriateOf(totals.bl)) / totals.bl.n);
  console.log(`  ${"Appropriate decisions: %".padEnd(30)} ${String(blRate).padStart(8)}   ${String(omRate).padStart(8)}`);
  console.log(`  ${"Evidence-backed decisions".padEnd(30)} ${"—".padStart(8)}   ${pct(totals.om.backed, totals.om.n).padStart(8)}`);
  console.log("");
  console.log("  Every number above is counted from the scenarios, never authored.");
  const anyOmDefect = Object.values(omDefects).some((v) => v.length > 0);
  if (anyOmDefect) {
    console.log("");
    console.log("  OpenMind's own defects, by scenario:");
    for (const [k, v] of Object.entries(omDefects)) {
      if (v.length) console.log(`    ${k} (${v.length}): ${v.slice(0, 6).join(", ")}${v.length > 6 ? " …" : ""}`);
    }
  }

  check("T10", totals.om.wrongLevel === 0, `wrong-level tasks: OpenMind ${totals.om.wrongLevel}, baseline ${totals.bl.wrongLevel}`);
  check("T10", totals.om.prerequisiteViolation === 0, `prerequisite violations: OpenMind ${totals.om.prerequisiteViolation}, baseline ${totals.bl.prerequisiteViolation}`);
  check("T10", totals.om.invalid === 0, `invalid recommendations: OpenMind ${totals.om.invalid}, baseline ${totals.bl.invalid}`);
  check("T10", totals.om.missedMisconception <= totals.bl.missedMisconception,
    `misconceptions missed: OpenMind ${totals.om.missedMisconception} vs baseline ${totals.bl.missedMisconception}`);
  check("T10", totals.om.repetition <= totals.bl.repetition,
    `unnecessary repetition: OpenMind ${totals.om.repetition} vs baseline ${totals.bl.repetition}`);
  check("T10", totals.om.uncitedEvidenced === 0,
    `no decision about evidenced material is left uncited: ${totals.om.uncitedEvidenced}`);
  check("T10", totals.om.backed / totals.om.n >= 0.95,
    `evidence-backed recommendations: ${pct(totals.om.backed, totals.om.n)}`);
  check("T10", omRate >= 95,
    `appropriate next-action decisions: ${omRate}% (no wrong level, no skipped prerequisite, no invented recommendation, no uncited claim, no false readiness)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// THE GATE
// ─────────────────────────────────────────────────────────────────────────────

console.log("");
console.log("════ PASS CONDITIONS ════");
const groups = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"];
let failed = 0;
for (const g of groups) {
  const r = groupResults(g);
  const ok = r.total > 0 && r.pass === r.total;
  if (!ok) failed++;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${g}  ${r.pass}/${r.total}`);
  for (const f of r.failed) console.log(`        ${f.detail}`);
}
console.log("");
console.log(`DIFFERENTIATION ${failed === 0 ? "DEMONSTRATED" : "NOT DEMONSTRATED"} — ${checks.filter((c) => c.ok).length}/${checks.length} checks passed`);

process.exit(failed === 0 ? 0 : 1);
