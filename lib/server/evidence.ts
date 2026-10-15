// ─────────────────────────────────────────────────────────────────────────────
// THE EVIDENCE FACADE — the ONE door to a learner's ledger, wherever it lives.
//
// `lib/server/evidence-file.ts` is the file backend's ledger: real code, real
// fs calls, and NOT the door the application uses. This module is the door. It
// holds no storage of its own — every function here asks the storage port
// (`lib/server/storage.ts`) for the configured backend and delegates. That is
// the whole point of the seam: when a second backend exists, a route that reads
// a learner's history does not learn a new API and does not get a second path
// into it; it calls exactly what it called before and gets the other backend's
// answer.
//
// WHY IT IS A FACADE RATHER THAN THE PORT ITSELF. Two reasons, both measured
// rather than stylistic:
//
//   1. The port is deliberately SEMANTIC (`readEvents`/`appendEvents`), because
//      a Postgres backend has no idea what a `.jsonl` file is. Route code reads
//      better in the ledger's own words, and the older API is what every call
//      site already speaks.
//   2. `npm run verify` asserts the property that matters — this file contains
//      no `node:fs` and no file plumbing — so "the ledger is on the port" is a
//      fact a test can check rather than a claim in a comment. A facade that
//      started opening files again would fail the suite, not merely review.
//
// EVERY FUNCTION HERE IS ASYNCHRONOUS, and that is the port's contract rather
// than a preference: a database cannot answer "what is on this learner's
// ledger?" without a round trip, so the contract every backend implements is the
// asynchronous one. The file backend answers with an already-resolved promise,
// which costs one microtask. Every caller awaits; the untyped harnesses carry
// their own await guard because there is no compiler over them.
// ─────────────────────────────────────────────────────────────────────────────

import type { AppendResult, EvidenceEvent } from "../evidence";
import { activeStorage } from "./storage-file";

// The shape MOVED to lib/evidence.ts with the event schema, because the port
// promises it to EVERY backend. Re-exported here (and from `storage-file.ts`
// through the port) so the imports that already name it are unchanged and there
// is exactly one definition.
export type { AppendResult } from "../evidence";

/**
 * Append events to a learner's ledger.
 *
 * Idempotent by event id — a re-sent event is reported as a duplicate and not
 * written — and it THROWS rather than reporting success when the deployment may
 * not keep a learner's record, because `commitAndProject` turns that refusal
 * into the route's `evidence_not_recorded` (503) instead of moving a model on an
 * event nobody will find again.
 */
export async function appendEvidence(learnerId: string, events: readonly EvidenceEvent[]): Promise<AppendResult> {
  return activeStorage().appendEvents(learnerId, events);
}

/** A learner's whole history, OLDEST FIRST. The port promises clock order rather
 *  than append order, which is the difference a device syncing offline work
 *  makes — see `lib/server/storage.ts#readEvents`. */
export async function readEvidence(learnerId: string): Promise<EvidenceEvent[]> {
  return activeStorage().readEvents(learnerId);
}

/** Is this event already on the learner's ledger? Asked BEFORE doing work, so a
 *  replayed answer whose question is no longer staged is recognised as already
 *  recorded rather than reported as a stale question. */
export async function hasEvidence(learnerId: string, id: string): Promise<boolean> {
  return activeStorage().hasEvent(learnerId, id);
}

/** Learners that have a ledger. The impact report walks ledgers rather than
 *  profiles, so a deleted profile cannot resurrect as a population count. */
export async function learnersWithEvidence(): Promise<string[]> {
  return activeStorage().learnersWithEvents();
}

/** Drop a learner's whole ledger. Only for test cleanup and account deletion —
 *  never on a normal path, because evidence is not editable. */
export async function deleteEvidence(learnerId: string): Promise<boolean> {
  return activeStorage().deleteEvents(learnerId);
}
