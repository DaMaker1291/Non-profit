"use client";

// ─────────────────────────────────────────────────────────────────────────────
// LABEL THE DIAGRAM.
//
// The drawing is an authored schematic, not a copied textbook figure: the
// shapes are generic, and every label is a word the lesson already taught. The
// learner chooses the label for each numbered callout, which is a keyboard- and
// screen-reader-operable response even though the picture is visual.
//
// The key stays in the assessment contract and is only consulted when the
// learner presses Check. The activity is local practice: it is deliberately not
// recorded as evidence, so a correction cannot be mistaken for a measured skill.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import type { LabelDiagramBlock } from "@/lib/content-platform/types";

const W = 420;
const H = 280;

function at(percent: number, extent: number): number {
  return (percent / 100) * extent;
}

export default function LabelDiagram({
  block,
  answers,
  explanation,
}: {
  block: LabelDiagramBlock;
  answers: Record<string, string>;
  explanation: string;
}) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState(false);
  const allPicked = block.diagram.parts.every((p) => Boolean(picked[p.id]));
  const correct = block.diagram.parts.filter((p) => picked[p.id] === answers[p.id]).length;

  const marks = block.diagram.parts.map((p) => ({
    ...p,
    x: at(p.x, W),
    y: at(p.y, H),
  }));

  return (
    <section className="card" data-label-diagram style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Label the diagram</p>
      <p className="small" style={{ margin: "6px 0 8px" }}>{block.prompt}</p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="A schematic animal cell with four numbered callouts. The labels are chosen in the list below."
        style={{ width: "100%", maxWidth: 520, height: "auto", display: "block" }}
      >
        <ellipse cx={210} cy={145} rx={158} ry={105} fill="#eef3ee" stroke="var(--line, #9aa9a1)" strokeWidth={3} />
        <ellipse cx={210} cy={145} rx={148} ry={95} fill="#fbfdf9" stroke="var(--line, #9aa9a1)" strokeWidth={1.5} />
        {/* Cytoplasm texture: a few faint dots, not labels. */}
        {[[120, 100], [300, 90], [335, 155], [120, 190], [255, 215]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill="#c6d2c8" />
        ))}
        <circle cx={225} cy={145} r={45} fill="#dfe9df" stroke="#4e6b59" strokeWidth={2} />
        <circle cx={225} cy={145} r={12} fill="#6e8b76" opacity={0.55} />
        <g transform="translate(320 195) rotate(-22)">
          <rect x={-38} y={-15} width={76} height={30} rx={15} fill="#f3e4cf" stroke="#9b7446" strokeWidth={2} />
          <path d="M -24 0 Q -12 -9 0 0 Q 12 9 24 0" fill="none" stroke="#9b7446" strokeWidth={2} />
        </g>
        {marks.map((p, i) => (
          <g key={p.id}>
            <line x1={p.x} y1={p.y} x2={p.x + (p.shape === "nucleus" ? 12 : p.shape === "mitochondrion" ? -14 : 0)} y2={p.y + (p.shape === "membrane" ? 38 : p.shape === "cytoplasm" ? 22 : p.shape === "nucleus" ? 14 : -12)} stroke="#4e6b59" strokeWidth={1.3} strokeDasharray="4 3" />
            <circle cx={p.x} cy={p.y} r={13} fill="#1d3a2f" />
            <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff">{i + 1}</text>
          </g>
        ))}
      </svg>
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {block.diagram.parts.map((p, i) => {
          const state = marked ? (picked[p.id] === answers[p.id] ? "correct" : "wrong") : "idle";
          return (
            <label key={p.id} style={{ display: "grid", gridTemplateColumns: "34px minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
              <span aria-hidden="true" style={{ fontWeight: 700 }}>{i + 1}</span>
              <select
                aria-label={`Label for part ${i + 1}`}
                value={picked[p.id] ?? ""}
                onChange={(e) => { setMarked(false); setPicked((cur) => ({ ...cur, [p.id]: e.target.value })); }}
                style={{ padding: "8px 10px", border: "1px solid var(--line, #d8ddd8)", borderRadius: 8, background: "var(--surface, #fff)" }}
              >
                <option value="" disabled>Choose a label</option>
                {block.diagram.labels.map((label) => <option key={label} value={label}>{label}</option>)}
              </select>
              <span className="small" aria-live="polite" style={{ minWidth: 62 }}>
                {state === "correct" ? "✓ correct" : state === "wrong" ? "✗ try again" : ""}
              </span>
            </label>
          );
        })}
      </div>
      <div className="actions" style={{ marginTop: 10, alignItems: "center" }}>
        <button type="button" className="btn" disabled={!allPicked} onClick={() => setMarked(true)}>Check labels</button>
        <span className="small muted" role="status">
          {marked ? `${correct} of ${block.diagram.parts.length} correct.` : "Practice only — this activity is not recorded."}
        </span>
      </div>
      {marked && (
        <p className="small" role="status" style={{ margin: "10px 0 0" }}>
          {correct === block.diagram.parts.length ? "All four labels are right. " : "Some labels are not right yet. "}
          {explanation}
        </p>
      )}
    </section>
  );
}
