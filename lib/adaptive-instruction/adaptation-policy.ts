// ─────────────────────────────────────────────────────────────────────────────
// WHAT TO DO AFTER AN OUTCOME
//
// A failed intervention changes the teaching strategy; it does not restart the
// same lesson. A successful one removes one rung of support. The selector owns
// the final decision; this module owns the transition table so a failure cannot
// be silently turned into "more of the same".
// ─────────────────────────────────────────────────────────────────────────────
import type { InstructionStrategy, PreviousIntervention } from "./types";
import { hasEarnedScaffoldRemoval } from "./scaffolding-controller";

const AFTER_FAILURE: Readonly<Record<InstructionStrategy, InstructionStrategy>> = {
  FOUNDATIONAL: "WORKED_EXAMPLE",
  INTUITIVE: "WORKED_EXAMPLE",
  DERIVATION: "WORKED_EXAMPLE",
  WORKED_EXAMPLE: "SCAFFOLDED",
  SCAFFOLDED: "CONTRASTIVE",
  CONTRASTIVE: "SCAFFOLDED",
  DISCOVERY: "SCAFFOLDED",
  PROOF_COACHING: "CONTRASTIVE",
  TRANSFER: "SCAFFOLDED",
};

export function strategyAfterFailure(strategy: InstructionStrategy): InstructionStrategy {
  return AFTER_FAILURE[strategy];
}

export function shouldRemoveScaffolding(previous: readonly PreviousIntervention[]): boolean {
  let successes = 0;
  for (let i = previous.length - 1; i >= 0; i--) {
    const row = previous[i];
    if (row.strategy !== "SCAFFOLDED" || row.outcome !== "succeeded") break;
    successes += 1;
  }
  return hasEarnedScaffoldRemoval(successes);
}


