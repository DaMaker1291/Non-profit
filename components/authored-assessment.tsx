"use client";

import { useState } from "react";
import CodeLab from "@/components/code-lab";
import * as api from "@/lib/api/client";
import { isGradable } from "@/lib/lesson-assessment";
import type { AuthoredLesson, AssessmentItem } from "@/lib/lesson-contract";

// THE INDEPENDENT ASSESSMENT, ANSWERED RATHER THAN ONLY READ.
//
// Before this existed, a lesson's assessment was a prompt followed by a
// disclosure: the learner could open the model answer without ever committing to
// one of their own. That is a worked example wearing an assessment's heading.
//
// Two kinds of item, and the difference is the point:
//
//   gradable     the item carries a deterministic key, so the server marks it and
//                records the attempt as evidence on this concept. The learner is
//                told right or wrong and given the marking notes afterwards.
//   self-marked  a constructed response has no key. The page says so and offers
//                the criteria; it does NOT score the prose. lib/peer-review.ts is
//                the standing proof that scoring words by vocabulary produces a
//                number that means nothing.
//
// Nothing here is recorded unless the learner is signed in on this device
// (`learnerId` present). A visitor reading a lesson gets the item and the
// criteria, and no claim is made that anything was measured.

export function AssessmentBlock({
  lesson,
  learnerId,
}: {
  lesson: AuthoredLesson;
  learnerId: string | null;
}) {
  if (lesson.assessment.length === 0) return null;
  return (
    <section className="card" style={{ marginBottom: 18 }} aria-label="Independent assessment">
      <p className="eyebrow" style={{ margin: 0 }}>
        On your own
      </p>
      <p className="reading small muted" style={{ marginTop: 8 }}>
        Answer before you open anything. Where the item can be marked, the answer goes to your
        record; where it cannot, the marking notes are what a teacher would look for, and checking
        your own work against them is the assessment.
      </p>
      {lesson.assessment.map((item, index) => (
        <AssessmentRow
          key={item.id}
          lesson={lesson}
          item={item}
          index={index}
          learnerId={learnerId}
        />
      ))}
    </section>
  );
}

type Verdict = { correct: boolean; modelAnswer: string; marking: readonly string[] } | null;

function AssessmentRow({
  lesson,
  item,
  index,
  learnerId,
}: {
  lesson: AuthoredLesson;
  item: AssessmentItem;
  index: number;
  learnerId: string | null;
}) {
  const [answer, setAnswer] = useState("");
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gradable = isGradable(item);
  const codeLab = item.kind === "code" ? item.code : undefined;

  async function submit(): Promise<void> {
    if (!learnerId || answer.trim() === "") return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.lessonCheck({
        id: learnerId,
        conceptId: lesson.conceptId,
        itemId: item.id,
        answer,
      });
      setVerdict({ correct: r.correct, modelAnswer: r.modelAnswer, marking: r.marking });
    } catch {
      // A refusal is a real answer: the item may have lost its key, or the store
      // may be refusing writes. Saying "could not be marked" is the truth; a
      // fabricated verdict would be worse than no verdict.
      setError("This answer could not be marked just now. Your writing is still above — check it against the notes below.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <p className="reading" style={{ margin: 0 }}>
        <strong>{index + 1}.</strong>{" "}
        <span style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</span>
      </p>

      {codeLab && (
        <div style={{ marginTop: 10 }}>
          <CodeLab
            starterCode={codeLab.starterCode}
            timeoutMs={codeLab.timeoutMs ?? 12000}
            tests={[...codeLab.tests]}
            prompt={item.prompt}
          />
        </div>
      )}

      {gradable ? (
        <div style={{ marginTop: 8 }}>
          <label className="reading small" htmlFor={`${lesson.conceptId}-${item.id}`}>
            Your answer
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <input
              id={`${lesson.conceptId}-${item.id}`}
              className="input"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
              disabled={busy || !learnerId}
              style={{ flex: "1 1 220px" }}
            />
            <button
              type="button"
              className="btn"
              onClick={() => void submit()}
              disabled={busy || !learnerId || answer.trim() === ""}
            >
              {busy ? "Checking…" : "Check"}
            </button>
          </div>
          {!learnerId && (
            <p className="reading small muted" style={{ marginTop: 6 }}>
              Sign in to have this marked and recorded. You can still write it and check it against
              the notes.
            </p>
          )}
          {error && (
            <p className="reading small" style={{ marginTop: 6 }}>
              {error}
            </p>
          )}
          {verdict && (
            <div style={{ marginTop: 10 }}>
              <p className="reading" style={{ margin: 0 }}>
                <strong className={verdict.correct ? "yes" : "no"}>
                  {verdict.correct ? "Correct" : "Not yet"}
                </strong>{" "}
                <span className="small muted">
                  {verdict.correct
                    ? "recorded on this concept as an independent answer"
                    : "recorded too — a wrong first attempt is evidence, not a failure"}
                </span>
              </p>
              <p className="reading lesson-text small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>
                {verdict.modelAnswer}
              </p>
              <ul className="reading small muted" style={{ marginTop: 6 }}>
                {verdict.marking.map((criterion) => (
                  <li key={criterion}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          {item.scored === false && (
            <p className="reading small" data-unscored-reflection="1" style={{ marginTop: 8 }}>
              <b>Unscored reflection.</b> This does not count towards mastery. Write your reasoning,
              then judge it against the criteria below; no mark is recorded and no model score is
              invented from your words.
            </p>
          )}
          <details className="authored-answer" style={{ marginTop: 8 }}>
            <summary className="reading small">Model answer and marking</summary>
            {codeLab && (
            <p className="reading small muted" style={{ marginTop: 6 }}>
              The checks run in the sandboxed browser lab. Passing them is useful practice
              feedback, not a recorded mark; use the model answer and criteria below to judge
              the explanation your program cannot show.
            </p>
          )}
            <p className="reading small muted" style={{ marginTop: 6 }}>
              This one cannot be marked automatically — write it first, then judge it against the
              criteria.
            </p>
            <p
              className="reading lesson-text small"
              style={{ marginTop: 6, whiteSpace: "pre-wrap" }}
            >
              {item.modelAnswer}
            </p>
            <ul className="reading small muted" style={{ marginTop: 6 }}>
              {item.marking.map((criterion) => (
                <li key={criterion}>{criterion}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}
