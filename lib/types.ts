// ─────────────────────────────────────────────────────────────────────────────
// OpenMind — core domain types
// ─────────────────────────────────────────────────────────────────────────────

/** Subject areas OpenMind supports. */
export type SubjectId = "maths" | "physics" | "chemistry" | "biology" | "computing";

/** Stage id inside the Knowledge Genome (0 = foundations, 5 = frontier). */
export type StageId = 0 | 1 | 2 | 3 | 4 | 5;

/** Board / awarding body the student follows. Defined here (not in
 *  lib/curriculum.ts) so the country routes and the specification layer
 *  (lib/specifications.ts) cannot drift apart. */
export type BoardId =
  // South Asia
  | "cbse" | "icse" | "matric" | "state"
  // International qualifications
  | "igcse" | "cambridge" | "ib"
  // UK awarding bodies
  | "aqa" | "edexcel" | "ocr" | "wjec"
  // Africa
  | "nigerian" | "kenyan" | "caps"
  // Americas, Asia-Pacific
  | "philippine" | "bangladeshi" | "indonesian" | "brazilian" | "mexican"
  | "commoncore" | "collegeboard" | "acara" | "canadian";

/** Runtime registry for the BoardId union — the single source of truth shared
 *  by the profile API, the enrolment UI and the specification layer. Without
 *  this, each call site re-listed the ids by hand and a new board could not be
 *  saved by the very API it was added for. */
export const BOARD_IDS: BoardId[] = [
  "cbse", "icse", "matric", "state",
  "igcse", "cambridge", "ib",
  "aqa", "edexcel", "ocr", "wjec",
  "nigerian", "kenyan", "caps",
  "philippine", "bangladeshi", "indonesian", "brazilian", "mexican",
  "commoncore", "collegeboard", "acara", "canadian",
];

export function isBoardId(value: unknown): value is BoardId {
  return typeof value === "string" && (BOARD_IDS as string[]).includes(value);
}

// Compile-time guard: the union and the runtime list must stay in step.
type _BoardIdsExhaustive = Exclude<BoardId, (typeof BOARD_IDS)[number]>;
const _boardIdsCover: _BoardIdsExhaustive extends never ? true : never = true;
void _boardIdsCover;

/** Learning style preference the student finds most effective. */
export type LearningStyle = "visual" | "auditory" | "kinesthetic" | "reading-writing";

/** A node in the Knowledge Genome: one teachable atomic concept. */
export interface Concept {
  /** Canonical id, e.g. "fractions". */
  id: string;
  subject: SubjectId;
  /** Genome stage: rough depth level used for ordering and unlocking. */
  stage: StageId;
  /** Human name (English source of truth; i18n layer overlays local names). */
  title: string;
  /** One-sentence summary. */
  blurb: string;
  /** 2–4 sentence teaching explanation shown on the lesson page. */
  lesson: string;
  /** Canonical prerequisite ids (must exist in the genome). */
  prereqs: string[];
  /** Misconception catalogues that this concept explicitly targets. */
  misconceptions?: string[];
  tags?: string[];
}

/**
 * HOW A QUESTION IS ANSWERED — the one field that decides whether a surface
 * shows a row of choices or an answer box.
 *
 * Every item in the bank before this existed was `"choice"`, so the field is
 * OPTIONAL and absent means choice: a stored question, an old pack and a new
 * draw all read the same way, and no existing generator had to change.
 *
 * A numeric item keeps its `choices` as the mark-free MCQ version of the same
 * question (the same four values, shuffled), so the diagnostic ladder, the
 * papers sampler and the static twin — which are multiple-choice instruments —
 * can keep serving a numeric concept WITHOUT handing the learner an input box
 * they cannot grade. `answerValue` is the truth; `choices` is the projection.
 */
export type ResponseKind = "choice" | "numeric";

/**
 * How close a typed number must be to the canonical answer.
 *
 * A tolerance is REQUIRED for a numeric item, not defaulted: grading a typed
 * answer to the last bit of floating point would mark a learner wrong for
 * 3.14 against π, which teaches nothing except that the machine is unfair. The
 * author of the item is the only one who knows whether the answer is exact
 * (a count of iterations, a mole ratio) or approximate (a decimal computed from
 * an irrational), so the item states it rather than the grader guessing.
 */
export interface NumericTolerance {
  /** Absolute slack: |given − answer| ≤ abs. */
  abs?: number;
  /** Relative slack: |given − answer| ≤ rel × |answer| (for large magnitudes). */
  rel?: number;
  /** The unit the answer is in, shown beside the box ("cm", "g", "mol"). */
  unit?: string;
  /** How the answer should be shown when it is revealed (e.g. "0.75", "1/2").
   *  Absent = the number formatted by the shared rule. */
  display?: string;
}

/** ── A DIAGRAM, AS DATA ─────────────────────────────────────────────────────
 *
 *  Some questions cannot be asked in prose. "A pie chart shows 30° for walk"
 *  named a chart that was never drawn; "a point has x-coordinate −4 and
 *  y-coordinate 3" describes a picture; a number line is the whole method in a
 *  "5 − 18" item. Until this existed the generator could only DESCRIBE the
 *  figure, and a learner had to build it in their head before they could start.
 *
 *  The spec is deliberately DATA, not markup: a generator returns plain numbers
 *  and labels, the renderer (components/question-figure.tsx) turns them into an
 *  SVG, and the same spec survives JSON to the client, the static build and the
 *  printed pack. A generator cannot hand-write SVG, so it cannot drift from the
 *  numbers its own prompt states.
 *
 *  THE ONE RULE A GENERATOR MUST KEEP: a figure may restate the question, and
 *  it may show the tool the question is about — it may NEVER mark, label or
 *  imply the ANSWER. An item whose answer can be read off its own diagram is a
 *  broken instrument, whatever its declared difficulty says.
 *
 *  A mark's `at`, a tick or an axis value are all in the SAME units as the
 *  question's own numbers, so the figure and the stem cannot disagree. */
