// ASSESSMENT INTELLIGENCE, NOT A QUESTION-BANK IMPORT.
//
// A school's questions and mark schemes are evidence about assessment DESIGN:
// which command words are used, how many independent points a mark scheme
// rewards, what a partial answer earns, and which misconception a distractor
// is testing. They are not a licence to reproduce the questions.
//
// This module has three jobs:
//   1. describe a provenance-tracked blueprint that can be reviewed;
//   2. refuse a blueprint whose source use or marking is internally inconsistent;
//   3. decide whether a reviewed blueprint may be served at all.
//
// It deliberately does not generate questions. The integration with the real
// marker lives in lib/assessment-serving.ts, which compiles a blueprint item
// into the existing StructuredPart scheme. Keeping the record and the compiler
// apart is what lets a reviewer read the claim without running the engine.
//
// REVIEW IS A RUNG, NOT A FLAG. A blueprint may be `unreviewed` or
// `teacher-reviewed`. The second value is refused unless a named subject
// teacher, a real date, a scope and the reviewed version are recorded, and the
// count of reviews is the count of those records. Nothing in this repository
// fills one in: every blueprint here is `unreviewed` and is therefore never
// served, whatever its marking scheme can do.

import { getConcept } from "./genome";
import type { NumericTolerance, SubjectId } from "./types";

export type AssessmentDemand = "recall" | "understand" | "apply" | "analyse" | "evaluate";
export type AssessmentCommand = "identify" | "describe" | "explain" | "compare" | "calculate" | "suggest" | "evaluate";
/** Public availability is NOT permission. A specification can be read without
 *  its reuse rights being settled, so the two facts are recorded separately. */
export type SourceAvailability = "teacher-provided" | "publicly-available" | "openmind-authored";
export type ClearanceStatus = "unknown" | "cleared";
export type SourceUse = "pattern-extraction-only" | "licensed-reproduction";
export type ReviewStatus = "unreviewed" | "teacher-reviewed";

/** HOW AN ITEM IS ANSWERED, and therefore which marking path it may use.
 *  `numeric` is the existing method/answer marker. `short-answer` is only
 *  allowed for a recall item worth at most two marks, and each point is marked
 *  from authored acceptable forms. `extended-response` is prose: it is never
 *  machine-marked, because scoring words by vocabulary is the failure
 *  lib/peer-review.ts exists to prevent. */
export type AssessmentResponseKind = "numeric" | "short-answer" | "table" | "extended-response";

/** What a criterion is: a shown method, a final answer, or a point of evidence
 *  in prose. Only the first two are machine-markable. */
export type AssessmentCriterionKind = "method" | "answer" | "evidence";

export interface AssessmentSource {
  readonly id: string;
  readonly label: string;
  readonly kind: "teacher-provided-assessment" | "public-specification" | "public-mark-scheme" | "openmind-authored";
  readonly availability: SourceAvailability;
  readonly curriculumContext: string;
  readonly sha256: string;
  /** Independent of availability. A public document is not automatically
   *  licensed for reuse. */
  readonly rights: ClearanceStatus;
  /** A reuse licence, recorded only when a person has checked it. */
  readonly licensing: ClearanceStatus;
  readonly allowedUse: SourceUse;
  readonly reproduction: "none" | "licensed";
  /** The blueprint must not contain a field holding the source's text. */
  readonly containsSourceText: false;
  readonly studentDataObserved: false;
  readonly note: string;
}

/** The four clearances that must all hold before an item is servable. They are
 *  deliberately separate: a teacher's approval says nothing about copyright,
 *  and a public source says nothing about either. */
export interface AssessmentClearance {
  readonly pedagogical: ReviewStatus;
  readonly rights: ClearanceStatus;
  readonly licensing: ClearanceStatus;
  readonly confidentiality: "clear" | "student-data-present";
}

export interface QuestionArchetype {
  readonly id: string;
  readonly command: AssessmentCommand;
  readonly demand: AssessmentDemand;
  readonly markRange: readonly [number, number];
  /** What the learner must show, in our own words. */
  readonly evidence: string;
  /** How this archetype moves a learner beyond the previous one. */
  readonly progression: string;
}

export interface MisconceptionProfile {
  readonly id: string;
  readonly label: string;
  readonly whyWrong: string;
  readonly diagnosticSignal: string;
  readonly feedback: string;
}

