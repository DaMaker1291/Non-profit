// ─────────────────────────────────────────────────────────────────────────────
// THE STRATEGY SELECTOR
//
// Priority is deliberate. A missing prerequisite is repaired before the target
// is taught. A live misconception outranks a difficulty band because repeating
// harder practice on a wrong belief makes the belief more fluent, not less. A
// failed intervention changes strategy rather than restarting the same lesson.
//
// The selector is pure and deterministic: no clock, no randomness, no model
// call. The same state and the same ability produce the same decision.
// ─────────────────────────────────────────────────────────────────────────────
import { shouldRemoveScaffolding, strategyAfterFailure } from "./adaptation-policy";
import { scaffoldFor } from "./scaffolding-controller";
import type {
  DiagnosticState,
  EvidencePolicy,
  InstructionStrategy,
  MathematicalAbility,
  StudentInstructionState,
} from "./types";

export interface StrategySelection {
  readonly strategy: InstructionStrategy;
  readonly diagnosedState: DiagnosticState;
  readonly detectedGaps: readonly string[];
  readonly misconceptionId: string | null;
  readonly routedToAbilityId?: string;
  readonly evidencePolicy: EvidencePolicy;
  readonly reason: string;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function selectStrategy(
  state: StudentInstructionState,
  ability: MathematicalAbility,
): StrategySelection {
  const missing = state.prerequisites.find((prereq) => !prereq.ready);
  if (missing) {
    return {
      strategy: "FOUNDATIONAL",
      diagnosedState: "prerequisite_gap",
      detectedGaps: [`prerequisite:${missing.abilityId}`],
      misconceptionId: null,
      routedToAbilityId: missing.abilityId,
      evidencePolicy: state.solutionViewed ? "no_independence" : "normal",
      reason:
        `${missing.abilityId} is at ${fmt(missing.mastery)}, below its required ` +
        `${fmt(missing.minMastery)}; repair the prerequisite before teaching ${ability.id}. ` +
        missing.why,
    };
  }

  const proofMisconception = state.misconceptions.find((m) => m.id === "mod-proof-gap");
  if (state.proofGaps >= 2 || proofMisconception) {
    return {
      strategy: "PROOF_COACHING",
      diagnosedState: "proof_gap",
      detectedGaps: ["proof_construction", ...(proofMisconception ? [proofMisconception.id] : [])],
      misconceptionId: proofMisconception?.id ?? null,
      evidencePolicy: state.solutionViewed ? "no_independence" : "normal",
      reason:
        "The errors are about the form of the argument (examples instead of a general case, or an assumed converse), " +
        "so the next intervention must repair the proof, not add more calculation.",
    };
  }

  const misconception = state.misconceptions[0];
  if (misconception) {
    const strategy = misconception.preferredStrategy;
    return {
      strategy,
      diagnosedState: "misconception",
      detectedGaps: [misconception.id],
      misconceptionId: misconception.id,
      evidencePolicy: state.solutionViewed ? "no_independence" : "normal",
      reason:
        `${misconception.id} has ${misconception.hits} classified hits; ` +
        `the authored remediation for this belief is ${strategy}, selected instead of a generic difficulty change.`,
    };
  }

  if (state.lastDelayedAssessment && !state.lastDelayedAssessment.correct) {
    return {
      strategy: "SCAFFOLDED",
      diagnosedState: "retention_gap",
      detectedGaps: ["delayed_retention"],
      misconceptionId: null,
      evidencePolicy: state.solutionViewed ? "no_independence" : "normal",
      reason:
        "A delayed assessment failed, so the earlier success did not survive the interval. " +
        "Rebuild the idea with support before claiming transfer.",
    };
  }

  if (state.mastered) {
    return {
      strategy: "TRANSFER",
      diagnosedState: "mastered",
      detectedGaps: [],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `Mastery is ${fmt(state.mastery)}, transfer evidence exists, and no live misconception remains. ` +
        "Skip introductory teaching and test the ability on unfamiliar material.",
    };
  }

  if (state.solutionViewed) {
    return {
      strategy: "SCAFFOLDED",
      diagnosedState: "solution_exposed",
      detectedGaps: ["independent_method"],
      misconceptionId: null,
      evidencePolicy: "no_independence",
      reason:
        "The solution was viewed, so any correct answer is practice rather than independent evidence. " +
        "Rebuild the method with scaffolding; do not record mastery from this exposure.",
    };
  }

  const last = state.lastIntervention;
  if (last?.outcome === "failed") {
    const next = strategyAfterFailure(last.strategy);
    return {
      strategy: next,
      diagnosedState: "intervention_failed",
      detectedGaps: [`strategy:${last.strategy}`],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `${last.strategy} did not produce the expected evidence; change to ${next} rather than repeating the same lesson. ` +
        (state.misconceptions.length === 0
          ? "No named misconception is available, so the change is at the strategy level."
          : "A named misconception would have outranked this branch."),
    };
  }

  if (state.hintDependence >= 0.6 && state.hintedAttempts >= 3 && state.mastery >= 0.65) {
    return {
      strategy: "SCAFFOLDED",
      diagnosedState: "scaffold_dependence",
      detectedGaps: ["hint_dependence"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `${Math.round(state.hintDependence * 100)}% of the recorded work was correct with hints, ` +
        "so accuracy is not yet independent. Fade the scaffold instead of moving to discovery.",
    };
  }

  if (shouldRemoveScaffolding(state.previousInterventions)) {
    return {
      strategy: "DISCOVERY",
      diagnosedState: "scaffold_ready_to_fade",
      detectedGaps: [],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        "Two successful scaffolded attempts are recorded; the support has been earned away. " +
        "Move to unlabelled discovery problems rather than leaving the learner dependent on hints.",
    };
  }

  if (
    state.mastery >= 0.7 &&
    state.conceptualCorrect >= 3 &&
    state.discoveryAttempts === 0
  ) {
    return {
      strategy: "DISCOVERY",
      diagnosedState: "discovery_gap",
      detectedGaps: ["independent_technique_recognition"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        "Conceptual evidence is strong but no discovery attempt exists; the missing dimension is recognising an unlabelled technique, " +
        "so worked examples would repeat what is already known.",
    };
  }

  if (last?.strategy === "DISCOVERY" && last.outcome === "succeeded") {
    return {
      strategy: "TRANSFER",
      diagnosedState: "transfer_ready",
      detectedGaps: [],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        "Discovery work succeeded; move the same ability into an unfamiliar combined problem rather than repeating discovery.",
    };
  }

  const scaffold = scaffoldFor("FOUNDATIONAL");
  if (state.mastery < 0.3) {
    return {
      strategy: "FOUNDATIONAL",
      diagnosedState: "foundational_gap",
      detectedGaps: ["prerequisite_knowledge"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `Mastery is ${fmt(state.mastery)}, below 0.30, and there is no named misconception to target; ` +
        `start with the missing idea (support ${scaffold.hintLevel}/4).`,
    };
  }
  if (state.mastery < 0.55) {
    return {
      strategy: "INTUITIVE",
      diagnosedState: "conceptual_gap",
      detectedGaps: ["conceptual_understanding"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `Mastery is ${fmt(state.mastery)}; the learner has some recall but not a stable concept. ` +
        "Use a concrete model before a formal procedure.",
    };
  }
  if (state.mastery < 0.75) {
    return {
      strategy: "SCAFFOLDED",
      diagnosedState: "application_gap",
      detectedGaps: ["guided_application"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `Mastery is ${fmt(state.mastery)}; the idea is present but application is not independent. ` +
        "Use targeted application practice with a fading scaffold.",
    };
  }
  if (state.mastery < 0.9) {
    return {
      strategy: "DISCOVERY",
      diagnosedState: "procedural_gap",
      detectedGaps: ["independent_application"],
      misconceptionId: null,
      evidencePolicy: "normal",
      reason:
        `Mastery is ${fmt(state.mastery)}; the next evidence needed is independent technique recognition, not another explanation.`,
    };
  }
  return {
    strategy: "TRANSFER",
    diagnosedState: "transfer_ready",
    detectedGaps: ["unfamiliar_context"],
    misconceptionId: null,
    evidencePolicy: "normal",
    reason:
      `Mastery is ${fmt(state.mastery)} and no transfer evidence is recorded; test the ability in an unfamiliar combined problem.`,
  };
}
