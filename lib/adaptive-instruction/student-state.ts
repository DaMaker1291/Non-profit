// ─────────────────────────────────────────────────────────────────────────────
// THE LEARNER STATE THE ENGINE ACTUALLY READS
//
// This is an adapter, not a second learner model. Mastery, independence and
// misconception counts already live on ConceptEvidence; observational time,
// previous interventions and delayed assessments are carried alongside because
// the instructional decision needs them and the concept record does not own
// them. Nothing here writes to the record.
// ─────────────────────────────────────────────────────────────────────────────
import type { ConceptEvidence } from "../learner-model";
import { prerequisiteStatuses } from "./abilities";
import { classifyError, detectMisconceptions } from "./misconception-detection";
import type {
  Attempt,
  DetectedMisconception,
  ErrorClassification,
  HintUse,
  InstructionInput,
  InstructionalEvidence,
  MathematicalAbility,
  PreviousIntervention,
  StudentInstructionState,
} from "./types";

const STRONG_EVIDENCE = new Set(["independence", "discovery", "transfer", "retention"]);

function weightOf(evidence: InstructionalEvidence): number {
  return Math.max(1, evidence.weight ?? 1);
}

function sumWhere(
  evidence: readonly InstructionalEvidence[],
  predicate: (row: InstructionalEvidence) => boolean,
): number {
  return evidence.reduce((sum, row) => sum + (predicate(row) ? weightOf(row) : 0), 0);
}

function trailingScaffoldSuccesses(previous: readonly PreviousIntervention[]): number {
  let count = 0;
  for (let i = previous.length - 1; i >= 0; i--) {
    const row = previous[i];
    if (row.strategy !== "SCAFFOLDED" || row.outcome !== "succeeded") break;
    count += 1;
  }
  return count;
}

export function buildStudentState(
  input: InstructionInput,
  ability: MathematicalAbility,
): StudentInstructionState {
  const evidence = [...(input.evidence ?? [])].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  const attempts = [...(input.attempts ?? [])];
  const previousInterventions = [...(input.previousInterventions ?? [])];
  const delayedAssessments = [...(input.delayedAssessments ?? [])].sort((a, b) => a.at - b.at);
  const misconceptions = detectMisconceptions(input.errorLog ?? [], attempts);

  const solutionViewed =
    input.solutionViewed === true ||
    evidence.some((row) => row.solutionViewed === true) ||
    attempts.some((row) => row.solutionViewed === true);

  const hintTotal =
    input.hintUse?.total ??
    evidence.reduce((sum, row) => sum + (row.hints ?? 0) * weightOf(row), 0) +
      attempts.reduce((sum, row) => sum + (row.hints ?? 0), 0);

  const independentRows = evidence.filter(
    (row) => STRONG_EVIDENCE.has(row.type) && (row.hints ?? 0) === 0 && row.solutionViewed !== true,
  );
  const independentCorrect = sumWhere(independentRows, (row) => row.correct);
  const independentAttempts = independentRows.reduce((sum, row) => sum + weightOf(row), 0);
  const transferEvidence = evidence.some(
    (row) => row.correct && (row.type === "transfer" || row.type === "retention"),
  );
  const retentionEvidence = evidence.some((row) => row.correct && row.type === "retention");
  const conceptualCorrect = sumWhere(
    evidence,
    (row) => row.correct && (row.type === "recall" || row.type === "application"),
  );
  const hintedRows = evidence.filter((row) => (row.hints ?? 0) > 0);
  const hintedCorrect = sumWhere(hintedRows, (row) => row.correct);
  const hintedAttempts = hintedRows.reduce((sum, row) => sum + weightOf(row), 0);
  const hintDependence = hintedAttempts > 0 ? hintedCorrect / hintedAttempts : 0;
  const discoveryRows = evidence.filter((row) => row.type === "discovery");
  const discoveryAttempts = discoveryRows.reduce((sum, row) => sum + weightOf(row), 0);
  const discoveryCorrect = sumWhere(discoveryRows, (row) => row.correct);

  const proofGaps =
    evidence.reduce(
      (sum, row) => sum + (!row.correct && row.type === "proof" ? weightOf(row) : 0),
      0,
    ) +
    (input.errorLog ?? []).reduce((sum, error) => {
      const signature = classifyError(error.code, error.misconceptionId);
      return sum + (signature?.id === "mod-proof-gap" ? error.hits ?? 1 : 0);
    }, 0);

  const lastIntervention = previousInterventions[previousInterventions.length - 1] ?? null;
  const lastDelayedAssessment = delayedAssessments[delayedAssessments.length - 1] ?? null;
  const mastered =
    input.mastery >= 0.9 &&
    transferEvidence &&
    misconceptions.length === 0 &&
    !solutionViewed &&
    lastIntervention?.outcome !== "failed";

  return {
    ability,
    mastery: Math.max(0, Math.min(1, input.mastery)),
    evidence,
    attempts,
    hintUse: {
      total: hintTotal,
      byLevel: input.hintUse?.byLevel,
      lastLevel: input.hintUse?.lastLevel,
    },
    timeSpentMs: typeof input.timeSpentMs === "number" ? input.timeSpentMs : null,
    prerequisites: prerequisiteStatuses(ability, input.prerequisiteMastery ?? {}),
    previousInterventions,
    delayedAssessments,
    solutionViewed,
    misconceptions,
    independentCorrect,
    independentAttempts,
    transferEvidence,
    retentionEvidence,
    conceptualCorrect,
    hintedCorrect,
    hintedAttempts,
    hintDependence,
    discoveryAttempts,
    discoveryCorrect,
    proofGaps,
    scaffoldSuccesses: trailingScaffoldSuccesses(previousInterventions),
    lastIntervention,
    lastDelayedAssessment,
    mastered,
  };
}

