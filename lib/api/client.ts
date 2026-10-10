// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER API, AS OPERATIONS.
//
// This is the seam the whole product talks through. A page asks for a THING —
// "the next task", "one practice question", "this class's roster" — and never
// for a URL. Every route string in the application now exists in this one file,
// which is what makes the remaining work possible:
//
//   · the three-product split ended here. `docs/app.js` (the hand-written
//     static product) and the React app both need the same ~40 operations, and
//     before this file each of them had its own idea of what `/api/progress`
//     meant. Now there is one meaning, and a second front end is a second
//     consumer rather than a second implementation;
//
//   · the same operations run with NO SERVER. lib/api/transport.ts takes a
//     sender, so a static build installs one that answers from the engines
//     in-process. The operations below do not change; the wire does;
//
//   · a response SHAPE is checked once. `{ progress, masteries }` used to be
//     destructured at a dozen call sites, each of which decided for itself what
//     a missing field meant. Here it is a type, so a caller that reads a field
//     the route does not send is a compile error rather than a silent zero.
//
// Nothing here decides anything. Grading, attribution, mode, hint counts,
// retention credit and the next action are all decided server-side, from the
// learner's own record — this file only carries the question and the answer.
// ─────────────────────────────────────────────────────────────────────────────

import { ApiError, buildUrl, capabilityFor, postAnswer, probe, send, type Probe, type Query } from "./transport";
import { newSubmissionId } from "../sync-queue";
import { ensureSecret, writeProfileId, writeSecret } from "./identity";
import type {
  Assignment, AssignmentMemberProgress, AssignmentMonitor, ClassMemberEvidence,
  ClassRoster, ConceptProgress, DiagnosticResult, PathStep, ProfileState,
  PublicAccount, Question, StudyPack, StudyRoom, SubjectCourse, SubjectId,
} from "../types";
import type { MatchResult } from "../matcher";
import type { QuestionView } from "../questions";
import type { BuiltPaper, PaperResult } from "../papers";
import type { CourseField } from "../specifications";
import type { EvidenceEvent, LearnerProjection } from "../evidence";
import type { FlarePayload, MicroDiagStatus } from "../microdiag";
import type { StarterReveal, StarterView } from "../starter";

export { ApiError };
export type { Probe, Query };

// ── Shared shapes ───────────────────────────────────────────────────────────

/** A question as it is SERVED. `serveView` strips `answer`, `answerValue`,
 *  `choiceValues`, `explanation` and `misconceptionTags` server-side, so the
 *  wire type is exactly the served view — a surface cannot read the key out of
 *  the payload even by accident, because the type says it is not there. */
export type ServedQuestion = QuestionView;

/** One learner's progress snapshot, exactly as `GET /api/progress` answers. */
export interface ProgressSnapshot {
  progress: Record<string, ConceptProgress>;
  masteries: Record<string, number>;
}

/** One subject's course, and what it still has NOT decided. Derived
 *  server-side (lib/specifications.ts#incompleteSubjects) so no surface
 *  recomputes the rule — and named field by field, because "your course is
 *  incomplete" is useless without "which part". */
export interface CourseGap {
  subject: SubjectId;
  missing: CourseField[];
}

/** A learner profile as the door serves it: the record plus the derived gaps. */
export interface ProfileView extends ProfileState {
  courseGaps?: CourseGap[];
}

/** The four-way answer to "is this learner still there?", which a caller that
 *  cannot tell 404 from a dropped packet will get wrong in the learner's face. */
export type ProfileProbe = Probe<ProfileView>;

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY — accounts and the capability that ties a device to a learner
// ─────────────────────────────────────────────────────────────────────────────

export interface AccountSession {
  account: PublicAccount | null;
  profile: ProfileState | null;
  secret: string | null;
}

export const EMPTY_SESSION: AccountSession = { account: null, profile: null, secret: null };

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  role?: "student" | "teacher" | "org";
  country?: string;
  language?: string;
  subjects?: SubjectId[];
  /** The anonymous profile on this device, if the learner wants its work to
   *  come with them. Captured BEFORE sign-in, because signing in replaces the
   *  device's identity — reading it afterwards would name the account's own
   *  brand-new profile and claim nothing. */
  claim?: { profileId: string; secret: string } | null;
}

