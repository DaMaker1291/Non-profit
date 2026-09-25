// ─────────────────────────────────────────────────────────────────────────────
// THE CLOSED LEARNING LOOP.
//
// "Progress recorded" is not the same thing as "the learner model meaningfully
// changed". Before this module the app could record twenty answers and still
// recommend exactly what it recommended before — a progress tracker wearing an
// adaptive system's clothes. This module makes the difference explicit:
//
//   capture a baseline → the practice API records evidence → recompute the
//   next step from the same ProfileState → report the difference, honestly.
//
// Deliberate properties:
//   · The baseline is captured BEFORE the first answer, so the "before" column
//     is a fact, not a reconstruction.
//   · The diff is computed from the engines that already exist (mastery,
//     learner-model, next-engine) — no second model, no second truth.
//   · `changeReason` says WHY the plan moved, and admits when it did not.
//     Nothing here is ever allowed to claim adaptation that did not happen.
//   · Structural only: no composed text crosses this boundary, so a persisted
//     summary can never freeze one language into a learner's profile.
// Pure, offline, deterministic — like every engine in this project.
// ─────────────────────────────────────────────────────────────────────────────

import { getConcept } from "./genome";
import { integratedMastery } from "./mastery";
import { buildSnapshot } from "./learner-model";
import { decideOne, decisionContext } from "./decision";
import type { NextAction, NextKind, NextT } from "./next-engine";
import type { EvidenceEvent } from "./evidence";
import type { ConceptProgress, ProfileState } from "./types";

/** The explicit lifecycle of one learning session (page state ≠ route state). */
export type LearningLifecycle =
  | "idle" | "active" | "submitting" | "feedback" | "completed" | "sync_pending";

/** Questions a session aims for. Short enough to finish in one sitting on a
 *  shared phone, long enough for the EWMA and the proof records to move. */
export const SESSION_TARGET = 5;
/** An unfinished session older than this is abandoned, not resumed. */
export const SESSION_TTL_MS = 6 * 60 * 60 * 1000;

export type Band = "new" | "learning" | "developing" | "strong";

/** Bands are the only vocabulary a learner sees; the numbers stay internal. */
export function bandOf(mastery: number, attempts: number): Band {
  if (attempts === 0 || mastery <= 0) return "new";
  if (mastery >= 0.9) return "strong";
  if (mastery >= 0.65) return "developing";
  return "learning";
}

export interface SessionMetrics {
  /** The integrated number every engine reads (lib/mastery.ts). */
  mastery: number;
  /** EWMA of graded answers — what was answered, not what was proven. */
  accuracy: number;
  /** Hint-free proof rate, null until hint-free proof exists at all. */
  independence: number | null;
  /** Unfamiliar-wording proof rate, null until it has been attempted. */
  transfer: number | null;
  /** Correct DELAYED recalls on this concept. A count, not a rate: the question
   *  a learner asks after a review is "did it stick?", and a failed recall
   *  leaves this where it was rather than reporting a falling score. */
  retentionCorrect: number;
  band: Band;
}

/** Metrics for one concept, straight from the evidence record. */
export function metricsOf(p: ConceptProgress | undefined): SessionMetrics {
  if (!p) {
    return { mastery: 0, accuracy: 0, independence: null, transfer: null, retentionCorrect: 0, band: "new" };
  }
  const parts = integratedMastery(p);
  const rate = (e?: { asked: number; correct: number }) =>
    e && e.asked > 0 ? e.correct / e.asked : null;
  return {
    mastery: parts.integrated,
    accuracy: parts.accuracy,
    independence: rate(p.independent),
    transfer: rate(p.transfer),
    retentionCorrect: p.retention?.correct ?? 0,
    band: bandOf(parts.integrated, p.attempts),
  };
}

/** The misconception a concept's record points at most strongly, if any. */
export function topMistake(p: ConceptProgress | undefined): { id: string; hits: number } | null {
  if (!p) return null;
  const hit = Object.entries(p.misconceptions)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])[0];
  return hit ? { id: hit[0], hits: hit[1] } : null;
}

