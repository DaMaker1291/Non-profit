// ─────────────────────────────────────────────────────────────────────────────
// DID THE INTERVENTION WORK?
//
// A completion is not an outcome. The evaluator asks for evidence produced
// after the intervention began, and separates:
//
//   yes      independent, unaided, correct work
//   partial  correct work that used help or viewed the solution
//   no       evidence arrived and it was wrong
//   not_yet  no evidence after the intervention has been recorded
//
// A delayed assessment can establish retention only when it is both correct and
// independent. Same-session repetition is not retention.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  DelayedAssessment,
  EvidenceType,
  InstructionStrategy,
  InstructionalEvidence,
  InterventionEvaluation,
} from "./types";

export interface EvaluationInput {
  readonly strategy: InstructionStrategy;
  readonly evidence: readonly InstructionalEvidence[];
  readonly startedAt?: number;
  readonly delayedAssessment?: DelayedAssessment | null;
  readonly solutionViewed?: boolean;
}

const INDEPENDENCE_BEARING = new Set<EvidenceType>([
  "independence",
  "discovery",
  "transfer",
  "retention",
]);

export function evaluateIntervention(input: EvaluationInput): InterventionEvaluation {
  const after =
    input.startedAt === undefined
      ? [...input.evidence]
      : input.evidence.filter((row) => row.at === undefined || row.at >= input.startedAt!);
  const evidenceTypes = [...new Set(after.map((row) => row.type))].sort() as EvidenceType[];

  const independent =
    input.solutionViewed !== true &&
    after.some(
      (row) =>
        row.correct &&
        row.solutionViewed !== true &&
        (row.hints ?? 0) === 0 &&
        INDEPENDENCE_BEARING.has(row.type),
    );

  const retained = Boolean(
    input.delayedAssessment?.correct && input.delayedAssessment.independent,
  );
  const anyCorrect = after.some((row) => row.correct);

  if (independent) {
    return {
      strategy: input.strategy,
      outcome: "yes",
      independent: true,
      retained,
      evidenceTypes,
      reason: retained
        ? "Independent work after the intervention, and a delayed independent assessment also held."
        : "Independent, hint-free work after the intervention — the instructional claim is supported.",
    };
  }
  if (input.solutionViewed === true && anyCorrect) {
    return {
      strategy: input.strategy,
      outcome: "partial",
      independent: false,
      retained,
      evidenceTypes,
      reason:
        "The work was correct after the solution was viewed, so it is practice, not evidence of independent mastery.",
    };
  }
  if (anyCorrect) {
    return {
      strategy: input.strategy,
      outcome: "partial",
      independent: false,
      retained,
      evidenceTypes,
      reason:
        "The work was correct but used help, so it does not establish that the learner can reproduce the method independently.",
    };
  }
  if (after.length === 0 && !retained) {
    return {
      strategy: input.strategy,
      outcome: "not_yet",
      independent: false,
      retained: false,
      evidenceTypes,
      reason: "No evidence has been recorded after the intervention yet.",
    };
  }
  return {
    strategy: input.strategy,
    outcome: "no",
    independent: false,
    retained,
    evidenceTypes,
    reason: retained
      ? "The delayed assessment held, but the post-intervention practice did not."
      : "The evidence after the intervention is wrong, so the strategy has not yet worked.",
  };
}
