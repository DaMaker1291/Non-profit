// ─────────────────────────────────────────────────────────────────────────────
// THE EVIDENCE LEDGER — the append-only record everything else is derived from.
//
// The architecture this replaces was: answer → mutate learner state → recommend.
// State was the truth, and once mutated, the reason for it was gone. That is why
// "why does OpenMind think I'm weak at this?" had no answer: the evidence had
// already been folded into counters and thrown away.
//
// The architecture now: action → EVIDENCE EVENT → ledger → projection → model →
// recommendation. The event is the truth. The learner model is one projection of
// it, a recommendation is another, and an impact claim is a third.
//
// The invariants, all asserted in the harness:
//   1. Events are NEVER rewritten or deleted. Correcting an interpretation means
//      re-projecting, not editing history.
//   2. Events are created SERVER-SIDE, from the same grading inputs the model
//      uses. A client cannot author evidence about itself (see /api/evidence).
//   3. Every event carries a schema version, so a later shape change is a
//      migration rather than a silent re-interpretation.
//   4. `unknown` stays distinct from `zero`: an absent measurement is null and
//      never folded into a 0.
//   5. Projection is deterministic and order-stable, so replaying the same
//      events always produces the same learner model — the property that makes
//      "improve the algorithm, keep the history" possible.
//
// Pure and dependency-light: no I/O lives here (that is lib/server/evidence.ts),
// so every claim about it is testable without a server.
// ─────────────────────────────────────────────────────────────────────────────

import type { SubjectId } from "./types";

/** Bump when a field's MEANING changes, not when one is added. */
export const EVIDENCE_SCHEMA_VERSION = 1;

/**
 * The projection algorithm's version — a different question from the schema's.
 *
 * `schemaVersion` says what an event MEANS. `PROJECTION_VERSION` says how
 * evidence is TURNED INTO a learner model. Keeping the two apart is the whole
 * point of an evidence ledger: the same events, projected by a better
 * algorithm, should produce a better model, and nobody's learning history has
 * to be rewritten to get it.
 *
 *     evidence @ schema 1  +  projection v1  →  learner model
 *     evidence @ schema 1  +  projection v2  →  a BETTER learner model
 *
 * Every projection reports the version that produced it (`projectionVersion`
 * on LearnerProjection, and on the profile's ProjectionBase), so a model on
 * screen can always be attributed to the algorithm that computed it — and an
 * old model can be re-derived rather than merely replaced.
 */
export const PROJECTION_VERSION = 2;

export type EvidenceSource =
  | "diagnostic"
  | "practice"
  | "retrieval"
  | "past_paper"
  | "transfer"
  | "project";

export type AnswerMode = "guided" | "independent" | "transfer";

/**
 * How the server came to know this event, which is a different question from
 * what it says.
 *
 *   "server" — the server graded it: the answer key never left the server, so
 *              the correctness is observed fact.
 *   "device" — a device reported it after working offline. The server did not
 *              watch it happen and CANNOT verify it. Such events are kept (the
 *              work was real) but never silently promoted to the same standing,
 *              and the impact report discloses the unverifiable share.
 */
export type Provenance = "server" | "device";

/**
 * Was this answer taken where the server could not see it?
 *
 * Two shapes mean the same thing to a learner reading their own record: an
 * event a device authored outright (`provenance: "device"`, the ingestion door)
 * and an answer the server graded only after it arrived from a device's offline
 * queue (`deviceAt` a real claim — the server watched the grading, but not the
 * answering). Both are disclosed as "recorded offline" rather than presented as
 * work the server observed, and the claimed time is the marker.
 */
export function isDeviceReported(e: EvidenceEvent): boolean {
  if (e.provenance === "device") return true;
  return e.type === "answer_submitted" && e.deviceAt !== null;
}

interface Base {
  /** Server-assigned, stable across retries: the ledger's idempotency key. */
  id: string;
  schemaVersion: number;
  learnerId: string;
  provenance: Provenance;
  /** Server clock. Never a client timestamp. */
  at: number;
  source: EvidenceSource;
  subject: SubjectId | null;
  conceptId: string | null;
  /** The course in force when this happened, so evidence stays interpretable
   *  after a learner changes specification. */
  specificationId: string | null;
}

