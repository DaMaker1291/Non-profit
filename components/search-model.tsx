"use client";

// TWO SEARCHES, COUNTED RATHER THAN DESCRIBED.
//
// "Binary search is faster" is a sentence a learner can repeat without being able
// to say what it costs or when it fails. Here both algorithms run on the SAME list,
// the learner steps them one look at a time, and the number of looks is the
// evidence. Three things the model insists on:
//
//   1. THE PRECONDITION IS EXPERIENCED. Shuffle the list and binary search refuses
//      to run, with the reason — not "0 comparisons" pretending success.
//   2. THE CONCLUSION IS "IT DEPENDS". A target near the front is found in one look
//      by linear search, which is fewer than binary needs.
//   3. LIVE PROGRESS IS NOT THE RESULT. The totals appear only when the longer run
//      ends; before that the learner is counting.
//
// WHAT THE OAK LINEAR-SEARCH SEGMENT ADDED, watched at 04:40–06:45 of their lesson
// (recorded as `video-segment` in `lib/learning-research.ts`): the instruction list
// stays on screen for the whole run with the executing step emphasised, the item
// under the cursor is marked, and no comparison count is displayed. The technique is
// copied, not the lesson — the wording, the cells and the counts are OpenMind's
// (OGL v3.0, reference-only).
//
// ONE FACT, ONE PLACE. The step's own note says which item is under the cursor, the
// dashed box draws it, and the finished line carries the totals; an extra sentence
// repeating the same state in a fourth wording was removed rather than restyled.

import { useId, useState } from "react";
import {
  BINARY_STEPS,
  LINEAR_STEPS,
  runBinarySearch,
  runLinearSearch,
  SEARCH_LIST,
  searchGuidance,
  type SearchStepState,
} from "@/lib/pilot-models";

/** The same values, deliberately out of order, so the precondition can be tested
 *  without generating randomness the suite cannot reproduce. */
const SHUFFLED: readonly number[] = [31, 3, 72, 12, 99, 8, 55, 19, 91, 24, 68, 40, 80, 47];

/** One algorithm's instruction list, with the executing step emphasised in place.
 *  `aria-current="step"` is the machine-readable version of the emphasis, so a
 *  screen-reader user hears which instruction is running rather than only seeing
 *  which one is bold. */
function InstructionList({
  algorithm,
  label,
  steps,
  state,
}: {
  algorithm: "linear" | "binary";
  label: string;
  steps: readonly { readonly n: number; readonly text: string }[];
  state: SearchStepState;
}) {
  return (
    <div className="sm-inst-block" data-search-instructions={algorithm}>
      <p className="cm-label" style={{ margin: 0 }}>
        {label}
      </p>
      <ol className="sm-inst">
        {steps.map((step) => {
          const current = state.current === step.n;
          const done = state.done.includes(step.n);
          return (
            <li
              key={step.n}
              data-step={step.n}
              data-current={current ? "yes" : "no"}
              data-done={done ? "yes" : "no"}
              aria-current={current ? "step" : undefined}
            >
              <span className="sm-inst-n" aria-hidden="true">
                {done ? "✓" : step.n}
              </span>
              <span>{step.text}</span>
            </li>
          );
        })}
      </ol>
      <p className="small muted sm-inst-note" data-search-step-note={algorithm}>
        {state.note}
      </p>
    </div>
  );
}

