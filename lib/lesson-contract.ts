import type { SubjectId } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// THE AUTHORED LESSON CONTRACT — one standard, in code, that a lesson either
// meets or does not.
//
// The defect this module exists for: OpenMind could show a concept's genome
// paragraph, a lens, and a list of misconceptions, and call the result a
// lesson. Nothing in that assembly teaches a learner who has never met the
// idea — there is no diagnostic, no reasoning behind the worked step, no
// practice that teaches before it tests, and no assessment that asks for
// evidence rather than a click.
//
// So the contract is deliberately NOT a shape a generator can satisfy from
// metadata. Every part below is a thing a learner needs in order to move from
// confusion to independent demonstration, and every part is separately
// addressable so a reviewer can say which one is missing.
//
// THREE SEPARATIONS ARE STRUCTURAL, not conventions:
//   1. learner-visible content vs ANSWER KEYS. A key handed to the screen is a
//      key a mistaken call can leak; `assessment[].modelAnswer` and
//      `marking` live in the same record but the renderer must not print them
//      before the learner has answered (see app/api/worked-example/route.ts
//      for the same rule applied to the serve).
//   2. SOURCE PROVENANCE vs teaching. A citation is not permission: every
//      `provenance` entry names its rights basis and what was reproduced, and
//      "none" is the honest value for an OpenMind-authored lesson.
//   3. AUTHORSHIP vs APPROVAL. `authors` records who wrote it — including
//      "ai-assisted-drafted", because an AI draft is a draft. `reviews` and
//      `learnerTesting` are the only routes to the higher rungs, and they
//      require a named human and a date. No code path may fill them.
//
// VERSIONING. `contract` pins the version so a lesson written against an older
// standard is visible rather than silently grandfathered. The gate refuses a
// lesson whose version it does not know.
// ─────────────────────────────────────────────────────────────────────────────

export const LESSON_CONTRACT_VERSION = "openmind.lesson/1.0" as const;

/** The review ladder. A lesson may only claim the rung it has actually reached.
 *  `needs_revision` is a FINDING, not a rung: a reviewer sets it, and it can be
 *  set on a lesson at any rung. */
export const LESSON_LADDER = [
  "metadata_only",
  "outline",
  "draft",
  "machine_checked",
  "educator_reviewed",
  "learner_tested",
  "published",
] as const;

export type LessonRung = (typeof LESSON_LADDER)[number];
export type LessonStatus = LessonRung | "needs_revision";

/** Ordered rank, used by one question only: has this lesson claimed a rung
 *  above the evidence? There is no other reader, on purpose — a score would
 *  invite averaging, and averaging is how a factual error hides behind a good
 *  overall mark. */
export const LESSON_RANK: Readonly<Record<LessonRung, number>> = {
  metadata_only: 0,
  outline: 1,
  draft: 2,
  machine_checked: 3,
  educator_reviewed: 4,
  learner_tested: 5,
  published: 6,
};

/** The eleven parts every lesson must have. Named individually so a gap names
 *  itself, both to a reviewer and to the gate. */
export type LessonPart =
  | "objectives"
  | "priorKnowledge"
  | "introduction"
  | "explanation"
  | "representations"
  | "workedExamples"
  | "misconceptions"
  | "guidedPractice"
  | "assessment"
  | "transfer"
  | "retrieval";

export const LESSON_PARTS: readonly LessonPart[] = [
  "objectives",
  "priorKnowledge",
  "introduction",
  "explanation",
  "representations",
  "workedExamples",
  "misconceptions",
  "guidedPractice",
  "assessment",
  "transfer",
  "retrieval",
];

/** Subject-specific block kinds. A Mathematics lesson draws an area model; a
 *  Computing lesson runs a trace. Forcing both into one "diagram" type is how a
 *  Computing lesson becomes a Maths lesson with different words. */
