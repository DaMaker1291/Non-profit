// ─────────────────────────────────────────────────────────────────────────────
// THE CUTOVER: the ledger is the source of truth, and the model is a projection
// of it.
//
// The ordering this module enforces is the whole architecture:
//
//        WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND
//
// and never the reverse:
//
//        mutate model → hope the event gets written
//
// which is the ordering that quietly turns a ledger back into a shadow. Every
// write path in the product now calls `commitAndProject` instead of mutating
// the learner model itself, so a model that cannot be reconstructed from the
// ledger is not a state the code can reach: if the append fails, the model does
// not move.
//
// ── Why the model is not simply `replayModel(readEvidence(id))` ────────────
//
// It is, for a learner whose whole history is in the ledger. It cannot be for a
// learner who used OpenMind before the ledger existed — and there are real ones
// (the live store holds a learner with recorded work and an empty ledger).
// Replaying an empty ledger over their model would reset every mastery to the
// prior on their next answer: the cutover would cause the exact data loss this
// project treats as unacceptable. So the pre-ledger model is captured once, as
// a `ProjectionBase`, and the projection folds the ledger on top of it. Counts
// continue (13 attempts becomes 14) instead of restarting, and what cannot be
// reconstructed is DISCLOSED (`unprojectableShare`) rather than presented as
// evidence.
//
// ── Why the whole ledger, not just the new events ─────────────────────────
//
// Because a projection must be idempotent and self-healing. A device that syncs
// offline work appends events the model has never seen, a retried request
// re-sends events it has (the store dedupes them, but a batch may also carry
// some duplicates and some novelties), and an abandoned diagnostic leaves
// answer events with no sitting behind them. Folding a batch incrementally gets
// each of those cases subtly wrong; re-deriving from the ledger gets them all
// right, and costs one file read of arithmetic.
// ─────────────────────────────────────────────────────────────────────────────

import { PROJECTION_VERSION, type EvidenceEvent } from "../evidence";
import type { ProfileState } from "../types";
import { adoptProjection, reconcileDeep, replayModel } from "../replay";
import { appendEvidence, readEvidence, type AppendResult } from "./evidence";

/**
 * Stamp the pre-ledger snapshot, ONCE, and only when the ledger genuinely does
 * not account for the model.
 *
 * The hard question is HOW TO KNOW. A naive rule ("the model is not empty, so
 * snapshot it") would give almost every learner a base on their second answer,
 * and `unprojectableShare` would then tell them that answers of theirs predate
 * the ledger — which would be false, and a false disclosure is worse than none.
 *
 * So the base is created on a MEASUREMENT, not a guess: replay the ledger on
 * its own and reconcile it against the model. Nothing missing means the ledger
 * already IS this learner's whole history, no base is needed, and their
 * projection is the strongest possible claim (the ledger alone, from their
 * first event). Anything missing is un-ledgered history — the pre-ledger case
 * this exists for — and is preserved.
 *
 * `before` MUST be the ledger read BEFORE the caller appends the events being
 * committed, and the state BEFORE the caller folds them, so the two sides of
 * the comparison describe the same moment. Scored against a half-applied
 * ledger, the test would report un-ledgered history that does not exist — and
 * `before.length` is exactly the mark the projection folds from, so a
 * half-applied ledger would fold work that is already in the snapshot.
 */
export function ensureProjectionBase(
  learnerId: string,
  state: ProfileState,
  at: number,
  before: readonly EvidenceEvent[],
): boolean {
  if (state.projectionBase) return false;
  if (Object.keys(state.progress).length === 0 && Object.keys(state.masteries).length === 0) return false;
  const missing = reconcileDeep(replayModel(before, learnerId), state);
  if (missing.length === 0) return false;
  // Name what is missing, exactly: the concepts the ledger could not account
  // for, and how much recorded work sits on them. A count taken from the whole
  // base would overstate it by including concepts the ledger DID carry.
  const unledgered = [...new Set(missing.map((d) => d.conceptId))];
  state.projectionBase = {
    at,
    // Everything the ledger already holds is inside the snapshot, by position.
    ledgerMark: before.length,
    progress: structuredClone(state.progress),
    masteries: structuredClone(state.masteries),
    version: PROJECTION_VERSION,
    unprojected: {
      concepts: unledgered.length,
      attempts: unledgered.reduce((n, id) => n + (state.progress[id]?.attempts ?? 0), 0),
    },
  };
  return true;
}

/**
 * Rebuild the learner model from the ledger and adopt it.
 *
 * MUST be called after `ensureProjectionBase` for this learner (or for a
 * learner with no base at all) — otherwise the projection would be computed
 * from an empty model and the pre-ledger history would be dropped on the
 * floor. `commitAndProject` does both in the right order; call this directly
 * only when the ledger is known to be the learner's whole history.
 */
export function projectFromLedger(state: ProfileState, events: readonly EvidenceEvent[]): void {
  adoptProjection(state, replayModel(events, state.profile.id, state.projectionBase));
}

/** What the ledger CANNOT rebuild about this learner, named so a surface can
 *  say it instead of implying the ledger is complete. Null when the ledger is
 *  the whole history — which is the answer for every learner whose model the
 *  ledger already accounts for, and for every learner born after the cutover. */
export function unprojectableShare(state: ProfileState): { concepts: number; attempts: number; at: number } | null {
  const base = state.projectionBase;
  if (!base) return null;
  // Defensive: a base written by a hypothetical older shape would carry no
  // disclosure, and "unknown" must not crash a read.
  const { concepts, attempts } = base.unprojected ?? { concepts: 0, attempts: 0 };
  if (concepts === 0 && attempts === 0) return null;
  return { concepts, attempts, at: base.at };
}

/**
 * THE WRITE PATH. Append the events, confirm they landed, then re-project the
 * learner model from the whole ledger and adopt it.
 *
 * Call it from INSIDE the caller's profile lock, so the append and the
 * projection cannot be interleaved with another request for the same learner.
 * The lock order is always profiles.json → the learner's evidence file; nothing
 * anywhere takes them the other way round.
 *
 * Returns the append result so a caller can tell what actually landed. It
 * THROWS if the append fails, and that is the point: the caller must not fall
 * through to a model update. An answer whose evidence could not be written is
 * not recorded, and the learner is told so rather than being shown a model that
 * moved for no auditable reason.
 */
export async function commitAndProject(
  learnerId: string,
  state: ProfileState,
  events: readonly EvidenceEvent[],
): Promise<AppendResult> {
  if (!events.length) return { accepted: [], duplicates: [] };
  // 0. Read the ledger BEFORE the append: this is the reference the base
  //    decision is measured against, and it is the prefix of the replay below.
  const before = readEvidence(learnerId);
  // 1. Decide whether anything here predates the ledger. Nothing does for a
  //    learner whose history the ledger already carries, and they get no base —
  //    which is the claim worth keeping strong.
  ensureProjectionBase(learnerId, state, events[0].at, before);
  // 2. WRITE, and let the store — not the caller — decide what was new.
  const result = await appendEvidence(learnerId, events);
  // 3. REPLAY the ledger as it now stands. The post-append ledger is the prefix
  //    plus exactly the events the store ACCEPTED — a duplicate is already in
  //    the prefix and must not be folded twice — so one read serves both the
  //    base decision and the projection.
  const accepted = new Set(result.accepted);
  const after = accepted.size
    ? [...before, ...events.filter((e) => accepted.has(e.id))]
    : before;
  projectFromLedger(state, after);
  return result;
}
