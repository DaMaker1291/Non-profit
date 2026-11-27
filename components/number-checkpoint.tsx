"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import MathText from "@/components/math-text";
import { loadLocalProfileId, loadLocalProfileSecret, useProfile } from "@/lib/client";
import * as api from "@/lib/api/client";
import type { LessonCheckResult } from "@/lib/api/client";
import type {
  CheckpointItemView,
  CheckpointObjectiveView,
  NumberCheckpointView,
} from "@/lib/number-checkpoint";

interface ItemResult {
  awarded: number;
  marks: number;
  correct: boolean;
  blank?: boolean;
  detail?: LessonCheckResult;
}

function itemKey(item: CheckpointItemView): string {
  return `${item.conceptId}#${item.itemId}`;
}

function partKey(item: CheckpointItemView, partId: string): string {
  return `${itemKey(item)}#${partId}`;
}

function percentage(awarded: number, marks: number): number {
  return marks > 0 ? Math.round((awarded / marks) * 100) : 0;
}

function nextStep(percent: number): string {
  if (percent < 50) return "Reteach this objective before moving on.";
  if (percent < 80) return "Revisit the worked examples and method notes, then try the lesson assessment again.";
  return "Enough evidence to move on in this checkpoint — not a claim of long-term retention.";
}

export default function NumberCheckpoint({ checkpoint }: { checkpoint: NumberCheckpointView }) {
  const { state } = useProfile();
  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});
  const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});
  const [partWorking, setPartWorking] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ItemResult>>({});
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (startedAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const allItems = useMemo(
    () => checkpoint.objectives.flatMap((objective) => objective.items),
    [checkpoint.objectives],
  );
  const answeredCount = allItems.filter((item) => {
    if (item.single) return (singleAnswers[itemKey(item)] ?? "").trim() !== "";
    // Working alone is not an answer: the server refuses a structured item with
    // no answer in any part, so counting only working here would promise a mark
    // the marker cannot award. Working is still sent when an answer exists.
    return item.parts.some((part) => (partAnswers[partKey(item, part.id)] ?? "").trim() !== "");
  }).length;
  const gradedCount = allItems.filter((item) => results[itemKey(item)]).length;
  const allGraded = gradedCount === allItems.length;
  const overallAwarded = allItems.reduce((sum, item) => sum + (results[itemKey(item)]?.awarded ?? 0), 0);
  const overallPercent = percentage(overallAwarded, checkpoint.totalMarks);
  const elapsedSeconds = startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const remainingSeconds = checkpoint.suggestedMinutes * 60 - elapsedSeconds;

  const submit = async () => {
    const id = loadLocalProfileId();
    const secret = loadLocalProfileSecret();
    if (!id) {
      setError("This device has no learner profile, so the checkpoint can be read but not recorded. Start a profile first, then return here.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setLocked(true);
    setError(null);
    const next: Record<string, ItemResult> = { ...results };
    try {
      for (const item of allItems) {
        const key = itemKey(item);
        if (next[key]) continue;
        const answered = item.single
          ? (singleAnswers[key] ?? "").trim() !== ""
          : item.parts.some((part) => (partAnswers[partKey(item, part.id)] ?? "").trim() !== "");
        if (!answered) {
          next[key] = { awarded: 0, marks: item.marks, correct: false, blank: true };
          setResults({ ...next });
          continue;
        }

        if (item.single) {
          const detail = await api.checkpointCheck({
            id,
            checkpointId: checkpoint.id,
            itemId: item.itemId,
            answer: singleAnswers[key] ?? "",
            secret,
          });
          next[key] = {
            awarded: detail.correct ? 1 : 0,
            marks: 1,
            correct: detail.correct,
            detail,
          };
        } else {
          const detail = await api.checkpointCheck({
            id,
            checkpointId: checkpoint.id,
            itemId: item.itemId,
            answers: item.parts.map((part) => partAnswers[partKey(item, part.id)] ?? ""),
            working: item.parts.map((part) => partWorking[partKey(item, part.id)] ?? ""),
            secret,
          });
          next[key] = {
            awarded: detail.awarded ?? 0,
            marks: detail.marks ?? item.marks,
            correct: detail.correct,
            detail,
          };
        }
        setResults({ ...next });
      }
    } catch {
      setError(
        "Some answers could not be marked. The marked items below are recorded; press Mark remaining when the connection is stable. Your answers stay on this page.",
      );
    } finally {
      setBusy(false);
    }
  };

  const objectiveResult = (objective: CheckpointObjectiveView) => {
    const awarded = objective.items.reduce((sum, item) => sum + (results[itemKey(item)]?.awarded ?? 0), 0);
    const attempted = objective.items.filter((item) => results[itemKey(item)] && !results[itemKey(item)]?.blank);
    return { awarded, marks: objective.marks, percent: percentage(awarded, objective.marks), attempted: attempted.length };
  };

  const weakest = checkpoint.objectives
    .map((objective) => ({ objective, ...objectiveResult(objective) }))
    .filter((entry) => entry.attempted > 0)
    .sort((a, b) => a.percent - b.percent)[0];

  if (!started) {
    return (
      <div>
        <p className="eyebrow">AQA GCSE Mathematics · Number</p>
        <h1>{checkpoint.title}</h1>
        <p className="lede">
          One sitting across the Number objectives whose teaching and assessment are complete. These
          questions are written for this checkpoint and appear in no lesson, so their model answers
          cannot be looked up before you sit it. Marking happens on the server; the browser is never
          sent the answer key.
        </p>

        <div className="card" data-number-checkpoint-start>
          <div className="row" style={{ flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <div style={{ flex: "1 1 260px" }}>
              <p className="eyebrow" style={{ marginTop: 0 }}>What this is</p>
              <p className="reading">
                {checkpoint.itemCount} questions · {checkpoint.totalMarks} marks · suggested{" "}
                {checkpoint.suggestedMinutes} minutes.
              </p>
              <p className="small muted">{checkpoint.notice}</p>
              <p className="small muted" data-checkpoint-evidence-note>
                Marks are recorded as checkpoint assessment evidence, separate from the lesson&apos;s
                own assessment counters. Sitting this paper does not count as an attempt on a
                lesson assessment.
              </p>
            </div>
            <div style={{ flex: "1 1 260px" }}>
              <p className="eyebrow" style={{ marginTop: 0 }}>Objectives in this sitting</p>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {checkpoint.objectives.map((objective) => (
                  <li key={objective.id} style={{ marginBottom: 6 }}>
                    <strong>{objective.title}</strong>{" "}
                    <span className="muted">({objective.marks} marks)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="row" style={{ gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setStarted(true);
                setStartedAt(Date.now());
                setNow(Date.now());
              }}
            >
              Start checkpoint
            </button>
            <span className="small muted" style={{ alignSelf: "center" }}>
              The timer is a guide. It does not submit for you.
            </span>
          </div>
          {!state ? (
            <p className="small" style={{ marginBottom: 0 }}>
              No learner profile is loaded on this device. You can read the paper, but marking will
              not be recorded. <Link href="/start">Start a profile</Link>.
            </p>
          ) : null}
        </div>

        <p className="small muted" style={{ marginTop: 16 }}>
          This is practice, not a qualification. It covers five completed objectives, not every
          Number objective in the specification. A mark here is evidence from one sitting, not a
          predicted grade, and it is not counted as a lesson-assessment attempt.
        </p>
      </div>
    );
  }

  return (
    <div data-number-checkpoint>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <p className="eyebrow">AQA GCSE Mathematics · Number</p>
          <h1 style={{ marginBottom: 4 }}>{checkpoint.title}</h1>
          <p className="small muted" style={{ margin: 0 }}>
            {checkpoint.totalMarks} marks · {checkpoint.itemCount} questions · {answeredCount} answered
          </p>
        </div>
        <div
          className="card"
          style={{ padding: "10px 14px", minWidth: 170 }}
          role="timer"
          aria-live="off"
          data-checkpoint-timer
        >
          <p className="small muted" style={{ margin: 0 }}>Suggested time remaining</p>
          <p style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            {remainingSeconds >= 0
              ? `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, "0")}`
              : "Time is up"}
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            {remainingSeconds >= 0 ? "You may still finish." : "Finish and submit when ready."}
          </p>
        </div>
      </div>

      <p className="small muted" style={{ marginTop: 8 }}>
        {checkpoint.notice}
      </p>

      {error ? <p className="notice" role="alert">{error}</p> : null}

      {checkpoint.objectives.map((objective) => (
        <section key={objective.id} style={{ marginTop: 26 }} data-checkpoint-objective={objective.id}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 2 }}>{objective.curriculum}</p>
              <h2 style={{ margin: 0 }}>{objective.title}</h2>
            </div>
            <span className="small muted">{objective.marks} marks</span>
          </div>
          <p className="small muted" style={{ marginTop: 4 }}>{objective.requirement}</p>

          {objective.items.map((item) => {
            const key = itemKey(item);
            const result = results[key];
            const singleValue = singleAnswers[key] ?? "";
            return (
              <article
                key={key}
                className="card"
                style={{ marginTop: 12 }}
                data-checkpoint-item={`${item.conceptId}#${item.itemId}`}
              >
                <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                  <p className="reading" style={{ margin: 0, flex: "1 1 420px" }}>
                    <strong>{item.number}.</strong>{" "}
                    <MathText text={item.prompt} />
                  </p>
                  <span className="small muted">{item.marks} {item.marks === 1 ? "mark" : "marks"}</span>
                </div>

                {item.single ? (
                  <label className="small" style={{ display: "block", marginTop: 10 }}>
                    Your answer
                    <input
                      className="input"
                      style={{ marginTop: 6, maxWidth: 360 }}
                      value={singleValue}
                      disabled={locked}
                      onChange={(event) =>
                        setSingleAnswers((current) => ({ ...current, [key]: event.target.value }))
                      }
                      aria-label={`Answer to question ${item.number}`}
                    />
                  </label>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    {item.parts.map((part) => {
                      const pk = partKey(item, part.id);
                      return (
                        <div key={part.id} style={{ marginTop: 10 }} data-checkpoint-part={part.id}>
                          <label className="small" style={{ display: "block" }}>
                            <span>
                              <MathText text={part.prompt} />{" "}
                              <span className="muted">({part.marks} {part.marks === 1 ? "mark" : "marks"})</span>
                            </span>
                            <input
                              className="input"
                              style={{ marginTop: 6, maxWidth: 420 }}
                              value={partAnswers[pk] ?? ""}
                              disabled={locked}
                              onChange={(event) =>
                                setPartAnswers((current) => ({ ...current, [pk]: event.target.value }))
                              }
                              aria-label={`Question ${item.number}, part ${part.id}: ${part.prompt}`}
                            />
                          </label>
                          {part.methodPrompt ? (
                            <label className="small muted" style={{ display: "block", marginTop: 6 }}>
                              Working — {part.methodPrompt}
                              <textarea
                                className="input"
                                style={{ marginTop: 4, minHeight: 54 }}
                                value={partWorking[pk] ?? ""}
                                disabled={locked}
                                onChange={(event) =>
                                  setPartWorking((current) => ({ ...current, [pk]: event.target.value }))
                                }
                                aria-label={`Question ${item.number}, part ${part.id} working`}
                              />
                            </label>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}

                {result ? (
                  <div
                    style={{ marginTop: 14, borderTop: "1px solid var(--line, #ddd)", paddingTop: 12 }}
                    data-checkpoint-feedback={key}
                  >
                    <p className="reading" style={{ margin: 0, fontWeight: 700 }}>
                      {result.blank
                        ? "Left blank — 0 marks."
                        : `${result.awarded} / ${result.marks} marks`}
                    </p>
                    {result.blank ? (
                      <p className="small muted" style={{ marginTop: 4 }}>
                        A blank answer is not a wrong method, but it earns no mark. Read the lesson
                        explanation before trying this objective again.
                      </p>
                    ) : null}
                    {result.detail?.modelAnswer ? (
                      <p className="reading small" style={{ marginTop: 8 }}>
                        <strong>Model answer:</strong> <MathText text={result.detail.modelAnswer} />
                      </p>
                    ) : null}
                    {result.detail?.marking?.length ? (
                      <ul className="small" style={{ marginTop: 6, paddingLeft: 18 }}>
                        {result.detail.marking.map((line, index) => (
                          <li key={index}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {result.detail?.parts?.length ? (
                      <div style={{ marginTop: 6 }}>
                        {result.detail.parts.map((part) => (
                          <div key={part.partId} className="small" style={{ marginTop: 6 }}>
                            <strong>{part.awarded} / {part.marks}</strong>
                            {part.criteria.map((criterion) => (
                              <p key={criterion.id} className="muted" style={{ margin: "2px 0 0" }}>
                                {criterion.met ? "✓" : "·"} {criterion.label}
                                {criterion.why ? ` — ${criterion.why}` : ""}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ))}

      <div className="card" style={{ marginTop: 24 }} data-checkpoint-submit>
        <div className="row" style={{ justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p className="eyebrow" style={{ marginTop: 0 }}>Submit the sitting</p>
            <p className="small" style={{ margin: 0 }}>
              {answeredCount} of {allItems.length} questions answered. Blank questions are scored 0.
              Each answer is recorded once against its own objective.
            </p>
          </div>
          <button type="button" className="btn primary" onClick={submit} disabled={busy || allGraded}>
            {busy ? "Marking…" : allGraded ? "Marked" : gradedCount > 0 ? "Mark remaining" : "Mark checkpoint"}
          </button>
        </div>
      </div>

      {allGraded ? (
        <section style={{ marginTop: 24 }} data-checkpoint-results>
          <p className="eyebrow">Your breakdown</p>
          <h2 style={{ marginTop: 0 }}>
            {overallAwarded} / {checkpoint.totalMarks} marks ({overallPercent}%)
          </h2>
          <p className="reading">
            This is one sitting, not a grade. The objective breakdown below is the useful part: a
            single total can hide which method needs teaching.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 620 }}>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Objective</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Marks</th>
                  <th scope="col" style={{ textAlign: "left", padding: 8 }}>Next step</th>
                </tr>
              </thead>
              <tbody>
                {checkpoint.objectives.map((objective) => {
                  const score = objectiveResult(objective);
                  return (
                    <tr key={objective.id}>
                      <td style={{ padding: 8, verticalAlign: "top" }}>
                        <strong>{objective.title}</strong>
                        <br />
                        <span className="small muted">{objective.requirement}</span>
                      </td>
                      <td style={{ padding: 8, verticalAlign: "top", whiteSpace: "nowrap" }}>
                        <strong>{score.awarded} / {score.marks}</strong>
                        <br />
                        <span className="small muted">{score.percent}%</span>
                        <div
                          aria-hidden="true"
                          style={{ height: 6, background: "#e5e7eb", borderRadius: 99, marginTop: 6, width: 90 }}
                        >
                          <div style={{ height: 6, width: `${score.percent}%`, background: "#0f766e", borderRadius: 99 }} />
                        </div>
                      </td>
                      <td style={{ padding: 8, verticalAlign: "top" }}>
                        <span className="small">{nextStep(score.percent)}</span>
                        <br />
                        <Link className="small" href={objective.lessonHref}>Revisit the lesson</Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {weakest ? (
            <p className="reading" style={{ marginTop: 14 }}>
              Weakest objective in this sitting: <strong>{weakest.objective.title}</strong> (
              {weakest.awarded}/{weakest.marks}). <Link href={weakest.objective.lessonHref}>Start there</Link>.
            </p>
          ) : null}

          <p className="small muted">
            Evidence recorded: each marked item was written as checkpoint assessment evidence
            against its own objective, under a <code>checkpoint:</code> id. It was not counted as
            an attempt on the lesson&apos;s own assessment. Blank items were not sent to the server.
            This page does not decide mastery from one percentage, and it cannot tell you what you
            will remember next month.
          </p>
        </section>
      ) : null}
    </div>
  );
}
