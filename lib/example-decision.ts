// ─────────────────────────────────────────────────────────────────────────────
// THE WORKED EXAMPLE (landing page).
//
// The landing page argues that every recommendation is traceable to a recorded
// answer. The only way to argue that honestly is to SHOW one — so the page's
// centrepiece is not a headline about the product, it is the product: a real
// decision, composed by the real engine (lib/decision.ts over lib/next-engine.ts)
// from a real ledger, and labelled as the record it is.
//
// Why it is built here rather than written into the page:
//
//   · a hand-written example is a claim that goes stale. When the engine's
//     sentences change, or the ladder gains a rung, a paragraph in JSX keeps
//     describing the old product. This cannot: if the engine changes its mind
//     about what a learner like this needs, the front page changes with it;
//   · it inherits the i18n for free. The card is composed from `next.*` keys
//     that all fifteen dictionaries already carry, so the hero is translated
//     everywhere the rest of the product is, with no second copy of the copy;
//   · it is a DECISION, not a screenshot. The card carries the same four fields
//     a learner sees on Home — kind, reason, evidence, why — because those are
//     the fields the engine is accountable for.
//
// DETERMINISM IS LOAD-BEARING. The page is a client component, so this runs on
// the server during prerender and again in the browser on hydration; a clock or
// a random id would make the two disagree and React would report a hydration
// mismatch. Every timestamp and event id is fixed and `createdAt` is pinned, so
// the fold and the decision are pure functions of the record below — the same
// card on every render, in every language.
//
// The record is the most ordinary interesting case there is: a learner who can
// do the steps but keeps making the SAME slip. That is the case a percentage
// cannot describe and this product can, which is what the page must demonstrate.
// ─────────────────────────────────────────────────────────────────────────────

import { ctitle } from "./content-i18n";
import { decisionContext, decide } from "./decision";
import { answerEvidence, type AnswerSubmitted } from "./evidence";
import { getConcept } from "./genome";
import { newProfileState } from "./learner-profile";
import { buildSnapshot } from "./learner-model";
import { MISCONCEPTIONS_BY_ID } from "./misconceptions";
import { replayModel } from "./replay";
import type { NextT } from "./next-engine";

/** The concept the example works on: the one where a slip is legible to anyone
 *  reading — a parent, a teacher, a student — without any maths. */
const CONCEPT = "fraction-ops";
/** "Adds denominators": the canonical fraction misconception. Named here only
 *  so the record can TAG the wrong answers; the sentence the page shows comes
 *  from the catalogue through the engine, in the learner's language. */
const SLIP = "denom-add";

/** A fixed Monday morning. Nothing about the example depends on today. */
const EXAMPLE_NOW = Date.UTC(2026, 0, 12, 9, 0, 0);
const MINUTE = 60 * 1000;

/**
 * The example learner's six answers, oldest first. Read as a story, because that
 * is how the engine reads it: two right (one with help), then the slip appears,
 * then a clean one, then the slip twice more in a row.
 */
const RECORD: ReadonlyArray<{ correct: boolean; hints: number; minute: number }> = [
  { correct: true, hints: 0, minute: -55 },
  { correct: true, hints: 1, minute: -48 },
  { correct: false, hints: 1, minute: -40 },
  { correct: true, hints: 0, minute: -32 },
  { correct: false, hints: 0, minute: -24 },
  { correct: false, hints: 1, minute: -15 },
];

/** The profile the record is folded onto, built by the SAME constructor the
 *  server uses for a new learner — so the example cannot drift from the shape a
 *  real account has. `timePerDay` is stated because the engine sizes its plan
 *  to the learner's own day, and an example plan that did not fit a stated day
 *  would be a plan no learner could do. */
const PROFILE = newProfileState("example-learner", {
  country: "GB",
  birthYear: 2010,
  subjects: ["maths"],
  timePerDay: 15,
  createdAt: EXAMPLE_NOW,
}).profile;

/** The ledger, minted once. Ids are fixed strings rather than `newEvidenceId()`
 *  so the projection is byte-identical between the server render and the
 *  client's — see the determinism note above. */