/** The structural part of a next-step action: what to do, where, how long.
 *  Text is deliberately excluded — see the note at the top of this file. */
export interface SessionStepCore {
  kind: NextKind;
  conceptId: string | null;
  minutes: number;
  href: string;
}

function coreOf(a: NextAction | undefined): SessionStepCore | null {
  return a ? { kind: a.kind, conceptId: a.conceptId, minutes: a.minutes, href: a.href } : null;
}

/** Did the plan actually move? Compared on kind + concept, not on wording. */
export function sameStep(a: SessionStepCore | null, b: SessionStepCore | null): boolean {
  if (!a || !b) return a === b;
  return a.kind === b.kind && a.conceptId === b.conceptId;
}

/** i18n key for a next-step kind's title — shared by the result screen and
 *  Home so both name the same action the same way. */
export function kindTitleKey(kind: NextKind): string {
  switch (kind) {
    case "PRACTISE": return "next.title.practise";
    case "RETRIEVE": return "next.title.retrieve";
    case "REMEDIATE": return "next.title.fix";
    case "CHALLENGE": return "next.title.challenge";
    case "TRANSFER": return "next.title.stretch";
    case "PROJECT": return "next.title.build";
    case "REST": return "next.title.caughtUp";
    default: return "next.title.learn";
  }
}

export interface SessionCounts {
  touched: number;
  strong: number;
  due: number;
}

/** What the engines knew before the session's first answer. */
export interface SessionBaseline {
  metrics: SessionMetrics;
  attempts: number;
  mistake: { id: string; hits: number } | null;
  /** The recommendation in force when the session started. */
  step: SessionStepCore | null;
  counts: SessionCounts;
}

/** Server-attributed activity for the session. The client reports none of it:
 *  every field is incremented where the grading actually happens. */
export interface SessionActivity {
  asked: number;
  correct: number;
  /** Hint-free answers (practice without hints, or a prove-it attempt). */
  independentAsked: number;
  independentCorrect: number;
  /** Genuinely re-framed questions — the strongest evidence there is. */
  transferAsked: number;
  transferCorrect: number;
  hints: number;
  durationMs: number;
}

export function emptyActivity(): SessionActivity {
  return {
    asked: 0, correct: 0,
    independentAsked: 0, independentCorrect: 0,
    transferAsked: 0, transferCorrect: 0,
    hints: 0, durationMs: 0,
  };
}

/** The live session record. Stored server-side on the profile as transient
 *  state (stripped before the profile crosses the wire) — never on the client,
 *  because a client that can edit its own baseline can fake adaptation. */
export interface SessionLedger {
  conceptId: string;
  /** Which action opened it: a REMEDIATE session is different work from a
   *  CHALLENGE one, and the result screen says so. */
  kind: NextKind;
  target: number;
  startedAt: number;
  baseline: SessionBaseline;
  activity: SessionActivity;
}

export function captureBaseline(
  state: ProfileState,
  conceptId: string,
  tt?: NextT,
  /** The learner's ledger. Passed so the baseline's "step" is the SAME decision
   *  Home will make: a session that recorded a different next action from the
   *  one the learner acted on could never honestly report a moved plan. */
  events?: readonly EvidenceEvent[],
): SessionBaseline {
  const snap = buildSnapshot(state);
  const p = state.progress[conceptId];
  return {
    metrics: metricsOf(p),
    attempts: p?.attempts ?? 0,
    mistake: topMistake(p),
    step: coreOf(decideOne(decisionContext(state, events ?? []), { tt })),
    counts: { touched: snap.touched, strong: snap.strong, due: snap.dueCount },
  };
}

/** Start, or resume, a session on one concept.
 *
 *  Resuming is deliberate: a learner who loses the connection (or the tab)
 *  mid-session continues the same session rather than being handed a fresh
 *  baseline that erases what they already did. */
