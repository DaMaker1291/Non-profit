"use client";

// ─────────────────────────────────────────────────────────────────────────────
// A POINT IS TYPED AS TWO NUMBERS, IN ORDER.
//
// "Which coordinate pair is this?" among four printed pairs measures
// recognition; asking for x and y measures whether the learner can read a point
// off the grid. The order is the idea the item tests (a swap is the classic
// misconception, `axis-swap`), so the two fields are labelled with the symbols
// the lesson uses and never with a single box that would accept "(3, 5)" as an
// unexamined string.
//
// Both fields accept decimals and a leading minus — a point at (2.5, −1) is a
// point. Validation is only "is this a number"; correctness is the server's.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

export interface PairAnswerProps {
  questionId: string;
  disabled?: boolean;
  label: string;
  checkLabel: string;
  emptyHint?: string;
  onSubmit: (given: { x: string; y: string }) => void;
}

const NUMBER = /^-?\d+(?:\.\d+)?$/;

export default function PairAnswer({
  questionId, disabled, label, checkLabel, emptyHint, onSubmit,
}: PairAnswerProps) {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [touched, setTouched] = useState(false);
  const xRef = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) { mounted.current = true; xRef.current?.focus(); return; }
    setX("");
    setY("");
    setTouched(false);
    xRef.current?.focus();
  }, [questionId]);

  const xs = x.trim();
  const ys = y.trim();
  const hasBoth = xs !== "" && ys !== "";
  const valid = NUMBER.test(xs) && NUMBER.test(ys);

  return (
    <form
      className="pair-answer"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        setTouched(true);
        if (!hasBoth || !valid) return;
        onSubmit({ x: xs, y: ys });
      }}
    >
      <fieldset className="fraction-field">
        <legend className="visually-small numeric-label">{label}</legend>
        <div className="pair-fields">
          <label className="pair-coordinate">
            <span className="pair-axis" aria-hidden="true">x =</span>
            <input
              ref={xRef}
              className="pair-input"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${label} x`}
              disabled={disabled}
              value={x}
              onChange={(event) => setX(event.target.value)}
            />
          </label>
          <label className="pair-coordinate">
            <span className="pair-axis" aria-hidden="true">y =</span>
            <input
              className="pair-input"
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              aria-label={`${label} y`}
              disabled={disabled}
              value={y}
              onChange={(event) => setY(event.target.value)}
            />
          </label>
        </div>
      </fieldset>
      {touched && (!hasBoth || !valid) && (
        <p className="small numeric-empty" role="status">{emptyHint}</p>
      )}
      <button type="submit" className="btn" disabled={disabled || !hasBoth}>
        {checkLabel}
      </button>
    </form>
  );
}
