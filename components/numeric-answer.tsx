"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE ANSWER BOX — the control for a question that is not multiple choice.
//
// Until this existed every question on the platform was four printed options,
// because `Question` had only `choices` and grading was an index comparison
// (audit §4.3). A learner who can compute 0.75 was being asked to RECOGNISE it
// among four strings — a different, lesser achievement, and the reason the
// brief's whole response-type list read as unimplemented.
//
// This is the one control that asks a learner to PRODUCE the answer. It is a
// plain <input> with an explicit inputMode so a phone shows a number pad, an
// aria-label so a screen reader says what it is, and a visible unit so "12" is
// never ambiguous between metres and minutes. The grading stays server-side
// (the number never leaves the browser as a verdict) and the parsing rule lives
// in lib/answer.ts, shared with the server, so the box cannot accept something
// the grader will refuse.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { parseNumericInput } from "@/lib/answer";

export interface NumericAnswerProps {
  /** What the answer is in, shown beside the box ("cm", "mol", "J"). */
  unit?: string;
  /** Disabled once graded or while a submission is in flight. */
  disabled?: boolean;
  /** Submitted value, or null when the box is empty/not a number. */
  onSubmit: (raw: string) => void;
  /** Labels, passed in so the component carries no i18n dependency of its own. */
  label: string;
  checkLabel: string;
  /** Shown when the learner presses Check with nothing usable typed. */
  emptyHint?: string;
}

export default function NumericAnswer({
  unit, disabled, onSubmit, label, checkLabel, emptyHint,
}: NumericAnswerProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  // The box hedged: a letter in a number box used to be POSTed and come back as
  // a raw server string ("bad request"). It is checked HERE with the SAME rule
  // the server grades by (lib/answer.ts), so the box cannot accept something the
  // grader will refuse — which is what this component's own header always
  // claimed and did not do.
  const [unusable, setUnusable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the box when it appears: a learner who has just read the question
  // should not have to hunt for where to answer it.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const empty = value.trim() === "";

  return (
    <form
      className="numeric-answer"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        setTouched(true);
        if (empty) return;
        if (parseNumericInput(value, unit) === null) { setUnusable(true); return; }
        setUnusable(false);
        onSubmit(value);
      }}
    >
      <label className="numeric-field">
        <span className="visually-small numeric-label">{label}</span>
        <span className="numeric-row">
          <input
            ref={inputRef}
            className="numeric-input"
            // A number pad on touch devices, without forbidding the fraction or
            // thousands separator lib/answer.ts deliberately accepts.
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-label={label}
            disabled={disabled}
            value={value}
            onChange={(e) => { setValue(e.target.value); setUnusable(false); }}
          />
          {unit && <span className="numeric-unit" aria-hidden="true">{unit}</span>}
        </span>
      </label>
      {touched && (empty || unusable) && emptyHint && (
        <p className="small numeric-empty" role="status">{emptyHint}</p>
      )}
      <button type="submit" className="btn" disabled={disabled || empty}>
        {checkLabel}
      </button>
    </form>
  );
}
