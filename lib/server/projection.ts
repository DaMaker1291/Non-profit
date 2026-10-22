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

import { PROJECTION_VERSION, orderEvents, type EvidenceEvent } from "../evidence";
import type { ProfileState } from "../types";
import { adoptProjection, reconcileDeep, replayModel } from "../replay";
import { appendEvidence, readEvidence, type AppendResult } from "./evidence";
// The transaction-scoped context, TYPE-ONLY: this module must not import a
// backend, because it is called from inside one.
import type { LearnerContext } from "./storage";

/** One reconciliation difference, as `reconcileDeep` reports it. */
type Diff = ReturnType<typeof reconcileDeep>[number];

/**
 * The fields that COUNT recorded work — the monotone ones, and only those.
 *
 * `accuracy`, `streak`, `mastery` and `lastSeen` are deliberately absent and the
 * absence is load-bearing: they are DERIVED, so a partial ledger's value can sit
 * ABOVE the full model's (two answers, both right, is 100% accuracy against a
 * pre-ledger learner's 9 of 13). A "greater than" test on those would conclude
 * that a learner with real pre-ledger history holds nothing the ledger cannot
 * count, and the snapshot that preserves their work would never be taken.
 */
const COUNTED_FIELDS = [
  "attempts", "correct", "independent.", "transfer.", "retention.", "ms", "answers", "misconception.",
] as const;

/**
 * Does the MODEL hold recorded work the ledger cannot account for?
 *
 * This is the only divergence that justifies a pre-ledger snapshot. Its converse —
 * a model that is BEHIND its ledger — is a state the write path can really reach
 * (the event is appended first and the record is written after, so a record write
 * that fails leaves the ledger ahead), and there the honest repair is the
 * projection, not a snapshot that would freeze the stale model in place.
 *
 * A whole concept present on one side and absent on the other is the clearest
 * case of each direction: the ledger having it and the model not is exactly what an
 * unfolded event looks like, and the model having it and the ledger not is a
 * learner who worked before the ledger existed.
 */
function modelHoldsWorkTheLedgerCannotCount(diffs: readonly Diff[]): boolean {
  return diffs.some((d) => {
    if (d.field === "concept") return d.model !== null && d.ledger === null;
    if (typeof d.model !== "number" || typeof d.ledger !== "number") return false;
    if (!COUNTED_FIELDS.some((f) => d.field.startsWith(f))) return false;
    return d.model > d.ledger;
  });
}

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
 * first event).
 *
 * ── AND THE DIVERGENCE HAS A DIRECTION, which is the other half of the test ──
 * A difference between the two does not by itself say the MODEL holds history
 * the ledger cannot: it is equally what a model that is BEHIND its ledger looks
 * like, and that is a reachable state rather than a hypothetical one — the
 * transaction appends the event first and writes the record after, so a record
 * write that fails (a full disk, a store that has been refused) leaves an event
 * on the ledger that the model never folded. "The record does not move" is the
 * transaction's promise; the projection's job is to fold what stands.
 *
 * Reading that state as un-ledgered history did two wrong things at once: it
 * froze the model at the stale value, so the answer that IS on the ledger never
 * reached the learner's record — and it made `unprojectableShare` name that
 * answer as work that PREDATES the ledger, which is the opposite of true.
 *
 * So the base is stamped only when the model holds recorded work the ledger
 * cannot count, and otherwise the projection is allowed to repair the model from
 * the ledger. Measured on the MONOTONE counts — see
 * `modelHoldsWorkTheLedgerCannotCount` for why a derived ratio cannot answer it.
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
  // The model is behind the ledger, or differs only in what the ledger DERIVES:
  // either way the ledger is the more complete account, and the projection above
  // is the repair. Stamping here is what lost the answer.
  if (!modelHoldsWorkTheLedgerCannotCount(missing)) return false;
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
 * THE WRITE PATH'S FOUR STEPS, ONCE.
 *
 * WRITE EVENT → CONFIRM APPEND → REPLAY → RESPOND is one sequence and it now has
 * one implementation, because the two entries below differ ONLY in where the
 * ledger lives — the port, or the transaction context a caller is already inside.
 * A second copy of this sequence is how the two would come to disagree about, say,
 * which mark the replay folds from, and that disagreement would be a projection
 * that double-counts an answer on one path and not the other.
 */
async function commitThrough(
  learnerId: string,
  state: ProfileState,
  events: readonly EvidenceEvent[],
  io: {
    read(): Promise<EvidenceEvent[]>;
    append(events: readonly EvidenceEvent[]): Promise<AppendResult>;
  },
): Promise<AppendResult> {
  if (!events.length) return { accepted: [], duplicates: [] };
  // 0. Read the ledger BEFORE the append: this is the reference the base
  //    decision is measured against, and it is the prefix of the replay below.
  //    Ordering it here keeps that prefix meaningful — the replay folds in
  //    clock order, so the mark it skips must count in clock order too. (The
  //    port already promises clock order, so this is idempotent; it is kept as
  //    the statement of what the prefix means, not as the only place it holds.)
  const before = orderEvents(await io.read());
  // 1. Decide whether anything here predates the ledger. Nothing does for a
  //    learner whose history the ledger already carries, and they get no base —
  //    which is the claim worth keeping strong.
  ensureProjectionBase(learnerId, state, events[0].at, before);
  // 2. WRITE, and let the store — not the caller — decide what was new.
  const result = await io.append(events);
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

/**
 * THE WRITE PATH, through the configured backend.
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
 *
 * A caller that is already inside a learner transaction must use
 * `commitAndProjectIn` instead: this one asks the PORT for the ledger, and on a
 * database backend that means a connection the transaction does not hold — the
 * deadlock `docs/STORAGE_SPEC.md` §14 decision 1 exists to prevent.
 */
export async function commitAndProject(
  learnerId: string,
  state: ProfileState,
  events: readonly EvidenceEvent[],
): Promise<AppendResult> {
  return commitThrough(learnerId, state, events, {
    read: () => readEvidence(learnerId),
    append: (batch) => appendEvidence(learnerId, batch),
  });
}

/**
 * THE WRITE PATH, inside a learner transaction (§14 decision 1).
 *
 * Same four steps, same `state`, and the ledger operations go through the
 * CONTEXT — which is the only object that can promise they travel on the
 * transaction's own connection. This is the entry point every route migrates to
 * as its mutator learns to take the context (docs/STORAGE_SPEC.md §14, phase C);
 * until then `commitAndProject` above serves them, and it is correct on the file
 * backend precisely because a file store has no second connection to open.
 */
export async function commitAndProjectIn(
  ctx: LearnerContext,
  state: ProfileState,
  events: readonly EvidenceEvent[],
): Promise<AppendResult> {
  return commitThrough(ctx.learnerId, state, events, {
    read: () => ctx.readEvents(),
    append: (batch) => ctx.appendEvents(batch),
  });
}
