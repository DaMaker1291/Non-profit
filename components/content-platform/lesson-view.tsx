"use client";

import { useState } from "react";
import MathText from "@/components/math-text";
import { FigureGraphic } from "@/components/question-figure";
import MathField from "@/components/math-field";
import CodeLab from "@/components/code-lab";
import LabelDiagram from "@/components/label-diagram";
import { gradeNumeric, parseNumericInput } from "@/lib/answer";
import { markMathExpression } from "@/lib/math-expression";
import type {
  Assessment,
  CalculationBlock,
  CodeAssessment,
  LabelAssessment,
  LabelDiagramBlock,
  LessonBlock,
  LessonDocument,
  MathExpressionBlock,
  MathExpressionAssessment,
  NumericAssessment,
} from "@/lib/content-platform/types";

const ACTIVITY_KINDS = new Set(["calculation", "math_expression", "label_diagram", "code_lab", "link"]);

function assessmentFor(doc: LessonDocument, blockId: string): Assessment | null {
  return doc.assessments.find((a) => a.blockId === blockId) ?? null;
}

function ReviewBanner({ doc }: { doc: LessonDocument }) {
  const copy: Record<LessonDocument["review"]["state"], string> = {
    draft: "Draft — not reviewed by a subject teacher.",
    "machine-checked": "Machine-checked — no subject teacher has reviewed it.",
    "subject-reviewed": `Subject-reviewed${doc.review.reviewedBy ? ` by ${doc.review.reviewedBy}` : ""}.`,
    approved: `Approved${doc.review.reviewedBy ? ` by ${doc.review.reviewedBy}` : ""}${doc.review.reviewedAt ? ` on ${doc.review.reviewedAt}` : ""}.`,
  };
  return (
    <div
      className="card soft"
      data-lesson-review={doc.review.state}
      role="note"
      style={{ marginBottom: 18, borderLeft: "4px solid var(--amber, #a15c00)" }}
    >
      <p className="eyebrow" style={{ margin: 0 }}>Content platform · {doc.review.state}</p>
      <p className="small" style={{ margin: "6px 0 0" }}>{copy[doc.review.state]}</p>
      {doc.review.note && <p className="small muted" style={{ margin: "4px 0 0" }}>{doc.review.note}</p>}
    </div>
  );
}

function NumericActivity({ block, assessment }: { block: CalculationBlock; assessment: NumericAssessment }) {
  const [value, setValue] = useState("");
  const [marked, setMarked] = useState<"idle" | "correct" | "wrong" | "invalid">("idle");
  function check() {
    const parsed = parseNumericInput(value, assessment.unit ?? block.unit);
    if (parsed === null) { setMarked("invalid"); return; }
    setMarked(gradeNumeric(parsed, assessment.answer, assessment.tolerance) ? "correct" : "wrong");
  }
  return (
    <section className="card" data-calculation-activity style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Calculation</p>
      <p className="small" style={{ margin: "6px 0 10px" }}>{block.prompt}</p>
      {block.hint && <p className="small muted" style={{ margin: "0 0 8px" }}>{block.hint}</p>}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="visually-small" htmlFor={`calc-${block.id}`}>Answer</label>
        <input
          id={`calc-${block.id}`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => { setValue(e.target.value); setMarked("idle"); }}
          style={{ width: 150, padding: "10px 12px", border: "1px solid var(--line, #d8ddd8)", borderRadius: 8 }}
        />
        {block.unit && <span className="small muted">{block.unit}</span>}
        <button type="button" className="btn" onClick={check}>Check</button>
        <span className="small" role="status" aria-live="polite">
          {marked === "correct" ? "✓ correct" : marked === "wrong" ? "Not yet." : marked === "invalid" ? "Enter a number." : "Practice only — not recorded."}
        </span>
      </div>
      {marked === "correct" || marked === "wrong" ? (
        <p className="small" style={{ margin: "10px 0 0" }}>{assessment.explanation}</p>
      ) : null}
    </section>
  );
}

