// ─────────────────────────────────────────────────────────────────────────────
// EDUCATOR REVIEW 1.0 — THE SHAPE OF A HUMAN DECISION.
//
// This module is deliberately free of `node:fs`, `node:crypto` and React so a
// browser form can import the criteria without bundling a server module. The
// cryptographic and record-validation half lives in `lib/validation/review.ts`.
//
// THE CENTRAL DISTINCTION is between a REVIEW and an APPROVAL:
//
//   a review       names a person, the exact lesson version and content hash,
//                  what they checked, what they found, and what should happen;
//   an approval    is a review whose decision is `approved`, whose six checks
//                  are all true, and whose findings contain nothing that blocks
//                  publication.
//
// A finding never disappears because a task was marked done. A changed lesson
// gets a new version and a new hash; the old approval remains in the ledger as
// history and stops applying. There is no mutable "approved" boolean.
// ─────────────────────────────────────────────────────────────────────────────

export const REVIEW_CRITERIA = [
  {
    id: "subject-accuracy",
    label: "Subject accuracy",
    help: "The mathematics, science or computing is correct for this level, including notation and units.",
  },
  {
    id: "curriculum-accuracy",
    label: "Curriculum accuracy",
    help: "The objective, level and depth match the curriculum reference printed on the lesson.",
  },
  {
    id: "teaching-quality",
    label: "Teaching quality",
    help: "The explanation makes the idea intelligible, not just the procedure; the sequence teaches before it tests.",
  },
  {
    id: "worked-example-quality",
    label: "Worked-example quality",
    help: "Every move has a reason, the answer follows from the working, and the examples are not the same item repeated.",
  },
  {
    id: "assessment-validity",
    label: "Assessment validity",
    help: "The questions test what was taught, the marking is usable, and a wrong answer can be diagnosed.",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    help: "The alternatives, labels, figures and language are usable by the learners the lesson claims to serve.",
  },
] as const;

export type ReviewCriterionId = (typeof REVIEW_CRITERIA)[number]["id"];

export const REVIEW_ROLES = ["subject-teacher", "curriculum-lead", "accessibility-reviewer"] as const;
export type ReviewRole = (typeof REVIEW_ROLES)[number];

export type ReviewDecision = "approved" | "changes-requested";
export type FindingSeverity = "blocking" | "major" | "minor";

export interface ReviewFinding {
  /** Stable inside the review. The improvement task derives its own id from it. */
  readonly id: string;
  /** A section, block, example or assessment item the reviewer actually saw. */
  readonly location: string;
  readonly problem: string;
  readonly educationalConsequence: string;
  readonly recommendation: string;
  readonly severity: FindingSeverity;
  /** True means no publication decision may be approved while this is open. */
  readonly blockPublication: boolean;
}

/** What a teacher submits. The reviewer's name and account are NOT here: the
 *  route takes them from the signed-in teaching account, never from the body. */
export interface EducatorReviewSubmission {
  readonly lessonId: string;
  readonly lessonVersion: string;
  readonly contentHash: string;
  readonly reviewRole: ReviewRole;
  readonly qualifications: string;
  readonly scope: string;
  readonly criteria: Readonly<Record<ReviewCriterionId, boolean>>;
  readonly decision: ReviewDecision;
  readonly findings: readonly ReviewFinding[];
  readonly notes: string;
}

/** A persisted, append-only human record. */
export interface EducatorReviewRecord extends Omit<EducatorReviewSubmission, "reviewRole" | "qualifications" | "scope"> {
  readonly id: string;
  readonly subject: string;
  readonly curriculum: {
    readonly reference: string;
    readonly level: string;
  };
  readonly reviewer: {
    readonly accountId: string;
    readonly name: string;
    readonly accountRole: "teacher" | "org";
    readonly reviewRole: ReviewRole;
    readonly qualifications: string;
    readonly scope: string;
  };
  /** Server date, ISO `YYYY-MM-DD`. */
  readonly reviewedAt: string;
  readonly createdAt: number;
  /** These two fields are checks, not free text: a record missing either is not
   *  a human approval, whatever its decision says. */
  readonly source: "human";
  readonly authority: "teacher-account";
}

export type ImprovementStatus = "open" | "in-progress" | "done";

export interface ImprovementResolution {
  readonly by: string;
  readonly at: string;
  readonly note: string;
}

/** Derived from a finding, one task per finding. A task records the version and
 *  hash it came from so a later queue cannot pretend an old task covers a new
 *  lesson. `done` means the correction was made; it does NOT mean the review
 *  approved the corrected version. */
export interface ImprovementTask {
  readonly id: string;
  readonly reviewId: string;
  readonly lessonId: string;
  readonly lessonVersion: string;
  readonly contentHash: string;
  readonly findingId: string;
  readonly location: string;
  readonly problem: string;
  readonly educationalConsequence: string;
  readonly recommendation: string;
  readonly severity: FindingSeverity;
  readonly blocking: boolean;
  readonly status: ImprovementStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly resolution?: ImprovementResolution;
}

export interface LessonValidationLedger {
  readonly version: 1;
  readonly reviews: readonly EducatorReviewRecord[];
  readonly tasks: readonly ImprovementTask[];
}
