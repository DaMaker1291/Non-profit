// ─────────────────────────────────────────────────────────────────────────────
// REPLAY — rebuild the learner model from the evidence ledger.
//
// This module is now the model's DEFINITION, not a bridge beside it:
//
//   action → evidence event → LEDGER (source of truth)
//                            → projection → learner model → recommendation
//
// `foldEvent` is the fold primitive: one event, one model. `replayModel` is
// that fold over a whole ledger. The write paths no longer mutate the model
// themselves — they append an event and then run this projection (see
// lib/server/projection.ts), so "the model is a projection of the ledger" is
// not a claim a test makes about production code, it is what production code
// does.
//
// Nothing here re-implements the model's mathematics: the fold calls the SAME
// `recordAnswer` and `mergeDiagnosticSeed` the old inline path called. That is
// what makes replay parity a meaningful claim — the replay is not a second
// opinion, it is the same opinion computed from the ledger's side.
//
// ── Which events fold into the model, and why that is not all of them ──────
//
// A diagnostic sitting folds as ONE event (`diagnostic_completed`, carrying its
// per-concept ladder seeds). Its individual `answer_submitted` events are
// DETAIL — the question-level record the sitting summary would lose — and they
// are deliberately NOT folded, because the model has never been built that way:
// the sitting merges through `mergeDiagnosticSeed` (the supervised-window rule
// that makes a diagnostic the initial-state estimator) rather than through
// per-answer `recordAnswer`. Folding both would count every diagnostic answer
// twice. A sitting the learner ABANDONED is the proof that the rule is right:
// its answer events are on the ledger and its sitting event is not, and the
// model must not move — which is exactly what the live path does too.
//
// Everything else folds: practice, transfer, and paper answers (a paper is
// sat question by question, and the mark scheme's tags travel with each one).
// ─────────────────────────────────────────────────────────────────────────────

import { orderEvents, type EvidenceEvent } from "./evidence";
import { recordAnswer } from "./progress";
import { mergeDiagnosticSeed, diagnosticToProgress } from "./diagnostic";
import type { ProfileState, ConceptProgress, ProjectionBase } from "./types";

/**
 * THE FOLD: one ledger event, applied to a model-shaped state.
 *
 * `replayModel` is this function over a ledger; the write paths run the same
 * fold through the projection. Mutates `state.progress` exactly as
 * `recordAnswer` / `mergeDiagnosticSeed` do — by calling them.
 *
 * What the fold cannot (and must not) reproduce, stated rather than assumed:
 *   · `state.observed` — the diagnostic route marks baseline anchors as
 *     observed; the fold marks nothing observed, because observation is an
 *     exposure fact, not evidence content. The route re-applies it after the
 *     projection.
 *   · `state.masteries` — derivable, but only FROM A BASE: the map only ever
 *     gets entries via recordAnswer's ≥0.9 stamp, so a base-seeded fold
 *     reproduces it and a from-scratch fold of a ledger that does not cover
 *     the learner's whole history does not.
 *   · `events` tail / `microDiag` / `starter` / `peer` / `recentHits` /
 *     `hints` / `diag` — annotations the ledger does not carry (yet). They are
 *     preserved by `adoptProjection` rather than invented here.
 */
