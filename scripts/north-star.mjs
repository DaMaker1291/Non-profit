// ─────────────────────────────────────────────────────────────────────────────
// THE NORTH-STAR MEASUREMENT — the question the whole project is judged by
//
//     "Can OpenMind reliably identify what a learner needs next, and does
//      following that recommendation measurably improve their learning?"
//
// IT HAS TWO HALVES AND THEY ARE NOT EQUALS.
//
//   · "does following it improve learning" needs real students, a baseline and
//     a delayed test. Nothing in this repository can answer it, and nothing here
//     pretends to. It stays unmeasured until a pilot measures it.
//
//   · "can it RELIABLY IDENTIFY what a learner needs next" needs no trial. It is
//     a prediction question, and prediction questions are answered the way every
//     predictor is: on evidence the system never saw. THAT is what this module
//     computes, and it is why it exists.
//
// ── The two measurements ────────────────────────────────────────────────────
//
// 1. THE LEARNER MODEL, leave-one-answer-out. For every concept with three or
//    more recorded answers, the model is rebuilt WITHOUT that concept's last
//    answer and asked to predict it. The baseline it must beat is not zero and
//    not a coin: it is the learner's own rate on that same concept, because a
//    model that cannot beat "this learner gets about 60% of these" is carrying
//    no information about the concept at all. Reported as a Brier score, plus
//    the discrimination the model's OWN threshold buys — because that threshold
//    (ESTABLISHED_MASTERY) gates prerequisiteMet, stageOf, conceptDone and every
//    branch of the decision engine, so if it does not separate answers the
//    learner gets right from ones they get wrong, nothing downstream is
//    trustworthy either.
//
// 2. THE DECISION, against the learner's own documented weakness. The plan the
//    engine produces from the first 60% of a history, checked against the
//    concepts that learner's record documents as weak (3+ answers, under half
//    right, at least two wrong). The class rule is reported beside it and
//    ALWAYS scores zero here — a page it has not reached has no record to be
//    weak in — which is the point: the two policies are not comparable on this
//    metric, so the number that matters is the engine's own correspondence.
//
// WHAT THIS CANNOT BE: the generator builds every history by walking the
// specification in order, so "where the learner actually went next" IS the
// classroom's own rule. Scoring the engine against that would be scoring it
// against the baseline — a circular test, which is why it is not used.
//
// ── Why it is its own file ──────────────────────────────────────────────────
//
// It was inside the benchmark, one section among eight, which meant no engine
// change was ever judged by it. A north-star metric that only exists as a
// paragraph in a larger report is not a standard; it is a remark. This is the
// standing instrument, `npm run reliability`, and the benchmark now delegates
// to it so there is one owner of the numbers and not two that drift.
//
// It runs on a SEEDED synthetic cohort. That makes it reproducible and it makes
// it a model: a strong result here is evidence that the mechanism is measuring
// something, never that learners learn more.
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from "node:module";
import { compileEngines } from "./compile-engines.mjs";

compileEngines();

const require = createRequire(import.meta.url);
const genome = require("../.verify/genome.js");
const evMod = require("../.verify/evidence.js");
const replay = require("../.verify/replay.js");
const decision = require("../.verify/decision.js");
const learnerProfile = require("../.verify/learner-profile.js");
const learnerModel = require("../.verify/learner-model.js");
const misconceptions = require("../.verify/misconceptions.js");

// ── The clock is an input, not the weather ──────────────────────────────────
// Retention, due dates and urgency are functions of time. A measurement reading
// `Date.now()` would give different answers on different days and could not
// distinguish "the model changed" from "the calendar moved".
export const NOW = Date.UTC(2026, 8, 29, 12, 0, 0);
/** The minute-of-answer slack, so a history whose last answer is "now" still
 *  precedes the decision. */
export const JUST_NOW = 5 * 60 * 1000;
const DAY = 86400000;

export const title = (id) => genome.getConcept(id)?.title ?? id;
/** The subject's own order: the reference the conventional baseline needs. */
export const ORDER = genome.bySubject("maths").map((c) => c.id);
export const ORDER_INDEX = new Map(ORDER.map((id, i) => [id, i]));
export const ALL_MISCONCEPTIONS = Object.keys(misconceptions.MISCONCEPTIONS_BY_ID);

/** Where each learner's history is cut: the engine sees this much of it. */
export const HOLDOUT = 0.6;

