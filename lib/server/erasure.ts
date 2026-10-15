// ─────────────────────────────────────────────────────────────────────────────
// ONE ERASURE, TWO CALLERS, ONE ORDER.
//
// docs/STORAGE_SPEC.md §14 decision 2. Three things were true at once before this
// module existed, and each of them is a way "we deleted it" can be false:
//
//   1. The live erase was THREE CALLS from a route — `deleteProfile`,
//      `deleteEvidence`, `removeMemberEverywhere` — so a process killed between
//      them left a learner with no record and a ledger, or a record and no
//      membership. Each call was individually correct; the SEQUENCE was the unit
//      and nothing owned it.
//   2. The personal papers were removed by the RESTORE path and left alone by the
//      live path (F-2 of §13). One of the two was wrong about a learner's own
//      marked work, and there was no store function that could even express the
//      live half.
//   3. The instruction — the line in `erasures.json` a restore re-applies — was
//      written LAST, so the state that would have made an interrupted erase
//      resumable was the state the interruption prevented.
//
// So the erasure is now a WORKFLOW over an abstract target, and the order is the
// contract:
//
//      RECORD THE INSTRUCTION → REMOVE THE EFFECTS → VERIFY → REPORT
//
// ── Why the instruction is written FIRST ───────────────────────────────────
//
// The log is the JOURNAL, not a receipt. Its meaning is "this learner asked to be
// forgotten", which is a statement about an ACT, and an act does not become false
// because its effects were interrupted — whereas the reverse order loses the only
// durable trace of the request, leaving a learner whose record is gone and whose
// ledger is not, with nothing anywhere to say a deletion was ever asked for. A
// tombstone for a learner who no longer exists is exactly what a tombstone IS; a
// half-deleted learner with no tombstone is the one state a restore cannot repair.
//
// What it must never become is a tombstone for an erase nobody asked for, and that
// is the CALLER's precondition, stated here because it is not checkable from in
// here: `DELETE /api/profile` loads the profile and refuses 404 before calling
// this, and a restore only ever replays entries that are already in the log.
//
// ── What the caller must NOT expect ───────────────────────────────────────
//
// Atomicity of the effects. A database backend can make the record and its
// evidence one transaction; a file store cannot make an unlink and a JSON rewrite
// atomic, and pretending otherwise in a comment is how a promise becomes a lie.
// What this workflow guarantees instead is that the erase is RESUMABLE: the
// instruction is on disk before the first effect, every step is idempotent, and a
// second call completes whatever the first one left.
// ─────────────────────────────────────────────────────────────────────────────
import type { Storage } from "./storage";

/** A learner id we are willing to use as a path segment. The same shape the
 *  ledger enforces (`lib/server/evidence-file.ts#fileFor`), repeated here because
 *  this module unlinks files named by ids that arrived from a log which may have
 *  travelled through a backup: a `../` in there must never reach the filesystem. */
export const SAFE_LEARNER_ID = /^[A-Za-z0-9_-]{3,64}$/;

/**
 * WHAT AN ERASURE CAN BE APPLIED TO.
 *
 * Two implementations, and the reason this is an interface rather than two
 * functions is the whole point of the module: the live store and a RESTORED COPY
 * of it must remove the same things in the same order, and the way to guarantee
 * that is to make them the same code with a different target.
 *
 *   · `portErasureTarget(storage)` — the deployment's configured backend.
 *   · `dirErasureTarget(dir)` — a directory of JSON files, which is what a restore
 *     materialises and what the drill points at. It never touches `DATA_DIR`.
 */
export interface ErasureTarget {
  /** A name for the failure messages, so a partial erase names where it stopped. */
  readonly label: string;
  hasRecord(learnerId: string): Promise<boolean>;
  removeRecord(learnerId: string): Promise<boolean>;
  removeLedger(learnerId: string): Promise<boolean>;
  /** Personal papers, BY OWNER. Returns how many were removed. */
  removePersonalPapers(learnerId: string): Promise<number>;
  /** Class memberships. Returns how many rosters changed. */
  removeMemberships(learnerId: string): Promise<number>;
  /** Write the instruction a restore re-applies. Idempotent. */
  recordIntent(learnerId: string, at: number): Promise<boolean>;
  /** Mark the instruction FINISHED — called only after the effects have been
   *  removed and the record's absence verified. Idempotent. */
  completeIntent(learnerId: string, at: number): Promise<boolean>;
}