export function foldEvent(state: ProfileState, e: EvidenceEvent): void {
  switch (e.type) {
    case "answer_submitted": {
      if (!e.conceptId) break;
      // A diagnostic sitting folds as a whole, through its own
      // diagnostic_completed event. Folding its per-answer detail too would
      // count every diagnostic answer twice. See the header.
      if (e.source === "diagnostic") break;
      // Replay derives the mode from the event's own record — the same
      // derivation the live route made when it minted the event. A hinted
      // answer is guided, never independent; the event is authoritative
      // because the SERVER minted it from the server's own hint ledger.
      recordAnswer(state, e.conceptId, e.questionId, e.chosen, e.correct, "", e.tags, {
        ms: e.ms ?? undefined,
        hints: e.hints,
        mode: e.mode,
        // The event's own source is carried into the fold: a retrieval is
        // retention evidence in the model exactly when the ledger says it was
        // one, so replay reproduces the retention dimension instead of
        // re-deriving it from local state (which would not survive a rebuild).
        source: e.source === "retrieval" ? "retrieval" : undefined,
      }, e.at);
      break;
    }
    case "diagnostic_completed": {
      if (!e.seeds) break; // legacy event: no seed data, nothing to replay
      for (const s of e.seeds) {
        if (s.asked === 0) continue;
        const ladder = {
          conceptId: s.conceptId,
          asked: s.asked,
          correct: s.correct,
          done: s.done,
          stage: s.stage,
          askedThisStage: s.askedThisStage,
          correctThisStage: s.correctThisStage,
          missedThisStage: false,
          usedSeeds: [],
          servedDifficulty: s.servedDifficulty,
        };
        mergeDiagnosticSeed(state.progress, s.conceptId, diagnosticToProgress(ladder, e.at), e.at);
      }
      break;
    }
    // hint_requested / paper_completed / session_completed: the model surface
    // (state.progress) is produced by graded answers and diagnostic seeds only.
    // A hint action is recorded as an action, not as a measurement — the hint
    // count that matters is the one attached to the graded answer, so folding
    // hint_requested into the concept tally would double every hint. A
    // paper_completed summary adds nothing the paper's own answer_submitted
    // events do not already carry.
    default:
      break;
  }
}

// There is deliberately no second name for the fold. `applyEvent` was the
// Phase-1 spelling of exactly this function, and keeping the alias would leave
// two ways to say one thing — the one place a future edit could half-apply.

/**
 * Fold a ledger into a learner model.
 *
 * Pure: input events are not mutated, and the result depends only on event
 * content — never on wall-clock time, so a rebuilt model is reproducible
 * months later.
 *
 * `base` is the pre-ledger snapshot (ProjectionBase, lib/types.ts). When it is
 * present the fold starts FROM it and folds only the ledger's SUFFIX after
 * `base.ledgerMark`, because everything before that mark is already inside it:
 * a learner who had 13 recorded answers before the ledger existed must reach 14
 * on their next answer, not restart at 1. When it is absent the fold is the
 * ledger alone, which is the honest answer for a learner whose whole history is
 * in the ledger. `events` is therefore the FULL ledger, in its own append
 * order — a caller that wants the projection must read the whole thing.
 *
 * Folding happens in the order the events are given (the ledger's own append
 * order, which is the order the live path applied them). Sorting by timestamp
 * would be worse: two answers in the same millisecond would swap between runs
 * and the model would stop being reproducible from its own history.
 *
 * ── What the ledger cannot carry, and why `profile` is a parameter ────────
 *
 * The fold rebuilds the learner's EVIDENCE state: `progress` and `masteries`,
 * every field with an event behind it. It cannot rebuild their DECLARED state,
 * because nothing records it as evidence — the subjects they chose, their
 * exam and its date, the minutes a day they said they have. Those are facts
 * about the learner, not measurements of them, and no event mints them.
 *
 * That distinction has teeth: `decideNext` reads `profile.subjects` (the
 * subject to challenge them in), `profile.timePerDay` (how long a plan may be)
 * and the exam date (urgency), so a replayed model that invented its own shell
 * would DECIDE DIFFERENTLY from the live one — on the tail of the ranking, not
 * the headline, which is exactly the kind of disagreement that hides. So the
 * declared shell is an explicit input: a caller reconciling evidence passes
 * nothing and gets a neutral one, and a caller DECIDING passes the learner's
 * own profile. `lang` defaults to English for the same reason it must be
 * passed here — guessing it would freeze one language into the model.
 */
