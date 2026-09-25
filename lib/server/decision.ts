// ─────────────────────────────────────────────────────────────────────────────
// The server's one way to obtain a decision context.
//
// A route must never assemble its own `{ model, events }`: it would be free to
// pass the model and forget the ledger, which is exactly the bug this module
// exists to make impossible. `decisionContextFor` reads both from the same
// learner, so a server surface cannot make a different decision from a client
// surface looking at the same learner.
// ─────────────────────────────────────────────────────────────────────────────

import { PROJECTION_VERSION } from "../evidence";
import { decisionContext, type DecisionContext } from "../decision";
import { getProfile } from "./store";
import { readEvidence } from "./evidence";
import { unprojectableShare } from "./projection";

/**
 * The learner's model and the ledger it was projected from.
 *
 * The model read here is the STORED one, not a fresh replay: since the cutover
 * it is produced by the projection on every write and audited against a full
 * replay on every read of `/api/evidence`, so re-deriving it per request would
 * buy nothing and cost a ledger read. What a surface must not do is use the
 * model WITHOUT the ledger — which is what this returns both of.
 *
 * Returns null when the learner does not exist, so callers keep the 404 they
 * already have.
 */
export async function decisionContextFor(learnerId: string): Promise<DecisionContext | null> {
  const state = await getProfile(learnerId);
  if (!state) return null;
  const share = unprojectableShare(state);
  return decisionContext(
    state,
    readEvidence(learnerId),
    // The version that PRODUCED this model. A base written before an algorithm
    // bump still carries its own version, so a stale model is identifiable
    // rather than merely old.
    state.projectionBase?.version ?? PROJECTION_VERSION,
    share ? { concepts: share.concepts, attempts: share.attempts } : null,
  );
}
