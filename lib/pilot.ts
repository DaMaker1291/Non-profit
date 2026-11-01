// ─────────────────────────────────────────────────────────────────────────────
// THE PILOT — what is actually allowed in front of a learner, and what is not.
//
// The deployment audit found the product's most dangerous educational defect:
// 120 of 135 concepts rendered a 31–58 word genome summary in the same visual
// position as a complete lesson. Nothing on the page said "this is not a
// lesson", so a learner — and a visiting teacher — could reasonably read it as
// one. This module is the single answer to that question.
//
// FOUR STATES, and they are deliberately not a percentage:
//
//   draft                 — a plan exists but is not complete enough to review.
//   needs-educator-review — a complete authored plan, with no qualified reviewer.
//   approved-for-pilot    — a real reviewer signed THIS lesson version for THIS
//                           scope (curriculum, level and language).
//   unavailable-for-pilot — no complete plan. The genome paragraph is background
//                           material, never teaching.
//
// APPROVAL IS NOT A PROPERTY OF "THE LESSON" IN GENERAL. A lesson approved for
// CBSE Class 10 English is not thereby approved for ICSE, for Class 9, or for
// Hindi. The approval record carries the scope and the version, and a mismatch
// refuses it. `PILOT_APPROVALS` is empty on purpose: a coding agent cannot
// substitute for a subject teacher, and this file must never invent a name or a
// date to make a dashboard green.
// ─────────────────────────────────────────────────────────────────────────────
import { CONCEPTS_BY_ID } from "./genome";
import { LESSON_PLANS, planWordCount, type LessonPlan } from "./lesson-plans";

export type ContentState =
  | "draft"
  | "needs-educator-review"
  | "approved-for-pilot"
  | "unavailable-for-pilot";

/** The one scope this build proposes. It is a CANDIDATE, not a partnership. */
export interface PilotScope {
  readonly id: string;
  readonly title: string;
  readonly country: string;
  readonly board: string;
  readonly specId: string;
  readonly levelId: string;
  readonly curriculumEdition: string;
  readonly language: string;
  readonly subjects: readonly ("maths" | "physics" | "chemistry" | "biology" | "computing")[];
  /** What this scope deliberately excludes. Printed on the teacher surface. */
  readonly excludes: readonly string[];
  readonly status: "candidate" | "approved";
}

export const CBSE_X_PILOT: PilotScope = {
  id: "cbse-10-maths-science-en",
  title: "CBSE Class 10 (with the Class 9 cell prerequisite) — Mathematics and Science (English medium)",
  country: "IN",
  board: "CBSE",
  specId: "in-cbse",
  levelId: "class10",
  curriculumEdition: "CBSE Curriculum 2025–26",
  language: "en",
  subjects: ["maths", "physics", "chemistry", "biology"],
  excludes: [
    "ICSE, state boards and every other country",
    "Hindi, Bengali, Urdu and every other medium of instruction",
    "the 116 concepts with no complete authored lesson",
    "any claim of full CBSE syllabus coverage",
    "any school, teacher or learner partnership",
  ],
  status: "candidate",
};

/** The 12 lessons this candidate pack proposes. EIGHT mathematics concepts are
 *  already in the reviewed CBSE Class X mapping (`lib/curricula/mappings.ts`)
 *  and already have plans. FOUR science concepts are authored for this pack and
 *  mapped to named CBSE Class X units in `lib/pilot-mappings.ts`.
 *
 *  The order is a teaching order, not an alphabetical one: number sense →
 *  algebra → graphs, with science concepts placed where their prerequisites
 *  are already met. */
export const PILOT_SEQUENCE: readonly string[] = [
  // Mathematics — number foundations then algebra and graphs.
  "fractions",
  "decimals",
  "negatives",
  "order-ops",
  "algebra-expand",
  "linear-equations",
  "quadratics",
  "coordinates",
  // Science — each mapped to a named CBSE Class X unit.
  "cells",
  "photosynthesis",
  "equations-stoich",
  "electricity-circuits",
];

export const PILOT_CONCEPT_IDS: readonly string[] = PILOT_SEQUENCE;

/** THE TEACHING LANGUAGES THIS PILOT ACTUALLY SUPPORTS. One. The interface has
 *  fifteen languages; a translated menu is not a translated lesson. A language
 *  request outside this list is refused by `lessonStatus` and shown as an
 *  English-medium limitation, never silently filled with English prose. */
export const PILOT_SUPPORTED_LANGUAGES: readonly string[] = ["en"];

export function pilotLanguageSupported(lang: string): boolean {
  return PILOT_SUPPORTED_LANGUAGES.includes(lang);
}