function MathActivity({ block, assessment }: { block: MathExpressionBlock; assessment: MathExpressionAssessment }) {
  const [value, setValue] = useState("");
  const [marked, setMarked] = useState<"idle" | "correct" | "wrong" | "unreadable">("idle");
  function check() {
    const result = markMathExpression(value, assessment.accepted);
    if (result.reason === "unreadable") { setMarked("unreadable"); return; }
    setMarked(result.correct ? "correct" : "wrong");
  }
  return (
    <section className="card" data-math-activity style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Mathematical response</p>
      <p className="small" style={{ margin: "6px 0 10px" }}>{block.prompt}</p>
      {block.hint && <p className="small muted" style={{ margin: "0 0 8px" }}>{block.hint}</p>}
      <MathField value={value} onChange={(next) => { setValue(next); setMarked("idle"); }} label={block.prompt} />
      <div className="actions" style={{ marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn" onClick={check}>Check</button>
        <span className="small" role="status" aria-live="polite">
          {marked === "correct" ? "✓ equivalent" : marked === "wrong" ? "Not equivalent yet." : marked === "unreadable" ? "That expression could not be read." : "Practice only — not recorded."}
        </span>
      </div>
      {marked !== "idle" && <p className="small" style={{ margin: "10px 0 0" }}>{assessment.explanation}</p>}
    </section>
  );
}

function CodeActivity({ block, assessment }: { block: Extract<LessonBlock, { kind: "code_lab" }>; assessment: CodeAssessment }) {
  return <CodeLab starterCode={block.starterCode} timeoutMs={block.timeoutMs} tests={assessment.tests} prompt={block.prompt} />;
}

function LabelActivity({ block, assessment }: { block: LabelDiagramBlock; assessment: LabelAssessment }) {
  return <LabelDiagram block={block} answers={assessment.answers} explanation={assessment.explanation} />;
}

function SourceNotes({ doc }: { doc: LessonDocument }) {
  return (
    <section className="card soft" style={{ marginBottom: 18 }} aria-label="Sources">
      <p className="eyebrow" style={{ margin: 0 }}>Sources and permissions</p>
      <ul className="small" style={{ margin: "8px 0 0 18px" }}>
        {doc.sources.map((s) => (
          <li key={s.id} style={{ marginBottom: 4 }}>
            {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : <strong>{s.title}</strong>}
            {" "}<span className="muted">({s.use})</span>
            {s.attribution ? ` — ${s.attribution}` : ""}
            {s.licence ? `. ${s.licence}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

function BlockView({ doc, block }: { doc: LessonDocument; block: LessonBlock }) {
  const assessment = assessmentFor(doc, block.id);
  switch (block.kind) {
    case "explanation":
      return (
        <section className="card" style={{ marginBottom: 18 }}>
          {block.title && <p className="eyebrow" style={{ margin: 0 }}>{block.title}</p>}
          {block.paragraphs.map((p, i) => <p key={i} className="reading lesson-text" style={{ marginTop: i === 0 ? 8 : 10 }}>{p}</p>)}
        </section>
      );
    case "formula":
      return (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Relationship</p>
          <p className="reading" style={{ fontSize: "1.25rem", margin: "8px 0 0" }}><MathText text={block.expression} /></p>
          {block.note && <p className="small muted" style={{ margin: "6px 0 0" }}>{block.note}</p>}
        </section>
      );
    case "worked_example":
      return (
        <section className="card" style={{ marginBottom: 18 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Worked example</p>
          <p className="small" style={{ margin: "6px 0" }}>{block.prompt}</p>
          <ol className="small" style={{ margin: "8px 0 0 18px" }}>{block.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}</ol>
          <p className="small" style={{ margin: "8px 0 0" }}><strong>Answer:</strong> {block.answer}</p>
        </section>
      );
    case "diagram":
      return (
        <figure className="lesson-figure" data-figure={block.figure.kind}>
          <FigureGraphic spec={block.figure} />
          <figcaption className="small muted reading">{block.caption}</figcaption>
        </figure>
      );
    case "calculation":
      return assessment?.kind === "numeric" ? <NumericActivity block={block} assessment={assessment} /> : null;
    case "math_expression":
      return assessment?.kind === "math_expression" ? <MathActivity block={block} assessment={assessment} /> : null;
    case "label_diagram":
      return assessment?.kind === "labels" ? <LabelActivity block={block} assessment={assessment} /> : null;
    case "code_lab":
      return assessment?.kind === "code" ? <CodeActivity block={block} assessment={assessment} /> : null;
    case "link":
      return (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow" style={{ margin: 0 }}>External resource</p>
          <p style={{ margin: "6px 0" }}><a href={block.url} target="_blank" rel="noreferrer">{block.title}</a></p>
          <p className="small muted" style={{ margin: 0 }}>{block.note}</p>
        </section>
      );
    case "retrieval":
      return (
        <section className="card soft" style={{ marginBottom: 18 }}>
          <p className="eyebrow" style={{ margin: 0 }}>Retrieval</p>
          <p className="small" style={{ margin: "6px 0" }}>{block.prompt}</p>
          <p className="small muted" style={{ margin: 0 }}>{block.answer}</p>
        </section>
      );
  }
}

export default function LessonView({
  doc,
  activitiesOnly = false,
}: {
  doc: LessonDocument;
  activitiesOnly?: boolean;
}) {
  const blocks = activitiesOnly ? doc.blocks.filter((b) => ACTIVITY_KINDS.has(b.kind)) : doc.blocks;
  return (
    <div data-content-platform-lesson={doc.id}>
      <ReviewBanner doc={doc} />
      {blocks.map((block) => (
        <BlockView key={block.id} doc={doc} block={block} />
      ))}
      <SourceNotes doc={doc} />
    </div>
  );
}
