"use client";

import { useState } from "react";
import CodeLab from "@/components/code-lab";
import GraphPlot from "@/components/graph-plot";
import TableAnswer, { type TableView } from "@/components/table-answer";
import * as api from "@/lib/api/client";
import { isGradable } from "@/lib/lesson-assessment";
import type { AuthoredLesson, AssessmentItem, DiagramAssessment } from "@/lib/lesson-contract";
import type { TableSpec } from "@/lib/structured-items";

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

type Verdict = api.LessonCheckResult | null;

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

  // A gap-fill, matching, ordering or diagram item has one answer per authored
  // point. Its controls are deliberately ordinary inputs and buttons: dragging
  // is never the only way to answer, and the same controls work with a keyboard.
  if (item.gaps || item.matching || item.ordering || item.diagram) {
    return (
      <InteractionAssessment
        lesson={lesson}
        item={item}
        index={index}
        learnerId={learnerId}
      />
    );
  }

  // A multi-mark item has one input per part and its own submit: rendering it
  // as a single answer box would collapse independent marks back into one.
  if (item.structured) {
    return (
      <StructuredAssessment
        lesson={lesson}
        item={item}
        index={index}
        learnerId={learnerId}
        structured={item.structured}
      />
    );
  }

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
      setVerdict(r);
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