export interface MarkingCriterion {
  readonly id: string;
  readonly kind: AssessmentCriterionKind;
  readonly marks: number;
  readonly credit: string;
  readonly acceptable?: readonly string[];
  /** A tempting answer that does NOT earn this point. */
  readonly nonCredit?: string;
  readonly misconceptionId?: string;
  /** For a machine-markable item: the phrases that reveal the misconception.
   *  A short-answer criterion with a misconception must name them. A prose
   *  criterion may use them only for an ADVISORY flag — never for a mark. */
  readonly signals?: readonly string[];
}

/** A machine-checkable numeric key. The answer lives here, not in the credit
 *  sentence, so the marker never has to parse prose to find the truth. */
export interface NumericKey {
  readonly answer: number;
  readonly unit?: string;
  readonly unitRequired?: boolean;
  readonly tolerance?: NumericTolerance;
}

export interface AssessmentTableKey {
  readonly columns: readonly string[];
  readonly rows: readonly {
    readonly label?: string;
    readonly cells: readonly {
      readonly given?: string;
      readonly answer?: number;
      readonly accepted?: readonly string[];
      readonly unit?: string;
      readonly tolerance?: NumericTolerance;
    }[];
  }[];
}

export interface OriginalAssessmentItem {
  readonly id: string;
  readonly archetypeId: string;
  /** The real genome concept this item's evidence belongs to, so the existing
   *  mastery projection and next-step engine receive it. */
  readonly conceptId: string;
  readonly prompt: string;
  readonly marks: number;
  readonly modelAnswer: string;
  readonly responseKind: AssessmentResponseKind;
  readonly numeric?: NumericKey;
  readonly table?: AssessmentTableKey;
  readonly criteria: readonly MarkingCriterion[];
  /** Explicit partial-credit policy, not an implicit "be generous". */
  readonly partialCreditRule: string;
  readonly originality: "newly-authored";
  readonly sourceTextReproduced: 0;
  readonly reviewStatus: ReviewStatus;
}

/** A genuine review record. The role is deliberately narrow: only a subject
 *  teacher can move the rung. A curriculum lead may cite the unit elsewhere. */
export interface AssessmentReviewRecord {
  readonly reviewer: string;
  readonly role: "subject-teacher";
  readonly date: string;
  readonly scope: string;
  readonly verdict: "approved" | "changes-requested";
  readonly blueprintVersion: string;
}

export interface AssessmentBlueprint {
  readonly contract: "openmind.assessment-blueprint/1.0";
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly subject: SubjectId;
  readonly level: string;
  readonly curriculumContext: string;
  readonly sources: readonly AssessmentSource[];
  readonly archetypes: readonly QuestionArchetype[];
  readonly misconceptions: readonly MisconceptionProfile[];
  readonly progression: readonly AssessmentDemand[];
  readonly items: readonly OriginalAssessmentItem[];
  readonly limitations: readonly string[];
  readonly reviews: readonly AssessmentReviewRecord[];
  readonly reviewStatus: ReviewStatus;
  readonly teacherReviewed: boolean;
  readonly learnerTested: boolean;
  readonly humanReviewCount: number;
}

export interface BlueprintSummary {
  readonly sources: number;
  readonly archetypes: number;
  readonly items: number;
  readonly marks: number;
  readonly misconceptions: number;
  readonly constructedItems: number;
  readonly transferItems: number;
  readonly numericItems: number;
  readonly shortAnswerItems: number;
  readonly tableItems: number;
  readonly extendedItems: number;
  readonly reviewedItems: number;
  readonly sourceTextReproduced: number;
  readonly studentDataSources: number;
}

export interface BlueprintValidation {
  readonly ok: boolean;
  readonly issues: readonly string[];
  readonly summary: BlueprintSummary;
}

export interface AssessmentServingDecision {
  readonly ok: boolean;
  readonly reviewStatus: ReviewStatus;
  readonly reasons: readonly string[];
}

