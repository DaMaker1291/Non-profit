"use client";

// WHY THE BOTTOMS ARE NOT ADDED — shown as an amount, not asserted as a rule.
//
// The learner sets two fractions. The model renames both in the smallest shared
// piece size and shades the sum; beside it, the "add the tops and the bottoms"
// answer is drawn at its own size, so a learner can see that 2/5 is less than 1/2
// — which no sum of 1/2 and 1/3 can be. The arithmetic comes from
// lib/fraction-models.ts, so the sentence and the shading cannot disagree.
//
// No animation and no external assets: native sliders and buttons, plus a live
// readout for screen readers.

import { useId, useState } from "react";
import { addFractions, fractionLabel } from "@/lib/fraction-models";

const W = 340;
const X0 = 62;
const X1 = 330;
const ROW_H = 22;

function Bar({
  y,
  numerator,
  denominator,
  className,
  label,
}: {
  y: number;
  numerator: number;
  denominator: number;
  className: string;
  label: string;
}) {
  const width = (X1 - X0) / denominator;
  return (
    <g>
      <text x={X0 - 6} y={y + ROW_H - 6} textAnchor="end" className="cm-label">
        {label}
      </text>
      {Array.from({ length: denominator }, (_, i) => (
        <rect
          key={i}
          x={X0 + i * width + 1}
          y={y}
          width={Math.max(1, width - 2)}
          height={ROW_H}
          rx={2}
          className={i < numerator ? className : "fo-off"}
        />
      ))}
    </g>
  );
}

export function FractionOpsModel() {
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(1);
  const [d, setD] = useState(3);
  const id = useId();
  const reading = addFractions(a, b, c, d);
  const sumWidth = (X1 - X0) * Math.min(1, reading.correctValue);
  const wrongWidth = (X1 - X0) * Math.min(1, reading.wrongValue);

  return (
    <section className="model-card fraction-ops-model" aria-labelledby={`${id}-h`} data-fraction-ops data-fraction-sum={reading.sumLabel}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Add two fractions by making the pieces the same size
      </h3>

      <svg viewBox={`0 0 ${W} 178`} role="img" aria-label={reading.sentence}>
        <Bar y={8} numerator={a} denominator={b} className="fo-left" label={fractionLabel(a, b)} />
        <Bar y={38} numerator={c} denominator={d} className="fo-right" label={fractionLabel(c, d)} />
        <Bar
          y={78}
          numerator={reading.sumNumerator}
          denominator={reading.commonDenominator}
          className="fo-sum"
          label={`sum`}
        />
        {/* The wrong answer, drawn to its own scale, so it can be compared. */}
        <text x={X0 - 6} y={148} textAnchor="end" className="cm-label">
          {reading.wrongLabel}
        </text>
        <rect x={X0} y={134} width={Math.max(1, wrongWidth)} height={ROW_H} rx={2} className="fo-wrong" />
        <line x1={X0} y1={166} x2={X1} y2={166} className="fo-scale" />
        <text x={X0} y={176} className="cm-label">0</text>
        <text x={X1} y={176} textAnchor="end" className="cm-label">1</text>
        {sumWidth > 0 && <line x1={X0 + sumWidth} y1={72} x2={X0 + sumWidth} y2={170} className="fo-guide" />}
      </svg>

      <p className="small" aria-live="polite" style={{ margin: 0 }} data-fraction-ops-readout>
        {reading.sentence}
      </p>

      <div className="cm-controls" role="group" aria-label="Change the first fraction">
        <button type="button" className="btn small" onClick={() => setB(Math.max(2, b - 1))} disabled={b <= 2}>
          First: fewer pieces
        </button>
        <button type="button" className="btn small" onClick={() => setB(Math.min(12, b + 1))} disabled={b >= 12}>
          First: more pieces
        </button>
        <button type="button" className="btn small" onClick={() => setA(Math.max(0, a - 1))} disabled={a <= 0}>
          First: one fewer
        </button>
        <button type="button" className="btn small" onClick={() => setA(Math.min(b, a + 1))} disabled={a >= b}>
          First: one more
        </button>
      </div>

      <div className="cm-controls" role="group" aria-label="Change the second fraction">
        <button type="button" className="btn small" onClick={() => setD(Math.max(2, d - 1))} disabled={d <= 2}>
          Second: fewer pieces
        </button>
        <button type="button" className="btn small" onClick={() => setD(Math.min(12, d + 1))} disabled={d >= 12}>
          Second: more pieces
        </button>
        <button type="button" className="btn small" onClick={() => setC(Math.max(0, c - 1))} disabled={c <= 0}>
          Second: one fewer
        </button>
        <button type="button" className="btn small" onClick={() => setC(Math.min(d, c + 1))} disabled={c >= d}>
          Second: one more
        </button>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: make the two bottoms 2 and 3, then check the wrong answer against
        1/2. It is smaller than a number you started with, so it cannot be the sum —
        and that is a test you can use on any fraction addition.
      </p>
    </section>
  );
}
