import type { AuthoredLesson } from "@/lib/lesson-contract";
import { AssessmentBlock } from "./authored-assessment";
import { LessonFigure } from "./lesson-figure";

// THE AUTHORED LESSON, RENDERED.
//
// This is the read stage's second half for the concepts that have a lesson
// meeting openmind.lesson/1.0. It shows the parts an assembled plan cannot
// have: a prior-knowledge check, misconception corrections with the reasoning
// behind them, guided practice with a hint per item, an independent assessment
// with marking criteria, a transfer challenge, spaced retrieval, and the
// lesson's own provenance and review status.
//
// TWO RULES ARE BUILT INTO THE MARKUP:
//   1. An answer key is behind a disclosure a learner chooses to open, never
//      printed beside the question. A key on the screen is a key one mistaken
//      call can leak, and it is also the fastest way to stop a learner thinking.
//   2. The review status is printed, not implied. A lesson nobody has reviewed
//      says so, in the same place a learner reads what it teaches. The content
//      strategy's ladder must not be claimed silently.
//
// English-only on purpose. The contract carries per-language translation
// records, and none exists yet, so this component is rendered only when the
// learner's teaching language is English — a French heading above English
// teaching is the failure mode this avoids.
export function AuthoredLessonReading({
  lesson,
  learnerId = null,
}: {
  lesson: AuthoredLesson;
  /** Present when someone is signed in on this device. Without it an assessment
   *  can be read but not recorded, and the item says so rather than pretending
   *  a measurement happened. */
  learnerId?: string | null;
}) {
  return (
    <div className="authored-lesson" data-contract={lesson.contract}>
      {lesson.objectives.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Lesson objectives">
          <p className="eyebrow" style={{ margin: 0 }}>By the end you can</p>
          <ul className="reading" style={{ marginTop: 10, marginBottom: 0 }}>
            {lesson.objectives.map((objective) => (
              <li key={objective.statement}>{objective.statement}</li>
            ))}
          </ul>
        </section>
      )}

      {lesson.priorKnowledge.check.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Before you start">
          <p className="eyebrow" style={{ margin: 0 }}>Before you start</p>
          <p className="reading lesson-text" style={{ marginTop: 10 }}>
            These are the ideas this lesson builds on. If an answer feels uncertain, that is the
            idea to look at first — it is not this lesson failing you.
          </p>
          {lesson.priorKnowledge.check.map((check) => (
            <details key={check.id} className="authored-check" style={{ marginTop: 10 }}>
              <summary className="reading">{check.question}</summary>
              <p className="reading lesson-text small muted" style={{ marginTop: 8 }}>
                {check.answer}
              </p>
            </details>
          ))}
        </section>
      )}

      {/* NOT `lesson-figure`. That class is the PLAN's drawing and the browser
          walk measures it (`figure.lesson-figure`): reusing it here made a
          lesson whose plan declares no picture report one, which is the walk
          correctly refusing a claim it could not verify. A representation block
          in the authored contract is a different thing, and says so. */}
      {lesson.representations.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Representations">
          <p className="eyebrow" style={{ margin: 0 }}>What the idea looks like</p>
          {lesson.representations.map((block) => (
            <figure key={block.id} className="authored-block" data-block={block.kind}>
              <p className="reading" style={{ marginBottom: 8 }}>{block.body}</p>
              {block.notation && (
                <pre className="code-block small" style={{ whiteSpace: "pre-wrap", margin: 0 }}>{block.notation}</pre>
              )}
              {block.figure && (
                <LessonFigure spec={block.figure.spec} caption={block.figure.caption} />
              )}
              {block.caption && (
                <figcaption className="small muted reading" style={{ marginTop: 8 }}>{block.caption}</figcaption>
              )}
            </figure>
          ))}
        </section>
      )}

      {lesson.misconceptions.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label="Common misconceptions">
          <p className="eyebrow" style={{ margin: 0 }}><span className="no">!</span> The wrong move, and why it fails</p>
          {lesson.misconceptions.map((misconception) => (
            <div key={misconception.id} style={{ marginTop: 14 }}>
              <p className="reading" style={{ margin: 0 }}><strong>&ldquo;{misconception.belief}&rdquo;</strong></p>
              <p className="reading lesson-text small muted" style={{ marginTop: 6 }}>{misconception.whyItFails}</p>
              <p className="reading lesson-text" style={{ marginTop: 6 }}>{misconception.correction}</p>
              <p className="small muted reading" style={{ marginTop: 6 }}>
                Wrong: {misconception.contrast.wrong} · Right: {misconception.contrast.right}
              </p>
            </div>
          ))}
        </section>
      )}

      {lesson.guidedPractice.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Guided practice">
          <p className="eyebrow" style={{ margin: 0 }}>Let&rsquo;s do these together</p>
          {lesson.guidedPractice.map((item, index) => (
            <div key={item.id} style={{ marginTop: 14 }}>
              <p className="reading" style={{ margin: 0 }}>
                <strong>{index + 1}.</strong> <span style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</span>
              </p>
              <details className="authored-hint" style={{ marginTop: 8 }}>
                <summary className="reading small">A hint, not the answer</summary>
                <p className="reading lesson-text small" style={{ marginTop: 6 }}>{item.hint}</p>
              </details>
              <details className="authored-answer" style={{ marginTop: 6 }}>
                <summary className="reading small">Check your answer</summary>
                <p className="reading lesson-text small" style={{ marginTop: 6 }}>{item.answer}</p>
                <p className="reading small muted" style={{ marginTop: 4 }}>{item.feedback.correct}</p>
                <p className="reading small muted" style={{ marginTop: 4 }}>{item.feedback.incorrect}</p>
              </details>
            </div>
          ))}
        </section>
      )}

      {/* The assessment is ANSWERED here, not only disclosed — see
          components/authored-assessment.tsx for why a gradable item and a
          constructed response are handled differently. */}
      <AssessmentBlock lesson={lesson} learnerId={learnerId} />

      {lesson.transfer.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Transfer challenge">
          <p className="eyebrow" style={{ margin: 0 }}>Somewhere else</p>
          {lesson.transfer.map((item) => (
            <div key={item.id} style={{ marginTop: 10 }}>
              <p className="reading" style={{ margin: 0 }}>{item.prompt}</p>
              <p className="reading small muted" style={{ marginTop: 6 }}>Why this is a different problem: {item.whyItTransfers}</p>
              <details className="authored-answer" style={{ marginTop: 6 }}>
                <summary className="reading small">Model answer and marking</summary>
                <p className="reading lesson-text small" style={{ marginTop: 6 }}>{item.answer}</p>
                <ul className="reading small muted" style={{ marginTop: 6 }}>
                  {item.marking.map((criterion) => <li key={criterion}>{criterion}</li>)}
                </ul>
              </details>
            </div>
          ))}
        </section>
      )}

      {lesson.retrieval.length > 0 && (
        <section className="card" style={{ marginBottom: 18 }} aria-label="Retrieval and revision">
          <p className="eyebrow" style={{ margin: 0 }}>Come back to these</p>
          <p className="reading small muted" style={{ marginTop: 8 }}>
            Retrieval works because it is spaced. These are worth answering again later, not now.
          </p>
          <ul className="reading" style={{ marginTop: 8 }}>
            {lesson.retrieval.map((item) => (
              <li key={item.id} style={{ marginTop: 6 }}>
                {item.prompt} <span className="tag">{item.when.replace("-", " ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {lesson.summary.length > 0 && (
        <section className="card soft" style={{ marginBottom: 18 }} aria-label="Lesson summary">
          <p className="eyebrow" style={{ margin: 0 }}>Three things to keep</p>
          <ul className="reading" style={{ marginTop: 10, marginBottom: 0 }}>
            {lesson.summary.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
      )}

      {/* THE HONEST FOOTER. Status, authorship and what was not reproduced. */}
      <section className="card" style={{ marginBottom: 18 }} aria-label="About this lesson">
        <p className="eyebrow" style={{ margin: 0 }}>About this lesson</p>
        <p className="reading small muted" style={{ marginTop: 8 }}>
          Version {lesson.version} · status: {statusLabel(lesson.declaredStatus)} ·{" "}
          {lesson.reviews.length === 0
            ? "no subject teacher has reviewed this version yet"
            : `${lesson.reviews.length} review record${lesson.reviews.length === 1 ? "" : "s"}`}
          {" "}·{" "}
          {lesson.learnerTesting.length === 0
            ? "not yet tested with learners"
            : `${lesson.learnerTesting.length} learner-testing record${lesson.learnerTesting.length === 1 ? "" : "s"}`}
        </p>
        <p className="reading small muted" style={{ marginTop: 6 }}>
          Written by {lesson.authors.map((a) => `${a.author} (${a.method.replace(/-/g, " ")})`).join(", ")}.
          {" "}
          {lesson.provenance
            .filter((entry) => entry.basis !== "openmind-authored")
            .map((entry) => `${entry.attribution} No text reproduced.`)
            .join(" ")}
        </p>
      </section>
    </div>
  );
}

function statusLabel(status: AuthoredLesson["declaredStatus"]): string {
  switch (status) {
    case "metadata_only":
      return "metadata only";
    case "outline":
      return "outline";
    case "draft":
      return "draft";
    case "machine_checked":
      return "automatically checked, not yet reviewed by a teacher";
    case "educator_reviewed":
      return "reviewed by a subject teacher";
    case "learner_tested":
      return "tested with learners";
    case "published":
      return "published";
    case "needs_revision":
      return "needs revision";
  }
}
