import type { Metadata } from "next";
import Link from "next/link";
import { CONCEPTS_BY_ID } from "@/lib/genome";
import { AUTHORED_LESSONS } from "@/lib/lessons/authored";
import { listLessonImprovementTasks, listLessonReviews } from "@/lib/server/lesson-review-store";
import { taskAppliesToLesson } from "@/lib/validation/review";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Improvement queue — OpenMind",
  description: "Human review findings and the corrections they require.",
};

export default async function ImprovementQueuePage() {
  const [tasks, reviews] = await Promise.all([
    listLessonImprovementTasks(),
    listLessonReviews(),
  ]);
  const lessons = new Map(AUTHORED_LESSONS.map((lesson) => [lesson.conceptId, lesson]));
  const reviewById = new Map(reviews.map((review) => [review.id, review]));

  return (
    <main className="container page" style={{ paddingTop: 36 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Independent Educational Validation 1.0</p>
      <h1 style={{ margin: "6px 0" }}>Improvement queue</h1>
      <p className="small muted" style={{ maxWidth: 760 }}>
        Every row comes from a named human review finding. Finishing a correction does not approve the lesson:
        a later review of the revised version is still required.
      </p>

      <div className="card soft" style={{ marginBottom: 18 }}>
        <p className="small" style={{ margin: 0 }}>
          <strong>{reviews.length}</strong> human review record{reviews.length === 1 ? "" : "s"} ·{" "}
          <strong>{tasks.length}</strong> finding task{tasks.length === 1 ? "" : "s"} ·{" "}
          <strong>{tasks.filter((task) => task.status === "open").length}</strong> open.
        </p>
      </div>

      {tasks.length === 0 ? (
        <section className="card soft">
          <p style={{ margin: 0 }}>No human review findings are on record.</p>
          <p className="small muted" style={{ margin: "8px 0 0" }}>
            Choose a lesson to review; this queue fills only from a signed-in teacher&apos;s findings.
          </p>
        </section>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="small" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Lesson</th>
                <th style={{ textAlign: "left", padding: 8 }}>Finding</th>
                <th style={{ textAlign: "left", padding: 8 }}>Severity</th>
                <th style={{ textAlign: "left", padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => {
                const lesson = lessons.get(task.lessonId);
                const concept = CONCEPTS_BY_ID[task.lessonId];
                const review = reviewById.get(task.reviewId);
                return (
                  <tr key={task.id} style={{ borderTop: "1px solid var(--line, #d8ddd8)", verticalAlign: "top" }}>
                    <td style={{ padding: 8 }}>
                      <Link href={`/lesson-review/${task.lessonId}`}>{concept?.title ?? task.lessonId}</Link>
                      <span className="muted" style={{ display: "block" }}>v{task.lessonVersion}</span>
                      {lesson && !taskAppliesToLesson(task, lesson) && (
                        <span className="muted" style={{ display: "block" }}>from an earlier version</span>
                      )}
                    </td>
                    <td style={{ padding: 8 }}>
                      <strong>{task.location}</strong>
                      <span style={{ display: "block" }}>{task.problem}</span>
                      <span className="muted" style={{ display: "block" }}>{task.recommendation}</span>
                      {review && <span className="muted" style={{ display: "block" }}>Raised by {review.reviewer.name}</span>}
                    </td>
                    <td style={{ padding: 8 }}>
                      {task.severity}
                      {task.blocking && <span style={{ display: "block" }}>blocks publication</span>}
                    </td>
                    <td style={{ padding: 8 }}>
                      {task.status}
                      {task.resolution && <span className="muted" style={{ display: "block" }}>{task.resolution.note}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: 24 }}>Lessons awaiting review</h2>
      <ul className="small">
        {AUTHORED_LESSONS.map((lesson) => (
          <li key={lesson.conceptId} style={{ marginBottom: 4 }}>
            <Link href={`/lesson-review/${lesson.conceptId}`}>
              {CONCEPTS_BY_ID[lesson.conceptId]?.title ?? lesson.conceptId}
            </Link>{" "}
            <span className="muted">v{lesson.version}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
