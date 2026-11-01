// ─────────────────────────────────────────────────────────────────────────────
// THE ADAPTIVE INSTRUCTION CONTRACT
//
// This module does not decide what mathematics is true, and it does not write
// teaching prose. It decides HOW to teach an ability that the content layer has
// already authored, using evidence the learner model already holds.
//
// Three separations are deliberate:
//
//   difficultyBand  is a property of the CONTENT (how hard the idea is).
//   estimatedMinutes is an EMPIRICAL estimate of learning time, kept separate.
//   timeSpentMs     is observed time on this learner's attempts.
//
// No rule here derives one from another. A hard idea can be quick for one
// learner and slow for another; conflating those variables is how an engine
// starts calling "more minutes" "more difficult".
//
// EVIDENCE IS NOT A SCORE. An answer taken with a hint, or after the solution
// was viewed, can be real practice, but it cannot establish independence. The
// engine therefore carries `hints` and `solutionViewed` on every piece of
// evidence and lets the progress evaluator refuse the stronger claim. This is
// the same distinction lib/proof.ts makes for the rest of the product.
// ─────────────────────────────────────────────────────────────────────────────
import type { ProofVerdict } from "../proof";

export const INSTRUCTION_STRATEGIES = [
  "FOUNDATIONAL",
  "INTUITIVE",
  "DERIVATION",
  "WORKED_EXAMPLE",
  "SCAFFOLDED",
  "CONTRASTIVE",
  "DISCOVERY",
  "PROOF_COACHING",
  "TRANSFER",
] as const;

export type InstructionStrategy = (typeof INSTRUCTION_STRATEGIES)[number];

export const EVIDENCE_TYPES = [
  "recall",
  "application",
  "independence",
  "discovery",
  "transfer",
  "retention",
  "proof",
] as const;

/** What a piece of work can establish. Independence, discovery, transfer and
 *  retention are the stronger claims; application and recall are not. */
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export type EvidenceProvenance =
  | "diagnostic"
  | "practice"
  | "paper"
  | "retrieval"
  | "proof"
  | "teacher"
  | "import";

export type DifficultyBand = 1 | 2 | 3 | 4 | 5;

export interface AbilityPrerequisite {
  readonly abilityId: string;
  /** The minimum mastery THIS relationship requires. There is no universal
   *  threshold: familiarity may carry one prerequisite, independent
   *  application may be required by another. */
  readonly minMastery: number;
  readonly why: string;
}

export interface MathematicalAbility {
  readonly id: string;
  readonly title: string;
  readonly objective: string;
  /** A content characteristic, not a duration. */
  readonly difficultyBand: DifficultyBand;
  /** An empirical estimate, deliberately optional until enough learners have
   *  been measured to calibrate it. Never used to choose a strategy. */
  readonly estimatedMinutes?: number;
  readonly prerequisites: readonly AbilityPrerequisite[];
  readonly misconceptionIds: readonly string[];
  /** The genome concept this ability is taught through, when one exists. This
   *  is a link for evidence reuse, not a claim that the concept is the whole
   *  ability. The modular-arithmetic pilot has no genome node yet. */
  readonly genomeConceptId?: string;
}

export interface PrerequisiteStatus {
  readonly abilityId: string;
  readonly mastery: number;
  readonly minMastery: number;
  readonly ready: boolean;
  readonly why: string;
}

export interface InstructionalEvidence {
  readonly id: string;
  readonly abilityId: string;
  readonly type: EvidenceType;
  readonly correct: boolean;
  readonly provenance: EvidenceProvenance;
  /** When the evidence was produced. Used to order and window it, never to
   *  infer mastery from elapsed time. */
  readonly at?: number;
  readonly hints?: number;
  readonly solutionViewed?: boolean;
  /** Aggregated evidence from an existing ConceptEvidence record. One weighted
   *  row is equivalent to `weight` individual attempts. */
  readonly weight?: number;
  readonly proofVerdict?: ProofVerdict;
  readonly misconceptionId?: string;
}

export interface Attempt {
  readonly id: string;
  readonly itemId: string;
  readonly correct: boolean;
  readonly answer?: string;
  readonly hints?: number;
  readonly solutionViewed?: boolean;
  readonly at?: number;
  readonly errorCode?: string;
}

export interface ErrorClassification {
  readonly attemptId?: string;
  /** A classification produced by the error log: e.g.
   *  "congruence_is_equality", "chooses_arbitrary_modulus". */
  readonly code: string;
  readonly misconceptionId?: string;
  readonly at?: number;
  /** Aggregated count for evidence imported from an existing record. */
  readonly hits?: number;
}

export interface HintUse {
  readonly total: number;
  readonly byLevel?: Readonly<Record<number, number>>;
  readonly lastLevel?: number;
}

export interface PreviousIntervention {
  readonly id: string;
  readonly strategy: InstructionStrategy;
  readonly outcome: "succeeded" | "failed" | "inconclusive";
  readonly at?: number;
  readonly misconceptionId?: string;
  readonly successes?: number;
}

export interface DelayedAssessment {
  readonly at: number;
  readonly correct: boolean;
  readonly independent: boolean;
  readonly abilityId?: string;
}