export interface PilotApproval {
  readonly conceptId: string;
  readonly scopeId: string;
  /** The lesson version the reviewer actually read. A later content edit must
   *  invalidate the approval; the check compares this string. */
  readonly lessonVersion: string;
  readonly reviewer: string;
  readonly reviewerRole: string;
  /** ISO date, supplied by the reviewer. Never generated. */
  readonly reviewedAt: string;
  readonly notes?: string;
  readonly checklist: {
    readonly subjectAccuracy: boolean;
    readonly explanationQuality: boolean;
    readonly workedExamples: boolean;
    readonly questionsAndMarking: boolean;
    readonly diagramQuality: boolean;
    readonly languageAndTerminology: boolean;
    readonly ageAppropriateness: boolean;
    readonly accessibility: boolean;
  };
}

/** NO APPROVALS EXIST. This is the truthful state until a qualified teacher
 *  reviews a lesson and supplies their own name, role and date. */
export const PILOT_APPROVALS: readonly PilotApproval[] = [];

/** A content version. Bump this whenever any pilot lesson changes; an approval
 *  for an older version no longer applies. */
export const PILOT_LESSON_VERSION = "2026-11-01.3";

export interface LessonGap {
  readonly field: string;
  readonly problem: string;
}

/** What a complete plan must carry before anybody can review it. This is a
 *  STRUCTURAL check, not a subject review: it can say a plan has four idea
 *  paragraphs and a trap explanation, and it cannot say the physics is right. */
export function planGaps(plan: LessonPlan | null): LessonGap[] {
  if (!plan) return [{ field: "plan", problem: "no authored plan" }];
  const gaps: LessonGap[] = [];
  const need = (field: string, value: string, min: number) => {
    if (value.trim().length < min) gaps.push({ field, problem: `shorter than ${min} characters` });
  };
  need("objective", plan.objective, 20);
  need("intuition", plan.intuition, 80);
  if (plan.idea.length < 4) gaps.push({ field: "idea", problem: "fewer than four idea paragraphs" });
  plan.idea.forEach((p, i) => need(`idea[${i}]`, p, 40));
  if (plan.traps.length < 3) gaps.push({ field: "traps", problem: "fewer than three named traps" });
  plan.traps.forEach((tr, i) => {
    need(`traps[${i}].move`, tr.move, 8);
    need(`traps[${i}].why`, tr.why, 30);
  });
  need("usedFor", plan.usedFor, 20);
  if (plan.figure) need("figure.caption", plan.figure.caption, 30);
  for (const [i, ex] of (plan.workedExamples ?? []).entries()) {
    need(`workedExamples[${i}].prompt`, ex.prompt, 8);
    if (ex.steps.length < 2) gaps.push({ field: `workedExamples[${i}].steps`, problem: "fewer than two steps" });
    ex.steps.forEach((s, j) => need(`workedExamples[${i}].steps[${j}]`, s, 8));
    need(`workedExamples[${i}].answer`, ex.answer, 2);
  }
  for (const [i, term] of (plan.terms ?? []).entries()) {
    need(`terms[${i}].term`, term.term, 2);
    need(`terms[${i}].meaning`, term.meaning, 15);
  }
  return gaps;
}

export interface PilotLessonStatus {
  readonly conceptId: string;
  readonly state: ContentState;
  readonly inScope: boolean;
  readonly plan: LessonPlan | null;
  /** Why the state is what it is, in words a teacher can act on. */
  readonly reasons: readonly string[];
  readonly gaps: readonly LessonGap[];
  readonly version: string;
}

function approvalFor(
  conceptId: string,
  scopeId: string,
  approvals: readonly PilotApproval[] = PILOT_APPROVALS,
): PilotApproval | null {
  return approvals.find(
    (a) => a.conceptId === conceptId && a.scopeId === scopeId && a.lessonVersion === PILOT_LESSON_VERSION,
  ) ?? null;
}

/** Is every checklist item true, and does the record name a real reviewer and
 *  date? Exported so the gate can plant a fake approval and watch it fail. */
export function approvalProblems(a: PilotApproval, plan: LessonPlan | null): string[] {
  const problems: string[] = [];
  if (!a.reviewer || a.reviewer.trim().length < 2) problems.push("reviewer name missing");
  if (!a.reviewerRole || a.reviewerRole.trim().length < 2) problems.push("reviewer role missing");
  if (!a.reviewedAt || !Number.isFinite(Date.parse(a.reviewedAt))) problems.push("review date is not a date");
  if (a.scopeId !== CBSE_X_PILOT.id) problems.push("approval is for a different scope");
  if (a.lessonVersion !== PILOT_LESSON_VERSION) problems.push("approval is for a different lesson version");
  if (!plan) problems.push("no plan to approve");
  const unchecked = Object.entries(a.checklist).filter(([, v]) => v !== true).map(([k]) => k);
  if (unchecked.length) problems.push(`checklist incomplete: ${unchecked.join(", ")}`);
  return problems;
}