export function SearchModel() {
  const [ordered, setOrdered] = useState(true);
  const [target, setTarget] = useState(55);
  const [taken, setTaken] = useState(0);
  const id = useId();
  const list = ordered ? SEARCH_LIST : SHUFFLED;
  const linear = runLinearSearch(list, target);
  const binary = runBinarySearch(list, target);
  // ONE CALL, ONE STATE: the instructions, the cursors and the counts all come from
  // this object, so the highlighted step and the drawing cannot disagree.
  const guidance = searchGuidance(list, target, taken);
  const { progress, linearFocus, binaryFocus } = guidance;

  // TWO DIFFERENT BINARY FACTS, DRAWN DIFFERENTLY: the middle it has already
  // compared, and the window the next comparison will take.
  const lastCheckedIndex = progress.binaryShown > 0 ? binary.windows[progress.binaryShown - 1].mid : -1;
  const binaryWindow =
    binary.preconditionMet && progress.binaryShown < binary.comparisons ? binary.windows[progress.binaryShown] : null;
  const linearDone = progress.linearShown >= linear.comparisons;
  const binaryDone = binary.preconditionMet && progress.binaryShown >= binary.comparisons;
  const linearFocusIndex = linearFocus ? linearFocus.position - 1 : -1;
  const binaryFocusIndex = binaryFocus ? binaryFocus.position - 1 : -1;

  const step = () => setTaken((n) => n + 1);
  const reset = () => setTaken(0);

  // WHAT THE PICTURE'S ALT TEXT IS FOR. It used to carry the running count, which is
  // a live region's job (and was then announced twice); it now describes the drawing
  // and stays still while the learner steps.
  const diagramLabel = `Two rows of the same ${list.length} numbers${ordered ? ", in order" : ", shuffled"}. The top row is checked one item at a time, the bottom row is halved. The dashed box marks the item the next look takes.${
    ordered ? "" : " Halving cannot start on a list that is not in order."
  }`;

  // THE OUTCOME, ONLY ONCE THERE IS ONE. While a search is running the step note
  // already names the item under the cursor; these lines exist for the result.
  const linearOutcome = !linearDone
    ? null
    : linear.found
      ? `checked one at a time: found ${target} at position ${linear.index + 1}, after ${linear.comparisons} look${linear.comparisons === 1 ? "" : "s"}`
      : `checked one at a time: all ${list.length} compared and ${target} is not in the list`;
  const binaryOutcome = !binary.preconditionMet
    ? "halving: cannot start — the list is not in order"
    : !binaryDone
      ? null
      : binary.found
        ? `halving: found ${target} at position ${binary.index + 1}, after ${binary.comparisons} look${binary.comparisons === 1 ? "" : "s"}`
        : `halving: halved until the window closed and ${target} is not in the list`;

  return (
    <section
      className="model-card search-model"
      aria-labelledby={`${id}-h`}
      data-search-model
      data-search-ordered={ordered ? "yes" : "no"}
      data-search-target={target}
      data-search-taken={progress.taken}
    >
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Two searches, same list
      </h3>

      {/* STEP 1 — the number. A native select rather than fourteen buttons: the
          targets are one choice, and they were the reason the card wrapped into
          four rows of controls above the drawing. */}
      <div className="sm-step" data-search-step="target">
        <p className="sm-step-label">
          <span className="sm-step-n" aria-hidden="true">1</span> Choose a number to find
        </p>
        <div className="sm-target-row">
          <label className="sm-select-label">
            <span className="visually-hidden">Number to find</span>
            <select
              className="sm-select"
              value={target}
              onChange={(e) => {
                setTarget(Number(e.target.value));
                setTaken(0);
              }}
            >
              {SEARCH_LIST.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn small"
            aria-pressed={!ordered}
            onClick={() => {
              setOrdered((v) => !v);
              setTaken(0);
            }}
          >
            {ordered ? "Shuffle the list" : "Put the list in order"}
          </button>
        </div>
      </div>

      {/* STEP 2 — both algorithms, on that number, with their instruction sequences
          beside them. Read-only: the picture is the question, not a control. */}
      <div className="sm-step" data-search-step="view">
        <p className="sm-step-label">
          <span className="sm-step-n" aria-hidden="true">2</span> Both algorithms on {target}
        </p>
        {/* FOURTEEN NUMBERS IN ONE ROW CANNOT SHRINK TO A PHONE. The row keeps its own
            width and the WRAPPER scrolls, so the page still has no sideways scroll
            and the numbers stay legible. */}
        <div
          className="sm-scroll"
          role="group"
          tabIndex={0}
          aria-label="Search diagram: scroll sideways to see the whole list"
        >
          <svg viewBox="0 0 340 132" role="img" aria-label={diagramLabel}>
            <text x={8} y={12} className="cm-label">
              checking one at a time
            </text>
            {list.map((value, i) => {
              const looked = i < progress.linearShown && i <= linear.index;
              const found = linear.found && i === linear.index && linearDone;
              const current = i === linearFocusIndex && progress.taken > 0;
              return (
                <g key={`lin-${i}`}>
                  <rect x={8 + i * 23} y={18} width={20} height={20} rx={3} className={found ? "sm-cell sm-cell-found" : looked ? "sm-cell sm-cell-looked" : "sm-cell"} />
                  {current && <rect x={5 + i * 23} y={15} width={26} height={26} rx={5} className="sm-current" />}
                  <text x={18 + i * 23} y={32} textAnchor="middle" className="sm-digit">
                    {value}
                  </text>
                </g>
              );
            })}

            <text x={8} y={66} className="cm-label">
              halving the list{binary.preconditionMet ? "" : " — needs an ordered list"}
            </text>
            {list.map((value, i) => {
              const inWindow = binaryWindow ? i >= binaryWindow.low && i <= binaryWindow.high : false;
              const checked = i === lastCheckedIndex;
              const found = binary.found && i === binary.index && binaryDone;
              const current = i === binaryFocusIndex && progress.taken > 0;
              return (
                <g key={`bin-${i}`}>
                  <rect
                    x={8 + i * 23}
                    y={72}
                    width={20}
                    height={20}
                    rx={3}
                    className={found ? "sm-cell sm-cell-found" : checked ? "sm-cell sm-cell-mid" : inWindow ? "sm-cell sm-cell-window" : "sm-cell"}
                  />
                  {current && <rect x={5 + i * 23} y={69} width={26} height={26} rx={5} className="sm-current" />}
                  <text x={18 + i * 23} y={86} textAnchor="middle" className="sm-digit">
                    {value}
                  </text>
                </g>
              );
            })}
            <text x={8} y={116} className="cm-label">
              filled = the middle it last checked · pale = still possible · dashed = next to compare
            </text>
          </svg>
        </div>

        <div className="sm-inst-pair">
          <InstructionList
            algorithm="linear"
            label="checking one at a time"
            steps={LINEAR_STEPS}
            state={guidance.linear}
          />
          <InstructionList
            algorithm="binary"
            label="halving the list"
            steps={BINARY_STEPS}
            state={guidance.binary}
          />
        </div>

        {(linearOutcome || binaryOutcome) && (
          <ul className="sm-states small">
            {linearOutcome && <li data-search-linear-state>{linearOutcome}</li>}
            {binaryOutcome && <li data-search-binary-state>{binaryOutcome}</li>}
          </ul>
        )}
      </div>

      {/* STEP 3 — stepping, with the count the LEARNER has taken. The completed
          comparison is NOT here until it is complete. */}
      <div className="sm-step" data-search-step="step">
        <p className="sm-step-label">
          <span className="sm-step-n" aria-hidden="true">3</span> Step through both, counting as you go
        </p>
        <div className="cm-controls" role="group" aria-label="Step the searches">
          <button type="button" className="btn small" onClick={step} disabled={progress.finished}>
            Take one look
          </button>
          <button type="button" className="btn small" onClick={reset} disabled={progress.taken === 0}>
            Start again
          </button>
        </div>
        <p className="small" aria-live="polite" data-search-live>
          {progress.liveSentence}
        </p>
        {progress.finalSentence && (
          <p className="small sm-final" aria-live="polite" data-search-final>
            {progress.finalSentence}
          </p>
        )}
      </div>
    </section>
  );
}
