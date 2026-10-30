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

/** Open/closed is a PREFERENCE, not per-question state, and it lives outside
 *  the component on purpose. A learner who works every answer out on paper had
 *  to open the sheet again on every question — a click per item, for a decision
 *  they had already made. Once they open it, the next question opens with it;
 *  closing it closes it for the next one too. Per-tab and in memory only, like
 *  the text itself.
 *
 *  COLLAPSED IS THE DEFAULT because most items are answered in one line of
 *  arithmetic and a five-row empty box above four options is the largest thing
 *  on the screen while being the least used. It is not hidden: the label is a
 *  button with `aria-expanded`, so a keyboard or screen-reader learner meets the
 *  control, not a missing feature. */
let preferredOpen = false;

export default function WorkSheet({ questionId, label, placeholder, note, hideLabel }: WorkSheetProps & { hideLabel?: string }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(preferredOpen);
  const toggle = () => {
    const next = !open;
    preferredOpen = next;
    setOpen(next);
  };
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
    <div className="work-sheet" data-open={open ? "true" : "false"}>
      <div className="work-sheet-head">
        {open ? (
          <label className="work-sheet-label" htmlFor={inputId}>{label}</label>
        ) : (
          <button
            type="button"
            className="work-sheet-toggle"
            aria-expanded="false"
            aria-controls={inputId}
            onClick={toggle}
          >
            <span className="work-sheet-plus" aria-hidden="true">+</span>
            {label}
          </button>
        )}
        {/* The disclosure, not decoration: it is the whole reason this field can
            exist without a privacy question attached to it. Shown whenever the
            paper is open, and on the collapsed row as well — it is the sentence
            that answers "who sees this?", and a learner deciding whether to open
            the sheet is exactly who needs it. */}
        <span className="work-sheet-note small muted">{note}</span>
        {open && hideLabel && (
          <button type="button" className="work-sheet-hide small" onClick={toggle}>
            {hideLabel}
          </button>
        )}
      </div>
      {open && (
        <textarea
          id={inputId}
          className="work-paper"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={5}
          spellCheck={false}
          autoComplete="off"
          // A learner who opens this and starts writing keeps it open: the
          // preference is set on the toggle, and this only ever closes by an
          // explicit press.
          autoFocus
          // Deliberately NOT disabled once the answer is marked: a learner reading
          // the feedback is often still working, and paper does not lock itself.
          // No inputMode either — this is scratch paper, so it takes whatever the
          // keyboard offers rather than asking for a number pad.
        />
      )}
    </div>
  );
}
