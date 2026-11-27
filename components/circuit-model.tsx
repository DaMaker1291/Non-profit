"use client";

// A CIRCUIT YOU CAN CHANGE — and the thing it exists to disprove.
//
// The lesson's prose can say "the current is the same everywhere in one loop", and
// a learner who believes current is used up will read that sentence and keep their
// belief. Here the model reports the current at TWO points in the same loop, so the
// claim is an observation rather than an assertion. Add a bulb and both readings
// fall together; open the switch and both go to zero; the bulb's own brightness
// follows the same number.
//
// Deliberately small, and deliberately not a game: no score, no animation, no
// record. It is a model of the idea and the practice that follows is where
// evidence comes from (`lib/interactive-models.ts` holds every rule; this file
// holds only the drawing and the controls).
//
// ACCESSIBILITY AND LOW BANDWIDTH, by construction: no images, no SVG filters, no
// external assets, no animation. Every control is a native button (so keyboard and
// switch access work without a key handler), the readout is an `aria-live` text
// region, and the state is also printed as a sentence so the picture is never the
// only carrier of the answer. The whole component is a few kilobytes of JSX.

import { useId, useState } from "react";
import {
  applyCircuitControl,
  CELL_VOLTS,
  CIRCUIT_LIMIT,
  CURRENT_CONVENTION,
  readCircuit,
  topWireCurrentDirection,
  type CircuitControl,
  type CircuitNote,
  type CircuitState,
} from "@/lib/interactive-models";

const START: CircuitState = { cells: 1, bulbs: 1, closed: true };

function caption(current: number): string {
  return `${current.toFixed(2)} A`;
}

/** What each state means, in one place. This was four nested ternaries in the
 *  markup, which is where a copy error hides. */
const NOTE_SENTENCE: Record<CircuitNote, string> = {
  open: "The switch is open, so the loop is broken: no charge can go round, so there is no current anywhere in it — not even at the cell.",
  "no-cell": "A loop with no cell has nothing pushing the charge round. The wire is not empty; it has simply nothing to make it flow.",
  "no-bulb": "A complete loop with nothing in it pushes charge round with nothing to light.",
  lit: "One path, one current: every charge that leaves the cell comes back to it. The bulb takes energy from the charge, not the charge itself.",
};

