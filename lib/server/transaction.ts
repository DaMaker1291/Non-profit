// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER TRANSACTION, AS THE APPLICATION REACHES IT.
//
// `lib/server/store.ts#withLearner`/`withLearnerState` are the FILE backend's
// implementation of the port's transaction. A route must not import them, and the
// reason is the same one that put the ledger behind `lib/server/evidence.ts`: the
// application is not allowed to name a backend. On a deployment configured for a
// different one, calling the store's own function would open a file-locked
// transaction for a learner whose record the configured backend holds — one
// learner in two places, which is the failure the port exists to prevent.
//
// So a route asks for the OPERATION and the port decides where it happens:
//
//     withLearnerState(id, async (ctx, state) => { … })     ← the routes
//     withLearner(id, async (ctx) => { … })                 ← a CREATE, or an erase
//
// WHY THE CONTEXT IS HANDED TO THE MUTATOR rather than the route resolving the
// ledger door for itself: `lib/server/projection.ts#commitAndProjectIn(ctx, …)`
// appends a learner's evidence ON THE TRANSACTION'S OWN CONNECTION, and that is
// the whole hazard docs/STORAGE_SPEC.md §14.1 names — a ledger write resolved from
// the port opens a SECOND connection, which deadlocks against the advisory lock
// the transaction itself holds. `npm run verify` asserts the rule at the source
// (no route names the port-resolved `commitAndProject` or `appendEvidence`) and at
// the boundary (a transaction cannot reach the port at all).
//
// WHAT IS DELIBERATELY NOT HERE: a way to run a mutator that takes only the
// record. The shape it replaced — read the state, mutate it, hope the caller
// remembered the transaction — is what phase C removed, and a convenience overload
// would be the way it came back.
//
// EVERY FUNCTION IS ASYNCHRONOUS because the port is: a database cannot answer
// "this learner's record" without a round trip, and the file backend answers with
// an already-resolved promise, which costs one microtask.
// ─────────────────────────────────────────────────────────────────────────────
import { activeStorage } from "./storage-file";
import type { LearnerContext, StoreKind } from "./storage";
import type { ProfileState } from "../types";

/**
 * Run `fn` inside one serialised unit for ONE learner: the record it reads and the
 * events it appends are one transaction, and a `fn` that throws leaves the RECORD
 * exactly as it was (see `LearnerContext` for what that promise does and does not
 * cover — an append that already succeeded may STAND).
 *
 * Use this rather than `withLearnerState` when there is no record yet to read: a
 * CREATE (an onboarding profile, a ring-fenced test learner) stages the new state
 * itself, and an ERASE has to be able to finish removing a learner whose record is
 * already gone.
 */
export function withLearner<T>(
  learnerId: string,
  fn: (ctx: LearnerContext) => T | Promise<T>,
): Promise<T> {
  return activeStorage().withLearner(learnerId, fn);
}

/**
 * THE ONE-SHOT FORM, and the one nearly every route wants: open the learner's
 * record, refuse when there is none, run the mutator, stage the record back.
 *
 * Returns `null` when the learner does not exist — the mutator is never run for
 * one who does not — so a route answers 404 rather than inventing a record, and
 * the caller reads the result of its own work rather than re-fetching it.
 */
export function withLearnerState<T>(
  learnerId: string,
  mutator: (ctx: LearnerContext, state: ProfileState) => T | Promise<T>,
): Promise<{ state: ProfileState; result: T } | null> {
  return activeStorage().withLearnerState(learnerId, mutator);
}

/** Which backend these transactions run on. Exported so a route can SAY where a
 *  learner's record lives rather than assuming, and so a harness asserts the
 *  resolved backend rather than the one it hoped for. */
export function transactionKind(): StoreKind {
  return activeStorage().kind;
}