export type FigureSpec =
  | {
      kind: "axes"; xMin: number; xMax: number; yMin: number; yMax: number;
      /** Plotted points. A point is drawn as a POSITION, and only carries a
       *  label when the label is something the prompt already says (the
       *  origin). A point labelled with its own coordinates would BE the
       *  answer to "which coordinate pair is this?". */
      points?: AxisPoint[];
      lines?: AxisLine[];
    }
  | { kind: "pie"; /** The sector that is marked, in degrees of the 360°. */ sectorDegrees: number; label?: string }
  | {
      /** A right-angled triangle, right angle at the bottom-left, drawn to
       *  SCALE from its two legs — so the picture and the numbers cannot
       *  disagree. A side whose label is `false` is the UNKNOWN and is drawn
       *  with a `?`: the figure never states what the question asks for. */
      kind: "right-triangle"; legA: number; legB: number; unit?: string;
      labelA?: boolean; labelB?: boolean; labelC?: boolean;
    };

export interface AxisPoint {
  at: [number, number];
  label?: string;
  open?: boolean;
}

export interface AxisLine {
  from: [number, number];
  to: [number, number];
  label?: string;
  dashed?: boolean;
}

/** One generated practice question. */
export interface Question {
  id: string;
  conceptId: string;
  /** Compact difficulty 0–1. */
  difficulty: number;
  /** Prompt with $...$ maths placeholders the UI renders as-is. */
  prompt: string;
  /** Multiple-choice options; correctness via `answer`. For a numeric item these
   *  are the same values in choice form (see `responseKind`). */
  choices: string[];
  /** Index into `choices` (or index of canonical choice for type-in). */
  answer: number;
  /** Human explanation of why the answer is right. */
  explanation: string;
  /** Which misconception catalogues this question discriminates. */
  misconceptionTags: string[];
  /** How the learner answers it. Absent = "choice". */
  responseKind?: ResponseKind;
  /** The canonical answer as a NUMBER, present exactly when
   *  `responseKind === "numeric"`. `choices[answer]` is its display form. */
  answerValue?: number;
  /** How close a typed answer must be. Required on a numeric item. */
  tolerance?: NumericTolerance;
  /** The four MCQ option VALUES, aligned with `choices` by index. Present on a
   *  numeric item so a chosen option grades by value — a learner who picks the
   *  option "0.75" and a learner who types 0.75 are the same answer, and the
   *  ledger should record them the same way. */
  choiceValues?: number[];
  /** The diagram this item needs, when it needs one — drawn above the prompt by
   *  every surface that renders a question. Absent on the majority of items (a
   *  figure the question does not use is noise, not decoration). See FigureSpec
   *  for the rule a generator must keep. */
  figure?: FigureSpec;
}

export interface Misconception {
  id: string;
  /** Short English name, e.g. "Sign slip on negative coefficients". */
  name: string;
  /** What the student likely believes / does. */
  pattern: string;
  /** Targeted coaching note returned when this misconception is active. */
  coaching: string;
  /** Concepts where this misconception is most commonly seen. */
  concepts: string[];
}

/** Result of running a diagnostic for one concept. */
export interface ConceptScore {
  conceptId: string;
  /** Raw proportion correct (0–1). */
  correct: number;
  /** Bayesian-smoothed mastery in [0,1]. */
  mastery: number;
  asked: number;
  /** Hardest difficulty genuinely served — a claim's depth ceiling (audit
   *  P0-A). Optional so older stored results stay type-compatible. */
  cap?: number;
}

/** A diagnosed, personalised plan for one concept. */
export interface PathStep {
  conceptId: string;
  mastery: number;
  /** Ordered action list for this concept. */
  actions: PathAction[];
  /** Coaches note derived from detected misconceptions. */
  note?: string;
}

export type PathAction =
  | { kind: "prerequisite"; conceptId: string }
  | { kind: "learn"; conceptId: string }
  | { kind: "practice"; conceptId: string; count: number; difficulty: number }
  | { kind: "master"; conceptId: number | string; count: number; difficulty: number };

