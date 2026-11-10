"use client";

import { useId, useState } from "react";
import * as api from "@/lib/api/client";
import { vennLayout, type LessonFigureSpec } from "@/lib/lesson-figure";
import {
  PROBABILITY_VENN,
  vennRegions,
  type VennRegionKey,
} from "@/lib/probability-activities";

// A VENN DIAGRAM A LEARNER CAN ACTUALLY ANSWER WITH.
//
// The static lesson figure is teaching prose with a drawing beside it. This is
// the practice surface: the learner selects regions in a table (the keyboard and
// screen-reader route), sees the same regions shaded in the SVG, and submits the
// selection to the server. The table is not a fallback bolted on afterwards —
// it is the control, and the drawing is the model that updates with it.
//
// The two tasks use the same diagram: the union selection, then the complement
// as a probability. Both are marked from lib/probability-activities; neither
// sends an expected answer from the browser.

const CONCEPT = "probability-basics";

const VENN_FIGURE: Extract<LessonFigureSpec, { kind: "venn" }> = {
  kind: "venn",
  labelA: PROBABILITY_VENN.labels[0] ?? "Football",
  labelB: PROBABILITY_VENN.labels[1] ?? "Tennis",
  onlyA: PROBABILITY_VENN.counts.onlyA ?? 0,
  onlyB: PROBABILITY_VENN.counts.onlyB ?? 0,
  both: PROBABILITY_VENN.counts.both ?? 0,
  neither: PROBABILITY_VENN.counts.neither ?? 0,
};

type Verdict = api.ProbabilityActivityResult | null;

