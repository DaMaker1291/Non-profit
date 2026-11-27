// ─────────────────────────────────────────────────────────────────────────────
// MODEL COVERAGE — the honest state of the five-pilot standard, PER CONCEPT.
//
// "Repeat it for all concepts" needs a number, not an intention. This module turns
// the whole 135-concept genome into one row each, with NINE SEPARATE FACTS that a
// report is tempted to collapse into one:
//
//   1. concept          — the genome has the concept
//   2. lessonFile       — a plan object answers for it (planFor ≠ null)
//   3. teachingSequence — that plan carries authored sections (a sequence), not
//                         only prose that a renderer grouped into paragraphs
//   4. researchDossier  — inspected research exists, or is only identified
//   5. modality         — the delivered teaching mode (interactive model, authored
//                         text, or nothing yet). This records what SHIPS; it is
//                         not a claim that the mode was judged the best fit.
//   6. interaction      — which model, if any
//   7. browserVerified  — a person opened that model in a browser (model-evidence)
//   8. educatorReviewed — a named teacher signed the dossier
//   9. learnerTested    — learners were assessed. Zero, and no code path can raise it.
//
// A lesson FILE is not a teaching sequence, and a teaching sequence is not an
// interactive model. `stage` still orders the three for the queue, but every
// count above is reported separately so the dashboard cannot imply more.
// ─────────────────────────────────────────────────────────────────────────────

import { CONCEPTS } from "./genome";
import { modelForConcept, type InteractiveModelId } from "./interactive-models";
import { CONCEPT_DOSSIERS } from "./learning-research";
import { evidenceFor } from "./model-evidence";
import { pilotPlanIds, planFor } from "./lesson-plans";

export type ConceptStage = "genome-only" | "planned" | "modelled";
export type DossierState = "researched" | "identified" | "none";
export type DeliveredModality = "interactive-model" | "plan-text" | "none";

export interface CoverageRow {
  readonly conceptId: string;
  readonly subject: string;
  /** 1. The concept exists in the genome. Always true for a row; kept explicit so
   *  a row's shape matches the nine published measures. */
  readonly concept: true;
  /** 2. A plan answers for the concept. */
  readonly lessonFile: boolean;
  /** 3. A hand-authored teaching sequence: either an authored plan (provenance
   *  `pilot`/`authored`, which carries objective, intuition, teaching paragraphs,
   *  traps and used-next) or explicit authored sections. A SUPPLEMENTAL plan is a
   *  lesson file, not a teaching sequence: it is composed from the genome note and
   *  a concept lens, and counting it would inflate the measure. */
  readonly teachingSequence: boolean;
  /** 4. Research state. */
  readonly researchDossier: DossierState;
  /** 5. What the lesson actually delivers. */
  readonly modality: DeliveredModality;
  /** 6. The interaction, when there is one. */
  readonly interaction: InteractiveModelId | null;
  /** 7. A browser pass is recorded for that interaction. */
  readonly browserVerified: boolean;
  /** 8. A named teacher signed the dossier. */
  readonly educatorReviewed: boolean;
  /** 9. Learners were tested. No instrument exists in this build, so this is
   *  `false` for every row and nothing in the code can set it. */
  readonly learnerTested: false;
  readonly stage: ConceptStage;
}

export function coverageRows(): readonly CoverageRow[] {
  const dossierById = new Map(CONCEPT_DOSSIERS.map((d) => [d.conceptId, d] as const));
  return CONCEPTS.map((concept) => {
    const plan = planFor(concept.id);
    const dossier = dossierById.get(concept.id);
    const interaction = modelForConcept(concept.id, plan?.interactive);
    const lessonFile = Boolean(plan);
    // The generated fallback is the ONLY plan marked `supplemental`; the pilot and
    // chemistry plans carry no provenance field, and both are hand-authored. So the
    // test is "not the generated fallback", which is the distinction that matters.
    const authoredPlan = Boolean(plan) && plan?.provenance !== "supplemental";
    const teachingSequence = Boolean(plan?.sections?.length) || authoredPlan;
    // "plan-text" is the prose lesson, authored or supplemental; it is NOT a claim
    // that text was judged the best mode. That judgement belongs in the dossier.
    const modality: DeliveredModality = interaction
      ? "interactive-model"
      : lessonFile
        ? "plan-text"
        : "none";
    const stage: ConceptStage = interaction ? "modelled" : lessonFile ? "planned" : "genome-only";
    return {
      conceptId: concept.id,
      subject: concept.subject,
      concept: true as const,
      lessonFile,
      teachingSequence,
      researchDossier: (dossier?.status ?? "none") as DossierState,
      modality,
      interaction,
      browserVerified: interaction ? Boolean(evidenceFor(interaction)?.verifiedOn) : false,
      educatorReviewed: dossier?.educatorReview === "reviewed",
      learnerTested: false as const,
      stage,
    };
  });
}

export function coverageSummary() {
  const rows = coverageRows();
  const bySubject = new Map<string, { concepts: number; lessonFiles: number; sequences: number; modelled: number; browserVerified: number }>();
  for (const row of rows) {
    const entry = bySubject.get(row.subject) ?? { concepts: 0, lessonFiles: 0, sequences: 0, modelled: 0, browserVerified: 0 };
    entry.concepts += 1;
    if (row.lessonFile) entry.lessonFiles += 1;
    if (row.teachingSequence) entry.sequences += 1;
    if (row.interaction) entry.modelled += 1;
    if (row.browserVerified) entry.browserVerified += 1;
    bySubject.set(row.subject, entry);
  }
  const modelledRows = rows.filter((r) => r.interaction);
  return {
    concepts: rows.length,
    /** 2. plan objects */
    lessonFiles: rows.filter((r) => r.lessonFile).length,
    /** 3. authored sequences */
    teachingSequences: rows.filter((r) => r.teachingSequence).length,
    /** 5. delivered modality — the three must sum to `concepts` */
    interactiveModels: rows.filter((r) => r.modality === "interactive-model").length,
    planText: rows.filter((r) => r.modality === "plan-text").length,
    noContent: rows.filter((r) => r.modality === "none").length,
    /** 6. interactions */
    modelled: modelledRows.length,
    /** 7. browser passes */
    browserVerified: rows.filter((r) => r.browserVerified).length,
    modelsWithoutBrowserEvidence: modelledRows.filter((r) => !r.browserVerified).map((r) => r.conceptId),
    /** The review-pack lessons: written by hand for the pilot, not supplemental
     *  coverage. Never reported as equal to `lessonFiles`. */
    pilotPlans: pilotPlanIds().length,
    /** 4. research */
    researched: rows.filter((r) => r.researchDossier === "researched").length,
    identified: rows.filter((r) => r.researchDossier === "identified").length,
    /** Modelled but with no research behind it: a defect to report, not to hide. */
    modelledWithoutDossier: rows.filter((r) => r.interaction && r.researchDossier === "none").map((r) => r.conceptId),
    /** 8. and 9. */
    educatorReviewed: CONCEPT_DOSSIERS.filter((d) => d.educatorReview === "reviewed").length,
    learnerTested: 0 as const,
    /** What "repeat for all" still owes, named rather than counted. */
    queue: rows.filter((r) => r.stage !== "modelled").map((r) => r.conceptId),
    bySubject: Object.fromEntries(bySubject),
  };
}