export function openSession(
  state: ProfileState,
  conceptId: string,
  kind: NextKind,
  existing: SessionLedger | null | undefined,
  target = SESSION_TARGET,
  now = Date.now(),
  tt?: NextT,
  /** The learner's ledger — see captureBaseline. */
  events?: readonly EvidenceEvent[],
): { ledger: SessionLedger; resumed: boolean } {
  if (existing && existing.conceptId === conceptId && now - existing.startedAt < SESSION_TTL_MS) {
    return { ledger: existing, resumed: true };
  }
  return {
    ledger: {
      conceptId,
      kind,
      target,
      startedAt: now,
      baseline: captureBaseline(state, conceptId, tt, events),
      activity: emptyActivity(),
    },
    resumed: false,
  };
}

/** i18n key for the reason field — the result screen and Home must explain the
 *  same change the same way, in the learner's language. */
export function reasonKey(reason: ChangeReason): string {
  switch (reason) {
    case "mastery-up": return "sess.r.masteryUp";
    case "mastery-down": return "sess.r.masteryDown";
    default: return `sess.r.${reason}`;
  }
}

export type ChangeReason =
  /** Delayed recall that held: the knowledge survived the gap between the
   *  sitting that taught it and this one. Rarer than transfer, and the only
   *  reason that speaks to memory rather than to understanding. */
  | "retained"
  /** Unfamiliar-wording proof — the strongest signal a learner can give. */
  | "transfer"
  /** A named misconception recurred, or the plan switched to repairing one. */
  | "misconception"
  /** Hint-free answers changed the picture. */
  | "independence"
  | "mastery-up"
  | "mastery-down"
  /** Evidence moved, but not enough to change the recommendation. */
  | "same"
  /** Nothing was answered. */
  | "unchanged";

export interface SessionResult {
  conceptId: string;
  subject: string;
  kind: NextKind;
  startedAt: number;
  finishedAt: number;
  /** Wall-clock minutes, rounded — what the learner actually spent. */
  minutes: number;
  activity: SessionActivity;
  before: SessionMetrics;
  after: SessionMetrics;
  delta: { mastery: number; independence: number | null };
  mistake: { id: string; before: number; after: number } | null;
  proof: { independent: boolean; transfer: boolean };
  previousStep: SessionStepCore | null;
  nextStep: SessionStepCore | null;
  nextStepChanged: boolean;
  changeReason: ChangeReason;
  counts: SessionCounts;
}

/** The persisted form: everything Home needs, nothing that freezes a language. */
export interface SessionSummary {
  conceptId: string;
  kind: NextKind;
  at: number;
  activity: SessionActivity;
  before: SessionMetrics;
  after: SessionMetrics;
  mistake: { id: string; before: number; after: number } | null;
  changeReason: ChangeReason;
  nextStepChanged: boolean;
  nextStep: SessionStepCore | null;
}

export function toSummary(r: SessionResult): SessionSummary {
  return {
    conceptId: r.conceptId,
    kind: r.kind,
    at: r.finishedAt,
    activity: r.activity,
    before: r.before,
    after: r.after,
    mistake: r.mistake,
    changeReason: r.changeReason,
    nextStepChanged: r.nextStepChanged,
    nextStep: r.nextStep,
  };
}

function changeReasonFor(
  r: Omit<SessionResult, "changeReason">,
  previousStep: SessionStepCore | null,
  nextStep: SessionStepCore | null,
): ChangeReason {
  const { activity, delta, proof, mistake } = r;
  if (activity.asked === 0) return "unchanged";
  // A held delayed recall outranks every other reason: it is the one claim that
  // says the teaching stuck rather than merely landed. A FAILED recall does not
  // reach this branch (the count did not rise) and reports the mastery pull-back
  // it caused, which is the honest sentence for it.
  if (r.after.retentionCorrect > r.before.retentionCorrect) return "retained";
  if (proof.transfer) return "transfer";
  const mistakeRose = mistake ? mistake.after > mistake.before : false;
  const nowRepairing = nextStep?.kind === "REMEDIATE" && previousStep?.kind !== "REMEDIATE";
  if (mistakeRose || nowRepairing) return "misconception";
  const independenceRose =
    r.before.independence === null
      ? r.after.independence !== null
      : r.after.independence !== null && r.after.independence > r.before.independence;
  if (independenceRose && delta.mastery > 0) return "independence";
  if (delta.mastery > 0.005) return "mastery-up";
  if (delta.mastery < -0.005) return "mastery-down";
  return "same";
}

