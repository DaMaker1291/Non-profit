// ─────────────────────────────────────────────────────────────────────────────
// THE CONTENT GRAPH — the relationships between learning objects, frozen.
//
// The repository already holds the pieces: `Concept` (lib/genome) knows its
// prerequisites and the misconceptions it targets; the demand ladder
// (lib/question-bank) defines what "recall"…"extended response" MEAN and which
// difficulty buys which band; the generators (lib/questions) are the only thing
// that can actually produce an item, and each one's real depth is MEASURED
// (`conceptDepth`), never assumed.
//
// What was missing is the layer that treats those as one graph. Two questions
// the product needs answered, and could not answer before:
//
//   1. IS THE GRAPH CONSISTENT? Every prerequisite exists and the graph has no
//      cycle; every misconception a concept claims to target exists and points
//      back at that concept; every generator belongs to the subject its concept
//      claims; every item the bank can emit carries a real answer, four unique
//      options, a difficulty inside the ladder, and misconception tags that
//      resolve. Nothing here is a new abstraction — it is the same data read
//      across the joins, so a broken reference fails `npm run content-check`
//      instead of surfacing as a wrong question to a student.
//
//   2. WHAT CAN OPENMIND ACTUALLY TEACH WITHIN ONE CONCEPT? Not "does the
//      concept exist" but which DEMAND LEVELS this bank can serve for it. That
//      answer has three parts and they are different facts:
//
//        inBank     reachable now — measured from the generator's own depths;
//        gap        reachable by this platform in general, but not for THIS
//                   concept: a content gap, and a work item, not a limit;
//        outOfBank  unreachable for every concept, because a multiple-choice
//                   item cannot be an extended written response. Naming this
//                   per concept is what stops "extended response: not measured"
//                   from reading as a fact about the learner.
//
// The distinction matters for the product, not just for tidiness: the Mind page
// may say "not yet measured", and the honest reasons for that sentence differ
// per concept. This module is what lets a surface say WHICH one it is.
// ─────────────────────────────────────────────────────────────────────────────

import { CONCEPTS, CONCEPTS_BY_ID, STAGE_NAMES } from "./genome";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import {
  SKILL_LADDER, SKILL_MIN_DIFFICULTY, SKILL_MIX, SKILLS_IN_BANK, SKILLS_NOT_IN_BANK,
  bandReachable, makeItemId, skillForDifficulty, type SkillId,
} from "./question-bank";
import { GENERATED_CONCEPT_IDS, conceptDepth, generateQuestion, generatorSubject } from "./questions";
import type { Concept, Question, StageId, SubjectId } from "./types";

/** One broken join, named so a report can be acted on without re-reading code. */
export interface GraphViolation {
  /** The relation that failed: prereq | misconception | generator | item | ladder. */
  relation: string;
  /** The object the failure is about (concept id, misconception id, question id). */
  id: string;
  detail: string;
}

/** How many seeds the item-level checks draw per concept. Deterministic. */
export const ITEM_SEEDS = 6;

/**
 * WHAT THIS BANK CAN SERVE FOR ONE CONCEPT.
 *
 * `skills` is measured per concept; `gap` and `outOfBank` are computed against
 * the platform's declaration, so a concept that cannot reach a band the bank
 * CAN reach reads as a gap rather than as an instrument limit.
 */
export interface SkillCoverage {
  conceptId: string;
  /** Deepest difficulty the generator emitted over a fixed seed sweep. */
  depth: number;
  /** Demand levels reachable for this concept right now. */
  skills: SkillId[];
  /** Reachable in the bank generally, but not for this concept. A work item. */
  gap: SkillId[];
  /** Unreachable for ANY concept (the instrument limit), named per concept. */
  outOfBank: SkillId[];
  /** True when at least one item exists at all (a concept with no generator is
   *  readable but not practisable, which is a different claim from "weak"). */
  practisable: boolean;
}

export function skillCoverage(conceptId: string): SkillCoverage | null {
  if (!CONCEPTS_BY_ID[conceptId]) return null;
  const depth = conceptDepth(conceptId);
  const practisable = depth > 0;
  const skills = SKILL_LADDER.filter((s) => bandReachable(s, depth));
  return {
    conceptId,
    depth,
    skills,
    gap: SKILLS_IN_BANK.filter((s) => !skills.includes(s)),
    outOfBank: [...SKILLS_NOT_IN_BANK],
    practisable,
  };
}

