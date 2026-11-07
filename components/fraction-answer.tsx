"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A FRACTION IS TYPED AS A FRACTION.
//
// The numeric box accepts "1/2" as a convenience, but an item whose answer IS a
// fraction should ask for the two numbers it is made of. A learner who writes
// 3 over 4 has produced the value; a learner who picks "3/4" among four strings
// has recognised it. The distinction is the whole reason this control exists.
//
// The bar between the fields is not decoration: it is what makes the top number
// the numerator and the bottom the denominator without a sentence saying so.
// Both fields are whole-number (`inputMode="numeric"`), and the denominator is
// refused at zero HERE with the same rule the server grades by (lib/answer.ts),
// so the box cannot accept something the grader will refuse.
//
// Nothing here decides correctness. The numbers leave as text and the server
// marks them, exactly as the number box does.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

export interface FractionAnswerProps {
  questionId: string;
  disabled?: boolean;
  label: string;
  checkLabel: string;
  emptyHint?: string;
  onSubmit: (given: { numerator: string; denominator: string }) => void;
}

const WHOLE = /^-?\d+$/;

export default function FractionAnswer({
  questionId, disabled, label, checkLabel, emptyHint, onSubmit,
}: FractionAnswerProps) {
  const [numerator, setNumerator] = useState("");
  const [denominator, setDenominator] = useState("");
  const [touched, setTouched] = useState(false);
  const topRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  // A NEW QUESTION STARTS EMPTY — the same rule components/numeric-answer.tsx
  // follows, and for the same reason: the control survives the question swap in
  // the React tree, and a stale fraction is an attempt the learner never made.
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; topRef.current?.focus(); return; }
    setNumerator("");
    setDenominator("");
    setTouched(false);
    topRef.current?.focus();
  }, [questionId]);

  const num = numerator.trim();
  const den = denominator.trim();
  const hasBoth = num !== "" && den !== "";
  const valid = WHOLE.test(num) && WHOLE.test(den) && Number(den) !== 0;

  return (
    <form
      className="fraction-answer"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        setTouched(true);
        if (!hasBoth || !valid) return;
        onSubmit({ numerator: num, denominator: den });
      }}
    >
      <fieldset className="fraction-field">
        <legend className="visually-small numeric-label">{label}</legend>
        <div className="fraction-stack">
          <input
            ref={topRef}
            className="fraction-input"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            disabled={disabled}
            value={numerator}
            onChange={(event) => setNumerator(event.target.value)}
          />
          <span className="fraction-bar" aria-hidden="true" />
          <input
            className="fraction-input"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            disabled={disabled}
            value={denominator}
            onChange={(event) => setDenominator(event.target.value)}
          />
        </div>
      </fieldset>
      {touched && (!hasBoth || !valid) && (
        <p className="small numeric-empty" role="status">
          {emptyHint}
          {den !== "" && Number(den) === 0 ? " ≠ 0" : ""}
        </p>
      )}
      <button type="submit" className="btn" disabled={disabled || !hasBoth}>
        {checkLabel}
      </button>
    </form>
  );
}