export interface AnswerSubmitted extends Base {
  type: "answer_submitted";
  questionId: string;
  correct: boolean;
  chosen: number;
  mode: AnswerMode;
  hints: number;
  /** Marks, when the source is a marked paper. Null for single-answer items —
   *  an absent score is not a zero score. */
  score: { awarded: number; max: number } | null;
  ms: number | null;
  /** Misconception tags the question was built to target. */
  tags: string[];
  /**
   * WHEN THE DEVICE SAYS THE LEARNER ANSWERED IT — held and disclosed as the
   * device's own claim, and nothing more. Null for an answer the server watched
   * happen.
   *
   * This exists because offline work must survive a reconnect, and because the
   * learner's own account of when they did it is worth keeping. It is NOT
   * evidence about time: `at` (the server's clock, when the answer reached the
   * ledger) is what the projection reads for retention, for due dates and for
   * ordering, so a device cannot backdate its way to memory evidence, and a
   * clock that is wrong cannot reorder a learner's history.
   */
  deviceAt: number | null;
}

/** Build a server-observed answer event. The ONE constructor the live routes
 *  use, so provenance cannot be forgotten on a new call site. */
export function answerEvidence(input: {
  learnerId: string;
  at: number;
  source: EvidenceSource;
  subject: SubjectId | null;
  conceptId: string | null;
  specificationId: string | null;
  questionId: string;
  correct: boolean;
  chosen: number;
  mode: AnswerMode;
  hints: number;
  score?: { awarded: number; max: number } | null;
  ms?: number | null;
  tags?: string[];
  /** A device's claim about when this answer was given — see AnswerSubmitted.
   *  Preserved on the event, never trusted for scheduling. */
  deviceAt?: number | null;
  /** The event's id, when the caller has one that must be stable across
   *  retries — see submissionEventId. Normally minted here. */
  id?: string;
}): AnswerSubmitted {
  return {
    type: "answer_submitted",
    id: input.id ?? newEvidenceId(),
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    learnerId: input.learnerId,
    provenance: "server",
    at: input.at,
    source: input.source,
    subject: input.subject,
    conceptId: input.conceptId,
    specificationId: input.specificationId,
    questionId: input.questionId,
    correct: input.correct,
    chosen: input.chosen,
    mode: input.mode,
    hints: input.hints,
    score: input.score ?? null,
    ms: input.ms ?? null,
    tags: input.tags ?? [],
    deviceAt: input.deviceAt ?? null,
  };
}

export interface HintRequested extends Base {
  type: "hint_requested";
  questionId: string;
  level: number;
}

/**
 * A hint was asked for — an ACTION, recorded as one.
 *
 * It deliberately carries no model weight: the hint count that matters is the
 * one attached to the graded answer (the server kept that ledger while the
 * question was served), so folding hint actions into the concept tally would
 * double every hint. The fold ignores this event; `projection.totals.hintActions`
 * counts it. What it buys is that the request itself is in the history —
 * "the learner asked for help here, twice, before getting it" survives, even
 * though the model's own tally does not need it.
 */
export function hintEvidence(input: {
  learnerId: string;
  at: number;
  source: EvidenceSource;
  subject: SubjectId | null;
  conceptId: string | null;
  specificationId: string | null;
  questionId: string;
  level: number;
}): HintRequested {
  return {
    type: "hint_requested",
    id: newEvidenceId(),
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    learnerId: input.learnerId,
    provenance: "server",
    at: input.at,
    source: input.source,
    subject: input.subject,
    conceptId: input.conceptId,
    specificationId: input.specificationId,
    questionId: input.questionId,
    level: input.level,
  };
}

export interface DiagnosticCompleted extends Base {
  type: "diagnostic_completed";
  /** How many concepts the sitting actually measured. */
  concepts: number;
  /** The per-concept ladder state the sitting ended with — the seeds the live
   *  fold applied to the learner model. Server-minted; replay derives the
   *  numbers with ladderMastery rather than trusting any carried mastery. */
  seeds?: LadderSeed[];
}

/** One concept's diagnostic ladder, as the replay needs it. Deliberately NOT
 *  LadderState itself: mastery is re-derived server-side from the raw ladder
 *  counters, so an event can never hand the model a number. */
export interface LadderSeed {
  conceptId: string;
  asked: number;
  correct: number;
  done: boolean;
  stage: number;
  askedThisStage: number;
  correctThisStage: number;
  servedDifficulty: number[];
}

export interface PaperCompleted extends Base {
  type: "paper_completed";
  paperId: string;
  awarded: number;
  total: number;
}

export interface SessionCompleted extends Base {
  type: "session_completed";
  kind: string;
  asked: number;
  correct: number;
}

export type EvidenceEvent =
  | AnswerSubmitted
  | HintRequested
  | DiagnosticCompleted
  | PaperCompleted
  | SessionCompleted;

export type EvidenceType = EvidenceEvent["type"];

const ID_RE = /^ev_[A-Za-z0-9_-]{8,64}$/;
const LEARNER_RE = /^[A-Za-z0-9_-]{3,64}$/;