export function replayModel(
  events: readonly EvidenceEvent[],
  learnerId = "replay",
  base?: ProjectionBase,
  profile?: ProfileState["profile"],
): ProfileState {
  const state: ProfileState = {
    profile: profile
      ? structuredClone(profile)
      : {
          id: learnerId,
          board: null,
          handle: null,
          lang: "en",
        },
    progress: base ? structuredClone(base.progress) : {},
    masteries: base ? structuredClone(base.masteries) : {},
    observed: {},
    diagnostics: {},
    secret: "",
  } as unknown as ProfileState;
  // The snapshot already accounts for the ledger's first `ledgerMark` events,
  // whatever their clocks say: fold from there on, and never fold them again.
  // ── THE FOLD IS CLOCK-ORDERED, NOT ARRIVAL-ORDERED ──────────────────────
  // Two reasons, and the second is the one that bites.
  //
  // 1. The read half of this engine already says so: `projectLearner` orders by
  //    (at, id) and documents that the same events in any order give the same
  //    result. If the fold did not, the model a decision is made from and the
  //    projection a reconcile checks it against would be two different answers
  //    to the same question.
  // 2. An append-only ledger cannot reorder its file, and it must not have to:
  //    an event that arrives AFTER newer ones — a device syncing a morning's
  //    offline work at lunchtime — would otherwise move `lastSeen`, the streak
  //    and the retention clock to that late moment's position in the arrival
  //    sequence. Ordering here is what makes "late arrival" a fact about
  //    delivery rather than a fact about the learner.
  //
  // For a ledger that arrived in order (every live write) `orderEvents` is the
  // identity, so this changes nothing about the normal path.
  const ordered = orderEvents(events);
  const from = base ? Math.max(0, Math.min(base.ledgerMark, ordered.length)) : 0;
  for (let i = from; i < ordered.length; i++) foldEvent(state, ordered[i]);
  return state;
}

// ── Adoption: what the ledger OWNS vs what it merely coexists with ─────────

/**
 * The per-concept fields the evidence owns. The projection computes these and
 * `adoptProjection` installs them; everything else on a ConceptProgress is an
 * ANNOTATION the ledger does not carry yet and must survive untouched.
 *
 * This is deliberately not COMPARED_FIELDS: that list is what `reconcileDeep`
 * proves equal, this one is what the projection is allowed to overwrite.
 * Adopting a field the ledger cannot reproduce would delete a learner's
 * starter/peer/hint record on their next answer.
 */
export const LEDGER_OWNED_FIELDS = [
  "attempts", "correct", "streak", "mastery", "accuracy", "lastSeen",
  "misconceptions", "independent", "transfer", "retention", "totalMs", "answers",
] as const;

/** Annotations the ledger does not carry, named so the boundary is readable
 *  rather than implied: hints (the per-level tally), recentHits (the flare
 *  window), microDiag, starter, peer, diag. Nothing sets these from the fold. */
export const LEDGER_ABSENT_FIELDS = [
  "hints", "recentHits", "microDiag", "starter", "peer", "diag",
] as const;

/**
 * Install a projected model onto a live profile, KEEPING every annotation the
 * evidence does not speak to.
 *
 * The rule, in one line: for a concept the ledger has something to say about,
 * the evidence wins on the fields it owns; for a concept it says nothing
 * about, the existing entry is left exactly as it was (a hint tally or a
 * starter counter is a real record with no event behind it yet — dropping it
 * would be silent data loss, not a cleaner model).
 */
export function adoptProjection(live: ProfileState, projected: ProfileState): void {
  const next: Record<string, ConceptProgress> = {};
  for (const [conceptId, p] of Object.entries(projected.progress)) {
    const owned: Record<string, unknown> = {};
    const from = p as unknown as Record<string, unknown>;
    // Iterate the FOLD'S OWN keys, in the fold's own order, keeping the ones
    // the ledger owns. Only fields the fold actually produced are taken — an
    // absent totalMs means "no timed answers", and writing `undefined` over a
    // value would be a claim the evidence does not make. Keeping the fold's key
    // order is what makes a ledger-complete learner's model byte-identical to a
    // replay of their ledger, which is the difference between "delete the
    // model, replay the history, get the same numbers" and "get the same
    // bytes".
    for (const field of Object.keys(from)) {
      if ((LEDGER_OWNED_FIELDS as readonly string[]).includes(field) && from[field] !== undefined) {
        owned[field] = from[field];
      }
    }
    const extras: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(live.progress[conceptId] ?? {})) {
      if (!(k in owned)) extras[k] = v;
    }
    next[conceptId] = { ...owned, ...extras } as unknown as ConceptProgress;
  }
  for (const [conceptId, entry] of Object.entries(live.progress)) {
    if (!next[conceptId]) next[conceptId] = entry;
  }
  live.progress = next;
  live.masteries = { ...projected.masteries };
}

