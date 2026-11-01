// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE SUITE FOR THE ADAPTIVE INSTRUCTION ENGINE
//
// This is deliberately a separate module from the main verification harness:
// the twelve required behaviours are readable in one place, and `npm run verify`
// imports this module so they cannot silently drift out of the release gate.
// It compiles nothing of its own; it reads the shared .verify mirror.
// ─────────────────────────────────────────────────────────────────────────────
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const engine = require("../.verify/adaptive-instruction/adaptive-instruction-engine.js");
const abilities = require("../.verify/adaptive-instruction/abilities.js");
const content = require("../.verify/adaptive-instruction/instructional-content.js");
const evaluator = require("../.verify/adaptive-instruction/progress-evaluator.js");
const scaffolding = require("../.verify/adaptive-instruction/scaffolding-controller.js");
const state = require("../.verify/adaptive-instruction/student-state.js");

const TARGET = "nt-mod-select-modulus";
const READY_PREREQS = {
  "nt-mod-residue-classes": 0.8,
  "nt-mod-congruence": 0.8,
};

function base(over = {}) {
  return {
    targetAbilityId: TARGET,
    mastery: 0,
    prerequisiteMastery: READY_PREREQS,
    ...over,
  };
}

function ev(over = {}) {
  return {
    id: "e1",
    abilityId: TARGET,
    type: "application",
    correct: true,
    provenance: "practice",
    at: 1,
    hints: 0,
    ...over,
  };
}