export interface InstructionInput {
  readonly targetAbilityId: string;
  /** Existing ability mastery in [0,1], from the learner model. */
  readonly mastery: number;
  readonly evidence?: readonly InstructionalEvidence[];
  readonly attempts?: readonly Attempt[];
  readonly hintUse?: HintUse;
  readonly errorLog?: readonly ErrorClassification[];
  readonly timeSpentMs?: number;
  /** Ability id -> measured mastery. Only the prerequisites this ability
   *  declares are read. */
  readonly prerequisiteMastery?: Readonly<Record<string, number>>;
  readonly previousInterventions?: readonly PreviousIntervention[];
  readonly delayedAssessments?: readonly DelayedAssessment[];
  /** The solution was viewed on the current attempt/activity. This is a
   *  property of the exposure, not a verdict on the learner. */
  readonly solutionViewed?: boolean;
}

export interface DetectedMisconception {
  readonly id: string;
  readonly hits: number;
  readonly evidence: readonly string[];
  /** The strategy the authored remediation is designed around. The selector
   *  may still choose a prerequisite route first. */
  readonly preferredStrategy: InstructionStrategy;
}

export interface StudentInstructionState {
  readonly ability: MathematicalAbility;
  readonly mastery: number;
  readonly evidence: readonly InstructionalEvidence[];
  readonly attempts: readonly Attempt[];
  readonly hintUse: HintUse;
  readonly timeSpentMs: number | null;
  readonly prerequisites: readonly PrerequisiteStatus[];
  readonly previousInterventions: readonly PreviousIntervention[];
  readonly delayedAssessments: readonly DelayedAssessment[];
  readonly solutionViewed: boolean;
  readonly misconceptions: readonly DetectedMisconception[];
  readonly independentCorrect: number;
  readonly independentAttempts: number;
  readonly transferEvidence: boolean;
  readonly retentionEvidence: boolean;
  readonly conceptualCorrect: number;
  readonly hintedCorrect: number;
  readonly hintedAttempts: number;
  readonly hintDependence: number;
  readonly discoveryAttempts: number;
  readonly discoveryCorrect: number;
  readonly proofGaps: number;
  readonly scaffoldSuccesses: number;
  readonly lastIntervention: PreviousIntervention | null;
  readonly lastDelayedAssessment: DelayedAssessment | null;
  readonly mastered: boolean;
}

export interface ActivityValidation {
  /** The activity is authored static content, not generated at runtime. */
  readonly source: "authored-static";
  /** The arithmetic/claim checked by a person before the activity was added.
   *  A non-empty check is required; it is not a claim of external review. */
  readonly arithmeticCheck: string;
}

export interface InstructionalActivity {
  readonly id: string;
  readonly abilityId: string;
  readonly strategy: InstructionStrategy;
  readonly title: string;
  readonly objective: string;
  readonly body: readonly string[];
  readonly hints: readonly string[];
  readonly expectedEvidence: readonly EvidenceType[];
  readonly successCriteria: readonly string[];
  /** When set, this activity is the authored remediation for that belief.
   *  A core activity has no misconception. */
  readonly misconceptionId?: string;
  readonly validation: ActivityValidation;
}

export type DiagnosticState =
  | "prerequisite_gap"
  | "mastered"
  | "proof_gap"
  | "misconception"
  | "retention_gap"
  | "solution_exposed"
  | "intervention_failed"
  | "scaffold_dependence"
  | "scaffold_ready_to_fade"
  | "discovery_gap"
  | "foundational_gap"
  | "conceptual_gap"
  | "procedural_gap"
  | "application_gap"
  | "transfer_ready";

export type EvidencePolicy = "normal" | "no_independence";

export interface InstructionalDecision {
  readonly targetAbilityId: string;
  readonly diagnosedState: DiagnosticState;
  readonly detectedGaps: readonly string[];
  readonly strategy: InstructionStrategy;
  readonly explanationDepth: number;
  readonly hintLevel: number;
  readonly nextActivityId: string;
  readonly learningObjective: string;
  readonly expectedEvidence: readonly EvidenceType[];
  readonly adaptationReason: string;
  /** The ability whose content is actually served. Different from the target
   *  when a prerequisite must be repaired first. */
  readonly routedToAbilityId?: string;
  readonly contentAbilityId: string;
  readonly contentDifficultyBand: DifficultyBand;
  readonly estimatedMinutes: number | null;
  readonly misconceptionId: string | null;
  readonly evidencePolicy: EvidencePolicy;
  readonly successCriteria: readonly string[];
  /** Observed time on the learner's previous work, reported for audit. It is
   *  never used as a difficulty proxy or to choose the strategy. */
  readonly observedTimeMs: number | null;
  /** Stable for a given learner state and content selection. Useful as an
   *  audit key; it is not a random identifier. */
  readonly interventionId: string;
}

export type InterventionOutcome = "yes" | "partial" | "no" | "not_yet";

export interface InterventionEvaluation {
  readonly strategy: InstructionStrategy;
  readonly outcome: InterventionOutcome;
  /** True only when the evidence is correct, hint-free, solution-free, and of
   *  an independence-bearing type. */
  readonly independent: boolean;
  readonly retained: boolean;
  readonly evidenceTypes: readonly EvidenceType[];
  readonly reason: string;
}
