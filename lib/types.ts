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

/** One generated practice question. */
export interface Question {
  id: string;
  conceptId: string;
  /** Compact difficulty 0–1. */
  difficulty: number;
  /** Prompt with $...$ maths placeholders the UI renders as-is. */
  prompt: string;
  /** Multiple-choice options; correctness via `answer`. */
  choices: string[];
  /** Index into `choices` (or index of canonical choice for type-in). */
  answer: number;
  /** Human explanation of why the answer is right. */
  explanation: string;
  /** Which misconception catalogues this question discriminates. */
  misconceptionTags: string[];
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
    estimate: import("./question-bank").EvidenceEstimate;
  }>;
  /** Demand bands a later concept did NOT re-prove, because the session had
   *  already demonstrated them (lib/diagnostic.ts `startingStage`). Reported so
   *  a shorter diagnostic is visibly a decision rather than a missing half. */
  skippedBands?: Array<import("./question-bank").SkillId>;
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
  /** Help level (1-4) -> times requested. Scaffolding demand is learner-model data. */
  hints?: Record<string, number>;
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
   *  the one given when the concept had genuinely aged. */
  retention?: { asked: number; correct: number };
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
   *  one. Null/absent means the class's whole subject curriculum is assignable. */
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
  /** conceptId -> asked/correct/rate over the window. A concept the window
   *  holds no evidence on is ABSENT — unmeasured, never a zero. */
  concepts: Record<string, { asked: number; correct: number; rate: number }>;
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
