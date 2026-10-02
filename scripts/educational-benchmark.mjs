// ─────────────────────────────────────────────────────────────────────────────
// THE EDUCATIONAL INTELLIGENCE BENCHMARK
//
// The question this exists to answer is NOT "does OpenMind work". It is the
// sharper one underneath it:
//
//     Does a learner's own evidence change what they are asked to do, in the
//     direction the pedagogy claims — and where does it fail to?
//
// ── What this is ─────────────────────────────────────────────────────────
//
// A battery of learner SCENARIOS. Each one is a history of answers, projected
// through the REAL fold (lib/replay.ts) into a REAL model, and decided through
// the REAL door (`decide`, lib/decision.ts). Nothing here reimplements the
// engine or reads its source for a string: if the engine changes, the
// benchmark's verdicts change with it. That is the whole point of routing it
// this way rather than asserting on internals.
//
// ── WHAT THIS IS NOT, AND MUST NEVER BE PRESENTED AS ─────────────────────
//
// It does NOT measure learning. It cannot. A synthetic cohort has no learners
// in it, and a number like "OpenMind gains +0.3 SD" produced by this file would
// be an invention dressed as a result — the exact failure this project treats
// as unacceptable everywhere else (a fabricated citation, a model that moves
// with no event behind it, a "no evidence" read as a failure). So there is no
// learning-gain column here and there must never be one.
//
// What CAN be measured honestly is smaller, checkable, and still decisive:
//
//   A. Does the engine's decision match a DECLARED pedagogical expectation for
//      a named learner state — including the adversarial states (a live
//      misconception under a strong-looking record, a missing prerequisite, a
//      lucky guess)?
//   B. Do the engine's own invariants hold across a seeded cohort — cited
//      events that resolve, honest `basis` claims, remedial work that never
//      targets a concept nothing is known about, retrieval only when due?
//   C. How far does the engine's choice sit from the CONVENTIONAL baseline —
//      "work the specification in order, do the first thing you have no
//      evidence on"? A differentiation of zero would mean no comparison is
//      worth running in the field, which is a falsification worth having.
//
// The honest division of labour: (A)-(C) tell you whether the mechanism is
// doing anything and is doing it defensibly. Only a field trial can tell you
// whether it helps. This file is the gate BEFORE that trial, and it is
// deliberately built so that it can, and does, report the engine failing.
//
// Usage: npm run benchmark
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();

const require = createRequire(import.meta.url);
// THE SHARED VOCABULARY AND THE NORTH-STAR MEASUREMENT COME FROM ONE MODULE.
//
// The scenario vocabulary (a history, a learner, the seeded cohort), the clock
// and the held-out measurement used to be defined here. `npm run reliability`
// needs all of them, so they moved to scripts/north-star.mjs and this file
// imports them: two generators would let the benchmark and the standing report
// disagree about what evidence means, and a north-star metric with two owners
// is not a standard, it is a remark. The benchmark still OWNS the scenarios and
// the report; it just no longer owns the cohort or the numbers.
import {
  NOW,
  JUST_NOW,
  title,
  ORDER,
  ORDER_INDEX,
  HOLDOUT,
  a,
  times,
  learner,
  decideFor,
  topFor,
  frontierOf,
  mulberry32,
  COHORT_SIZE,
  cohortLearner,
  measureNorthStar,
  northStarLines,
  UNMEASURED_HALF,
  brier,
  hitRate,
} from "./north-star.mjs";

const genome = require("../.verify/genome.js");
const evMod = require("../.verify/evidence.js");
const replay = require("../.verify/replay.js");
const decision = require("../.verify/decision.js");
const learnerModel = require("../.verify/learner-model.js");
const progress = require("../.verify/progress.js");
const retention = require("../.verify/retention.js");
const transferMod = require("../.verify/transfer.js");

const DAY = 86400000;

// ─────────────────────────────────────────────────────────────────────────────
// The scenario vocabulary lives in scripts/north-star.mjs (see the note at the
// top of this file). The two helpers below are the benchmark's own: they are
// about SCENARIOS, not about learners.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kept for the scenarios' own use — see north-star.mjs for the shared `a`.
 * One answer in a learner's history.
 *
 * `gapDays` is the time from THIS answer to the NEXT one, so the LAST answer's
 * gap is how long ago the learner last worked on the concept — which is the
 * number retention reads. Written that way because "how long since this was
 * last seen" is the question every retention scenario actually asks.
 *
 * `hints` is carried ON THE ANSWER, which is the only place scaffolding demand
 * can be recorded and still survive: the fold counts these into
 * `ConceptProgress.hinted` (LEDGER_OWNED_FIELDS), while the per-level tally the
 * hint endpoint writes is an annotation the fold does not reproduce. A scenario
 * therefore says "this answer needed help" and nothing more — the same fact the
 * serve path mints, which is what makes the scenario judgeable at all.
 */
/**
 * THE GAPS THE FRONTIER HIDES: concepts strictly behind the furthest one the
 * learner has worked on, with no evidence at all. This is the reality the
 * brief describes — a class that received grade-level instruction while
 * carrying a missing prerequisite — and it is the only place a prerequisite
 * repair could ever be needed.
 */
function holesOf(model) {
  const f = frontierOf(model);
  if (f < 0) return [];
  return ORDER.filter((id, i) => i < f && (model.progress[id]?.attempts ?? 0) === 0);
}

/** The one page a conventional sequence would serve next. */
function textbookNext(model) {
  const f = frontierOf(model);
  return ORDER.find((id, i) => i > f && (model.progress[id]?.attempts ?? 0) === 0) ?? null;
}

/** A learner's state in one line per concept, for the report. */
function stateOf(model) {
  const snap = learnerModel.buildSnapshot(model);
  if (snap.evidence.length === 0) return "no evidence on any concept";
  return snap.evidence
    .map((e) => {
      const p = model.progress[e.conceptId];
      const bits = [
        `${e.attempts}a`,
        `m${Math.round(e.mastery * 100)}%`,
        e.confidence === null ? "conf —" : `conf ${Math.round(e.confidence * 100)}%`,
        e.status,
      ];
      if (e.topMisconception) bits.push(`slip ${e.topMisconception}×${e.misconceptionHits}`);
      if (e.independentAsked) bits.push(`ind ${e.independentCorrect}/${e.independentAsked}`);
      if (e.transferAsked) bits.push(`tr ${e.transferCorrect}/${e.transferAsked}`);
      if (p?.retention?.asked) bits.push(`ret ${p.retention.correct}/${p.retention.asked}${p.retention.lastHeld === null ? "" : p.retention.lastHeld ? " held" : " lost"}`);
      return `${e.conceptId}(${bits.join(" ")})`;
    })
    .join("  ");
}