// ── Misconceptions: DETECTED, not merely declared ──────────────────────────
//
// Three tables describe which concepts a belief attaches to, and until now all
// three were hand-maintained — which is why they disagreed in 33 places.
//
//   · an ITEM's tags      (lib/questions)      — what a wrong answer can reveal
//   · the genome          (`Concept.misconceptions`) — what a concept targets
//   · the catalogue       (`Misconception.concepts`) — what the catalogue lists
//
// Only the first is MEASURED, and it is the one the product depends on:
// `microdiag.buildFlare` serves its verification probe on a concept from
// `m.concepts`, and `gradeMicroCheck` re-derives that exact probe — so a
// catalogue that lists a concept whose items never discriminate the belief
// promises a check that cannot test it. Symmetrically, a concept that declares
// a belief its items never reveal is claiming to repair something it cannot
// observe.
//
// So both declarations are checked against DETECTION, and the fix is always
// mechanical: tag the variant that genuinely tests the belief, or stop
// declaring it.

/** How many draws per generated concept the tag measurement makes.
 *
 *  Generators choose their variant from a seeded RNG, so this is a
 *  deterministic measurement rather than a flaky sample — the same draws at
 *  every run. Sized so a variant that appears once in twenty draws is still
 *  seen (the chance of missing it is 0.03% at 160 draws): a detector that only
 *  fires on one draw in twenty is a detector the product will rarely use, but
 *  it must still count as existing. */
export const TAG_SWEEP = 160;

/** The misconception tags a concept's OWN items emit, over the sweep. Sorted,
 *  so the value is comparable across calls. */
export function measuredTags(conceptId: string, draws = TAG_SWEEP): string[] {
  const seen = new Set<string>();
  for (let i = 0; i < draws; i++) {
    const q = generateQuestion(conceptId, `tags:${i}`);
    if (!q) continue;
    for (const tag of q.misconceptionTags) seen.add(tag);
  }
  return [...seen].sort();
}

/** Belief → the concepts whose items can REVEAL it, in genome order. The
 *  measured ground truth both declaration tables are judged against. */
export function tagDetection(draws = TAG_SWEEP): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of CONCEPTS) {
    if (!GENERATED_CONCEPT_IDS.includes(c.id)) continue;
    for (const tag of measuredTags(c.id, draws)) (out[tag] ??= []).push(c.id);
  }
  return out;
}

/** Coverage for every concept in the genome — the vertical-slice report. */
export function coverageReport(): SkillCoverage[] {
  return CONCEPTS.map((c) => skillCoverage(c.id)).filter((c): c is SkillCoverage => c !== null);
}

// ── Topics: the grouping the data already has ───────────────────────────────
//
// `Specification → Subject → Topic → Concept → Skill → Question` needs a TOPIC,
// and this repo already has exactly one honest grouping: the genome's stage
// band (a course's rough depth order, taught foundations-first, and already the
// unit the diagnostic blueprint quotas against). Inventing a second taxonomy of
// "4.3.1 Infection and response" headings would make the graph look more
// authoritative than the content is; a topic here is SUBJECT × STAGE, with a
// stable id and an i18n KEY for its name so a surface can group concepts in the
// learner's own language without a second vocabulary.

export interface ContentTopic {
  /** Stable id a surface can key on: `maths:stage-0`. */
  id: string;
  subject: SubjectId;
  stage: StageId;
  /** i18n KEY (`stage.0`…`stage.5`), rendered with `t()` — never English text. */
  nameKey: string;
  /** Concepts in genome order — the order a course teaches them. */
  conceptIds: string[];
}

export function topicId(subject: SubjectId, stage: StageId): string {
  return `${subject}:stage-${stage}`;
}

/** Every topic in the genome, grouped in genome order (subject, then stage). */
export function topicsBySubject(): ContentTopic[] {
  const out = new Map<string, ContentTopic>();
  for (const c of CONCEPTS) {
    const id = topicId(c.subject, c.stage);
    const t = out.get(id) ?? {
      id, subject: c.subject, stage: c.stage, nameKey: STAGE_NAMES[c.stage], conceptIds: [],
    };
    t.conceptIds.push(c.id);
    out.set(id, t);
  }
  return [...out.values()];
}