export interface ErasureOutcome {
  learnerId: string;
  /** The record was present when this call started. */
  existed: boolean;
  /** The record was removed by THIS call. */
  record: boolean;
  ledger: boolean;
  personalPapers: number;
  memberships: number;
  /** The instruction was newly written by this call (false = it was already there). */
  intent: boolean;
  /** The erase is now marked FINISHED. False on a retry, because the first
   *  completion is when the erase actually completed. */
  finished: boolean;
  /** This call finished an erasure that had already begun: the record was already
   *  gone and this call removed something. The interrupted case, and the one the
   *  resumable order exists for.
   *
   *  `intent` is deliberately NOT part of it. The instruction is written by every
   *  call, so counting it here would report `resumed: true` for any learner who
   *  simply had no record — which would make the flag say "I finished an earlier
   *  erase" about an erase that never started. */
  resumed: boolean;
}

/**
 * ERASE A LEARNER, in the one order both callers use.
 *
 * Idempotent and total: safe on a learner who is already gone (the steps that have
 * nothing to do report nothing), and complete on one who is not — the profile, the
 * ledger, the personal papers and every class membership.
 */
export async function eraseLearner(
  target: ErasureTarget,
  learnerId: string,
  at: number = Date.now(),
): Promise<ErasureOutcome> {
  if (!SAFE_LEARNER_ID.test(learnerId)) {
    throw new Error(`refusing to erase an id that is not a safe path segment: ${JSON.stringify(learnerId)}`);
  }
  const existed = await target.hasRecord(learnerId);

  // 1. THE INSTRUCTION. See the header for why this is first: it is the journal
  //    an interrupted erase is resumed from, and a restore's only input.
  const intent = await target.recordIntent(learnerId, at);

  // 2. THE EFFECTS, each one idempotent, so a resumed erase repeats none of them
  //    and skips none of them. The record goes LAST of the four: if a later step
  //    fails, a learner who still has a record can ask again, whereas a learner
  //    whose record went first can no longer be found by the route that erases.
  const ledger = await target.removeLedger(learnerId);
  const personalPapers = await target.removePersonalPapers(learnerId);
  const memberships = await target.removeMemberships(learnerId);
  const record = await target.removeRecord(learnerId);

  // 3. VERIFY BEFORE REPORTING. A tombstone on disk plus a record still present is
  //    the state that makes "we deleted it" false, and it is the state a caller
  //    must hear about rather than receive an `ok` for.
  if (await target.hasRecord(learnerId)) {
    throw new Error(
      `erasure of ${learnerId} removed the other artefacts but its RECORD is still present in ${target.label} — ` +
      `the instruction is recorded and a retry will complete it`,
    );
  }

  // 4. MARK IT FINISHED — only now, with the removal confirmed. The instruction
  //    was written first, so this is the difference between "recorded" and "done",
  //    and it is what an operator reads to find an erase that was abandoned.
  const finished = await target.completeIntent(learnerId, at);

  return {
    learnerId,
    existed,
    record,
    ledger,
    personalPapers,
    memberships,
    intent,
    finished,
    resumed: !existed && (record || ledger || personalPapers > 0 || memberships > 0),
  };
}

/**
 * The live deployment's target: whatever backend is configured.
 *
 * Takes the port as an ARGUMENT rather than resolving it here, because resolving
 * it means importing `storage-file.ts`, which imports the store, which imports the
 * erasure log, which imports this module — a cycle that would exist only to save
 * one line at the call site.
 */
export function portErasureTarget(storage: Storage): ErasureTarget {
  return {
    label: `the ${storage.kind} store`,
    hasRecord: async (id) => (await storage.getProfile(id)) !== null,
    removeRecord: (id) => storage.deleteProfile(id),
    removeLedger: (id) => storage.deleteEvents(id),
    removePersonalPapers: (id) => storage.deletePersonalPapersFor(id),
    removeMemberships: (id) => storage.removeMemberEverywhere(id),
    recordIntent: (id, at) => storage.recordErasure(id, at),
    completeIntent: (id, at) => storage.confirmErasure(id, at),
  };
}
