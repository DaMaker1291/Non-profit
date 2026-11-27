"use client";

// A FRACTION AS A POSITION, not only as a shaded region.
//
// The bar above the line answers "what does 3/8 mean"; the marker on the line
// answers "where is it, and which side of a half" — the question the research says
// predicts whether a learner misapplies whole-number order. The two are drawn
// together on purpose: the learner changes the cut, the pieces shrink, and the
// marker moves, so the sentence and the picture cannot say different things.
//
// No animation, no scoring, no external assets. Native range inputs and buttons,
// and every sentence is computed in lib/fraction-models.ts.

import { useId, useState } from "react";
import { readFractionLine, compareFractions } from "@/lib/fraction-models";

const W = 340;
const BAR_Y = 14;
const BAR_H = 34;
const LINE_Y = 104;
const X0 = 30;
const X1 = 310;

export function FractionLineModel() {
  const [den, setDen] = useState(8);
  const [num, setNum] = useState(3);
  const id = useId();
  const reading = readFractionLine(num, den);
  const comparison = compareFractions(3, 4, 5, 8);

  const width = (X1 - X0) / den;
  const markerX = X0 + (X1 - X0) * reading.position;
  const halfX = X0 + (X1 - X0) / 2;

  const setCut = (next: number) => {
    const clamped = Math.min(12, Math.max(2, next));
    setDen(clamped);
    setNum((current) => Math.min(current, clamped));
  };

  return (
    <section className="model-card fraction-line-model" aria-labelledby={`${id}-h`} data-fraction-line data-fraction={reading.label}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Cut the whole, then find the fraction on the line
      </h3>

      <svg viewBox={`0 0 ${W} 128`} role="img" aria-label={reading.sentence}>
        {/* The bar: the part-whole picture, each piece the same width. */}
        {Array.from({ length: den }, (_, i) => (
          <rect
            key={i}
            x={X0 + i * width + 1}
            y={BAR_Y}
            width={Math.max(1, width - 2)}
            height={BAR_H}
            rx={2}
            className={i < num ? "fl-on" : "fl-off"}
          />
        ))}
        <text x={X0} y={BAR_Y - 2} className="cm-label">0</text>
        <text x={X1} y={BAR_Y - 2} textAnchor="end" className="cm-label">1 whole</text>

        {/* The line: the same fraction as a position between 0 and 1. */}
        <line x1={X0} y1={LINE_Y} x2={X1} y2={LINE_Y} className="fl-axis" />
        <line x1={X0} y1={LINE_Y - 6} x2={X0} y2={LINE_Y + 6} className="fl-tick" />
        <line x1={X1} y1={LINE_Y - 6} x2={X1} y2={LINE_Y + 6} className="fl-tick" />
        {/* The half-way benchmark, because comparing with 1/2 needs no common denominator. */}
        <line x1={halfX} y1={LINE_Y - 10} x2={halfX} y2={LINE_Y + 10} className="fl-half" />
        <text x={halfX} y={LINE_Y + 24} textAnchor="middle" className="cm-label">1/2</text>
        <circle cx={markerX} cy={LINE_Y} r={6} className="fl-marker" />
        <text x={markerX} y={LINE_Y - 14} textAnchor="middle" className="cm-label">
          {reading.label}
        </text>
      </svg>

      <p className="small" aria-live="polite" style={{ margin: 0 }} data-fraction-line-readout>
        {reading.sentence}
      </p>

      <div className="cm-controls" role="group" aria-label="Change the fraction">
        <button type="button" className="btn small" onClick={() => setCut(den - 1)} disabled={den <= 2}>
          Cut into fewer pieces
        </button>
        <button type="button" className="btn small" onClick={() => setCut(den + 1)} disabled={den >= 12}>
          Cut into more pieces
        </button>
        <button type="button" className="btn small" onClick={() => setNum(Math.max(0, num - 1))} disabled={num <= 0}>
          One piece fewer
        </button>
        <button type="button" className="btn small" onClick={() => setNum(Math.min(den, num + 1))} disabled={num >= den}>
          One piece more
        </button>
      </div>

      <label className="small" htmlFor={`${id}-den`}>
        Pieces the whole is cut into: <b>{den}</b>
        <input
          id={`${id}-den`}
          type="range"
          min={2}
          max={12}
          step={1}
          value={den}
          onChange={(e) => setCut(Number(e.target.value))}
        />
      </label>
      <label className="small" htmlFor={`${id}-num`}>
        Pieces taken: <b>{num}</b>
        <input
          id={`${id}-num`}
          type="range"
          min={0}
          max={den}
          step={1}
          value={num}
          onChange={(e) => setNum(Math.min(den, Number(e.target.value)))}
        />
      </label>

      <p className="small" style={{ margin: 0 }} data-fraction-compare>
        <b>3/4 and 5/8:</b> {comparison.sentence}
      </p>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: set the cut to 4, then to 8. The piece gets smaller as the number
        underneath gets bigger — which is why 1/8 is less than 1/4. Then move the
        marker past 1/2 and watch the sentence change.
      </p>
    </section>
  );
}