/** How far a device's claimed clock may sit from the server's before the claim
 *  is dropped as implausible. Generous on purpose — a phone that has been
 *  offline for a year is a real device — but finite, so a nonsense number
 *  cannot enter the ledger as a timestamp. */
const DEVICE_CLAIM_WINDOW_MS = 400 * 24 * 60 * 60 * 1000;

/** A device's claimed answer time, or null when it is absent or implausible.
 *  Recorded as the device's own claim and never used for scheduling: see
 *  AnswerSubmitted#deviceAt and the retention rule in projectLearner. The live
 *  answer route calls this too, so the claim is judged by ONE rule whichever
 *  door it arrives at. */
export function deviceClaimAt(value: unknown, at: number): number | null {
  const v = value;
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  // A claim that cannot be when the learner answered relative to when the
  // server received it is noise, not history.
  if (Math.abs(v - at) > DEVICE_CLAIM_WINDOW_MS) return null;
  return v;
}

/** Server-side id. Random, not derived: the ledger must not depend on a
 *  guessable function of the content, or two genuinely separate attempts at the
 *  same question (a re-sat paper) would collide and one would be dropped. */
export function newEvidenceId(): string {
  const rnd = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 24)
    ?? Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return `ev_${rnd}`;
}

/** The shape a device's submission token must have. Bounded, ASCII, no
 *  separators: it ends up inside a ledger event id. */
const SUBMISSION_RE = /^[A-Za-z0-9_-]{8,48}$/;

/**
 * THE IDEMPOTENCE SEAM for offline answers.
 *
 * A device that answered while offline names each submission with its own
 * token, and the ledger event's id is DERIVED from that token. This is what
 * makes a replay safe rather than lucky: the same submission delivered twice —
 * a dropped response, a double flush, two tabs draining one queue — mints the
 * same event id, so `appendEvidence` recognises it as one event and the
 * learner's work counts once.
 *
 * It is deliberately NOT derived from the content. The token names a
 * SUBMISSION, not a question, so two genuine attempts at the same question are
 * two different tokens and stay two events (which is why newEvidenceId is still
 * random: a re-sat paper must not collapse into its first sitting). A client
 * can therefore only ever suppress an event of its own, which it could do by
 * simply not sending it — and never another learner's, which is the boundary
 * that matters.
 *
 * Returns null for a token that is not well-formed, so the caller can fall back
 * to a fresh id rather than write a malformed one.
 */
export function submissionEventId(submissionId: unknown): string | null {
  if (typeof submissionId !== "string" || !SUBMISSION_RE.test(submissionId)) return null;
  return `ev_o${submissionId}`;
}

/**
 * Is this a well-formed event we will accept into the ledger?
 *
 * Deliberately strict and total: the ingestion endpoint is reachable by any
 * authenticated learner, so an unvalidated event is an unvalidated claim about
 * someone's learning. Returns the reason it was refused, because a dropped
 * event must never be silent.
 */
