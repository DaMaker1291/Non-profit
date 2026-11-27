"use client";

// AN ATOM THE LEARNER BUILDS — and the one thing that decides what it is.
//
// The lesson can say "the number of protons decides which element an atom is" and
// a learner will nod, then change the neutrons and expect the name to change. Here
// the sentence is re-printed after every control: the name comes from the protons,
// the mass number moves with the neutrons, the charge moves with the electrons, and
// zero protons produces "there is no element to name" rather than a wrong symbol.
//
// The drawing is a shell diagram, which is a MODEL and not a photograph: electrons
// do not orbit on neat circles. That is said in the text, not left for a teacher.
//
// No images, no animation, no external assets: a few kilobytes of SVG, native
// buttons for keyboard and switch access, and an aria-live sentence so the picture
// is never the only carrier of the answer.

import { useId, useState } from "react";
import { ATOM_LIMITS, readAtom, type AtomState } from "@/lib/pilot-models";

const START: AtomState = { protons: 6, neutrons: 6, electrons: 6 };
const NUCLEON_PIPS = 10;

export function AtomModel() {
  const [state, setState] = useState<AtomState>(START);
  const id = useId();
  const reading = readAtom(state);

  const bump = (key: keyof AtomState, by: number) => () =>
    setState((s) => ({ ...s, [key]: s[key] + by }));

  // Nucleons drawn as pips in the nucleus: protons filled, neutrons soft. Capped,
  // because 40 pips at this scale would be a smudge — the COUNT is in the text.
  const pips: ("p" | "n")[] = [];
  for (let i = 0; i < Math.min(state.protons, NUCLEON_PIPS); i += 1) pips.push("p");
  for (let i = 0; i < Math.min(state.neutrons, NUCLEON_PIPS); i += 1) pips.push("n");

  const electrons = Math.min(state.electrons, 20);

  return (
    <section className="model-card atom-model" aria-labelledby={`${id}-h`} data-atom-model data-atom-element={reading.symbol ?? "none"} data-atom-charge={reading.charge}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Build an atom
      </h3>

      <svg viewBox="0 0 340 170" role="img" aria-label={reading.sentence}>
        <circle cx={170} cy={85} r={66} className="am-shell" />
        <circle cx={170} cy={85} r={44} className="am-shell" />
        {Array.from({ length: electrons }, (_, i) => {
          const shell = i < 8 ? 44 : 66;
          const inShell = i < 8 ? i : i - 8;
          const count = i < 8 ? Math.min(8, electrons) : electrons - 8;
          const angle = (inShell / Math.max(1, count)) * Math.PI * 2 - Math.PI / 2;
          return (
            <circle
              key={i}
              cx={170 + Math.cos(angle) * shell}
              cy={85 + Math.sin(angle) * shell}
              r={3}
              className="am-electron"
            />
          );
        })}
        {pips.slice(0, 14).map((kind, i) => {
          const ring = i < 6 ? 9 : 17;
          const inRing = i < 6 ? i : i - 6;
          const count = i < 6 ? Math.min(6, pips.length) : Math.min(8, pips.length - 6);
          const angle = (inRing / Math.max(1, count)) * Math.PI * 2;
          return (
            <circle
              key={`${kind}-${i}`}
              cx={170 + Math.cos(angle) * ring}
              cy={85 + Math.sin(angle) * ring}
              r={3.2}
              className={kind === "p" ? "am-proton" : "am-neutron"}
            />
          );
        })}
        <text x={314} y={30} textAnchor="end" className="cm-label">
          {reading.symbol ?? "—"}
        </text>
        <text x={314} y={48} textAnchor="end" className="cm-label">
          mass {reading.massNumber}
        </text>
        <text x={314} y={66} textAnchor="end" className="cm-label">
          charge {reading.charge > 0 ? `+${reading.charge}` : reading.charge}
        </text>
      </svg>

      <p className="small" aria-live="polite" style={{ margin: 0 }} data-atom-readout>
        {reading.sentence}
      </p>

      {/* THE LIMITS ARE STATED ONCE, by the model shell, from
          `lib/model-assumptions.ts` — the register a subject teacher is asked to
          correct. They used to be repeated here in a paragraph of their own, which
          put three screens of caveat under every model and let the copy in this
          file drift from the register. */}
      <div className="cm-controls" role="group" aria-label="Change the atom">
        <button type="button" className="btn small" onClick={bump("protons", 1)} disabled={state.protons >= ATOM_LIMITS.protons}>
          Add a proton
        </button>
        <button type="button" className="btn small" onClick={bump("protons", -1)} disabled={state.protons <= 0}>
          Remove a proton
        </button>
        <button type="button" className="btn small" onClick={bump("neutrons", 1)} disabled={state.neutrons >= ATOM_LIMITS.neutrons}>
          Add a neutron
        </button>
        <button type="button" className="btn small" onClick={bump("neutrons", -1)} disabled={state.neutrons <= 0}>
          Remove a neutron
        </button>
        <button type="button" className="btn small" onClick={bump("electrons", 1)} disabled={state.electrons >= ATOM_LIMITS.electrons}>
          Add an electron
        </button>
        <button type="button" className="btn small" onClick={bump("electrons", -1)} disabled={state.electrons <= 0}>
          Remove an electron
        </button>
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: change the neutrons only, and watch the name stay the same while
        the mass number moves. Then change the protons, and watch the name change.
        That is the whole rule — everything else about an atom is a variation on the
        proton count.
      </p>
    </section>
  );
}
