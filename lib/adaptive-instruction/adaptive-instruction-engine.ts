// ─────────────────────────────────────────────────────────────────────────────
// THE ADAPTIVE INSTRUCTION ENGINE
//
// The public door. It composes the ability catalog, learner state, misconception
// detector, strategy selector, authored content and scaffolding rules into one
// auditable decision. It writes nothing and calls no model.
//
// `interventionId` is a stable fingerprint of the decision inputs and the chosen
// activity. It is not a random id and it is not a timestamp: the same learner
// state and ability produce the same fingerprint, which is what makes an
// ineffective policy reproducible and reviewable.
// ─────────────────────────────────────────────────────────────────────────────
import { abilityById } from "./abilities";
import { activityFor } from "./instructional-content";
import { selectStrategy } from "./strategy-selector";
import { buildStudentState } from "./student-state";
import { scaffoldFor } from "./scaffolding-controller";
import type {
  EvidenceType,
  InstructionInput,
  InstructionalDecision,
} from "./types";

function stableFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const NO_INDEPENDENCE_CLAIM = new Set<EvidenceType>([
  "independence",
  "discovery",
  "transfer",
  "retention",
  "proof",
]);

function expectedEvidenceFor(
  expected: readonly EvidenceType[],
  noIndependence: boolean,
): EvidenceType[] {
  if (!noIndependence) return [...expected];
  const safe = expected.filter((kind) => !NO_INDEPENDENCE_CLAIM.has(kind));
  return safe.length > 0 ? safe : ["application"];
}

export function decideInstruction(input: InstructionInput): InstructionalDecision {
  const ability = abilityById(input.targetAbilityId);
  const state = buildStudentState(input, ability);
  const selection = selectStrategy(state, ability);
  const contentAbilityId = selection.routedToAbilityId ?? ability.id;
  const contentAbility = abilityById(contentAbilityId);
  const activity = activityFor({
    abilityId: contentAbilityId,
    strategy: selection.strategy,
    misconceptionId: selection.misconceptionId,
  });
  const scaffold = scaffoldFor(selection.strategy, state.solutionViewed);
  const noIndependence = selection.evidencePolicy === "no_independence";
  const expectedEvidence = expectedEvidenceFor(activity.expectedEvidence, noIndependence);

  const fingerprintParts = [
    input.targetAbilityId,
    contentAbilityId,
    String(state.mastery),
    selection.strategy,
    selection.diagnosedState,
    selection.misconceptionId ?? "none",
    activity.id,
    state.solutionViewed ? "solution" : "no-solution",
    state.lastIntervention?.id ?? "no-intervention",
  ];

  return {
    targetAbilityId: input.targetAbilityId,
    diagnosedState: selection.diagnosedState,
    detectedGaps: selection.detectedGaps,
    strategy: selection.strategy,
    explanationDepth: scaffold.explanationDepth,
    hintLevel: scaffold.hintLevel,
    nextActivityId: activity.id,
    learningObjective: activity.objective,
    expectedEvidence,
    adaptationReason: selection.reason,
    ...(selection.routedToAbilityId
      ? { routedToAbilityId: selection.routedToAbilityId }
      : {}),
    contentAbilityId,
    contentDifficultyBand: contentAbility.difficultyBand,
    estimatedMinutes: contentAbility.estimatedMinutes ?? null,
    misconceptionId: selection.misconceptionId,
    evidencePolicy: selection.evidencePolicy,
    successCriteria: activity.successCriteria,
    observedTimeMs: state.timeSpentMs,
    interventionId: stableFingerprint(fingerprintParts.join("|")),
  };
}