/** The state of one concept IN THIS PILOT. `lang` is the requested teaching
 *  language, not the interface language: an English plan read under an Urdu
 *  interface is not an Urdu lesson. */
export function lessonStatus(
  conceptId: string,
  lang = "en",
  scope: PilotScope = CBSE_X_PILOT,
  /** Injected ONLY by the gate, so the approved branch can be driven with a
   *  synthetic record. The product always uses the empty real registry above. */
  approvals: readonly PilotApproval[] = PILOT_APPROVALS,
): PilotLessonStatus {
  const plan = LESSON_PLANS[conceptId] ?? null;
  const inScope = PILOT_SEQUENCE.includes(conceptId);
  const gaps = planGaps(plan);
  const reasons: string[] = [];
  let state: ContentState;

  if (!plan) {
    state = "unavailable-for-pilot";
    reasons.push("No complete authored lesson exists. The genome summary is background material, not teaching.");
  } else if (gaps.length > 0) {
    state = "draft";
    reasons.push("The authored plan is structurally incomplete.");
  } else if (!pilotLanguageSupported(lang) || lang !== scope.language) {
    // A complete English lesson is not a complete Urdu lesson. The page still
    // states this, and the pilot path refuses it.
    state = "needs-educator-review";
    reasons.push(`This lesson is authored in English; the ${lang} medium has no complete, reviewed lesson.`);
  } else if (!inScope) {
    state = "needs-educator-review";
    reasons.push("A complete authored lesson, but outside the 12-lesson CBSE pilot scope.");
  } else {
    const approval = approvalFor(conceptId, scope.id, approvals);
    if (!approval) {
      state = "needs-educator-review";
      reasons.push("No qualified subject teacher has signed this lesson for this scope.");
    } else {
      const problems = approvalProblems(approval, plan);
      if (problems.length) {
        state = "needs-educator-review";
        reasons.push(...problems);
      } else {
        state = "approved-for-pilot";
        reasons.push(`Approved by ${approval.reviewer} (${approval.reviewerRole}) on ${approval.reviewedAt}.`);
      }
    }
  }

  return { conceptId, state, inScope, plan, reasons, gaps, version: PILOT_LESSON_VERSION };
}

/** ONLY approved lessons may enter the learner-facing pilot path. Today this is
 *  empty, and that is the honest answer, not a bug to work around. */
export function approvedPilotPath(
  scope: PilotScope = CBSE_X_PILOT,
  approvals: readonly PilotApproval[] = PILOT_APPROVALS,
): string[] {
  return PILOT_SEQUENCE.filter(
    (id) => lessonStatus(id, scope.language, scope, approvals).state === "approved-for-pilot",
  );
}

/** The review queue: complete authored candidates that are not approved. */
export function reviewQueue(scope: PilotScope = CBSE_X_PILOT): PilotLessonStatus[] {
  return PILOT_SEQUENCE.map((id) => lessonStatus(id, scope.language, scope))
    .filter((s) => s.inScope && s.state === "needs-educator-review");
}

export function pilotCoverage(scope: PilotScope = CBSE_X_PILOT): {
  total: number;
  approved: number;
  needsReview: number;
  draft: number;
  unavailable: number;
} {
  const rows = PILOT_SEQUENCE.map((id) => lessonStatus(id, scope.language, scope));
  return {
    total: rows.length,
    approved: rows.filter((r) => r.state === "approved-for-pilot").length,
    needsReview: rows.filter((r) => r.state === "needs-educator-review").length,
    draft: rows.filter((r) => r.state === "draft").length,
    unavailable: rows.filter((r) => r.state === "unavailable-for-pilot").length,
  };
}

/** Concept metadata for the teacher surface. Null for a concept that is not in
 *  the pack, so a typo cannot silently produce an empty preview. */
export function pilotConcept(conceptId: string) {
  if (!PILOT_SEQUENCE.includes(conceptId)) return null;
  return CONCEPTS_BY_ID[conceptId] ?? null;
}

export function isPilotConcept(conceptId: string): boolean {
  return PILOT_SEQUENCE.includes(conceptId);
}

/** The word count of a plan, re-exported so the gate and the teacher packet
 *  read the product's own measure rather than a second one. */
export function pilotWordCount(plan: LessonPlan): number {
  return planWordCount(plan);
}