const HASH = /^[a-f0-9]{64}$/;
const DEMANDS: readonly AssessmentDemand[] = ["recall", "understand", "apply", "analyse", "evaluate"];
const CRITERION_KINDS: readonly AssessmentCriterionKind[] = ["method", "answer", "evidence"];
const RESPONSE_KINDS: readonly AssessmentResponseKind[] = ["numeric", "short-answer", "table", "extended-response"];
const PLACEHOLDER_REVIEWER = /^(tbd|todo|n\/a|na|unknown|test|fixture|example|placeholder|reviewer|teacher)$/i;

function validReviewDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** The rules about review, kept in one place so the validator and the serving
 *  gate cannot disagree about what a review record is. */
function reviewIssues(bp: AssessmentBlueprint): string[] {
  const issues: string[] = [];
  const reviews = bp.reviews ?? [];
  const approved = reviews.filter((review) => review.role === "subject-teacher" && review.verdict === "approved");

  for (const review of reviews) {
    if (!review.reviewer?.trim() || PLACEHOLDER_REVIEWER.test(review.reviewer.trim())) {
      issues.push(`${review.reviewer || "(empty)"}: a review needs a named reviewer, not a placeholder`);
    }
    if (!validReviewDate(review.date)) issues.push(`${review.reviewer || "(empty)"}: review date ${review.date} is not a real YYYY-MM-DD date`);
    if (review.date > new Date().toISOString().slice(0, 10)) {
      issues.push(`${review.reviewer || "(empty)"}: a review cannot be dated in the future`);
    }
    if (!review.scope?.trim()) issues.push(`${review.reviewer || "(empty)"}: a review must name what was read`);
    if (review.blueprintVersion !== bp.version) {
      issues.push(`${review.reviewer || "(empty)"}: review covers version ${review.blueprintVersion}, blueprint is ${bp.version}`);
    }
  }

  if (bp.reviewStatus === "unreviewed") {
    if (bp.teacherReviewed) issues.push("an unreviewed blueprint cannot claim a teacher review");
    if (approved.length > 0) issues.push("an unreviewed blueprint cannot carry an approved review record");
    if (bp.humanReviewCount !== 0) issues.push("an unreviewed blueprint cannot report human reviews");
  } else if (bp.reviewStatus === "teacher-reviewed") {
    if (!bp.teacherReviewed) issues.push("a teacher-reviewed blueprint must set teacherReviewed");
    if (approved.length === 0) issues.push("a teacher-reviewed blueprint has no approved subject-teacher review record");
    if (bp.humanReviewCount !== approved.length) {
      issues.push(`humanReviewCount is ${bp.humanReviewCount}, but ${approved.length} approved review record(s) exist`);
    }
    const latest = [...reviews].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    if (latest && latest.verdict !== "approved") issues.push("the most recent review did not approve the blueprint");
  } else {
    issues.push(`unknown review status: ${String(bp.reviewStatus)}`);
  }

  if (bp.learnerTested) issues.push("this layer records teacher review only; a learner trial needs its own evidence record");
  return issues;
}

/** Validate the claims a blueprint makes. This is intentionally about the
 *  RECORD, not about whether the biology is right: a subject teacher still has
 *  to read it. */