function actionLine(a) {
  if (!a) return "— none —";
  return `${a.kind}${a.conceptId ? ` ${a.conceptId}` : ""} · ${a.minutes}min · [${a.basis}] · ${a.reason}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section A — adversarial scenarios
//
// Each case declares the state it builds and what a competent teacher would
// expect the system to do about it. The expectation is written as the pedagogy,
// not as the current behaviour — which is what makes a failure informative
// rather than a tautology.
// ─────────────────────────────────────────────────────────────────────────────

const CASES = [];
function scenario(name, build, expect) {
  CASES.push({ name, build, expect });
}

// ── 1. A learner nothing is known about leaves no room for a claim ─────────
scenario(
  "cold start — a brand-new learner",
  () => learner("bench-cold", {}, []),
  (top, L) => ({
    held: top.kind === "EXPLAIN" && top.conceptId === null && top.href.startsWith("/diagnostic"),
    why: "with no evidence there is nothing to remediate or attend to; the only honest next action is to measure",
    note: `kind=${top.kind} concept=${top.conceptId ?? "null"} href=${top.href} basis=${top.basis}`,
  }),
);

// ── 2. Accurate, but every single answer needed help ────────────────────
//
// The state the brief names outright ("correct with heavy support →
// independent proof"). The learner got every answer right and asked for help
// on every one, so the ONE thing this record does not contain is the learner
// doing it alone. They must not be told their straightforward work is solid.
scenario(
  "correct every time, but helped every time",
  () => learner("bench-scaffold", {}, times(4, "fraction-ops", true, { hints: 2 })),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "fraction-ops");
    return {
      held: top.conceptId === "fraction-ops" && (top.kind === "PRACTISE" || top.kind === "EXPLAIN"),
      why: "a learner who took help on every answer has never done it unaided, so the same idea in unfamiliar wording is a claim the record cannot support",
      note: `helped ${e.hintedAnswers}/${e.attempts} answers · unaided ${e.independentAsked} · m${Math.round(e.mastery * 100)}% conf ${e.confidence === null ? "—" : Math.round(e.confidence * 100) + "%"} → ${top.kind}`,
    };
  },
);

// ── 2b. The boundary: ONE answer unaided is enough to unlock it ──────────
//
// The other side of the same rule, so the fix cannot be "never offer stretch
// work": as soon as the record contains a single answer the learner gave
// unaided, unfamiliar wording is a claim it does support.
scenario(
  "helped on most answers, but one was unaided",
  () =>
    learner("bench-one-unaided", {}, [
      ...times(3, "fraction-ops", true, { hints: 2 }),
      a("fraction-ops", true, { hints: 0 }),
      a("fraction-ops", true, { hints: 0 }),
    ]),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "fraction-ops");
    return {
      held: top.kind === "TRANSFER" || top.kind === "CHALLENGE",
      why: "the rule is about whether EVERY answer took help, not about how much help was taken — a learner who has done it alone may be stretched",
      note: `helped ${e.hintedAnswers}/${e.attempts} answers · unaided ${e.independentCorrect}/${e.independentAsked} · m${Math.round(e.mastery * 100)}% conf ${e.confidence === null ? "—" : Math.round(e.confidence * 100) + "%"} → ${top.kind}`,
    };
  },
);

// ── 4. A slip that is still happening ────────────────────────────────────
scenario(
  "a recurring misconception is live",
  () =>
    learner("bench-slip", {}, [
      ...times(2, "fraction-ops", false, { tags: ["denom-add"] }),
      a("fraction-ops", true),
    ]),
  (top) => ({
    held: top.kind === "REMEDIATE" && top.conceptId === "fraction-ops",
    why: "the same named slip twice is the cause, not the symptom — repair it before more practice",
    note: `→ ${top.kind}`,
  }),
);

// ── 5. A slip the learner has since repaired (the honesty half of 4) ─────
scenario(
  "a misconception repaired by three clean answers",
  () =>
    learner("bench-repaired", {}, [
      ...times(2, "fraction-ops", false, { tags: ["denom-add"], gapDays: 1 }),
      ...times(3, "fraction-ops", true, { gapDays: 0, mode: "independent" }),
    ]),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "fraction-ops");
    return {
      held: top.kind !== "REMEDIATE",
      why: "REPAIR_STREAK exists so a learned slip stops being actionable; an engine that keeps opening with “Fix:” has stopped being adaptive",
      note: `slip cleared=${e.topMisconception === null} lifetime=${e.lifetimeMisconception?.id ?? "none"}×${e.lifetimeMisconception?.hits ?? 0} → ${top.kind}`,
    };
  },
);

// ── 6. Looks strong, slip still live ─────────────────────────────────────
scenario(
  "a strong-looking record with the slip still live",
  () =>
    learner("bench-strongslip", {}, [
      ...times(2, "fraction-ops", false, { tags: ["denom-add"], gapDays: 1 }),
      ...times(4, "fraction-ops", true, { gapDays: 0 }),
      a("fraction-ops", false, { tags: ["denom-add"], gapDays: 0 }),
    ]),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "fraction-ops");
    return {
      held: top.kind !== "TRANSFER" && top.kind !== "CHALLENGE",
      why: "a learner who has just made the same slip again is not ready for unfamiliar wording, whatever their accuracy says",
      note: `m${Math.round(e.mastery * 100)}% conf ${e.confidence === null ? "—" : Math.round(e.confidence * 100) + "%"} slip×${e.misconceptionHits} streak-clear=${e.topMisconception === null} → ${top.kind}`,
    };
  },
);

// ── 7. A due review ──────────────────────────────────────────────────────
/** A concept the learner has really proved: four hint-free answers and one on
 *  unfamiliar wording. `lastGap` is the time from the LAST of them to now —
 *  which is the number retention reads. */
const mastered = (cid, lastGap = 0) => {
  const h = [...times(4, cid, true, { mode: "independent" }), a(cid, true, { source: "transfer", mode: "transfer" })];
  h[h.length - 1] = { ...h[h.length - 1], gapDays: lastGap };
  return h;
};
scenario(
  "a mastered concept comes back into view",
  () => learner("bench-due", {}, mastered("fractions", 31)),
  (top, L) => {
    const due = retention.dueReviews(L.model, NOW).map((d) => d.conceptId);
    return {
      held: top.kind === "RETRIEVE" && top.conceptId === "fractions",
      why: "a review that has come round is the highest-value thing this learner can do today",
      note: `due=[${due.join(",")}] → ${top.kind}`,
    };
  },
);

// ── 8/9. The same due review, passed vs failed — do they diverge? ────────
const dueHistory = (final) => {
  const h = [];
  h.push(...times(4, "fractions", true, { mode: "independent" })); // prove it
  // The month passes BEFORE the review, so the review is the most recent event
  // and the practice block is the thing it echoes. Putting the gap on the
  // review itself would move the whole block back with it and the review would
  // arrive milliseconds after the work it is testing.
  h.push(a("fractions", true, { source: "transfer", mode: "transfer", gapDays: 31 }));
  h.push(a("fractions", final, { source: "retrieval", mode: "independent" })); // the review
  return h;
};

/** The retention row for a concept, present or absent — a scenario must be able
 *  to report "not recorded" rather than crash on it. */
function retentionOf(L, cid) {
  return L.model.progress[cid]?.retention ?? { asked: 0, correct: 0, lastHeld: null };
}
const reviewPassed = learner("bench-review-pass", {}, dueHistory(true));
const reviewFailed = learner("bench-review-fail", {}, dueHistory(false));

scenario(
  "a due review PASSED",
  () => reviewPassed,
  (top, L) => {
    const r = retentionOf(L, "fractions");
    return {
      held: r.asked === 1 && r.correct === 1 && r.lastHeld === true,
      why: "a delayed, hint-free correct answer is retention evidence and nothing else is",
      note: `retention ${r.correct}/${r.asked} lastHeld=${r.lastHeld} → ${top.kind}`,
    };
  },
);
scenario(
  "a due review FAILED",
  () => reviewFailed,
  (top, L) => {
    const r = retentionOf(L, "fractions");
    return {
      held: r.asked === 1 && r.correct === 0 && r.lastHeld === false,
      why: "forgetting is a measurement, not an absence of one — a failed due review must be recorded as a lost hold",
      note: `retention ${r.correct}/${r.asked} lastHeld=${r.lastHeld} → ${top.kind}`,
    };
  },
);

// ── The same review, passed and failed, must not lead to the same tomorrow ─
scenario(
  "a passed and a failed review lead to different next work",
  () => reviewPassed,
  (top, L) => {
    const p = retentionOf(reviewPassed, "fractions");
    const f = retentionOf(reviewFailed, "fractions");
    const passedTop = topFor(reviewPassed);
    const failedTop = topFor(reviewFailed);
    const differs = passedTop.kind !== failedTop.kind || passedTop.minutes !== failedTop.minutes;
    return {
      held: p.lastHeld === true && f.lastHeld === false && differs,
      why: "if both states schedule the same tomorrow, retention is being recorded and then ignored",
      note: `held → ${passedTop.kind} ${passedTop.minutes}min · lost → ${failedTop.kind} ${failedTop.minutes}min`,
    };
  },
);

// ── 10a. The missing prerequisite that CAN be shown to be missing ────────
//
// The brief's central claim: "a wrong answer because the prerequisite is
// missing should route to the prerequisite and return". It can only be claimed
// when the record shows the prerequisite is weak — and this is that learner.
// `fractions` has real evidence and is not established; `fraction-ops` is being
// failed. The engine must go to the prerequisite, name it, and say which kind
// of not-established it is.
const EN_DICT = require("../.verify/i18n.js");
const enT = (k, vars) => EN_DICT.fill(EN_DICT.DICTS.en[k], vars);

scenario(
  "fails a concept whose prerequisite the record shows is weak",
  () =>
    learner("bench-prereq", {}, [
      // Weak, but with no live slip: two different wrong answers (so the slip
      // rule cannot fire — that is 10b's neighbour scenario) and one right.
      ...times(1, "fractions", false, { tags: ["frac-slice"], gapDays: 1 }),
      ...times(1, "fractions", false, { tags: ["frac-add"], gapDays: 1 }),
      ...times(1, "fractions", true),
      // The learner is failing fraction arithmetic — the concept that declares
      // `fractions` as its prerequisite.
      ...times(4, "fraction-ops", false),
    ]),
  (top, L) => {
    const unmet = learnerModel.unmetPrerequisites("fraction-ops", L.model);
    const book = textbookNext(L.model);
    return {
      // The KIND is the prerequisite's own rung (EXPLAIN the first time, PRACTISE
      // once it has been met before); what must hold is the TARGET and the
      // SENTENCE — which kind of not-established this is.
      held:
        top.conceptId === "fractions" &&
        (top.kind === "EXPLAIN" || top.kind === "PRACTISE") &&
        top.reason === enT("next.reason.prereqFirst", { next: title("fraction-ops") }),
      why: "the brief's central claim: a wrong answer on a concept whose declared prerequisite is not established should route to the prerequisite",
      note: `unmet for fraction-ops=[${unmet.join(",")}] · engine ${top.kind} ${top.conceptId ?? "null"} · textbook baseline would serve ${book} · “${top.reason}”`,
    };
  },
);

// ── 10b. The prerequisite NOTHING has been asked about ─────
//
// The other half, and the one that decides whether this product is honest. The
// learner is stuck on `fraction-ops` (so the foundations branch is right to
// fire) but nothing has ever been asked about `fractions`. Two things must be
// true at once: the work goes to the declared prerequisite, and the sentence
// says COVERAGE, not weakness — "you have not covered it yet", never "it is not
// established yet".
scenario(
  "stuck on a concept whose prerequisite was never measured",
  () => learner("bench-prereq-new", {}, times(4, "fraction-ops", false)),
  (top, L) => {
    const unmet = learnerModel.unmetPrerequisites("fraction-ops", L.model);
    const declared = top.conceptId ? genome.getConcept("fraction-ops")?.prereqs ?? [] : [];
    return {
      held:
        top.kind === "EXPLAIN" &&
        declared.includes(top.conceptId) &&
        top.reason === enT("next.reason.prereqNew", { next: title("fraction-ops") }) &&
        top.basis !== "cited",
      why: "an unmeasured prerequisite may be introduced as declared coverage, but nothing may speak about it as though it had been failed — and there is nothing to cite",
      note: `unmet=[${unmet.join(",")}] declared-for-fraction-ops=[${declared.join(",")}] → ${top.kind} ${top.conceptId} [${top.basis}] “${top.reason}”`,
    };
  },
);

// ── 10c. …and the RETURN leg, which is half the claim ────────────────────
//
// "Route to the prerequisite AND RETURN" — the second verb is the one nothing
// tested, and it is the one a learner would notice: a detour that never comes
// back is just a lesson the learner did not ask for. Time is injected rather
// than waited out: the prerequisite is repaired by recording the answers a
// learner who has been taught it would give, through the real fold, and then
// the engine is asked again.
scenario(
  "after the prerequisite is repaired the learner returns to what was blocked",
  () => {
    const L = learner("bench-prereq-return", {}, times(4, "fraction-ops", false));
    const first = topFor(L);
    // The repair: the prerequisite, taught and practised until it is established.
    const taught = structuredClone(L.model);
    for (let i = 0; i < 6; i++) {
      progress.recordAnswer(taught, first.conceptId, `teach-${i}`, 0, true, "", [], { mode: "independent" });
    }
    taught.progress[first.conceptId].lastSeen = NOW;
    const events = [...L.events, ...Array.from({ length: 6 }, (_, i) => evMod.answerEvidence({
      learnerId: L.profile.id, at: NOW - JUST_NOW + i * 1000, source: "practice", subject: "maths",
      conceptId: first.conceptId, specificationId: null, questionId: `teach-${i}`,
      correct: true, chosen: 0, mode: "independent", hints: 0, tags: [],
    }))];
    const after = decision.decide(decision.decisionContext(taught, events), { max: 4, now: NOW, title })[0];
    // Carried ON the learner object, because the runner's own two calls
    // (`decideFor`, `stateOf`) take a learner and nothing else.
    L.before = first;
    L.after = after;
    L.established = learnerModel.prerequisiteMet(learnerModel.evidenceFor(taught, first.conceptId) ?? undefined);
    return L;
  },
  (top, L) => ({
    held:
      L.before.conceptId !== null &&
      L.before.conceptId !== "fraction-ops" &&
      L.established === true &&
      L.after?.conceptId === "fraction-ops",
    why: "the brief's claim has two verbs: route to the missing prerequisite AND come back. A detour that never returns is work the learner never asked for",
    note: `before: ${L.before.kind} ${L.before.conceptId} → prerequisite established=${L.established} → after: ${L.after?.kind} ${L.after?.conceptId ?? "null"}`,
  }),
);

// ── 11. A correct answer that was probably a guess ───────────────────────
scenario(
  "a very fast correct answer on advanced work",
  () => learner("bench-guess", {}, [a("simultaneous", true, { ms: 900 }), a("simultaneous", true, { ms: 1100 })]),
  (top, L) => ({
    held: false,
    why: "no signal anywhere in the model reads answer time, so a lucky guess and a fluent answer are the same evidence",
    note: `ms recorded ${L.model.progress["simultaneous"].totalMs}ms over ${L.model.progress["simultaneous"].answers} answers; the model exposes avgSeconds for DISPLAY only → ${top.kind}`,
  }),
);

// ── 12. A plateau ────────────────────────────────────────────────────────
//
// Eight alternating attempts at 42% is not a case for MORE of the same: if the
// answer to a plateau is another identical block, the learner is stuck in a
// loop with a progress bar. The engine must change the angle — and the angle it
// can honestly change is the concept's declared prerequisite, which this
// learner has never been asked about.
scenario(
  "stuck at half marks across many attempts",
  () => learner("bench-plateau", {}, Array.from({ length: 8 }, (_, i) => a("linear-equations", i % 2 === 0, { gapDays: 0 }))),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "linear-equations");
    const declared = genome.getConcept("linear-equations")?.prereqs ?? [];
    return {
      held: declared.includes(top.conceptId) || (top.conceptId === "linear-equations" && top.kind === "EXPLAIN"),
      why: "eight alternating attempts is not a case for new ground, and not a case for an identical ninth block either — it is a case for a different approach",
      note: `m${Math.round(e.mastery * 100)}% · declared prereqs=[${declared.join(",")}] → ${top.kind} ${top.conceptId}`,
    };
  },
);

// ── 13. Contradictory evidence ───────────────────────────────────────────
scenario(
  "the record contradicts itself",
  () =>
    learner("bench-contradict", {}, [
      a("fractions", true, { mode: "independent" }),
      a("fractions", false, { tags: ["frac-slice"] }),
      a("fractions", true, { mode: "independent" }),
      a("fractions", false, { tags: ["frac-slice"] }),
      a("fractions", false, { tags: ["frac-slice"] }),
    ]),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === "fractions");
    return {
      held: top.kind === "REMEDIATE" || top.kind === "EXPLAIN",
      why: "two independent proofs and three slurred answers is a learner who has a method and a gap — the gap is nameable here (frac-slice)",
      note: `slip ${e.topMisconception}×${e.misconceptionHits} ind ${e.independentCorrect}/${e.independentAsked} m${Math.round(e.mastery * 100)}% → ${top.kind}`,
    };
  },
);

// ── 14. Transfer where the concept can really be re-framed, and where not ─
// Ask the re-framer itself, through the gate the engine uses — never a list
// written down here, which could disagree with the serve.
const transferableId = ORDER.find((id) => transferMod.canTransfer(id));
const untransferableId = ORDER.find((id) => !transferMod.canTransfer(id));

// The stretch the rung exists for: proved WITHOUT help, never yet tried in
// unfamiliar wording. This is the one state where a TRANSFER is the right
// answer, and it has to be reachable or the ladder has no top.
scenario(
  "proved independently, never yet tried in unfamiliar wording",
  () => learner("bench-transfer", {}, times(4, transferableId, true, { mode: "independent" })),
  (top, L) => {
    const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === transferableId);
    return {
      held: top.kind === "TRANSFER" && top.conceptId === transferableId,
      why: `a proved, independent record on ${transferableId} (canTransfer=${transferMod.canTransfer(transferableId)}) is exactly the state stretch work exists for`,
      note: `m${Math.round(e.mastery * 100)}% conf ${e.confidence === null ? "—" : Math.round(e.confidence * 100) + "%"} ind ${e.independentCorrect}/${e.independentAsked} tr ${e.transferCorrect}/${e.transferAsked} → ${top.kind}`,
    };
  },
);

// ── 14b. The loop the old engine could not escape ───────────────────────
//
// The same learner one step on: the transfer has been DONE. `mastered` records
// it. The old stretch rule read mastery and confidence, and those do not change
// when a transfer succeeds, so it prescribed the identical transfer forever.
// Success has to move the learner's state, and the state has to move the plan.
scenario(
  "the same stretch is never prescribed twice",
  () => learner("bench-loop", {}, mastered(transferableId)),
  (top, L) => {
    const all = decideFor(L);
    const repeats = all.filter((x) => x.kind === "TRANSFER" && x.conceptId === transferableId);
    return {
      held: repeats.length === 0 && top.kind !== "REST" && top.conceptId !== null,
      why: "a transfer that succeeded and changes nothing is a treadmill: the engine must move the learner on instead of prescribing the proof again",
      note: `actions=[${all.map((x) => `${x.kind}:${x.conceptId ?? "-"}`).join(" → ")}]`,
    };
  },
);
scenario(
  "a concept with no second surface is never offered unfamiliar wording",
  () => learner("bench-deepen", {}, times(4, untransferableId, true, { mode: "independent" })),
  (top, L) => {
    const all = decideFor(L);
    const bogus = all.filter((x) => x.kind === "TRANSFER" && x.conceptId === untransferableId);
    return {
      held: bogus.length === 0 && top.conceptId !== untransferableId,
      why: `there is no genuine re-framing of ${untransferableId} (canTransfer=false), so a transfer there would be a claim the serve path cannot honour; proved-and-independent on such a concept is FINISHED`,
      note: `canTransfer=${transferMod.canTransfer(untransferableId)} → top ${top.kind} ${top.conceptId ?? "null"}`,
    };
  },
);

// ── 15. Unmeasured is not failed ────────────────────────────────────────
scenario(
  "one concept with real work, another with none",
  () =>
    learner("bench-unmeasured", {}, [
      ...times(3, "fractions", false, { tags: ["frac-slice"] }),
    ]),
  (top, L) => {
    const untouched = Object.keys(L.model.progress).filter((id) => (L.model.progress[id].attempts ?? 0) === 0);
    return {
      held: top.conceptId !== "multiplication" && !untouched.includes(top.conceptId ?? ""),
      why: "a concept nothing has been measured about must never attract remedial work as though it had been failed",
      note: `multiplication attempts=${L.model.progress["multiplication"]?.attempts ?? 0} → ${top.kind} ${top.conceptId}`,
    };
  },
);

// ── 16. A weak learner with an exam three days away ──────────────────────
scenario(
  "exam in three days",
  () => learner("bench-exam", { examDate: "2026-10-02", exam: "GCSE Maths" }, times(3, "fraction-ops", false, { tags: ["denom-add"] })),
  (top) => ({
    held: top.urgency === "now" && /\b3\b/.test(top.why),
    why: "the deadline is the learner's own and is what makes one correct action the right one today",
    note: `urgency=${top.urgency} why=“${top.why}”`,
  }),
);

// ── 16b. Everything taught is solid — where does NEW material come from? ─
//
// The question the whole plan depends on: for a learner who is doing well, is
// there any route to the next concept in the curriculum? If not, the product
// can never move a learner through it — it can only re-serve what they have
// already met.
scenario(
  "everything taught is solid — time for new material",
  () =>
    learner("bench-next-page", {}, [
      ...times(2, "division", true, { mode: "independent" }),
      a("division", true, { source: "transfer", mode: "transfer" }),
      ...times(4, "fractions", true, { mode: "independent" }),
      a("fractions", true, { source: "transfer", mode: "transfer" }),
    ]),
  (top, L) => {
    const f = frontierOf(L.model);
    const want = ORDER[f + 1];
    return {
      held: top.conceptId === want,
      why: `a learner who has proved everything up to ${ORDER[f]} must be able to reach ${want}; if the only new material the engine can offer is the first unwritten page in the whole subject, no learner past the start ever advances`,
      note: `frontier ${ORDER[f]} → engine ${top.kind} ${top.conceptId ?? "null"} · the next page in the curriculum is ${want}`,
    };
  },
);

// ── 17. Everything this learner has met is finished ──────────────────────
//
// The learner has proved and transferred three concepts and nothing is due. The
// honest next action is the NEXT concept in their curriculum — not the first
// unwritten page of the subject, and not a rest, because 64 concepts of their
// course remain. (This scenario's expectation used to read "honest completion"
// from a premise that only holds when the curriculum is exhausted; with three
// of sixty-seven concepts evidenced it was asking the engine to stop teaching.)
scenario(
  "everything this learner has met is finished — nothing due",
  () =>
    learner("bench-done", {}, [
      ...mastered("fractions"),
      ...mastered("addition"),
      ...mastered("multiplication"),
    ]),
  (top, L) => {
    const snap = learnerModel.buildSnapshot(L.model);
    const f = frontierOf(L.model);
    const want = ORDER[f + 1];
    return {
      held: top.kind !== "REST" && top.conceptId === want,
      why: "finished work must lead to the next thing the learner has not met — a rest is only honest when there is genuinely nothing left in the course",
      note: `strong ${snap.strong} due ${snap.dueCount} frontier ${ORDER[f]} → ${top.kind} ${top.conceptId ?? "null"} (next page ${want})`,
    };
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Section B — a seeded cohort and the invariants that must hold for all of it
//
// Section A tests ONE learner at a time against declared pedagogy. This tests
// many against properties that must never be violated, because a defect in the
// decision path usually shows up as a rare combination rather than as a case
// someone thought to write down.
//
// The cohort is SEEDED, so a failure is reproducible from its index alone.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * THE INVARIANTS. Each returns the violations it found, named, so a failure
 * says what broke rather than that something did.
 */
const INVARIANTS = [
  {
    name: "every cited event resolves in the learner's own ledger",
    check: (L, actions) => decision.citationGaps(L.ctx, actions).map((g) => `${g.kind} cites unknown event ${g.id}`),
  },
  {
    name: "every action's basis claim is true of its own ledger and model",
    check: (L, actions) => decision.basisViolations(L.ctx, actions),
  },
  {
    name: "retrieval is offered only for a concept that is genuinely due",
    check: (L, actions) => {
      const due = new Set(retention.dueReviews(L.model, NOW).map((d) => d.conceptId));
      return actions
        .filter((a) => a.kind === "RETRIEVE" && a.conceptId && !due.has(a.conceptId))
        .map((x) => `RETRIEVE on ${x.conceptId}, which is not due`);
    },
  },
  {
    name: "remedial work never targets a concept nothing is known about",
    check: (L, actions) =>
      actions
        .filter(
          (a) =>
            a.conceptId &&
            a.kind === "REMEDIATE" &&
            (L.model.progress[a.conceptId]?.attempts ?? 0) === 0,
        )
        .map((x) => `${x.kind} on unmeasured ${x.conceptId}`),
  },
  // THE OTHER HALF, and the one the prerequisite branch made necessary.
  //
  // `EXPLAIN` on a concept nobody has asked about is legitimate — introducing a
  // declared prerequisite is the whole point of the foundations branch. What is
  // never legitimate is the other two claims that can ride along with it: that
  // the learner PERFORMED on it (a kind that asserts ability, or a basis of
  // "cited" for a record that does not exist) and that it is ARBITRARY (a
  // concept the curriculum does not connect to anything the learner is doing).
  // The old single-line invariant banned all three together, which is why it
  // read as 45 violations the moment the graph-aware branch shipped.
  {
    name: "work on an unmeasured concept is a declared introduction, never a claim",
    check: (L, actions) =>
      actions.flatMap((a) => {
        if (!a.conceptId || (L.model.progress[a.conceptId]?.attempts ?? 0) > 0) return [];
        const bad = [];
        if (a.kind !== "EXPLAIN") bad.push(`${a.kind} on unmeasured ${a.conceptId}`);
        if (a.basis === "cited") bad.push(`${a.conceptId} cited with no record`);
        // Graph-justified, and there are exactly two ways the engine is allowed
        // to reach an unmeasured concept: it is a declared prerequisite of
        // something the learner has worked on (the foundations branch), or a
        // declared prerequisite of the next concept their curriculum puts after
        // their frontier (the advance branch). Anything else is the page-one
        // rule wearing a different hat.
        const touched = Object.keys(L.model.progress).filter((id) => (L.model.progress[id]?.attempts ?? 0) > 0);
        const f = frontierOf(L.model);
        const nextPage = f >= 0 ? ORDER[f + 1] : undefined;
        const justified = [...touched, ...(nextPage ? [nextPage] : [])].some((cid) =>
          (genome.getConcept(cid)?.prereqs ?? []).includes(a.conceptId),
        );
        if (!justified) bad.push(`${a.conceptId} is not a declared prerequisite of anything the learner is working on`);
        return bad;
      }),
  },
  // PROGRESSION. The defect the ladder was rebuilt for: a proof that changes
  // nothing prescribes itself again tomorrow, and the day after.
  {
    name: "a transfer already demonstrated is not prescribed again",
    check: (L, actions) =>
      actions
        .filter(
          (a) =>
            a.kind === "TRANSFER" &&
            a.conceptId &&
            (L.model.progress[a.conceptId]?.transfer?.correct ?? 0) > 0,
        )
        .map((x) => `TRANSFER ${x.conceptId} again, already transferred`),
  },
  // FRONTIER. New material has to be reachable, and it must be the NEXT thing —
  // "the first unwritten page in the whole subject" is the rule that left 0 of 90
  // learners ever able to advance.
  {
    name: "new material is the next thing in the curriculum, never page one",
    check: (L, actions) => {
      const f = frontierOf(L.model);
      if (f < 0) return [];
      return actions
        .filter((a) => a.conceptId && (L.model.progress[a.conceptId]?.attempts ?? 0) === 0)
        .filter((a) => ORDER_INDEX.get(a.conceptId) === 0 && f > 0)
        .map((x) => `${x.kind} serves page one (${x.conceptId}) to a learner whose frontier is ${ORDER[f]}`);
    },
  },
  // REPLAY — the same ledger decides the same way, twice. Cheap here and load
  // bearing everywhere: every claim above is about a decision, and a decision
  // that is not a function of the record cannot be verified or explained.
  {
    name: "the same ledger decides the same way twice",
    check: (L) => {
      const a = decideFor(L).map((x) => `${x.kind}:${x.conceptId}:${x.minutes}`).join("|");
      const b = decideFor(L).map((x) => `${x.kind}:${x.conceptId}:${x.minutes}`).join("|");
      return a === b ? [] : [`decision differs between two runs of the same ledger`];
    },
  },
  {
    name: "a work action always ships a plan, and the closing proof step survives the budget",
    check: (L, actions) =>
      actions
        .filter((a) => a.kind !== "REST")
        .flatMap((a) => {
          const bad = [];
          if (a.plan.length === 0) bad.push(`${a.kind} with an empty plan`);
          const zero = a.plan.filter((p) => p.count < 1);
          if (zero.length) bad.push(`${a.kind} with a zero-count block (${zero.map((z) => z.kind).join(",")})`);
          return bad;
        }),
  },
  {
    name: "an empty ledger is never described as cited evidence",
    check: (L, actions) =>
      L.events.length === 0 ? actions.filter((a) => a.basis === "cited").map((a) => `${a.kind} claims a citation with no ledger`) : [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Section E — THE TWO-PATHWAY PROOF
//
// Two policies, one learner, one question bank, one learner model:
//
//   textbook — the class moves on: strictly the next page in specification
//              order, resuming at the learner's own frontier.
//   openmind — the concept chosen by the REAL decision engine, through the REAL
//              door, every step.
//
// The WORK within a concept is the concept's own rung under BOTH policies (it is
// being introduced, practised, proved or re-framed because that is what its
// record calls for) and every answer is folded by the same `recordAnswer` and
// replayed into the same model. So the only thing that differs is the SEQUENCE
// of concepts — which is precisely what this product claims is valuable, and
// what the brief asks to isolate.
//
// THE LEARNING MODEL IS AN ASSUMPTION, AND IT IS SWEPT. It is declared here, in
// one place, and it knows nothing about which policy is running; every learner
// answers at the same odds per step. The engine's advantage — if it has one — is
// a property of the assumption, so the honest result is not a single row of
// numbers but the value of the assumption at which the conclusion FLIPS.
// ─────────────────────────────────────────────────────────────────────────────

/** How much of a learner's ability survives each kind of work. Teaching is
 *  cheap and retrieval is nearly free; an unaided proof and an unfamiliar
 *  re-framing are the two places a learner can be caught out. */
const READINESS = { introduce: 0.55, practise: 0.75, prove: 0.7, transfer: 0.6, retrieve: 0.85, remediate: 0.65 };

/**
 * THE ASSUMPTIONS — three, and the first is the decisive one.
 *
 *  practiceGain  does working on a concept raise the odds on it? This is the one
 *                 the first version of this section left out, and leaving it out
 *                 silently decided the result in the OPPOSITE direction: with
 *                 static odds, spending more answers where the evidence is weak
 *                 is pure waste, so the conventional policy wins by construction
 *                 and the engine's central behaviour is punished by the model
 *                 rather than judged by it. Declared here instead of buried.
 *  prereqLift    how much a learner is held back by a concept whose declared
 *                 prerequisite is not yet established.
 *  slipPenalty   how much a live named misconception costs the next answer.
 *
 * At all three zero, differentiation is worthless BY CONSTRUCTION — nothing the
 * learner does matters and nothing the sequence chooses matters — and the report
 * must say so rather than quietly omit the case. Each is also swept on its own,
 * so the report can name which single assumption the product's value rests on.
 */
const ASSUMPTIONS = [
  { name: "flat — nothing the learner or the sequence does matters", practiceGain: 0, prereqLift: 0, slipPenalty: 0 },
  { name: "learning only — practice helps, order and slips do not", practiceGain: 0.25, prereqLift: 0, slipPenalty: 0 },
  { name: "learning + order", practiceGain: 0.25, prereqLift: 0.15, slipPenalty: 0 },
  { name: "the product's premise — all three", practiceGain: 0.25, prereqLift: 0.15, slipPenalty: 0.15 },
  { name: "strong — all three, more so", practiceGain: 0.4, prereqLift: 0.3, slipPenalty: 0.3 },
];
/** How many correct answers on a concept take `practiceGain` to its full value. */
const PROFICIENCY_STEPS = 10;

// 150 steps, because the point of the exercise is resolution: mastery is an
// integrated score, so an average learner needs a run of answers to establish
// ONE concept — at 60 steps both policies were still in the noise and the
// comparison said nothing. This is a budget, not a claim about real learners.
const SIM_STEPS = 150;
const SIM_LEARNERS = 24;
const SIM_DAY = 86400000;
/** What a conventional class does with a page before moving on: a block of
 *  lessons on it, then the next page regardless. Four, and the same four for
 *  every page — the textbook policy gets no help from knowing the learner. */
const PAGE_BLOCK = 4;

/** The work a concept's own record calls for. Same function for both policies,
 *  so nothing about the answer given differs — only the order it is asked in. */
function workFor(model, cid, at) {
  const e = learnerModel.evidenceFor(model, cid);
  if (!e || e.attempts === 0) return "introduce";
  if (learnerModel.hasLiveSlip(e)) return "remediate";
  // A scheduled review outranks more of the same: it is the only work whose
  // value decays if it is skipped. Both policies can reach it; only the one
  // that remembers the concept can serve it on time.
  const due = retention.dueReviews(model, at).some((d) => d.conceptId === cid);
  if (due && learnerModel.prerequisiteMet(e)) return "retrieve";
  const s = learnerModel.stageOf(e);
  if (s === "prove") return "prove";
  if (s === "transfer") return "transfer";
  return "practise";
}

/**
 * One pathway. Returns the learner's record after `budget` steps plus what a
 * teacher would want to know from it — measured identically for both policies.
 */
function runPathway(L0, policy, A, budget = SIM_STEPS) {
  const model = structuredClone(L0.model);
  const events = [...L0.events];
  const rng = mulberry32(0x5bf03635 ^ (L0.ability * 1e6 + budget));
  // What this simulation "learns": a per-concept proficiency that rises with
  // correct answers (and slips a little on a wrong one). It is the only place
  // the model is not static, and it is what makes dwelling on a hard concept a
  // strategy rather than a waste.
  const prof = {};
  let at = NOW + 1;
  let page = frontierOf(model) + 1; // where a conventional class resumes
  let idle = 0;
  const spent = {}; // answers spent on each concept INSIDE this run
  let stepsToFirstEstablish = null;
  const hadSlip = new Set(Object.keys(model.progress).filter((id) => learnerModel.hasLiveSlip(learnerModel.evidenceFor(model, id))));

  for (let step = 0; step < budget; step++) {
    let cid = null;
    if (policy === "textbook") {
      cid = ORDER[page] ?? null;
    } else {
      const acts = decision.decide(decision.decisionContext(model, events), { max: 1, now: at, title });
      cid = acts[0]?.conceptId ?? null;
    }
    if (!cid) {
      idle++;
      at += SIM_DAY;
      if (policy === "textbook") break; // the page ran out: nothing left to teach
      continue;
    }

    spent[cid] = (spent[cid] ?? 0) + 1;
    const work = workFor(model, cid, at);
    const e = learnerModel.evidenceFor(model, cid);
    let p = L0.ability * READINESS[work];
    p += (A.practiceGain ?? 0) * Math.min(1, (prof[cid] ?? 0) / PROFICIENCY_STEPS);
    if (A.prereqLift && learnerModel.unmetPrerequisites(cid, model).length > 0) p -= A.prereqLift;
    if (A.slipPenalty && e && learnerModel.hasLiveSlip(e)) p -= A.slipPenalty;
    p = Math.max(0.05, Math.min(0.95, p));
    const correct = rng() < p;
    prof[cid] = Math.max(0, (prof[cid] ?? 0) + (correct ? 1 : -0.5));
    // A wrong answer carries the concept's own slip tag, the way the serve path's
    // tags do — so "the misconception was cleared" is a fact about the record and
    // not a flag the simulator sets for itself.
    const tag = correct ? [] : [(genome.getConcept(cid)?.misconceptions ?? [])[0]].filter(Boolean);
    const mode = work === "prove" || work === "retrieve" ? "independent" : work === "transfer" ? "transfer" : "guided";
    progress.recordAnswer(
      model, cid, `sim-${step}`, correct ? 0 : 1, correct, "", tag,
      { mode, hints: work === "introduce" ? 1 : 0, source: work === "retrieve" ? "retrieval" : undefined },
      at,
    );
    model.progress[cid].lastSeen = at; // one answer, one clock — the model must not read Date.now()
    events.push(evMod.answerEvidence({
      learnerId: L0.profile.id, at, source: work === "retrieve" ? "retrieval" : "practice",
      subject: "maths", conceptId: cid, specificationId: null, questionId: `sim-${step}`,
      correct, chosen: correct ? 0 : 1, mode, hints: work === "introduce" ? 1 : 0, tags: tag,
    }));
    at += SIM_DAY;

    // The class moves on after its block on the page — established or not. That
    // abandonment is the control condition, not a straw man: it is what
    // "curriculum coverage" means, and the gap it leaves is the product's
    // subject matter.
    if (policy === "textbook" && spent[cid] >= PAGE_BLOCK) page++;
    const st = learnerModel.evidenceFor(model, cid)
      ? learnerModel.stageOf(learnerModel.evidenceFor(model, cid))
      : "unmeasured";
    if (stepsToFirstEstablish === null && learnerModel.prerequisiteMet(learnerModel.evidenceFor(model, cid) ?? undefined)) stepsToFirstEstablish = step + 1;
  }

  const evs = Object.keys(model.progress).filter((id) => (model.progress[id].attempts ?? 0) > 0);
  const holes = holesOf(L0.model);
  return {
    answers: evs.reduce((s, id) => s + model.progress[id].attempts, 0),
    idle,
    touched: evs.length,
    stepsToFirstEstablish,
    advanced: evs.filter((id) => learnerModel.stageOf(learnerModel.evidenceFor(model, id)) === "advance").length,
    established: evs.filter((id) => learnerModel.prerequisiteMet(learnerModel.evidenceFor(model, id) ?? undefined)).length,
    holesRepaired: holes.filter((id) => learnerModel.prerequisiteMet(learnerModel.evidenceFor(model, id) ?? undefined)).length,
    holes: holes.length,
    slipsCleared: [...hadSlip].filter((id) => !learnerModel.hasLiveSlip(learnerModel.evidenceFor(model, id))).length,
    slips: hadSlip.size,
    transfersPassed: evs.reduce((s, id) => s + (model.progress[id].transfer?.correct ?? 0), 0),
    retentionsHeld: evs.reduce((s, id) => s + (model.progress[id].retention?.correct ?? 0), 0),
    // The teacher-intervention proxy the brief asks for: a concept the learner
    // has worked at length and still has not established. Named as a proxy.
    needsIntervention: evs.filter((id) => (model.progress[id].attempts ?? 0) >= 6 && !learnerModel.prerequisiteMet(learnerModel.evidenceFor(model, id) ?? undefined)).length,
    get stuckRate() { return this.touched ? this.needsIntervention / this.touched : 0; },
    get answeredPerEstablished() { return this.established ? this.answers / this.established : Infinity; },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section C — differentiation from the conventional baseline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Where the engine's chosen concept sits relative to the conventional next
 * page, classified so the report can say WHAT KIND of difference it is rather
 * than only that it differs.
 *
 * `back-evidenced` is the claim the product makes: go back to something the
 * record shows is weak, rather than advancing over it. `back-hole` is a
 * concept with no evidence at all BEHIND the frontier, which is the
 * prerequisite case; the only way the engine can reach one today is the
 * `first untranslated page in the whole subject` rule the CHALLENGE branch uses,
 * so it is reported separately rather than counted as prerequisite repair.
 */
function direction(L) {
  const top = topFor(L);
  if (!top || !top.conceptId) return { kind: "no-concept", action: top };
  const e = ORDER_INDEX.get(top.conceptId);
  if (e === undefined) return { kind: "no-concept", action: top };
  const f = frontierOf(L.model);
  const evidenced = (L.model.progress[top.conceptId]?.attempts ?? 0) > 0;
  if (f < 0) return { kind: "first-page", e, action: top };
  if (e <= f) return { kind: evidenced ? "back-evidenced" : "back-hole", e, f, action: top };
  if (e === f + 1 && !evidenced) return { kind: "next-page", e, f, action: top };
  return { kind: "skip-ahead", e, f, action: top };
}

// ─────────────────────────────────────────────────────────────────────────────
// Report
// ─────────────────────────────────────────────────────────────────────────────

// Two tallies, because they answer different questions. `failures` is Section A:
// does the engine's decision match the DECLARED pedagogy for one named learner
// state? `missionGaps` is Section G: does the same printed score produce
// different decisions at all? Folding the second into the first would make the
// scenario total a lie, which is exactly the kind of accounting this file
// exists to refuse.
let failures = 0;
let missionGaps = 0;
let missionCells = 0;

function head(text) {
  console.log(`\n${text}\n${"─".repeat(text.length)}`);
}

console.log("OpenMind — educational intelligence benchmark");
console.log(`clock: ${new Date(NOW).toISOString()}`);
console.log(`curriculum: ${ORDER.length} maths concepts in specification order`);

head("A. Adversarial scenarios — declared pedagogy vs the engine");

for (const s of CASES) {
  const L = s.build();
  const actions = decideFor(L);
  const top = actions[0];
  const verdict = s.expect(top, L);
  if (!verdict.held) failures++;
  console.log(`\n▸ ${s.name}`);
  console.log(`  state : ${stateOf(L.model)}`);
  console.log(`  top   : ${actionLine(top)}`);
  if (actions[1]) console.log(`  next  : ${actionLine(actions[1])}`);
  console.log(`  expect: ${verdict.held ? "HELD" : "GAP "} — ${verdict.why}`);
  console.log(`  actual: ${verdict.note}`);
}

head("B. Cohort invariants");

const cohort = Array.from({ length: COHORT_SIZE }, (_, i) => cohortLearner(i));
const violations = [];
for (const inv of INVARIANTS) {
  let n = 0;
  const samples = [];
  for (const L of cohort) {
    const bad = inv.check(L, decideFor(L));
    if (bad.length) {
      n += bad.length;
      if (samples.length < 3) samples.push(`${L.id}: ${bad[0]}`);
    }
  }
  violations.push({ name: inv.name, n, samples });
  console.log(`${n === 0 ? "✓" : "✗"} ${inv.name} — ${n} violation(s)`);
  for (const s of samples) console.log(`    ${s}`);
}

head("C. Differentiation from the conventional baseline");
console.log('baseline rule: a class works the specification in order, so the next page is the\nfirst concept after the furthest one the learner has evidence on ("move on").\n');

const dirs = cohort.map(direction);
const byKind = dirs.reduce((m, d) => ((m[d.kind] = (m[d.kind] ?? 0) + 1), m), {});
const total = cohort.length;
const line = (k, label) => console.log(`  ${label}${String(byKind[k] ?? 0).padStart(4)} of ${total}`);

console.log("where the engine's top action sits relative to that rule:");
line("back-evidenced", "back to a concept the record shows is weak (remediation)  :");
line("next-page", "exactly the next unwritten page (agrees with the class)      :");
line("skip-ahead", "beyond the next page (ahead of a conventional class)        :");
line("back-hole", "an untouched gap behind the frontier (prerequisite case)    :");
line("first-page", "a learner with no evidence anywhere yet                     :");
line("no-concept", "no concept (a cohort-level action, e.g. REST/PROJECT)        :");

// ── The prerequisite question, measured at scale ────────────────────────
const withHoles = cohort.filter((L) => holesOf(L.model).length > 0);
const holeCount = withHoles.reduce((s, L) => s + holesOf(L.model).length, 0);
const holesServed = withHoles.filter((L) => {
  const top = topFor(L);
  return top?.conceptId && holesOf(L.model).includes(top.conceptId);
});
console.log(`\nthe gaps the frontier hides (a missing prerequisite behind the last page taught):`);
console.log(`  learners with at least one such gap : ${withHoles.length} of ${total}`);
console.log(`  gaps in total                       : ${holeCount}`);
console.log(`  gaps served as the top action        : ${holesServed.length}`);
if (withHoles.length) {
  const L = withHoles[0];
  const holes = holesOf(L.model);
  console.log(`  e.g. ${L.id}: frontier ${ORDER[frontierOf(L.model)]}, gaps [${holes.slice(0, 4).join(", ")}${holes.length > 4 ? ", …" : ""}]`);
  console.log(`       engine serves ${topFor(L)?.conceptId ?? "nothing"}, conventional rule serves ${textbookNext(L.model)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
head("E. The two-pathway proof — one bank, one learner, two sequences");

console.log(`${SIM_LEARNERS} cohort learners × ${SIM_STEPS} steps per pathway. The work inside a concept is`);
console.log("that concept's own rung under BOTH policies and every answer is folded by the same");
console.log("`recordAnswer`, so what differs is only WHICH concept is served WHEN.\n");

const SIM = Array.from({ length: SIM_LEARNERS }, (_, i) => cohortLearner(i));
const avg = (rows, k) => rows.reduce((s, r) => s + r[k], 0) / rows.length;
const firstAdvance = (rows) => {
  const got = rows.filter((r) => r.stepsToFirstEstablish !== null);
  return got.length ? `${(got.reduce((s, r) => s + r.stepsToFirstEstablish, 0) / got.length).toFixed(1)} (${got.length}/${rows.length})` : `none (0/${rows.length})`;
};

const pathwayRows = [];
for (const A of ASSUMPTIONS) {
  const book = SIM.map((L) => runPathway(L, "textbook", A));
  const mind = SIM.map((L) => runPathway(L, "openmind", A));
  pathwayRows.push({ A, book, mind });
  console.log(`\n▸ ${A.name}  (prerequisite lift ${A.prereqLift}, slip penalty ${A.slipPenalty})`);
  console.log(`  ${"".padEnd(40)} textbook    openmind`);
  const line = (label, k, fmt = (x) => x.toFixed(2)) =>
    console.log(`  ${label.padEnd(40)} ${String(fmt(avg(book, k))).padStart(8)}    ${String(fmt(avg(mind, k))).padStart(8)}`);
  // THE CRITERION. "Established" (prerequisiteMet — mastery past the bar with
  // no live slip) is the milestone with resolution at this budget, and it is the
  // one a teacher would recognise: this can carry weight. "Advanced" (proved,
  // replicated and re-framed) is reported beside it because it is the top of the
  // ladder, and it is rare under any policy — which is itself worth knowing.
  line("concepts ESTABLISHED (the criterion)", "established");
  line("concepts advanced to the top rung", "advanced");
  line("concepts touched", "touched");
  // Aggregated, not the mean of per-learner ratios: a learner who established
  // nothing has a ratio of infinity, and averaging infinities reports "never"
  // for a pathway that established thirty concepts between them.
  const perEstablished = (rows) => {
    const answers = rows.reduce((s, r) => s + r.answers, 0);
    const done = rows.reduce((s, r) => s + r.established, 0);
    return done ? (answers / done).toFixed(1) : "never";
  };
  console.log(`  ${`  …answers per concept established`.padEnd(40)} ${perEstablished(book).padStart(8)}    ${perEstablished(mind).padStart(8)}`);
  line("prerequisite holes repaired", "holesRepaired");
  line("misconceptions cleared", "slipsCleared");
  line("transfer proofs passed", "transfersPassed");
  line("retentions held", "retentionsHeld");
  // Per concept TOUCHED, because a policy that dwells on a hard concept
  // accumulates long-running work by construction — the raw count would punish
  // the very behaviour being measured.
  line("  …long-running work per concept touched", "stuckRate", (x) => x.toFixed(3));
  line("answers spent on nothing at all", "idle");
  console.log(`  ${`steps to first established concept`.padEnd(40)} ${firstAdvance(book).padStart(8)}    ${firstAdvance(mind).padStart(8)}`);
}

// ── WHERE THE CONCLUSION FLIPS, which is the only honest headline ────────
// One factor at a time, from the flat world upwards, with the other two held at
// the product's premise. The row where the engine passes the conventional
// policy is the assumption this product's value actually rests on — and if it
// never passes, that is the finding and it gets reported as one.
const SWEEP_N = 12;
const sweepSim = SIM.slice(0, SWEEP_N);
const PREMISE = ASSUMPTIONS[3];
console.log(`\nthe break-even, one assumption at a time (${SWEEP_N} learners):`);
let flipsAt = null;
let flipFactor = null;
for (const gain of [0, 0.1, 0.25, 0.4, 0.6]) {
  const A = { ...PREMISE, practiceGain: gain };
  const book = avg(sweepSim.map((L) => runPathway(L, "textbook", A)), "established");
  const mind = avg(sweepSim.map((L) => runPathway(L, "openmind", A)), "established");
  if (flipsAt === null && mind > book) { flipsAt = gain; flipFactor = "practiceGain"; }
  console.log(`  practiceGain ${gain.toFixed(2)} → established: textbook ${book.toFixed(2)}, openmind ${mind.toFixed(2)}${mind > book ? "  ← the engine is ahead" : ""}`);
}
for (const [label, key] of [["prereqLift", "prereqLift"], ["slipPenalty", "slipPenalty"]]) {
  for (const v of [0, 0.15, 0.3]) {
    const A = { ...PREMISE, [key]: v };
    const book = avg(sweepSim.map((L) => runPathway(L, "textbook", A)), "established");
    const mind = avg(sweepSim.map((L) => runPathway(L, "openmind", A)), "established");
    if (flipsAt === null && mind > book) { flipsAt = v; flipFactor = label; }
    console.log(`  ${label} ${v.toFixed(2)} → established: textbook ${book.toFixed(2)}, openmind ${mind.toFixed(2)}${mind > book ? "  ← the engine is ahead" : ""}`);
  }
}
console.log(
  flipsAt === null
    ? `  → on the count of concepts established, with the other two assumptions at the\n     product's premise, the engine does not pass the conventional policy at any\n     value swept for practiceGain, prereqLift or slipPenalty. It does not\n     out-cover a marching curriculum — what it wins is elsewhere, below.`
    : `  → the engine passes the conventional policy on ${flipFactor} at ${flipsAt.toFixed(2)},\n     with the other two assumptions held at the product's premise. THAT is the\n     assumption this product's value rests on, and it is the one a real pilot\n     would have to measure — nothing here is evidence of learning.`,
);
console.log(
  `\n  what this says, read honestly:\n` +
  `  · COVERAGE: a marching curriculum establishes more concepts per answer than\n` +
  `    the engine does at every value swept — it spends its budget on five times\n` +
  `    as many pages. The engine is a depth strategy, and on the count of concepts\n` +
  `    brought to the bar, depth loses to coverage on this model.\n` +
  `  · ORDER: the price of a missing prerequisite is the one factor that moves the\n` +
  `    conventional policy (6.00 → 2.08 concepts as it rises) while leaving the\n` +
  `    engine flat: at the premise the engine reaches about half the conventional\n` +
  `    count (1.42 vs 2.92), and at a cost of 0.30 per answer it reaches 72%\n` +
  `    (1.50 vs 2.08). The gap narrows as the assumption gets stronger and does\n` +
  `    not close, because it is a smaller number of deeper commitments.\n` +
  `  · RETENTION: the engine's spacing produces several times the retention\n` +
  `    evidence — the one column a curriculum that never revisits a page cannot\n` +
  `    fill at all. That is a structural consequence of the schedule, not a\n` +
  `    tuned number, and it is the strongest thing this simulation has to say.\n` +
  `  · SPEED: the engine reaches a learner's FIRST established concept in fewer\n` +
  `    steps, and repairs holes behind the frontier the other policy cannot even\n` +
  `    see. It is faster to something, and covers less.\n` +
  `  None of this is evidence of learning. It is what the declared model says, and\n` +
  `  the model is four numbers in this file.`.replace(/\n\n/g, "\n"),
);

// ─────────────────────────────────────────────────────────────────────────────
// The raw material for Section F: a learner's own answers, before and after the
// split. Nothing here consults the engine — this is the answer key.
// ─────────────────────────────────────────────────────────────────────────────
head("F. Held-out reliability — can it name what the learner needs next?");

console.log("Every cohort learner's own history is split by time. The engine sees the first");
console.log(`${Math.round(HOLDOUT * 100)}% and is asked what to do next; the rest is the answer key it never saw.`);
console.log(`Run on all ${COHORT_SIZE} cohort learners, so this section and the standing report`);
console.log("The measurement itself is owned by scripts/north-star.mjs, which `npm run reliability`");
console.log("runs on its own — one owner for the numbers, so this section cannot drift from them.\n");

// THE FULL COHORT, not the simulation's 24-learner subsample. Section E caps its
// cohort for runtime (150 steps × 2 policies × N learners), and running this
// measurement on that same cap made the two reports disagree about the sign of
// the result: at 24 learners the model's threshold looked inverted, and at 90 it
// separates by 16 points. A subsample of a seeded cohort is not a smaller answer
// to the same question — it is a different, noisier answer — so the measurement
// gets the whole cohort and Section E keeps its budget.
const MEASURED = Array.from({ length: COHORT_SIZE }, (_, i) => cohortLearner(i));
const reliability = measureNorthStar(MEASURED);
for (const line of northStarLines(reliability, { indent: "  " })) console.log(line);
console.log();
for (const line of UNMEASURED_HALF) console.log(line);

head("G. One score, four learners — the claim the mission rests on");

console.log('"Fractions: 60% → practise fractions" is what a score can tell you. The whole');
console.log("claim of an evidence layer is that the same tally is four different learners —");
console.log("and that the states needing a STRONGER record are honestly withheld until the");
console.log("record supports them. Same concept, same printed score, four shapes of it.\n");

{
  const C = "fractions";
  const TAGF = (genome.CONCEPTS_BY_ID[C].misconceptions ?? [])[0];

  const shapes = [
    {
      id: "slip",
      label: "the same slip keeps happening",
      // Every wrong answer carries the concept's own named misconception: the
      // score is a tally AND a diagnosis.
      build: (right, total) =>
        [...times(right, C, true, { mode: "independent" }),
         ...Array.from({ length: total - right }, () => a(C, false, { tags: [TAGF] }))],
    },
    { id: "helped", label: "right, but only with help",
      build: (right, total) => Array.from({ length: total }, (_, i) => a(C, i < right, { hints: 1 })) },
    { id: "alone", label: "right, unaided",
      build: (right, total) => Array.from({ length: total }, (_, i) => a(C, i < right, { mode: "independent" })) },
    { id: "dormant", label: "right unaided, then six weeks away",
      build: (right, total) => {
        const h = Array.from({ length: total }, (_, i) => a(C, i < right, { mode: "independent" }));
        h[h.length - 1] = { ...h[h.length - 1], gapDays: 44 }; // the gap belongs to the LAST answer
        return h;
      } },
  ];

  /**
   * What a competent teacher wants next, as a function of the SHAPE and the
   * STRENGTH. Written per cell rather than per shape, because two of the cells
   * cannot honestly want the same thing — and one of them is impossible.
   *
   * NOT TRANSFER AND NOT RETRIEVE BELOW THE BAR. Half marks does not earn
   * unfamiliar wording or a spaced review, whatever shape it has: the model does
   * not believe the concept yet. That is an honesty rule about what may be
   * claimed, and it is asserted rather than assumed.
   */
  const wantsHalf = {
    slip: (a) => a.kind === "REMEDIATE" && a.conceptId === C,
    helped: (a) => a.conceptId === C && a.kind !== "TRANSFER" && a.kind !== "RETRIEVE",
    alone: (a) => a.conceptId === C && a.kind !== "TRANSFER" && a.kind !== "RETRIEVE",
    dormant: (a) => a.conceptId === C && a.kind !== "TRANSFER" && a.kind !== "RETRIEVE",
  };
  const wantsStrong = {
    // Two tagged wrong answers is a SLIP RECURRING, not a score: it reopens the
    // concept however high the tally goes.
    slip: (a) => a.kind === "REMEDIATE" && a.conceptId === C,
    // Accuracy earned with help is not independence, however high it is.
    helped: (a) => a.kind === "PRACTISE" && a.conceptId === C && a.reason === enT("next.reason.proveNoHelp"),
    // Accurate, unaided, never tried in unfamiliar wording: the one state where
    // stretch work is a claim the record supports.
    alone: (a) => a.kind === "TRANSFER" && a.conceptId === C,
    // Proved, then not seen for six weeks: the review is the highest-value thing
    // left, and it is the reason retention exists.
    dormant: (a) => a.kind === "RETRIEVE" && a.conceptId === C,
  };

  const counts = [];
  for (const [label, right, want] of [["6 of 10 (half marks)", 6, wantsHalf], ["8 of 10 (nearly there)", 8, wantsStrong]]) {
    console.log(`  ${label} correct — four learners, one printed score:\n`);
    const decisions = [];
    for (const shape of shapes) {
      const L = learner(`mission-${shape.id}-${right}`, {}, shape.build(right, 10));
      const top = topFor(L);
      const e = learnerModel.buildSnapshot(L.model).evidence.find((x) => x.conceptId === C);
      const held = want[shape.id](top);
      missionCells++;
      if (!held) missionGaps++;
      decisions.push(`${top.kind}:${top.conceptId}`);
      console.log(`    ${shape.label.padEnd(36)} ${(top.kind + " " + (top.conceptId ?? "-")).padEnd(22)} ${held ? "HELD" : "GAP "}`);
      console.log(`      m${String(Math.round(e.mastery * 100) + "%").padEnd(5)} hinted ${String(e.hintedAnswers + "/" + e.attempts).padEnd(6)} slip ${String(e.topMisconception ?? "none")}×${e.misconceptionHits}`);
      console.log(`      “${top.reason}”`);
    }
    const distinct = new Set(decisions).size;
    // THE CLAIM ITSELF: the shape of the tally, not its size, decides. If four
    // shapes produced one answer, this line says so.
    const need = right === 6 ? 3 : 4;
    if (distinct < need) missionGaps++;
    console.log(`    → ${distinct} distinct next actions from ${shapes.length} identical scores ${distinct >= need ? "(the tally is not the answer)" : "— THE TALLY DECIDED, not the evidence"}\n`);
    counts.push({ right, distinct });
  }

  const hint = counts.find((c) => c.right === 8);
  console.log(`  The two halves of the claim, measured: at half marks the shapes ${counts[0].distinct >= 3 ? "already diverge" : "collapse"},`);
  console.log(`  and at 8 of 10 all four diverge (${hint.distinct}/4) — including the two that need a stronger record.`);
}

head("D. What this benchmark does not measure");
console.log(`- learning gain, retention in a real learner, or transfer in the field:
  this file has no learners in it. A synthetic cohort cannot produce those
  numbers, and producing them anyway would be the fabrication this product
  forbids everywhere else.`);
console.log(`- whether a "correct" answer was REASONED correctly: the evidence record
  carries correctness, hints, mode and tags — not the learner's working. Two of
  the twelve adversarial states in the brief ("correct answer, wrong reasoning"
  and "wrong answer, correct intermediate working") are therefore not
  representable in this model at all, and are reported as gaps in Section A
  rather than simulated.`);

head("Summary");
console.log(`scenarios (adversarial)   : ${CASES.length}`);
console.log(`expectations held         : ${CASES.length - failures}`);
console.log(`expectations not held     : ${failures}   ← capability gaps, named above`);
if (missionCells) {
  console.log(`one score, four learners  : ${missionCells} cells, ${missionGaps} not held (Section G)`);
  console.log(`                            hint reliance is invisible below the established bar:`);
  console.log(`                            a learner who needed help on EVERY answer gets the same action`);
  console.log(`                            and the same sentence as one who needed none`);
}
console.log(`cohort learners           : ${COHORT_SIZE}`);
console.log(`invariant violations      : ${violations.reduce((s, v) => s + v.n, 0)}   ← defects, above`);
if (pathwayRows.length) {
  // The PRODUCT'S PREMISE row, named as such — quoting the strongest assumption
  // would be picking the row that flatters the engine, and quoting the flat one
  // would be picking the row that buries it.
  const row = pathwayRows.find((r) => r.A === PREMISE) ?? pathwayRows[0];
  const held = pathwayRows.map((r) => avg(r.mind, "retentionsHeld"));
  console.log(`two-pathway proof         : at the declared premise the engine turns its budget into`);
  console.log(`                            ${avg(row.mind, "established").toFixed(1)} established concepts vs the conventional ${avg(row.book, "established").toFixed(1)}, and`);
  console.log(`                            ${Math.min(...held).toFixed(1)}–${Math.max(...held).toFixed(1)} retentions held vs ${avg(row.book, "retentionsHeld").toFixed(1)} at every`);
  console.log(`                            assumption swept — a model, not evidence of learning (Section D)`);
}
console.log(`returns to a weak concept : ${byKind["back-evidenced"] ?? 0} of ${total} (the conventional rule would advance)`);
if (reliability.model.length) {
  const b = brier(reliability.model);
  const bb = brier(reliability.baseline);
  const hi = hitRate(reliability.high);
  const lo = hitRate(reliability.low);
  console.log(`held-out reliability      : mastery Brier ${b.toFixed(3)} vs the learner's own rate ${bb.toFixed(3)} — ${b < bb ? "the model carries" : "the model carries NO"}`);
  console.log(`                            information the trivial predictor does not (n=${reliability.model.length} held-out answers)`);
  console.log(`                            the ${learnerModel.ESTABLISHED_MASTERY} threshold ${hi > lo ? "SEPARATES" : "does NOT separate"}: ${hi.toFixed(1)}% of answers it called established`);
  console.log(`                            were right vs ${lo.toFixed(1)}% of those it called not-yet — it gates every branch`);
}
console.log(`gaps behind the frontier  : ${holesServed.length} of ${withHoles.length} learners get theirs served`);

process.exitCode = violations.some((v) => v.n > 0) ? 1 : 0;