// ── The validator ───────────────────────────────────────────────────────────

function itemViolations(conceptId: string, out: GraphViolation[]): void {
  for (let i = 0; i < ITEM_SEEDS; i++) {
    const q: Question | null = generateQuestion(conceptId, `check:${i}`);
    if (!q) continue;
    const at = (detail: string) => out.push({ relation: "item", id: q.id, detail: `${conceptId}: ${detail}` });
    if (q.choices.length < 2) at(`only ${q.choices.length} option(s)`);
    if (new Set(q.choices).size !== q.choices.length) at("duplicate options");
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
      at(`answer index ${q.answer} outside ${q.choices.length} options`);
    }
    if (!q.explanation || q.explanation.trim().length < 10) at("missing explanation");
    if (!q.prompt || !q.prompt.trim()) at("empty prompt");
    if (!(q.difficulty >= 0 && q.difficulty <= 1)) at(`difficulty ${q.difficulty} outside [0,1]`);
    // The difficulty → demand mapping is the ladder's, so an item cannot claim a
    // band the ladder would not assign it.
    const band = skillForDifficulty(q.difficulty);
    if (!SKILL_LADDER.includes(band)) at(`difficulty maps to unknown band ${band}`);
    for (const tag of q.misconceptionTags) {
      if (!MISCONCEPTIONS_BY_ID[tag]) at(`misconception tag "${tag}" is not in the catalogue`);
    }
    if (q.conceptId !== conceptId) at(`item claims concept ${q.conceptId}`);
    // IDENTITY: an item's id is `concept:seed` and the same seed must rebuild
    // the SAME item. That is the whole reason the ledger can name a question
    // without storing its text (and why an item can be audited later), so a
    // non-deterministic generator would silently break evidence reconstruction.
    if (q.id !== makeItemId(conceptId, `check:${i}`)) at(`item id ${q.id} is not concept:seed`);
    const again = generateQuestion(conceptId, `check:${i}`);
    if (!again || again.prompt !== q.prompt || again.explanation !== q.explanation ||
        again.answer !== q.answer || again.choices.join("|") !== q.choices.join("|")) {
      at("re-drawing the same seed returned a different item");
    }
  }
}

/**
 * EVERY JOIN IN THE GRAPH, checked. Deterministic and side-effect free, so it
 * runs in `npm run content-check`, inside `npm run verify`, and in CI without a
 * server or a database.
 *
 * Deliberately NOT here: the per-item mathematical checks (does √72 really
 * simplify to 6√2?) — those need per-concept re-derivation and live in
 * `npm run verify:q`, which sweeps hundreds of draws per concept. This checks
 * the STRUCTURE that makes those checks meaningful.
 */
