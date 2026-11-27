"use client";

// A CELL YOU CAN BREAK — structure taught as the job it does.
//
// A labelled cell diagram tests the label. Here each part is switched off and the
// model says what stops happening, because "the mitochondrion releases energy from
// glucose" is only known when the learner can say what a cell without one cannot
// do. Switching the cell type swaps the whole organelle set: a plant cell is not an
// animal cell with extras, and learners add animal-only parts to plant cells as well
// as the reverse (ERIC EJ1426889).
//
// THE MODEL'S OWN GAP IS PRINTED BESIDE IT: not every plant cell has chloroplasts
// (root cells do not). A model that hides the case it cannot represent teaches the
// learner to trust it too far.

import { useId, useState } from "react";
import { ORGANELLES, organellesFor, readCell, type CellType } from "@/lib/pilot-models";

export function CellModel() {
  const [type, setType] = useState<CellType>("plant");
  const [off, setOff] = useState<readonly string[]>([]);
  const id = useId();
  const available = organellesFor(type);
  const present = available.filter((o) => !off.includes(o.id)).map((o) => o.id);
  const reading = readCell(type, present);
  const has = (organelleId: string) => present.includes(organelleId);

  const toggle = (organelleId: string) => () =>
    setOff((current) =>
      current.includes(organelleId) ? current.filter((x) => x !== organelleId) : [...current, organelleId],
    );

  const switchType = (next: CellType) => () => {
    setType(next);
    // A part that does not exist in the new cell type cannot be "broken" in it.
    setOff((current) => current.filter((organelleId) => organellesFor(next).some((o) => o.id === organelleId)));
  };

  return (
    <section className="model-card cell-model" aria-labelledby={`${id}-h`} data-cell-model data-cell-type={type} data-cell-broken={reading.broken.length}>
      <h3 id={`${id}-h`} className="small" style={{ margin: 0 }}>
        Take a cell apart
      </h3>

      <svg viewBox="0 0 340 170" role="img" aria-label={reading.sentence}>
        {/* The wall only exists on a plant cell; the membrane is the inner line. */}
        {type === "plant" && <rect x={16} y={16} width={308} height={138} rx={16} className="clm-wall" />}
        <rect x={24} y={24} width={292} height={122} rx={14} className="clm-membrane" />
        {/* A large permanent vacuole: plant cells only. */}
        {type === "plant" && has("vacuole") && <ellipse cx={232} cy={85} rx={54} ry={38} className="clm-part" />}
        {/* Nucleus. */}
        <circle cx={92} cy={72} r={24} className="clm-part" />
        {has("nucleus") && <circle cx={92} cy={72} r={10} className="clm-nucleolus" />}
        {/* Mitochondria: capsules with an inner fold. */}
        {Array.from({ length: has("mitochondria") ? 3 : 0 }, (_, i) => (
          <g key={i}>
            <ellipse cx={78 + i * 34} cy={128} rx={13} ry={8} className="clm-part" />
            <path d={`M${71 + i * 34} 128 q6 -6 12 0 q6 6 12 0`} className="clm-fold" />
          </g>
        ))}
        {/* Chloroplasts: plant cells only. */}
        {type === "plant" &&
          Array.from({ length: has("chloroplast") ? 2 : 0 }, (_, i) => (
            <ellipse key={i} cx={150 + i * 40} cy={54} rx={15} ry={9} className="clm-chloroplast" />
          ))}
        {/* Ribosomes: small dots, everywhere. */}
        {has("ribosomes") &&
          Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={128 + (i % 3) * 16} cy={104 + Math.floor(i / 3) * 12} r={2.2} className="clm-ribosome" />
          ))}
        <text x={30} y={160} className="cm-label">
          {type === "plant" ? "plant cell" : "animal cell"}
        </text>
      </svg>

      <p className="small" aria-live="polite" style={{ margin: 0 }} data-cell-readout>
        {reading.sentence}
      </p>

      {/* The root-hair limitation is in `lib/model-assumptions.ts#cell-model` and is
          printed by the model shell, once. */}

      <div className="cm-controls" role="group" aria-label="Choose the cell">
        <button type="button" className={`btn small${type === "plant" ? " is-on" : ""}`} aria-pressed={type === "plant"} onClick={switchType("plant")}>
          Plant cell
        </button>
        <button type="button" className={`btn small${type === "animal" ? " is-on" : ""}`} aria-pressed={type === "animal"} onClick={switchType("animal")}>
          Animal cell
        </button>
      </div>

      <div className="cm-controls" role="group" aria-label="Switch a part off">
        {available.map((organelle) => (
          <button
            key={organelle.id}
            type="button"
            className={`btn small${off.includes(organelle.id) ? " is-on" : ""}`}
            aria-pressed={off.includes(organelle.id)}
            onClick={toggle(organelle.id)}
            title={organelle.job}
          >
            {off.includes(organelle.id) ? `Restore the ${organelle.name}` : `Break the ${organelle.name}`}
          </button>
        ))}
      </div>

      <p className="small muted" style={{ margin: 0 }}>
        Try this: break the chloroplast, then break the mitochondrion. One stops the
        cell MAKING glucose; the other stops it RELEASING energy from glucose. A
        plant needs both, day and night — which is why it has both.
      </p>
    </section>
  );
}

/** The organelle list, for the teacher page and the gates: every part the model
 *  can draw, with the job it exists for. */
export const CELL_MODEL_PARTS = ORGANELLES.map((o) => ({ id: o.id, job: o.job }));
