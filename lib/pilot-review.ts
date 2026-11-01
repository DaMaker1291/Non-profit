// ─────────────────────────────────────────────────────────────────────────────
// THE EDUCATOR REVIEW RECORD — a real person's evidence, not a generated flag.
//
// The product's approval registry is deliberately a code constant. This module
// defines the record a teacher fills in, and validates it before anybody copies
// an approval into that registry. It cannot write the registry, cannot invent a
// reviewer and cannot turn "pending" into "approved".
// ─────────────────────────────────────────────────────────────────────────────
import { approvalProblems, type PilotApproval } from "./pilot";
import type { LessonPlan } from "./lesson-plans";

export type ReviewDecision = "pending" | "approve" | "revise" | "reject";

export interface ReviewRecord extends PilotApproval {
  readonly decision: ReviewDecision;
  /** Confirmed against the official CBSE file, not merely read on the page. */
  readonly curriculumMappingConfirmed: boolean;
  /** Confirmed that the lesson is in the language actually reviewed. */
  readonly languageConfirmed: boolean;
  /** Empty only when the decision is `approve`. */
  readonly requiredRevisions: readonly string[];
  readonly notes: string;
}

const DECISIONS: ReviewDecision[] = ["pending", "approve", "revise", "reject"];

/** Why this record is not yet usable, in words the reviewer can act on. */
export function reviewProblems(r: ReviewRecord, plan: LessonPlan | null, version: string): string[] {
  const problems: string[] = [];
  if (!DECISIONS.includes(r.decision)) problems.push("decision must be pending, approve, revise or reject");
  if (!r.reviewer || r.reviewer.trim().length < 2) problems.push("reviewer name missing");
  if (!r.reviewerRole || r.reviewerRole.trim().length < 2) problems.push("reviewer role missing");
  if (/^(ai|codebuff|openmind|system)\b/i.test(r.reviewer ?? "")) {
    problems.push("the reviewer must be a person, not a tool or the product");
  }
  if (!r.reviewedAt || !Number.isFinite(Date.parse(r.reviewedAt))) {
    problems.push("review date is not a date");
  } else if (Date.parse(r.reviewedAt) > Date.now() + 24 * 60 * 60 * 1000) {
    problems.push("review date is in the future");
  }
  if (!r.notes || r.notes.trim().length < 20) problems.push("review notes are missing or too short");
  // The RECORD'S version and the current lesson version are compared here,
  // independently of `approvalProblems` (which checks the product's constant).
  // Without this, an old review was filtered out as if it were current.
  if (r.lessonVersion !== version) problems.push("review is for a different lesson version");
  if (r.decision === "approve") {
    if (!r.curriculumMappingConfirmed) problems.push("curriculum mapping not confirmed against the official source");
    if (!r.languageConfirmed) problems.push("reviewed language not confirmed");
    if (r.requiredRevisions.length > 0) problems.push("an approval cannot carry required revisions");
    problems.push(...approvalProblems(r, plan).filter((p) => p !== "approval is for a different lesson version"));
  }
  if ((r.decision === "revise" || r.decision === "reject") && r.requiredRevisions.length === 0) {
    problems.push("a revise/reject decision must name at least one required revision or reason");
  }
  return problems;
}

/** The exact approval a reviewer's `approve` record would justify. The CLI
 *  prints this; it deliberately does not write it into the product. */
export function approvalFromReview(r: ReviewRecord): PilotApproval {
  return {
    conceptId: r.conceptId,
    scopeId: r.scopeId,
    lessonVersion: r.lessonVersion,
    reviewer: r.reviewer,
    reviewerRole: r.reviewerRole,
    reviewedAt: r.reviewedAt,
    notes: r.notes,
    checklist: r.checklist,
  };
}