export function validateContentGraph(): GraphViolation[] {
  const out: GraphViolation[] = [];

  // ── Concepts: identity, text, prerequisites, stages ──────────────────────
  for (const c of CONCEPTS) {
    const at = (relation: string, detail: string) => out.push({ relation, id: c.id, detail });
    if (!c.id || !/^[a-z0-9-]+$/.test(c.id)) at("concept", `id "${c.id}" is not a stable slug`);
    if (!c.title?.trim()) at("concept", "missing title");
    if (!c.blurb?.trim()) at("concept", "missing blurb");
    if (!c.lesson?.trim()) at("concept", "missing lesson");
    if (!Number.isInteger(c.stage) || c.stage < 0 || c.stage > 5) at("concept", `stage ${c.stage} outside 0–5`);
    for (const p of c.prereqs) {
      if (!CONCEPTS_BY_ID[p]) at("prereq", `prerequisite "${p}" does not exist`);
      if (p === c.id) at("prereq", "is its own prerequisite");
    }
  }

  // Prerequisite graph must be ACYCLIC: a cycle would make the plan unreachable
  // and the "which comes first" answer meaningless.
  const cycle = findCycle();
  if (cycle) out.push({ relation: "prereq", id: cycle[0], detail: `prerequisite cycle: ${cycle.join(" → ")}` });

  // Duplicate ids would silently shadow each other in CONCEPTS_BY_ID.
  const seen = new Set<string>();
  for (const c of CONCEPTS) {
    if (seen.has(c.id)) out.push({ relation: "concept", id: c.id, detail: "duplicate concept id" });
    seen.add(c.id);
  }

  // ── Misconceptions: the catalogue's own integrity ───────────────────────
  // A concept promising to target a misconception that does not exist cannot be
  // repaired by the REMEDIATE rung later, and a half-written catalogue entry
  // gives a surface nothing to say at the moment a learner most needs it.
  for (const c of CONCEPTS) {
    for (const mid of c.misconceptions ?? []) {
      if (!MISCONCEPTIONS_BY_ID[mid]) {
        out.push({ relation: "misconception", id: mid, detail: `${c.id} targets "${mid}", which is not in the catalogue` });
      }
    }
  }
  for (const m of Object.values(MISCONCEPTIONS_BY_ID)) {
    if (!m.name?.trim() || !m.pattern?.trim() || !m.coaching?.trim()) {
      out.push({ relation: "misconception", id: m.id, detail: "incomplete catalogue entry (name/pattern/coaching)" });
    }
    for (const cid of m.concepts) {
      if (!CONCEPTS_BY_ID[cid]) {
        out.push({ relation: "misconception", id: m.id, detail: `lists concept "${cid}" which does not exist` });
      }
    }
  }

  // ── Misconceptions: DECLARED vs DETECTED (both declarations) ────────────
  const detected = tagDetection();
  for (const c of CONCEPTS) {
    if (!GENERATED_CONCEPT_IDS.includes(c.id)) continue;
    const measured = measuredTags(c.id);
    const declared = [...(c.misconceptions ?? [])].sort();
    for (const tag of declared) {
      if (!measured.includes(tag)) {
        out.push({ relation: "detection", id: `${c.id}/${tag}`, detail: `declares "${tag}" but no draw of its ${TAG_SWEEP} items targets it — tag the variant that tests the belief, or stop declaring it` });
      }
    }
    for (const tag of measured) {
      if (!declared.includes(tag)) {
        out.push({ relation: "detection", id: `${c.id}/${tag}`, detail: `its items target "${tag}" but the concept does not declare it — a slip here would be recorded against a belief this concept disowns` });
      }
      if (!MISCONCEPTIONS_BY_ID[tag]) {
        out.push({ relation: "detection", id: `${c.id}/${tag}`, detail: `its items tag "${tag}", which is not in the catalogue — the evidence would be recorded with nothing to say about it` });
      }
    }
  }
  for (const m of Object.values(MISCONCEPTIONS_BY_ID)) {
    const measured = detected[m.id] ?? [];
    if (measured.length === 0) {
      out.push({ relation: "detection", id: m.id, detail: "no concept in the bank can detect this belief — author a discriminating item, or remove the entry" });
    }
    for (const cid of m.concepts) {
      if (!measured.includes(cid)) {
        out.push({ relation: "detection", id: `${m.id}/${cid}`, detail: `lists ${cid} as a home for the verification probe, but no item of ${cid} discriminates the belief — the probe could not test it` });
      }
    }
    for (const cid of measured) {
      if (!m.concepts.includes(cid)) {
        out.push({ relation: "detection", id: `${m.id}/${cid}`, detail: `${cid} can detect it but the catalogue does not list it` });
      }
    }
  }

  // ── Generators: a practisable concept must be a real concept, in its subject
  for (const cid of GENERATED_CONCEPT_IDS) {
    const c = CONCEPTS_BY_ID[cid];
    if (!c) {
      out.push({ relation: "generator", id: cid, detail: "has a generator but is not in the genome" });
      continue;
    }
    const subj = generatorSubject(cid);
    if (subj && subj !== c.subject) {
      out.push({ relation: "generator", id: cid, detail: `generator says ${subj}, genome says ${c.subject}` });
    }
    itemViolations(cid, out);
  }

  // ── The ladder itself: monotone, complete, and honestly declared ─────────
  const bounds = SKILL_LADDER.map((s) => SKILL_MIN_DIFFICULTY[s]);
  for (let i = 1; i < bounds.length; i++) {
    if (bounds[i] <= bounds[i - 1]) {
      out.push({ relation: "ladder", id: SKILL_LADDER[i], detail: `floor ${bounds[i]} is not above ${SKILL_LADDER[i - 1]}'s ${bounds[i - 1]}` });
    }
  }
  const mixTotal = SKILL_LADDER.reduce((n, s) => n + (SKILL_MIX[s] ?? 0), 0);
  if (Math.abs(mixTotal - 1) > 1e-9) {
    out.push({ relation: "ladder", id: "mix", detail: `SKILL_MIX sums to ${mixTotal}, not 1` });
  }
  for (const s of SKILLS_NOT_IN_BANK) {
    if (SKILLS_IN_BANK.includes(s)) out.push({ relation: "ladder", id: s, detail: "declared in and out of the bank" });
  }

  return out;
}