export type BlockKind =
  | "maths.expression"
  | "maths.number-line"
  | "maths.area-model"
  | "maths.graph"
  | "maths.proof"
  | "physics.equation"
  | "physics.units"
  | "physics.model"
  | "physics.graph"
  | "physics.experiment"
  | "chemistry.equation"
  | "chemistry.formula"
  | "chemistry.particle-model"
  | "chemistry.calculation"
  | "biology.structure-function"
  | "biology.process"
  | "biology.diagram"
  | "biology.experiment"
  | "computing.code"
  | "computing.trace"
  | "computing.test"
  | "computing.debug";

export interface LessonBlock {
  /** Unique inside its lesson; the gate refuses a duplicate. */
  readonly id: string;
  readonly kind: BlockKind;
  /** What the learner reads. Prose, not notation. */
  readonly body: string;
  /** The payload the renderer draws: an expression, an equation, a code
   *  listing, a trace. Kept apart from `body` so a code listing's `*` is not
   *  formatted as mathematics — the same split lib/prompt.ts makes. */
  readonly notation?: string;
  /** The words that make the picture teach something. Required when the block
   *  has notation; a diagram with no caption is decoration. */
  readonly caption?: string;
}

export interface DiagnosticQuestion {
  readonly id: string;
  readonly question: string;
  /** The answer the check expects, in words. Not a mark — this is the teacher's
   *  (or the page's) way of knowing whether to go back. */
  readonly answer: string;
  /** Concept ids the check probes. Must exist in the genome. */
  readonly targets: readonly string[];
}

export interface WorkedExample {
  readonly id: string;
  readonly prompt: string;
  /** One entry per move. `why` is not optional: a worked example that shows the
   *  move without the reason is the thing this whole standard replaces. */
  readonly steps: readonly { readonly move: string; readonly why: string }[];
  readonly answer: string;
}

export interface MisconceptionTeaching {
  readonly id: string;
  /** The wrong belief, in the learner's own words. */
  readonly belief: string;
  /** Why it fails — never "that is just the rule". */
  readonly whyItFails: string;
  /** The correct reasoning, stated as reasoning. */
  readonly correction: string;
  /** A contrast pair a learner can hold side by side. */
  readonly contrast: { readonly wrong: string; readonly right: string };
}

export interface GuidedPractice {
  readonly id: string;
  readonly prompt: string;
  /** A hint that moves the learner one step, not the answer. */
  readonly hint: string;
  readonly answer: string;
  readonly feedback: { readonly correct: string; readonly incorrect: string };
}

export type AssessmentKind =
  | "short-answer"
  | "constructed-response"
  | "code"
  | "diagram";

export interface AssessmentItem {
  readonly id: string;
  readonly kind: AssessmentKind;
  readonly prompt: string;
  /** Kept with the item, withheld from the learner until they answer. */
  readonly modelAnswer: string;
  /** What earns credit. At least two criteria: a single criterion rewards a
   *  final number and cannot see the reasoning. */
  readonly marking: readonly string[];
  /** A DETERMINISTIC answer key, for the items where one exists.
   *
   *  Present only on a short-answer item whose answer is a value, a formula or
   *  a short phrase. Absent is the honest state for a constructed response: the
   *  app cannot mark prose, and lib/peer-review.ts is the standing evidence that
   *  scoring words by vocabulary produces a number that means nothing. An item
   *  without `check` is self-marked against `marking`; an item with one is
   *  graded by the server and recorded.
   *
   *  `accepted` lists equivalent spellings, not alternative answers. */
  readonly check?: { readonly accepted: readonly string[] };
}

export interface TransferChallenge {
  readonly id: string;
  readonly prompt: string;
  /** Why this is a different situation rather than the same item reworded. */
  readonly whyItTransfers: string;
  readonly answer: string;
  readonly marking: readonly string[];
}

export type RetrievalDelay = "next-day" | "week-later" | "month-later";

