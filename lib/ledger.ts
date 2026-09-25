// ─────────────────────────────────────────────────────────────────────────────
// THE APPEND-AND-PROJECT PATH, WITHOUT A FILESYSTEM.
//
// The rule this module exists to keep in exactly one place:
//
//   evidence is appended first, its idempotence is decided by the STORE, and
//   the learner model is then REBUILT from the whole ledger and adopted.
//
// Nothing here decides what an answer means; that is the engines' job. This is
// only the order of operations and the two guarantees that make it safe:
//
//   1. `commitAndProject` THROWS if the append fails, and the caller must not
//      fall through to a model update. An answer whose evidence could not be
//      recorded is not recorded.
//   2. Idempotence is enforced by the STORE against what it already holds, not
//      against what the caller promises — a re-sent event (an offline queue
//      replaying, a retried request) is reported as a duplicate and not folded
//      twice.
//
// WHY IT LIVES OUTSIDE lib/server: the server's store is JSONL files on a real
// disk, and a browser has neither. The semantics are not a filesystem
// property, though, and OpenMind runs in two places — the Next server and the
// static build published to GitHub Pages. If the static build re-implemented
// the write path, the two would agree by luck. So the arithmetic lives here,
// the STORAGE is injected, and `scripts/static-smoke.mjs` drives the same
// events through both this module and the server's fs-backed path and requires
// the resulting models, decisions and citations to be identical.
// ─────────────────────────────────────────────────────────────────────────────

import { PROJECTION_VERSION, orderEvents, type EvidenceEvent } from "./evidence";
import type { ProfileState } from "./types";
import { adoptProjection, reconcileDeep, replayModel } from "./replay";

/** What a store must do. Two methods, both total: a store never throws on a
 *  read, and an append reports exactly which ids it WROTE. */
export interface LedgerStore {
  /** The learner's events, oldest first. Malformed entries are skipped, never
   *  repaired and never deleted — an unreadable record is not an absent one. */
  read(learnerId: string): EvidenceEvent[];
  /** Append, idempotent by event id. Returns which ids were accepted and which
   *  were already held. MUST NOT write an event belonging to another learner. */
  append(learnerId: string, events: readonly EvidenceEvent[]): AppendResult;
}

export interface AppendResult {
  accepted: string[];
  duplicates: string[];
}

/** Learner ids key a store, so they are checked rather than rewritten: quietly
 *  sanitising one id could land one learner's evidence under another's. The
 *  server's store enforces the same shape on the same rule. */
export function assertSafeLearnerId(learnerId: string): void {
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(learnerId)) {
    throw new Error(`unsafe learner id: ${JSON.stringify(learnerId)}`);
  }
}

/**
 * An in-memory store. Not a toy: it is what the static build hydrates from its
 * own storage, what the tests drive, and what a caller can use to run a whole
 * journey without touching a disk.
 */
export function memoryLedger(initial: Record<string, EvidenceEvent[]> = {}): LedgerStore & { dump(): Record<string, EvidenceEvent[]> } {
  const files = new Map<string, EvidenceEvent[]>();
  for (const [id, events] of Object.entries(initial)) files.set(id, [...events]);
  return {
    read(learnerId) {
      assertSafeLearnerId(learnerId);
      return [...(files.get(learnerId) ?? [])];
    },
    append(learnerId, events) {
      assertSafeLearnerId(learnerId);
      const held = files.get(learnerId) ?? [];
      const seen = new Set(held.map((e) => e.id));
      const accepted: string[] = [];
      const duplicates: string[] = [];
      for (const e of events) {
        // An event about another learner must never reach this file, whatever
        // the caller says: the ledger is the authorisation boundary's last line.
        if (e.learnerId !== learnerId) throw new Error("refusing to write evidence for a different learner");
        if (seen.has(e.id)) { duplicates.push(e.id); continue; }
        seen.add(e.id);
        held.push(e);
        accepted.push(e.id);
      }
      files.set(learnerId, held);
      return { accepted, duplicates };
    },
    dump() {
      return Object.fromEntries([...files.entries()].map(([k, v]) => [k, [...v]]));
    },
  };
}

/**
 * Stamp the pre-ledger snapshot, ONCE, and only when the ledger genuinely does
 * not account for the model.
 *
 * The hard question is HOW TO KNOW, and the answer is a measurement, not a
 * guess: replay the ledger on its own and reconcile it against the model.
 * Nothing missing means the ledger already IS the learner's whole history, so
 * no base is needed and their projection is the strongest possible claim.
 * Anything missing is history the ledger cannot rebuild, and is preserved.
 *
 * `before` MUST be the ledger as it stood BEFORE the append, and the model
 * BEFORE the caller folds those events, so both sides describe one moment.
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
  const unledgered = [...new Set(missing.map((d) => d.conceptId))];
  state.projectionBase = {
    at,
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

/** Rebuild the learner model from the ledger and adopt it. */
export function projectFromLedger(state: ProfileState, events: readonly EvidenceEvent[]): void {
  adoptProjection(state, replayModel(events, state.profile.id, state.projectionBase));
}

/** What the ledger CANNOT rebuild about this learner, or null when the ledger is
 *  the whole story (the answer for every learner born after the cutover). */
export function unprojectableShare(state: ProfileState): { concepts: number; attempts: number; at: number } | null {
  const base = state.projectionBase;
  if (!base) return null;
  const { concepts, attempts } = base.unprojected ?? { concepts: 0, attempts: 0 };
  if (concepts === 0 && attempts === 0) return null;
  return { concepts, attempts, at: base.at };
}

/**
 * THE WRITE PATH. Append the events, confirm they landed, then re-project the
 * learner model from the whole ledger and adopt it.
 *
 * Synchronous, because a `LedgerStore` is synchronous by contract — the static
 * build's storage is localStorage and the server's appends are already
 * synchronous file writes. Callers that also write a profile must hold their
 * own lock around both; the order is always profile, then ledger.
 */
export function commitAndProject(
  learnerId: string,
  state: ProfileState,
  events: readonly EvidenceEvent[],
  store: LedgerStore,
): AppendResult {
  if (!events.length) return { accepted: [], duplicates: [] };
  // Clock order, so the prefix the replay skips over counts the same way the
  // replay folds. See commitAndProject in lib/server/projection.ts.
  const before = orderEvents(store.read(learnerId));
  ensureProjectionBase(learnerId, state, events[0].at, before);
  const result = store.append(learnerId, events);
  const accepted = new Set(result.accepted);
  const after = accepted.size ? [...before, ...events.filter((e) => accepted.has(e.id))] : before;
  projectFromLedger(state, after);
  return result;
}