/** One prerequisite cycle, or null. Depth-first with the path retained, so the
 *  report can print the loop rather than merely assert one exists. */
function findCycle(): string[] | null {
  const WHITE = 0, GREY = 1, BLACK = 2;
  const state = new Map<string, number>();
  const path: string[] = [];
  const visit = (id: string): string[] | null => {
    state.set(id, GREY);
    path.push(id);
    for (const p of CONCEPTS_BY_ID[id]?.prereqs ?? []) {
      if (!CONCEPTS_BY_ID[p]) continue;
      const s = state.get(p) ?? WHITE;
      if (s === GREY) return [...path.slice(path.indexOf(p)), p];
      if (s === WHITE) {
        const found = visit(p);
        if (found) return found;
      }
    }
    path.pop();
    state.set(id, BLACK);
    return null;
  };
  for (const c of CONCEPTS) {
    if ((state.get(c.id) ?? WHITE) === WHITE) {
      const found = visit(c.id);
      if (found) return found;
    }
  }
  return null;
}

/** The concepts a vertical slice must cover before the slice is "complete" —
 *  named so a coverage report can say what is missing rather than listing
 *  everything. Kept as a constant here because "complete" is a content
 *  decision, not a property of the code.
 *
 *  This is the flagship GCSE Maths slice, and it is a COMMITMENT rather than a
 *  description: maths is the subject a student can take seriously today, so the
 *  concepts at the front of the course must carry a learner from recall through
 *  application and multi-step working, and the data-heavy concepts must reach
 *  the band where the answer has to be READ OUT of a table, graph or model
 *  instead of calculated from the prompt. A concept that slips out of its band
 *  fails `npm run content-check` with its own name — which is how the depth
 *  layer stays real after this change rather than becoming a claim in a
 *  README. */
export const SLICE_EXPECTATIONS: { conceptId: string; required: SkillId[] }[] = [
  // Number, algebra and geometry: the working ladder.
  { conceptId: "fractions", required: ["recall", "application", "multi_step"] },
  { conceptId: "fraction-ops", required: ["recall", "application", "multi_step"] },
  { conceptId: "percentages", required: ["recall", "application", "multi_step"] },
  { conceptId: "ratio", required: ["recall", "application", "multi_step"] },
  { conceptId: "proportion", required: ["recall", "application", "multi_step"] },
  { conceptId: "linear-equations", required: ["recall", "application", "multi_step"] },
  { conceptId: "simultaneous", required: ["recall", "application", "multi_step"] },
  { conceptId: "quadratics", required: ["recall", "application", "multi_step"] },
  { conceptId: "straight-lines", required: ["recall", "application", "multi_step"] },
  { conceptId: "pythagoras", required: ["recall", "application", "multi_step"] },
  { conceptId: "trig-ratios", required: ["recall", "application", "multi_step"] },
  { conceptId: "sequences", required: ["recall", "application", "multi_step"] },
  // Data, graphs and modelling: the interpreting ladder.
  { conceptId: "averages", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "data-charts", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "scatter-correlation", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "bounds", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "volume", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "area-perimeter", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "financial-maths", required: ["application", "multi_step", "data_interpretation"] },
  { conceptId: "proportional-graphs", required: ["application", "multi_step", "data_interpretation"] },
];

/** What a slice expectation is missing, per concept. */
export function sliceGaps(): { conceptId: string; missing: SkillId[] }[] {
  const out: { conceptId: string; missing: SkillId[] }[] = [];
  for (const want of SLICE_EXPECTATIONS) {
    const c: Concept | undefined = CONCEPTS_BY_ID[want.conceptId];
    if (!c) { out.push({ conceptId: want.conceptId, missing: want.required }); continue; }
    const cov = skillCoverage(want.conceptId);
    const missing = want.required.filter((s) => !cov?.skills.includes(s));
    if (missing.length) out.push({ conceptId: want.conceptId, missing });
  }
  return out;
}