export function validateAssessmentBlueprint(bp: AssessmentBlueprint): BlueprintValidation {
  const issues: string[] = [];
  const ids = new Set<string>();
  const archetypeIds = new Set<string>();
  const misconceptionIds = new Set<string>();

  if (bp.contract !== "openmind.assessment-blueprint/1.0") issues.push("unknown blueprint contract");
  if (!bp.version?.trim()) issues.push("blueprint has no version: a review is tied to the version it read");
  if (bp.sources.length === 0) issues.push("no sources: a school-derived blueprint must name its provenance");
  issues.push(...reviewIssues(bp));

  for (const source of bp.sources) {
    if (!ids.has(source.id)) ids.add(source.id); else issues.push(`duplicate source id: ${source.id}`);
    if (!HASH.test(source.sha256)) issues.push(`${source.id}: sha256 is not a 64-hex fingerprint`);
    if (source.containsSourceText) issues.push(`${source.id}: source text must not be stored in the blueprint`);
    if (source.studentDataObserved) issues.push(`${source.id}: identifiable learner data is out of scope`);
    if (source.rights !== "cleared" && source.allowedUse !== "pattern-extraction-only") {
      issues.push(`${source.id}: source rights are ${source.rights}; use must be pattern-extraction-only`);
    }
    if (source.licensing !== "cleared" && source.reproduction !== "none") {
      issues.push(`${source.id}: licensing is ${source.licensing}; reproduction must be none`);
    }
    if (source.allowedUse === "pattern-extraction-only" && source.reproduction !== "none") {
      issues.push(`${source.id}: pattern extraction cannot reproduce source material`);
    }
    if (source.availability === "openmind-authored" && (source.rights !== "cleared" || source.licensing !== "cleared")) {
      issues.push(`${source.id}: an OpenMind-authored source must record clear rights and licensing`);
    }
  }

  for (const archetype of bp.archetypes) {
    if (archetypeIds.has(archetype.id)) issues.push(`duplicate archetype id: ${archetype.id}`);
    archetypeIds.add(archetype.id);
    if (archetype.markRange[0] < 1 || archetype.markRange[1] < archetype.markRange[0]) {
      issues.push(`${archetype.id}: invalid mark range`);
    }
    if (!DEMANDS.includes(archetype.demand)) issues.push(`${archetype.id}: unknown demand`);
    if (!archetype.evidence.trim()) issues.push(`${archetype.id}: evidence is empty`);
  }

  for (const belief of bp.misconceptions) {
    if (misconceptionIds.has(belief.id)) issues.push(`duplicate misconception id: ${belief.id}`);
    misconceptionIds.add(belief.id);
    if (!belief.whyWrong.trim() || !belief.feedback.trim()) issues.push(`${belief.id}: incomplete misconception profile`);
  }

  const commandSet = new Set(bp.archetypes.map((a) => a.command));
  for (const command of ["identify", "explain", "calculate"] as const) {
    if (!commandSet.has(command)) issues.push(`no ${command} archetype: the blueprint is too narrow`);
  }
  if (!bp.items.some((item) => item.marks >= 4)) issues.push("no extended item worth 4+ marks");

  for (const item of bp.items) {
    if (ids.has(item.id)) issues.push(`duplicate item id: ${item.id}`);
    ids.add(item.id);
    if (!archetypeIds.has(item.archetypeId)) issues.push(`${item.id}: unknown archetype ${item.archetypeId}`);
    const concept = getConcept(item.conceptId);
    if (!concept) issues.push(`${item.id}: unknown concept ${item.conceptId}`);
    else if (concept.subject !== bp.subject) {
      issues.push(`${item.id}: concept ${item.conceptId} is ${concept.subject}, not ${bp.subject}`);
    }
    if (!item.prompt.trim() || !item.modelAnswer.trim()) issues.push(`${item.id}: prompt or model answer missing`);
    if (item.originality !== "newly-authored") issues.push(`${item.id}: only newly authored items are allowed`);
    if (item.sourceTextReproduced !== 0) issues.push(`${item.id}: source text reproduced is not zero`);
    if (!RESPONSE_KINDS.includes(item.responseKind)) issues.push(`${item.id}: unknown response kind ${item.responseKind}`);
    if (bp.reviewStatus === "unreviewed" && item.reviewStatus !== "unreviewed") {
      issues.push(`${item.id}: prototype item may not claim review`);
    }
    if (bp.reviewStatus === "teacher-reviewed" && item.reviewStatus !== "teacher-reviewed") {
      issues.push(`${item.id}: a reviewed blueprint must review every item`);
    }
    if (item.criteria.length < 2) issues.push(`${item.id}: fewer than two independent marking points`);
    const criterionMarks = item.criteria.reduce((sum, criterion) => sum + criterion.marks, 0);
    if (criterionMarks !== item.marks) {
      issues.push(`${item.id}: ${item.criteria.length} criteria total ${criterionMarks}, item declares ${item.marks}`);
    }
    if (!item.partialCreditRule.trim()) issues.push(`${item.id}: no partial-credit rule`);
    const itemCriteriaIds = new Set<string>();
    for (const criterion of item.criteria) {
      if (itemCriteriaIds.has(criterion.id)) issues.push(`${item.id}: duplicate criterion ${criterion.id}`);
      itemCriteriaIds.add(criterion.id);
      if (!CRITERION_KINDS.includes(criterion.kind)) issues.push(`${item.id}/${criterion.id}: unknown criterion kind`);
      if (criterion.marks < 1) issues.push(`${item.id}/${criterion.id}: a criterion cannot be worth less than one mark`);
      if (!criterion.credit.trim()) issues.push(`${item.id}/${criterion.id}: credit statement is empty`);
      if (criterion.misconceptionId && !misconceptionIds.has(criterion.misconceptionId)) {
        issues.push(`${item.id}/${criterion.id}: unknown misconception ${criterion.misconceptionId}`);
      }
    }

    // HOW THE ITEM IS MARKED, and what it is therefore allowed to claim.
    const archetype = bp.archetypes.find((a) => a.id === item.archetypeId);
    if (item.responseKind === "numeric") {
      if (!item.numeric || !Number.isFinite(item.numeric.answer)) {
        issues.push(`${item.id}: a numeric item has no finite numeric key`);
      }
      if (item.marks !== 2) issues.push(`${item.id}: a numeric item is one method mark and one answer mark, so 2 marks`);
      const answerCriteria = item.criteria.filter((criterion) => criterion.kind === "answer");
      const methodCriteria = item.criteria.filter((criterion) => criterion.kind === "method");
      if (answerCriteria.length !== 1) issues.push(`${item.id}: a numeric item needs exactly one answer criterion`);
      if (answerCriteria.some((criterion) => criterion.marks !== 1)) {
        issues.push(`${item.id}: the answer criterion is worth one mark`);
      }
      if (methodCriteria.length > 1) issues.push(`${item.id}: a numeric item has at most one method criterion`);
      if (methodCriteria.some((criterion) => criterion.marks !== 1)) {
        issues.push(`${item.id}: the method criterion is worth one mark`);
      }
      if (item.criteria.some((criterion) => criterion.kind === "evidence")) {
        issues.push(`${item.id}: a numeric item cannot carry prose evidence criteria`);
      }
      if (item.numeric?.unitRequired && !item.numeric.unit) issues.push(`${item.id}: a required unit has no unit`);
      if (methodCriteria.length === 1 && !methodCriteria[0].acceptable?.length) {
        issues.push(`${item.id}: the method criterion accepts no working form`);
      }
    } else if (item.responseKind === "short-answer") {
      if (item.marks > 2) issues.push(`${item.id}: short-answer marking is capped at two recall marks`);
      if (archetype?.demand !== "recall") issues.push(`${item.id}: short-answer marking is only allowed for recall items`);
      if (item.criteria.some((criterion) => criterion.kind !== "evidence")) {
        issues.push(`${item.id}: a short-answer item marks evidence only`);
      }
      if (item.criteria.some((criterion) => !criterion.acceptable?.length)) {
        issues.push(`${item.id}: every short-answer criterion needs authored acceptable forms`);
      }
      for (const criterion of item.criteria) {
        if (criterion.misconceptionId && !criterion.signals?.length) {
          issues.push(`${item.id}/${criterion.id}: a short-answer misconception needs the phrase that reveals it`);
        }
      }
    } else if (item.responseKind === "table") {
      if (!item.table) issues.push(`${item.id}: a table item has no table key`);
      else {
        const blanks = item.table.rows.reduce((n, row) => n + row.cells.filter((cell) => cell.answer !== undefined).length, 0);
        if (blanks < 1) issues.push(`${item.id}: a table item has no blank cell`);
        if (blanks !== item.marks) issues.push(`${item.id}: ${blanks} blank cells but ${item.marks} marks`);
        if (item.criteria.length !== blanks) issues.push(`${item.id}: one criterion per blank cell, found ${item.criteria.length} for ${blanks} cells`);
        if (item.criteria.some((criterion) => criterion.kind !== "answer")) {
          issues.push(`${item.id}: a table item marks answer cells only`);
        }
        if (item.criteria.some((criterion) => criterion.marks !== 1)) {
          issues.push(`${item.id}: each table cell is worth one mark`);
        }
        for (const row of item.table.rows) {
          if (row.cells.length !== item.table.columns.length) issues.push(`${item.id}: a table row does not match its columns`);
          for (const cell of row.cells) {
            if ((cell.given === undefined) === (cell.answer === undefined)) {
              issues.push(`${item.id}: each table cell is either given or answered`);
            }
            if (cell.answer !== undefined && !Number.isFinite(cell.answer)) {
              issues.push(`${item.id}: a table answer is not finite`);
            }
          }
        }
      }
      if (item.numeric) issues.push(`${item.id}: a table item cannot carry a separate numeric key`);
    } else if (item.responseKind === "extended-response") {
      if (item.marks < 3) issues.push(`${item.id}: prose is only extended-response at 3+ marks; shorter prose needs human review`);
      if (item.criteria.some((criterion) => criterion.kind !== "evidence")) {
        issues.push(`${item.id}: an extended response marks evidence only`);
      }
      if (item.numeric) issues.push(`${item.id}: an extended response cannot carry a numeric key`);
    }
  }

  for (const misconception of bp.misconceptions) {
    if (!bp.items.some((item) => item.criteria.some((criterion) => criterion.misconceptionId === misconception.id))) {
      issues.push(`${misconception.id}: named but no item diagnoses it`);
    }
  }

  const constructedItems = bp.items.filter((item) => item.marks >= 3).length;
  const transferItems = bp.items.filter((item) => /patient|unfamiliar|new context|removed|packet|data centre/i.test(item.prompt)).length;
  const summary: BlueprintSummary = {
    sources: bp.sources.length,
    archetypes: bp.archetypes.length,
    items: bp.items.length,
    marks: bp.items.reduce((sum, item) => sum + item.marks, 0),
    misconceptions: bp.misconceptions.length,
    constructedItems,
    transferItems,
    numericItems: bp.items.filter((item) => item.responseKind === "numeric").length,
    shortAnswerItems: bp.items.filter((item) => item.responseKind === "short-answer").length,
    tableItems: bp.items.filter((item) => item.responseKind === "table").length,
    extendedItems: bp.items.filter((item) => item.responseKind === "extended-response").length,
    reviewedItems: bp.items.filter((item) => item.reviewStatus === "teacher-reviewed").length,
    sourceTextReproduced: bp.items.reduce((sum, item) => sum + item.sourceTextReproduced, 0),
    studentDataSources: bp.sources.filter((source) => source.studentDataObserved).length,
  };

  return { ok: issues.length === 0, issues, summary };
}

