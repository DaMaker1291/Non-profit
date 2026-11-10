// ─────────────────────────────────────────────────────────────────────────────
// THE AUTHORED-LESSON REVIEW CONTRACT.
//
// The lesson status gate in `lib/lesson-verify.ts` already refuses a review that
// names another version. This module adds the missing half: a durable record of
// what a human checked, what they found, and what task follows, bound to a
// SHA-256 hash of the teaching content rather than to a mutable status field.
//
// The hash deliberately excludes `reviews`, `learnerTesting` and
// `declaredStatus`. Those are evidence ABOUT a lesson, not teaching content; if
// they were in the hash, adding the review would invalidate the review that had
// just been written. Everything a learner reads — objectives, prose, examples,
// misconceptions, assessment prompts, marking criteria, figures, translations —
// is included. Editing any of it changes the hash and makes every earlier
// approval stale, even if somebody forgets to bump the version.
//
// PURE except for SHA-256. The route, the catalogue and the command-line checks
// all call these functions.
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import type { AuthoredLesson, ReviewRecord as LessonReviewRecord } from "../lesson-contract";
import {
  REVIEW_CRITERIA,
  REVIEW_ROLES,
  type EducatorReviewRecord,
  type EducatorReviewSubmission,
  type ImprovementTask,
  type LessonValidationLedger,
  type ReviewCriterionId,
  type ReviewDecision,
  type ReviewFinding,
  type ReviewRole,
} from "./types";

export interface ReviewProblem {
  readonly code: string;
  readonly message: string;
}