export function ProbabilityVennActivity({ learnerId }: { learnerId: string | null }) {
  const uid = useId().replace(/:/g, "");
  const layout = vennLayout(VENN_FIGURE);
  const regions = vennRegions(PROBABILITY_VENN);
  const [selected, setSelected] = useState<VennRegionKey[]>([]);
  const [unionVerdict, setUnionVerdict] = useState<Verdict>(null);
  const [value, setValue] = useState("");
  const [valueVerdict, setValueVerdict] = useState<Verdict>(null);
  const [busy, setBusy] = useState<"union" | "value" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const a = layout.circles[0];
  const b = layout.circles[1];
  const mask = (key: string) => `${uid}-${key}`;
  const selectedLabels = regions.filter((region) => selected.includes(region.key)).map((region) => region.label);
  const total = layout.total;

  function toggle(key: VennRegionKey): void {
    setUnionVerdict(null);
    setSelected((current) => current.includes(key)
      ? current.filter((value) => value !== key)
      : [...current, key]);
  }

  async function checkUnion(): Promise<void> {
    if (!learnerId || selected.length === 0) return;
    setBusy("union");
    setError(null);
    try {
      const result = await api.probabilityActivity({
        id: learnerId,
        conceptId: CONCEPT,
        activityId: "venn-union",
        response: selected,
      });
      setUnionVerdict(result);
    } catch {
      setError("The selection could not be marked just now. Your choices are still above; check them against the table.");
    } finally {
      setBusy(null);
    }
  }

  async function checkValue(): Promise<void> {
    if (!learnerId || value.trim() === "") return;
    setBusy("value");
    setError(null);
    try {
      const result = await api.probabilityActivity({
        id: learnerId,
        conceptId: CONCEPT,
        activityId: "venn-neither",
        response: value,
      });
      setValueVerdict(result);
    } catch {
      setError("That probability could not be marked just now. Your answer is still above.");
    } finally {
      setBusy(null);
    }
  }

  if (!a || !b) return null;

  return (
    <section className="card" data-probability-venn aria-label="Interactive Venn diagram" style={{ marginBottom: 18 }}>
      <p className="eyebrow" style={{ margin: 0 }}>Represent it</p>
      <h3 className="reading" style={{ margin: "6px 0 0" }}>Football, tennis, or both?</h3>
      <p className="reading lesson-text" style={{ marginTop: 8 }}>
        Thirty learners were asked which sport they like. The diagram counts the four regions:
        Football only, Tennis only, both, and neither. A learner is chosen at random.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "start", marginTop: 12 }}>
        <figure style={{ margin: 0 }}>
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            role="img"
            aria-label={`Venn diagram of Football and Tennis. Football only ${layout.onlyA}; Tennis only ${layout.onlyB}; both ${layout.both}; neither ${layout.neither}. ${selected.length ? `Selected: ${selectedLabels.join(", ")}.` : "No regions selected."}`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <defs>
              <mask id={mask("onlyA")} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.width} height={layout.height}>
                <rect width={layout.width} height={layout.height} fill="black" />
                <circle cx={a.cx} cy={a.cy} r={a.r} fill="white" />
                <circle cx={b.cx} cy={b.cy} r={b.r} fill="black" />
              </mask>
              <mask id={mask("onlyB")} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.width} height={layout.height}>
                <rect width={layout.width} height={layout.height} fill="black" />
                <circle cx={b.cx} cy={b.cy} r={b.r} fill="white" />
                <circle cx={a.cx} cy={a.cy} r={a.r} fill="black" />
              </mask>
              <mask id={mask("both")} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.width} height={layout.height}>
                <rect width={layout.width} height={layout.height} fill="black" />
                <circle cx={a.cx} cy={a.cy} r={a.r} fill="white" />
                <circle cx={b.cx} cy={b.cy} r={b.r} fill="white" />
              </mask>
              <mask id={mask("neither")} maskUnits="userSpaceOnUse" x={0} y={0} width={layout.width} height={layout.height}>
                <rect width={layout.width} height={layout.height} fill="white" />
                <circle cx={a.cx} cy={a.cy} r={a.r} fill="black" />
                <circle cx={b.cx} cy={b.cy} r={b.r} fill="black" />
              </mask>
            </defs>

            {selected.includes("neither") && (
              <rect width={layout.width} height={layout.height} fill="var(--accent)" opacity={0.18} mask={`url(#${mask("neither")})`} />
            )}
            {selected.includes("onlyA") && (
              <circle cx={a.cx} cy={a.cy} r={a.r} fill="var(--accent)" opacity={0.34} mask={`url(#${mask("onlyA")})`} />
            )}
            {selected.includes("onlyB") && (
              <circle cx={b.cx} cy={b.cy} r={b.r} fill="var(--accent)" opacity={0.34} mask={`url(#${mask("onlyB")})`} />
            )}
            {selected.includes("both") && (
              <circle cx={a.cx} cy={a.cy} r={a.r} fill="var(--accent)" opacity={0.34} mask={`url(#${mask("both")})`} />
            )}

            <circle cx={a.cx} cy={a.cy} r={a.r} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
            <circle cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
            <text x={a.labelX} y={a.labelY} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{a.label}</text>
            <text x={b.labelX} y={b.labelY} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{b.label}</text>
            {layout.regions.map((region) => (
              <text
                key={region.key}
                x={region.x}
                y={region.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={16}
                fontWeight={700}
                fill="var(--text)"
              >
                {region.count}
              </text>
            ))}
            <text x={layout.width - 8} y={layout.height - 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">
              neither = outside both circles
            </text>
          </svg>
          <figcaption className="reading small muted" style={{ marginTop: 6 }}>
            The number in each region is a count of learners, not a probability. The whole diagram
            totals {total}.
          </figcaption>
        </figure>

        <div>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="reading" style={{ fontWeight: 600 }}>
              Select every region in Football or Tennis (the union).
            </legend>
            <p className="reading small muted" style={{ marginTop: 4 }}>
              Use the checkboxes. The drawing shades each region you select.
            </p>
            <table className="reading small" style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <caption className="small muted" style={{ textAlign: "left", marginBottom: 4 }}>
                Region counts; the checkbox is the keyboard-accessible control.
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={{ textAlign: "left", padding: "4px 6px" }}>Region</th>
                  <th scope="col" style={{ textAlign: "right", padding: "4px 6px" }}>Count</th>
                  <th scope="col" style={{ textAlign: "left", padding: "4px 6px" }}>Select</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.key}>
                    <th scope="row" style={{ textAlign: "left", fontWeight: 400, padding: "4px 6px" }}>{region.label}</th>
                    <td style={{ textAlign: "right", padding: "4px 6px" }}>{region.count}</td>
                    <td style={{ padding: "4px 6px" }}>
                      <label>
                        <input
                          type="checkbox"
                          data-venn-region={region.key}
                          checked={selected.includes(region.key)}
                          onChange={() => toggle(region.key)}
                        />{" "}
                        <span className="small">{selected.includes(region.key) ? "selected" : "select"}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </fieldset>

          <button
            type="button"
            className="btn"
            data-venn-union-submit
            onClick={() => void checkUnion()}
            disabled={!learnerId || selected.length === 0 || busy !== null}
            style={{ marginTop: 10 }}
          >
            {busy === "union" ? "Checking…" : "Check the regions"}
          </button>
          {!learnerId && (
            <p className="reading small muted" style={{ marginTop: 6 }}>
              Sign in to have this marked and recorded. You can still select regions and compare
              them with the counts.
            </p>
          )}
          {unionVerdict && (
            <div
              className={`note ${unionVerdict.correct ? "yes" : "no"}`}
              role="status"
              aria-live="polite"
              data-venn-union-verdict
              style={{ marginTop: 10 }}
            >
              <strong>{unionVerdict.correct ? "Correct" : "Not yet"}</strong>
              <p className="reading small" style={{ marginTop: 4 }}>{unionVerdict.feedback}</p>
              {!unionVerdict.correct && (
                <p className="reading small muted" style={{ marginTop: 4 }}>
                  Model: {unionVerdict.modelAnswer}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: "1px solid var(--line)", marginTop: 16, paddingTop: 12 }}>
        <label className="reading" htmlFor={`${uid}-neither`} style={{ fontWeight: 600 }}>
          What is the probability that a learner chosen at random likes neither sport?
        </label>
        <p className="reading small muted" style={{ marginTop: 4 }}>
          Enter a fraction, decimal or percentage. 6/30, 1/5, 0.2 and 20% are the same answer.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
          <input
            id={`${uid}-neither`}
            className="input"
            data-venn-neither
            value={value}
            onChange={(event) => { setValue(event.target.value); setValueVerdict(null); }}
            onKeyDown={(event) => { if (event.key === "Enter") void checkValue(); }}
            disabled={!learnerId || busy !== null}
            placeholder="e.g. 1/5, 0.2 or 20%"
            style={{ flex: "1 1 220px" }}
          />
          <button
            type="button"
            className="btn"
            data-venn-value-submit
            onClick={() => void checkValue()}
            disabled={!learnerId || value.trim() === "" || busy !== null}
          >
            {busy === "value" ? "Checking…" : "Check the probability"}
          </button>
        </div>
        {valueVerdict && (
          <div
            className={`note ${valueVerdict.correct ? "yes" : "no"}`}
            role="status"
            aria-live="polite"
            data-venn-value-verdict
            style={{ marginTop: 10 }}
          >
            <strong>{valueVerdict.correct ? "Correct" : "Not yet"}</strong>
            <p className="reading small" style={{ marginTop: 4 }}>{valueVerdict.feedback}</p>
            <p className="reading small muted" style={{ marginTop: 4 }}>
              Model answer: {valueVerdict.modelAnswer}
            </p>
          </div>
        )}
      </div>

      {error && <p className="reading small" role="status" style={{ marginTop: 10 }}>{error}</p>}
    </section>
  );
}