export function runAdaptiveInstructionSuite(ok) {
  console.log("▸ Adaptive instruction: the strategy follows the learner, not the label");

  // A. DIFFICULTY AND TIME ARE SEPARATE FIELDS.
  const mod = abilities.abilityById(TARGET);
  ok(
    mod.difficultyBand === 3 && mod.estimatedMinutes === 25,
    `difficulty and learning time are separate ability fields (band ${mod.difficultyBand}, estimate ${mod.estimatedMinutes}m)`,
  );
  const beginner = engine.decideInstruction(base());
  ok(
    beginner.contentDifficultyBand === 3 && beginner.estimatedMinutes === 25,
    "and the decision reports both separately rather than deriving one from the other",
  );

  // B. PREREQUISITE THRESHOLDS ARE PER RELATIONSHIP.
  const congruence = abilities.abilityById("nt-mod-congruence");
  const congruencePrereq = abilities.prerequisiteStatuses(congruence, {
    "nt-mod-residue-classes": 0.4,
  });
  ok(
    congruencePrereq[0].ready && congruencePrereq[0].minMastery === 0.4,
    "residue classes at 0.40 satisfy congruence's own lower threshold (0.40)",
  );
  const selectPrereq = abilities.prerequisiteStatuses(mod, {
    "nt-mod-residue-classes": 0.8,
    "nt-mod-congruence": 0.74,
  });
  const congruenceGate = selectPrereq.find((p) => p.abilityId === "nt-mod-congruence");
  ok(
    congruenceGate && !congruenceGate.ready && congruenceGate.minMastery === 0.75,
    "but the same 0.74 does not satisfy selecting a modulus, which requires 0.75",
  );

  // C. A BEGINNER RECEIVES FOUNDATIONAL TEACHING.
  ok(
    beginner.strategy === "FOUNDATIONAL" && beginner.nextActivityId === "mod-select-foundational",
    `a beginner receives FOUNDATIONAL teaching (${beginner.nextActivityId})`,
  );

  // D. AN INTERMEDIATE RECEIVES TARGETED APPLICATION PRACTICE.
  const intermediate = engine.decideInstruction(base({ mastery: 0.6 }));
  ok(
    intermediate.strategy === "SCAFFOLDED" && intermediate.diagnosedState === "application_gap",
    `an intermediate learner receives scaffolded application practice (${intermediate.strategy})`,
  );

  // E. STRONG CONCEPTUAL, WEAK DISCOVERY.
  const strongConceptual = engine.decideInstruction(
    base({
      mastery: 0.8,
      evidence: [ev({ type: "application", correct: true, weight: 3 })],
    }),
  );
  ok(
    strongConceptual.strategy === "DISCOVERY" &&
      strongConceptual.diagnosedState === "discovery_gap",
    "strong conceptual evidence with no discovery attempt selects unlabelled discovery work",
  );

  // F. WEAK PROOF CONSTRUCTION.
  const proofGap = engine.decideInstruction(
    base({
      mastery: 0.8,
      errorLog: [{ code: "checks_examples_only", hits: 2 }],
    }),
  );
  ok(
    proofGap.strategy === "PROOF_COACHING" && proofGap.diagnosedState === "proof_gap",
    `checked examples instead of a general argument selects PROOF_COACHING (${proofGap.nextActivityId})`,
  );

  // G. REPEATED MISCONCEPTION GETS TARGETED REMEDIATION.
  const equals = engine.decideInstruction(
    base({
      mastery: 0.25,
      errorLog: [{ code: "congruence_is_equality", hits: 2 }],
    }),
  );
  ok(
    equals.strategy === "FOUNDATIONAL" &&
      equals.misconceptionId === "mod-equals" &&
      equals.nextActivityId === "mod-select-foundational-equals",
    `a repeated a ≡ b means a = b slip gets its own remediation (${equals.nextActivityId})`,
  );
  const arbitrary = engine.decideInstruction(
    base({
      mastery: 0.7,
      errorLog: [{ code: "chooses_arbitrary_modulus", hits: 2 }],
    }),
  );
  ok(
    arbitrary.strategy === "CONTRASTIVE" &&
      arbitrary.nextActivityId === "mod-select-contrastive-arbitrary",
    "an arbitrary-modulus slip gets contrastive cases, not more congruent calculations",
  );

  // H. PREVIOUSLY MASTERED ABILITY DOES NOT REPEAT INTRODUCTION.
  const mastered = engine.decideInstruction(
    base({
      mastery: 0.95,
      evidence: [ev({ type: "transfer", correct: true })],
    }),
  );
  ok(
    mastered.strategy === "TRANSFER" &&
      mastered.diagnosedState === "mastered" &&
      mastered.detectedGaps.length === 0,
    "a mastered ability skips introductory teaching and goes to transfer",
  );

  // I. FAILED INTERVENTION CHANGES STRATEGY.
  const failed = engine.decideInstruction(
    base({
      mastery: 0.6,
      previousInterventions: [
        { id: "i1", strategy: "WORKED_EXAMPLE", outcome: "failed" },
      ],
    }),
  );
  ok(
    failed.strategy !== "WORKED_EXAMPLE" &&
      failed.strategy === "SCAFFOLDED" &&
      failed.diagnosedState === "intervention_failed",
    `a failed worked example changes to SCAFFOLDED, not the same lesson again (${failed.strategy})`,
  );

  // J. SUCCESS REMOVES SCAFFOLDING PROGRESSIVELY.
  const afterTwo = engine.decideInstruction(
    base({
      mastery: 0.8,
      previousInterventions: [
        { id: "i1", strategy: "SCAFFOLDED", outcome: "succeeded" },
        { id: "i2", strategy: "SCAFFOLDED", outcome: "succeeded" },
      ],
    }),
  );
  ok(
    afterTwo.strategy === "DISCOVERY" &&
      afterTwo.hintLevel === 1 &&
      afterTwo.diagnosedState === "scaffold_ready_to_fade",
    "two scaffolded successes remove the scaffold and move to discovery",
  );
  const firstSuccess = scaffolding.nextScaffoldAfterSuccess("SCAFFOLDED", 1);
  ok(
    firstSuccess.strategy === "SCAFFOLDED" &&
      firstSuccess.hintLevel === 1 &&
      firstSuccess.hintLevel < scaffolding.scaffoldFor("SCAFFOLDED").hintLevel,
    "the first scaffolded success lowers the hint level rather than removing everything at once",
  );

  // K. SOLUTION VIEWED CANNOT EARN INDEPENDENCE.
  const exposed = engine.decideInstruction(
    base({
      mastery: 0.6,
      solutionViewed: true,
      evidence: [ev({ type: "independence", correct: true })],
    }),
  );
  ok(
    exposed.evidencePolicy === "no_independence" &&
      !exposed.expectedEvidence.includes("independence"),
    "viewing the solution removes the independence claim from the expected evidence",
  );
  const exposedMastery = engine.decideInstruction(
    base({
      mastery: 0.95,
      solutionViewed: true,
      evidence: [ev({ type: "transfer", correct: true })],
    }),
  );
  ok(
    exposedMastery.strategy !== "TRANSFER" &&
      exposedMastery.evidencePolicy === "no_independence",
    "even a highly-mastered learner who viewed the solution is not routed to transfer mastery",
  );
  const exposedGrade = evaluator.evaluateIntervention({
    strategy: "SCAFFOLDED",
    solutionViewed: true,
    evidence: [ev({ type: "independence", correct: true })],
  });
  ok(
    exposedGrade.outcome === "partial" && exposedGrade.independent === false,
    "a correct answer after viewing the solution is partial practice, not independent mastery",
  );

  // L. DIFFERENT LEARNERS, SAME TARGET, DIFFERENT PATHWAYS.
  const discovery = engine.decideInstruction(
    base({ mastery: 0.8, evidence: [ev({ type: "application", weight: 3 })] }),
  );
  const pathways = new Set([
    beginner.strategy,
    arbitrary.strategy,
    discovery.strategy,
    mastered.strategy,
  ]);
  ok(
    pathways.size === 4,
    `four learner states produce four strategies for one ability (${[...pathways].join(", ")})`,
  );
  ok(
    beginner.nextActivityId !== discovery.nextActivityId &&
      beginner.nextActivityId !== arbitrary.nextActivityId,
    "and different strategies select different authored activities, not the same lesson with different lengths",
  );

  // M. SAME LEARNER STATE IS REPRODUCIBLE.
  const r1 = engine.decideInstruction(base({ mastery: 0.6 }));
  const r2 = engine.decideInstruction(base({ mastery: 0.6 }));
  ok(
    JSON.stringify(r1) === JSON.stringify(r2) &&
      r1.interventionId === r2.interventionId &&
      /^[0-9a-f]{8}$/.test(r1.interventionId),
    "the same state produces the same decision and the same stable intervention fingerprint",
  );

  // N. MISSING PREREQUISITE ROUTES THROUGH THE PREREQUISITE ABILITY.
  const blocked = engine.decideInstruction(
    base({
      mastery: 0.8,
      prerequisiteMastery: { "nt-mod-residue-classes": 0.8, "nt-mod-congruence": 0.4 },
    }),
  );
  ok(
    blocked.diagnosedState === "prerequisite_gap" &&
      blocked.routedToAbilityId === "nt-mod-congruence" &&
      blocked.strategy === "FOUNDATIONAL" &&
      blocked.nextActivityId === "mod-congruence-foundational",
    `a missing congruence prerequisite routes to the prerequisite's own lesson (${blocked.routedToAbilityId})`,
  );
  const ready = engine.decideInstruction(
    base({
      mastery: 0.1,
      prerequisiteMastery: { "nt-mod-residue-classes": 0.5, "nt-mod-congruence": 0.75 },
    }),
  );
  ok(
    ready.routedToAbilityId === undefined,
    "a prerequisite exactly at its required threshold no longer blocks the target",
  );

  // O. OBSERVED TIME IS NOT A DIFFICULTY PROXY.
  const fast = engine.decideInstruction(base({ mastery: 0.6, timeSpentMs: 1_000 }));
  const slow = engine.decideInstruction(base({ mastery: 0.6, timeSpentMs: 9_000_000 }));
  ok(
    fast.strategy === slow.strategy && fast.interventionId === slow.interventionId,
    "recorded time does not silently become a difficulty label",
  );
  ok(
    fast.observedTimeMs === 1_000 && slow.observedTimeMs === 9_000_000,
    "the observed time is still carried for audit rather than discarded",
  );

  // O2. HINTED ACCURACY IS NOT INDEPENDENT APPLICATION.
  const hintedOnly = engine.decideInstruction(
    base({
      mastery: 0.8,
      evidence: [ev({ type: "independence", correct: true, hints: 2, weight: 3 })],
    }),
  );
  ok(
    hintedOnly.strategy === "SCAFFOLDED" &&
      hintedOnly.diagnosedState === "scaffold_dependence",
    "a learner whose correct work was all hinted gets a fading scaffold, not discovery",
  );

  // P. THE EVALUATOR MEASURES OUTCOMES, NOT COMPLETION.
  const noEvidence = evaluator.evaluateIntervention({
    strategy: "SCAFFOLDED",
    evidence: [],
  });
  const wrong = evaluator.evaluateIntervention({
    strategy: "SCAFFOLDED",
    evidence: [ev({ type: "independence", correct: false })],
  });
  const hinted = evaluator.evaluateIntervention({
    strategy: "SCAFFOLDED",
    evidence: [ev({ type: "independence", correct: true, hints: 2 })],
  });
  const independent = evaluator.evaluateIntervention({
    strategy: "SCAFFOLDED",
    evidence: [ev({ type: "independence", correct: true })],
  });
  const retained = evaluator.evaluateIntervention({
    strategy: "TRANSFER",
    evidence: [ev({ type: "transfer", correct: true })],
    delayedAssessment: { at: 100, correct: true, independent: true },
  });
  ok(
    noEvidence.outcome === "not_yet" &&
      wrong.outcome === "no" &&
      hinted.outcome === "partial" &&
      independent.outcome === "yes" &&
      retained.retained === true,
    "the evaluator separates not_yet, wrong, helped and independent evidence",
  );

  // Q. DELAYED FAILURE REOPENS THE IDEA BEFORE TRANSFER.
  const delayedFail = engine.decideInstruction(
    base({
      mastery: 0.95,
      evidence: [ev({ type: "transfer", correct: true })],
      delayedAssessments: [{ at: 20, correct: false, independent: true }],
    }),
  );
  ok(
    delayedFail.strategy === "SCAFFOLDED" &&
      delayedFail.diagnosedState === "retention_gap",
    "a failed delayed assessment rebuilds the idea instead of claiming mastery",
  );

  // R. AUTHORED CONTENT IS COMPLETE, VALIDATED AND NOT GENERATED AT RUNTIME.
  const validationErrors = content.contentValidationErrors();
  const targetActivities = content.INSTRUCTIONAL_CONTENT.filter((a) => a.abilityId === TARGET);
  const targetStrategies = new Set(targetActivities.map((a) => a.strategy));
  ok(
    validationErrors.length === 0,
    `every authored activity has content and an arithmetic check (${validationErrors.join("; ") || "none"})`,
  );
  ok(
    targetStrategies.size === 9,
    `all nine strategies have an authored activity for the target (${targetStrategies.size}/9)`,
  );
  ok(
    content.INSTRUCTIONAL_CONTENT.every(
      (a) => a.validation.source === "authored-static" && a.validation.arithmeticCheck.trim().length > 0,
    ),
    "no activity is served without a static arithmetic validation",
  );
  let unknownThrew = false;
  try {
    content.activityFor({ abilityId: "not-in-this-build", strategy: "FOUNDATIONAL" });
  } catch {
    unknownThrew = true;
  }
  ok(unknownThrew, "an unknown ability cannot silently receive generated content");

  // R2. THE AUTHORED MODULAR ARITHMETIC IS CHECKED, NOT JUST DESCRIBED.
  // These are the exact claims the prose depends on. A validation string that
  // merely says "checked" is not a check; these draw the numbers.
  const remainder = (a, n) => ((a % n) + n) % n;
  ok(remainder(17, 3) === 2, "17 ≡ 2 (mod 3) is true, so it cannot be the counterexample");
  ok(remainder(17, 7) === 3 && remainder(2, 7) === 2, "17 ≡ 2 (mod 7) is false, and is the real counterexample");
  ok(
    remainder(8, 6) === remainder(14, 6) && remainder(8, 4) === 0 && remainder(14, 4) === 2,
    "modulus 6 merges 8 and 14 while modulus 4 separates them by divisibility by 4",
  );
  ok(
    remainder(8, 10) === remainder(18, 10) && remainder(8, 4) === 0 && remainder(18, 4) === 2,
    "modulus 10 is larger than 4 but still merges a divisible and a non-divisible case",
  );
  ok(
    remainder(45, 7) !== remainder(60, 7) && remainder(45, 3) === 0 && remainder(60, 3) === 0,
    "45 and 60 differ on shelf modulo 7 but agree on the multiple-of-3 label",
  );
  ok(remainder(9, 7) === 2 && remainder(9, 3) === 0 && remainder(30, 7) === 2 && remainder(30, 3) === 0,
    "9 is the smallest positive code on shelf 2 and marked, and adding 21 preserves both");

  // S. THE EXISTING CONCEPT EVIDENCE ADAPTER DOES NOT INVENT INDEPENDENCE.
  const record = {
    conceptId: "number-bases",
    subject: "maths",
    title: "Number bases",
    mastery: 0.6,
    confidence: null,
    attempts: 4,
    correct: 2,
    hintedAnswers: 1,
    topMisconception: null,
    misconceptionHits: 0,
    lifetimeMisconception: { id: "mod-equals", hits: 3 },
    lastSeen: 0,
    status: "learning",
    independentAsked: 2,
    independentCorrect: 1,
    transferAsked: 1,
    transferCorrect: 0,
    avgSeconds: null,
  };
  const adapted = state.inputFromConceptRecord(TARGET, record);
  ok(
    adapted.mastery === 0.6 &&
      adapted.evidence.some((e) => e.type === "independence" && e.correct && e.weight === 1) &&
      adapted.evidence.some((e) => e.type === "independence" && !e.correct && e.weight === 1) &&
      adapted.errorLog[0].misconceptionId === "mod-equals" &&
      adapted.errorLog[0].hits === 3,
    "existing ConceptEvidence becomes weighted instructional evidence and a classified error, without inventing a new mastery score",
  );

  // T. THE ABILITY CATALOG ITSELF IS CONSISTENT.
  ok(
    abilities.abilityById(TARGET).prerequisites.every(
      (p) => p.minMastery >= 0 && p.minMastery <= 1 && abilities.ABILITY_BY_ID[p.abilityId],
    ),
    "every ability prerequisite names a real ability and a mastery threshold in [0,1]",
  );
  ok(
    abilities.ABILITY_BY_ID[TARGET].misconceptionIds.includes("mod-arbitrary"),
    "the target honestly declares the misconceptions its remediation covers",
  );
}