function InteractionAssessment({
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
  const gapSpec = item.gaps;
  const matching = item.matching;
  const ordering = item.ordering;
  const diagram = item.diagram;
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((gapSpec?.gaps ?? []).map((gap) => [gap.id, ""])),
  );
  const [focusedGap, setFocusedGap] = useState<string | null>(null);
  const [matchAnswers, setMatchAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((matching?.left ?? []).map((left) => [left.id, ""])),
  );
  const [order, setOrder] = useState<string[]>(() => (ordering?.items ?? []).map((entry) => entry.id));
  const [labelAnswers, setLabelAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries((diagram?.labels ?? []).map((label) => [label.id, ""])),
  );
  const [verdict, setVerdict] = useState<api.LessonCheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answers = gapSpec
    ? gapSpec.gaps.map((gap) => gapAnswers[gap.id] ?? "")
    : matching
      ? matching.left.map((left) => matchAnswers[left.id] ?? "")
      : ordering
        ? order
        : diagram
          ? diagram.labels.map((label) => labelAnswers[label.id] ?? "")
          : [];
  const started = answers.some((answer) => answer.trim() !== "");

  async function submit(): Promise<void> {
    if (!learnerId || !started) return;
    setBusy(true);
    setError(null);
    try {
      setVerdict(await api.lessonCheck({
        id: learnerId,
        conceptId: lesson.conceptId,
        itemId: item.id,
        answers,
      }));
    } catch {
      setError("This response could not be marked just now. Your answers are still above — check them against the notes below.");
    } finally {
      setBusy(false);
    }
  }

  const templateParts = gapSpec ? gapSpec.template.split(/(\[\[[a-z0-9-]+\]\])/gi) : [];

  return (
    <div style={{ marginTop: 14 }} data-interaction-item={item.id} data-interaction-kind={item.kind}>
      <p className="reading" style={{ margin: 0 }}>
        <strong>{index + 1}.</strong>{" "}
        <span style={{ whiteSpace: "pre-wrap" }}>{gapSpec ? "Complete every gap in the sentence." : item.prompt}</span>
      </p>
      <p className="reading small muted" style={{ marginTop: 6 }}>
        Each point is marked independently, so a correct part keeps its mark. Every control works
        with a keyboard; nothing has to be dragged.
      </p>

      {gapSpec && (
        <div style={{ marginTop: 10 }}>
          <p className="reading" style={{ whiteSpace: "pre-wrap", lineHeight: 2.1 }}>
            {templateParts.map((part, partIndex) => {
              const match = /^\[\[([a-z0-9-]+)\]\]$/i.exec(part);
              if (!match) return <span key={`text-${partIndex}`}>{part}</span>;
              const gap = gapSpec.gaps.find((candidate) => candidate.id === match[1]);
              if (!gap) return <span key={`missing-${partIndex}`}>{part}</span>;
              return (
                <input
                  key={`gap-${gap.id}`}
                  id={`${lesson.conceptId}-${item.id}-${gap.id}`}
                  className="input"
                  data-gap={gap.id}
                  aria-label={gap.label}
                  value={gapAnswers[gap.id] ?? ""}
                  onFocus={() => setFocusedGap(gap.id)}
                  onChange={(e) => setGapAnswers((prev) => ({ ...prev, [gap.id]: e.target.value }))}
                  disabled={busy || !learnerId}
                  inputMode={gap.numeric ? "decimal" : "text"}
                  size={gap.size ?? 14}
                  style={{ margin: "0 4px", maxWidth: "100%" }}
                />
              );
            })}
          </p>
          {gapSpec.wordBank && gapSpec.wordBank.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }} aria-label="Word bank">
              {gapSpec.wordBank.map((word) => (
                <button
                  key={word}
                  type="button"
                  className="btn ghost small"
                  onClick={() => {
                    if (!focusedGap) return;
                    setGapAnswers((prev) => ({ ...prev, [focusedGap]: word }));
                  }}
                  disabled={busy || !learnerId || !focusedGap}
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {matching && (
        <div style={{ marginTop: 10 }}>
          <div className="reading small muted" style={{ display: "flex", gap: 12 }}>
            <span style={{ flex: "1 1 50%" }}>{matching.leftHeading ?? "Term"}</span>
            <span style={{ flex: "1 1 50%" }}>{matching.rightHeading ?? "Match"}</span>
          </div>
          {matching.left.map((left) => (
            <label
              key={left.id}
              className="reading small"
              htmlFor={`${lesson.conceptId}-${item.id}-${left.id}`}
              style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}
            >
              <span style={{ flex: "1 1 180px" }}>{left.text}</span>
              <select
                id={`${lesson.conceptId}-${item.id}-${left.id}`}
                className="input"
                data-match={left.id}
                value={matchAnswers[left.id] ?? ""}
                onChange={(e) => setMatchAnswers((prev) => ({ ...prev, [left.id]: e.target.value }))}
                disabled={busy || !learnerId}
                style={{ flex: "1 1 180px", minWidth: 0 }}
              >
                <option value="">Choose…</option>
                {matching.right.map((right) => (
                  <option key={right.id} value={right.id}>{right.text}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}

      {ordering && (
        <ol style={{ marginTop: 10, paddingLeft: 24 }}>
          {order.map((id, position) => {
            const entry = ordering.items.find((candidate) => candidate.id === id);
            return (
              <li key={id} className="reading small" data-order-id={id} style={{ marginTop: 6 }}>
                <span style={{ marginRight: 8 }}>{entry?.text ?? id}</span>
                <button
                  type="button"
                  className="btn ghost small"
                  aria-label={`Move ${entry?.text ?? id} earlier`}
                  disabled={busy || !learnerId || position === 0}
                  onClick={() => setOrder((prev) => {
                    const next = [...prev];
                    [next[position - 1], next[position]] = [next[position], next[position - 1]];
                    return next;
                  })}
                >
                  Up
                </button>{" "}
                <button
                  type="button"
                  className="btn ghost small"
                  aria-label={`Move ${entry?.text ?? id} later`}
                  disabled={busy || !learnerId || position === order.length - 1}
                  onClick={() => setOrder((prev) => {
                    const next = [...prev];
                    [next[position], next[position + 1]] = [next[position + 1], next[position]];
                    return next;
                  })}
                >
                  Down
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {diagram && (
        <DiagramLabels
          lesson={lesson}
          item={item}
          diagram={diagram}
          answers={labelAnswers}
          onChange={(labelId, targetId) => setLabelAnswers((prev) => ({ ...prev, [labelId]: targetId }))}
          disabled={busy || !learnerId}
        />
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          data-interaction-submit="1"
          onClick={() => void submit()}
          disabled={busy || !learnerId || !started}
        >
          {busy ? "Checking…" : "Check all parts"}
        </button>
      </div>
      {!learnerId && (
        <p className="reading small muted" style={{ marginTop: 6 }}>
          Sign in to have the parts marked and recorded. You can still complete them and check the notes below.
        </p>
      )}
      {error && <p className="reading small" style={{ marginTop: 6 }}>{error}</p>}
      {verdict && (
        <div style={{ marginTop: 12 }} data-interaction-verdict="1">
          <p className="reading" style={{ margin: 0 }}>
            <strong
              className={verdict.correct ? "yes" : "no"}
              data-interaction-score={verdict.correct ? "full" : "partial"}
            >
              {verdict.awarded ?? 0} / {verdict.marks ?? answers.length}
            </strong>{" "}
            <span className="small muted">
              {verdict.correct
                ? "full marks — recorded on this concept as an independent answer"
                : "partial credit recorded — every point keeps the mark it earned"}
            </span>
          </p>
          {verdict.parts?.map((part) => (
            <div key={part.partId} data-interaction-result={part.partId} style={{ marginTop: 8 }}>
              <ul className="reading small muted" style={{ marginTop: 4 }}>
                {part.criteria.map((criterionEntry) => (
                  <li key={criterionEntry.id}>
                    <span aria-hidden="true">{criterionEntry.met ? "✓" : "✗"}</span>{" "}
                    {criterionEntry.label} — {criterionEntry.awarded} / {criterionEntry.marks}. {criterionEntry.why}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="reading lesson-text small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
            {verdict.modelAnswer}
          </p>
          <ul className="reading small muted" style={{ marginTop: 6 }}>
            {verdict.marking.map((criterionEntry) => <li key={criterionEntry}>{criterionEntry}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function DiagramLabels({
  lesson,
  item,
  diagram,
  answers,
  onChange,
  disabled,
}: {
  lesson: AuthoredLesson;
  item: AssessmentItem;
  diagram: DiagramAssessment;
  answers: Record<string, string>;
  onChange: (labelId: string, targetId: string) => void;
  disabled: boolean;
}) {
  const position = (id: string) => diagram.targets.findIndex((target) => target.id === id) + 1;
  return (
    <div style={{ marginTop: 10 }} data-diagram={item.id}>
      <svg
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="img"
        aria-label={diagram.caption}
        style={{ width: "100%", maxWidth: "100%", height: "auto", border: "1px solid var(--line)", borderRadius: 8, background: "var(--surface)" }}
      >
        {diagram.shapes.map((shape, shapeIndex) => {
          if (shape.kind === "rect") {
            return <rect key={`s${shapeIndex}`} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx ?? 0} fill={shape.filled ? "var(--accent-soft)" : "var(--surface-sunken)"} stroke="var(--line-strong)" strokeWidth="2" />;
          }
          if (shape.kind === "circle") {
            return <circle key={`s${shapeIndex}`} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.filled ? "var(--accent-soft)" : "var(--surface-sunken)"} stroke="var(--line-strong)" strokeWidth="2" />;
          }
          if (shape.kind === "line") {
            return <line key={`s${shapeIndex}`} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="var(--line-strong)" strokeWidth="2" strokeDasharray={shape.dash} />;
          }
          return <text key={`s${shapeIndex}`} x={shape.x} y={shape.y} fontSize={shape.size ?? 14} fill="var(--text-muted)">{shape.text}</text>;
        })}
        {diagram.targets.map((target, targetIndex) => (
          <g key={target.id}>
            <circle cx={target.x} cy={target.y} r="13" fill="var(--accent)" />
            <text x={target.x} y={target.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-on-strong)">{targetIndex + 1}</text>
          </g>
        ))}
      </svg>
      <p className="reading small muted" style={{ marginTop: 6 }}>{diagram.caption}</p>
      {diagram.labels.map((label) => (
        <label
          key={label.id}
          className="reading small"
          htmlFor={`${lesson.conceptId}-${item.id}-${label.id}`}
          style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}
        >
          <span style={{ flex: "1 1 180px" }}>{label.text}</span>
          <select
            id={`${lesson.conceptId}-${item.id}-${label.id}`}
            className="input"
            data-diagram-label={label.id}
            value={answers[label.id] ?? ""}
            onChange={(e) => onChange(label.id, e.target.value)}
            disabled={disabled}
            style={{ flex: "1 1 180px", minWidth: 0 }}
          >
            <option value="">Choose a position…</option>
            {diagram.targets.map((target) => (
              <option key={target.id} value={target.id}>Position {position(target.id)}</option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

// The table renderer takes a VIEW: it knows which cells are blank and what unit
// each carries, never the answer. An authored part stores the key, so this is
// the one place the two shapes meet and where the key is deliberately dropped.
function tableView(table: TableSpec): TableView {
  return {
    columns: table.columns,
    rows: table.rows.map((row) => ({
      label: row.label,
      cells: row.cells.map((cell) => ({
        given: cell.given,
        editable: cell.answer !== undefined,
        unit: cell.unit,
      })),
    })),
  };
}

function StructuredAssessment({
  lesson,
  item,
  index,
  learnerId,
  structured,
}: {
  lesson: AuthoredLesson;
  item: AssessmentItem;
  index: number;
  learnerId: string | null;
  structured: NonNullable<AssessmentItem["structured"]>;
}) {
  const [given, setGiven] = useState<Record<string, string>>(() =>
    Object.fromEntries(structured.parts.map((part) => [part.id, ""])),
  );
  const [working, setWorking] = useState<Record<string, string>>(() =>
    Object.fromEntries(structured.parts.map((part) => [part.id, ""])),
  );
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = structured.parts.some(
    (part) => (given[part.id] ?? "").trim() !== "" || (working[part.id] ?? "").trim() !== "",
  );

  async function submit(): Promise<void> {
    if (!learnerId || !started) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.lessonCheck({
        id: learnerId,
        conceptId: lesson.conceptId,
        itemId: item.id,
        answers: structured.parts.map((part) => given[part.id] ?? ""),
        working: structured.parts.map((part) => working[part.id] ?? ""),
      });
      setVerdict(r);
    } catch {
      setError("These parts could not be marked just now. Your answers are still above — check them against the marking notes below.");
    } finally {
      setBusy(false);
    }
  }

  const awarded = verdict?.awarded ?? 0;
  const marks = verdict?.marks ?? structured.parts.reduce((n, part) => n + part.marks, 0);

  return (
    <div style={{ marginTop: 14 }} data-structured-item={item.id}>
      <p className="reading" style={{ margin: 0 }}>
        <strong>{index + 1}.</strong>{" "}
        <span style={{ whiteSpace: "pre-wrap" }}>{item.prompt}</span>
      </p>
      <p className="reading small muted" style={{ marginTop: 6 }}>
        Each part is marked independently. A correct method keeps its mark even when the final
        answer is wrong, and a correct answer earns its own mark even without the working.
      </p>

      {structured.parts.map((part) => (
        <div
          key={part.id}
          data-structured-part={part.id}
          style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}
        >
          <p className="reading small" style={{ margin: 0 }}>
            <strong>({part.id})</strong>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{part.prompt}</span>{" "}
            <span className="small muted">
              {part.marks} {part.marks === 1 ? "mark" : "marks"}
            </span>
          </p>
          <label
            className="reading small"
            htmlFor={`${lesson.conceptId}-${item.id}-${part.id}-answer`}
            style={{ display: "block", marginTop: 8 }}
          >
            Your answer
          </label>
          {part.response === "graph" && (
            <p className="reading small muted" style={{ marginTop: 6 }}>
              Enter two points on your line as <b>x,y x,y</b>. Any two points on the
              correct line are accepted; the marker reads the line they define.
              {part.graph ? ` Grid: x from ${part.graph.xMin} to ${part.graph.xMax}, y from ${part.graph.yMin} to ${part.graph.yMax}.` : ""}
            </p>
          )}
          {part.response === "readoff" && part.readOff && (
            <p className="reading small muted" style={{ marginTop: 6 }}>
              Read from the line you drew in part ({part.readOff.from}) at x = {part.readOff.at}.
              Your reading is marked against your own line, so a consistent follow-through keeps the mark.
            </p>
          )}
          {part.response === "plot" && part.plot ? (
            <div style={{ marginTop: 6 }}>
              <GraphPlot
                bounds={part.plot}
                value={given[part.id] ?? ""}
                onChange={(next) => setGiven((prev) => ({ ...prev, [part.id]: next }))}
                label={`${item.prompt} (${part.id})`}
              />
            </div>
          ) : part.response === "table" && part.table ? (
            <div style={{ marginTop: 6 }}>
              <TableAnswer
                table={tableView(part.table)}
                value={given[part.id] ?? ""}
                onChange={(next) => setGiven((prev) => ({ ...prev, [part.id]: next }))}
                label={`${item.prompt} (${part.id})`}
              />
            </div>
          ) : (
            <input
              id={`${lesson.conceptId}-${item.id}-${part.id}-answer`}
              className="input"
              data-structured-answer={part.id}
              value={given[part.id] ?? ""}
              onChange={(e) => setGiven((prev) => ({ ...prev, [part.id]: e.target.value }))}
              disabled={busy || !learnerId}
              inputMode={part.response === "number" || part.response === undefined ? "decimal" : "text"}
              placeholder={part.response === "graph" ? "0,1 2,5" : part.response === "readoff" ? "value of y" : undefined}
              style={{ marginTop: 6, width: "100%" }}
            />
          )}
          {part.method && (
            <>
              <label
                className="reading small"
                htmlFor={`${lesson.conceptId}-${item.id}-${part.id}-working`}
                style={{ display: "block", marginTop: 8 }}
              >
                Working for ({part.id})
              </label>
              <input
                id={`${lesson.conceptId}-${item.id}-${part.id}-working`}
                className="input"
                data-structured-working={part.id}
                value={working[part.id] ?? ""}
                onChange={(e) => setWorking((prev) => ({ ...prev, [part.id]: e.target.value }))}
                disabled={busy || !learnerId}
                style={{ marginTop: 6, width: "100%" }}
              />
            </>
          )}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          data-structured-submit="1"
          onClick={() => void submit()}
          disabled={busy || !learnerId || !started}
        >
          {busy ? "Checking…" : "Check all parts"}
        </button>
      </div>
      {!learnerId && (
        <p className="reading small muted" style={{ marginTop: 6 }}>
          Sign in to have the parts marked and recorded. You can still write them and check them
          against the notes.
        </p>
      )}
      {error && (
        <p className="reading small" style={{ marginTop: 6 }}>
          {error}
        </p>
      )}

      {verdict && (
        <div style={{ marginTop: 12 }} data-structured-verdict="1">
          <p className="reading" style={{ margin: 0 }}>
            <strong
              className={awarded === marks ? "yes" : "no"}
              data-structured-score={awarded === marks ? "full" : "partial"}
            >
              {awarded} / {marks}
            </strong>{" "}
            <span className="small muted">
              {awarded === marks
                ? "full marks — recorded on this concept as an independent answer"
                : "partial credit recorded — every part keeps the marks it earned"}
            </span>
          </p>
          {verdict.parts?.map((part) => (
            <div key={part.partId} data-structured-result={part.partId} style={{ marginTop: 8 }}>
              <p className="reading small" style={{ margin: 0 }}>
                <strong>({part.partId})</strong> {part.awarded} / {part.marks}{" "}
                <span className="muted">{part.correct ? "correct" : "not yet"}</span>
              </p>
              <ul className="reading small muted" style={{ marginTop: 4 }}>
                {part.criteria.map((criterion) => (
                  <li key={criterion.id}>
                    <span aria-hidden="true">{criterion.met ? "✓" : "✗"}</span>{" "}
                    {criterion.label} — {criterion.awarded} / {criterion.marks}. {criterion.why}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="reading lesson-text small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
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
  );
}
