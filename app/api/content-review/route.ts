import { NextResponse } from "next/server";
import { allLessonDocuments } from "@/lib/content-platform/flagships";
import {
  lessonFingerprint,
  publicReviewRecord,
  reviewInputProblems,
} from "@/lib/content-platform/review";
import { REVIEW_CRITERIA, type ContentReviewRecord, type ReviewSubmission } from "@/lib/content-platform/types";
import { teacherCaller } from "@/lib/server/authority";
import { appendContentReview, listContentReviews } from "@/lib/server/content-review-store";
import { newId } from "@/lib/server/store";
import { storeWriteRefusal } from "@/lib/server/write-refusal";

/** Review records are public in the sense that the lesson status must be
 *  inspectable without a session. The reviewer's account id and email are not:
 *  they stay on the server. */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    criteria: REVIEW_CRITERIA,
    reviews: (await listContentReviews()).map(publicReviewRecord),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  // AUTHORITY IS THE ACCOUNT'S, NOT THE BODY'S. A learner capability cannot
  // approve a lesson, and the reviewer's name is never accepted from a client.
  const who = await teacherCaller(req);
  if (!who.ok) {
    return NextResponse.json({ error: who.error }, { status: who.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "review_body_invalid" }, { status: 400 });
  }

  const documentId =
    body && typeof body === "object" && !Array.isArray(body) && typeof (body as { documentId?: unknown }).documentId === "string"
      ? (body as { documentId: string }).documentId
      : "";
  const doc = allLessonDocuments().find((d) => d.id === documentId);
  if (!doc) return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });

  const problems = reviewInputProblems(body, doc.id);
  if (problems.length > 0) {
    return NextResponse.json({ error: "review_invalid", problems }, { status: 422 });
  }

  const submission = body as ReviewSubmission;
  const record: ContentReviewRecord = {
    id: newId("cr"),
    documentId: doc.id,
    fingerprint: lessonFingerprint(doc),
    decision: submission.decision,
    criteria: submission.criteria,
    notes: submission.notes.trim(),
    reviewer: {
      accountId: who.account.id,
      name: who.account.name,
      role: who.account.role,
    },
    createdAt: Date.now(),
  };

  try {
    await appendContentReview(record);
  } catch (e) {
    // A store that cannot keep a learner's record must not silently accept a
    // publication approval it would lose. The store's own refusal is returned.
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "review_not_saved" }, { status: 500 });
  }

  return NextResponse.json({
    review: publicReviewRecord(record),
    // The client uses this to say what happened without turning a saved record
    // into a publication claim: the lesson page re-reads the resolved state.
    state: record.decision === "approved" ? "approved" : "draft",
  });
}