const EVENTS: readonly AnswerSubmitted[] = RECORD.map((r, i) =>
  answerEvidence({
    id: `example-answer-${i + 1}`,
    learnerId: PROFILE.id,
    at: EXAMPLE_NOW + r.minute * MINUTE,
    source: "practice",
    subject: "maths",
    conceptId: CONCEPT,
    specificationId: null,
    questionId: `${CONCEPT}-${i + 1}`,
    correct: r.correct,
    chosen: r.correct ? 0 : 1,
    // The route's own rule, restated rather than invented: an answer that took a
    // hint is `guided`, and only a hint-free one can count as independence.
    mode: r.hints > 0 ? "guided" : "independent",
    hints: r.hints,
    tags: r.correct ? [] : [SLIP],
  }),
);

/** The four things the engine counted for this concept, in the order a reader
 *  meets them: how much was done, how much was right, how much needed help, and
 *  how often the same slip came back. */
export type ExampleFactId = "attempts" | "correct" | "helped" | "slip";

export interface ExampleFact {
  id: ExampleFactId;
  /** The figure, read from the folded model — never a number written for the
   *  page. */
  value: number;
}

export interface ExampleDecision {
  conceptId: string;
  /** The concept's name in the caller's language. */
  concept: string;
  /** How long the action would take. There is deliberately no `kind` field:
   *  the raw kind is an English enum (EXPLAIN, REMEDIATE) no dictionary can
   *  translate, which is why Home renders the translated verb inside the title
   *  and a `next.eyebrow` label instead — the landing card follows the same
   *  rule, so a reader in Arabic sees no English token. */
  minutes: number;
  title: string;
  reason: string;
  evidence: string;
  why: string;
  /** How many recorded answers this decision stands on — the engine's own
   *  citation count, as a figure a reader can check. */
  cited: number;
  /** The answer the decision is ABOUT: the slip the learner's most recent wrong
   *  answer was tagged with. Shown so the chain "this sentence ← that answer"
   *  is visible rather than asserted.
   *
   *  It carries the SLIP and not the question id. A raw item id
   *  (`fraction-ops-6`) is an internal handle with no meaning to a reader, and
   *  putting one in front of a visitor — or a student — is the same mistake as
   *  printing a database key on a marketing page. The slip name is the part a
   *  human can actually act on. */
  decider: { slip: string } | null;
  /** What the engine has recorded for this concept, as labelled figures. */
  facts: ExampleFact[];
}

/**
 * One decision, from the real engine, for the example record.
 *
 * `t` is the caller's translator and `lang` its language, so both the engine's
 * sentences and the concept's name come out in the reader's own language — the
 * same contract every other surface uses. The result is memo-friendly: pure,
 * and identical for identical arguments.
 */
export function exampleDecision(lang: string, t: NextT): ExampleDecision | null {
  const concept = getConcept(CONCEPT);
  if (!concept) return null;

  // The model IS the projection of the ledger — the same relationship the server
  // maintains — so the example cannot show a card its own record does not
  // support.
  const model = replayModel(EVENTS, PROFILE.id, undefined, PROFILE);
  const action = decide(decisionContext(model, EVENTS), {
    max: 1,
    tt: t,
    now: EXAMPLE_NOW,
    title: (id) => ctitle(lang, id),
  })[0];
  if (!action) return null;

  const ev = buildSnapshot(model).evidence.find((e) => e.conceptId === CONCEPT);
  const progress = model.progress[CONCEPT];
  const wrong = [...EVENTS].reverse().find((e) => e.conceptId === CONCEPT && !e.correct);
  const slipId = wrong?.tags?.[0];
  const slip = slipId ? (MISCONCEPTIONS_BY_ID[slipId]?.name ?? slipId) : null;

  return {
    conceptId: CONCEPT,
    concept: ctitle(lang, CONCEPT),
    minutes: action.minutes,
    title: action.title,
    reason: action.reason,
    evidence: action.evidence,
    why: action.why,
    cited: action.evidenceIds.length,
    decider: slip ? { slip } : null,
    facts: [
      { id: "attempts", value: progress?.attempts ?? 0 },
      { id: "correct", value: progress?.correct ?? 0 },
      { id: "helped", value: progress?.hinted ?? 0 },
      { id: "slip", value: ev?.misconceptionHits ?? 0 },
    ],
  };
}