const CRITERION_IDS = new Set<string>(REVIEW_CRITERIA.map((c) => c.id));
const REVIEW_ROLE_IDS = new Set<string>(REVIEW_ROLES);
const SEVERITIES = new Set(["blocking", "major", "minor"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Deterministic JSON: object key order is not part of a lesson's identity. */
export function canonical(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "\"__undefined__\"";
  if (typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(object[key])}`)
    .join(",")}}`;
}

/** The exact teaching content a reviewer read. */
export function lessonContentHash(lesson: AuthoredLesson): string {
  const content: Record<string, unknown> = { ...lesson };
  delete content.reviews;
  delete content.learnerTesting;
  delete content.declaredStatus;
  return createHash("sha256").update(canonical(content)).digest("hex");
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function findingProblems(finding: unknown, index: number): ReviewProblem[] {
  const out: ReviewProblem[] = [];
  const label = `finding ${index + 1}`;
  if (!isObject(finding)) return [{ code: "finding_shape", message: `${label} must be an object` }];
  if (text(finding.id).length === 0) out.push({ code: "finding_id", message: `${label} needs an id` });
  for (const [field, min] of [
    ["location", 2],
    ["problem", 8],
    ["educationalConsequence", 10],
    ["recommendation", 8],
  ] as const) {
    if (text(finding[field]).length < min) {
      out.push({ code: "finding_field", message: `${label}: ${field} needs at least ${min} characters` });
    }
  }
  if (typeof finding.severity !== "string" || !SEVERITIES.has(finding.severity)) {
    out.push({ code: "finding_severity", message: `${label}: choose blocking, major or minor` });
  }
  if (typeof finding.blockPublication !== "boolean") {
    out.push({ code: "finding_block", message: `${label}: say whether this blocks publication` });
  }
  if (finding.severity === "blocking" && finding.blockPublication !== true) {
    out.push({ code: "finding_blocking_flag", message: `${label}: a blocking finding must block publication` });
  }
  return out;
}

function criteriaProblems(value: unknown, decision: ReviewDecision | null): ReviewProblem[] {
  const out: ReviewProblem[] = [];
  if (!isObject(value)) return [{ code: "criteria_shape", message: "the six review checks are required" }];
  for (const id of CRITERION_IDS) {
    if (typeof value[id] !== "boolean") {
      out.push({ code: "criterion_missing", message: `the ${id} check is missing` });
    }
  }
  for (const key of Object.keys(value)) {
    if (!CRITERION_IDS.has(key)) out.push({ code: "criterion_unknown", message: `unknown review check: ${key}` });
  }
  if (decision === "approved") {
    for (const criterion of REVIEW_CRITERIA) {
      if (value[criterion.id] !== true) {
        out.push({ code: "approval_requires_all", message: `approval requires the ${criterion.label} check` });
      }
    }
  }
  return out;
}

/** Validate a submission against the CURRENT lesson and hash. The route supplies
 *  the expected values; a client can never make an old version current. */
export function reviewInputProblems(
  input: unknown,
  lesson: AuthoredLesson,
  currentHash = lessonContentHash(lesson),
): ReviewProblem[] {
  if (!isObject(input)) return [{ code: "review_shape", message: "a review must be an object" }];
  const out: ReviewProblem[] = [];
  const body = input as unknown as Partial<EducatorReviewSubmission> & Record<string, unknown>;

  if (text(body.lessonId) !== lesson.conceptId) {
    out.push({ code: "lesson_mismatch", message: "the review names a different lesson" });
  }
  const submittedVersion = text(body.lessonVersion);
  if (!submittedVersion) {
    out.push({ code: "review_version_required", message: "the review does not name the lesson version it covers" });
  } else if (submittedVersion !== lesson.version) {
    out.push({ code: "review_stale", message: `the review covers ${submittedVersion}, not the current ${lesson.version}` });
  }
  const submittedHash = text(body.contentHash);
  if (!submittedHash) {
    out.push({ code: "review_hash_required", message: "the review does not name the content hash it covers" });
  } else if (submittedHash !== currentHash) {
    out.push({ code: "review_stale", message: "the lesson content has changed since this review was prepared" });
  }
  if (typeof body.reviewRole !== "string" || !REVIEW_ROLE_IDS.has(body.reviewRole)) {
    out.push({ code: "review_role", message: "choose subject teacher, curriculum lead or accessibility reviewer" });
  }
  if (text(body.qualifications).length < 8) {
    out.push({ code: "qualifications_short", message: "record the reviewer's relevant qualifications or experience" });
  }
  if (text(body.scope).length < 8) {
    out.push({ code: "scope_short", message: "say what part of the lesson and curriculum the review covers" });
  }
  if (body.decision !== "approved" && body.decision !== "changes-requested") {
    out.push({ code: "decision", message: "choose approved or changes requested" });
  }
  out.push(...criteriaProblems(body.criteria, (body.decision as ReviewDecision | undefined) ?? null));

  if (!Array.isArray(body.findings)) {
    out.push({ code: "findings_shape", message: "findings must be a list" });
  } else {
    const seen = new Set<string>();
    for (const [index, finding] of body.findings.entries()) {
      out.push(...findingProblems(finding, index));
      if (isObject(finding) && typeof finding.id === "string") {
        if (seen.has(finding.id)) out.push({ code: "finding_duplicate", message: `duplicate finding id: ${finding.id}` });
        seen.add(finding.id);
      }
    }
    if (body.decision === "approved" && body.findings.some((f) => isObject(f) && f.blockPublication === true)) {
      out.push({ code: "approval_with_blocking_finding", message: "an approval cannot carry a finding that blocks publication" });
    }
  }

  const notes = text(body.notes);
  if (notes.length < 10) out.push({ code: "notes_short", message: "write at least 10 characters of review notes" });
  if (body.decision === "approved" && notes.length < 20) {
    out.push({ code: "approval_notes_short", message: "approval notes must say what was checked" });
  }
  if (body.decision === "changes-requested" && notes.length < 10 && (!Array.isArray(body.findings) || body.findings.length === 0)) {
    out.push({ code: "changes_need_finding", message: "changes requested needs a finding or a note" });
  }

  // A review record may only come from a human teaching account. The route
  // enforces the account half; this rejects an obviously generated payload so a
  // future route cannot accidentally accept one as a review.
  for (const generatedKey of ["generatedBy", "aiGenerated", "model", "prompt"]) {
    if (generatedKey in body) {
      out.push({ code: "not_human", message: `a review cannot be generated: remove ${generatedKey}` });
    }
  }
  if (body.source !== undefined && body.source !== "human") {
    out.push({ code: "not_human", message: "a review must be recorded by a human account" });
  }
  if (body.authority !== undefined && body.authority !== "teacher-account") {
    out.push({ code: "not_teacher_authority", message: "a review must come from a teaching account" });
  }
  return out;
}

export function reviewIsStale(record: EducatorReviewRecord, lesson: AuthoredLesson): boolean {
  return record.lessonVersion !== lesson.version || record.contentHash !== lessonContentHash(lesson);
}

/** Validate a persisted record against the lesson it claims to review. This is
 *  the function the catalogue and the pack use; a record that fails here is a
 *  review on file that does NOT approve the current version. */
export function reviewRecordProblems(record: EducatorReviewRecord, lesson: AuthoredLesson): ReviewProblem[] {
  const normalized = {
    ...record,
    reviewRole: record.reviewer?.reviewRole,
    qualifications: record.reviewer?.qualifications,
    scope: record.reviewer?.scope,
  };
  const out = reviewInputProblems(normalized, lesson, lessonContentHash(lesson));
  if (!isObject(record.reviewer)) {
    out.push({ code: "reviewer_missing", message: "the review does not name the teacher who made it" });
  } else {
    if (text(record.reviewer.accountId).length === 0) {
      out.push({ code: "reviewer_account", message: "the review has no signed-in teacher account" });
    }
    if (text(record.reviewer.name).length < 2) {
      out.push({ code: "reviewer_name", message: "the review does not name the teacher who made it" });
    }
    if (record.reviewer.accountRole !== "teacher" && record.reviewer.accountRole !== "org") {
      out.push({ code: "reviewer_role", message: "the reviewer is not a teaching account" });
    }
    if (text(record.reviewer.qualifications).length < 8) {
      out.push({ code: "reviewer_qualifications", message: "the review does not record the reviewer's qualifications" });
    }
    if (text(record.reviewer.scope).length < 8) {
      out.push({ code: "reviewer_scope", message: "the review does not record its scope" });
    }
    if (lesson.authors.some((a) => a.author.trim().toLowerCase() === record.reviewer.name.trim().toLowerCase())) {
      out.push({ code: "self_review", message: "the author cannot review their own lesson" });
    }
  }
  if (record.source !== "human") out.push({ code: "not_human", message: "only a human review may count" });
  if (record.authority !== "teacher-account") {
    out.push({ code: "not_teacher_authority", message: "only a teaching account may record a review" });
  }
  if (!ISO_DATE.test(record.reviewedAt)) out.push({ code: "review_date", message: "the review date is not ISO" });
  if (!Number.isFinite(record.createdAt) || record.createdAt <= 0) {
    out.push({ code: "review_created", message: "the review has no valid creation time" });
  }
  if (record.decision === "approved" && record.findings.some((f) => f.blockPublication)) {
    out.push({ code: "approval_with_blocking_finding", message: "an approval cannot carry a blocking finding" });
  }
  return out;
}

/** Newest record for a lesson, deterministic even if two writes share a ms. */
export function latestReviewFor(
  records: readonly EducatorReviewRecord[],
  lessonId: string,
): EducatorReviewRecord | null {
  const matching = records
    .filter((r) => r.lessonId === lessonId)
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return matching[matching.length - 1] ?? null;
}

export type ResolvedReviewState =
  | "unreviewed"
  | "approved"
  | "changes-requested"
  | "stale"
  | "invalid";

export interface ResolvedLessonReview {
  readonly state: ResolvedReviewState;
  readonly record: EducatorReviewRecord | null;
  readonly problems: readonly ReviewProblem[];
}

/** What the current version has actually earned. An old approval does not
 *  survive a version or hash change. */
export function resolveLessonReview(
  lesson: AuthoredLesson,
  records: readonly EducatorReviewRecord[],
): ResolvedLessonReview {
  const record = latestReviewFor(records, lesson.conceptId);
  if (!record) return { state: "unreviewed", record: null, problems: [] };
  const problems = reviewRecordProblems(record, lesson);
  if (problems.some((p) => p.code === "review_stale")) return { state: "stale", record, problems };
  if (problems.length > 0) return { state: "invalid", record, problems };
  return {
    state: record.decision === "approved" ? "approved" : "changes-requested",
    record,
    problems: [],
  };
}

/** Convert the durable record into the lesson contract's review shape, so the
 *  existing `earnedRung` gate can consume it without a second status system. */
export function toLessonReview(record: EducatorReviewRecord): LessonReviewRecord {
  return {
    reviewer: record.reviewer.name,
    role: record.reviewer.reviewRole,
    date: record.reviewedAt,
    scope: record.reviewer.scope,
    verdict: record.decision,
    lessonVersion: record.lessonVersion,
  };
}

/** Attach only VALID, current reviews to a lesson before the catalogue gate.
 *  A stale record remains in the ledger, but it cannot lift the rung. */
export function attachReviewRecords(
  lesson: AuthoredLesson,
  records: readonly EducatorReviewRecord[],
): AuthoredLesson {
  const existing = new Set(
    lesson.reviews.map((r) => `${r.reviewer}|${r.date}|${r.lessonVersion}|${r.scope}|${r.verdict}`),
  );
  const added = records
    .filter((record) => record.lessonId === lesson.conceptId && reviewRecordProblems(record, lesson).length === 0)
    .map(toLessonReview)
    .filter((review) => {
      const key = `${review.reviewer}|${review.date}|${review.lessonVersion}|${review.scope}|${review.verdict}`;
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
  return added.length > 0 ? { ...lesson, reviews: [...lesson.reviews, ...added] } : lesson;
}

/** One traceable task per finding. The ids are deterministic, so replaying the
 *  same review cannot silently create a second queue item for one finding. */
export function improvementTasksFromReview(record: EducatorReviewRecord): ImprovementTask[] {
  return record.findings.map((finding) => ({
    id: `${record.id}-${finding.id}`,
    reviewId: record.id,
    lessonId: record.lessonId,
    lessonVersion: record.lessonVersion,
    contentHash: record.contentHash,
    findingId: finding.id,
    location: finding.location,
    problem: finding.problem,
    educationalConsequence: finding.educationalConsequence,
    recommendation: finding.recommendation,
    severity: finding.severity,
    blocking: finding.blockPublication,
    status: "open",
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
  }));
}

export function taskAppliesToLesson(task: ImprovementTask, lesson: AuthoredLesson): boolean {
  return task.lessonVersion === lesson.version && task.contentHash === lessonContentHash(lesson);
}

/** A safe browser view: the reviewer's account id and session facts stay on the
 *  server. Name, role, qualifications and scope are part of the public review. */
export function publicReviewRecord(record: EducatorReviewRecord) {
  return {
    id: record.id,
    lessonId: record.lessonId,
    lessonVersion: record.lessonVersion,
    contentHash: record.contentHash,
    subject: record.subject,
    curriculum: record.curriculum,
    reviewer: {
      name: record.reviewer.name,
      accountRole: record.reviewer.accountRole,
      reviewRole: record.reviewer.reviewRole,
      qualifications: record.reviewer.qualifications,
      scope: record.reviewer.scope,
    },
    reviewedAt: record.reviewedAt,
    criteria: record.criteria,
    decision: record.decision,
    findings: record.findings,
    notes: record.notes,
    source: record.source,
    authority: record.authority,
  };
}

export function publicTask(task: ImprovementTask) {
  return {
    id: task.id,
    reviewId: task.reviewId,
    lessonId: task.lessonId,
    lessonVersion: task.lessonVersion,
    contentHash: task.contentHash,
    findingId: task.findingId,
    location: task.location,
    problem: task.problem,
    educationalConsequence: task.educationalConsequence,
    recommendation: task.recommendation,
    severity: task.severity,
    blocking: task.blocking,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    resolution: task.resolution,
  };
}

export function emptyLedger(): LessonValidationLedger {
  return { version: 1, reviews: [], tasks: [] };
}

/** A pack is stale when any lesson it names no longer has the version/hash it
 *  printed. A stale pack must be regenerated before it is sent to a reviewer. */
export function packStaleness(
  manifest: { lessons: readonly { lessonId: string; version: string; contentHash: string }[] },
  lessons: readonly AuthoredLesson[],
): string[] {
  const out: string[] = [];
  for (const row of manifest.lessons) {
    const lesson = lessons.find((l) => l.conceptId === row.lessonId);
    if (!lesson) {
      out.push(`${row.lessonId}: lesson no longer exists`);
      continue;
    }
    const hash = lessonContentHash(lesson);
    if (lesson.version !== row.version) out.push(`${row.lessonId}: version ${row.version} → ${lesson.version}`);
    if (hash !== row.contentHash) out.push(`${row.lessonId}: content hash changed`);
  }
  return out;
}