export function validateEvent(input: unknown, expectedLearnerId: string): { ok: true; event: EvidenceEvent } | { ok: false; reason: string } {
  if (!input || typeof input !== "object") return { ok: false, reason: "not_an_object" };
  const e = input as Record<string, unknown>;
  const str = (k: string): string | null => (typeof e[k] === "string" ? (e[k] as string) : null);
  const num = (k: string): number | null => (typeof e[k] === "number" && Number.isFinite(e[k]) ? (e[k] as number) : null);

  const id = str("id");
  if (!id || !ID_RE.test(id)) return { ok: false, reason: "bad_id" };
  const learnerId = str("learnerId");
  if (!learnerId || !LEARNER_RE.test(learnerId)) return { ok: false, reason: "bad_learner" };
  // Evidence about somebody else is never accepted, whatever the caller claims.
  if (learnerId !== expectedLearnerId) return { ok: false, reason: "learner_mismatch" };
  if (num("schemaVersion") !== EVIDENCE_SCHEMA_VERSION) return { ok: false, reason: "schema_mismatch" };
  const at = num("at");
  if (at === null || at <= 0) return { ok: false, reason: "bad_time" };
  const source = str("source");
  if (!source || !SOURCES.includes(source as EvidenceSource)) return { ok: false, reason: "bad_source" };

  const shared = {
    id,
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    learnerId,
    // Anything that arrives over the wire is a claim by the device, even if the
    // body says "server". Only lib/evidence-server paths may mint server truth.
    provenance: "device" as const,
    at,
    source: source as EvidenceSource,
    subject: (str("subject") as SubjectId | null) ?? null,
    conceptId: str("conceptId"),
    specificationId: str("specificationId"),
  };

  switch (e.type) {
    case "answer_submitted": {
      const questionId = str("questionId");
      if (!questionId) return { ok: false, reason: "bad_question" };
      if (typeof e.correct !== "boolean") return { ok: false, reason: "bad_correct" };
      const mode = str("mode");
      if (mode !== "guided" && mode !== "independent" && mode !== "transfer") return { ok: false, reason: "bad_mode" };
      const chosen = num("chosen");
      if (chosen === null || chosen < 0 || !Number.isInteger(chosen)) return { ok: false, reason: "bad_choice" };
      const hints = num("hints") ?? 0;
      if (hints < 0 || !Number.isInteger(hints)) return { ok: false, reason: "bad_hints" };
      const tags = Array.isArray(e.tags) ? (e.tags as unknown[]).filter((t): t is string => typeof t === "string").slice(0, 8) : [];
      const scoreRaw = e.score as { awarded?: unknown; max?: unknown } | null | undefined;
      const score = scoreRaw && typeof scoreRaw === "object"
        && typeof scoreRaw.awarded === "number" && typeof scoreRaw.max === "number" && scoreRaw.max > 0
        ? { awarded: Math.max(0, scoreRaw.awarded), max: scoreRaw.max }
        : null;
      return { ok: true, event: { ...shared, type: "answer_submitted", questionId, correct: e.correct, chosen, mode, hints, score, ms: num("ms"), tags, deviceAt: deviceClaimAt(e.deviceAt, at) } };
    }
    case "hint_requested": {
      const questionId = str("questionId");
      const level = num("level");
      if (!questionId) return { ok: false, reason: "bad_question" };
      if (level === null || level < 1 || level > 4) return { ok: false, reason: "bad_level" };
      return { ok: true, event: { ...shared, type: "hint_requested", questionId, level } };
    }
    case "diagnostic_completed": {
      const concepts = num("concepts");
      if (concepts === null || concepts < 0) return { ok: false, reason: "bad_concepts" };
      // Seeds are optional (legacy events carry none) but if present they must
      // be well-formed: the replay folds them into the learner model, so a
      // malformed seed would corrupt a rebuild. Ask/correct are bounded, and
      // correctness can never exceed what was asked.
      let seeds: LadderSeed[] | undefined;
      const raw = e.seeds;
      if (raw !== undefined) {
        if (!Array.isArray(raw)) return { ok: false, reason: "bad_seeds" };
        seeds = [];
        for (const s of raw) {
          const o = s as Record<string, unknown>;
          const cid = o.conceptId;
          const asked = o.asked;
          const correct = o.correct;
          const stage = o.stage;
          const askedThisStage = o.askedThisStage;
          const correctThisStage = o.correctThisStage;
          const served = o.servedDifficulty;
          if (
            typeof cid !== "string" || !cid ||
            typeof asked !== "number" || asked < 0 || !Number.isInteger(asked) ||
            typeof correct !== "number" || correct < 0 || correct > asked ||
            typeof o.done !== "boolean" ||
            typeof stage !== "number" || stage < 0 || !Number.isInteger(stage) ||
            typeof askedThisStage !== "number" || askedThisStage < 0 ||
            typeof correctThisStage !== "number" || correctThisStage < 0 || correctThisStage > askedThisStage ||
            !Array.isArray(served) || served.some((d) => typeof d !== "number" || d < 0 || d > 1)
          ) {
            return { ok: false, reason: "bad_seeds" };
          }
          seeds.push({
            conceptId: cid, asked, correct, done: o.done, stage,
            askedThisStage, correctThisStage,
            servedDifficulty: (served as number[]).slice(0, 64),
          });
        }
      }
      return { ok: true, event: { ...shared, type: "diagnostic_completed", concepts, seeds } };
    }
    case "paper_completed": {
      const paperId = str("paperId");
      const awarded = num("awarded");
      const total = num("total");
      if (!paperId) return { ok: false, reason: "bad_paper" };
      if (awarded === null || total === null || total <= 0 || awarded < 0) return { ok: false, reason: "bad_marks" };
      return { ok: true, event: { ...shared, type: "paper_completed", paperId, awarded, total } };
    }
    case "session_completed": {
      const kind = str("kind");
      const asked = num("asked");
      const correct = num("correct");
      if (!kind) return { ok: false, reason: "bad_kind" };
      if (asked === null || correct === null || asked < 0 || correct < 0 || correct > asked) return { ok: false, reason: "bad_counts" };
      return { ok: true, event: { ...shared, type: "session_completed", kind, asked, correct } };
    }
    default:
      return { ok: false, reason: "unknown_type" };
  }
}