export interface DiagnosticResult {
  startedAt: number;
  answered: number;
  asked: number;
  scores: ConceptScore[];
  gaps: ConceptScore[]; // mastery < 0.65, ordered weakest-first
  strengths: ConceptScore[]; // mastery ≥ 0.85
  misconceptions: Array<{ id: string; name: string; count: number; conceptId: string }>;
  path: PathStep[];
  /** Benchmark run type (audit P0-B): "baseline" is the first matched run on
   *  a subject's anchor concepts; "retest" is a later run on the SAME anchors
   *  with parallel-form questions (same skills, different surface numbers).
   *  Legacy/quick runs are "probe" and are excluded from gain statistics. */
  kind?: "baseline" | "retest" | "probe";
  /** Concept ids actually probed (asked > 0) — benchmark comparisons use only
   *  concepts both runs directly measured, never the inherited 0.2 priors. */
  probedConcepts?: string[];
  /** What the probe can say about DEMAND LEVEL, not just about topics.
   *  `estimate.measured === false` means not measured — a different claim from
   *  a measured 0. The estimate carries its own CONFIDENCE, because 2/2 is not
   *  6/6: a surface that shows the percentage without the confidence is
   *  over-claiming. `inBank: false` marks a skill this bank cannot produce at
   *  all (extended written response is impossible from a multiple-choice item),
   *  so the UI says so rather than letting the learner assume it was assessed.
   *  Types are imported as types only, keeping types.ts a leaf module. */
  skills?: Array<{
    skill: import("./question-bank").SkillId;
    inBank: boolean;
    /** Whether this course's questions could reach the band at all — an
     *  unmeasured band says WHY (beyond the instrument, beyond the bank, or
     *  beyond what this course's questions reach). */
    reachable: boolean;
    /** The third why, and the only one that is a fact about the SITTING rather
     *  than about the learner or the bank: this band sits below the rung the
     *  sitting's own placement opened at (`openingStageFor`), and a run that
     *  answered correctly on the way up never descended to it. Shown to the
     *  learner so a deliberately-unasked band is never read as a gap in them. */
    notAsked?: boolean;
    estimate: import("./question-bank").EvidenceEstimate;
  }>;
  /** Demand bands a later concept did NOT re-prove, because the session had
   *  already demonstrated them (lib/diagnostic.ts `startingStage`). Reported so
   *  a shorter diagnostic is visibly a decision rather than a missing half. */
  skippedBands?: Array<import("./question-bank").SkillId>;
  /** What the learner said about their own knowing during the sitting, tallied
   *  before any verdict was shown. `unsureCorrect` is the number an accuracy
   *  figure cannot express: right for now, and not yet trusted by the person who
   *  got it right. Shape declared inline because types.ts is a leaf module and
   *  must not import the evidence layer. */
  certainty?: { stated: number; unsure: number; unsureCorrect: number };
}

/** The goal-first intent a student picks before anything else ("" = skipped). */
export type IntentId = "exams" | "understand" | "project" | "code" | "competition" | "life";

/** Persisted, anonymised student profile. */
export interface StudentProfile {
  id: string;
  /** Optional display handle, chosen by the learner — never minted. No real
   *  names required; undefined falls back to a neutral greeting. Teacher
   *  flows that need an identifier use the profile id, not a fabrication. */
  handle?: string; // display handle, no real names required
  /** The school or organisation a teacher teaches at. A CLASS does not carry
   *  it: a teacher with two classes at one school would otherwise store the
   *  same name twice, and the two copies would drift. Free text, teacher-set,
   *  never required — a tutor working alone has no school and is not asked. */
  school?: string;
  country: string; // ISO-3166 alpha-2, "XX" = unspecified
  birthYear: number | null;
  language: string; // interface language (menus, buttons) — BCP-47-ish tag
  /** Language explanations are taught in. Defaults to `language`. */
  teachingLang?: string;
  /** Language the student answers in. Defaults to `teachingLang`. */
  answerLang?: string;
  /** Language the student's school uses (terms kept in this language). */
  schoolLang?: string;
  /** Curriculum grade/level within their system, e.g. "Form 2". */
  grade?: string;
  /** Example context the student is familiar with (see lib/culture.ts). */
  examples?: string;
  /** Technical terms: "mixed" (English + local explanation) or "local". */
  termsMode?: "local" | "mixed";
  /** Preferred explanation length. */
  explainLen?: "short" | "full";
  /** What the learner has: textbook, worksheets, phone, internet, teacher. */
  resources?: string[];
  /** ONE SUBJECT, ONE COURSE. A learner does not sit one qualification: GCSE
   *  Maths (Foundation) alongside A-Level Physics is an ordinary combination,
   *  and a single flat `spec` cannot express it — worse, a single flat
   *  difficulty band pitches one of the two subjects at the wrong depth.
   *
   *  Keyed by subject. The flat fields below stay as the fallback so profiles
   *  enrolled before this existed keep their course, and the flat fields are
   *  also kept in step with the learner's FIRST subject (so a reader that only
   *  knows about one course — a countdown, a paper's tag — still gets a true
   *  one). Resolve through `specForProfile(profile, subject)`; never read the
   *  flat fields directly for a subject-specific decision. */
  subjectCourses?: Partial<Record<SubjectId, SubjectCourse>>;
  /** Board they follow (e.g. "cbse", "igcse"). */
  board?: BoardId;
  /** Curriculum specification being followed (lib/specifications.ts id, e.g.
   *  "uk-gcse", "in-cbse", "us-sat"). Absent = derived from country + board. */
  spec?: string;
  /** Tier within that specification (e.g. "foundation", "class10", "form4").
   *  Chooses the stage window, the difficulty band and the terminology. */
  specLevel?: string;
  /** Exam they're preparing for (e.g. "AISSCE Class 12", "KCSE Form 4"). */
  exam?: string;
  /** When that exam is sat (YYYY-MM-DD). Drives the countdown on Home and how
   *  much revision the next-step choice schedules. Absent = no date chosen. */
  examDate?: string;
  /** Minutes a day the learner can realistically study; sizes the daily plan. */
  timePerDay?: number;
  /** Set when the enrolment flow actually completed. Absent = onboarding was
   *  abandoned part-way, which the app is allowed to say out loud. */
  onboardedAt?: number;
  /** Items a diagnostic or assessment pool has already spent on this learner:
   *  item id → when it was first served. Practice items are not recorded here;
   *  re-serving a PROBE would let "you improved" mean "you remembered".
   *  Server-side only in intent, but harmless if seen — it is the learner's own
   *  record, and it is stripped by no one because it leaks nothing. */
  seenQuestions?: Record<string, number>;
  /** Learning-style preference the student finds most effective. */
  learningStyle?: LearningStyle;
  goal: string;
  /** Coarse motivation picked on the first screen; refines the dashboard. */
  intent: IntentId | "";
  subjects: SubjectId[];
  createdAt: number;
}