/** Close the loop: recompute the plan from the state the evidence produced and
 *  report what changed. The baseline is the ledger's, so the comparison is
 *  against a real measurement rather than a remembered one. */
export function computeResult(
  state: ProfileState,
  ledger: SessionLedger,
  finishedAt = Date.now(),
  tt?: NextT,
  /** The learner's ledger, for the closing decision. Same contract as
   *  `captureBaseline`: the before and the after must come from one door. */
  events?: readonly EvidenceEvent[],
): SessionResult {
  const conceptId = ledger.conceptId;
  const p = state.progress[conceptId];
  const before = ledger.baseline.metrics;
  const after = metricsOf(p);
  const nowMistake = topMistake(p);
  const mistake =
    ledger.baseline.mistake || nowMistake
      ? {
          id: (nowMistake ?? ledger.baseline.mistake)!.id,
          before: ledger.baseline.mistake?.hits ?? 0,
          after: nowMistake?.hits ?? 0,
        }
      : null;
  const nextStep = coreOf(decideOne(decisionContext(state, events ?? []), { tt }));
  const partial: Omit<SessionResult, "changeReason"> = {
    conceptId,
    subject: getConcept(conceptId)?.subject ?? "maths",
    kind: ledger.kind,
    startedAt: ledger.startedAt,
    finishedAt,
    minutes: Math.max(0, Math.round((finishedAt - ledger.startedAt) / 60000)),
    activity: ledger.activity,
    before,
    after,
    delta: {
      mastery: after.mastery - before.mastery,
      independence:
        ledger.baseline.metrics.independence === null || after.independence === null
          ? after.independence
          : after.independence - ledger.baseline.metrics.independence,
    },
    mistake,
    proof: {
      independent: ledger.activity.independentCorrect > 0,
      transfer: ledger.activity.transferCorrect > 0,
    },
    previousStep: ledger.baseline.step,
    nextStep,
    nextStepChanged: !sameStep(ledger.baseline.step, nextStep),
    counts: buildCounts(state),
  };
  return { ...partial, changeReason: changeReasonFor(partial, ledger.baseline.step, nextStep) };
}

function buildCounts(state: ProfileState): SessionCounts {
  const snap = buildSnapshot(state);
  return { touched: snap.touched, strong: snap.strong, due: snap.dueCount };
}

/** Record one graded answer against the open session — called from the grading
 *  path, so every counter here is server-attributed. `mode` is the mode the
 *  server derived, never the one the client claimed. */
export function noteActivity(
  ledger: SessionLedger,
  input: { correct: boolean; mode: "guided" | "independent" | "transfer"; hints: number; conceptId: string; ms?: number },
): void {
  if (input.conceptId !== ledger.conceptId) return;
  const a = ledger.activity;
  a.asked += 1;
  if (input.correct) a.correct += 1;
  if (input.mode === "transfer") {
    a.transferAsked += 1;
    if (input.correct && input.hints === 0) a.transferCorrect += 1;
  } else if (input.mode === "independent") {
    a.independentAsked += 1;
    if (input.correct && input.hints === 0) a.independentCorrect += 1;
  }
  a.hints += input.hints;
  if (typeof input.ms === "number" && input.ms >= 0) a.durationMs += input.ms;
}

/** Is this session finished — target reached, or the learner answered a
 *  transfer question (a proven transfer ends the session on a high note)? */
export function isComplete(ledger: SessionLedger): boolean {
  return ledger.activity.asked >= ledger.target || ledger.activity.transferAsked > 0;
}
