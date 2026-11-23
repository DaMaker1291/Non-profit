"use client";

// The authored assessment, on a device with no connection.
//
// This is deliberately the SAME marking engine as /api/progress: the component
// collects an answer, markOfflineAssessment calls gradeLessonInteraction /
// gradeStructuredAssessment / gradeAuthoredAssessment, and the parent queues the
// resulting event. A separate "offline marker" would be a second rulebook.
//
// Prose is absent from the pack by construction. The component never shows an
// authored key before submission, and the answer it displays afterwards is the
// same model answer a teacher would see.
import { useMemo, useState } from "react";
import GraphPlot from "@/components/graph-plot";
import TableAnswer, { type TableView } from "@/components/table-answer";
import type { AssessmentItem } from "@/lib/lesson-contract";
import type { OfflineAnswer, OfflinePack } from "@/lib/offline-pack";
import { markOfflineAssessment, type OfflineMark } from "@/lib/offline-assessment";
import type { TableSpec } from "@/lib/structured-items";

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

function blankAnswers(item: AssessmentItem): string[] {
  if (item.gaps) return item.gaps.gaps.map(() => "");
  if (item.matching) return item.matching.left.map(() => "");
  if (item.ordering) return item.ordering.items.map((entry) => entry.id);
  if (item.diagram) return item.diagram.labels.map(() => "");
  if (item.structured) return item.structured.parts.map(() => "");
  return [""];
}

function formatName(item: AssessmentItem): string {
  if (item.gaps) return "Gap fill";
  if (item.matching) return "Matching";
  if (item.ordering) return "Ordering";
  if (item.diagram) return "Diagram labelling";
  if (item.structured) return "Structured response";
  return "Short answer";
}