/** The course chosen for ONE subject: which qualification, which tier, which
 *  board, which named exam and when it is sat. Every field is optional because
 *  a learner may change one thing about one subject (the tier, say) without
 *  restating everything; anything absent falls back to the profile's flat
 *  course fields. */
export interface SubjectCourse {
  /** lib/specifications.ts id, e.g. "uk-gcse", "in-cbse", "any-independent". */
  spec?: string;
  /** Tier within that specification, e.g. "foundation", "class10", "core". */
  specLevel?: string;
  board?: BoardId;
  /** Named exam, e.g. "AISSCE Class 12", "KCSE Form 4". */
  exam?: string;
  /** YYYY-MM-DD. Drives the countdown and how much revision is scheduled. */
  examDate?: string;
}

/** An account is an email + password that owns one StudentProfile. Kept in
 *  lib/types.ts next to the profile it points at so the client and the server
 *  cannot disagree about its shape. */
export interface PublicAccount {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "org";
  createdAt: number;
  /** The learner profile this account owns. */
  profileId: string;
  /** False = the address was never proved (OpenMind ships no mail service). */
  verified: boolean;
}

/** One micro-diagnostic probe of a misconception (see lib/microdiag.ts).
 *  score is null until the student answers — never guessed. */
export interface MicroDiagState {
  misconceptionId: string;
  askedAt: number;
  answeredAt: number | null;
  /** 0–1: share of micro-checks passed. null = not yet answered. */
  score: number | null;
}

/** Everything the platform remembers about one learner's interaction with a concept. */
export interface ConceptProgress {
  attempts: number;
  correct: number;
  streak: number;
  mastery: number; // integrated evidence score in [0,1] — see lib/mastery.ts
  /** EWMA of graded-answer outcomes — the accuracy signal mastery integrates. */
  accuracy?: number;
  lastSeen: number;
  /** Misconception id -> hit count, only incremented on wrong answers. */
  misconceptions: Record<string, number>;
  /** Help level (1-4) -> times requested. Scaffolding demand is learner-model data.
   *
   *  Written by the hint endpoint itself, and — deliberately — NOT by the
   *  ledger fold: the per-answer hint count rides on the answer event, so
   *  folding it in here as well would count every hint twice. Anything that
   *  needs scaffolding demand and must survive a rebuild reads `hinted`. */
  hints?: Record<string, number>;
  /** How many of this concept's graded answers took at least one hint.
   *
   *  The fold-carried half of scaffolding demand, and the reason it exists:
   *  the level tally above is an annotation the ledger does not carry, so a
   *  rule keyed on it works for a learner answering live and goes inert for one
   *  whose work arrived from a device after working offline. This one is
   *  incremented from `answer_submitted.hints`, which the event carries and the
   *  fold replays, so the two agree wherever both are present. */
  hinted?: number;
  /** Misconception id -> recent hit/miss window (1s and 0s, recency order).
   *  Bounded by the micro-diagnostic engine's window size. */
  recentHits?: Record<string, number[]>;
  /** Misconception id -> micro-diagnostic probe result (§4–5). */
  microDiag?: Record<string, MicroDiagState>;
  /** Starter Mode (problem initiation): how often the bridge step was asked
   *  and how often the student picked the connecting concept unprompted. */
  starter?: { asked: number; correct: number };
  /** Independence evidence: prove-it answers without hints. */
  independent?: { asked: number; correct: number };
  /** Transfer evidence: harder, unfamiliar-wording answers without hints.
   *  Recorded server-side only — the serve request stages the transfer, so a
   *  client cannot claim transfer credit for an ordinary practice question. */
  transfer?: { asked: number; correct: number };
  /** Retention evidence: born only when a concept the SCHEDULER (lib/retention)
   *  said was due is retrieved hint-free, at least a day after the last evidence
   *  on it. Same-session work never counts — the answer that proves memory is
   *  the one given when the concept had genuinely aged.
   *
   *  `lastHeld` is the LATEST such recall's outcome, and it is what lets the
   *  record say "forgotten" rather than only "1 of 2": held-then-lost and
   *  lost-then-held have identical counts and opposite states. See
   *  lib/proof.ts#retentionState — the one rule that names them, and the reason
   *  the fact is kept rather than re-derived by each surface. */
  retention?: { asked: number; correct: number; lastHeld?: boolean | null };
  /** Peer teaching: explanations checked and strong ones. */
  peer?: { checks: number; strong: number };
  /** Total answer time in ms (for pace evidence; count in `answers`). */
  totalMs?: number;
  answers?: number;
  /** Proctored diagnostic measurement of this concept (audit P0-A). The
   *  learner model's initial-state estimator: the claim pins to this number
   *  until enough fresh practice evidence accumulates to overturn it.
   *  `atAnswers` records how many graded answers existed when measured, so
   *  "evidence since the diagnostic" is computable without a second field. */
  diag?: { mastery: number; asked: number; correct: number; at: number; atAnswers: number };
}

/**
 * The learner model as it stood BEFORE the ledger became authoritative for
 * this learner — the one thing a replay cannot rebuild.
 *
 * Why this has to exist rather than "just replay the ledger": a learner may
 * have a real model and no ledger at all (every learner who used OpenMind
 * before the ledger did). Flipping the source of truth to a full replay would
 * silently reset their mastery to zero on their next answer, which is exactly
 * the data loss this project must not do. The base is the snapshot those
 * earlier answers produced; the projection folds every later event ON TOP of
 * it, so counts continue (13 attempts becomes 14) instead of restarting.
 *
 * It is stamped ONCE, lazily, by the first write after the cutover, and never
 * rewritten afterwards — a moving base would make the model unreproducible.
 */