// ─────────────────────────────────────────────────────────────────────────────
// The scenario vocabulary. Shared with the benchmark so a scenario and a cohort
// learner are built by the SAME rules — two generators would let the benchmark
// and the north-star report disagree about what evidence means.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * One answer in a learner's history.
 *
 * `gapDays` is the time from THIS answer to the next, so the last answer's gap
 * is how long ago the learner last worked on the concept — the number retention
 * reads.
 *
 * `hints` rides ON THE ANSWER, which is the only place scaffolding demand can be
 * recorded and still survive: the fold counts it into `ConceptProgress.hinted`,
 * while the per-level tally the hint endpoint writes is an annotation the fold
 * does not reproduce.
 */
export function a(conceptId, correct, opts = {}) {
  const hints = opts.hints ?? 0;
  const source = opts.source ?? "practice";
  const transfer = opts.mode === "transfer" || source === "transfer";
  return {
    conceptId,
    correct,
    gapDays: opts.gapDays ?? 0,
    // THE MODE IS DERIVED, NOT CHOSEN — by the same rule the live route uses:
    //   hintCount > 0 ? "guided" : isTransfer && transferSurface ? "transfer"
    //                 : "independent"              (app/api/progress/route.ts)
    // HINTS ARE CHECKED FIRST, and that order is what makes
    // `independentAsked === 0` mean exactly "every answer took a hint".
    mode: hints > 0 ? "guided" : transfer ? "transfer" : "independent",
    source,
    hints,
    tags: opts.tags ?? [],
    ms: opts.ms ?? null,
  };
}

/** `n` answers on one concept, all with the same shape. */
export function times(n, conceptId, correct, opts = {}) {
  return Array.from({ length: n }, () => a(conceptId, correct, opts));
}

/**
 * A learner: a declared shell (the things no event mints — subjects, exam,
 * minutes a day) plus a history, folded through the REAL fold into a model.
 *
 * Strictly increasing `at` matters: `orderEvents` breaks ties by event id and
 * `newEvidenceId` is random, so two answers in the same millisecond would fold
 * in an order that changes between runs and the measurement would stop being
 * reproducible.
 */
export function learner(id, shell, history) {
  const profile = learnerProfile.newProfileState(id, { subjects: ["maths"], timePerDay: 20, ...shell }).profile;

  // Walk BACKWARDS from now, because that is the direction the question is asked
  // in: the last answer's gap is how long ago it was.
  const at = new Array(history.length);
  let t = NOW - JUST_NOW;
  for (let i = history.length - 1; i >= 0; i--) {
    t -= history[i].gapDays * DAY;
    at[i] = t;
  }
  for (let i = 0; i < at.length; i++) at[i] -= at.length - 1 - i;

  const events = history.map((h, i) =>
    evMod.answerEvidence({
      learnerId: profile.id,
      at: at[i],
      source: h.source,
      subject: genome.getConcept(h.conceptId)?.subject ?? null,
      conceptId: h.conceptId,
      specificationId: profile.spec ?? null,
      questionId: `${h.conceptId}-${Math.round(at[i] / 1000)}`,
      correct: h.correct,
      chosen: h.correct ? 0 : 1,
      mode: h.mode,
      hints: h.hints,
      ms: h.ms,
      tags: h.tags,
    }),
  );

  const model = replay.replayModel(events, profile.id, undefined, profile);
  return { id, profile, events, model, ctx: decision.decisionContext(model, events) };
}

/** The ranked decision for a learner, through the one door. */
export function decideFor(L, opts = {}) {
  return decision.decide(L.ctx, { max: 4, now: NOW, title, ...opts });
}

export function topFor(L) {
  return decideFor(L)[0];
}

/** THE FRONTIER: the furthest concept in specification order with evidence. */
export function frontierOf(model) {
  const idx = Object.keys(model.progress)
    .filter((id) => (model.progress[id]?.attempts ?? 0) > 0)
    .map((id) => ORDER_INDEX.get(id))
    .filter((x) => x !== undefined);
  return idx.length ? Math.max(...idx) : -1;
}

// ─────────────────────────────────────────────────────────────────────────────
// The seeded cohort
// ─────────────────────────────────────────────────────────────────────────────

/** Small, fast, deterministic PRNG. Not for anything but reproducibility. */
export function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const COHORT_SIZE = 90;

/**
 * Build cohort learner `i`. Everything is drawn from the real order, the real
 * misconception catalogue and the real difficulty ladder, so a result is a
 * statement about the product rather than about a generator's imagination.
 */