// ── Deep reconciliation ─────────────────────────────────────────────────────

export interface DeepDifference {
  conceptId: string;
  field: string;
  ledger: number | null;
  model: number | null;
}

/** The fields the replay reproduces and reconcileDeep compares. Kept as a
 *  literal list so the guarantee is readable: these eleven, per concept. */
export const COMPARED_FIELDS = [
  "attempts", "correct", "streak", "accuracy", "lastSeen",
  "independent.asked", "independent.correct",
  "transfer.asked", "transfer.correct",
  "retention.asked", "retention.correct",
  "ms", "answers",
] as const;

type Num = number | undefined;

function eq(a: Num, b: Num): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return Math.abs(a - b) <= 1e-9;
}

function diff(conceptId: string, field: string, l: Num, m: Num, out: DeepDifference[]): void {
  if (!eq(l, m)) out.push({ conceptId, field, ledger: l ?? null, model: m ?? null });
}

/**
 * Full-surface reconciliation between the replayed model and the live model:
 * every per-concept field the replay reproduces, not merely the summary
 * counts the shallow reconcile() covers. `replayed` comes from
 * replayModel(ledgerEvents); `live` is the model the teaching loop mutates.
 *
 * Events the live path wrote but the ledger never received (or vice versa)
 * surface here as missing whole concepts or skewed counts — the point of the
 * check. Noisy-looking fields the replay deliberately does not reproduce
 * (observed, masteries, the event tail, microDiag/starter/peer annotations)
 * are NOT compared; comparing them would be noise, and noise is how a
 * reconciliation gets switched off.
 */
export function reconcileDeep(
  replayed: ProfileState,
  live: ProfileState,
): DeepDifference[] {
  const out: DeepDifference[] = [];
  // An entry that never received an answer (a hint or scaffold created it)
  // carries no evidence claim, so it cannot diverge from the ledger — only
  // entries with at least one graded answer are compared.
  const meaningful = (p: ProfileState) =>
    Object.fromEntries(
      Object.entries(p.progress).filter(([, v]) =>
        (v.attempts ?? 0) > 0 || (v.independent?.asked ?? 0) > 0 ||
        (v.transfer?.asked ?? 0) > 0 || (v.retention?.asked ?? 0) > 0 ||
        Object.keys(v.misconceptions ?? {}).length > 0),
    );
  const replayedProgress = meaningful(replayed);
  const liveProgress = meaningful(live);
  const ids = new Set([...Object.keys(replayedProgress), ...Object.keys(liveProgress)]);
  for (const id of ids) {
    const l = replayedProgress[id];
    const m = liveProgress[id];
    if (!l || !m) {
      out.push({ conceptId: id, field: "concept", ledger: l ? l.attempts : null, model: m ? m.attempts : null });
      continue;
    }
    diff(id, "attempts", l.attempts, m.attempts, out);
    diff(id, "correct", l.correct, m.correct, out);
    diff(id, "streak", l.streak, m.streak, out);
    diff(id, "accuracy", l.accuracy, m.accuracy, out);
    diff(id, "lastSeen", l.lastSeen, m.lastSeen, out);
    diff(id, "independent.asked", l.independent?.asked, m.independent?.asked, out);
    diff(id, "independent.correct", l.independent?.correct, m.independent?.correct, out);
    diff(id, "transfer.asked", l.transfer?.asked, m.transfer?.asked, out);
    diff(id, "transfer.correct", l.transfer?.correct, m.transfer?.correct, out);
    diff(id, "retention.asked", l.retention?.asked, m.retention?.asked, out);
    diff(id, "retention.correct", l.retention?.correct, m.retention?.correct, out);
    diff(id, "ms", l.totalMs, m.totalMs, out);
    diff(id, "answers", l.answers, m.answers, out);
  }
  return out;
}

export type { ConceptProgress };