export interface ProjectionBase {
  /** conceptId -> progress, as of the cutover. */
  progress: Record<string, ConceptProgress>;
  /** The mastery map (≥0.9 stamps) as of the cutover. */
  masteries: Record<string, number>;
  /** How many of the learner's ledger events (counted in the ledger's own
   *  append order) are ALREADY inside `progress`. The projection folds the
   *  suffix after this mark and nothing before it.
   *
   * A POSITION, deliberately, not a timestamp. The base is stamped at the
   * moment of a write, when the events already on the ledger are exactly the
   * ones the snapshot accounts for — so "the snapshot covers the first N" is
   * exact, while "the snapshot covers everything before time T" is a guess
   * that gets a device sync wrong in one direction or the other: an event
   * whose clock is older than a timestamp already folded would be counted
   * twice, and one that is merely listed out of order would be dropped. The
   * ledger is append-only, so a position never moves. (Deleting a learner's
   * ledger file, which only account deletion does, would invalidate it — they
   * would then need their model rebuilt from the ledger alone.) */
  ledgerMark: number;
  /** When the snapshot was taken. For disclosure only — never for the fold. */
  at: number;
  /** The PROJECTION_VERSION that produced the model from this base. */
  version: number;
  /** What the ledger demonstrably could NOT rebuild at cutover, MEASURED by
   *  reconciling the ledger against the model rather than inferred from "the
   *  model was not empty". Zero is a real and common answer; a learner whose
   *  ledger already covers their history never gets a base at all. */
  unprojected: { concepts: number; attempts: number };
}

export interface ProfileState {
  /** Ids of the learner's OWN papers (marks and concept tags only — never
   *  question text). Private to them: the route reads them owner-scoped. */
  personalPapers?: string[];
  profile: StudentProfile;
  /** Secret capability token (audit P0-E): created with the profile, checked
   *  on every write. Held in localStorage client-side; a leaked profile id
   *  alone can no longer mutate or read the learner's state. */
  secret: string;
  /** conceptId -> progress */
  progress: Record<string, ConceptProgress>;
  /** sessionKey -> DiagnosticResult (sessionKey = `${subject}:${isoDate}`) */
  diagnostics: Record<string, DiagnosticResult>;
  /** conceptId -> timestamp of last mastery (≥0.9) */
  masteries: Record<string, number>;
  /** The pre-ledger snapshot the projection folds onto (lib/replay.ts).
   *  Absent for a learner born after the cutover, whose whole history is
   *  already in the ledger — for them the projection is the ledger alone. */
  projectionBase?: ProjectionBase;
  /** Concepts directly probed by a baseline diagnostic -> timestamp (audit
   *  P0-B). The boundary between observed evidence and inferred priors. */
  observed?: Record<string, number>;
  /** The last finished learning session (lib/session.ts) — what changed and
   *  why. Persisted so Home can show the model moving rather than asking the
   *  learner to remember the previous screen. Structural only: no translated
   *  text, so one language can never be frozen into a profile.
   *  Inline type import: types.ts is the leaf module and must not gain a
   *  runtime import edge (lib/session.ts itself imports these types). */
  lastSession?: import("./session").SessionSummary;
  /** Items a MEASURING pool has already spent on this learner: item id → when
   *  it was first served (lib/question-bank.ts). Practice items are never
   *  recorded here — re-serving a probe would let "you improved" mean "you
   *  remembered", which is the most misleading thing this system could say. */
  seenQuestions?: Record<string, number>;
}

// ── Study packs (open, forkable learning resources) ─────────────────────────

/** A community-authored study resource attached to one concept.
 *  Forks are full copies with `forkOf` pointing at the parent id; the Helpful
 *  count is the community's signal for which fork rose to the top. */
export interface StudyPack {
  id: string;
  conceptId: string;
  /** BCP-47-ish tag of the pack's content language. */
  language: string;
  title: string;
  body: string;
  /** Anonymised author handle (profile id chain resolved client-side). */
  author: string;
  createdAt: number;
  helpful: number;
  forkOf?: string;
}

// ── Study rooms & classes ───────────────────────────────────────────────────

export interface RoomMessage {
  id: string;
  author: string;
  text: string;
  at: number;
  /** The tutor's reply to this message, when there is one. */
  tutorReply?: string;
  /** WHO wrote that reply: a configured model, or the offline engine. Stored
   *  with the message so the disclosure survives a reload and can never be
   *  reconstructed wrongly — a fallback reply must never read as AI. */
  tutorSource?: "ai" | "offline";
  /** The i18n key the room renders to say who answered. */
  tutorLabelKey?: string;
  /** Why a model did not answer (no_key, provider_error, timeout, malformed,
   *  or no_focus when the room had no concept to ground a turn in). */
  tutorUnavailable?: string | null;
  /** The concept the turn was grounded in — null when the room had none and
   *  the tutor had to ask which idea the learner means. */
  tutorFocus?: string | null;
}

export interface StudyRoom {
  id: string;
  name: string;
  subject: SubjectId;
  conceptIds: string[];
  language: string;
  createdBy: string;
  createdAt: number;
  /** Anonymised member handles. */
  members: string[];
  messages: RoomMessage[];
  /** Next id to hand out; rooms fork by copying and bumping `forkOf`. */
  nextMsgId: number;
  forkOf?: string;
}

