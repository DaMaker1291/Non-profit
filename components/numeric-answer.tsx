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
  /** The served question this box belongs to. A NEW id means a NEW question,
   *  and the box starts empty — see the reset below. */
  questionId: string;
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
  questionId, unit, disabled, onSubmit, label, checkLabel, emptyHint,
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

  // ── A NEW QUESTION STARTS WITH AN EMPTY BOX ─────────────────────────────
  //
  // Reported from the product: "in the practice part of each topic, the question
  // field doesn't clear after every input". It did not, and the reason was React
  // rather than arithmetic — the box is rendered at the same place in the tree
  // for every question, so the SAME component instance survived the swap and
  // kept its `value`. A learner who typed 0.75 into `0.3 + 0.45` met the next
  // item with 0.75 already in the field, one press of Check from being marked as
  // their answer to a question they had never read. That is worse than a
  // cosmetic bug: it manufactures an attempt the learner did not make.
  //
  // The rule is the one `components/work-sheet.tsx` already follows, and for the
  // same reason: an answer and a RETRY are the same question (so the box keeps
  // what was typed while the feedback is read, and a retry is one edit away),
  // while a NEW question gets a fresh one. Guarding on a ref rather than on
  // `value` is what survives StrictMode's double-invoked effects without wiping
  // the box the learner is typing in.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; inputRef.current?.focus(); return; }
    setValue("");
    setTouched(false);
    setUnusable(false);
    // The next question is the thing to answer now, so the caret belongs here
    // again — a learner should not have to hunt for the box once per item.
    inputRef.current?.focus();
  }, [questionId]);

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