export function cohortLearner(i) {
  const rng = mulberry32(0x9e3779b1 ^ (i * 2654435761));
  const start = Math.floor(rng() * (ORDER.length - 14));
  const width = 1 + Math.floor(rng() * 12);
  const last = start + width - 1;
  // "the class moved on" — some interior pages are skipped, which is what puts a
  // HOLE behind the learner's frontier. The last one is always covered, so every
  // learner has a frontier to hide gaps behind.
  const taught = [];
  for (let k = 0; k < width; k++) {
    const idx = start + k;
    if (idx !== last && rng() < 0.3) continue;
    taught.push(idx);
  }
  const bias = 0.3 + rng() * 0.68; // how often this learner is right
  const daysAgo = Math.floor(rng() * 40);
  const timePerDay = [5, 10, 15, 20, 30][Math.floor(rng() * 5)];
  const spec = rng() < 0.4 ? "uk-gcse" : null;

  const history = [];
  taught.forEach((idx, c) => {
    const cid = ORDER[idx];
    const attempts = 1 + Math.floor(rng() * 8);
    for (let k = 0; k < attempts; k++) {
      const correct = rng() < bias;
      const hints = rng() < 0.25 ? 1 + Math.floor(rng() * 2) : 0;
      const mode = hints ? "guided" : rng() < 0.35 ? "independent" : "guided";
      const tag = ALL_MISCONCEPTIONS[Math.floor(rng() * ALL_MISCONCEPTIONS.length)];
      const isLast = c === taught.length - 1 && k === attempts - 1;
      history.push(
        a(cid, correct, {
          gapDays: isLast ? daysAgo : Math.floor(rng() * 3),
          mode,
          source: rng() < 0.15 ? "retrieval" : "practice",
          hints,
          tags: correct ? [] : [tag],
          ms: rng() < 0.5 ? Math.floor(rng() * 60000) : null,
        }),
      );
    }
  });

  const L = learner(`cohort-${i}`, { timePerDay, spec, subjects: ["maths"] }, history);
  // The learner's TRUE ability, which a simulation must know and the engine must
  // not: a pathway is judged on the sequence it chose, at the same odds per step.
  L.ability = bias;
  return L;
}

// ─────────────────────────────────────────────────────────────────────────────
// The measurement
// ─────────────────────────────────────────────────────────────────────────────

const answersOf = (events) => events.filter((e) => e.type === "answer_submitted");

/** Per-concept attempts and right answers, from raw events. The answer key. */
export function outcomesBy(events) {
  const m = new Map();
  for (const e of answersOf(events)) {
    const r = m.get(e.conceptId) ?? { n: 0, ok: 0 };
    r.n += 1;
    if (e.correct) r.ok += 1;
    m.set(e.conceptId, r);
  }
  return m;
}

export const brier = (rows) =>
  rows.length ? rows.reduce((s, r) => s + (r.p - r.o) ** 2, 0) / rows.length : NaN;
export const hitRate = (xs) =>
  xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length) * 100 : NaN;

/**
 * Run the north-star measurement over a cohort. Returns numbers only — every
 * caller formats its own way, and both callers format the SAME object, which is
 * what stops the benchmark and the standing report from disagreeing.
 */
export function measureNorthStar(cohort) {
  const r = { model: [], baseline: [], high: [], low: [], named: [], topNamed: [], recall: [], classWeak: [], learners: 0 };

  for (const L of cohort) {
    const evs = [...L.events].sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));

    // ── (1) the learner model, leave-one-answer-out ──────────────────────
    const byConcept = new Map();
    for (const e of answersOf(evs)) {
      if (!byConcept.has(e.conceptId)) byConcept.set(e.conceptId, []);
      byConcept.get(e.conceptId).push(e);
    }
    for (const [cid, list] of byConcept) {
      if (list.length < 3) continue;
      const held = list[list.length - 1];
      const rest = evs.filter((e) => e.id !== held.id);
      const model = replay.replayModel(rest, L.profile.id, undefined, L.profile);
      const e = learnerModel.evidenceFor(model, cid);
      if (!e || e.attempts === 0) continue;
      const observed = held.correct ? 1 : 0;
      const prior = list.slice(0, -1);
      const learnerRate = prior.filter((x) => x.correct).length / prior.length;
      r.model.push({ p: e.mastery, o: observed });
      r.baseline.push({ p: learnerRate, o: observed });
      // `≥ 0.65` is not a number chosen here: it IS ESTABLISHED_MASTERY, the
      // threshold every decision branch reads (learner-model.ts#prerequisiteMet).
      (e.mastery >= learnerModel.ESTABLISHED_MASTERY ? r.high : r.low).push(observed);
    }

    // ── (2) the decision, against the learner's own documented weakness ──
    const cut = Math.floor(evs.length * HOLDOUT);
    const head = evs.slice(0, cut);
    if (answersOf(head).length < 6) continue;
    const model = replay.replayModel(head, L.profile.id, undefined, L.profile);
    const at = head[head.length - 1].at + 60000;
    const acts = decision.decide(decision.decisionContext(model, head), { max: 4, now: at, title });
    const documented = [...outcomesBy(evs).entries()]
      .filter(([, o]) => o.n >= 3 && o.ok / o.n < 0.5 && o.n - o.ok >= 2)
      .map(([cid]) => cid);
    if (!documented.length) continue;
    r.learners++;
    r.named.push(acts.some((x) => x.conceptId && documented.includes(x.conceptId)) ? 1 : 0);
    r.topNamed.push(acts[0]?.conceptId && documented.includes(acts[0].conceptId) ? 1 : 0);
    r.recall.push(documented.filter((cid) => acts.some((x) => x.conceptId === cid)).length / documented.length);
    // The class rule, same question. It CANNOT score here — a page it has not
    // reached has no record to be weak in — and the zero is reported because it
    // is what makes the two policies non-comparable on this metric.
    r.classWeak.push(0);
  }

  return r;
}