export interface ClassRoster {
  id: string;
  name: string;
  teacher: string;
  joinCode: string;
  language: string;
  conceptIds: string[];
  /** handle -> per-concept aggregate mastery. Kept as the member's LAST
   *  self-report; the teacher's live view is derived from the ledger by
   *  /api/classes and lands in `live`. */
  students: Record<string, Record<string, number>>;
  /** handle -> misconceptionId -> hit count, reported alongside mastery. */
  misconceptions?: Record<string, Record<string, number>>;
  /** The learner ids that have joined, so reads can authorize by identity
   *  rather than by handle string. Optional: rosters created before this
   *  field existed authorize on the handle they do have. */
  members?: string[];
  /** handle -> the learner id that joined under it, so the live view can find
   *  a member's ledger by id instead of trusting handle uniqueness. */
  membersById?: Record<string, string>;
  /** The learner id of the teacher who created the class — the ONE authority
   *  that may set or remove its work and read its monitor. Absent on rosters
   *  that predate the field; those authorize on the first member recorded. */
  ownerId?: string;
  /** The subject this class is taught, declared when it is created. Optional
   *  so rosters that predate the field keep working: the subject is then
   *  inferred from the concepts they carry (lib/teacher-plan#classSubject).
   *  Assigned work is drawn ONLY from the declared curriculum. */
  subject?: SubjectId;
  /** The course (specification) the class is taught, when the teacher names
   *  one. Null/absent means the class's whole subject curriculum is assignable.
   *
   *  Declared where the class is created, or set later on the class itself
   *  (`POST /api/classes {action:"update"}`), and validated the way a learner's
   *  course is: a qualification the subject is not part of is REFUSED BY NAME
   *  rather than dropped. It is what makes two classes of one subject at
   *  different qualifications different objects — the work that may be set
   *  (lib/server/assignment-view#assignableConcepts) and the week's plan
   *  (lib/teacher-plan) are both drawn from it. */
  specificationId?: string | null;
  /** Work the teacher has set for the class. It lives on the roster because it
   *  IS class state, not a parallel store — and every number the teacher later
   *  reads about a member's progress is derived from that member's own evidence
   *  ledger (lib/server/assignment-view), never a counter kept here. */
  assignments?: Assignment[];
  createdAt: number;

  /** The teacher's live view of each member, DERIVED SERVER-SIDE from that
   *  member's own evidence ledger (present on reads, never stored). The stored
   *  `students`/`misconceptions` fields are the member's last self-report and
   *  are what `live` exists to supersede — the two are kept apart so a claim
   *  and a measurement can never be mistaken for each other. */
  live?: Record<string, ClassMemberLive>;
}

/** Work a teacher has set for a class: a set of concepts and a deadline.
 *
 *  This is a real state transition on the class (POST /api/assignments), not a
 *  decorative list — but it deliberately stores NO progress. Whether a member
 *  has done it, how accurately, which assigned concept is their weakness and
 *  which misconceptions their wrong answers carried are all DERIVED from the
 *  member's own evidence ledger, over the window that opens when this record's
 *  `createdAt` is stamped. A stored counter here could drift from the record;
 *  a derivation cannot. */
export interface Assignment {
  id: string;
  /** The class it was set in. */
  clsId: string;
  /** The teacher's learner id — the one authority that may change it. */
  createdBy: string;
  title: string;
  /** The curriculum the concepts came from, recorded at set time so a later
   *  course change cannot silently reinterpret the work. */
  subject: SubjectId;
  specificationId: string | null;
  conceptIds: string[];
  /** WHO the work is for, by the class's own row labels. Absent or empty means
   *  the WHOLE CLASS — the ordinary case, and the only shape the first version
   *  of this record had.
   *
   *  The labels are the roster's handles, and they are safe as keys because a
   *  handle is unique inside one class (lib/server/class-membership#freeHandle
   *  never rebinds one that is taken): two learners sharing a display name get
   *  two rows, and this list names the row, not the child's chosen name.
   *
   *  It is a TARGET, never a progress record — the same rule as the rest of
   *  this interface. What a targeted member did about the work is still derived
   *  from their own evidence ledger over the window (lib/server/assignment-view),
   *  and a member this list does not name does not receive the row at all. */
  targetHandles?: string[];
  /** Server clock the work was set — the window's start. An answer counts
   *  towards the assignment only if it reached the ledger at or after this. */
  createdAt: number;
  /** Deadline, server epoch ms. Never a client-supplied timestamp. */
  dueAt: number;
}

/** One member's row for one assignment, derived SERVER-SIDE from their own
 *  ledger over the assignment's window. Nothing here is stored. */
export interface AssignmentMemberProgress {
  handle: string;
  learnerId: string;
  /** Graded answers recorded on the assigned concepts since it was set. */
  answers: number;
  /** conceptId -> asked/correct/rate over the window, plus what that work
   *  PROVED. A concept the window holds no evidence on is ABSENT — unmeasured,
   *  never a zero. */
  concepts: Record<string, {
    asked: number;
    correct: number;
    rate: number;
    /** The strongest claim the window's answers on this concept earned
     *  (lib/proof.ts): retained > transfer > independent > supported, or null
     *  when every answer was wrong. Correct-with-hints is `supported` and never
     *  independence — which is the distinction a teacher needs when a class
     *  "finished" at 80%. */
    proof: import("./proof").ProofVerdict | null;
  }>;
  /** Assigned concepts with no evidence in the window: the work still owed. */
  outstanding: string[];
  /** Every assigned concept has at least one graded answer in the window. */
  complete: boolean;
  /** The weakest measured assigned concept, or null with no evidence at all. */
  weakest: { conceptId: string; rate: number } | null;
  /** Misconception ids the window's wrong answers were tagged with, with the
   *  concept each was seen on and how many carried it — the ledger's record,
   *  not a self-report and not a stored tally. */
  misconceptions: Record<string, { hits: number; conceptId: string }>;
  /** Answers already on each assigned concept BEFORE the window opened, so a
   *  teacher can tell work done for the assignment from work done before it. */
  prior: Record<string, number>;
  /** The projection algorithm the row was computed with. */
  projectionVersion: number;
}

