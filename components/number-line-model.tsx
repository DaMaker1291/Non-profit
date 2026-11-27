"use client";

// A NUMBER LINE YOU MOVE — the representation, not a picture of one.
//
// The belief this exists for: on a number line, further from zero is BIGGER — which
// is true on the right and false on the left, and is the single most common reason a
// learner says −5 > −2 ("five is more than two"). The control moves a marker in
// STEPS that the concept chooses (ones for integers, tenths for decimals, tens for
// place value), and the sentence is re-printed after every move, so the direction and
// the order are both visible at once.
//
// No images, no animation, no external assets: one SVG line, native buttons, and an
// aria-live sentence so the picture is never the only carrier of the answer.

import { useId, useState } from "react";
import { NUMBER_LINE_BY_CONCEPT, readNumberLine } from "@/lib/pilot-models";

export function NumberLineModel({ conceptId }: { conceptId: string }) {
  const spec = NUMBER_LINE_BY_CONCEPT[conceptId] ?? NUMBER_LINE_BY_CONCEPT.negatives;
  const [value, setValue] = useState(spec.start);
  const id = useId();
  const reading = readNumberLine(value, spec);
  const span = spec.max - spec.min;
  const pos = Math.min(1, Math.max(0, (reading.value - spec.min) / span));
  const x = 20 + pos * 300;
  const zero = 20 + ((0 - spec.min) / span) * 300;

  const move = (by: number) => () =>
    setValue((current) => Math.min(spec.max, Math.max(spec.min, Number((current + by * spec.step).toFixed(4)))));

  // Ticks: at most 21, so the drawing stays readable at 320 px.
  const tickCount = Math.min(21, Math.round(span / spec.step) + 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => spec.min + (span / Math.max(1, tickCount - 1)) * i);

  return (
    <section className="model-card number-line-model" aria-labelledby={`${id}-h`} data-number-line={conceptId} data-number-value={reading.value}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Move along the number line
      </h3>

      <svg viewBox="0 0 340 90" role="img" aria-label={reading.sentence}>
        <line x1={20} y1={50} x2={320} y2={50} className="nl-axis" />
        {ticks.map((tick, i) => {
          const tx = 20 + ((tick - spec.min) / span) * 300;
          const major = Math.abs(tick) < 1e-9 || i % 5 === 0;
          return (
            <g key={tick}>
              <line x1={tx} y1={major ? 42 : 45} x2={tx} y2={major ? 58 : 55} className="nl-tick" />
              {major && (
                <text x={tx} y={72} textAnchor="middle" className="cm-label">
                  {readNumberLine(tick, spec).label}
                </text>
              )}
            </g>
          );
        })}
        {spec.min < 0 && spec.max > 0 && <line x1={zero} y1={34} x2={zero} y2={66} className="nl-zero" />}
        <circle cx={x} cy={50} r={7} className="nl-marker" />
        <text x={x} y={28} textAnchor="middle" className="cm-label">
          {reading.label}
        </text>
      </svg>

      <p className="small" aria-live="polite" style={{ margin: 0 }} data-number-line-readout>
        {reading.sentence}
      </p>

      <div className="cm-controls" role="group" aria-label="Move the marker">
        <button type="button" className="btn small" onClick={move(-1)} disabled={reading.value <= spec.min}>
          {`Back one ${spec.unit}`}
        </button>
        <button type="button" className="btn small" onClick={move(1)} disabled={reading.value >= spec.max}>
          {`Forward one ${spec.unit}`}
        </button>
        <button type="button" className="btn small" onClick={() => setValue(spec.start)}>
          Start again
        </button>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: step left past zero and keep going. The numbers get heavier, not
        bigger — further from zero on the LEFT is smaller. That is why −5 is less than
        −2, even though 5 is more than 2.
      </p>
    </section>
  );
}