export interface RetrievalItem {
  readonly id: string;
  readonly prompt: string;
  readonly answer: string;
  /** Spacing is the point; a retrieval item scheduled for the same sitting is
   *  just another practice item. */
  readonly when: RetrievalDelay;
}

export type AccessibilityNeed =
  | "low-vision"
  | "screen-reader"
  | "dyslexia"
  | "motor"
  | "no-audio"
  | "colour-vision";

export interface AccessibilityAlternative {
  readonly need: AccessibilityNeed;
  readonly alternative: string;
}

/** What a source permits, and what this lesson actually took from it. */
export type ProvenanceBasis =
  | "openmind-authored"
  | "curriculum-citation"
  | "licensed-external";

export interface ProvenanceEntry {
  readonly sourceId: string;
  readonly basis: ProvenanceBasis;
  readonly licence: string;
  readonly attribution: string;
  /** `none` is the honest value for an original lesson that only cites a
   *  syllabus. A free-to-read textbook is not permission to reproduce it. */
  readonly reproduction: "none" | "quoted-short" | "adapted";
  readonly note?: string;
}

export interface AuthorRecord {
  readonly author: string;
  readonly role: string;
  readonly authoredAt: string;
  /** An AI draft is a draft. Recording the method is what keeps a machine
   *  draft from being read as a human's writing. */
  readonly method: "human" | "ai-assisted-drafted" | "ai-assisted-then-edited";
}

export interface ReviewRecord {
  readonly reviewer: string;
  readonly role: "subject-teacher" | "curriculum-lead" | "accessibility-reviewer";
  readonly date: string;
  /** What was read: "mathematics and worked examples", "whole lesson", etc. */
  readonly scope: string;
  readonly verdict: "approved" | "changes-requested";
  /** The version reviewed. A lesson edited after review is not reviewed. */
  readonly lessonVersion: string;
}

export interface LearnerTestingRecord {
  readonly date: string;
  readonly setting: string;
  readonly participants: number;
  /** What was measured. Completion is not a measure of understanding; at least
   *  one entry must name an independent assessment or a delayed retention
   *  check. */
  readonly measures: readonly string[];
  readonly findings: readonly string[];
}

export interface TranslationRecord {
  readonly language: string;
  readonly status: "none" | "machine" | "human-reviewed";
  readonly translator?: string;
  readonly reviewer?: string;
  readonly lessonVersion: string;
}

export interface AuthoredLesson {
  readonly contract: typeof LESSON_CONTRACT_VERSION;
  readonly conceptId: string;
  readonly version: string;
  readonly subject: SubjectId;
  /** The syllabus objective this teaches, named by reference — cited, never
   *  reproduced. */
  readonly curriculum: {
    readonly reference: string;
    readonly level: string;
    readonly note?: string;
  };
  readonly declaredStatus: LessonStatus;

  readonly objectives: readonly {
    readonly statement: string;
    readonly evidence: string;
  }[];
  readonly priorKnowledge: {
    readonly conceptIds: readonly string[];
    readonly check: readonly DiagnosticQuestion[];
  };
  readonly introduction: { readonly hook: string; readonly why: string };
  readonly explanation: readonly {
    readonly heading: string;
    readonly paragraphs: readonly string[];
  }[];
  readonly representations: readonly LessonBlock[];
  readonly workedExamples: readonly WorkedExample[];
  readonly misconceptions: readonly MisconceptionTeaching[];
  readonly guidedPractice: readonly GuidedPractice[];
  readonly assessment: readonly AssessmentItem[];
  readonly transfer: readonly TransferChallenge[];
  readonly retrieval: readonly RetrievalItem[];
  readonly summary: readonly string[];
  readonly accessibility: readonly AccessibilityAlternative[];

  readonly provenance: readonly ProvenanceEntry[];
  readonly authors: readonly AuthorRecord[];
  readonly reviews: readonly ReviewRecord[];
  readonly learnerTesting: readonly LearnerTestingRecord[];
  readonly translations: readonly TranslationRecord[];
}
