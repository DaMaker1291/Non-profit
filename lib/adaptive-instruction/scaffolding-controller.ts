// ─────────────────────────────────────────────────────────────────────────────
// THE SCAFFOLD LADDER
//
// A worked example is complete help; a discovery problem is almost none. The
// ladder is explicit so "removing scaffolding" is a measured transition rather
// than a claim in a design note. Two successful scaffolded attempts are enough
// to remove the structure; the learner does not have to ask for the removal.
// ─────────────────────────────────────────────────────────────────────────────
import type { InstructionStrategy } from "./types";

export interface ScaffoldLevel {
  readonly hintLevel: number;
  readonly explanationDepth: number;
}

export const STRATEGY_SCAFFOLD: Readonly<Record<InstructionStrategy, ScaffoldLevel>> = {
  FOUNDATIONAL: { hintLevel: 4, explanationDepth: 3 },
  INTUITIVE: { hintLevel: 4, explanationDepth: 3 },
  DERIVATION: { hintLevel: 3, explanationDepth: 3 },
  WORKED_EXAMPLE: { hintLevel: 3, explanationDepth: 3 },
  SCAFFOLDED: { hintLevel: 2, explanationDepth: 2 },
  CONTRASTIVE: { hintLevel: 2, explanationDepth: 2 },
  DISCOVERY: { hintLevel: 1, explanationDepth: 1 },
  PROOF_COACHING: { hintLevel: 2, explanationDepth: 2 },
  TRANSFER: { hintLevel: 0, explanationDepth: 0 },
};

export function scaffoldFor(
  strategy: InstructionStrategy,
  solutionViewed = false,
): ScaffoldLevel {
  const base = STRATEGY_SCAFFOLD[strategy];
  if (!solutionViewed) return base;
  // Viewing the solution does not mean no teaching; it means the teaching may
  // not claim the learner produced the method independently. Keep the support,
  // remove the independence claim (the evaluator owns that separately).
  return {
    hintLevel: Math.min(base.hintLevel, 2),
    explanationDepth: Math.min(base.explanationDepth, 2),
  };
}

/**
 * The next rung AFTER a successful intervention. This is the only function that
 * removes structure, and it requires two successes in the scaffolded mode — one
 * success can be a lucky draw.
 */
export function nextScaffoldAfterSuccess(
  strategy: InstructionStrategy,
  consecutiveSuccesses: number,
): { readonly strategy: InstructionStrategy } & ScaffoldLevel {
  if (strategy === "SCAFFOLDED") {
    if (consecutiveSuccesses >= 2) {
      return { strategy: "DISCOVERY", ...STRATEGY_SCAFFOLD.DISCOVERY };
    }
    return {
      strategy: "SCAFFOLDED",
      hintLevel: 1,
      explanationDepth: 1,
    };
  }
  if (strategy === "DISCOVERY") {
    return { strategy: "TRANSFER", ...STRATEGY_SCAFFOLD.TRANSFER };
  }
  if (strategy === "FOUNDATIONAL") {
    return { strategy: "INTUITIVE", ...STRATEGY_SCAFFOLD.INTUITIVE };
  }
  if (strategy === "INTUITIVE") {
    return { strategy: "WORKED_EXAMPLE", ...STRATEGY_SCAFFOLD.WORKED_EXAMPLE };
  }
  if (strategy === "WORKED_EXAMPLE") {
    return { strategy: "SCAFFOLDED", hintLevel: 1, explanationDepth: 1 };
  }
  return { strategy, ...scaffoldFor(strategy) };
}

/** True when a successful record has earned the removal of the scaffold. */
export function hasEarnedScaffoldRemoval(successes: number): boolean {
  return successes >= 2;
}