/** May this blueprint be served as an assessment at all? A blueprint that has
 *  not been reviewed by a subject teacher is never served, however complete its
 *  marking scheme is. The gate is separate from the validator because a
 *  blueprint being internally consistent is not the same claim as a human
 *  having approved what it teaches. */
export function assessmentClearance(bp: AssessmentBlueprint): AssessmentClearance {
  return {
    pedagogical: bp.reviewStatus,
    rights: bp.sources.every((source) => source.rights === "cleared") ? "cleared" : "unknown",
    licensing: bp.sources.every((source) => source.licensing === "cleared") ? "cleared" : "unknown",
    confidentiality: bp.sources.some((source) => source.studentDataObserved)
      ? "student-data-present"
      : "clear",
  };
}

export function assessmentServingDecision(
  bp: AssessmentBlueprint,
  today = new Date(),
): AssessmentServingDecision {
  const reasons: string[] = [];
  const validation = validateAssessmentBlueprint(bp);
  if (!validation.ok) reasons.push(...validation.issues);
  const clearance = assessmentClearance(bp);
  if (bp.reviewStatus !== "teacher-reviewed") {
    reasons.push(`review status is ${bp.reviewStatus}: an unreviewed blueprint is never served as an assessment`);
  }
  if (clearance.rights !== "cleared") {
    reasons.push("source rights are unknown: availability is not permission to reuse");
  }
  if (clearance.licensing !== "cleared") {
    reasons.push("licensing is unknown: no reuse licence is recorded");
  }
  if (clearance.confidentiality !== "clear") {
    reasons.push("confidentiality is not clear: student data is present in a source");
  }
  const approved = (bp.reviews ?? []).filter(
    (review) => review.role === "subject-teacher" && review.verdict === "approved" && validReviewDate(review.date),
  );
  if (bp.reviewStatus === "teacher-reviewed" && approved.length === 0) {
    reasons.push("no approved subject-teacher review record");
  }
  const latest = [...(bp.reviews ?? [])].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (latest && latest.verdict !== "approved") reasons.push("the most recent review requested changes");
  if (approved.some((review) => review.date > today.toISOString().slice(0, 10))) {
    reasons.push("a review is dated in the future");
  }
  return { ok: reasons.length === 0, reviewStatus: bp.reviewStatus, reasons: [...new Set(reasons)] };
}