export function signUp(input: SignUpInput): Promise<AccountSession> {
  return send<AccountSession>("/api/auth/signup", { method: "POST", body: { ...input } });
}

export function signIn(email: string, password: string): Promise<AccountSession> {
  return send<AccountSession>("/api/auth/login", { method: "POST", body: { email, password } });
}

/** Sign out. The server revokes every session in this account's epoch, so this
 *  is not a client-side fiction — after it, the cookie is worthless. */
export async function signOut(): Promise<void> {
  // Tolerated: a sign-out that reaches a server which has already forgotten the
  // session has still signed the learner out, and refusing to clear the device
  // over it would leave them signed in locally for no reason.
  await send<Record<string, never>>("/api/auth/logout", { method: "POST", body: {}, tolerate: [401] });
}

/** Who is signed in on this device, and which learner profile that is. A failure
 *  is an empty session, not a thrown error: the shell renders signed-out. */
export async function session(): Promise<AccountSession> {
  try {
    const data = await send<AccountSession>("/api/auth/me");
    return data.account ? data : EMPTY_SESSION;
  } catch {
    return EMPTY_SESSION;
  }
}

/** Move an anonymous device's work into the signed-in account. */
export function claimProfile(claim: { profileId: string; secret: string }): Promise<AccountSession> {
  return send<AccountSession>("/api/auth/claim", { method: "POST", body: { ...claim } });
}