export const SOURCES: EvidenceSource[] = ["diagnostic", "practice", "retrieval", "past_paper", "transfer", "project"];

// ── Projection ───────────────────────────────────────────────────────────────
// One projection: what a stream of events says about each concept. This is
// deliberately the SAME shape ConceptProgress carries, so the ledger can be
// reconciled against the live learner model instead of quietly disagreeing with
// it (see reconcile).

export interface ConceptLedger {
  conceptId: string;
  attempts: number;
  correct: number;
  hints: number;
  independent: { asked: number; correct: number };
  transfer: { asked: number; correct: number };
  /** Retention evidence: a concept the scheduler had due, retrieved hint-free at
   *  least a day after the previous evidence on it. Separate from `independent`
   *  because recalling something after a week is a different claim from
   *  answering it in the sitting where it was taught. */
  retention: { asked: number; correct: number };
  /** Diagnostic/assessment evidence, the kind that measures rather than teaches. */
  measured: { asked: number; correct: number };
  /** Slips still being made, by pattern. */
  misconceptions: Record<string, number>;
  firstAt: number;
  lastAt: number;
}

export interface LearnerProjection {
  learnerId: string | null;
  /** Which projection algorithm produced this. See PROJECTION_VERSION. */
  projectionVersion: number;
  events: number;
  firstAt: number | null;
  lastAt: number | null;
  byConcept: Record<string, ConceptLedger>;
  totals: {
    answers: number;
    correct: number;
    /** Hints attached to graded answers — the server's per-question ledger. */
    hints: number;
    /** Hint actions observed live in the stream (a hint_requested event). */
    hintActions: number;
    independent: { asked: number; correct: number };
    transfer: { asked: number; correct: number };
    retention: { asked: number; correct: number };
    sessions: number;
    diagnostics: number;
    papers: number;
  };
}

/** Stable ordering: server time, then id. Two events with the same clock value
 *  must not swap places between runs, or replay stops being deterministic. */
