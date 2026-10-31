"use client";

// A FRACTION YOU CAN CHANGE. The lesson's static pie says "three of four" and
// cannot answer the question a stuck learner actually has: what happens if I cut
// it into more pieces? Here the denominator is a control, so the claim the
// lesson makes in words — a bigger bottom means a smaller piece — happens on
// screen instead of being asserted at them.
//
// Deliberately small: no scoring, no animation, no record. It is a model of the
// idea, and the practice that follows is where the evidence comes from.

import { useId, useState } from "react";

const W = 320;
const H = 56;
const GAP = 2;

export function FractionModel() {
  const [den, setDen] = useState(4);
  const [num, setNum] = useState(3);
  const id = useId();

  // The numerator cannot exceed the denominator: a whole has exactly `den`
  // pieces, and allowing 5/4 in a model of ONE whole would draw a fifth piece
  // that does not exist.
  const shaded = Math.min(num, den);
  const width = (W - GAP * (den - 1)) / den;

  return (
    <section className="fraction-model" aria-labelledby={`${id}-h`} data-fraction-model>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Change the pieces
      </h3>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${shaded} of ${den} equal pieces shaded`}>
        {Array.from({ length: den }, (_, i) => (
          <rect
            key={i}
            x={i * (width + GAP)}
            y={0}
            width={width}
            height={H}
            rx={3}
            className={i < shaded ? "fm-on" : "fm-off"}
          />
        ))}
      </svg>

      {/* The number in words, not only in colour: the bar and this sentence say
          the same thing, so a learner who cannot see the shading still reads it. */}
      <p className="small" aria-live="polite" style={{ margin: 0 }}>
        <b>
          {shaded}/{den}
        </b>{" "}
        — {shaded} of {den} equal pieces.
      </p>

      <label className="small" htmlFor={`${id}-den`}>
        Pieces the whole is cut into: <b>{den}</b>
        <input
          id={`${id}-den`}
          type="range"
          min={2}
          max={12}
          step={1}
          value={den}
          onChange={(e) => setDen(Number(e.target.value))}
        />
      </label>

      <label className="small" htmlFor={`${id}-num`}>
        Pieces shaded: <b>{shaded}</b>
        <input
          id={`${id}-num`}
          type="range"
          min={0}
          max={den}
          step={1}
          value={shaded}
          onChange={(e) => setNum(Number(e.target.value))}
        />
      </label>

      <p className="small muted" style={{ margin: 0 }}>
        Cut the bar into more pieces and each piece gets smaller — that is why 1/8
        is less than 1/4, even though 8 is bigger than 4.
      </p>
    </section>
  );
}