/**
 * The report, as lines — one owner for what the north-star measurement SAYS, so
 * the benchmark's section and the standalone command cannot drift apart.
 */
export function northStarLines(r, { indent = "" } = {}) {
  const out = [];
  // Indent applied per LINE, and never to an empty one: a multi-line entry would
  // otherwise indent only its first line, and an indent-only line is trailing
  // whitespace. Both showed up the first time this was formatted from two callers.
  const say = (s = "") => {
    for (const part of String(s).split("\n")) out.push(part === "" ? "" : indent + part);
  };
  if (!r.model.length) {
    say("no learner had enough history to hold an answer out — this measured nothing");
    return out;
  }
  const b = brier(r.model);
  const bb = brier(r.baseline);
  say("(1) THE LEARNER MODEL, leave-one-answer-out. For every concept with 3+ answers,");
  say("    the model is rebuilt WITHOUT that concept's last answer and asked to predict it.");
  say(`    ${r.model.length} held-out answers across the cohort.\n`);
  say(`      the model's mastery predicts it    : Brier ${b.toFixed(3)}`);
  say(`      the learner's own rate on that     : Brier ${bb.toFixed(3)}   ← the bar to beat`);
  say(`      concept                            : the model ${b < bb ? "BEATS" : "does NOT beat"} it\n`);
  say("    discrimination — what the model's own threshold is worth:");
  say(`      said established (mastery ≥ ${learnerModel.ESTABLISHED_MASTERY}) : ${hitRate(r.high).toFixed(1)}% were right   (n=${r.high.length})`);
  say(`      said not yet                      : ${hitRate(r.low).toFixed(1)}% were right   (n=${r.low.length})`);
  const works = hitRate(r.high) > hitRate(r.low);
  say(`      → the threshold ${works ? "separates" : "does NOT separate"} durable from fragile answers. It gates`);
  say("        prerequisiteMet, stageOf and every branch of the decision engine, so if it");
  say("        does not separate them, nothing downstream is trustworthy either.");
  say(`\n(2) THE DECISION. The plan the engine produced from the first ${Math.round(HOLDOUT * 100)}% of each`);
  say("    history, checked against the concepts that learner's own record documents as");
  say(`    weak — a fact the plan had not seen (${r.learners} learners):\n`);
  say(`      the plan names a documented weak concept : ${hitRate(r.named).toFixed(1)}%`);
  say(`      its TOP action is one                    : ${hitRate(r.topNamed).toFixed(1)}%`);
  say(`      share of the documented weak concepts    : ${hitRate(r.recall).toFixed(1)}%`);
  say(`      the class's next page, same question     : ${hitRate(r.classWeak).toFixed(1)}%   — structurally, not by merit`);
  return out;
}

/** The second half of the north-star, said out loud rather than omitted. */
export const UNMEASURED_HALF = [
  "NOT MEASURED HERE, AND NOT MEASURABLE HERE:",
  "does following the recommendation improve learning? That needs real students, a",
  "baseline and a delayed test. This is a model, and a strong result in it is",
  "evidence that the mechanism measures something — never that learners learn more.",
];

// ─────────────────────────────────────────────────────────────────────────────
// `npm run reliability` — the standing report
// ─────────────────────────────────────────────────────────────────────────────

const invokedDirectly = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());

if (invokedDirectly) {
  const cohort = Array.from({ length: COHORT_SIZE }, (_, i) => cohortLearner(i));
  const r = measureNorthStar(cohort);
  console.log("OpenMind — the north-star measurement\n" + "─".repeat(38));
  console.log('"Can OpenMind reliably identify what a learner needs next?"\n');
  for (const line of northStarLines(r)) console.log(line);
  console.log();
  for (const line of UNMEASURED_HALF) console.log(line);
}