export function orderEvents(events: readonly EvidenceEvent[]): EvidenceEvent[] {
  return [...events].sort((a, b) => (a.at - b.at) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function emptyLedger(conceptId: string, at: number): ConceptLedger {
  return {
    conceptId, attempts: 0, correct: 0, hints: 0,
    independent: { asked: 0, correct: 0 },
    transfer: { asked: 0, correct: 0 },
    retention: { asked: 0, correct: 0 },
    measured: { asked: 0, correct: 0 },
    misconceptions: {},
    firstAt: at, lastAt: at,
  };
}

/**
 * Fold events into a learner projection. Deterministic: the same events in any
 * order produce the same result, which is what makes `rebuild` safe to run
 * after an algorithm change.
 */
export function projectLearner(events: readonly EvidenceEvent[]): LearnerProjection {
  const ordered = orderEvents(events);
  const byConcept: Record<string, ConceptLedger> = {};
  const totals: LearnerProjection["totals"] = {
    answers: 0, correct: 0, hints: 0, hintActions: 0,
    independent: { asked: 0, correct: 0 },
    transfer: { asked: 0, correct: 0 },
    retention: { asked: 0, correct: 0 },
    sessions: 0, diagnostics: 0, papers: 0,
  };

  for (const e of ordered) {
    switch (e.type) {
      case "answer_submitted": {
        totals.answers += 1;
        if (e.correct) totals.correct += 1;
        // RETENTION, decided from the ledger alone. A retrieval proves durable
        // memory only against a concept that had already aged: the previous
        // evidence on it is at least a day old, and the answer needed no hints.
        // Read BEFORE this answer moves the record, and computed here — once —
        // so the concept's own count and the learner's total cannot drift apart.
        // The identical rule lives in lib/progress.ts#recordAnswer, which is what
        // makes the live model and this projection agree by construction.
        //
        // BOTH stamps are the SERVER's clock (`e.at`), deliberately. A device
        // that reports its offline work also reports when it says it answered
        // (`e.deviceAt`); that claim is kept on the event and shown to the
        // learner, but it is not read here. If it were, a device could backdate
        // a batch and manufacture a memory it never demonstrated.
        const prior = e.conceptId ? (byConcept[e.conceptId] ??= emptyLedger(e.conceptId, e.at)) : null;
        const priorAt = prior && prior.attempts > 0 ? prior.lastAt : null;
        const retained = priorAt !== null && e.source === "retrieval" && e.hints === 0
          && e.at - priorAt >= 24 * 60 * 60 * 1000;
        if (e.conceptId) {
          const c = prior!;
          c.attempts += 1;
          if (e.correct) c.correct += 1;
          // The hint count ATTACHED TO THE ANSWER is authoritative for that
          // question: the server kept the ledger while it was served. Counting
          // the live hint actions as well would double every hint.
          c.hints += e.hints;
          if (e.mode === "independent") { c.independent.asked += 1; if (e.correct && e.hints === 0) c.independent.correct += 1; }
          if (e.mode === "transfer") { c.transfer.asked += 1; if (e.correct && e.hints === 0) c.transfer.correct += 1; }
          if (retained) { c.retention.asked += 1; if (e.correct) c.retention.correct += 1; }
          // A diagnostic or paper answer MEASURES; practice teaches. Keeping them
          // apart is what stops "improvement" from being rehearsal.
          if (e.source === "diagnostic" || e.source === "past_paper") { c.measured.asked += 1; if (e.correct) c.measured.correct += 1; }
          if (!e.correct) for (const t of e.tags) c.misconceptions[t] = (c.misconceptions[t] ?? 0) + 1;
          c.lastAt = Math.max(c.lastAt, e.at);
          c.firstAt = Math.min(c.firstAt, e.at);
        }
        if (e.mode === "independent") { totals.independent.asked += 1; if (e.correct && e.hints === 0) totals.independent.correct += 1; }
        if (e.mode === "transfer") { totals.transfer.asked += 1; if (e.correct && e.hints === 0) totals.transfer.correct += 1; }
        if (retained) { totals.retention.asked += 1; if (e.correct) totals.retention.correct += 1; }
        totals.hints += e.hints;
        break;
      }
      case "hint_requested": {
        // Counted separately, never folded into the per-concept hint tally —
        // see the answer branch above.
        totals.hintActions += 1;
        if (e.conceptId) byConcept[e.conceptId] ??= emptyLedger(e.conceptId, e.at);
        break;
      }
      case "diagnostic_completed": totals.diagnostics += 1; break;
      case "paper_completed": totals.papers += 1; break;
      case "session_completed": totals.sessions += 1; break;
    }
  }

  return {
    learnerId: ordered[0]?.learnerId ?? null,
    projectionVersion: PROJECTION_VERSION,
    events: ordered.length,
    firstAt: ordered[0]?.at ?? null,
    lastAt: ordered[ordered.length - 1]?.at ?? null,
    byConcept,
    totals,
  };
}

export interface ReconcileDifference {
  conceptId: string;
  field: string;
  ledger: number;
  model: number;
}

/**
 * Does the ledger agree with the live learner model?
 *
 * This is the safety net that made introducing a ledger possible without a
 * rewrite: the existing model keeps running, and every divergence is reported
 * instead of assumed away. Compared on the fields both sides actually keep.
 */
export function reconcile(
  projection: LearnerProjection,
  progress: Record<string, {
    attempts?: number; correct?: number;
    independent?: { asked: number; correct: number };
    transfer?: { asked: number; correct: number };
    retention?: { asked: number; correct: number };
    misconceptions?: Record<string, number>;
  }>,
): ReconcileDifference[] {
  const out: ReconcileDifference[] = [];
  const ids = new Set([...Object.keys(projection.byConcept), ...Object.keys(progress)]);
  for (const id of ids) {
    const l = projection.byConcept[id];
    const m = progress[id];
    if (!l) { out.push({ conceptId: id, field: "ledger", ledger: 0, model: m?.attempts ?? 0 }); continue; }
    if (!m) { out.push({ conceptId: id, field: "model", ledger: l.attempts, model: 0 }); continue; }
    if (l.attempts !== (m.attempts ?? 0)) out.push({ conceptId: id, field: "attempts", ledger: l.attempts, model: m.attempts ?? 0 });
    if (l.correct !== (m.correct ?? 0)) out.push({ conceptId: id, field: "correct", ledger: l.correct, model: m.correct ?? 0 });
    // Independence and transfer are compared ONLY where the live model keeps
    // them. Reporting a divergence against a field the model does not track
    // would be noise, not a finding — and noise here would get the check
    // switched off, which is how a reconciliation stops protecting anything.
    if (m.independent && l.independent.asked !== m.independent.asked) out.push({ conceptId: id, field: "independent.asked", ledger: l.independent.asked, model: m.independent.asked });
    if (m.transfer && l.transfer.asked !== m.transfer.asked) out.push({ conceptId: id, field: "transfer.asked", ledger: l.transfer.asked, model: m.transfer.asked });
    if (m.retention && l.retention.asked !== m.retention.asked) out.push({ conceptId: id, field: "retention.asked", ledger: l.retention.asked, model: m.retention.asked });
    if (m.retention && l.retention.correct !== m.retention.correct) out.push({ conceptId: id, field: "retention.correct", ledger: l.retention.correct, model: m.retention.correct });
    // Slips, per pattern: the ledger's tags must add up to the model's counts,
    // or the ledger is describing a different learner than the one being taught.
    const modelHits = m.misconceptions ?? {};
    for (const tag of new Set([...Object.keys(l.misconceptions), ...Object.keys(modelHits)])) {
      const ledgerHits = l.misconceptions[tag] ?? 0;
      const modelCount = modelHits[tag] ?? 0;
      if (ledgerHits !== modelCount) out.push({ conceptId: id, field: `misconception.${tag}`, ledger: ledgerHits, model: modelCount });
    }
  }
  return out;
}

// ── Impact ───────────────────────────────────────────────────────────────────
// The learner model answers "what does this learner know?". This answers the
// different question "is any of this working?" — and, crucially, what it CANNOT
// say.

export interface Rate { asked: number; correct: number }

export interface ImpactSnapshot {
  /** Null for a cohort figure; set for one learner. */
  learnerId: string | null;
  period: { from: number | null; to: number | null };
  /** The first measurement of this learner, which is what "change" is measured
   *  against. `assessed: false` means we have NO baseline and must not pretend
   *  a change exists. */
  baseline: { at: number | null; assessed: false } | { at: number; assessed: true; measured: Rate };
  /** Current standing, from measurements only (diagnostics and papers). */
  current: { measured: Rate | null; independent: Rate | null; transfer: Rate | null; retention: Rate | null };
  concepts: {
    touched: number;
    withIndependentProof: number;
    withTransferProof: number;
    /** Concepts re-measured after an interval — the only durable-memory claim. */
    withRetentionProof: number;
  };
  sessions: number;
  /** Events this learner's device reported rather than the server observing.
   *  Real work, but unverifiable — disclosed, never averaged in silently. */
  deviceReported: number;
  /** Everything this snapshot could NOT measure, named rather than omitted. */
  unmeasured: string[];
}

/**
 * A snapshot is only allowed to claim what the evidence shows. If there is no
 * baseline it says `assessed: false`; if a dimension has no observations it
 * returns null rather than 0 — the same rule the diagnostic obeys.
 */
export function impactSnapshot(events: readonly EvidenceEvent[]): ImpactSnapshot {
  const ordered = orderEvents(events);
  const p = projectLearner(ordered);
  const answers = ordered.filter((e): e is AnswerSubmitted => e.type === "answer_submitted");

  const measuredAnswers = answers.filter((e) => e.source === "diagnostic" || e.source === "past_paper");
  const rate = (list: AnswerSubmitted[]): Rate | null => (list.length ? { asked: list.length, correct: list.filter((a) => a.correct).length } : null);

  // The baseline is the EARLIEST measuring sitting, taken from the events that
  // belong to it — not the learner's first-ever answer, which may be practice.
  const firstMeasured = measuredAnswers[0];
  let baseline: ImpactSnapshot["baseline"] = { at: null, assessed: false };
  let currentMeasured: Rate | null = rate(measuredAnswers);
  if (firstMeasured) {
    const windowEnd = firstMeasured.at + 1000 * 60 * 60 * 6; // one sitting
    const sitting = measuredAnswers.filter((a) => a.at <= windowEnd);
    baseline = { at: firstMeasured.at, assessed: true, measured: { asked: sitting.length, correct: sitting.filter((a) => a.correct).length } };
    const later = measuredAnswers.filter((a) => a.at > windowEnd);
    currentMeasured = later.length ? rate(later) : null;
  }

  const withProof = (pick: (c: ConceptLedger) => Rate) =>
    Object.values(p.byConcept).filter((c) => { const r = pick(c); return r.asked > 0 && r.correct > 0; }).length;

  const unmeasured: string[] = [];
  if (!baseline.assessed) unmeasured.push("no baseline assessment: nothing before/after can be claimed");
  if (!currentMeasured) unmeasured.push("no measurement after the baseline: the change is unknown, not zero");
  if (!p.totals.transfer.asked) unmeasured.push("transfer: never attempted");
  if (!p.totals.independent.asked) unmeasured.push("independent work: never attempted without hints");
  // Retention is a measurement now, not an aspiration: a due concept retrieved
  // hint-free after it had aged is retention evidence. When the ledger holds
  // none, that is stated as the gap it is — the snapshot never implies a
  // learner has forgotten something it merely never re-asked them.
  if (!p.totals.retention.asked) unmeasured.push("retention: no concept has been re-measured after an interval yet");
  unmeasured.push("causation: this is observational evidence, not a controlled comparison");
  // Includes answers the server graded only after they arrived from a device's
  // offline queue: the marking is observed, the answering was not.
  const device = ordered.filter(isDeviceReported).length;
  if (device) unmeasured.push(`${device} of ${ordered.length} events were answered or reported on a device, not observed by the server as they happened`);

  return {
    learnerId: p.learnerId,
    period: { from: p.firstAt, to: p.lastAt },
    baseline,
    current: {
      measured: currentMeasured,
      independent: p.totals.independent.asked ? p.totals.independent : null,
      transfer: p.totals.transfer.asked ? p.totals.transfer : null,
      retention: p.totals.retention.asked ? p.totals.retention : null,
    },
    concepts: {
      touched: Object.keys(p.byConcept).length,
      withIndependentProof: withProof((c) => c.independent),
      withTransferProof: withProof((c) => c.transfer),
      withRetentionProof: withProof((c) => c.retention),
    },
    sessions: p.totals.sessions,
    deviceReported: device,
    unmeasured,
  };
}

export interface ImpactReport {
  period: { from: number | null; to: number | null };
  population: {
    learners: number;
    withBaseline: number;
    withFollowUpMeasurement: number;
    withIndependentEvidence: number;
    withTransferEvidence: number;
  };
  evidence: {
    events: number;
    answers: number;
    diagnostics: number;
    papers: number;
    hints: number;
    /** The share of evidence the server did not watch happen. */
    deviceReported: number;
  };
  outcome: {
    /** Concepts where a learner has independent, hint-free proof. */
    conceptsWithIndependentProof: number;
    /** Learners whose measured rate improved between their first and last
     *  measuring sitting. Null when nobody has both — never 0. */
    learnersImproving: { improved: number; of: number } | null;
  };
  /** Stated on every report, so a number can never be quoted without them. */
  limitations: string[];
  /** Aggregate only. Present so a caller cannot accidentally render learners. */
  containsIndividualData: false;
}

/**
 * The deployment-level report. Aggregates only — by construction it cannot leak
 * a learner, and it refuses to compute a change for learners who lack both a
 * baseline and a later measurement (they are excluded from the denominator, not
 * counted as "no improvement").
 */
export function generateImpactReport(perLearner: readonly { learnerId: string; events: readonly EvidenceEvent[] }[]): ImpactReport {
  const all: EvidenceEvent[] = [];
  let withBaseline = 0, withFollowUp = 0, withIndependent = 0, withTransfer = 0;
  let improving = 0, comparable = 0;

  for (const l of perLearner) {
    const ordered = orderEvents(l.events);
    all.push(...ordered);
    const snap = impactSnapshot(ordered);
    if (snap.baseline.assessed) withBaseline += 1;
    if (snap.baseline.assessed && snap.current.measured) withFollowUp += 1;
    if (snap.current.independent) withIndependent += 1;
    if (snap.current.transfer) withTransfer += 1;
    if (snap.baseline.assessed && snap.current.measured) {
      comparable += 1;
      const b = snap.baseline.assessed ? snap.baseline.measured : null;
      const c = snap.current.measured;
      if (b && c && b.asked > 0 && c.asked > 0 && c.correct / c.asked > b.correct / b.asked) improving += 1;
    }
  }

  const projection = projectLearner(all);
  const conceptsWithIndependentProof = Object.values(projection.byConcept)
    .filter((c) => c.independent.asked > 0 && c.independent.correct > 0).length;

  return {
    period: { from: projection.firstAt, to: projection.lastAt },
    population: {
      learners: perLearner.length,
      withBaseline,
      withFollowUpMeasurement: withFollowUp,
      withIndependentEvidence: withIndependent,
      withTransferEvidence: withTransfer,
    },
    evidence: {
      events: all.length,
      answers: projection.totals.answers,
      diagnostics: projection.totals.diagnostics,
      papers: projection.totals.papers,
      hints: projection.totals.hints,
      deviceReported: all.filter(isDeviceReported).length,
    },
    outcome: {
      conceptsWithIndependentProof,
      learnersImproving: comparable ? { improved: improving, of: comparable } : null,
    },
    limitations: [
      "Changes are between a learner's own sittings, not against a control group: this is not a causal claim.",
      "Learners without a baseline assessment and a later measurement are excluded from the change figures, never counted as unchanged.",
      "Question difficulty is not held constant between sittings beyond the diagnostic's own parallel-form sampling.",
      "A learner who stops using OpenMind cannot be measured at all, so these figures describe people who stayed.",
      "Device-reported events were recorded offline and verified by nobody; they are counted and disclosed separately rather than mixed into server-observed results.",
    ],
    containsIndividualData: false,
  };
}