export function updateAccount(patch: {
  name?: string; role?: string; currentPassword?: string; newPassword?: string;
}): Promise<Record<string, unknown>> {
  return send<Record<string, unknown>>("/api/auth/me", { method: "POST", body: { ...patch } });
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read one learner profile.
 *
 * A capability is presented only when this device already holds one. That is
 * not a shortcut: `GET /api/profile` binds an unclaimed secret to the profile on
 * first use, so a device that minted one merely to ASK would be CLAIMING the
 * profile it asked about. A genuine read never takes ownership.
 */
export function readProfile(id: string): Promise<ProfileView> {
  return send<ProfileView>("/api/profile", { query: { id } });
}

/** The same read, saying which of the four things happened. */
export function probeProfile(id: string): Promise<ProfileProbe> {
  return probe<ProfileView>("/api/profile", { query: { id } });
}

export interface ProfileInit {
  /** Omitted when the learner chose no name — never minted here. */
  handle?: string;
  country: string;
  language: string;
  teachingLang?: string;
  answerLang?: string;
  schoolLang?: string;
  grade?: string;
  examples?: string;
  /** Optional because the door is: a profile can be created with nothing but a
   *  country and a language (the anonymous practice path does exactly that),
   *  and enrolment fills the rest in as the learner answers. */
  birthYear?: number | null;
  goal?: string;
  intent?: string;
  subjects?: SubjectId[];
  board?: string;
  learningStyle?: string;
  spec?: string;
  specLevel?: string;
  exam?: string;
  examDate?: string;
  timePerDay?: number;
  /** One course per subject. The flat spec/specLevel above stay the learner's
   *  FIRST subject, so a single-course reader keeps a true one. */
  subjectCourses?: Partial<Record<SubjectId, SubjectCourse>>;
  onboarded?: boolean;
}

/** Create the learner, and adopt it as this device's — id AND secret, because
 *  without the secret every later write to it is refused and a guest has no
 *  session to fall back on. */
export async function createProfile(init: ProfileInit): Promise<ProfileView> {
  const state = await send<ProfileView>("/api/profile", { method: "POST", body: { ...init } });
  adoptProfile(state);
  return state;
}

/** Change the existing learner. Falls back to creating one when the id this
 *  device holds no longer exists, which is what makes enrolment self-healing
 *  after a store reset. */
export async function saveProfile(
  patch: Partial<ProfileInit> & Record<string, unknown>,
  id?: string | null,
): Promise<ProfileView> {
  const state = await send<ProfileView>("/api/profile", {
    method: "POST",
    body: { ...patch, id: id ?? undefined },
  });
  adoptProfile(state);
  return state;
}

/** Erase the learner's record. Requires the confirmation word the route
 *  demands, so no caller can do this by accident. */
export async function eraseProfile(id: string): Promise<void> {
  await send<Record<string, never>>("/api/profile", { query: { id, confirm: "ERASE" }, method: "DELETE" });
}

/** Write the profile's identity onto this device. One helper so create and save
 *  cannot disagree about which half of the identity they adopt. */
function adoptProfile(state: ProfileView): void {
  if (state.profile?.id) writeProfileId(state.profile.id);
  if (state.secret) writeSecret(state.secret);
}

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING — the loop itself
// ─────────────────────────────────────────────────────────────────────────────

/** The learner's progress snapshot, optionally for one subject. */
export function progressFor(id: string, subject?: string): Promise<ProgressSnapshot> {
  return send<ProgressSnapshot>("/api/progress", { query: { id, subject } });
}

/**
 * Is this learner still there? THREE answers, not two — and the third is the
 * one that matters offline:
 *
 *   true       the door answered
 *   false      the server answered 404 — a FACT about the learner
 *   "unknown"  we did not reach the server, or it failed to answer (5xx). NO
 *              information at all.
 *
 * Treating "unknown" as "gone" mints a brand-new profile on every flaky
 * connection, which loses the learner the very model the answer was meant to
 * update. Callers that must tell the three apart get them; callers that only
 * want a yes/no can collapse it themselves.
 */
export async function learnerExists(id: string, subject = "maths"): Promise<boolean | "unknown"> {
  try {
    await send<ProgressSnapshot>("/api/progress", { query: { id, subject } });
    return true;
  } catch (e) {
    if (!(e instanceof ApiError)) return "unknown";
    if (e.notFound) return false;
    if (e.unreachable) return "unknown";
    return e.status >= 500 ? "unknown" : false;
  }
}

/** Which rung of the difficulty ladder this draw is at, and whether the
 *  scaffold is OPEN (a learner who is struggling should not have to guess that
 *  help exists). */
export interface ServeTarget {
  reason: "fresh" | "steady" | "stretch" | "repair";
  band: number;
  scaffold: boolean;
}

export interface ServedQuestionResponse {
  question: ServedQuestion | null;
  /** True when the server re-framed the item for a second surface. */
  reframed?: boolean;
  /** Whether a second surface is possible for this CONCEPT at all — a fact
   *  about the concept rather than a claim about this draw. */
  transferable?: boolean;
  /** Null for a transfer draw and for a due review: there the difficulty is set
   *  by the rule, not by the learner's record, and saying otherwise would be a
   *  reason nobody used. */
  target?: ServeTarget | null;
}

/** Ask for one practice question. `intent: "transfer"` makes the SERVER stage a
 *  re-framed item and attribute transfer credit on grading — the client cannot
 *  claim transfer for an ordinary draw by asking for one. */
export function serveQuestion(id: string, conceptId: string, opts: { lang?: string; intent?: "transfer"; reveal?: boolean } = {}): Promise<ServedQuestionResponse> {
  return send<ServedQuestionResponse>("/api/progress", {
    method: "POST",
    body: { action: "serve", id, conceptId, lang: opts.lang, intent: opts.intent, reveal: opts.reveal },
  });
}

export interface AnswerVerdict {
  correct: boolean;
  answerIndex: number | null;
  explanation: string;
  streak?: number;
  mastery?: number;
  misconceptionId: string | null;
  flare?: FlarePayload | null;
  demonstrated?: { mode?: string; hints?: number; source?: string; retained?: boolean };
  /** The ledger already holds this submission (a replayed offline answer).
   *  There is no fresh verdict to show, and the surface says so. */
  duplicate?: boolean;
}

/** What happened to one answer — three outcomes, no fourth. */
export type AnswerOutcome =
  | { kind: "graded"; verdict: AnswerVerdict }
  | { kind: "offline" }
  | { kind: "error"; status: number; code: string };

/**
 * Send one answer. This is the ONLY write that must survive a dead connection,
 * so it goes through the offline queue: a failure the server would repeat is
 * reported, and a failure a later attempt could fix is HELD on the device and
 * replayed through this same operation when the connection returns.
 *
 * The caller never declares mode, hint count or retention credit — the server
 * derives all three from what it actually handed out.
 */
export async function answerQuestion(
  input: {
    id: string;
    conceptId: string;
    questionId: string;
    lang?: string;
    ms?: number;
    /** Minted here by default. Two genuine attempts at one question are two
     *  submissions and stay two ledger events; the same submission replayed is
     *  one — so the token belongs to the ACT of answering, not to the question. */
    submissionId?: string;
    deviceAt?: number;
  } & ({ choiceIndex: number } | { numericAnswer: string }),
): Promise<AnswerOutcome> {
  const { id, conceptId, questionId, lang, ms, ...given } = input;
  const submissionId = input.submissionId ?? newSubmissionId();
  const deviceAt = input.deviceAt ?? Date.now();
  const outcome = await postAnswer(
    "/api/progress",
    { action: "answer", id, conceptId, questionId, lang, ms, ...given },
    submissionId,
    deviceAt,
  );
  if (outcome.kind === "held") return { kind: "offline" };
  if (outcome.kind === "refused") {
    // A refusal retrying cannot fix. The server's own reason rides back so the
    // learner is told what was refused ("that is not a number", "stale or
    // unknown question") rather than shown a status code.
    const refusedBody = (await safeJson(outcome.res)) as { error?: unknown } | null;
    return { kind: "error", status: outcome.status, code: typeof refusedBody?.error === "string" ? refusedBody.error : "" };
  }
  const j = (await safeJson(outcome.res)) as Record<string, unknown> | null;
  if (!j) return { kind: "error", status: outcome.res.status, code: "" };
  if (j.duplicate === true) {
    return {
      kind: "graded",
      verdict: {
        correct: j.correct === true,
        answerIndex: null,
        explanation: "",
        misconceptionId: null,
        flare: null,
        duplicate: true,
      },
    };
  }
  return {
    kind: "graded",
    verdict: {
      correct: j.correct === true,
      answerIndex: typeof j.answerIndex === "number" ? j.answerIndex : null,
      explanation: typeof j.explanation === "string" ? j.explanation : "",
      streak: typeof j.streak === "number" ? j.streak : undefined,
      mastery: typeof j.mastery === "number" ? j.mastery : undefined,
      misconceptionId: typeof j.misconceptionId === "string" ? j.misconceptionId : null,
      flare: (j.flare as FlarePayload | null) ?? null,
      demonstrated: j.demonstrated as AnswerVerdict["demonstrated"],
    },
  };
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** One hint level. A string is ready to show; the object form carries a
 *  dictionary key so the SAME hint renders in the learner's language instead of
 *  the language the hint table happened to be authored in. */
export interface HintPayload {
  hint?: string | { text?: string; key?: string };
  [k: string]: unknown;
}

/** Open one hint level. The server counts what it hands out; that count is what
 *  decides whether a later correct answer counts as independent work, so the
 *  client never reports it. */
export function hint(id: string, conceptId: string, questionId: string, level: number): Promise<HintPayload> {
  return send("/api/progress", { method: "POST", body: { action: "hint", id, conceptId, questionId, level } });
}

/** Grade one micro-diagnostic probe: did the learner miss the CONCEPT or just
 *  the execution? That distinction is the whole point of asking. */
export function microCheck(
  id: string, conceptId: string, misconceptionId: string, questionId: string, choiceIndex: number,
): Promise<{ status: MicroDiagStatus; correct: boolean; explanation: string }> {
  return send("/api/progress", {
    method: "POST",
    body: { action: "micro", id, conceptId, misconceptionId, questionId, choiceIndex },
  });
}

/** Open Starter Mode for a served question: the four-step problem-initiation
 *  scaffold. The learner's own givens/goal text stays on the device. */
export function starterView(id: string, conceptId: string, questionId: string): Promise<StarterView> {
  return send<StarterView>("/api/progress", { method: "POST", body: { action: "starter", id, conceptId, questionId } });
}

/** Grade the bridge pick. A wrong pick still completes the flow — teaching, not
 *  gating. */
export function starterPick(id: string, conceptId: string, questionId: string, choiceIndex: number): Promise<StarterReveal> {
  return send<StarterReveal>("/api/progress", {
    method: "POST",
    body: { action: "starterPick", id, conceptId, questionId, choiceIndex },
  });
}

/** A peer's own words about whether they can explain this concept. */
export function peerMark(id: string, conceptId: string, strong: boolean): Promise<Record<string, unknown>> {
  return send("/api/progress", { method: "POST", body: { action: "peer", id, conceptId, strong } });
}

// ── The decision, the plan, the record ──────────────────────────────────────

/** One recommended action, as the decision door emits it. */
export interface NextAction {
  conceptId: string;
  kind?: string;
  reason?: string;
  evidenceIds?: string[];
  projectionVersion?: number;
  [k: string]: unknown;
}

export interface NextTask {
  actions: NextAction[];
  decision: { projectionVersion: number; evidenceEvents: number; unprojectable: number };
  snapshot: { touched: number; strong: number; due: number };
  /** Subjects whose course is still unchosen, named field by field: their plan
   *  is provisional until one is picked, and the consumer is told rather than
   *  left to trust the fallback. */
  courseGaps: CourseGap[];
}

/** What should this learner do next — decided from their own record. */
export function nextTask(id: string): Promise<NextTask> {
  return send<NextTask>("/api/next", { query: { id } });
}

/** The mastery map and its narrative for one subject: which concepts THIS
 *  learner is weak at, in the order the engine would teach them. */
export function pathFor(id: string, subject: string): Promise<{ path: PathStep[] }> {
  return send<{ path: PathStep[] }>("/api/path", { query: { id, subject } });
}

export interface LedgerPage {
  learnerId: string;
  cursor: number;
  count: number;
  total: number;
  events: EvidenceEvent[];
  projection: LearnerProjection;
  deepReconcile: { compared: number; projectionVersion: number; differences: number; unprojectable: number; note: string };
  impact: unknown;
  provenanceNote: string;
}

/** The learner's own ledger. Held to the capability exactly as a write is: a
 *  wrong token is a refusal, never an empty record. */
export function ledger(id: string, since?: number): Promise<LedgerPage> {
  return send<LedgerPage>("/api/evidence", { query: { id, since } });
}

export interface StudySession {
  conceptId: string;
  kind?: string;
  /** How many answers the session is for. Always present on a live session —
   *  the resume chip counts against it. */
  target: number;
  startedAt: number;
  asked: number;
  correct: number;
  independentCorrect: number;
  complete: boolean;
  /** The metrics the session STARTED from, so "did this session move the
   *  model?" is answerable. The ledger itself is never exposed. */
  before?: Record<string, unknown>;
}

export interface SessionView {
  session: StudySession | null;
  /** The previous finished session, as a summary rather than a live session. */
  lastSession: Record<string, unknown> | null;
}

export function sessionState(id: string): Promise<SessionView> {
  return send<SessionView>("/api/session", { query: { id } });
}

export function startSession(id: string, conceptId: string, opts: { kind?: string; target?: number } = {}): Promise<{ session: StudySession; resumed: boolean; lifecycle: string }> {
  return send("/api/session", { method: "POST", body: { action: "start", id, conceptId, ...opts } });
}

export function finishSession(id: string, conceptId: string): Promise<Record<string, unknown> & { lifecycle?: string }> {
  return send("/api/session", { method: "POST", body: { action: "finish", id, conceptId } });
}

// ── The diagnostic ──────────────────────────────────────────────────────────

export interface DiagnosticQuestion {
  /** The question this step serves, or null when the ladder for this concept is
   *  exhausted and the sitting moves on. */
  question?: ServedQuestion | null;
  /** The NEXT question, offered after an answer so the feedback can be read
   *  before the screen moves — the client never serves its own sequence. */
  next?: ServedQuestion | null;
  conceptId?: string;
  ladder?: unknown;
  sessionKey?: string;
  /** True when this call picked up a sitting already in progress. */
  resumed?: boolean;
  /** How many questions this sitting has asked so far. */
  asked?: number;
  /** The server's simulated length for an adaptive sitting: a MEASURED
   *  estimate, not a fiction, and "about" is exactly what it means. */
  estimate?: number;
  correct?: boolean;
  explanation?: string;
  answerIndex?: number | null;
  [k: string]: unknown;
}

export interface DiagnosticResultPayload {
  sessionKey?: string;
  /** The report the sitting produced. Committed server-side as ONE
   *  `diagnostic_completed` event before this is returned. */
  result?: DiagnosticResult | null;
  [k: string]: unknown;
}

export type DiagnosticAction = "start" | "answer" | "skip" | "finish";

/**
 * One call into the adaptive diagnostic.
 *
 * `start` RESUMES rather than replaces — a learner who leaves and returns
 * continues the measurement instead of silently beginning a second one — and
 * `finish` commits exactly one `diagnostic_completed` event.
 */
export function diagnose(input: {
  id: string;
  subject: string;
  action: DiagnosticAction;
  lang?: string;
  kind?: "baseline" | "retest" | "probe";
  reveal?: boolean;
  questionId?: string;
  chosen?: number;
  certainty?: "sure" | "unsure";
}): Promise<DiagnosticQuestion & DiagnosticResultPayload> {
  return send("/api/diagnostic", { method: "POST", body: { ...input } });
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT AND PRODUCTION — questions, papers, packs
// ─────────────────────────────────────────────────────────────────────────────

export interface PaperBundle {
  paper: BuiltPaper;
  /** The qualification's own name (a proper noun — never translated). */
  qualification: string;
  level: string;
  specId: string;
  /** "engine" means the deterministic bank wrote every question. Anything the
   *  model added is counted and disclosed; nothing is presented as AI that is
   *  not. */
  source: "engine" | "ai" | "mixed";
  aiQuestions: number;
  engineQuestions: number;
  ai?: unknown;
  specs?: unknown;
}

/** One paper a learner can sit, as the list offers it. `authored` distinguishes
 *  a real board paper from the generic paper built for a course that has none:
 *  the two look identical on screen otherwise. */
export interface PaperListEntry {
  id: string;
  name: string;
  subject: SubjectId;
  minutes: number;
  marks: number;
  calculator: boolean;
  authored: boolean;
}

export interface PaperListBundle {
  qualification: string;
  level: string;
  papers: PaperListEntry[];
  /** Whether a model is configured at all — the page never promises an AI paper
   *  a deployment cannot write. */
  ai?: { enabled: boolean; provider: string | null; model: string | null } | null;
}

/** The papers this deployment can serve for one course. */
export function paperList(query: { id?: string; subject?: string; lang?: string; spec?: string; level?: string }): Promise<PaperListBundle> {
  return send<PaperListBundle>("/api/paper", { query: { ...query, list: 1 } });
}

/** Build one paper. Deterministic first; AI only fills slots the engine could
 *  not, and anything the AI wrote is disclosed as such. */
export function paperFor(query: Query): Promise<PaperBundle> {
  return send<PaperBundle>("/api/paper", { query });
}

export interface PaperMarking {
  result: PaperResult;
  /** The misconception-level analysis, in the shape lib/paper-analysis.ts
   *  defines for the panel that renders it. Opaque here on purpose: the api
   *  layer carries it, it does not interpret it. */
  analysis: unknown;
  conceptsTested: Array<{ id: string; title: string; subject: string }>;
  name: string;
  minutes: number;
  calculator: boolean;
  /** Present only when the sitting was recorded against a learner. */
  recorded?: boolean;
  /** Always true: a marked paper is an estimate, and the UI says so rather than
   *  presenting a grade as a result. */
  gradeIsEstimate: true;
}

/** Mark a paper. With an id the result is also recorded as evidence; without
 *  one the paper is still marked and nothing is stored. */
export function markPaper(input: { paperId: string; answers: Record<string, number>; id?: string; lang?: string }): Promise<PaperMarking> {
  return send<PaperMarking>("/api/paper", { method: "POST", body: { ...input } });
}

export interface PersonalPaperEntry {
  id: string;
  title: string;
  board?: string;
  /** The learner typed this, so it is whatever they typed — not normalised. */
  year?: string | number;
  questionCount: number;
  createdAt?: number;
}

export interface MyPaperBundle {
  papers: PersonalPaperEntry[];
  rights: unknown;
}

export function myPapers(id: string): Promise<MyPaperBundle> {
  return send<MyPaperBundle>("/api/my-paper", { query: { id } });
}

/** Create or mark one of the learner's OWN papers. The route accepts marks and
 *  concept tags only — never question text — so a personal paper cannot become
 *  a content store by accident. */
export function myPaperAction(input: { action: "create" | "mark"; id: string; [k: string]: unknown }): Promise<Record<string, unknown>> {
  return send("/api/my-paper", { method: "POST", body: { ...input } });
}

export interface PackBundle {
  packs: StudyPack[];
}

export function packsFor(conceptId: string): Promise<PackBundle> {
  return send<PackBundle>("/api/packs", { query: { conceptId } });
}

export function packAction(input: { action: "create" | "fork" | "helpful"; id: string; [k: string]: unknown }): Promise<Record<string, unknown>> {
  return send("/api/packs", { method: "POST", body: { ...input } });
}

/** Everything this learner can take offline, in one payload: the decision,
 *  today's actions, weak areas, the review queue, progress and the lessons.
 *  `summary` is what the offline page reports, and a learner who downloads a
 *  pack deserves it to be the pack they got. */
export interface MyPack {
  exportedAt: number;
  profile: Record<string, unknown>;
  summary?: { activities?: number; due?: number };
  today: unknown[];
  weakAreas: unknown[];
  decision: unknown;
  review: unknown;
  progress: unknown;
  lessons: unknown;
  note: string;
  [k: string]: unknown;
}

export function myPack(id: string): Promise<MyPack> {
  return send<MyPack>("/api/my-pack", { query: { id } });
}

/**
 * The teacher's class pack, as a DOWNLOAD.
 *
 * The browser must fetch this one itself (it is an `<a href>`, not a `fetch`),
 * so it cannot go through `send` and the capability has to be built here rather
 * than spelled out at the link. It was spelled out at the link once, and a
 * teacher pressing Print got `{"error":"missing id"}` in a new tab — the pack
 * carries the week's answer key, so the door answers a member of the class and
 * nobody else, and a link that forgets the token fails in a way that looks like
 * the product being broken.
 */
export function classPackUrl(clsId: string, me: string, format: "html" | "json"): string {
  return buildUrl("/api/pack-export", { id: clsId, me, format }, capabilityFor("/api/pack-export", "GET"), "GET");
}

/** Free-text → the concept the learner means, plus the runners-up. `confident`
 *  is false when nothing cleared the signal floor: an honest "not sure" rather
 *  than the best of a bad set presented as an answer. */
export function matchText(text: string): Promise<{ match: MatchResult | null; alternatives: MatchResult[] }> {
  return send("/api/match", { method: "POST", body: { text } });
}

/** One tutor turn. Context is the SERVER's to assemble from the learner's own
 *  record; the client sends the question, not the history. */
export function tutorTurn(input: {
  conceptId: string;
  message: string;
  language: string;
  /** The question AS THE SCREEN SHOWS IT — context for the reply, never a fact
   *  about the serve, which is computed from the learner's own projection. */
  question?: string;
  /** Whose turn this is. Omitted for a signed-out visitor, who gets a
   *  concept-grounded reply; presenting an id without its capability is a
   *  refusal rather than a quiet downgrade. */
  id?: string | null;
}): Promise<{
  reply: string; mode?: string; answerSource?: string; labelKey?: string;
  aiUnavailable?: boolean; ai?: unknown; grounding?: unknown;
}> {
  return send("/api/tutor", { method: "POST", body: { ...input } });
}

/** The public concept genome: prerequisites, unlocks, generators, misconceptions. */
export function concepts(query: { concept?: string; subject?: string }): Promise<Record<string, unknown>> {
  return send("/api/concepts", { query });
}

// ─────────────────────────────────────────────────────────────────────────────
// PEOPLE — classes, assignments, rooms
// ─────────────────────────────────────────────────────────────────────────────

/** The rosters this learner belongs to (as a teacher, or as a member). */
export function classes(me: string): Promise<{ classes: ClassRoster[] }> {
  return send("/api/classes", { query: { me } });
}

export function classById(id: string, me: string): Promise<{ cls: ClassRoster }> {
  return send("/api/classes", { query: { id, me } });
}

/** ONE member's evidence in detail — the "what can this student demonstrate?"
 *  read. The door answers the class's TEACHER only (a member who is not the
 *  teacher is a 403), which is the server's rule, not this call's: a surface
 *  cannot widen it by asking. `learnerId` is identity — never a handle, since a
 *  class can hold two learners under one name. */
export function classMember(me: string, clsId: string, learnerId: string): Promise<{ member: ClassMemberEvidence }> {
  return send("/api/classes", { query: { me, id: clsId, learner: learnerId } });
}

export function classAction(input: { action: "create" | "join" | "report" | "update"; id: string; [k: string]: unknown }): Promise<Record<string, unknown>> {
  return send("/api/classes", { method: "POST", body: { ...input } });
}

/** One learner's own row on an assignment — a projection of THEIR ledger, so a
 *  panel can never carry a number the client computed differently, and never
 *  another member's work. */
export interface AssignedWork {
  assignment: Assignment;
  className: string;
  subject: SubjectId;
  mine: AssignmentMemberProgress;
}

/** A class the caller OWNS, with the concepts it may be set work on — computed
 *  by the door from the class's own declared curriculum, so a picker cannot
 *  offer something the door would refuse. */
export interface AssignableClass {
  id: string;
  name: string;
  subject: string | null;
  specificationId: string | null;
  assignable: string[];
}

export interface AssignmentBundle {
  assigned: AssignedWork[];
  monitor: AssignmentMonitor[];
  classes: AssignableClass[];
}

export function assignments(me: string): Promise<AssignmentBundle> {
  return send<AssignmentBundle>("/api/assignments", { query: { me } });
}

export function assignmentAction(input: { action: "create" | "remove"; id: string; clsId?: string; [k: string]: unknown }): Promise<Record<string, unknown>> {
  return send("/api/assignments", { method: "POST", body: { ...input } });
}

// §8 · THE EVIDENCE-TO-INTERVENTION LOOP. A teacher's door: the findings are
// derived SERVER-SIDE from the members' own ledgers, and every action answers
// the class's own teacher only. The shapes here are the DOOR's — local
// interfaces, because lib/types.ts stays free of anything a surface cannot read.

/** One finding, as the door derives it (lib/server/needs.ts). */
export interface ClassNeedView {
  id: string;
  conceptId: string;
  kind: "misconception" | "weak_rate" | "hint_dependent" | "prereq_gap" | "unmeasured";
  misconceptionId?: string;
  eligible: number;
  withEvidence: number;
  unmeasured: number;
  showing: number;
  unaidedRate: number | null;
  handles: string[];
  evIds: string[];
  thin: boolean;
  from: number;
  nowMs: number;
}

/** The record behind an open intervention, as the door stores it. */
export interface InterventionView {
  id: string;
  conceptId: string;
  kind: ClassNeedView["kind"];
  status: "proposed" | "assigned" | "declined" | "resolved" | "superseded";
  /** The intervention definition version the record was proposed under. */
  version: number;
  ownerId: string;
  createdAt: number;
  assignedAt?: number;
  baseAt?: number;
  assignmentId?: string;
  targetHandles?: string[];
  /** What the assignment actually covered, stamped at assign. */
  assignedConceptIds?: string[];
  /** The idea the outcome is read against, stamped at assign. */
  objectiveId?: string;
  finding: ClassNeedView;
}

/** Who needs what, across the classes the caller owns, for Teacher Home. */
export interface CrossClassNeed extends ClassNeedView {
  className: string;
  clsId: string;
}

export interface NeedsBundle {
  needs: ClassNeedView[];
  records: InterventionView[];
}

export function needs(me: string, clsId?: string): Promise<NeedsBundle & { className?: string }> {
  return send("/api/needs", { query: clsId ? { me, cls: clsId } : { me } });
}

export interface OutcomeView {
  verdict: "no_baseline" | "incomplete_followup" | "improved" | "no_change" | "still_difficult" | "not_enough_evidence";
  /** The idea the before/after comparison was made on. */
  objectiveId: string;
  members: Array<{
    handle: string;
    learnerId: string;
    before: { asked: number; correct: number };
    after: { asked: number; correct: number; unaided: { asked: number; correct: number }; hinted: { asked: number; correct: number } };
    untouchedAfter: boolean;
  }>;
  unmeasured: string[];
  baseAt: number;
}

export function needAction(input: {
  action: "propose" | "assign" | "decline" | "read" | "decide";
  id: string;
  clsId: string;
  [k: string]: unknown;
}): Promise<Record<string, unknown>> {
  return send("/api/needs", { method: "POST", body: { ...input } });
}

export function rooms(): Promise<{ rooms: StudyRoom[] }> {
  return send("/api/rooms");
}

export function roomAction(input: { action: "create" | "join" | "message" | "fork"; id?: string; [k: string]: unknown }): Promise<Record<string, unknown>> {
  return send("/api/rooms", { method: "POST", body: { ...input } });
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYMENT
// ─────────────────────────────────────────────────────────────────────────────

/** What this deployment is, and what it can actually do offline. Public by
 *  design: it describes the DEPLOYMENT, never a learner. */
export function hubStatus(): Promise<{
  hub: string; version: string; now: number; learners: number; rooms: number;
  classes: number; deployment?: Record<string, unknown>;
}> {
  return send("/api/hub-status");
}

/** The capability the operations above present, exposed for the two places that
 *  genuinely need the raw token (a download link, a diagnostic read). */
export { ensureSecret };