export function CircuitModel() {
  const [state, setState] = useState<CircuitState>(START);
  const id = useId();
  const reading = readCircuit(state);
  const lit = reading.note === "lit";
  // One bulb's glow: the model's brightness, capped so the drawing stays legible.
  const glow = Math.min(1, reading.brightness);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
  // THE ALT TEXT DESCRIBES THE DRAWING, and changes with the circuit rather than
  // with every press: the numbers that move are already a live region below.
  const diagramLabel = `${
    lit
      ? `A closed loop with ${plural(state.cells, "cell")} and ${plural(state.bulbs, "bulb")}, current ${caption(reading.currentAmps)}.`
      : `A loop with ${plural(state.cells, "cell")} and ${plural(state.bulbs, "bulb")} that is not lit.`
  } The arrows show conventional current, leaving the positive terminal and returning to the negative.`;
  // THE READOUT IS TWO STRINGS, so the bold prediction and the aside about volts
  // are not two nested ternaries inside the markup.
  const readoutHead = lit
    ? `Model prediction: ${reading.brightness.toFixed(2)}× the brightness of one cell and one bulb, ${caption(reading.currentAmps)}`
    : "Model prediction: nothing is lit";
  const readoutTail = lit
    ? ` — each bulb takes ${reading.voltsPerBulb.toFixed(2)} V (${state.bulbs} × ${reading.voltsPerBulb.toFixed(2)} V = ${(state.cells * CELL_VOLTS).toFixed(2)} V), and the current before the bulb equals the current after it.`
    : "";
  // WHICH WAY THE ARROWS POINT COMES FROM THE TERMINALS, not from this file's own
  // opinion. `topWireCurrentDirection()` follows the loop from the positive plate,
  // so the picture cannot say "conventional current" while pointing the other way.
  const direction = topWireCurrentDirection();
  const arrow = (x: number, key: string) =>
    direction === "right" ? (
      <path key={key} d={`M${x} 39 l9 6 l-9 6 z`} className="cm-arrow" />
    ) : (
      <path key={key} d={`M${x + 9} 39 l-9 6 l9 6 z`} className="cm-arrow" />
    );

  const doControl = (control: CircuitControl) => () =>
    setState((s) => applyCircuitControl(s, control));

  return (
    <section className="circuit-model" aria-labelledby={`${id}-h`} data-circuit-model data-circuit-note={reading.note}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Change the circuit
      </h3>

      {/* THE DRAWING. A loop with the cell on the bottom wire, the bulbs on the top
          wire and the switch on the left, so "one path round" is what the shape
          says. The switch is drawn as a real break in the wire: an open switch has
          to LOOK like a break, or the picture says "closed" while the readout says
          zero. Parts are schematic symbols (a long and a short bar for a cell, a
          ring with a filament for a lamp) rather than illustrations of objects. */}
      <svg
        viewBox="0 0 340 165"
        role="img"
        aria-label={diagramLabel}
      >
        <path className="cm-wire" d="M30 45 H310 V125 H30 V100" />
        <path className="cm-wire" d="M30 70 V45" />

        {/* The switch: two terminals and an arm. Closed, the arm lies on the wire;
            open, it lifts clear and leaves a visible gap — the gap is the point. */}
        <g className="cm-switch">
          <circle cx={30} cy={100} r={3.5} className="cm-terminal" />
          <circle cx={30} cy={70} r={3.5} className="cm-terminal" />
          <line
            x1={30}
            y1={100}
            x2={state.closed ? 30 : 48}
            y2={state.closed ? 70 : 78}
            className="cm-switch-arm"
          />
        </g>

        {/* The cell, on the bottom wire: one long bar, one short bar. */}
        <g className="cm-cell">
          <line x1={152} y1={125} x2={152} y2={104} className="cm-cell-long" />
          <line x1={164} y1={125} x2={164} y2={112} className="cm-cell-short" />
          <text x={176} y={122} className="cm-label">
            {state.cells} × {CELL_VOLTS} V
          </text>
          {/* WHICH PLATE IS WHICH, drawn rather than left to the reader. The long
              bar is the positive terminal; the signs sit under the wire so the
              arrow direction can be checked against them by eye. */}
          <text x={152} y={140} textAnchor="middle" className="cm-terminal-sign">
            +
          </text>
          <text x={164} y={140} textAnchor="middle" className="cm-terminal-sign">
            −
          </text>
        </g>

        {/* The bulbs, spread along the top wire. */}
        {Array.from({ length: state.bulbs }, (_, i) => {
          const span = 170 / state.bulbs;
          const x = 80 + i * span + span / 2;
          return (
            <g key={i} className="cm-bulb">
              {lit && <circle cx={x} cy={45} r={18} className="cm-glow" style={{ opacity: 0.08 + glow * 0.14 }} />}
              <circle cx={x} cy={45} r={11} className="cm-lamp-face" />
              <path
                d={`M${x - 5} 47 L${x - 2.5} 43 L${x} 47 L${x + 2.5} 43 L${x + 5} 47`}
                className="cm-filament"
              />
              <circle cx={x} cy={45} r={11} className="cm-bulb-ring" />
            </g>
          );
        })}

        {/* TWO readings of the SAME loop — the point of the whole component. */}
        {arrow(46, "before-arrow")}
        <text x={40} y={30} className="cm-label">
          before: {caption(reading.currentAmps)}
        </text>
        {arrow(286, "after-arrow")}
        <text x={300} y={30} textAnchor="end" className="cm-label">
          after: {caption(reading.currentAmps)}
        </text>

        {/* THE CONVENTION IS NAMED ON THE DRAWING, not only in a disclosure below.
            An unlabelled arrow is a claim about physics the learner cannot audit. */}
        {/* MEASURED, NOT EYEBALLED. At y = 96 and 110 these two lines were drawn
            across the cell symbol on a 390 px screen: the second line's box began
            3 px above the cell's top plate and spanned x 87–304 while the plates
            sit at x 152–164. Moved into the empty band between the bulbs (which
            end at y 63) and the cell (which starts at 104), where both lines
            clear every drawn part. */}
        <text x={170} y={80} textAnchor="middle" className="cm-label cm-convention-label">
          arrows: conventional current
        </text>
        <text x={170} y={94} textAnchor="middle" className="cm-label cm-convention-label">
          + terminal → round the loop → − terminal
        </text>
      </svg>

      {/* A PREDICTION, SAID SO. These numbers are what the rules in
          `lib/interactive-models.ts` produce, not measurements taken from a real
          circuit; labelling them "prediction" is the difference between modelling
          and claiming to have observed. */}
      <p className="small" aria-live="polite" style={{ margin: 0 }} data-circuit-readout>
        <b>{readoutHead}</b>
        {readoutTail}
      </p>

      <p className="small muted" style={{ margin: 0 }}>
        {NOTE_SENTENCE[reading.note]}
      </p>

      {/* WHICH CONVENTION, AND WHY THE OTHER ONE IS NOT A CONTRADICTION. This is a
          disclosure rather than a paragraph because the model has to stay short;
          the label on the drawing is the part a learner cannot miss, and this is
          the part a learner who has been told "electrons flow" needs next. */}
      <details className="cm-convention" data-circuit-convention>
        <summary className="small">Which way is the current, exactly?</summary>
        <div className="small muted">
          <p style={{ margin: "8px 0 4px" }}>
            <b>The arrows are conventional current.</b> {CURRENT_CONVENTION.conventional}
          </p>
          <p style={{ margin: "8px 0 4px" }}>
            <b>The electrons drift the other way.</b> {CURRENT_CONVENTION.electrons}
          </p>
          <p style={{ margin: 0 }}>
            <b>Neither is wrong.</b> {CURRENT_CONVENTION.notContradictory}
          </p>
        </div>
      </details>

      {/* THE ASSUMPTIONS ARE PRINTED BY THE SHELL, from the register, once. The
          register is the statement a teacher is asked to correct; a second copy
          here is a copy that can disagree with it. */}

      <div className="cm-controls" role="group" aria-label="Change the circuit">
        <button type="button" className="btn small" onClick={doControl("cell-more")} disabled={state.cells >= CIRCUIT_LIMIT}>
          Add a cell
        </button>
        <button type="button" className="btn small" onClick={doControl("cell-fewer")} disabled={state.cells <= 0}>
          Remove a cell
        </button>
        <button type="button" className="btn small" onClick={doControl("bulb-more")} disabled={state.bulbs >= CIRCUIT_LIMIT}>
          Add a bulb
        </button>
        <button type="button" className="btn small" onClick={doControl("bulb-fewer")} disabled={state.bulbs <= 0}>
          Remove a bulb
        </button>
        <button type="button" className="btn small" onClick={doControl("toggle")} aria-pressed={state.closed}>
          {state.closed ? "Open the switch" : "Close the switch"}
        </button>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: add a bulb and watch BOTH readings fall together. Then add a cell
        and watch them rise. Nothing you can do here makes the two readings differ —
        that is what &ldquo;the current is the same everywhere in one loop&rdquo;
        means.
      </p>
    </section>
  );
}