/** Why a teacher might step in, derived from the rows — named so the reason is
 *  on screen rather than left to the reader to infer from a number. */
export interface AssignmentIntervention {
  handle: string;
  conceptId: string;
  rate: number | null;
  reason: "not_started" | "weak" | "misconception";
  misconceptionId?: string;
}

/** What the monitor reports about ONE assignment, for the teacher that owns it. */
export interface AssignmentMonitor {
  assignment: Assignment;
  className: string;
  members: AssignmentMemberProgress[];
  interventions: AssignmentIntervention[];
}

// ── THE EVIDENCE-TO-INTERVENTION LOOP (§8) ──────────────────────────────────
//
// One record connects a CLASS finding to the teacher's review of it, the
// work it was turned into, and the outcome the teacher later reads. It lives
// beside the class (the store's interventions.json), it stores NO progress
// number (everything measured is a projection of the members' own ledgers),
// and its baseline is the ledger's own append-only history split at an
// instant — never a copied snapshot that could drift.

/** The five claims a finding may make, and only these. Each names what it is
 *  and is not — the wording on every surface must follow the kind's own
 *  licence (lib/server/needs.ts's header carries the full contract). */
export type FindingKind =
  | "misconception"     // a wrong RULE the ledger recorded, shared by several
  | "weak_rate"         // observed difficulty: low unaided accuracy, no why
  | "hint_dependent"    // right with help every time — scaffolding demand
  | "prereq_gap"        // LIKELY prerequisite lever, inferred from the genome
  | "unmeasured";       // not yet measured — an absence, never a failure

export type InterventionStatus =
  | "proposed"      // awaiting the teacher's review
  | "assigned"      // the work was set; outcome still to be read
  | "declined"      // the teacher reviewed it and chose not to act — recorded
  | "resolved"      // outcome read, teacher chose the next step
  | "superseded";   // a newer proposal at the same compound key kept open

/** ONE open learning need, as derived from the class's own ledgers. Pure
 *  output of lib/server/needs.ts — never stored as a truth, only as the
 *  description of what was reviewed. */
export interface ClassNeed {
  id: string;
  clsId: string;
  conceptId: string;
  kind: FindingKind;
  misconceptionId?: string;
  /** The population, named in full. `eligible` is every student of the class;
   *  `withEvidence` have any answer on the concept inside the window;
   *  `unmeasured` have none — COUNTED, never excluded and never 0-modelled;
   *  `showing` are the learners the pattern is observed on. Every proportion
   *  a surface shows states its own denominator. */
  eligible: number;
  withEvidence: number;
  unmeasured: number;
  showing: number;
  /** The class's combined UNAIDED rate on the concept in the window, or null
   *  when nobody answered without help (which is not 0%). */
  unaidedRate: number | null;
  /** The roster handles the pattern was observed on — teacher-visible, since
   *  the finding door is teacher-only. */
  handles: string[];
  /** The event ids that produced the claim, so the review links to the ledger
   *  itself (§2) — a linkable audit, not a trust-me number. */
  evIds: string[];
  /** Too sparse to justify a class-wide conclusion at full strength. A thin
   *  finding is still inspectable; the UI says what it is rather than
   *  inflating it into a diagnosis. */
  thin: boolean;
  from: number;
  nowMs: number;
}

/** One intervention: finding → review → proposal → assignment → baseline →
 *  outcome → decision. Fields beyond the finding keys are stamped at each
 *  teacher-only transition and are never edited after. */
export interface InterventionRecord {
  id: string;
  clsId: string;
  conceptId: string;
  kind: FindingKind;
  misconceptionId?: string;
  /** The finding this review came from, frozen at proposal time — the record
   *  must not move when the ledgers move. */
  finding: ClassNeed;
  status: InterventionStatus;
  /** The teacher who proposed/acted. Every transition is theirs alone. */
  ownerId: string;
  createdAt: number;
  /** The server instant of each transition; absent until it happens. */
  assignedAt?: number;
  declinedAt?: number;
  resolvedAt?: number;
  /** The target population: handles, as the assignment will carry them.
   *  Empty (undefined) means the whole class — the same semantics as an
   *  assignment's absent `targetHandles`. */
  targetHandles?: string[];
  /** The assignment the review produced (one, not several: the record IS the
   *  link, and the door refuses a second create). */
  assignmentId?: string;
  /** WHERE THE LEDGERS WERE at approval: the baseline instant. Nothing is
   *  copied; the outcome splits each member's own append-only ledger here. */
  baseAt?: number;
  /** The teacher's next decision recorded after the outcome was read. */
  /** A short teacher own-word on a decline or a decision, capped. */
  note?: string;
  /** The teacher's next decision recorded after the outcome was read. */
  decision?: { kind: DecisionKind; at: number; note?: string };
}

/** What a teacher may choose after reading the outcome — and this list is the
 *  UI's, not a free-form dump: each option is an action the product can
 *  actually take. */
export type DecisionKind =
  | "continue_concept"    // move the class forward
  | "repeat_practice"     // more of the same targeted work
  | "address_prerequisite"// the finding suggested a lever — work it first
  | "individual_support"  // one or a few: helping closers, not class work
  | "another_diagnostic"  // measure before measuring again
  | "collect_more_evidence"; // the verdict said not enough; keep watching