/** Reuse the records the product already has, without pretending those records
 *  carry evidence they do not. Independent and transfer counts become weighted
 *  rows; a lifetime misconception becomes a classified error. */
export function evidenceFromConceptRecord(
  record: ConceptEvidence,
  abilityId: string,
): InstructionalEvidence[] {
  const rows: InstructionalEvidence[] = [];
  if (record.independentAsked > 0) {
    if (record.independentCorrect > 0) {
      rows.push({
        id: `${abilityId}:record:independent:correct`,
        abilityId,
        type: "independence",
        correct: true,
        provenance: "practice",
        weight: record.independentCorrect,
        hints: 0,
      });
    }
    const missed = record.independentAsked - record.independentCorrect;
    if (missed > 0) {
      rows.push({
        id: `${abilityId}:record:independent:wrong`,
        abilityId,
        type: "independence",
        correct: false,
        provenance: "practice",
        weight: missed,
        hints: 0,
      });
    }
  }
  if (record.transferAsked > 0) {
    if (record.transferCorrect > 0) {
      rows.push({
        id: `${abilityId}:record:transfer:correct`,
        abilityId,
        type: "transfer",
        correct: true,
        provenance: "practice",
        weight: record.transferCorrect,
        hints: 0,
      });
    }
    const missed = record.transferAsked - record.transferCorrect;
    if (missed > 0) {
      rows.push({
        id: `${abilityId}:record:transfer:wrong`,
        abilityId,
        type: "transfer",
        correct: false,
        provenance: "practice",
        weight: missed,
        hints: 0,
      });
    }
  }
  return rows;
}

export function errorsFromConceptRecord(record: ConceptEvidence): ErrorClassification[] {
  if (!record.lifetimeMisconception) return [];
  return [
    {
      code: "lifetime_misconception",
      misconceptionId: record.lifetimeMisconception.id,
      hits: record.lifetimeMisconception.hits,
    },
  ];
}

/** A convenient, explicit adapter for a caller that already holds a concept
 *  record. `solutionViewed` and delayed assessments are not stored on the
 *  concept record, so they must be supplied honestly rather than inferred. */
export function inputFromConceptRecord(
  targetAbilityId: string,
  record: ConceptEvidence,
  extras: Omit<InstructionInput, "targetAbilityId" | "mastery" | "evidence" | "errorLog" | "hintUse"> = {},
): InstructionInput {
  return {
    targetAbilityId,
    mastery: record.mastery,
    evidence: evidenceFromConceptRecord(record, targetAbilityId),
    errorLog: errorsFromConceptRecord(record),
    hintUse: { total: record.hintedAnswers },
    ...extras,
  };
}

export function detectedMisconceptions(
  errorLog: readonly ErrorClassification[] = [],
  attempts: readonly Attempt[] = [],
): DetectedMisconception[] {
  return detectMisconceptions(errorLog, attempts);
}

export function emptyHintUse(): HintUse {
  return { total: 0 };
}
