"use client";

import { useId, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AN AUTHORED PROMPT THAT ASKS BEFORE IT TELLS.
//
// The defect this exists for: the authored lesson's prior-knowledge checks and
// guided-practice items were `<details>` disclosures. A learner could open the
// model answer without committing to one of their own, so a section headed
// "Let's do these together" was read, not attempted — a worked example wearing
// guided practice's heading.
//
// This component makes the attempt a precondition of the reveal. The learner
// types an answer, presses Check, and only then sees the authored answer and
// feedback. The hint is separate and still opt-in, because a hint is help and
// the answer is the thing being withheld.
//
// WHAT IT IS NOT. Nothing here is marked, scored or written to the record. The
// authored answers are prose ("x = 3", "the denominator is 12") and comparing a
// learner's sentence to them would mark correct reasoning wrong — the same
// reason lib/peer-review.ts scores nothing. Recorded retrieval is the generated
// serve on this page, which has a real key, a tolerance and an evidence trail.
// Calling an unmarked self-check "retrieval practice" is exactly the confusion
// this project's content strategy forbids.
//
// English-only, for the same reason the authored lesson is: the contract has no
// complete translation record, so this is rendered only when the learner's
// teaching language is English.
// ─────────────────────────────────────────────────────────────────────────────

export default function AttemptFirst({
  id,
  prompt,
  answer,
  hint,
  correct,
  incorrect,
  hintLabel = "A hint, not the answer",
  checkLabel = "Check my answer",
  answerLabel = "The answer",
}: {
  /** Stable per item, so a label points at the right input. */
  id: string;
  prompt: string;
  /** The authored answer, revealed only after an attempt. */
  answer: string;
  /** Opt-in help. Never contains the answer. */
  hint?: string;
  /** Authored feedback, shown with the answer. */
  correct?: string;
  incorrect?: string;
  hintLabel?: string;
  checkLabel?: string;
  answerLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState(false);
  const inputId = useId();
  const attempted = draft.trim() !== "";

  return (
    <div className="attempt-first" data-attempt-first={id} data-attempted={checked ? "true" : "false"}>
      <p className="reading" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{prompt}</p>

      {hint && !checked && (
        <details className="authored-hint" style={{ marginTop: 8 }}>
          <summary className="reading small">{hintLabel}</summary>
          <p className="reading lesson-text small" style={{ marginTop: 6 }}>{hint}</p>
        </details>
      )}

      <label className="reading small" htmlFor={inputId} style={{ display: "block", marginTop: 10 }}>
        Your answer
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <input
          id={inputId}
          className="input"
          value={draft}
          disabled={checked}
          onChange={(event) => setDraft(event.target.value)}
          style={{ maxWidth: 320 }}
        />
        {/* THE GATE: no answer typed, no solution revealed. Disabled rather than
            hidden so the learner can see what is being asked of them. */}
        <button
          type="button"
          className="btn small"
          disabled={!attempted || checked}
          onClick={() => setChecked(true)}
        >
          {checkLabel}
        </button>
      </div>

      {checked && (
        <div className="note" style={{ marginTop: 10 }} role="status">
          <strong>{answerLabel}</strong>{" "}
          <span className="reading" style={{ whiteSpace: "pre-wrap" }}>{answer}</span>
          {correct && <p className="reading small muted" style={{ margin: "6px 0 0" }}>{correct}</p>}
          {incorrect && <p className="reading small muted" style={{ margin: "4px 0 0" }}>{incorrect}</p>}
          <p className="reading small muted" style={{ margin: "8px 0 0" }}>
            Compare your working with this. Nothing here is marked or recorded.
          </p>
        </div>
      )}
    </div>
  );
}
