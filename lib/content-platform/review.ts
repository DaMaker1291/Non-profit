// ─────────────────────────────────────────────────────────────────────────────
// THE REVIEW CONTRACT.
//
// A lesson is not approved because a page says `approved`. It is approved when a
// signed-in teacher accounts for four separate judgements, and the record is
// bound to a fingerprint of the lesson content those judgements were made
// against. Edit the lesson afterwards and the approval stops applying.
//
// This module is deliberately PURE except for the SHA-256 digest. The store and
// the route own persistence and identity; the gate can exercise the same rules
// without a server.
// ─────────────────────────────────────────────────────────────────────────────
import { createHash } from "node:crypto";
import type {
  ContentReviewRecord,
  LessonDocument,
  ReviewCriterionId,
  ReviewSubmission,
} from "./types";
import { REVIEW_CRITERIA } from "./types";

export interface ReviewProblem {
  code: string;
  message: string;
}

const CRITERION_IDS = new Set<string>(REVIEW_CRITERIA.map((c) => c.id));

/** A deterministic JSON encoding, so a fingerprint does not change because a
 *  JSON writer reordered object keys on a round trip. Arrays stay ordered. */
function canonical(value: unknown): string {
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

/** The content half of a lesson — the review metadata is deliberately excluded. */
export function lessonFingerprint(doc: LessonDocument): string {
  const content = { ...doc };
  delete (content as Partial<LessonDocument>).review;
  return createHash("sha256").update(canonical(content)).digest("hex");
}

/**
 * Validate a submission BEFORE it becomes a record. The document id is optional
 * when the route has already resolved the document; when present it must match.
 */
export function reviewInputProblems(input: unknown, expectedDocumentId?: string): ReviewProblem[] {
  const problems: ReviewProblem[] = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return [{ code: "review_shape", message: "a review must be an object" }];
  }
  const body = input as Record<string, unknown>;
  if (typeof body.documentId !== "string" || body.documentId.trim().length === 0) {
    problems.push({ code: "document_id", message: "a review must name a lesson document" });
  } else if (expectedDocumentId && body.documentId !== expectedDocumentId) {
    problems.push({ code: "document_mismatch", message: "the review names a different lesson" });
  }
  if (body.decision !== "approved" && body.decision !== "changes-requested") {
    problems.push({ code: "decision", message: "choose approved or changes requested" });
  }
  const criteria = body.criteria;
  if (!criteria || typeof criteria !== "object" || Array.isArray(criteria)) {
    problems.push({ code: "criteria_shape", message: "the four review checks are required" });
  } else {
    for (const id of CRITERION_IDS) {
      if (typeof (criteria as Record<string, unknown>)[id] !== "boolean") {
        problems.push({ code: "criterion_missing", message: `the ${id} check is missing` });
      }
    }
    for (const key of Object.keys(criteria)) {
      if (!CRITERION_IDS.has(key)) {
        problems.push({ code: "criterion_unknown", message: `unknown review check: ${key}` });
      }
    }
    if (body.decision === "approved") {
      for (const criterion of REVIEW_CRITERIA) {
        if ((criteria as Record<string, unknown>)[criterion.id] !== true) {
          problems.push({
            code: "approval_requires_all",
            message: `approval requires the ${criterion.label} check`,
          });
        }
      }
    }
  }
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length < 10) {
    problems.push({ code: "notes_short", message: "write at least 10 characters of review notes" });
  }
  if (body.decision === "approved" && notes.length < 20) {
    problems.push({ code: "approval_notes_short", message: "approval notes must say what was checked" });
  }
  return problems;
}

/** Validate a persisted record against the lesson it claims to review. */
export function reviewRecordProblems(record: ContentReviewRecord, doc: LessonDocument): ReviewProblem[] {
  const problems = reviewInputProblems(record, doc.id);
  if (record.fingerprint !== lessonFingerprint(doc)) {
    problems.push({
      code: "content_changed",
      message: "the lesson has changed since this review was recorded",
    });
  }
  if (!record.reviewer || !record.reviewer.accountId || !record.reviewer.name.trim()) {
    problems.push({ code: "reviewer_missing", message: "the review does not name the teacher who made it" });
  } else if (record.reviewer.role !== "teacher" && record.reviewer.role !== "org") {
    problems.push({ code: "reviewer_role", message: "the reviewer is not a teaching account" });
  }
  if (!Number.isFinite(record.createdAt) || record.createdAt <= 0) {
    problems.push({ code: "review_date", message: "the review has no valid timestamp" });
  }
  return problems;
}

/** The newest record for a document. Ties are broken by id so the answer is
 *  deterministic even if two writes share a millisecond. */
export function latestReviewFor(
  records: readonly ContentReviewRecord[],
  documentId: string,
): ContentReviewRecord | null {
  const matching = records
    .filter((r) => r.documentId === documentId)
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return matching[matching.length - 1] ?? null;
}

/**
 * Apply the latest VALID record to a document. A record for an older version, a
 * record with a missing check or a record by a non-teacher is not an approval:
 * the lesson stays in draft and says why.
 */
export function resolveLessonReview(
  doc: LessonDocument,
  records: readonly ContentReviewRecord[],
): LessonDocument {
  const latest = latestReviewFor(records, doc.id);
  if (!latest) return doc;
  const problems = reviewRecordProblems(latest, doc);
  if (problems.length > 0) {
    return {
      ...doc,
      review: {
        state: "draft",
        note: `A review is on file but does not apply to this version: ${problems[0].message}.`,
      },
    };
  }
  if (latest.decision === "approved") {
    return {
      ...doc,
      review: {
        state: "approved",
        reviewedBy: latest.reviewer.name,
        reviewedAt: new Date(latest.createdAt).toISOString(),
        note: latest.notes,
      },
    };
  }
  return {
    ...doc,
    review: {
      state: "draft",
      note: `Changes requested by ${latest.reviewer.name}: ${latest.notes}`,
    },
  };
}

/** A shape safe to send to a browser: no account id, no email. */
export function publicReviewRecord(record: ContentReviewRecord): {
  id: string;
  documentId: string;
  decision: ReviewSubmission["decision"];
  criteria: Record<ReviewCriterionId, boolean>;
  notes: string;
  createdAt: number;
  reviewer: { name: string; role: string };
} {
  return {
    id: record.id,
    documentId: record.documentId,
    decision: record.decision,
    criteria: record.criteria,
    notes: record.notes,
    createdAt: record.createdAt,
    reviewer: { name: record.reviewer.name, role: record.reviewer.role },
  };
}