/** What the teacher's roster shows about one member, derived SERVER-SIDE from
 *  that member's own evidence ledger. Nothing here is accepted from the
 *  client: the numbers are the projection's, and what the ledger has never
 *  measured reads `null` — unknown, never zero. */
export interface ClassMemberLive {
  /** The calling member's learner id — what the teacher needs to know a
   *  "joined twice under two handles" case. Never the capability secret. */
  learnerId: string;
  /** Independent-work accuracy per concept the member has evidence on:
   *  correct/asked, plus the rate. A concept with no evidence is absent. */
  concepts: Record<string, { asked: number; correct: number; rate: number }>;
  /** The member's weakest measured concept, or null with no evidence at all. */
  weakest: { conceptId: string; rate: number } | null;
  /** Misconception patterns the LEDGER recorded for this member. */
  misconceptions: Record<string, number>;
  /** Total graded answers the member's ledger holds — the "has this student
   *  actually started?" signal, and zero only when they truly have none. */
  answers: number;
  /** The projection algorithm version the numbers were computed with, so a
   *  teacher (and a test) can tell which model produced the view. */
  projectionVersion: number;
}

/**
 * ONE member's evidence IN DETAIL, for the teacher who owns the class they are
 * in — the "what can this student actually demonstrate?" screen.
 *
 * Everything here is a projection of that member's own ledger: no number is
 * stored anywhere, none is accepted from a client, and what the record has
 * never measured is ABSENT (or named in `unmeasured`) rather than scored 0.
 *
 * Deliberately NO question text and no chosen option: the ledger keeps the
 * concept, how the answer was done and what it proved — never the item. A
 * surface that showed the item would have to read the question bank, and a
 * teacher would then be reading an item this child may never have been served.
 * A suspected misconception is therefore always labelled a HYPOTHESIS: the tag
 * says which wrong answer sat on a question BUILT to probe that rule, which is
 * evidence about a possibility, not a diagnosis of a child.
 *
 * This is the draw-order shape of the read (`GET /api/classes?learner=`), and
 * it answers a question the roster's one-line row cannot: the row says a rate,
 * this says what the work proved, how it was done, and what has never been
 * asked at all. */
export interface ClassMemberEvidence {
  handle: string;
  learnerId: string;
  /** False when the class has declared no subject: there is then no course to
   *  say what this learner was EXPECTED to be measured on, so `unmeasured` is
   *  empty rather than invented from a default curriculum. */
  curriculumDeclared: boolean;
  /** The four dimensions over the member's WHOLE record, straight from the
   *  projection's own counters — the same four the learner's own evidence view
   *  bands per concept, so both surfaces are reading one fact. `null` is never
   *  measured, never 0. */
  dimensions: {
    recalled: { asked: number; correct: number } | null;
    applied: { asked: number; correct: number } | null;
    transferred: { asked: number; correct: number } | null;
    retained: { asked: number; correct: number } | null;
  };
  /** One row per concept the record holds ANY answer on, weakest first. The
   *  INDEPENDENT slice is separated from the whole count on purpose: the
   *  roster's mastery column is the independent slice, and a drawer that
   *  reported a different number for the same learner would be the one thing
   *  this view must never do. */
  concepts: Array<{
    conceptId: string;
    /** Every recorded answer on the concept, any mode, any source. */
    answers: number;
    correct: number;
    /** The independent-work slice — the roster's number. `asked: 0` means no
     *  independent work has happened, which is not the same as 0%. */
    independent: { asked: number; correct: number; rate: number };
    /** The strongest claim the concept's work earned (lib/proof.ts#
     *  strongestProof): retained > transfer > independent > supported, or null
     *  when nothing on it was right. */
    proof: import("./proof").ProofVerdict | null;
    /** The state of delayed recall for this concept (lib/proof.ts#
     *  retentionState) — a state, not a ratio, and `unmeasured` until a due
     *  review actually happened. */
    retention: import("./proof").RetentionState;
    /** Server clock of the most recent recorded answer on it. */
    lastAt: number;
  }>;
  /** Concepts of the class's OWN curriculum with no recorded answer at all.
   *  Named, so a gap in the record is not read as a gap in the learner. */
  unmeasured: string[];
  /** The member's most recent recorded answers, newest first — the evidence a
   *  teacher inspects. `hypothesisIds` are the misconception tags the SERVER
   *  put on a wrong answer, which is the only way a teacher can see what
   *  triggered a signal about this student. */
  recent: Array<{
    conceptId: string;
    at: number;
    correct: boolean;
    mode: import("./evidence").AnswerMode;
    /** The evidence source the server attributed ("practice", "retrieval", a
     *  paper, the diagnostic) — a plain string, as it crosses JSON. */
    source: string;
    hints: number;
    /** What this ONE answer proved; null for a miss, which is evidence but not
     *  an achievement. */
    proof: import("./proof").ProofVerdict | null;
    hypothesisIds: string[];
    /** A device-reported answer (lib/evidence.ts#isDeviceReported): the server
     *  did not watch it happen, and the teacher is told rather than shown an
     *  unverifiable answer as an observed one. */
    offline: boolean;
  }>;
  /** Misconception patterns the record holds, with how many wrong answers
   *  support each and the concepts it was seen on. A HYPOTHESIS, and each one
   *  is checkable against `recent` rather than taken on trust. */
  hypotheses: Array<{ id: string; hits: number; conceptIds: string[] }>;
  /** Graded answers the member's ledger holds. */
  answers: number;
  /** The projection algorithm version the detail was computed with. */
  projectionVersion: number;
}