function OfflineDiagram({ item, answers, onChange, disabled }: {
  item: AssessmentItem;
  answers: string[];
  onChange: (index: number, value: string) => void;
  disabled: boolean;
}) {
  const diagram = item.diagram;
  if (!diagram) return null;
  const position = (id: string) => diagram.targets.findIndex((target) => target.id === id) + 1;
  return (
    <div style={{ marginTop: 8 }}>
      <svg
        viewBox={`0 0 ${diagram.width} ${diagram.height}`}
        role="img"
        aria-label={diagram.caption}
        style={{ width: "100%", maxWidth: "100%", height: "auto", border: "1px solid var(--line)", borderRadius: 8 }}
      >
        {diagram.shapes.map((shape, index) => {
          if (shape.kind === "rect") {
            return <rect key={index} x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx ?? 0} fill={shape.filled ? "var(--accent-soft)" : "var(--surface-sunken)"} stroke="var(--line-strong)" strokeWidth="2" />;
          }
          if (shape.kind === "circle") {
            return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.filled ? "var(--accent-soft)" : "var(--surface-sunken)"} stroke="var(--line-strong)" strokeWidth="2" />;
          }
          if (shape.kind === "line") {
            return <line key={index} x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="var(--line-strong)" strokeWidth="2" strokeDasharray={shape.dash} />;
          }
          return <text key={index} x={shape.x} y={shape.y} fontSize={shape.size ?? 14} fill="var(--text-muted)">{shape.text}</text>;
        })}
        {diagram.targets.map((target, index) => (
          <g key={target.id}>
            <circle cx={target.x} cy={target.y} r="13" fill="var(--accent)" />
            <text x={target.x} y={target.y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text-on-strong)">{index + 1}</text>
          </g>
        ))}
      </svg>
      <p className="small muted" style={{ marginTop: 6 }}>{diagram.caption}</p>
      {diagram.labels.map((label, index) => (
        <label key={label.id} className="small" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
          <span style={{ flex: "1 1 180px" }}>{label.text}</span>
          <select
            className="input"
            value={answers[index] ?? ""}
            onChange={(event) => onChange(index, event.target.value)}
            disabled={disabled}
            style={{ flex: "1 1 180px" }}
            aria-label={label.text}
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

function OfflineItem({
  pack,
  item,
  saved,
  onSubmit,
}: {
  pack: OfflinePack;
  item: AssessmentItem;
  saved?: OfflineAnswer;
  onSubmit: (item: AssessmentItem, mark: OfflineMark, response: string[], working: string[]) => void;
}) {
  const [answers, setAnswers] = useState<string[]>(() => saved?.response ?? blankAnswers(item));
  const [working, setWorking] = useState<string[]>(() => saved?.working ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const disabled = !!saved || busy;

  const started = useMemo(() => answers.some((answer) => answer.trim() !== "") || working.some((entry) => entry.trim() !== ""), [answers, working]);

  const setAnswer = (index: number, value: string) => {
    setAnswers((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };
  const setWork = (index: number, value: string) => {
    setWorking((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
  };

  const submit = async () => {
    if (disabled || !started) return;
    setBusy(true);
    setError("");
    try {
      const mark = markOfflineAssessment(item, answers, working);
      if (!mark) {
        setError("This response could not be marked. Nothing has been recorded; your answer is still here.");
        return;
      }
      onSubmit(item, mark, answers, working);
    } finally {
      setBusy(false);
    }
  };

  const gaps = item.gaps;
  const matching = item.matching;
  const ordering = item.ordering;
  const structured = item.structured;

  return (
    <div className="card soft" style={{ marginBottom: 12 }} data-offline-assessment={item.id}>
      <p className="small muted" style={{ margin: 0 }}>{formatName(item)} · {item.marking.length} marking point{item.marking.length === 1 ? "" : "s"}</p>
      <p style={{ fontWeight: 650, marginTop: 6 }}>{item.prompt}</p>

      {gaps && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {gaps.gaps.map((gap, index) => (
            <label key={gap.id} className="small" style={{ display: "grid", gap: 4 }}>
              <span>{gap.label}{gap.unit ? ` (${gap.unit})` : ""}</span>
              <input
                className="input"
                value={answers[index] ?? ""}
                onChange={(event) => setAnswer(index, event.target.value)}
                disabled={disabled}
                data-offline-gap={gap.id}
                inputMode={gap.numeric ? "decimal" : "text"}
              />
            </label>
          ))}
        </div>
      )}

      {matching && (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          {matching.left.map((left, index) => (
            <label key={left.id} className="small" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ flex: "1 1 180px" }}>{left.text}</span>
              <select
                className="input"
                value={answers[index] ?? ""}
                onChange={(event) => setAnswer(index, event.target.value)}
                disabled={disabled}
                style={{ flex: "1 1 180px" }}
                data-offline-match={left.id}
              >
                <option value="">Choose…</option>
                {matching.right.map((right) => <option key={right.id} value={right.id}>{right.text}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {ordering && (
        <ol style={{ marginTop: 8, paddingLeft: 24 }}>
          {(answers.length === ordering.items.length ? answers : ordering.items.map((entry) => entry.id)).map((id, index) => {
            const entry = ordering.items.find((candidate) => candidate.id === id);
            return (
              <li key={id} className="small" style={{ marginTop: 6 }}>
                <span style={{ marginRight: 8 }}>{entry?.text ?? id}</span>
                <button type="button" className="btn ghost small" disabled={disabled || index === 0}
                  aria-label={`Move ${entry?.text ?? id} earlier`}
                  onClick={() => setAnswers((previous) => {
                    const next = [...previous];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    return next;
                  })}>Up</button>{" "}
                <button type="button" className="btn ghost small" disabled={disabled || index === answers.length - 1}
                  aria-label={`Move ${entry?.text ?? id} later`}
                  onClick={() => setAnswers((previous) => {
                    const next = [...previous];
                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                    return next;
                  })}>Down</button>
              </li>
            );
          })}
        </ol>
      )}

      {item.diagram && (
        <OfflineDiagram item={item} answers={answers} onChange={setAnswer} disabled={disabled} />
      )}

      {structured && structured.parts.map((part, index) => (
        <div key={part.id} style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
          <p className="small" style={{ margin: 0 }}><b>({part.id})</b> {part.prompt} <span className="muted">[{part.marks} mark{part.marks === 1 ? "" : "s"}]</span></p>
          {part.response === "graph" && (
            <p className="small muted" style={{ marginTop: 4 }}>
              Enter two points on your line as <b>x,y x,y</b>. Any two points on the correct line are accepted.
              {part.graph ? ` Grid: x ${part.graph.xMin}–${part.graph.xMax}, y ${part.graph.yMin}–${part.graph.yMax}.` : ""}
            </p>
          )}
          {part.response === "readoff" && part.readOff && (
            <p className="small muted" style={{ marginTop: 4 }}>Read from your line in part ({part.readOff.from}) at x = {part.readOff.at}.</p>
          )}
          {part.response === "plot" && part.plot ? (
            <GraphPlot bounds={part.plot} value={answers[index] ?? ""} onChange={(next) => setAnswer(index, next)} label={`${item.prompt} (${part.id})`} />
          ) : part.response === "table" && part.table ? (
            <TableAnswer table={tableView(part.table)} value={answers[index] ?? ""} onChange={(next) => setAnswer(index, next)} label={`${item.prompt} (${part.id})`} />
          ) : (
            <input className="input" value={answers[index] ?? ""} onChange={(event) => setAnswer(index, event.target.value)} disabled={disabled}
              data-offline-structured-answer={part.id}
              placeholder={part.response === "graph" ? "0,1 2,5" : part.response === "readoff" ? "value of y" : undefined}
              style={{ marginTop: 4, width: "100%" }} />
          )}
          {part.method && (
            <input className="input" value={working[index] ?? ""} onChange={(event) => setWork(index, event.target.value)} disabled={disabled}
              data-offline-structured-working={part.id} placeholder={part.method.prompt} style={{ marginTop: 6, width: "100%" }} />
          )}
        </div>
      ))}

      {!gaps && !matching && !ordering && !item.diagram && !structured && (
        <input className="input" value={answers[0] ?? ""} onChange={(event) => setAnswer(0, event.target.value)} disabled={disabled}
          data-offline-short-answer={item.id} style={{ marginTop: 8, width: "100%" }} />
      )}

      <div style={{ marginTop: 10 }}>
        <button type="button" className="btn" onClick={() => void submit()} disabled={disabled || !started} data-offline-assessment-submit={item.id}>
          {busy ? "Marking…" : saved ? "Submitted" : "Check this assessment"}
        </button>
        {!saved && <span className="small muted" style={{ marginLeft: 8 }}>Marked on this device; the work is queued until it can sync.</span>}
      </div>

      {error && <p className="small" role="alert" style={{ color: "var(--margin-red)", marginTop: 6 }}>{error}</p>}

      {saved && (
        <div className="note" style={{ marginTop: 8 }} data-offline-assessment-result={item.id}>
          <b>
            {saved.marks === null || saved.awarded === null
              ? saved.correct ? "✓ Correct" : "Not yet"
              : `${saved.awarded} / ${saved.marks}`}
          </b>{" "}
          <span className="small">
            {saved.status === "synced" ? "Synced — recorded on the server." : saved.status === "refused" ? "Refused by the server; not recorded." : "Local only — saved on this device, not yet confirmed by the server."}
          </span>
          {saved.parts?.map((part) => (
            <ul key={part.partId} className="small muted" style={{ marginTop: 6 }}>
              {part.criteria.map((criterion) => (
                <li key={criterion.id}><span aria-hidden="true">{criterion.met ? "✓" : "✗"}</span> {criterion.label} — {criterion.awarded}/{criterion.marks}. {criterion.why}</li>
              ))}
            </ul>
          ))}
          <p className="small" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{item.modelAnswer}</p>
          <ul className="small muted" style={{ marginTop: 4 }}>{item.marking.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

export default function OfflineAuthoredAssessment({
  pack,
  draft,
  onSubmit,
}: {
  pack: OfflinePack;
  draft: { answers: Record<string, OfflineAnswer> } | null;
  onSubmit: (item: AssessmentItem, mark: OfflineMark, response: string[], working: string[]) => void;
}) {
  const items = pack.assessments ?? [];
  if (items.length === 0) return null;
  return (
    <section style={{ marginTop: 20 }} data-offline-authored-assessment>
      <p className="eyebrow">The lesson&apos;s own assessment</p>
      <p className="small note">
        These keyed items are marked on this device with the same rules as the online lesson.
        Written responses that need a teacher, and code that needs a runner, are not included;
        use the printable worksheet for those.
      </p>
      {items.map((item) => (
        <OfflineItem
          key={item.id}
          pack={pack}
          item={item}
          saved={draft?.answers[item.id]}
          onSubmit={onSubmit}
        />
      ))}
    </section>
  );
}
