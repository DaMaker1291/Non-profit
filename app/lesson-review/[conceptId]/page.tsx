import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LessonReviewForm from "@/components/lesson-review-form";
import { CONCEPTS_BY_ID } from "@/lib/genome";
import { AUTHORED_BY_CONCEPT } from "@/lib/lessons/authored";
import { listLessonImprovementTasks, listLessonReviews } from "@/lib/server/lesson-review-store";
import {
  lessonContentHash,
  resolveLessonReview,
  taskAppliesToLesson,
} from "@/lib/validation/review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Educator review — OpenMind",
  description: "Review an authored lesson against subject accuracy, curriculum, teaching, examples, assessment and accessibility.",
};

export default async function LessonReviewPage({
  params,
}: {
  params: Promise<{ conceptId: string }>;
}) {
  const { conceptId } = await params;
  const lesson = AUTHORED_BY_CONCEPT[conceptId];
  if (!lesson) notFound();

  const [reviews, tasks] = await Promise.all([
    listLessonReviews(),
    listLessonImprovementTasks(),
  ]);
  const resolved = resolveLessonReview(lesson, reviews);
  const hash = lessonContentHash(lesson);
  const concept = CONCEPTS_BY_ID[conceptId];
  const title = concept?.title ?? conceptId.replace(/-/g, " ");
  const lessonTasks = tasks.filter((task) => task.lessonId === conceptId);

  const stateCopy =
    resolved.state === "approved"
      ? "This exact version has a valid human approval."
      : resolved.state === "changes-requested"
        ? "A human reviewer requested changes to this version."
        : resolved.state === "stale"
          ? "A review is on file, but it does not apply to this version or content hash."
          : resolved.state === "invalid"
            ? "A review is on file, but it fails the review contract."
            : "No human review is on record for this version.";

  return (
    <main className="container page" style={{ paddingTop: 36 }}>
      <Link className="small" href="/lesson-review">← Improvement queue</Link>
      <p className="eyebrow" style={{ margin: "18px 0 0" }}>Educator review · Authored lesson</p>
      <h1 style={{ margin: "6px 0" }}>{title}</h1>
      <p className="small muted" style={{ margin: "0 0 16px" }}>
        {lesson.subject} · {lesson.curriculum.reference} · {lesson.curriculum.level} · version <code>{lesson.version}</code>
      </p>

      <div className="card soft" style={{ marginBottom: 18 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Current human-evidence state</p>
        <p style={{ margin: "8px 0 0" }}><strong>{stateCopy}</strong></p>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Content hash <code>{hash}</code>. The pack and this page use the same hash. Editing the lesson changes it.
        </p>
        {resolved.record && (
          <div className="small" style={{ marginTop: 12 }}>
            <p style={{ margin: 0 }}>
              Latest: <strong>{resolved.record.decision === "approved" ? "approved" : "changes requested"}</strong> by{" "}
              {resolved.record.reviewer.name} ({resolved.record.reviewer.reviewRole}) on {resolved.record.reviewedAt}.
            </p>
            <p className="muted" style={{ margin: "4px 0 0" }}>{resolved.record.notes}</p>
            {resolved.problems.length > 0 && (
              <ul className="small" style={{ margin: "8px 0 0", color: "var(--bad, #a12a2a)" }}>
                {resolved.problems.map((problem) => <li key={problem.code}>{problem.message}</li>)}
              </ul>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <Link className="btn ghost" href={`/learn/${lesson.subject}/${lesson.conceptId}`}>Open the lesson</Link>
          <Link className="btn ghost" href="/lesson-review">View improvement queue</Link>
        </div>
      </div>

      <LessonReviewForm
        lessonId={lesson.conceptId}
        title={title}
        lessonVersion={lesson.version}
        contentHash={hash}
      />

      <section className="card soft" style={{ marginBottom: 20 }}>
        <p className="eyebrow" style={{ margin: 0 }}>Improvement queue for this lesson</p>
        {lessonTasks.length === 0 ? (
          <p className="small muted" style={{ margin: "8px 0 0" }}>No findings have been recorded for this lesson.</p>
        ) : (
          <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {lessonTasks.map((task) => (
              <li key={task.id} style={{ marginBottom: 8 }}>
                <strong>{task.status}</strong> · {task.severity}{task.blocking ? " · blocks publication" : ""} ·{" "}
                {task.location}: {task.problem}
                {!taskAppliesToLesson(task, lesson) && <span className="muted"> (from an earlier version)</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="small muted">
        An approval is a human decision about the exact version and hash printed here. It is not inferred from the automated checks,
        and it does not survive a content change.
      </p>
    </main>
  );
}
