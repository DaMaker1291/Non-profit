import { NextResponse } from "next/server";
import { AUTHORED_BY_CONCEPT } from "@/lib/lessons/authored";
import {
  improvementTasksFromReview,
  lessonContentHash,
  publicReviewRecord,
  publicTask,
  reviewInputProblems,
} from "@/lib/validation/review";
import {
  REVIEW_CRITERIA,
  REVIEW_ROLES,
  type EducatorReviewRecord,
  type ImprovementTask,
  type ReviewCriterionId,
  type ReviewDecision,
  type ReviewFinding,
  type ReviewRole,
} from "@/lib/validation/types";
import { teacherCaller } from "@/lib/server/authority";
import {
  appendLessonReview,
  listLessonImprovementTasks,
  listLessonReviews,
  updateLessonImprovementTask,
} from "@/lib/server/lesson-review-store";
import { newId } from "@/lib/server/store";
import { storeWriteRefusal } from "@/lib/server/write-refusal";

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** A browser view of the evidence. The account id stays server-side; the
 *  reviewer's name, role, qualifications and scope are part of the record. */
export async function GET(): Promise<NextResponse> {
  const [reviews, tasks] = await Promise.all([
    listLessonReviews(),
    listLessonImprovementTasks(),
  ]);
  return NextResponse.json({
    criteria: REVIEW_CRITERIA,
    roles: REVIEW_ROLES,
    reviews: reviews.map(publicReviewRecord),
    tasks: tasks.map(publicTask),
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  // IDENTITY IS THE ACCOUNT'S, NOT THE BODY'S. A learner cannot approve, and a
  // client cannot name a different reviewer. The same rule as the content-
  // platform review route, deliberately.
  const who = await teacherCaller(req);
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "review_body_invalid" }, { status: 400 });
  }
  const input = object(body);
  const lessonId = text(input.lessonId);
  const lesson = AUTHORED_BY_CONCEPT[lessonId];
  if (!lesson) return NextResponse.json({ error: "lesson_not_found" }, { status: 404 });

  const currentHash = lessonContentHash(lesson);
  const problems = reviewInputProblems(body, lesson, currentHash);
  if (problems.length > 0) {
    const stale = problems.some((p) => p.code === "review_stale");
    return NextResponse.json(
      {
        error: stale ? "review_stale" : "review_invalid",
        problems,
        current: { lessonVersion: lesson.version, contentHash: currentHash },
      },
      { status: stale ? 409 : 422 },
    );
  }

  const reviewId = newId("lr");
  const findings = (input.findings as ReviewFinding[]).map((finding) => ({ ...finding }));
  const record: EducatorReviewRecord = {
    id: reviewId,
    lessonId,
    lessonVersion: text(input.lessonVersion),
    contentHash: currentHash,
    subject: lesson.subject,
    curriculum: {
      reference: lesson.curriculum.reference,
      level: lesson.curriculum.level,
    },
    reviewer: {
      accountId: who.account.id,
      name: who.account.name,
      accountRole: who.account.role === "org" ? "org" : "teacher",
      reviewRole: input.reviewRole as ReviewRole,
      qualifications: text(input.qualifications),
      scope: text(input.scope),
    },
    reviewedAt: new Date().toISOString().slice(0, 10),
    createdAt: Date.now(),
    criteria: input.criteria as Record<ReviewCriterionId, boolean>,
    decision: input.decision as ReviewDecision,
    findings,
    notes: text(input.notes),
    source: "human",
    authority: "teacher-account",
  };
  const tasks: ImprovementTask[] = improvementTasksFromReview(record);

  try {
    await appendLessonReview(record, tasks);
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "review_not_saved" }, { status: 500 });
  }

  return NextResponse.json({
    review: publicReviewRecord(record),
    tasks: tasks.map(publicTask),
    state: record.decision,
  });
}

/** Marking a correction done is a human act. It does not approve the lesson:
 *  only a later review of the exact revised version can do that. */
export async function PATCH(req: Request): Promise<NextResponse> {
  const who = await teacherCaller(req);
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "task_body_invalid" }, { status: 400 });
  }
  const input = object(body);
  const taskId = text(input.taskId);
  const status = text(input.status);
  if (!taskId) return NextResponse.json({ error: "task_id_required" }, { status: 422 });
  if (status !== "in-progress" && status !== "done") {
    return NextResponse.json({ error: "task_status_invalid" }, { status: 422 });
  }
  const note = text(input.note);
  if (status === "done" && note.length < 10) {
    return NextResponse.json(
      { error: "resolution_note_required", detail: "Say what changed before marking a finding done." },
      { status: 422 },
    );
  }

  try {
    const updated = await updateLessonImprovementTask(taskId, {
      status,
      resolution: status === "done"
        ? {
            by: who.account.name,
            at: new Date().toISOString(),
            note,
          }
        : undefined,
    });
    if (!updated) return NextResponse.json({ error: "task_not_found" }, { status: 404 });
    return NextResponse.json({ task: publicTask(updated) });
  } catch (e) {
    const refusal = storeWriteRefusal(e);
    if (refusal) return refusal;
    return NextResponse.json({ error: "task_not_saved" }, { status: 500 });
  }
}
