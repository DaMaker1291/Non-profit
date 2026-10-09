"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE SCRATCH SHEET — somewhere to do the working.
//
// WHY IT EXISTS. Every question screen in this product asked for an ANSWER and
// gave nowhere to work. A learner doing long division, rearranging a formula or
// balancing an equation has to hold the whole thing in their head, because a row
// of options and a number box are not a page. This experience is meant to be a
// digital exercise book, and a book you cannot write in is not a book.
//
// The stylesheet had known for a while: `app/globals.css` declared
// `.answer-input` as "Free-text answer field: big enough to read your own
// working in" — and NOTHING in the product ever rendered it. This is that
// field, finally used, and that dead rule is gone.
//
// WHAT IT IS, AND WHAT IT IS NOT. The text is component state and nothing else.
// It is never sent to the server, never written to storage, never read by the
// grader, and it cannot influence the answer, the ledger or the learner model.
// That is a rule rather than a shortcoming — `components/starter-mode.tsx` sets
// the same one for its goal/givens fields — and it is said ON the sheet, in the
// learner's own language, because somebody writing out their thinking deserves
// to know who can see it. A feature that wants to MARK the working (name the
// step that slipped, as the brief's feedback example does) has to go through the
// evidence path like every other claim this product makes; until then nothing
// here pretends to read it.
//
// PER QUESTION, not per page: an answer and a retry are the same piece of paper,
// so working survives a wrong answer, and a NEW question gets a fresh sheet.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";

export interface WorkSheetProps {
  /** The served question this sheet belongs to. A new id is a new sheet. */
  questionId: string;
  label: string;
  placeholder: string;
  /** The sentence that says who can see this. Passed in so the component
   *  carries no dictionary of its own, like NumericAnswer. */
  note: string;
}

export default function WorkSheet({ questionId, label, placeholder, note }: WorkSheetProps) {
  const [text, setText] = useState("");
  // The first render has nothing to clear; every LATER question does. Guarding
  // on the ref rather than on `text` is what makes this survive StrictMode's
  // double-invoked effects without wiping a sheet the learner is writing on.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setText("");
  }, [questionId]);

  // Question ids are content-derived and may contain colons; an id attribute
  // that an assistive technology has to read should be plain.
  const inputId = `work-${questionId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <div className="work-sheet">
      <div className="work-sheet-head">
        <label className="work-sheet-label" htmlFor={inputId}>{label}</label>
        {/* The disclosure, not decoration: it is the whole reason this field can
            exist without a privacy question attached to it. */}
        <span className="work-sheet-note small muted">{note}</span>
      </div>
      <textarea
        id={inputId}
        className="work-paper"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={5}
        spellCheck={false}
        autoComplete="off"
        // Deliberately NOT disabled once the answer is marked: a learner reading
        // the feedback is often still working, and paper does not lock itself.
        // No inputMode either — this is scratch paper, so it takes whatever the
        // keyboard offers rather than asking for a number pad.
      />
    </div>
  );
}
